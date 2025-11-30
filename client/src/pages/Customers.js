import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CustomerTable from '../components/Customers/CustomerTable';
import FilterBar from '../components/Customers/FilterBar';
import { MdSearch, MdAdd, MdDownload, MdRefresh, MdTrendingUp } from 'react-icons/md';
import api from '../services/api';

const Customers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // Actual search value used in API
  const [searchInput, setSearchInput] = useState(''); // Input field value (doesn't trigger search)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [filters, setFilters] = useState({});
  const [batchUpdating, setBatchUpdating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    customer_id: '',
    name: '',
    email: '',
    phone: '',
    segment: '',
    branch: '',
    product_type: '',
    account_balance: '',
    salary: '',
    digital_user: false
  });

  // Fetch customers from API
  const fetchCustomers = useCallback(async (page = 1, search = '', filterParams = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: itemsPerPage,
        ...filterParams
      };

      if (search) {
        params.search = search;
      }

      const response = await api.getCustomers(params);
      
      if (response.success) {
        setCustomers(response.customers);
        setFilteredCustomers(response.customers);
        setTotalPages(response.pagination.totalPages);
        setTotalCustomers(response.pagination.total);
        setCurrentPage(page);
      } else {
        throw new Error(response.message || 'Failed to fetch customers');
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err.message || 'Failed to load customers');
      // Fallback to empty array on error
      setCustomers([]);
      setFilteredCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  // Initial load - only when filters change, not on searchTerm change
  useEffect(() => {
    fetchCustomers(1, searchTerm, filters);
  }, [fetchCustomers, filters]); // Removed searchTerm from dependencies

  // Refresh customers
  const handleRefresh = () => {
    fetchCustomers(currentPage, searchTerm, filters);
  };

  // Batch update predictions for all customers
  const handleBatchUpdatePredictions = async () => {
    if (!['retentionOfficer', 'retentionAnalyst', 'retentionManager', 'admin'].includes(user?.role)) {
      alert('You do not have permission to update predictions');
      return;
    }

    if (!window.confirm('This will update churn predictions for up to 100 customers using the ML model. This may take a few minutes. Continue?')) {
      return;
    }

    try {
      setBatchUpdating(true);
      const response = await api.batchPredict({ limit: 100 });
      
      // Reset updating state immediately after response is received
      setBatchUpdating(false);
      
      if (response.success) {
        const updatedCount = response.updated || 0;
        const totalCount = response.total || 0;
        
        // Show success message
        alert(`Successfully updated ${updatedCount} out of ${totalCount} customer predictions! The customer list will now refresh to show the updated churn scores.`);
        
        // Automatically refresh the customer list to show updated scores
        // Use a small delay to ensure the alert is dismissed first
        setTimeout(() => {
          fetchCustomers(currentPage, searchTerm, filters);
        }, 100);
      } else {
        throw new Error(response.message || 'Failed to update predictions');
      }
    } catch (err) {
      // Reset updating state on error
      setBatchUpdating(false);
      
      console.error('Error updating predictions:', err);
      let errorMessage = `Failed to update predictions: ${err.message}`;
      if (err.isTimeout) {
        errorMessage += '\n\nThe prediction process timed out. Some predictions may have been updated. Try refreshing the customer list to see updated scores.';
      }
      alert(errorMessage);
    }
  };

  const handleSearch = () => {
    // Only search when button is clicked or Enter is pressed
    setSearchTerm(searchInput);
    setCurrentPage(1);
    fetchCustomers(1, searchInput, filters);
  };

  const handleSearchInputChange = (value) => {
    // Update input field without triggering search
    setSearchInput(value);
  };

  const handleSearchKeyPress = (e) => {
    // Trigger search on Enter key
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    setCurrentPage(1);
    fetchCustomers(1, '', filters);
  };

  const handleFilter = (filterParams) => {
    const newFilters = {
      segment: filterParams.segment || null,
      risk_level: filterParams.riskLevel || null,
      branch: filterParams.branch || null,
      min_churn_score: filterParams.minChurnScore || null,
      max_churn_score: filterParams.maxChurnScore || null,
    };
    setFilters(newFilters);
    setCurrentPage(1);
    fetchCustomers(1, searchTerm, newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {};
    setFilters(clearedFilters);
    setSearchTerm('');
    setSearchInput('');
    setCurrentPage(1);
    fetchCustomers(1, '', clearedFilters);
  };

  const handleSort = (field, direction) => {
    // For now, sorting is handled by the backend (default: churn_score DESC)
    // You can enhance this to send sort parameters to the API
    const sorted = [...filteredCustomers].sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredCustomers(sorted);
  };

  const handlePageChange = (page) => {
    fetchCustomers(page, searchTerm, filters);
  };

  const handleExport = () => {
    if (currentCustomers.length === 0) {
      alert('No customers to export');
      return;
    }

    // Create CSV content
    let csvContent = 'Customer Export\n';
    csvContent += `Generated: ${new Date().toLocaleString()}\n`;
    csvContent += `Total Customers: ${currentCustomers.length}\n\n`;
    
    // CSV Headers
    csvContent += 'Customer ID,Name,Email,Phone,Segment,Branch,Product Type,Churn Score (%),Risk Level,Balance (RWF),Last Updated\n';
    
    // CSV Data
    currentCustomers.forEach(customer => {
      const row = [
        customer.customer_id || customer.id || '',
        `"${(customer.name || '').replace(/"/g, '""')}"`,
        customer.email || '',
        customer.phone || customer.phone_number || '',
        customer.segment || '',
        customer.branch || '',
        customer.product_type || '',
        (parseFloat(customer.churn_score) || 0).toFixed(1),
        customer.risk_level || 'low',
        parseFloat(customer.account_balance || 0).toFixed(2),
        customer.updated_at ? new Date(customer.updated_at).toLocaleDateString() : 'N/A'
      ];
      csvContent += row.join(',') + '\n';
    });

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `customers_export_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleAddCustomer = async () => {
    // Validate required fields
    if (!newCustomer.customer_id || !newCustomer.name || !newCustomer.email) {
      alert('Please fill in all required fields (Customer ID, Name, Email)');
      return;
    }

    try {
      setAddingCustomer(true);
      const customerData = {
        customer_id: newCustomer.customer_id,
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone || null,
        segment: newCustomer.segment || null,
        branch: newCustomer.branch || null,
        product_type: newCustomer.product_type || null,
        account_balance: newCustomer.account_balance ? parseFloat(newCustomer.account_balance) : 0,
        salary: newCustomer.salary ? parseFloat(newCustomer.salary) : null,
        digital_user: newCustomer.digital_user
      };

      const response = await api.createCustomer(customerData);
      
      if (response.success) {
        alert('Customer added successfully!');
        setShowAddModal(false);
        setNewCustomer({
          customer_id: '',
          name: '',
          email: '',
          phone: '',
          segment: '',
          branch: '',
          product_type: '',
          account_balance: '',
          salary: '',
          digital_user: false
        });
        // Refresh customer list
        fetchCustomers(currentPage, searchTerm, filters);
      } else {
        throw new Error(response.message || 'Failed to add customer');
      }
    } catch (err) {
      console.error('Error adding customer:', err);
      alert(err.message || 'Failed to add customer. Please try again.');
    } finally {
      setAddingCustomer(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewCustomer(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Calculate display indices
  const startIndex = totalCustomers > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endIndex = Math.min(currentPage * itemsPerPage, totalCustomers);
  const currentCustomers = filteredCustomers;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (loading && customers.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold mb-1">Customer 360 Profile</h2>
          <p className="text-muted mb-0">
            Deep dive into single customer data. Investigate why a particular customer is at risk before outreach.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-primary"
            onClick={handleRefresh}
            disabled={loading}
          >
            <MdRefresh className={`me-2 ${loading ? 'spinning' : ''}`} />
            Refresh
          </button>
          {['retentionOfficer', 'retentionAnalyst', 'retentionManager', 'admin'].includes(user?.role) && (
            <button 
              className="btn btn-warning"
              onClick={handleBatchUpdatePredictions}
              disabled={batchUpdating || loading}
              title="Update churn predictions for up to 100 customers using ML model. This may take a few minutes."
            >
              <MdTrendingUp className={`me-2 ${batchUpdating ? 'spinning' : ''}`} />
              {batchUpdating ? 'Updating Predictions...' : 'Update Predictions'}
            </button>
          )}
          <button 
            className="btn btn-outline-primary"
            onClick={handleExport}
          >
            <MdDownload className="me-2" />
            Export
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <MdAdd className="me-2" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <FilterBar
        onFilter={handleFilter}
        onClear={handleClearFilters}
      />

      {/* Search and Stats */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center">
          <div className="input-group" style={{ width: '400px' }}>
            <span className="input-group-text">
              <MdSearch />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search customers by ID, name, or email..."
              value={searchInput}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onKeyPress={handleSearchKeyPress}
            />
            {searchInput && (
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={handleClearSearch}
                title="Clear search"
              >
                ×
              </button>
            )}
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm" />
              ) : (
                'Search'
              )}
            </button>
          </div>
        </div>
        <div className="text-muted small">
          {error ? (
            <span className="text-danger">Error: {error}</span>
          ) : (
            <>
              Showing {startIndex}-{endIndex} of {totalCustomers} customers
            </>
          )}
        </div>
      </div>

      {/* Customer Table - Full Width */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <CustomerTable
              customers={currentCustomers}
              onSort={handleSort}
            />
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <nav>
            <ul className="pagination">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </button>
              </li>
              
              {getPageNumbers().map(page => (
                <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(page)}
                    disabled={loading}
                  >
                    {page}
                  </button>
                </li>
              ))}
              
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Customer</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                  disabled={addingCustomer}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Customer ID <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      name="customer_id"
                      value={newCustomer.customer_id}
                      onChange={handleInputChange}
                      placeholder="e.g., 100001"
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Full Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={newCustomer.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email <span className="text-danger">*</span></label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={newCustomer.email}
                      onChange={handleInputChange}
                      placeholder="john.doe@example.com"
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      value={newCustomer.phone}
                      onChange={handleInputChange}
                      placeholder="+250 7XX XXX XXX"
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Segment</label>
                    <select
                      className="form-select"
                      name="segment"
                      value={newCustomer.segment}
                      onChange={handleInputChange}
                    >
                      <option value="">Select segment</option>
                      <option value="Retail">Retail</option>
                      <option value="Corporate">Corporate</option>
                      <option value="SME">SME</option>
                      <option value="Premium">Premium</option>
                    </select>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Branch</label>
                    <input
                      type="text"
                      className="form-control"
                      name="branch"
                      value={newCustomer.branch}
                      onChange={handleInputChange}
                      placeholder="e.g., Kigali Main"
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Product Type</label>
                    <select
                      className="form-select"
                      name="product_type"
                      value={newCustomer.product_type}
                      onChange={handleInputChange}
                    >
                      <option value="">Select product</option>
                      <option value="Savings">Savings</option>
                      <option value="Current">Current</option>
                      <option value="Fixed Deposit">Fixed Deposit</option>
                      <option value="Loan">Loan</option>
                    </select>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Account Balance (RWF)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="account_balance"
                      value={newCustomer.account_balance}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Salary (RWF)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="salary"
                      value={newCustomer.salary}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="digital_user"
                      id="digital_user"
                      checked={newCustomer.digital_user}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="digital_user">
                      Digital User (Uses mobile/online banking)
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  disabled={addingCustomer}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddCustomer}
                  disabled={addingCustomer}
                >
                  {addingCustomer ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Adding...
                    </>
                  ) : (
                    <>
                      <MdAdd className="me-2" />
                      Add Customer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;


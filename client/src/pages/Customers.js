import React, { useState, useEffect } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [filters, setFilters] = useState({});
  const [batchUpdating, setBatchUpdating] = useState(false);

  // Fetch customers from API
  const fetchCustomers = async (page = 1, search = '', filterParams = {}) => {
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
  };

  // Initial load
  useEffect(() => {
    fetchCustomers(1, searchTerm, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

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

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
    fetchCustomers(1, term, filters);
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
          <button className="btn btn-outline-primary">
            <MdDownload className="me-2" />
            Export
          </button>
          <button className="btn btn-primary">
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
          <div className="input-group" style={{ width: '300px' }}>
            <span className="input-group-text">
              <MdSearch />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
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
    </div>
  );
};

export default Customers;


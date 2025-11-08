import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MdFilterList, MdSearch, MdTrendingUp, MdWarning, MdPeople, MdBarChart, MdTrendingDown, MdAccountBalance, MdInfo, MdLightbulb, MdCompareArrows, MdNotificationsActive, MdAdd, MdDownload } from 'react-icons/md';
import api from '../services/api';

const Analysis = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [addingTask, setAddingTask] = useState(null);
  const [filters, setFilters] = useState({
    segment: '',
    branch: '',
    risk_level: '',
    product_type: '',
    min_churn_score: '',
    max_churn_score: '',
    min_balance: '',
    max_balance: ''
  });
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    if (user) {
      fetchCustomers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 100,
        search: searchTerm || ''
      };

      // For officers, use assignments API; for others, use customers API
      let response;
      if (user?.role === 'retentionOfficer') {
        response = await api.getMyAssignedCustomers(params);
      } else {
        // For analysts/managers, show all high-risk customers
        const customerParams = {
          page: 1,
          limit: 500,
          min_churn_score: 70,
          ...filters
        };
        Object.keys(customerParams).forEach(key => {
          if (customerParams[key] === '' || customerParams[key] === null) {
            delete customerParams[key];
          }
        });
        response = await api.getCustomers(customerParams);
      }
      if (response.success) {
        const customersData = response.customers || [];
        setCustomers(customersData);
        if (customersData.length > 0) {
          analyzeCustomers(customersData);
        } else {
          setAnalysis(null);
        }
      } else {
        setCustomers([]);
        setAnalysis(null);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      alert('Failed to fetch customers: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (customer) => {
    if (!window.confirm(`Add task for ${customer.name}?`)) {
      return;
    }

    try {
      setAddingTask(customer.id || customer.customer_id);
      const customerId = customer.id || customer.customer_id;
      
      // Create task with default values
      const taskData = {
        customer_id: customerId,
        action_type: 'Customer Retention',
        description: `Retention task for ${customer.name} (Churn Score: ${customer.churn_score}%)`,
        priority: customer.churn_score >= 70 ? 'high' : 'medium'
      };

      const response = await api.createTask(taskData);
      
      if (response.success) {
        // Remove customer from list (only for officers using assignments)
        if (user?.role === 'retentionOfficer') {
          setCustomers(customers.filter(c => (c.id || c.customer_id) !== customerId));
          // Re-analyze remaining customers
          const remainingCustomers = customers.filter(c => (c.id || c.customer_id) !== customerId);
          if (remainingCustomers.length > 0) {
            analyzeCustomers(remainingCustomers);
          } else {
            setAnalysis(null);
          }
        }
        alert('Task created successfully! Check My Tasks page.');
      } else {
        throw new Error(response.message || 'Failed to create task');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      alert('Failed to create task: ' + (err.response?.data?.message || err.message));
    } finally {
      setAddingTask(null);
    }
  };

  const analyzeCustomers = (customersData) => {
    if (!customersData || customersData.length === 0) {
      setAnalysis(null);
      return;
    }

    const total = customersData.length;
    const highRisk = customersData.filter(c => c.risk_level === 'high').length;
    const mediumRisk = customersData.filter(c => c.risk_level === 'medium').length;
    const lowRisk = customersData.filter(c => c.risk_level === 'low').length;

    const avgChurnScore = customersData.reduce((sum, c) => sum + (c.churn_score || 0), 0) / total;
    const avgBalance = customersData.reduce((sum, c) => sum + (parseFloat(c.account_balance) || 0), 0) / total;
    const totalBalance = customersData.reduce((sum, c) => sum + (parseFloat(c.account_balance) || 0), 0);

    // Segment distribution
    const segmentDistribution = {};
    customersData.forEach(c => {
      const seg = c.segment || 'unknown';
      segmentDistribution[seg] = (segmentDistribution[seg] || 0) + 1;
    });

    // Branch distribution
    const branchDistribution = {};
    customersData.forEach(c => {
      const branch = c.branch || 'unknown';
      branchDistribution[branch] = (branchDistribution[branch] || 0) + 1;
    });

    // Product type distribution
    const productDistribution = {};
    customersData.forEach(c => {
      const product = c.product_type || 'unknown';
      productDistribution[product] = (productDistribution[product] || 0) + 1;
    });

    // Behavioral Analysis - Transaction Patterns
    const highChurnCustomers = customersData.filter(c => (c.churn_score || 0) >= 70);
    const highBalanceAtRisk = highChurnCustomers.reduce((sum, c) => sum + (parseFloat(c.account_balance) || 0), 0);
    
    // Segment Risk Analysis
    const segmentRiskAnalysis = {};
    Object.keys(segmentDistribution).forEach(seg => {
      const segCustomers = customersData.filter(c => (c.segment || 'unknown') === seg);
      const segHighRisk = segCustomers.filter(c => c.risk_level === 'high').length;
      const segAvgChurn = segCustomers.reduce((sum, c) => sum + (c.churn_score || 0), 0) / segCustomers.length;
      const segTotalBalance = segCustomers.reduce((sum, c) => sum + (parseFloat(c.account_balance) || 0), 0);
      segmentRiskAnalysis[seg] = {
        total: segCustomers.length,
        highRisk: segHighRisk,
        highRiskPercent: segCustomers.length > 0 ? (segHighRisk / segCustomers.length) * 100 : 0,
        avgChurn: segAvgChurn,
        totalBalance: segTotalBalance,
        avgBalance: segTotalBalance / segCustomers.length
      };
    });

    // Early Churn Signals Detection
    const signals = {
      highChurnWithHighBalance: customersData.filter(c => 
        (c.churn_score || 0) >= 70 && (parseFloat(c.account_balance) || 0) > avgBalance * 2
      ).length,
      inactiveCustomers: customersData.filter(c => 
        (c.days_since_last_transaction || 90) > 30
      ).length,
      highComplaints: customersData.filter(c => 
        (c.complaints || 0) > 2
      ).length,
      lowTenureHighChurn: customersData.filter(c => 
        (c.tenure_months || 0) < 12 && (c.churn_score || 0) >= 50
      ).length
    };

    // Top Risk Segments
    const topRiskSegments = Object.entries(segmentRiskAnalysis)
      .sort((a, b) => b[1].highRiskPercent - a[1].highRiskPercent)
      .slice(0, 3);

    // Branch Performance Analysis
    const branchPerformance = {};
    Object.keys(branchDistribution).forEach(branch => {
      const branchCustomers = customersData.filter(c => (c.branch || 'unknown') === branch);
      const branchHighRisk = branchCustomers.filter(c => c.risk_level === 'high').length;
      branchPerformance[branch] = {
        total: branchCustomers.length,
        highRisk: branchHighRisk,
        highRiskPercent: branchCustomers.length > 0 ? (branchHighRisk / branchCustomers.length) * 100 : 0,
        avgChurn: branchCustomers.reduce((sum, c) => sum + (c.churn_score || 0), 0) / branchCustomers.length
      };
    });

    const topRiskBranches = Object.entries(branchPerformance)
      .sort((a, b) => b[1].highRiskPercent - a[1].highRiskPercent)
      .slice(0, 3);

    setAnalysis({
      total,
      highRisk,
      mediumRisk,
      lowRisk,
      avgChurnScore,
      avgBalance,
      totalBalance,
      segmentDistribution,
      branchDistribution,
      productDistribution,
      segmentRiskAnalysis,
      branchPerformance,
      topRiskSegments,
      topRiskBranches,
      highBalanceAtRisk,
      earlyChurnSignals: signals,
      highRiskPercent: total > 0 ? (highRisk / total) * 100 : 0
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleApplyFilters = () => {
    fetchCustomers();
  };

  const handleResetFilters = () => {
    setFilters({
      segment: '',
      branch: '',
      risk_level: '',
      product_type: '',
      min_churn_score: '',
      max_churn_score: '',
      min_balance: '',
      max_balance: ''
    });
    setSearchTerm('');
    setTimeout(() => fetchCustomers(), 100);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    // Debounce search
    setTimeout(() => {
      fetchCustomers();
    }, 500);
  };

  const handleExport = () => {
    if (customers.length === 0) {
      alert('No customers to export');
      return;
    }

    // Create CSV content
    let csvContent = 'Behavioral & Transaction Analysis Export\n';
    csvContent += `Generated: ${new Date().toLocaleString()}\n`;
    csvContent += `Total Customers: ${customers.length}\n\n`;
    
    // CSV Headers
    csvContent += 'Customer ID,Name,Email,Phone,Segment,Branch,Product Type,Churn Score (%),Risk Level,Account Balance (RWF)\n';
    
    // CSV Data
    customers.forEach(customer => {
      const row = [
        customer.customer_id || '',
        `"${(customer.name || '').replace(/"/g, '""')}"`,
        customer.email || '',
        customer.phone || '',
        customer.segment || '',
        customer.branch || '',
        customer.product_type || '',
        (parseFloat(customer.churn_score) || 0).toFixed(1),
        customer.risk_level || 'low',
        parseFloat(customer.account_balance || 0).toFixed(2)
      ];
      csvContent += row.join(',') + '\n';
    });

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `analysis_customers_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Behavioral & Transaction Analysis</h2>
          <p className="text-muted mb-0">Detect early churn signals from usage data. Find behavioral shifts that predict churn before it happens.</p>
        </div>
        {customers.length > 0 && (
          <button className="btn btn-success" onClick={handleExport}>
            <MdDownload className="me-2" />
            Export CSV
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <MdFilterList className="me-2" />
            {user?.role === 'retentionOfficer' ? 'My Assigned Customers' : 'Filters'}
          </h5>
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
        {user?.role !== 'retentionOfficer' && (
        <div className="card-body">
          <div className="row">
            <div className="col-md-3 mb-3">
              <label className="form-label">Segment</label>
              <select
                className="form-select"
                value={filters.segment}
                onChange={(e) => handleFilterChange('segment', e.target.value)}
              >
                <option value="">All Segments</option>
                <option value="retail">Retail</option>
                <option value="sme">SME</option>
                <option value="corporate">Corporate</option>
                <option value="institutional_banking">Institutional Banking</option>
              </select>
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">Branch</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter branch name"
                value={filters.branch}
                onChange={(e) => handleFilterChange('branch', e.target.value)}
              />
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">Risk Level</label>
              <select
                className="form-select"
                value={filters.risk_level}
                onChange={(e) => handleFilterChange('risk_level', e.target.value)}
              >
                <option value="">All Risk Levels</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">Product Type</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., Savings, Current"
                value={filters.product_type}
                onChange={(e) => handleFilterChange('product_type', e.target.value)}
              />
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">Min Churn Score</label>
              <input
                type="number"
                className="form-control"
                placeholder="0"
                min="0"
                max="100"
                value={filters.min_churn_score}
                onChange={(e) => handleFilterChange('min_churn_score', e.target.value)}
              />
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">Max Churn Score</label>
              <input
                type="number"
                className="form-control"
                placeholder="100"
                min="0"
                max="100"
                value={filters.max_churn_score}
                onChange={(e) => handleFilterChange('max_churn_score', e.target.value)}
              />
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">Min Balance</label>
              <input
                type="number"
                className="form-control"
                placeholder="0"
                min="0"
                value={filters.min_balance}
                onChange={(e) => handleFilterChange('min_balance', e.target.value)}
              />
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">Max Balance</label>
              <input
                type="number"
                className="form-control"
                placeholder="Any"
                min="0"
                value={filters.max_balance}
                onChange={(e) => handleFilterChange('max_balance', e.target.value)}
              />
            </div>
          </div>
          <div className="mt-3">
            <button className="btn btn-primary me-2" onClick={handleApplyFilters}>
              <MdSearch className="me-2" />
              Apply Filters
            </button>
            <button className="btn btn-outline-secondary" onClick={handleResetFilters}>
              Reset Filters
            </button>
          </div>
        </div>
        )}
      </div>

      {/* Analysis Summary */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading customer data...</p>
        </div>
      ) : !analysis ? (
        <div className="alert alert-info">
          <strong>No data available.</strong> Click "Apply Filters" to load customer data for analysis, or the page will automatically load up to 500 customers.
        </div>
      ) : analysis && (
        <div className="row mb-3 g-2">
          <div className="col-md-3">
            <div className="card border-primary h-100" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: '500' }}>Total Customers</p>
                    <h4 className="mb-0 text-primary" style={{ fontSize: '1.5rem', fontWeight: '700' }}>{analysis.total}</h4>
                  </div>
                  <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                    <MdPeople className="text-primary" style={{ fontSize: '1.5rem' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-danger h-100" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: '500' }}>High Risk</p>
                    <h4 className="mb-0 text-danger" style={{ fontSize: '1.5rem', fontWeight: '700' }}>{analysis.highRisk}</h4>
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {analysis.total > 0 ? ((analysis.highRisk / analysis.total) * 100).toFixed(1) : 0}%
                    </small>
                  </div>
                  <div className="bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                    <MdWarning className="text-danger" style={{ fontSize: '1.5rem' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-warning h-100" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: '500' }}>Avg Churn Score</p>
                    <h4 className="mb-0 text-warning" style={{ fontSize: '1.5rem', fontWeight: '700' }}>{analysis.avgChurnScore.toFixed(1)}%</h4>
                    <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                      M: {analysis.mediumRisk} | L: {analysis.lowRisk}
                    </small>
                  </div>
                  <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                    <MdTrendingUp className="text-warning" style={{ fontSize: '1.5rem' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-success h-100" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: '500' }}>Total Balance</p>
                    <h4 className="mb-0 text-success" style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                      {(analysis.totalBalance / 1000000).toFixed(1)}M
                    </h4>
                    <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                      Avg: {(analysis.avgBalance / 1000000).toFixed(1)}M
                    </small>
                  </div>
                  <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                    <MdBarChart className="text-success" style={{ fontSize: '1.5rem' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Behavioral Insights & Early Churn Signals */}
      {analysis && (
        <div className="row mb-4">
          <div className="col-12 mb-4">
            <div className="card border-primary">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <MdNotificationsActive className="me-2" />
                  Early Churn Signals Detection
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-3 mb-3">
                    <div className="card border-danger">
                      <div className="card-body text-center">
                        <MdTrendingDown className="text-danger mb-2" style={{ fontSize: '2rem' }} />
                        <h4 className="text-danger">{analysis.earlyChurnSignals.highChurnWithHighBalance}</h4>
                        <p className="text-muted small mb-0">High Value at Risk</p>
                        <small className="text-muted">Customers with churn ≥70% &amp; balance &gt;2x avg</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card border-warning">
                      <div className="card-body text-center">
                        <MdAccountBalance className="text-warning mb-2" style={{ fontSize: '2rem' }} />
                        <h4 className="text-warning">{analysis.earlyChurnSignals.inactiveCustomers}</h4>
                        <p className="text-muted small mb-0">Inactive Customers</p>
                        <small className="text-muted">No transaction in last 30+ days</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card border-info">
                      <div className="card-body text-center">
                        <MdWarning className="text-info mb-2" style={{ fontSize: '2rem' }} />
                        <h4 className="text-info">{analysis.earlyChurnSignals.highComplaints}</h4>
                        <p className="text-muted small mb-0">High Complaints</p>
                        <small className="text-muted">Customers with 3+ complaints</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card border-secondary">
                      <div className="card-body text-center">
                        <MdPeople className="text-secondary mb-2" style={{ fontSize: '2rem' }} />
                        <h4 className="text-secondary">{analysis.earlyChurnSignals.lowTenureHighChurn}</h4>
                        <p className="text-muted small mb-0">New Customers at Risk</p>
                        <small className="text-muted">Tenure &lt;12 months, churn ≥50%</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Segment & Branch Risk Analysis */}
      {analysis && (analysis.topRiskSegments.length > 0 || analysis.topRiskBranches.length > 0) && (
        <div className="row mb-4">
          <div className="col-md-6 mb-3">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <MdCompareArrows className="me-2" />
                  Top Risk Segments
                </h6>
              </div>
              <div className="card-body">
                {analysis.topRiskSegments.map(([segment, data]) => (
                  <div key={segment} className="mb-3 p-3 border rounded">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="mb-0">{segment}</h6>
                      <span className={`badge ${
                        data.highRiskPercent >= 30 ? 'bg-danger' :
                        data.highRiskPercent >= 15 ? 'bg-warning' : 'bg-info'
                      }`}>
                        {data.highRiskPercent.toFixed(1)}% High Risk
                      </span>
                    </div>
                    <div className="row text-center">
                      <div className="col-4">
                        <small className="text-muted d-block">Total</small>
                        <strong>{data.total}</strong>
                      </div>
                      <div className="col-4">
                        <small className="text-muted d-block">High Risk</small>
                        <strong className="text-danger">{data.highRisk}</strong>
                      </div>
                      <div className="col-4">
                        <small className="text-muted d-block">Avg Churn</small>
                        <strong>{data.avgChurn.toFixed(1)}%</strong>
                      </div>
                    </div>
                    <div className="mt-2">
                      <small className="text-muted">
                        Total Balance: RWF {data.totalBalance.toLocaleString()}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <MdCompareArrows className="me-2" />
                  Top Risk Branches
                </h6>
              </div>
              <div className="card-body">
                {analysis.topRiskBranches.map(([branch, data]) => (
                  <div key={branch} className="mb-3 p-3 border rounded">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="mb-0">{branch}</h6>
                      <span className={`badge ${
                        data.highRiskPercent >= 30 ? 'bg-danger' :
                        data.highRiskPercent >= 15 ? 'bg-warning' : 'bg-info'
                      }`}>
                        {data.highRiskPercent.toFixed(1)}% High Risk
                      </span>
                    </div>
                    <div className="row text-center">
                      <div className="col-4">
                        <small className="text-muted d-block">Total</small>
                        <strong>{data.total}</strong>
                      </div>
                      <div className="col-4">
                        <small className="text-muted d-block">High Risk</small>
                        <strong className="text-danger">{data.highRisk}</strong>
                      </div>
                      <div className="col-4">
                        <small className="text-muted d-block">Avg Churn</small>
                        <strong>{data.avgChurn.toFixed(1)}%</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actionable Insights */}
      {analysis && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-warning">
              <div className="card-header bg-warning text-dark">
                <h5 className="mb-0">
                  <MdLightbulb className="me-2" />
                  Actionable Insights
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-start">
                      <MdInfo className="text-primary me-3 mt-1" style={{ fontSize: '1.5rem' }} />
                      <div>
                        <h6 className="mb-1">High-Value At-Risk Customers</h6>
                        <p className="text-muted small mb-0">
                          <strong className="text-danger">RWF {analysis.highBalanceAtRisk.toLocaleString()}</strong> in 
                          balances from customers with churn probability ≥70%. Immediate intervention recommended.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-start">
                      <MdTrendingUp className="text-success me-3 mt-1" style={{ fontSize: '1.5rem' }} />
                      <div>
                        <h6 className="mb-1">Risk Concentration</h6>
                        <p className="text-muted small mb-0">
                          <strong>{analysis.highRiskPercent.toFixed(1)}%</strong> of analyzed customers are high risk. 
                          Focus retention efforts on top risk segments and branches identified above.
                        </p>
                      </div>
                    </div>
                  </div>
                  {analysis.topRiskSegments.length > 0 && (
                    <div className="col-md-6 mb-3">
                      <div className="d-flex align-items-start">
                        <MdPeople className="text-info me-3 mt-1" style={{ fontSize: '1.5rem' }} />
                        <div>
                          <h6 className="mb-1">Priority Segment</h6>
                          <p className="text-muted small mb-0">
                            <strong>{analysis.topRiskSegments[0][0]}</strong> segment shows highest risk concentration 
                            ({analysis.topRiskSegments[0][1].highRiskPercent.toFixed(1)}% high risk). 
                            Consider targeted campaigns for this segment.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {analysis.earlyChurnSignals.inactiveCustomers > 0 && (
                    <div className="col-md-6 mb-3">
                      <div className="d-flex align-items-start">
                        <MdWarning className="text-danger me-3 mt-1" style={{ fontSize: '1.5rem' }} />
                        <div>
                          <h6 className="mb-1">Inactivity Alert</h6>
                          <p className="text-muted small mb-0">
                            <strong>{analysis.earlyChurnSignals.inactiveCustomers}</strong> customers haven't 
                            transacted in 30+ days. Re-engagement campaigns may prevent churn.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Distribution Charts */}
      {analysis && (
        <div className="row mb-4">
          <div className="col-md-4 mb-3">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Segment Distribution</h6>
              </div>
              <div className="card-body">
                {Object.entries(analysis.segmentDistribution).map(([segment, count]) => (
                  <div key={segment} className="mb-2">
                    <div className="d-flex justify-content-between mb-1">
                      <span>{segment}</span>
                      <span className="fw-bold">{count}</span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{ width: `${(count / analysis.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Branch Distribution</h6>
              </div>
              <div className="card-body">
                {Object.entries(analysis.branchDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([branch, count]) => (
                    <div key={branch} className="mb-2">
                      <div className="d-flex justify-content-between mb-1">
                        <span>{branch}</span>
                        <span className="fw-bold">{count}</span>
                      </div>
                      <div className="progress" style={{ height: '8px' }}>
                        <div
                          className="progress-bar bg-info"
                          role="progressbar"
                          style={{ width: `${(count / analysis.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Product Type Distribution</h6>
              </div>
              <div className="card-body">
                {Object.entries(analysis.productDistribution).map(([product, count]) => (
                  <div key={product} className="mb-2">
                    <div className="d-flex justify-content-between mb-1">
                      <span>{product}</span>
                      <span className="fw-bold">{count}</span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div
                        className="progress-bar bg-success"
                        role="progressbar"
                        style={{ width: `${(count / analysis.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Table */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Filtered Customers ({customers.length})</h5>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No customers match the selected filters</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-sm" style={{ fontSize: '0.75rem' }}>
                <thead>
                  <tr>
                    <th width="80" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Customer ID</th>
                    <th width="120" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Name</th>
                    <th width="70" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Segment</th>
                    <th width="80" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Branch</th>
                    <th width="80" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Product</th>
                    <th width="70" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Churn</th>
                    <th width="50" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Risk</th>
                    <th width="75" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Balance</th>
                    <th width="90" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.slice(0, 100).map((customer) => (
                    <tr key={customer.id || customer.customer_id}>
                      <td style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>{customer.customer_id?.substring(0, 10)}...</td>
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        <Link to={`/customers/${customer.id || customer.customer_id}`} style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>
                          {customer.name?.length > 15 ? `${customer.name.substring(0, 15)}...` : customer.name}
                        </Link>
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        <span className="badge bg-info bg-opacity-10 text-info" style={{ fontSize: '0.65rem', padding: '0.15rem 0.3rem' }}>
                          {customer.segment?.substring(0, 6) || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {customer.branch?.length > 10 ? `${customer.branch.substring(0, 10)}...` : customer.branch || '-'}
                        </small>
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {customer.product_type?.length > 8 ? `${customer.product_type.substring(0, 8)}...` : customer.product_type || '-'}
                        </small>
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        <span className={`badge ${
                          (parseFloat(customer.churn_score) || 0) >= 70 ? 'bg-danger' :
                          (parseFloat(customer.churn_score) || 0) >= 50 ? 'bg-warning' : 'bg-success'
                        }`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.3rem' }}>
                          {(parseFloat(customer.churn_score) || 0).toFixed(0)}%
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        <span className={`badge ${
                          customer.risk_level === 'high' ? 'bg-danger' :
                          customer.risk_level === 'medium' ? 'bg-warning' : 'bg-success'
                        }`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.3rem' }}>
                          {customer.risk_level?.charAt(0).toUpperCase() || 'L'}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        <small className="fw-medium" style={{ fontSize: '0.7rem' }}>
                          {(parseFloat(customer.account_balance || 0) / 1000000).toFixed(1)}M
                        </small>
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleAddTask(customer)}
                          disabled={addingTask === (customer.id || customer.customer_id)}
                          title="Add Task"
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }}
                        >
                          {addingTask === (customer.id || customer.customer_id) ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-1" style={{ width: '10px', height: '10px' }} />
                              <span style={{ fontSize: '0.65rem' }}>Adding...</span>
                            </>
                          ) : (
                            <>
                              <MdAdd className="me-1" size={12} />
                              <span style={{ fontSize: '0.65rem' }}>Add</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {customers.length > 100 && (
                <p className="text-muted small text-center mt-2">
                  Showing first 100 of {customers.length} customers
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analysis;

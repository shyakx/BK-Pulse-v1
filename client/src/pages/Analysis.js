import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MdFilterList, MdSearch, MdTrendingUp, MdWarning, MdPeople, MdBarChart } from 'react-icons/md';
import api from '../services/api';

const Analysis = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
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
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 500,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });

      const response = await api.getCustomers(params);
      if (response.success && response.customers) {
        const customersData = response.customers;
        setCustomers(customersData);
        analyzeCustomers(customersData);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      alert('Failed to fetch customers: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
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
      productDistribution
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
    setTimeout(() => fetchCustomers(), 100);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Customer Segmentation / Analysis</h2>
          <p className="text-muted mb-0">Advanced filtering and segmentation for churn analysis by branch, product, or demographics</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <MdFilterList className="me-2" />
            Filters
          </h5>
        </div>
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
      </div>

      {/* Analysis Summary */}
      {analysis && (
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card border-primary">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted small mb-1">Total Customers</p>
                    <h3 className="mb-0">{analysis.total}</h3>
                  </div>
                  <MdPeople className="text-primary" style={{ fontSize: '2.5rem' }} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card border-danger">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted small mb-1">High Risk</p>
                    <h3 className="mb-0 text-danger">{analysis.highRisk}</h3>
                    <small className="text-muted">
                      {analysis.total > 0 ? ((analysis.highRisk / analysis.total) * 100).toFixed(1) : 0}%
                    </small>
                  </div>
                  <MdWarning className="text-danger" style={{ fontSize: '2.5rem' }} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card border-warning">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted small mb-1">Avg Churn Score</p>
                    <h3 className="mb-0">{analysis.avgChurnScore.toFixed(1)}%</h3>
                    <small className="text-muted">
                      Medium: {analysis.mediumRisk} | Low: {analysis.lowRisk}
                    </small>
                  </div>
                  <MdTrendingUp className="text-warning" style={{ fontSize: '2.5rem' }} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card border-success">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted small mb-1">Total Balance</p>
                    <h3 className="mb-0">RWF {analysis.totalBalance.toLocaleString()}</h3>
                    <small className="text-muted">
                      Avg: RWF {analysis.avgBalance.toLocaleString()}
                    </small>
                  </div>
                  <MdBarChart className="text-success" style={{ fontSize: '2.5rem' }} />
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
        <div className="card-body">
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
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Name</th>
                    <th>Segment</th>
                    <th>Branch</th>
                    <th>Product Type</th>
                    <th>Churn Score</th>
                    <th>Risk Level</th>
                    <th>Balance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.slice(0, 100).map((customer) => (
                    <tr key={customer.id || customer.customer_id}>
                      <td>{customer.customer_id}</td>
                      <td>
                        <Link to={`/customers/${customer.id || customer.customer_id}`}>
                          {customer.name}
                        </Link>
                      </td>
                      <td>{customer.segment || '-'}</td>
                      <td>{customer.branch || '-'}</td>
                      <td>{customer.product_type || '-'}</td>
                      <td>
                        <span className={`badge ${
                          customer.churn_score >= 70 ? 'bg-danger' :
                          customer.churn_score >= 50 ? 'bg-warning' : 'bg-success'
                        }`}>
                          {customer.churn_score?.toFixed(1) || 0}%
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          customer.risk_level === 'high' ? 'bg-danger' :
                          customer.risk_level === 'medium' ? 'bg-warning' : 'bg-success'
                        }`}>
                          {customer.risk_level || 'low'}
                        </span>
                      </td>
                      <td>RWF {parseFloat(customer.account_balance || 0).toLocaleString()}</td>
                      <td>
                        <Link
                          to={`/customers/${customer.id || customer.customer_id}`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          View
                        </Link>
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

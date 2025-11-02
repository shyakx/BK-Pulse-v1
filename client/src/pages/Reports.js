import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MdDownload, MdFilePresent, MdAssessment, MdPeople } from 'react-icons/md';
import api from '../services/api';

const Reports = () => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('performance');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    segment: '',
    branch: '',
    risk_level: ''
  });

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      let response;

      if (reportType === 'performance') {
        response = await api.getPerformanceReport({
          startDate: filters.startDate || null,
          endDate: filters.endDate || null
        });
      } else {
        response = await api.getCustomerReport({
          segment: filters.segment || null,
          branch: filters.branch || null,
          risk_level: filters.risk_level || null
        });
      }

      if (response.success) {
        setReportData(response.report);
      } else {
        throw new Error(response.message || 'Failed to generate report');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Failed to generate report: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!reportData) {
      alert('Please generate a report first');
      return;
    }

    // Convert report data to CSV
    let csvContent = '';
    
    if (reportType === 'performance') {
      csvContent = 'Performance Report\n\n';
      csvContent += 'Actions Summary\n';
      csvContent += `Total Actions,${reportData.actions.total_actions}\n`;
      csvContent += `Completed,${reportData.actions.completed}\n`;
      csvContent += `Pending,${reportData.actions.pending}\n`;
      csvContent += `In Progress,${reportData.actions.in_progress}\n`;
      csvContent += `High Priority,${reportData.actions.high_priority}\n\n`;
      csvContent += 'Retention Summary\n';
      csvContent += `Total Customers,${reportData.retention.total_customers}\n`;
      csvContent += `High Risk,${reportData.retention.high_risk}\n`;
      csvContent += `Medium Risk,${reportData.retention.medium_risk}\n`;
      csvContent += `Low Risk,${reportData.retention.low_risk}\n`;
      csvContent += `Average Churn Score,${parseFloat(reportData.retention.avg_churn_score || 0).toFixed(2)}\n`;
      csvContent += `Total Balance,${parseFloat(reportData.retention.total_balance || 0).toLocaleString()}\n`;
    } else {
      csvContent = 'Customer Report\n\n';
      csvContent += 'Customer ID,Name,Email,Phone,Segment,Branch,Product Type,Account Balance,Churn Score,Risk Level\n';
      reportData.customers.forEach(customer => {
        csvContent += `${customer.customer_id},${customer.name},${customer.email || ''},${customer.phone || ''},${customer.segment || ''},${customer.branch || ''},${customer.product_type || ''},${customer.account_balance || 0},${customer.churn_score || 0},${customer.risk_level || ''}\n`;
      });
    }

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Reports</h2>
          <p className="text-muted mb-0">Generate and export performance reports in PDF/Excel format</p>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Report Configuration</h5>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Report Type</label>
              <select
                className="form-select"
                value={reportType}
                onChange={(e) => {
                  setReportType(e.target.value);
                  setReportData(null);
                }}
              >
                <option value="performance">Performance Report</option>
                <option value="customer">Customer Churn Report</option>
              </select>
            </div>
          </div>

          {reportType === 'performance' ? (
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Segment</label>
                <select
                  className="form-select"
                  value={filters.segment}
                  onChange={(e) => setFilters({ ...filters, segment: e.target.value })}
                >
                  <option value="">All Segments</option>
                  <option value="retail">Retail</option>
                  <option value="sme">SME</option>
                  <option value="corporate">Corporate</option>
                  <option value="institutional_banking">Institutional Banking</option>
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Branch</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter branch name"
                  value={filters.branch}
                  onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Risk Level</label>
                <select
                  className="form-select"
                  value={filters.risk_level}
                  onChange={(e) => setFilters({ ...filters, risk_level: e.target.value })}
                >
                  <option value="">All Risk Levels</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          )}

          <div className="mt-3">
            <button className="btn btn-primary me-2" onClick={handleGenerateReport} disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Generating...
                </>
              ) : (
                <>
                  <MdAssessment className="me-2" />
                  Generate Report
                </>
              )}
            </button>
            {reportData && (
              <button className="btn btn-success" onClick={handleExport}>
                <MdDownload className="me-2" />
                Export CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              {reportType === 'performance' ? 'Performance Report' : 'Customer Report'}
            </h5>
            <small className="text-muted">
              Generated: {new Date(reportData.generated_at).toLocaleString()}
            </small>
          </div>
          <div className="card-body">
            {reportType === 'performance' ? (
              <div>
                <h6 className="mb-3">Actions Summary</h6>
                <div className="row mb-4">
                  <div className="col-md-3">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h4>{reportData.actions.total_actions}</h4>
                        <small className="text-muted">Total Actions</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-success bg-opacity-10">
                      <div className="card-body">
                        <h4 className="text-success">{reportData.actions.completed}</h4>
                        <small className="text-muted">Completed</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-warning bg-opacity-10">
                      <div className="card-body">
                        <h4 className="text-warning">{reportData.actions.pending}</h4>
                        <small className="text-muted">Pending</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-danger bg-opacity-10">
                      <div className="card-body">
                        <h4 className="text-danger">{reportData.actions.high_priority}</h4>
                        <small className="text-muted">High Priority</small>
                      </div>
                    </div>
                  </div>
                </div>

                <h6 className="mb-3">Retention Summary</h6>
                <div className="row">
                  <div className="col-md-4">
                    <div className="card">
                      <div className="card-body">
                        <h4>{reportData.retention.total_customers}</h4>
                        <small className="text-muted">Total Customers</small>
                        <div className="mt-2">
                          <small>High Risk: {reportData.retention.high_risk} | </small>
                          <small>Medium: {reportData.retention.medium_risk} | </small>
                          <small>Low: {reportData.retention.low_risk}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card">
                      <div className="card-body">
                        <h4>{parseFloat(reportData.retention.avg_churn_score || 0).toFixed(2)}%</h4>
                        <small className="text-muted">Average Churn Score</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card">
                      <div className="card-body">
                        <h4>RWF {parseFloat(reportData.retention.total_balance || 0).toLocaleString()}</h4>
                        <small className="text-muted">Total Account Balance</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6>Customer List ({reportData.total} customers)</h6>
                </div>
                <div className="table-responsive">
                  <table className="table table-sm table-hover">
                    <thead>
                      <tr>
                        <th>Customer ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Segment</th>
                        <th>Branch</th>
                        <th>Churn Score</th>
                        <th>Risk Level</th>
                        <th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.customers.slice(0, 100).map((customer) => (
                        <tr key={customer.customer_id}>
                          <td>{customer.customer_id}</td>
                          <td>{customer.name}</td>
                          <td>{customer.email || '-'}</td>
                          <td>{customer.segment || '-'}</td>
                          <td>{customer.branch || '-'}</td>
                          <td>{customer.churn_score.toFixed(1)}%</td>
                          <td>
                            <span className={`badge ${
                              customer.risk_level === 'high' ? 'bg-danger' :
                              customer.risk_level === 'medium' ? 'bg-warning' : 'bg-success'
                            }`}>
                              {customer.risk_level}
                            </span>
                          </td>
                          <td>RWF {customer.account_balance.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {reportData.customers.length > 100 && (
                    <p className="text-muted small text-center mt-2">
                      Showing first 100 of {reportData.customers.length} customers. Export CSV for full list.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;

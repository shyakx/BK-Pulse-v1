import React, { useState, useEffect, useCallback } from 'react';
import { MdSearch, MdFilterList, MdDownload } from 'react-icons/md';
import api from '../services/api';

const AdminAudit = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    user_id: '',
    action: '',
    startDate: '',
    endDate: ''
  });
  const [appliedFilters, setAppliedFilters] = useState({
    user_id: '',
    action: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: 50,
        ...appliedFilters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });

      const response = await api.getAdminAudit(params);
      if (response.success) {
        setLogs(response.logs || []);
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages
        }));
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      alert('Failed to fetch audit logs: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, pagination.page]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    setAppliedFilters(filters);
  };

  const handleExport = () => {
    // Export logs to CSV
    let csvContent = 'Timestamp,User,Action,Table,Record ID,IP Address\n';
    logs.forEach(log => {
      csvContent += `${log.created_at},${log.user_name || 'System'},${log.action},${log.table_name || ''},${log.record_id || ''},${log.ip_address || ''}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Audit & Logs</h2>
          <p className="text-muted mb-0">View full activity logs for compliance and governance</p>
        </div>
        {logs.length > 0 && (
          <button className="btn btn-success" onClick={handleExport}>
            <MdDownload className="me-2" />
            Export CSV
          </button>
        )}
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
              <label className="form-label">User ID</label>
              <input
                type="number"
                className="form-control"
                placeholder="Filter by user ID"
                value={filters.user_id}
                onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
              />
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">Action</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., create_user, update_customer"
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              />
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-control"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleApplyFilters}>
            <MdSearch className="me-2" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No audit logs found</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-sm table-hover">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Table</th>
                      <th>Record ID</th>
                      <th>IP Address</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td>{new Date(log.created_at).toLocaleString()}</td>
                        <td>{log.user_name || log.user_email || 'System'}</td>
                        <td>
                          <span className="badge bg-info">{log.action}</span>
                        </td>
                        <td>{log.table_name || '-'}</td>
                        <td>{log.record_id || '-'}</td>
                        <td>{log.ip_address || '-'}</td>
                        <td>
                          {(log.old_values || log.new_values) && (
                            <button
                              className="btn btn-sm btn-outline-info"
                              onClick={() => {
                                const details = {
                                  old: log.old_values,
                                  new: log.new_values
                                };
                                alert(JSON.stringify(details, null, 2));
                              }}
                            >
                              View Details
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <small className="text-muted">
                    Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total logs)
                  </small>
                  <div>
                    <button
                      className="btn btn-sm btn-outline-primary me-2"
                      disabled={pagination.page === 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                      Previous
                    </button>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAudit;

import React, { useState, useEffect } from 'react';
import { MdPeople, MdWarning, MdCheckCircle, MdTrendingUp, MdDataUsage, MdHistory } from 'react-icons/md';
import api from '../services/api';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.getAdminDashboard();
      if (response.success) {
        setDashboardData(response.dashboard);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
      alert('Failed to fetch dashboard data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">System Dashboard</h2>
          <p className="text-muted mb-0">Overview of system health, ETL pipelines, and user activity</p>
        </div>
        <button className="btn btn-primary" onClick={fetchDashboardData}>
          <MdTrendingUp className="me-2" />
          Refresh
        </button>
      </div>

      {/* System Health Cards */}
      {dashboardData && (
        <>
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="card border-success">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted small mb-1">System Status</p>
                      <h4 className="mb-0 text-success">
                        <MdCheckCircle className="me-2" />
                        {dashboardData.systemHealth.status.toUpperCase()}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted small mb-1">Active Users</p>
                      <h3 className="mb-0">{dashboardData.systemHealth.activeUsers}</h3>
                    </div>
                    <MdPeople className="text-primary" style={{ fontSize: '2.5rem' }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted small mb-1">Total Customers</p>
                      <h3 className="mb-0">{dashboardData.systemHealth.totalCustomers}</h3>
                    </div>
                    <MdPeople className="text-info" style={{ fontSize: '2.5rem' }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card border-danger">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted small mb-1">High Risk Customers</p>
                      <h3 className="mb-0 text-danger">{dashboardData.systemHealth.highRiskCustomers}</h3>
                    </div>
                    <MdWarning className="text-danger" style={{ fontSize: '2.5rem' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Quality */}
          <div className="row mb-4">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Data Quality Metrics</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-3">
                      <div className="text-center">
                        <h4>{dashboardData.dataQuality.totalCustomers}</h4>
                        <small className="text-muted">Total Customers</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center">
                        <h4 className={dashboardData.dataQuality.missingChurn > 0 ? 'text-warning' : 'text-success'}>
                          {dashboardData.dataQuality.missingChurn}
                        </h4>
                        <small className="text-muted">Missing Churn Scores</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center">
                        <h4 className={dashboardData.dataQuality.missingBalance > 0 ? 'text-warning' : 'text-success'}>
                          {dashboardData.dataQuality.missingBalance}
                        </h4>
                        <small className="text-muted">Missing Account Balance</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center">
                        <h4 className={dashboardData.dataQuality.unassigned > 0 ? 'text-warning' : 'text-success'}>
                          {dashboardData.dataQuality.unassigned}
                        </h4>
                        <small className="text-muted">Unassigned Customers</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <MdHistory className="me-2" />
                Recent System Activity
              </h5>
            </div>
            <div className="card-body">
              {dashboardData.recentActivity.length === 0 ? (
                <p className="text-muted text-center mb-0">No recent activity</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Action</th>
                        <th>Table</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.recentActivity.map((activity) => (
                        <tr key={activity.id}>
                          <td>{activity.user || 'System'}</td>
                          <td>
                            <span className="badge bg-info">{activity.action}</span>
                          </td>
                          <td>{activity.table_name || '-'}</td>
                          <td>{new Date(activity.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { MdCheckCircle, MdPending, MdWarning, MdCancel, MdRefresh, MdSearch, MdFilterList } from 'react-icons/md';
import api from '../services/api';

const Recommendations = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRecommendations();
  }, [filterStatus]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 100,
        status: filterStatus !== 'all' ? filterStatus : null,
        search: searchTerm || null
      };

      const response = await api.getAllRecommendations(params);
      
      if (response.success) {
        setRecommendations(response.recommendations || []);
        setStatistics(response.statistics || null);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      alert('Failed to fetch recommendations: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (recommendationId, newStatus) => {
    if (!['retentionManager', 'admin'].includes(user?.role)) {
      alert('You do not have permission to update recommendation status');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${newStatus} this recommendation?`)) {
      return;
    }

    try {
      const response = await api.updateRecommendationStatus(recommendationId, newStatus);
      if (response.success) {
        fetchRecommendations();
      } else {
        throw new Error(response.message || 'Failed to update status');
      }
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'bg-warning', icon: <MdPending />, text: 'Pending' },
      approved: { class: 'bg-info', icon: <MdCheckCircle />, text: 'Approved' },
      implemented: { class: 'bg-success', icon: <MdCheckCircle />, text: 'Implemented' },
      rejected: { class: 'bg-danger', icon: <MdCancel />, text: 'Rejected' }
    };
    return badges[status] || badges.pending;
  };

  const getPriorityBadge = (impact) => {
    if (impact === 'high') return 'bg-danger';
    if (impact === 'medium') return 'bg-warning';
    return 'bg-info';
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Recommendations Monitoring</h2>
          <p className="text-muted mb-0">Monitor how retention recommendations are being executed by Officers</p>
        </div>
        <button className="btn btn-primary" onClick={fetchRecommendations}>
          <MdRefresh className="me-2" />
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="row mb-4">
          <div className="col-md-2 mb-3">
            <div className="card">
              <div className="card-body text-center">
                <h3 className="mb-0">{statistics.total}</h3>
                <small className="text-muted">Total</small>
              </div>
            </div>
          </div>
          <div className="col-md-2 mb-3">
            <div className="card border-warning">
              <div className="card-body text-center">
                <h3 className="mb-0 text-warning">{statistics.pending}</h3>
                <small className="text-muted">Pending</small>
              </div>
            </div>
          </div>
          <div className="col-md-2 mb-3">
            <div className="card border-info">
              <div className="card-body text-center">
                <h3 className="mb-0 text-info">{statistics.approved}</h3>
                <small className="text-muted">Approved</small>
              </div>
            </div>
          </div>
          <div className="col-md-2 mb-3">
            <div className="card border-success">
              <div className="card-body text-center">
                <h3 className="mb-0 text-success">{statistics.implemented}</h3>
                <small className="text-muted">Implemented</small>
              </div>
            </div>
          </div>
          <div className="col-md-2 mb-3">
            <div className="card border-danger">
              <div className="card-body text-center">
                <h3 className="mb-0 text-danger">{statistics.rejected}</h3>
                <small className="text-muted">Rejected</small>
              </div>
            </div>
          </div>
          <div className="col-md-2 mb-3">
            <div className="card">
              <div className="card-body text-center">
                <h3 className="mb-0">{statistics.avg_confidence.toFixed(1)}%</h3>
                <small className="text-muted">Avg Confidence</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <MdSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search recommendations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchRecommendations()}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <MdFilterList />
                </span>
                <select
                  className="form-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="implemented">Implemented</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No recommendations found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Recommended Action</th>
                    <th>Confidence</th>
                    <th>Impact</th>
                    <th>Status</th>
                    <th>Officer</th>
                    <th>Created</th>
                    {['retentionManager', 'admin'].includes(user?.role) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {recommendations.map((rec) => {
                    const statusBadge = getStatusBadge(rec.status);
                    return (
                      <tr key={rec.id}>
                        <td>
                          <Link to={`/customers/${rec.customer_id}`}>
                            {rec.customer_name || rec.customer_id}
                          </Link>
                          <br />
                          <small className="text-muted">
                            Score: {rec.churn_score.toFixed(1)}% | Risk: {rec.risk_level}
                          </small>
                        </td>
                        <td>
                          <strong>{rec.recommended_action}</strong>
                        </td>
                        <td>
                          <span className="badge bg-info">{rec.confidence_score.toFixed(1)}%</span>
                        </td>
                        <td>
                          <span className={`badge ${getPriorityBadge(rec.expected_impact)}`}>
                            {rec.expected_impact}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${statusBadge.class}`}>
                            {statusBadge.icon} {statusBadge.text}
                          </span>
                        </td>
                        <td>{rec.officer_name || 'Unassigned'}</td>
                        <td>{new Date(rec.created_at).toLocaleDateString()}</td>
                        {['retentionManager', 'admin'].includes(user?.role) && (
                          <td>
                            {rec.status === 'pending' && (
                              <div className="btn-group btn-group-sm">
                                <button
                                  className="btn btn-success"
                                  onClick={() => handleStatusUpdate(rec.id, 'approved')}
                                  title="Approve"
                                >
                                  <MdCheckCircle />
                                </button>
                                <button
                                  className="btn btn-danger"
                                  onClick={() => handleStatusUpdate(rec.id, 'rejected')}
                                  title="Reject"
                                >
                                  <MdCancel />
                                </button>
                              </div>
                            )}
                            {rec.status === 'approved' && (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleStatusUpdate(rec.id, 'implemented')}
                              >
                                Mark Implemented
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recommendations;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { MdCheckCircle, MdCancel, MdWarning, MdRefresh } from 'react-icons/md';
import api from '../services/api';

const Approvals = () => {
  const { user } = useAuth();
  const [pendingRecommendations, setPendingRecommendations] = useState([]);
  const [criticalCases, setCriticalCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recResponse, customersResponse] = await Promise.all([
        api.getAllRecommendations({ status: 'pending', limit: 50 }),
        api.getCustomers({ risk_level: 'high', limit: 20 })
      ]);

      if (recResponse.success) {
        setPendingRecommendations(recResponse.recommendations || []);
      }

      if (customersResponse.success) {
        // Get high-risk customers that might need assignment
        setCriticalCases(customersResponse.customers || []);
      }
    } catch (err) {
      console.error('Error fetching approvals data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (recommendationId) => {
    try {
      const response = await api.updateRecommendationStatus(recommendationId, 'approved');
      if (response.success) {
        alert('Recommendation approved successfully!');
        fetchData();
      }
    } catch (err) {
      alert('Failed to approve: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async (recommendationId) => {
    if (!window.confirm('Are you sure you want to reject this recommendation?')) {
      return;
    }

    try {
      const response = await api.updateRecommendationStatus(recommendationId, 'rejected');
      if (response.success) {
        alert('Recommendation rejected');
        fetchData();
      }
    } catch (err) {
      alert('Failed to reject: ' + (err.response?.data?.message || err.message));
    }
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
          <h2 className="fw-bold mb-1">Recommendations & Approvals</h2>
          <p className="text-muted mb-0">Approve or modify recommended retention actions and assign critical cases</p>
        </div>
        <button className="btn btn-primary" onClick={fetchData}>
          <MdRefresh className="me-2" />
          Refresh
        </button>
      </div>

      {/* Pending Recommendations */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Pending Recommendations ({pendingRecommendations.length})</h5>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : pendingRecommendations.length === 0 ? (
            <div className="text-center py-3">
              <p className="text-muted mb-0">No pending recommendations</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-sm">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Recommended Action</th>
                    <th>Confidence</th>
                    <th>Impact</th>
                    <th>Officer</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRecommendations.map((rec) => (
                    <tr key={rec.id}>
                      <td>
                        <Link to={`/customers/${rec.customer_id}`}>
                          {rec.customer_name || rec.customer_id}
                        </Link>
                        <br />
                        <small className="text-muted">
                          Score: {rec.churn_score ? parseFloat(rec.churn_score).toFixed(1) : '0.0'}% | Risk: {rec.risk_level || 'N/A'}
                        </small>
                      </td>
                      <td>
                        <strong>{rec.recommended_action}</strong>
                      </td>
                      <td>
                        <span className="badge bg-info">
                          {rec.confidence_score ? parseFloat(rec.confidence_score).toFixed(1) : '0.0'}%
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getPriorityBadge(rec.expected_impact)}`}>
                          {rec.expected_impact}
                        </span>
                      </td>
                      <td>{rec.officer_name || 'Unassigned'}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-success"
                            onClick={() => handleApprove(rec.id)}
                            title="Approve"
                          >
                            <MdCheckCircle /> Approve
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleReject(rec.id)}
                            title="Reject"
                          >
                            <MdCancel /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Critical Cases Needing Assignment */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <MdWarning className="me-2 text-danger" />
            Critical Cases Needing Attention ({criticalCases.length})
          </h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : criticalCases.length === 0 ? (
            <div className="text-center py-3">
              <p className="text-muted mb-0">No critical cases found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-sm">
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Name</th>
                    <th>Churn Score</th>
                    <th>Account Balance</th>
                    <th>Assigned Officer</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {criticalCases.map((customer) => (
                    <tr key={customer.id || customer.customer_id}>
                      <td>{customer.customer_id}</td>
                      <td>
                        <Link to={`/customers/${customer.id || customer.customer_id}`}>
                          {customer.name}
                        </Link>
                      </td>
                      <td>
                        <span className="badge bg-danger">
                          {customer.churn_score ? parseFloat(customer.churn_score).toFixed(1) : '0.0'}%
                        </span>
                      </td>
                      <td>RWF {parseFloat(customer.account_balance || 0).toLocaleString()}</td>
                      <td>
                        {customer.assigned_officer_name || (
                          <span className="text-warning">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <Link
                          to={`/customers/${customer.id || customer.customer_id}`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Approvals;

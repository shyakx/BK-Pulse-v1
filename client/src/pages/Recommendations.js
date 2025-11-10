import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { MdCheckCircle, MdPending, MdWarning, MdCancel, MdRefresh, MdSearch, MdFilterList, MdTrendingUp, MdLightbulb, MdAccountBalance, MdBarChart, MdThumbUp } from 'react-icons/md';
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
        const recommendationsData = response.recommendations || [];
        const statisticsData = response.statistics || {
          total: 0,
          pending: 0,
          approved: 0,
          implemented: 0,
          rejected: 0,
          avg_confidence: 0
        };
        
        // Calculate effectiveness metrics
        const implemented = recommendationsData.filter(r => r.status === 'implemented');
        const highImpactImplemented = implemented.filter(r => r.expected_impact === 'high');
        const totalPotentialImpact = recommendationsData.reduce((sum, r) => {
          const impactValue = r.expected_impact === 'high' ? 3 : r.expected_impact === 'medium' ? 2 : 1;
          return sum + impactValue;
        }, 0);
        
        const actionTypeBreakdown = {};
        recommendationsData.forEach(r => {
          const action = r.recommended_action || 'Unknown';
          if (!actionTypeBreakdown[action]) {
            actionTypeBreakdown[action] = { total: 0, implemented: 0, pending: 0, avgConfidence: 0 };
          }
          actionTypeBreakdown[action].total++;
          if (r.status === 'implemented') actionTypeBreakdown[action].implemented++;
          if (r.status === 'pending') actionTypeBreakdown[action].pending++;
          actionTypeBreakdown[action].avgConfidence += parseFloat(r.confidence_score || 0);
        });
        
        Object.keys(actionTypeBreakdown).forEach(action => {
          const data = actionTypeBreakdown[action];
          data.avgConfidence = data.total > 0 ? data.avgConfidence / data.total : 0;
          data.successRate = data.total > 0 ? (data.implemented / data.total) * 100 : 0;
        });
        
        const topActions = Object.entries(actionTypeBreakdown)
          .sort((a, b) => b[1].total - a[1].total)
          .slice(0, 5);
        
        const highConfidenceRecommendations = recommendationsData.filter(r => 
          parseFloat(r.confidence_score || 0) >= 80
        ).length;
        
        const highValueAtRisk = recommendationsData
          .filter(r => parseFloat(r.churn_score || 0) >= 70)
          .reduce((sum, r) => sum + (parseFloat(r.customer_balance || 0) || 0), 0);
        
        setRecommendations(recommendationsData);
        setStatistics({
          ...statisticsData,
          effectivenessMetrics: {
            implementedCount: implemented.length,
            implementationRate: recommendationsData.length > 0 ? (implemented.length / recommendationsData.length) * 100 : 0,
            highImpactImplemented: highImpactImplemented.length,
            totalPotentialImpact,
            highConfidenceCount: highConfidenceRecommendations,
            highValueAtRisk: highValueAtRisk,
            actionTypeBreakdown,
            topActions
          }
        });
      } else {
        setRecommendations([]);
        setStatistics(null);
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
          <h2 className="fw-bold mb-1">Retention Recommendation Engine</h2>
          <p className="text-muted mb-0">Suggested actions for at-risk customers. Choose or test the most effective intervention per customer.</p>
        </div>
        <button className="btn btn-primary" onClick={fetchRecommendations}>
          <MdRefresh className="me-2" />
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      {loading ? (
        <div className="text-center py-3">
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : statistics && (
        <>
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
        </>
      )}

      {/* Effectiveness Insights */}
      {statistics && statistics.effectivenessMetrics && (
        <div className="row mb-4">
          <div className="col-12 mb-4">
            <div className="card border-success">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <MdTrendingUp className="me-2" />
                  Recommendation Effectiveness & Impact Analysis
                </h5>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-3 mb-3">
                    <div className="card border-primary">
                      <div className="card-body text-center">
                        <MdThumbUp className="text-primary mb-2" style={{ fontSize: '2rem' }} />
                        <h4 className="text-primary">{statistics.effectivenessMetrics.implementationRate.toFixed(1)}%</h4>
                        <p className="text-muted small mb-0">Implementation Rate</p>
                        <small className="text-muted">
                          {statistics.effectivenessMetrics.implementedCount} of {statistics.total} implemented
                        </small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card border-warning">
                      <div className="card-body text-center">
                        <MdLightbulb className="text-warning mb-2" style={{ fontSize: '2rem' }} />
                        <h4 className="text-warning">{statistics.effectivenessMetrics.highImpactImplemented}</h4>
                        <p className="text-muted small mb-0">High Impact Implemented</p>
                        <small className="text-muted">Most critical actions taken</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card border-info">
                      <div className="card-body text-center">
                        <MdBarChart className="text-info mb-2" style={{ fontSize: '2rem' }} />
                        <h4 className="text-info">{statistics.effectivenessMetrics.highConfidenceCount}</h4>
                        <p className="text-muted small mb-0">High Confidence (≥80%)</p>
                        <small className="text-muted">Most reliable recommendations</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card border-danger">
                      <div className="card-body text-center">
                        <MdAccountBalance className="text-danger mb-2" style={{ fontSize: '2rem' }} />
                        <h4 className="text-danger">RWF {Math.round(statistics.effectivenessMetrics.highValueAtRisk / 1000000)}M</h4>
                        <p className="text-muted small mb-0">High Value at Risk</p>
                        <small className="text-muted">Balance from ≥70% churn risk</small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Recommendation Actions */}
                {statistics.effectivenessMetrics.topActions.length > 0 && (
                  <div className="row">
                    <div className="col-12">
                      <h6 className="mb-3">
                        <MdBarChart className="me-2" />
                        Top Recommended Actions
                      </h6>
                      <div className="table-responsive">
                        <table className="table table-sm table-hover">
                          <thead>
                            <tr>
                              <th>Action Type</th>
                              <th>Total</th>
                              <th>Implemented</th>
                              <th>Pending</th>
                              <th>Success Rate</th>
                              <th>Avg Confidence</th>
                            </tr>
                          </thead>
                          <tbody>
                            {statistics.effectivenessMetrics.topActions.map(([action, data]) => (
                              <tr key={action}>
                                <td><strong>{action}</strong></td>
                                <td>{data.total}</td>
                                <td>
                                  <span className="badge bg-success">{data.implemented}</span>
                                </td>
                                <td>
                                  <span className="badge bg-warning">{data.pending}</span>
                                </td>
                                <td>
                                  <span className={`badge ${
                                    data.successRate >= 50 ? 'bg-success' :
                                    data.successRate >= 25 ? 'bg-warning' : 'bg-secondary'
                                  }`}>
                                    {data.successRate.toFixed(1)}%
                                  </span>
                                </td>
                                <td>{data.avgConfidence.toFixed(1)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actionable Insights */}
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="alert alert-info">
                      <h6 className="mb-2">
                        <MdLightbulb className="me-2" />
                        Key Insights
                      </h6>
                      <ul className="mb-0">
                        {statistics.effectivenessMetrics.implementationRate < 50 && (
                          <li>
                            <strong>Implementation Opportunity:</strong> Only {statistics.effectivenessMetrics.implementationRate.toFixed(1)}% 
                            of recommendations have been implemented. Consider prioritizing high-confidence recommendations 
                            ({statistics.effectivenessMetrics.highConfidenceCount} available).
                          </li>
                        )}
                        {statistics.effectivenessMetrics.highImpactImplemented > 0 && (
                          <li>
                            <strong>High Impact Success:</strong> {statistics.effectivenessMetrics.highImpactImplemented} high-impact 
                            recommendations have been implemented, indicating strong strategic focus on critical actions.
                          </li>
                        )}
                        {statistics.effectivenessMetrics.highValueAtRisk > 0 && (
                          <li>
                            <strong>Value Protection:</strong> Recommendations target RWF {Math.round(statistics.effectivenessMetrics.highValueAtRisk / 1000000)}M 
                            in customer balances at high churn risk. Timely implementation could prevent significant revenue loss.
                          </li>
                        )}
                        {statistics.effectivenessMetrics.topActions.length > 0 && (
                          <li>
                            <strong>Top Action:</strong> "{statistics.effectivenessMetrics.topActions[0][0]}" is the most recommended action 
                            ({statistics.effectivenessMetrics.topActions[0][1].total} recommendations) with a 
                            {statistics.effectivenessMetrics.topActions[0][1].successRate.toFixed(1)}% implementation rate.
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
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
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-3">No recommendations found</p>
              <p className="text-muted small">
                Recommendations are generated when you run predictions on customers. 
                Try running bulk predictions or individual customer predictions to generate recommendations.
              </p>
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
                            Score: {(parseFloat(rec.churn_score) || 0).toFixed(1)}% | Risk: {rec.risk_level}
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

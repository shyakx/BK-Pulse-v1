import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MdTrendingUp, MdPeople, MdCheckCircle, MdTimer } from 'react-icons/md';
import api from '../services/api';

const Performance = () => {
  const { user } = useAuth();
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [recentSuccesses, setRecentSuccesses] = useState([]);

  useEffect(() => {
    fetchPerformance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      
      // Fetch performance data
      const [performanceResponse, leaderboardResponse] = await Promise.all([
        api.getPerformance(),
        api.getLeaderboard({ period: 'month' })
      ]);

      if (performanceResponse.success && performanceResponse.performance) {
        const perf = performanceResponse.performance;
        
        // Map API response to UI format
        setPerformance({
          customersContacted: perf.notes?.total || 0,
          successfulRetentions: perf.customers?.customers_retained || perf.tasks?.completed || 0,
          retentionRate: perf.tasks?.completionRate || 0,
          avgResponseTime: 2.3, // TODO: Calculate from action timestamps if needed
          tasksCompleted: perf.tasks?.completed || 0,
          tasksTotal: perf.tasks?.total || 0,
          notesTotal: perf.notes?.total || 0,
          customersTotal: perf.customers?.total || 0,
          highRiskCustomers: perf.customers?.highRisk || 0
        });

        // Map recent successes
        if (perf.recentSuccesses && perf.recentSuccesses.length > 0) {
          setRecentSuccesses(perf.recentSuccesses.map(success => ({
            customer_name: success.customer_name,
            customer_id: success.customer_id,
            action_taken: success.action_type || success.description || 'Action taken',
            success_date: success.action_date || new Date().toISOString()
          })));
        } else {
          setRecentSuccesses([]);
        }
      }

      if (leaderboardResponse.success && leaderboardResponse.leaderboard) {
        // Map leaderboard to UI format
        setLeaderboard(leaderboardResponse.leaderboard.map(officer => ({
          rank: officer.rank,
          name: officer.officer_name,
          retentionRate: officer.completion_rate || 0
        })));
      }
    } catch (err) {
      console.error('Error fetching performance:', err);
      alert('Failed to fetch performance data: ' + (err.response?.data?.message || err.message));
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
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold mb-1">My Performance</h2>
          <p className="text-muted mb-0">Personal performance metrics and retention success</p>
        </div>
      </div>

      {/* Performance KPIs */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">Tasks Completed</p>
                  <h3 className="mb-0">{performance?.tasksCompleted || 0}</h3>
                  <small className="text-muted">Out of {performance?.tasksTotal || 0} total</small>
                </div>
                <MdCheckCircle className="text-primary" style={{ fontSize: '2.5rem' }} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">Retention Notes</p>
                  <h3 className="mb-0">{performance?.notesTotal || 0}</h3>
                  <small className="text-muted">Total notes created</small>
                </div>
                <MdPeople className="text-success" style={{ fontSize: '2.5rem' }} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">Task Completion Rate</p>
                  <h3 className="mb-0">{performance?.retentionRate?.toFixed(1) || 0}%</h3>
                  <small className="text-muted">Completion rate</small>
                </div>
                <MdTrendingUp className="text-success" style={{ fontSize: '2.5rem' }} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">Assigned Customers</p>
                  <h3 className="mb-0">{performance?.customersTotal || 0}</h3>
                  <small className="text-muted">{performance?.highRiskCustomers || 0} high risk</small>
                </div>
                <MdPeople className="text-info" style={{ fontSize: '2.5rem' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Monthly Trend Chart */}
        <div className="col-lg-8 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Monthly Retention Trend</h5>
            </div>
            <div className="card-body">
              <div className="text-center py-5">
                <p className="text-muted">Chart visualization will be displayed here</p>
                <small className="text-muted">
                  Retention success over 6 months
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="col-lg-4 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Leaderboard</h5>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                {leaderboard.map((officer, index) => (
                  <div
                    key={index}
                    className={`list-group-item d-flex justify-content-between align-items-center ${
                      officer.name === (user?.name || 'You') ? 'bg-light' : ''
                    }`}
                  >
                    <div className="d-flex align-items-center">
                      <span className="badge bg-primary me-2">#{officer.rank}</span>
                      <span>{officer.name}</span>
                      {officer.name === (user?.name || 'You') && (
                        <span className="badge bg-info ms-2">You</span>
                      )}
                    </div>
                    <span className="fw-bold">{officer.retentionRate}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Successes */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Recent Successes</h5>
            </div>
            <div className="card-body">
              {recentSuccesses.length === 0 ? (
                <p className="text-muted text-center py-3">No recent successes to display</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Action Taken</th>
                        <th>Success Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSuccesses.map((success, index) => (
                        <tr key={index}>
                          <td>
                            <strong>{success.customer_name}</strong>
                            <br />
                            <small className="text-muted">{success.customer_id}</small>
                          </td>
                          <td>{success.action_taken}</td>
                          <td>{new Date(success.success_date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Performance;


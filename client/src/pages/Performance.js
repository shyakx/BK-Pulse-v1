import React, { useState, useEffect } from 'react';
import { MdTrendingUp, MdAttachMoney, MdTimer, MdPeople, MdBarChart, MdEmojiEvents, MdLightbulb } from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import ChurnOverviewCard from '../components/Dashboard/ChurnOverviewCard';

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
      
      // Fetch performance data - make leaderboard non-blocking
      const [performanceResponse, leaderboardResponse] = await Promise.allSettled([
        api.getPerformance(),
        api.getLeaderboard({ period: 'month' }).catch(err => {
          console.warn('Leaderboard fetch failed:', err);
          return { success: false, leaderboard: [] };
        })
      ]);

      // Handle performance response
      const perfResult = performanceResponse.status === 'fulfilled' 
        ? performanceResponse.value 
        : { success: false };
      
      if (perfResult.success && perfResult.performance) {
        const perf = perfResult.performance;
        
        // Map API response to UI format
        setPerformance({
          customersContacted: perf.notes?.total || 0,
          successfulRetentions: perf.customers?.customers_retained || perf.tasks?.completed || 0,
          retentionRate: perf.tasks?.completionRate || 0,
          avgResponseTime: perf.avgResponseTime || perf.actions?.avgResponseTime || 0,
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

      // Handle leaderboard response (non-blocking)
      const leaderboardResult = leaderboardResponse.status === 'fulfilled' 
        ? leaderboardResponse.value 
        : { success: false, leaderboard: [] };
      
      if (leaderboardResult.success && leaderboardResult.leaderboard) {
        // Map leaderboard to UI format
        setLeaderboard(leaderboardResult.leaderboard.map((officer, index) => ({
          rank: index + 1,
          name: officer.officer_name,
          retentionRate: officer.completion_rate || 0
        })));
      } else {
        // Set empty leaderboard if fetch failed
        setLeaderboard([]);
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
          <ChurnOverviewCard
            title="Customers Reactivated"
            value={performance?.customersReactivated || 0}
            change="This month"
            trend="up"
            icon="check"
            color="success"
            delay={0}
          />
        </div>
        <div className="col-md-3 mb-3">
          <ChurnOverviewCard
            title="Retention Success Rate"
            value={performance?.retentionRate ? `${performance.retentionRate.toFixed(1)}%` : '0%'}
            change="Completion rate"
            trend="up"
            icon="trending-up"
            color="primary"
            delay={100}
          />
        </div>
        <div className="col-md-3 mb-3">
          <ChurnOverviewCard
            title="Avg Follow-up Time"
            value={performance?.avgResponseTime ? `${performance.avgResponseTime}h` : '0h'}
            change="Response time"
            trend="down"
            icon="timer"
            color="info"
            delay={200}
          />
        </div>
        <div className="col-md-3 mb-3">
          <ChurnOverviewCard
            title="High→Low Risk"
            value={performance?.highToLowRisk || 0}
            change="Conversions"
            trend="up"
            icon="trending-down"
            color="warning"
            delay={300}
          />
        </div>
      </div>

      {/* Revenue & ROI Impact */}
      <div className="row mb-4">
        <div className="col-md-12 mb-4">
          <div className="bk-card">
            <div className="bk-card-header">
              <h5 className="fw-bold mb-0">
                <MdAttachMoney className="me-2" />
                Revenue & ROI Impact
              </h5>
            </div>
            <div className="bk-card-body">
              <div className="row">
                <div className="col-md-4">
                  <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                    <MdAttachMoney className="text-success mb-2" size={32} />
                    <h3 className="mb-1 fw-bold">
                      RWF {((performance?.earningsSaved || 0) / 1000000).toFixed(1)}M
                    </h3>
                    <p className="mb-0 text-muted small">Earnings Saved</p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center p-3 bg-primary bg-opacity-10 rounded">
                    <MdTrendingUp className="text-primary mb-2" size={32} />
                    <h3 className="mb-1 fw-bold">
                      {performance?.avgROI || 0}%
                    </h3>
                    <p className="mb-0 text-muted small">Average ROI per Incentive</p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center p-3 bg-info bg-opacity-10 rounded">
                    <MdBarChart className="text-info mb-2" size={32} />
                    <h3 className="mb-1 fw-bold">
                      RWF {((performance?.totalValueGenerated || 0) / 1000000).toFixed(1)}M
                    </h3>
                    <p className="mb-0 text-muted small">Total Value Generated</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Productivity Metrics */}
      <div className="row mb-4">
        <div className="col-md-12 mb-4">
          <div className="bk-card">
            <div className="bk-card-header">
              <h5 className="fw-bold mb-0">
                <MdTimer className="me-2" />
                Productivity Metrics
              </h5>
            </div>
            <div className="bk-card-body">
              <div className="row">
                <div className="col-md-3">
                  <div className="text-center p-3">
                    <h4 className="mb-1 fw-bold">{performance?.tasksCompleted || 0}</h4>
                    <p className="mb-0 text-muted small">Tasks Completed</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3">
                    <h4 className="mb-1 fw-bold">{performance?.contactAttempts || 0}</h4>
                    <p className="mb-0 text-muted small">Contact Attempts</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3">
                    <h4 className="mb-1 fw-bold">{performance?.daysWithOverdue || 0}</h4>
                    <p className="mb-0 text-muted small">Days with Overdue Tasks</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3">
                    <h4 className="mb-1 fw-bold">{performance?.efficiencyScore || 0}%</h4>
                    <p className="mb-0 text-muted small">Efficiency Score</p>
                  </div>
                </div>
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

        {/* Leaderboard & Peer Comparison */}
        <div className="col-lg-4 mb-4">
          <div className="bk-card mb-4">
            <div className="bk-card-header">
              <h5 className="fw-bold mb-0">
                <MdEmojiEvents className="me-2" />
                Leaderboard
              </h5>
            </div>
            <div className="bk-card-body">
              <div className="list-group list-group-flush">
                {leaderboard.length > 0 ? (
                  leaderboard.map((officer, index) => (
                    <div
                      key={index}
                      className={`list-group-item d-flex justify-content-between align-items-center ${
                        officer.name === (user?.name || 'You') ? 'bg-primary bg-opacity-10' : ''
                      }`}
                    >
                      <div className="d-flex align-items-center">
                        <span className={`badge me-2 ${
                          index === 0 ? 'bg-warning' :
                          index === 1 ? 'bg-secondary' :
                          index === 2 ? 'bg-info' : 'bg-primary'
                        }`}>
                          #{officer.rank}
                        </span>
                        <span>{officer.name}</span>
                        {officer.name === (user?.name || 'You') && (
                          <span className="badge bg-info ms-2">You</span>
                        )}
                      </div>
                      <span className="fw-bold">{officer.retentionRate}%</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-3 text-muted">
                    <p>No leaderboard data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Peer Comparison */}
          <div className="bk-card">
            <div className="bk-card-header">
              <h5 className="fw-bold mb-0">
                <MdPeople className="me-2" />
                Peer Comparison
              </h5>
            </div>
            <div className="bk-card-body">
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Your Retention Rate</span>
                  <strong>{performance?.retentionRate || 0}%</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Department Average</span>
                  <strong>{performance?.departmentAverage || 0}%</strong>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className={`progress-bar ${
                      (performance?.retentionRate || 0) >= (performance?.departmentAverage || 0)
                        ? 'bg-success' : 'bg-warning'
                    }`}
                    role="progressbar"
                    style={{
                      width: `${Math.min(100, ((performance?.retentionRate || 0) / 100) * 100)}%`
                    }}
                  />
                </div>
              </div>
              <div className="mt-3">
                <small className="text-muted">
                  {performance?.retentionRate >= performance?.departmentAverage
                    ? '✓ Above average performance'
                    : 'Below department average'}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Suggestions */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="bk-card">
            <div className="bk-card-header">
              <h5 className="fw-bold mb-0">
                <MdLightbulb className="me-2" />
                AI-Generated Growth Suggestions
              </h5>
            </div>
            <div className="bk-card-body">
              <div className="list-group list-group-flush">
                <div className="list-group-item">
                  <div className="d-flex align-items-start">
                    <MdLightbulb className="text-warning me-3 mt-1" size={20} />
                    <div>
                      <h6 className="mb-1">Improve Follow-up Speed</h6>
                      <p className="mb-0 text-muted small">
                        Your average response time is {performance?.avgResponseTime || 0} hours. 
                        Reducing this to under 24 hours could improve retention rates by up to 15%.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="list-group-item">
                  <div className="d-flex align-items-start">
                    <MdLightbulb className="text-warning me-3 mt-1" size={20} />
                    <div>
                      <h6 className="mb-1">Focus More on Medium-Risk Customers</h6>
                      <p className="mb-0 text-muted small">
                        Medium-risk customers show higher conversion rates. Consider allocating 
                        30% more time to this segment for better ROI.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="list-group-item">
                  <div className="d-flex align-items-start">
                    <MdLightbulb className="text-warning me-3 mt-1" size={20} />
                    <div>
                      <h6 className="mb-1">Increase Digital Engagement Education</h6>
                      <p className="mb-0 text-muted small">
                        Customers with low digital banking usage have 40% higher churn risk. 
                        Offering digital training could reduce churn by 25%.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="list-group-item">
                  <div className="d-flex align-items-start">
                    <MdLightbulb className="text-warning me-3 mt-1" size={20} />
                    <div>
                      <h6 className="mb-1">Leverage Incentive Hub More Frequently</h6>
                      <p className="mb-0 text-muted small">
                        Incentives show 3x ROI when offered proactively. Consider using the 
                        Incentive Hub for at least 5 customers per week.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Successes */}
      <div className="row">
        <div className="col-12">
          <div className="bk-card">
            <div className="bk-card-header">
              <h5 className="fw-bold mb-0">Recent Successes</h5>
            </div>
            <div className="bk-card-body">
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


import React, { useState, useEffect } from 'react';
import api from '../services/api';

const StrategicAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.getStrategicAnalytics();

      if (response.success && response.analytics) {
        setAnalytics(response.analytics);
      } else {
        throw new Error(response.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      alert('Failed to fetch analytics: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold mb-1">Strategic Analytics</h2>
          <p className="text-muted mb-0">Deep-dive analysis with CLV, cohort analysis, and predictive scenarios</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {/* CLV Analysis */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Customer Lifetime Value Analysis</h5>
            </div>
            <div className="card-body">
              {analytics?.customer_lifetime_value && analytics.customer_lifetime_value.length > 0 ? (
                <>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Segment</th>
                          <th>Customer Count</th>
                          <th>Avg Balance</th>
                          <th>Avg Churn Score</th>
                          <th>Total Value</th>
                          <th>Retained</th>
                          <th>At Risk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.customer_lifetime_value.map((clv, index) => (
                          <tr key={index}>
                            <td>{clv.segment}</td>
                            <td>{clv.customer_count.toLocaleString()}</td>
                            <td>RWF {clv.avg_balance.toLocaleString()}</td>
                            <td>{clv.avg_churn_score.toFixed(1)}%</td>
                            <td>RWF {clv.total_value.toLocaleString()}</td>
                            <td><span className="badge bg-success">{clv.retained_customers}</span></td>
                            <td><span className="badge bg-warning">{clv.at_risk_customers}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-center py-3">
                    <p className="text-muted small">CLV distribution chart will be displayed here</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-5">
                  <p className="text-muted">No CLV data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Cohort Analysis */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Cohort Analysis</h5>
            </div>
            <div className="card-body">
              {analytics?.cohort_analysis && analytics.cohort_analysis.length > 0 ? (
                <>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Cohort Month</th>
                          <th>Customers Acquired</th>
                          <th>Avg Churn Score</th>
                          <th>Retained</th>
                          <th>At Risk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.cohort_analysis.map((cohort, index) => (
                          <tr key={index}>
                            <td>{new Date(cohort.cohort_month).toLocaleDateString()}</td>
                            <td>{cohort.customers_acquired}</td>
                            <td>{cohort.avg_churn_score.toFixed(1)}%</td>
                            <td><span className="badge bg-success">{cohort.retained}</span></td>
                            <td><span className="badge bg-warning">{cohort.at_risk}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-center py-3">
                    <p className="text-muted small">Cohort retention rate visualization will be displayed here</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-5">
                  <p className="text-muted">No cohort data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Product Affinity */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Product Affinity & Cross-sell Opportunities</h5>
            </div>
            <div className="card-body">
              <div className="text-center py-5">
                <p className="text-muted">Product holding patterns and cross-sell opportunities chart</p>
              </div>
            </div>
          </div>

          {/* Predictive Scenarios */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Predictive Scenarios</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="card">
                    <div className="card-body">
                      <h6>What-if Analysis</h6>
                      <p className="text-muted small">Model intervention impact</p>
                      <div className="mt-3">
                        <label className="form-label small">Intervention Type</label>
                        <select className="form-select form-select-sm">
                          <option>Fee Waiver</option>
                          <option>Product Upgrade</option>
                          <option>Personalized Offer</option>
                        </select>
                      </div>
                      <div className="mt-3">
                        <label className="form-label small">Target Segment</label>
                        <select className="form-select form-select-sm">
                          <option>High Risk Customers</option>
                          <option>Critical Risk Customers</option>
                        </select>
                      </div>
                      <button className="btn btn-sm btn-primary mt-3">Run Scenario</button>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="card">
                    <div className="card-body">
                      <h6>Projected Impact</h6>
                      {analytics?.predictive_scenarios ? (
                        <>
                          <div className="mt-3">
                            <p className="small mb-1">Conservative Scenario</p>
                            <p className="small mb-0">Retention Rate: {(analytics.predictive_scenarios.conservative.retention_rate * 100).toFixed(0)}%</p>
                            <p className="small mb-0">Customers Lost: {analytics.predictive_scenarios.conservative.estimated_customers_lost}</p>
                            <p className="small mb-0">Revenue Retained: RWF {(analytics.predictive_scenarios.conservative.estimated_revenue_retained / 1000000).toFixed(1)}M</p>
                          </div>
                          <div className="mt-3">
                            <p className="small mb-1">Moderate Scenario</p>
                            <p className="small mb-0">Retention Rate: {(analytics.predictive_scenarios.moderate.retention_rate * 100).toFixed(0)}%</p>
                            <p className="small mb-0">Customers Lost: {analytics.predictive_scenarios.moderate.estimated_customers_lost}</p>
                            <p className="small mb-0">Revenue Retained: RWF {(analytics.predictive_scenarios.moderate.estimated_revenue_retained / 1000000).toFixed(1)}M</p>
                          </div>
                          <div className="mt-3">
                            <p className="small mb-1">Aggressive Scenario</p>
                            <p className="small mb-0">Retention Rate: {(analytics.predictive_scenarios.aggressive.retention_rate * 100).toFixed(0)}%</p>
                            <p className="small mb-0">Customers Lost: {analytics.predictive_scenarios.aggressive.estimated_customers_lost}</p>
                            <p className="small mb-0">Revenue Retained: RWF {(analytics.predictive_scenarios.aggressive.estimated_revenue_retained / 1000000).toFixed(1)}M</p>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-3">
                          <p className="text-muted small">No scenario data available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StrategicAnalytics;


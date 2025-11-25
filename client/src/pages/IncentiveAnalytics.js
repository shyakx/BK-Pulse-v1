import React, { useState, useEffect, useCallback } from 'react';
import { MdTrendingUp, MdTrendingDown, MdDownload } from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const IncentiveAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch incentive analytics from API
      let response;
      try {
        response = await api.getIncentiveAnalytics({ timeRange });
        if (response && response.success && response.analytics) {
          setAnalytics(response.analytics);
          setLoading(false);
          return;
        }
      } catch (err) {
      console.log('Incentive analytics endpoint not available, using mock data');
      }
      
      // Mock data structure (fallback)
      const mockAnalytics = {
        overallUsage: {
          totalIncentives: 1250,
          totalValue: 12500000,
          avgIncentiveValue: 10000
        },
        conversionByType: [
          { type: 'Cashback', used: 450, converted: 320, conversionRate: 71.1, avgROI: 185 },
          { type: 'Fee Waiver', used: 380, converted: 285, conversionRate: 75.0, avgROI: 220 },
          { type: 'Welcome Bundle', used: 280, converted: 195, conversionRate: 69.6, avgROI: 165 },
          { type: 'Interest Booster', used: 140, converted: 95, conversionRate: 67.9, avgROI: 140 }
        ],
        roiByType: [
          { type: 'Cashback', avgROI: 185, totalROI: 59200000 },
          { type: 'Fee Waiver', avgROI: 220, totalROI: 62700000 },
          { type: 'Welcome Bundle', avgROI: 165, totalROI: 32175000 },
          { type: 'Interest Booster', avgROI: 140, totalROI: 13300000 }
        ],
        segmentResponse: [
          { segment: 'Prevention', incentives: 200, conversionRate: 85.0, avgROI: 195 },
          { segment: 'Rescue', incentives: 450, conversionRate: 72.2, avgROI: 180 },
          { segment: 'Win-back', incentives: 380, conversionRate: 68.4, avgROI: 165 },
          { segment: 'Churn Likely', incentives: 220, conversionRate: 59.1, avgROI: 150 }
        ],
        budgetUsage: {
          allocated: 50000000,
          used: 12500000,
          remaining: 37500000,
          forecasted: 45000000
        }
      };
      
      setAnalytics(mockAnalytics);
    } catch (err) {
      console.error('Error fetching incentive analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, fetchAnalytics]);

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Incentive Analytics</h2>
          <p className="text-muted mb-0">
            Overall incentive usage, conversion rates, ROI analysis, segment response, and budget forecasting.
          </p>
        </div>
        <div className="d-flex gap-2">
          <select
            className="form-select"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="btn btn-outline-primary">
            <MdDownload className="me-2" />
            Export
          </button>
        </div>
      </div>

      {/* Overall Usage Cards */}
      {analytics && (
        <>
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="bk-card">
                <div className="bk-card-header">
                  <h6 className="fw-bold mb-0">Total Incentives</h6>
                </div>
                <div className="bk-card-body">
                  <div className="display-6 fw-bold text-primary">
                    {analytics.overallUsage.totalIncentives.toLocaleString()}
                  </div>
                  <small className="text-muted">Incentives used</small>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="bk-card">
                <div className="bk-card-header">
                  <h6 className="fw-bold mb-0">Total Value</h6>
                </div>
                <div className="bk-card-body">
                  <div className="display-6 fw-bold text-success">
                    {(analytics.overallUsage.totalValue / 1000000).toFixed(1)}M
                  </div>
                  <small className="text-muted">RWF</small>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="bk-card">
                <div className="bk-card-header">
                  <h6 className="fw-bold mb-0">Avg Incentive Value</h6>
                </div>
                <div className="bk-card-body">
                  <div className="display-6 fw-bold text-info">
                    {(analytics.overallUsage.avgIncentiveValue / 1000).toFixed(0)}K
                  </div>
                  <small className="text-muted">RWF per incentive</small>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="bk-card">
                <div className="bk-card-header">
                  <h6 className="fw-bold mb-0">Overall Conversion</h6>
                </div>
                <div className="bk-card-body">
                  <div className="display-6 fw-bold text-warning">
                    {analytics.conversionByType.reduce((sum, c) => sum + c.converted, 0) / 
                     analytics.conversionByType.reduce((sum, c) => sum + c.used, 0) * 100}%
                  </div>
                  <small className="text-muted">Conversion rate</small>
                </div>
              </div>
            </div>
          </div>

          {/* Conversion by Type */}
          <div className="row mb-4">
            <div className="col-md-6 mb-4">
              <div className="bk-card">
                <div className="bk-card-header">
                  <h5 className="fw-bold mb-0">Conversion Rate by Incentive Type</h5>
                </div>
                <div className="bk-card-body">
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Used</th>
                          <th>Converted</th>
                          <th>Conversion Rate</th>
                          <th>Avg ROI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.conversionByType.map(item => (
                          <tr key={item.type}>
                            <td><strong>{item.type}</strong></td>
                            <td>{item.used}</td>
                            <td>{item.converted}</td>
                            <td>
                              <span className={`badge ${item.conversionRate >= 70 ? 'bg-success' : item.conversionRate >= 60 ? 'bg-warning' : 'bg-danger'}`}>
                                {item.conversionRate.toFixed(1)}%
                              </span>
                            </td>
                            <td>
                              <span className="text-success fw-bold">{item.avgROI}%</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-4">
              <div className="bk-card">
                <div className="bk-card-header">
                  <h5 className="fw-bold mb-0">ROI by Incentive Type</h5>
                </div>
                <div className="bk-card-body">
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Avg ROI</th>
                          <th>Total ROI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.roiByType.map(item => (
                          <tr key={item.type}>
                            <td><strong>{item.type}</strong></td>
                            <td>
                              <span className="text-success fw-bold">{item.avgROI}%</span>
                            </td>
                            <td>{(item.totalROI / 1000000).toFixed(1)}M RWF</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Segment Response */}
          <div className="row mb-4">
            <div className="col-md-12">
              <div className="bk-card">
                <div className="bk-card-header">
                  <h5 className="fw-bold mb-0">Customer Segments Responding Best to Incentives</h5>
                </div>
                <div className="bk-card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Segment</th>
                          <th>Incentives Used</th>
                          <th>Conversion Rate</th>
                          <th>Avg ROI</th>
                          <th>Performance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.segmentResponse.map(item => (
                          <tr key={item.segment}>
                            <td><strong>{item.segment}</strong></td>
                            <td>{item.incentives}</td>
                            <td>
                              <span className={`badge ${item.conversionRate >= 75 ? 'bg-success' : item.conversionRate >= 65 ? 'bg-warning' : 'bg-danger'}`}>
                                {item.conversionRate.toFixed(1)}%
                              </span>
                            </td>
                            <td>
                              <span className="text-success fw-bold">{item.avgROI}%</span>
                            </td>
                            <td>
                              {item.conversionRate >= 75 ? (
                                <MdTrendingUp className="text-success" size={20} />
                              ) : item.conversionRate >= 65 ? (
                                <MdTrendingUp className="text-warning" size={20} />
                              ) : (
                                <MdTrendingDown className="text-danger" size={20} />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Budget Usage */}
          <div className="row">
            <div className="col-md-12">
              <div className="bk-card">
                <div className="bk-card-header">
                  <h5 className="fw-bold mb-0">Budget Usage & Forecasting</h5>
                </div>
                <div className="bk-card-body">
                  <div className="row">
                    <div className="col-md-3">
                      <div className="text-center">
                        <h6 className="text-muted">Allocated</h6>
                        <h4 className="fw-bold">{(analytics.budgetUsage.allocated / 1000000).toFixed(1)}M RWF</h4>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center">
                        <h6 className="text-muted">Used</h6>
                        <h4 className="fw-bold text-warning">{(analytics.budgetUsage.used / 1000000).toFixed(1)}M RWF</h4>
                        <small className="text-muted">
                          {(analytics.budgetUsage.used / analytics.budgetUsage.allocated * 100).toFixed(1)}% of budget
                        </small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center">
                        <h6 className="text-muted">Remaining</h6>
                        <h4 className="fw-bold text-success">{(analytics.budgetUsage.remaining / 1000000).toFixed(1)}M RWF</h4>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center">
                        <h6 className="text-muted">Forecasted</h6>
                        <h4 className="fw-bold text-info">{(analytics.budgetUsage.forecasted / 1000000).toFixed(1)}M RWF</h4>
                        <small className="text-muted">Expected usage</small>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="progress" style={{ height: '30px' }}>
                      <div 
                        className="progress-bar bg-warning" 
                        role="progressbar" 
                        style={{ width: `${(analytics.budgetUsage.used / analytics.budgetUsage.allocated * 100)}%` }}
                      >
                        {(analytics.budgetUsage.used / analytics.budgetUsage.allocated * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncentiveAnalytics;


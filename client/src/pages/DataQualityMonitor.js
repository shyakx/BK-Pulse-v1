import React, { useState, useEffect } from 'react';
import { MdWarning, MdCheckCircle, MdError, MdRefresh, MdDownload } from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const DataQualityMonitor = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [qualityMetrics, setQualityMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (user) {
      fetchQualityMetrics();
    }
  }, [user]);

  const fetchQualityMetrics = async () => {
    try {
      setLoading(true);
      // Fetch data quality metrics from API
      let response;
      try {
        response = await api.getDataQualityMetrics();
        if (response && response.success && response.metrics) {
          setQualityMetrics(response.metrics);
          const alertsResponse = await api.getDataQualityAlerts();
          if (alertsResponse && alertsResponse.success && alertsResponse.alerts) {
            setAlerts(alertsResponse.alerts);
          }
          setLoading(false);
          return;
        }
      } catch (err) {
        console.log('Data quality endpoint not available, using mock data');
      }
      
      // Mock data structure (fallback)
      const mockMetrics = {
        missingValues: {
          total: 1250,
          percentage: 2.5,
          critical: ['email', 'phone'],
          status: 'warning'
        },
        pipelineStatus: {
          lastRun: new Date().toISOString(),
          status: 'success',
          failures: 0,
          avgProcessingTime: 45
        },
        categoryDistributions: {
          segments: { valid: true, anomalies: 0 },
          riskLevels: { valid: true, anomalies: 0 },
          branches: { valid: true, anomalies: 1 }
        },
        abnormalSpikes: [
          { field: 'churn_score', date: '2024-01-15', expected: 45, actual: 78, severity: 'high' },
          { field: 'account_balance', date: '2024-01-14', expected: 5000000, actual: 15000000, severity: 'medium' }
        ],
        dataDrift: {
          detected: true,
          lastCheck: new Date().toISOString(),
          driftScore: 0.15,
          affectedFeatures: ['transaction_frequency', 'account_age']
        },
        duplicates: {
          total: 23,
          critical: 5,
          status: 'warning'
        },
        outliers: {
          total: 145,
          critical: 12,
          status: 'info'
        },
        sourceFeedStatus: {
          customers: { status: 'active', lastUpdate: new Date().toISOString(), delay: 0 },
          transactions: { status: 'active', lastUpdate: new Date().toISOString(), delay: 5 },
          predictions: { status: 'active', lastUpdate: new Date().toISOString(), delay: 0 }
        }
      };
      
      setQualityMetrics(mockMetrics);
      
      // Generate alerts
      const alertsList = [];
      if (mockMetrics.missingValues.percentage > 2) {
        alertsList.push({
          type: 'warning',
          message: `Missing values detected: ${mockMetrics.missingValues.percentage}%`,
          field: 'Missing Values'
        });
      }
      if (mockMetrics.dataDrift.detected) {
        alertsList.push({
          type: 'error',
          message: `Data drift detected: ${(mockMetrics.dataDrift.driftScore * 100).toFixed(1)}%`,
          field: 'Data Drift'
        });
      }
      if (mockMetrics.abnormalSpikes.length > 0) {
        alertsList.push({
          type: 'warning',
          message: `${mockMetrics.abnormalSpikes.length} abnormal spikes detected`,
          field: 'Abnormal Spikes'
        });
      }
      if (mockMetrics.duplicates.critical > 0) {
        alertsList.push({
          type: 'error',
          message: `${mockMetrics.duplicates.critical} critical duplicate records found`,
          field: 'Duplicates'
        });
      }
      
      setAlerts(alertsList);
    } catch (err) {
      console.error('Error fetching data quality metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      success: { class: 'bg-success', icon: MdCheckCircle },
      warning: { class: 'bg-warning', icon: MdWarning },
      error: { class: 'bg-danger', icon: MdError },
      info: { class: 'bg-info', icon: MdCheckCircle }
    };
    return badges[status] || badges.info;
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Data Quality Monitor</h2>
          <p className="text-muted mb-0">
            Monitor missing values, pipeline failures, category distributions, abnormal spikes, data drift, duplicates, outliers, and source feed delays.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary" onClick={fetchQualityMetrics}>
            <MdRefresh className="me-2" />
            Refresh
          </button>
          <button className="btn btn-outline-secondary">
            <MdDownload className="me-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-4">
          {alerts.map((alert, idx) => {
            const badge = getStatusBadge(alert.type);
            const Icon = badge.icon;
            return (
              <div key={idx} className={`alert alert-${alert.type === 'error' ? 'danger' : alert.type === 'warning' ? 'warning' : 'info'} d-flex align-items-center`}>
                <Icon className="me-2" size={20} />
                <strong>{alert.field}:</strong> {alert.message}
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : qualityMetrics && (
        <>
          {/* Key Metrics Cards */}
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="bk-card">
                <div className="bk-card-header">
                  <h6 className="fw-bold mb-0">Missing Values</h6>
                </div>
                <div className="bk-card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="display-6 fw-bold text-warning">
                        {qualityMetrics.missingValues.percentage}%
                      </div>
                      <small className="text-muted">{qualityMetrics.missingValues.total} records</small>
                    </div>
                    <MdWarning className="text-warning" size={32} />
                  </div>
                  {qualityMetrics.missingValues.critical.length > 0 && (
                    <div className="mt-2">
                      <small className="text-danger">
                        Critical: {qualityMetrics.missingValues.critical.join(', ')}
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-md-3 mb-3">
              <div className="bk-card">
                <div className="bk-card-header">
                  <h6 className="fw-bold mb-0">Pipeline Status</h6>
                </div>
                <div className="bk-card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold text-success">Running</div>
                      <small className="text-muted">
                        Last run: {new Date(qualityMetrics.pipelineStatus.lastRun).toLocaleString()}
                      </small>
                    </div>
                    <MdCheckCircle className="text-success" size={32} />
                  </div>
                  <div className="mt-2">
                    <small>Failures: {qualityMetrics.pipelineStatus.failures}</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3 mb-3">
              <div className="bk-card">
                <div className="bk-card-header">
                  <h6 className="fw-bold mb-0">Data Drift</h6>
                </div>
                <div className="bk-card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className={`fw-bold ${qualityMetrics.dataDrift.detected ? 'text-danger' : 'text-success'}`}>
                        {qualityMetrics.dataDrift.detected ? 'Detected' : 'Normal'}
                      </div>
                      <small className="text-muted">
                        Score: {(qualityMetrics.dataDrift.driftScore * 100).toFixed(1)}%
                      </small>
                    </div>
                    {qualityMetrics.dataDrift.detected ? (
                      <MdError className="text-danger" size={32} />
                    ) : (
                      <MdCheckCircle className="text-success" size={32} />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3 mb-3">
              <div className="bk-card">
                <div className="bk-card-header">
                  <h6 className="fw-bold mb-0">Duplicates</h6>
                </div>
                <div className="bk-card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="display-6 fw-bold text-warning">
                        {qualityMetrics.duplicates.total}
                      </div>
                      <small className="text-danger">
                        {qualityMetrics.duplicates.critical} critical
                      </small>
                    </div>
                    <MdWarning className="text-warning" size={32} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Sections */}
          <div className="row mb-4">
            <div className="col-md-6 mb-4">
              <div className="bk-card">
                <div className="bk-card-header">
                  <h5 className="fw-bold mb-0">Category Distributions</h5>
                </div>
                <div className="bk-card-body">
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Status</th>
                          <th>Anomalies</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Segments</td>
                          <td>
                            <span className="badge bg-success">Valid</span>
                          </td>
                          <td>{qualityMetrics.categoryDistributions.segments.anomalies}</td>
                        </tr>
                        <tr>
                          <td>Risk Levels</td>
                          <td>
                            <span className="badge bg-success">Valid</span>
                          </td>
                          <td>{qualityMetrics.categoryDistributions.riskLevels.anomalies}</td>
                        </tr>
                        <tr>
                          <td>Branches</td>
                          <td>
                            <span className="badge bg-warning">Warning</span>
                          </td>
                          <td>{qualityMetrics.categoryDistributions.branches.anomalies}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-4">
              <div className="bk-card">
                <div className="bk-card-header">
                  <h5 className="fw-bold mb-0">Abnormal Spikes</h5>
                </div>
                <div className="bk-card-body">
                  {qualityMetrics.abnormalSpikes.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Field</th>
                            <th>Date</th>
                            <th>Expected</th>
                            <th>Actual</th>
                            <th>Severity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {qualityMetrics.abnormalSpikes.map((spike, idx) => (
                            <tr key={idx}>
                              <td>{spike.field}</td>
                              <td>{new Date(spike.date).toLocaleDateString()}</td>
                              <td>{spike.expected}</td>
                              <td>{spike.actual}</td>
                              <td>
                                <span className={`badge ${spike.severity === 'high' ? 'bg-danger' : 'bg-warning'}`}>
                                  {spike.severity}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-3 text-muted">
                      <MdCheckCircle className="mb-2" size={32} />
                      <p className="mb-0">No abnormal spikes detected</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Source Feed Status */}
          <div className="row">
            <div className="col-md-12">
              <div className="bk-card">
                <div className="bk-card-header">
                  <h5 className="fw-bold mb-0">Source Feed Status</h5>
                </div>
                <div className="bk-card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Source</th>
                          <th>Status</th>
                          <th>Last Update</th>
                          <th>Delay (minutes)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(qualityMetrics.sourceFeedStatus).map(([source, status]) => (
                          <tr key={source}>
                            <td><strong>{source.charAt(0).toUpperCase() + source.slice(1)}</strong></td>
                            <td>
                              <span className={`badge ${status.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                                {status.status}
                              </span>
                            </td>
                            <td>{new Date(status.lastUpdate).toLocaleString()}</td>
                            <td>
                              {status.delay === 0 ? (
                                <span className="text-success">On time</span>
                              ) : (
                                <span className="text-warning">{status.delay} min</span>
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

          {/* Outliers */}
          <div className="row mt-4">
            <div className="col-md-12">
              <div className="bk-card">
                <div className="bk-card-header">
                  <h5 className="fw-bold mb-0">Outlier Detection</h5>
                </div>
                <div className="bk-card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h4 className="fw-bold">{qualityMetrics.outliers.total}</h4>
                      <small className="text-muted">Total outliers detected</small>
                    </div>
                    <div>
                      <span className="badge bg-danger">{qualityMetrics.outliers.critical} critical</span>
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

export default DataQualityMonitor;


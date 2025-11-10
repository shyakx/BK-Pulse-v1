import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { MdRefresh, MdCheckCircle, MdCancel, MdBarChart, MdWarning } from 'react-icons/md';

const ModelValidation = () => {
  const [metrics, setMetrics] = useState(null);
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingComparisons, setLoadingComparisons] = useState(false);
  const [filters, setFilters] = useState({ segment: '', risk_level: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getModelValidationMetrics();
      if (response.success) {
        setMetrics(response.metrics);
      }
    } catch (error) {
      console.error('Error fetching validation metrics:', error);
      alert('Failed to load validation metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchComparisons = useCallback(async () => {
    try {
      setLoadingComparisons(true);
      const params = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        ...(filters.segment && { segment: filters.segment }),
        ...(filters.risk_level && { risk_level: filters.risk_level })
      };
      const response = await api.getModelValidationComparison(params);
      if (response.success) {
        setComparisons(response.comparisons || []);
      }
    } catch (error) {
      console.error('Error fetching comparisons:', error);
    } finally {
      setLoadingComparisons(false);
    }
  }, [filters, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    fetchComparisons();
  }, [fetchComparisons]);

  const getMetricColor = (value) => {
    if (value >= 80) return 'success';
    if (value >= 60) return 'warning';
    return 'danger';
  };

  const getStatusBadge = (status) => {
    if (status === 'correct') {
      return <span className="badge bg-success"><MdCheckCircle className="me-1" />Correct</span>;
    }
    return <span className="badge bg-danger"><MdCancel className="me-1" />Incorrect</span>;
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

  if (!metrics) {
    return (
      <div className="alert alert-warning">
        <MdWarning className="me-2" />
        No validation data available. Please ensure predictions have been run and actual churn flags are imported.
      </div>
    );
  }

  const confusionMatrix = metrics.confusion_matrix || {};
  const total = metrics.total || 0;

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold mb-1">Model Validation & Accuracy</h2>
          <p className="text-muted mb-0">
            Compare predictions vs actual churn outcomes to validate model accuracy
          </p>
        </div>
        <button className="btn btn-outline-primary" onClick={fetchMetrics}>
          <MdRefresh className="me-2" />
          Refresh
        </button>
      </div>

      {/* Overall Metrics */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className={`card border-${getMetricColor(metrics.accuracy)}`}>
            <div className="card-body text-center">
              <h2 className={`text-${getMetricColor(metrics.accuracy)}`}>
                {metrics.accuracy.toFixed(2)}%
              </h2>
              <p className="text-muted mb-0">Accuracy</p>
              <small className="text-muted">
                {confusionMatrix.true_positive + confusionMatrix.true_negative} / {total} correct
              </small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className={`card border-${getMetricColor(metrics.precision)}`}>
            <div className="card-body text-center">
              <h2 className={`text-${getMetricColor(metrics.precision)}`}>
                {metrics.precision.toFixed(2)}%
              </h2>
              <p className="text-muted mb-0">Precision</p>
              <small className="text-muted">
                True positives / (True + False positives)
              </small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className={`card border-${getMetricColor(metrics.recall)}`}>
            <div className="card-body text-center">
              <h2 className={`text-${getMetricColor(metrics.recall)}`}>
                {metrics.recall.toFixed(2)}%
              </h2>
              <p className="text-muted mb-0">Recall</p>
              <small className="text-muted">
                True positives / (True + False negatives)
              </small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className={`card border-${getMetricColor(metrics.f1_score)}`}>
            <div className="card-body text-center">
              <h2 className={`text-${getMetricColor(metrics.f1_score)}`}>
                {metrics.f1_score.toFixed(2)}%
              </h2>
              <p className="text-muted mb-0">F1 Score</p>
              <small className="text-muted">
                Harmonic mean of precision & recall
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Confusion Matrix */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0"><MdBarChart className="me-2" />Confusion Matrix</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th></th>
                    <th className="text-center">Predicted: Churn</th>
                    <th className="text-center">Predicted: No Churn</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="fw-bold">Actual: Churned</td>
                    <td className="text-center bg-success bg-opacity-25">
                      <strong>{confusionMatrix.true_positive || 0}</strong>
                      <br />
                      <small className="text-muted">True Positive</small>
                    </td>
                    <td className="text-center bg-danger bg-opacity-25">
                      <strong>{confusionMatrix.false_negative || 0}</strong>
                      <br />
                      <small className="text-muted">False Negative</small>
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Actual: Not Churned</td>
                    <td className="text-center bg-danger bg-opacity-25">
                      <strong>{confusionMatrix.false_positive || 0}</strong>
                      <br />
                      <small className="text-muted">False Positive</small>
                    </td>
                    <td className="text-center bg-success bg-opacity-25">
                      <strong>{confusionMatrix.true_negative || 0}</strong>
                      <br />
                      <small className="text-muted">True Negative</small>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="col-md-6">
              <div className="p-3">
                <h6>Interpretation:</h6>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <strong className="text-success">True Positive ({confusionMatrix.true_positive || 0}):</strong>
                    <br />
                    <small>Correctly predicted churners</small>
                  </li>
                  <li className="mb-2">
                    <strong className="text-success">True Negative ({confusionMatrix.true_negative || 0}):</strong>
                    <br />
                    <small>Correctly predicted non-churners</small>
                  </li>
                  <li className="mb-2">
                    <strong className="text-danger">False Positive ({confusionMatrix.false_positive || 0}):</strong>
                    <br />
                    <small>Incorrectly predicted as churners (Type I error)</small>
                  </li>
                  <li className="mb-2">
                    <strong className="text-danger">False Negative ({confusionMatrix.false_negative || 0}):</strong>
                    <br />
                    <small>Missed churners (Type II error)</small>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Score Distribution */}
      {metrics.score_distribution && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Churn Score Distribution vs Actual Churn Rate</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Score Range</th>
                    <th className="text-center">Total Customers</th>
                    <th className="text-center">Actually Churned</th>
                    <th className="text-center">Churn Rate</th>
                    <th className="text-center">Visual</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.score_distribution.map((dist, idx) => (
                    <tr key={idx}>
                      <td><strong>{dist.range}</strong></td>
                      <td className="text-center">{dist.total.toLocaleString()}</td>
                      <td className="text-center">{dist.churned.toLocaleString()}</td>
                      <td className="text-center">
                        <span className={`badge bg-${dist.churn_rate > 0.5 ? 'danger' : dist.churn_rate > 0.3 ? 'warning' : 'success'}`}>
                          {(dist.churn_rate * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <div className="progress" style={{ height: '20px' }}>
                          <div
                            className={`progress-bar ${dist.churn_rate > 0.5 ? 'bg-danger' : dist.churn_rate > 0.3 ? 'bg-warning' : 'bg-success'}`}
                            role="progressbar"
                            style={{ width: `${dist.churn_rate * 100}%` }}
                          >
                            {(dist.churn_rate * 100).toFixed(1)}%
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Performance by Risk Level */}
      {metrics.by_risk_level && Object.keys(metrics.by_risk_level).length > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Performance by Risk Level</h5>
          </div>
          <div className="card-body">
            <div className="row">
              {Object.entries(metrics.by_risk_level).map(([risk, data]) => (
                <div key={risk} className="col-md-4 mb-3">
                  <div className="card">
                    <div className="card-body">
                      <h6 className="text-capitalize mb-3">{risk} Risk</h6>
                      <div className="mb-2">
                        <small className="text-muted">Accuracy:</small>
                        <strong className="float-end">{data.accuracy.toFixed(1)}%</strong>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">Precision:</small>
                        <strong className="float-end">{data.precision.toFixed(1)}%</strong>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">Recall:</small>
                        <strong className="float-end">{data.recall.toFixed(1)}%</strong>
                      </div>
                      <div className="mt-3 pt-3 border-top">
                        <small className="text-muted">Total: {data.total}</small>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Comparisons */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Detailed Comparison</h5>
          <div className="d-flex gap-2">
            <select
              className="form-select form-select-sm"
              value={filters.segment}
              onChange={(e) => {
                setFilters({ ...filters, segment: e.target.value });
                setCurrentPage(1);
              }}
              style={{ width: '150px' }}
            >
              <option value="">All Segments</option>
              <option value="retail">Retail</option>
              <option value="sme">SME</option>
              <option value="corporate">Corporate</option>
              <option value="institutional_banking">Institutional</option>
            </select>
            <select
              className="form-select form-select-sm"
              value={filters.risk_level}
              onChange={(e) => {
                setFilters({ ...filters, risk_level: e.target.value });
                setCurrentPage(1);
              }}
              style={{ width: '150px' }}
            >
              <option value="">All Risk Levels</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div className="card-body">
          {loadingComparisons ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Customer ID</th>
                      <th>Name</th>
                      <th>Segment</th>
                      <th>Predicted Score</th>
                      <th>Risk Level</th>
                      <th>Predicted</th>
                      <th>Actual</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisons.map((comp, idx) => (
                      <tr key={idx}>
                        <td>{comp.customer_id}</td>
                        <td>{comp.name || 'N/A'}</td>
                        <td>
                          <span className="badge bg-info">{comp.segment || 'N/A'}</span>
                        </td>
                        <td>
                          <strong>{parseFloat(comp.churn_score || 0).toFixed(1)}%</strong>
                        </td>
                        <td>
                          <span className={`badge bg-${comp.risk_level === 'high' ? 'danger' : comp.risk_level === 'medium' ? 'warning' : 'success'}`}>
                            {comp.risk_level || 'N/A'}
                          </span>
                        </td>
                        <td>
                          {comp.predicted_churn ? (
                            <span className="badge bg-danger">Churn</span>
                          ) : (
                            <span className="badge bg-success">No Churn</span>
                          )}
                        </td>
                        <td>
                          {comp.actual_churn_flag ? (
                            <span className="badge bg-danger">Churned</span>
                          ) : (
                            <span className="badge bg-success">Not Churned</span>
                          )}
                        </td>
                        <td>{getStatusBadge(comp.prediction_status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {comparisons.length === 0 && (
                <div className="text-center py-4 text-muted">
                  No comparison data available
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelValidation;


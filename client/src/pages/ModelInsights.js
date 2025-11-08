import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { MdRefresh, MdWarning } from 'react-icons/md';

const ModelInsights = () => {
  const location = useLocation();
  const [modelMetrics, setModelMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const isExplainabilityPage = location.pathname.includes('/explainability');

  useEffect(() => {
    fetchModelMetrics();
  }, []);

  const fetchModelMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch real model info from API
      const response = await api.getModelInfo();
      
      if (response.success && response.model) {
        const model = response.model;
        setModelMetrics({
          accuracy: model.metrics?.accuracy ? (model.metrics.accuracy * 100) : 0,
          precision: model.metrics?.precision ? (model.metrics.precision * 100) : 0,
          recall: model.metrics?.recall ? (model.metrics.recall * 100) : 0,
          f1Score: model.metrics?.f1_score ? (model.metrics.f1_score * 100) : 0,
          aucRoc: model.metrics?.roc_auc ? (model.metrics.roc_auc * 100) : 0,
          lastTrainingDate: model.performance_history?.[0]?.evaluation_date || new Date().toISOString(),
          modelVersion: model.version || 'unknown',
          featureImportance: model.feature_importance || model.featureImportance || []
        });
      } else {
        throw new Error('Failed to fetch model information');
      }
    } catch (err) {
      console.error('Error fetching model metrics:', err);
      // Fallback to mock data on error
      setModelMetrics({
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        aucRoc: 0,
        lastTrainingDate: new Date().toISOString(),
        modelVersion: 'unknown',
        featureImportance: []
      });
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
          <h2 className="fw-bold mb-1">
            {isExplainabilityPage 
              ? 'Explainability & Compliance' 
              : 'Model Performance Dashboard'}
          </h2>
          <p className="text-muted mb-0">
            {isExplainabilityPage
              ? 'Understand why the model made a prediction. Ensure decisions are fair, auditable, and regulator-friendly.'
              : 'Track model health and accuracy. Ensure predictions remain reliable; alert if performance drops.'}
          </p>
        </div>
        <button className="btn btn-outline-primary" onClick={fetchModelMetrics}>
          <MdRefresh className="me-2" />
          Refresh
        </button>
      </div>

      {/* Model Metrics Dashboard */}
      <div className="row mb-4">
        <div className="col-md-2 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <h4>{modelMetrics?.accuracy.toFixed(1)}%</h4>
              <p className="text-muted small mb-0">Accuracy</p>
            </div>
          </div>
        </div>
        <div className="col-md-2 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <h4>{modelMetrics?.precision.toFixed(1)}%</h4>
              <p className="text-muted small mb-0">Precision</p>
            </div>
          </div>
        </div>
        <div className="col-md-2 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <h4>{modelMetrics?.recall.toFixed(1)}%</h4>
              <p className="text-muted small mb-0">Recall</p>
            </div>
          </div>
        </div>
        <div className="col-md-2 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <h4>{modelMetrics?.f1Score.toFixed(1)}%</h4>
              <p className="text-muted small mb-0">F1-Score</p>
            </div>
          </div>
        </div>
        <div className="col-md-2 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <h4>{modelMetrics?.aucRoc.toFixed(1)}%</h4>
              <p className="text-muted small mb-0">AUC-ROC</p>
            </div>
          </div>
        </div>
        <div className="col-md-2 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <p className="text-muted small mb-1">Version</p>
              <h6>{modelMetrics?.modelVersion}</h6>
              <p className="text-muted small mb-0">
                {modelMetrics && new Date(modelMetrics.lastTrainingDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Over Time */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Performance Over Time</h5>
        </div>
        <div className="card-body">
          <div className="text-center py-5">
            <p className="text-muted">Line chart showing metrics trend over 6 months</p>
          </div>
        </div>
      </div>

      {/* Feature Importance */}
      <div className="row mb-4">
        <div className="col-md-6 mb-3">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Top 20 Feature Importance</h5>
            </div>
            <div className="card-body">
              {modelMetrics?.featureImportance && (
                <div>
                  {modelMetrics.featureImportance.slice(0, 5).map((item, index) => (
                    <div key={index} className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span>{item.feature}</span>
                        <span className="fw-bold">{(item.importance * 100).toFixed(1)}%</span>
                      </div>
                      <div className="progress" style={{ height: '20px' }}>
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{ width: `${item.importance * 100}%` }}
                        >
                          {(item.importance * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-3">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Confusion Matrix</h5>
            </div>
            <div className="card-body">
              <div className="text-center py-5">
                <p className="text-muted">2x2 confusion matrix visualization</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction Distribution */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Prediction Distribution</h5>
        </div>
        <div className="card-body">
          <div className="text-center py-5">
            <p className="text-muted">Histogram of churn probabilities showing model calibration</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {modelMetrics?.featureImportance && modelMetrics.featureImportance.length === 0 && (
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">Model Alerts</h5>
          </div>
          <div className="card-body">
            <div className="alert alert-info">
              <MdWarning className="me-2" />
              <strong>Note:</strong> Feature importance data is not available. This may require model retraining or feature extraction.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelInsights;

import React, { useState, useEffect } from 'react';
import { MdRefresh, MdAssessment } from 'react-icons/md';
import api from '../services/api';

const AdminModels = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await api.getAdminModels();
      if (response.success) {
        setModels(response.models || []);
      }
    } catch (err) {
      console.error('Error fetching models:', err);
      alert('Failed to fetch models: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getMetricBadge = (metricName, value) => {
    if (metricName === 'accuracy' || metricName === 'precision' || metricName === 'recall' || metricName === 'f1_score') {
      if (value >= 0.9) return 'bg-success';
      if (value >= 0.8) return 'bg-info';
      if (value >= 0.7) return 'bg-warning';
      return 'bg-danger';
    }
    return 'bg-secondary';
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Model Management</h2>
          <p className="text-muted mb-0">Register, deploy, rollback models, monitor performance metrics</p>
        </div>
        <button className="btn btn-primary" onClick={fetchModels}>
          <MdRefresh className="me-2" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : models.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <MdAssessment className="text-muted mb-3" style={{ fontSize: '3rem' }} />
            <p className="text-muted">No models registered yet</p>
            <p className="text-muted small">Model performance metrics will appear here once models are evaluated</p>
          </div>
        </div>
      ) : (
        models.map((model, index) => (
          <div key={index} className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Model Version: {model.version}</h5>
                <small className="text-muted">
                  Last Evaluated: {new Date(model.last_evaluated).toLocaleString()}
                </small>
              </div>
              <span className="badge bg-primary">Active</span>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Segment</th>
                      <th>Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.metrics.map((metric, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{metric.name.replace('_', ' ').toUpperCase()}</strong>
                        </td>
                        <td>{metric.segment || 'Overall'}</td>
                        <td>
                          {metric.name === 'accuracy' || metric.name === 'precision' || 
                           metric.name === 'recall' || metric.name === 'f1_score' 
                            ? `${(metric.value * 100).toFixed(2)}%`
                            : metric.value.toFixed(4)}
                        </td>
                        <td>
                          <span className={`badge ${getMetricBadge(metric.name, metric.value)}`}>
                            {metric.value >= 0.9 ? 'Excellent' :
                             metric.value >= 0.8 ? 'Good' :
                             metric.value >= 0.7 ? 'Fair' : 'Poor'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3">
                <button className="btn btn-sm btn-outline-primary me-2">
                  Deploy Model
                </button>
                <button className="btn btn-sm btn-outline-secondary me-2">
                  View Full Metrics
                </button>
                <button className="btn btn-sm btn-outline-danger">
                  Rollback
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AdminModels;

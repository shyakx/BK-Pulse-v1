import React, { useState } from 'react';
import api from '../services/api';
import { MdPlayArrow, MdDownload } from 'react-icons/md';

const BulkPrediction = () => {
  const [segmentType, setSegmentType] = useState('all');
  const [minChurnProb, setMinChurnProb] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const handleRunPrediction = async () => {
    try {
      setProcessing(true);
      
      // Call real API
      const response = await api.batchPredict({ 
        limit: segmentType === 'all' ? 1000 : 100 
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to run predictions');
      }
      
      // Calculate segmentation from results
      const predictions = response.predictions || [];
      const validPredictions = predictions.filter(p => !p.error && p.churn_score !== undefined);
      
      if (validPredictions.length === 0) {
        throw new Error('No valid predictions returned');
      }
      
      const critical = validPredictions.filter(p => p.churn_score >= 70);
      const high = validPredictions.filter(p => p.churn_score >= 50 && p.churn_score < 70);
      const medium = validPredictions.filter(p => p.churn_score >= 40 && p.churn_score < 50);
      const avgChurnProb = validPredictions.reduce((sum, p) => sum + (p.churn_score || 0), 0) / validPredictions.length;
      
      setResults({
        totalAnalyzed: response.total || validPredictions.length,
        predictedChurners: critical.length + high.length,
        avgChurnProb: avgChurnProb.toFixed(1),
        totalAtRiskBalance: 0, // TODO: Calculate from customer balances
        segmentation: {
          critical: { 
            count: critical.length, 
            percent: validPredictions.length > 0 ? ((critical.length / validPredictions.length) * 100).toFixed(2) : 0,
            avgBalance: 0,
            avgProb: critical.length > 0 ? (critical.reduce((sum, p) => sum + p.churn_score, 0) / critical.length).toFixed(1) : 0
          },
          high: { 
            count: high.length, 
            percent: validPredictions.length > 0 ? ((high.length / validPredictions.length) * 100).toFixed(2) : 0,
            avgBalance: 0,
            avgProb: high.length > 0 ? (high.reduce((sum, p) => sum + p.churn_score, 0) / high.length).toFixed(1) : 0
          },
          medium: { 
            count: medium.length, 
            percent: validPredictions.length > 0 ? ((medium.length / validPredictions.length) * 100).toFixed(2) : 0,
            avgBalance: 0,
            avgProb: medium.length > 0 ? (medium.reduce((sum, p) => sum + p.churn_score, 0) / medium.length).toFixed(1) : 0
          },
          low: { count: 0, percent: 0, avgBalance: 0, avgProb: 0 }
        }
      });
    } catch (err) {
      console.error('Prediction error:', err);
      alert('Failed to run prediction: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold mb-1">Bulk Prediction</h2>
          <p className="text-muted mb-0">Run predictions on customer segments</p>
        </div>
      </div>

      {/* Prediction Configuration */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Prediction Configuration</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Segment Selection</label>
              <div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="segmentType"
                    id="all"
                    value="all"
                    checked={segmentType === 'all'}
                    onChange={(e) => setSegmentType(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="all">
                    All Customers
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="segmentType"
                    id="custom"
                    value="custom"
                    checked={segmentType === 'custom'}
                    onChange={(e) => setSegmentType(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="custom">
                    Custom Segment
                  </label>
                </div>
              </div>
            </div>

            {segmentType === 'custom' && (
              <div className="col-md-6 mb-3">
                <label className="form-label">Custom Filters</label>
                <p className="text-muted small">Filter options will appear here</p>
              </div>
            )}

            <div className="col-md-6 mb-3">
              <label className="form-label">
                Minimum Churn Probability: {minChurnProb}%
              </label>
              <input
                type="range"
                className="form-range"
                min="0"
                max="100"
                value={minChurnProb}
                onChange={(e) => setMinChurnProb(e.target.value)}
              />
            </div>
          </div>

          <div className="d-flex justify-content-end mt-4">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleRunPrediction}
              disabled={processing}
            >
              <MdPlayArrow className="me-2" />
              {processing ? 'Processing...' : 'Run Prediction'}
            </button>
          </div>
        </div>
      </div>

      {/* Progress */}
      {processing && (
        <div className="card mb-4">
          <div className="card-body">
            <div className="progress mb-2" style={{ height: '30px' }}>
              <div
                className="progress-bar progress-bar-striped progress-bar-animated"
                role="progressbar"
                style={{ width: '75%' }}
              >
                75%
              </div>
            </div>
            <p className="text-center mb-0">Processing predictions... Please wait.</p>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <>
          {/* Results Summary */}
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="card">
                <div className="card-body text-center">
                  <h3 className="mb-1">{results.totalAnalyzed.toLocaleString()}</h3>
                  <p className="text-muted mb-0 small">Total Analyzed</p>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card">
                <div className="card-body text-center">
                  <h3 className="mb-1 text-warning">{results.predictedChurners.toLocaleString()}</h3>
                  <p className="text-muted mb-0 small">Predicted Churners</p>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card">
                <div className="card-body text-center">
                  <h3 className="mb-1">{results.avgChurnProb.toFixed(1)}%</h3>
                  <p className="text-muted mb-0 small">Avg Churn Probability</p>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card">
                <div className="card-body text-center">
                  <h3 className="mb-1">RWF {Math.round(results.totalAtRiskBalance / 1000000)}M</h3>
                  <p className="text-muted mb-0 small">At-Risk Balance</p>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Segmentation Table */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Risk Segmentation</h5>
              <div>
                <button className="btn btn-sm btn-outline-primary me-2">
                  <MdDownload className="me-1" />
                  CSV
                </button>
                <button className="btn btn-sm btn-outline-primary me-2">
                  <MdDownload className="me-1" />
                  Excel
                </button>
                <button className="btn btn-sm btn-outline-primary">
                  <MdDownload className="me-1" />
                  PDF
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Risk Level</th>
                      <th>Count</th>
                      <th>% of Total</th>
                      <th>Avg Balance</th>
                      <th>Avg Churn Prob</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(results.segmentation).map(([level, data]) => (
                      data.count > 0 && (
                        <tr key={level}>
                          <td>
                            <span className={`badge ${
                              level === 'critical' ? 'bg-danger' :
                              level === 'high' ? 'bg-warning' :
                              level === 'medium' ? 'bg-info' : 'bg-success'
                            }`}>
                              {level.toUpperCase()}
                            </span>
                          </td>
                          <td>{data.count.toLocaleString()}</td>
                          <td>{data.percent.toFixed(2)}%</td>
                          <td>RWF {data.avgBalance.toLocaleString()}</td>
                          <td>{data.avgProb.toFixed(1)}%</td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary">
                              View Customers
                            </button>
                          </td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BulkPrediction;


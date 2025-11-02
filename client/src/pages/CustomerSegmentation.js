import React, { useState, useEffect } from 'react';
import { MdAdd, MdDelete, MdSave } from 'react-icons/md';
import api from '../services/api';

const CustomerSegmentation = () => {
  const [savedSegments, setSavedSegments] = useState([]);
  const [segmentCriteria, setSegmentCriteria] = useState([]);
  const [segmentPreview, setSegmentPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    try {
      const response = await api.getSegments();
      if (response.success) {
        setSavedSegments(response.segments || []);
      }
    } catch (err) {
      console.error('Error fetching segments:', err);
    }
  };

  const handleAddCriterion = () => {
    setSegmentCriteria([...segmentCriteria, {
      id: Date.now(),
      field: 'churn_probability',
      operator: '>=',
      value: '50'
    }]);
  };

  const handleApplySegmentation = async () => {
    if (segmentCriteria.length === 0) {
      alert('Please add at least one criterion');
      return;
    }

    try {
      setLoading(true);
      // Convert criteria to API format
      const criteria = segmentCriteria.map(c => ({
        field: c.field === 'churn_probability' ? 'churn_score' : 
               c.field === 'account_type' ? 'product_type' : c.field.toLowerCase(),
        operator: c.operator === '>=' ? '>=' : 
                 c.operator === '<=' ? '<=' : 
                 c.operator === '>' ? '>' : 
                 c.operator === '<' ? '<' : '=',
        value: c.value
      }));

      const response = await api.createSegment({
        criteria,
        save_segment: false // Just preview for now
      });

      if (response.success && response.preview) {
        setSegmentPreview({
          customerCount: response.preview.customerCount,
          avgBalance: response.preview.avgBalance,
          avgChurnProb: response.preview.avgChurnProb,
          riskDistribution: response.preview.riskDistribution
        });
      } else {
        throw new Error(response.message || 'Failed to apply segmentation');
      }
    } catch (err) {
      console.error('Error applying segmentation:', err);
      alert('Failed to apply segmentation: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSegment = async () => {
    if (!segmentPreview) {
      alert('Please apply segmentation first');
      return;
    }

    const segmentName = prompt('Enter segment name:');
    if (!segmentName) return;

    try {
      setLoading(true);
      const criteria = segmentCriteria.map(c => ({
        field: c.field === 'churn_probability' ? 'churn_score' : 
               c.field === 'account_type' ? 'product_type' : c.field.toLowerCase(),
        operator: c.operator === '>=' ? '>=' : 
                 c.operator === '<=' ? '<=' : 
                 c.operator === '>' ? '>' : 
                 c.operator === '<' ? '<' : '=',
        value: c.value
      }));

      const response = await api.createSegment({
        name: segmentName,
        criteria,
        save_segment: true
      });

      if (response.success) {
        alert('Segment saved successfully!');
        fetchSegments();
      } else {
        throw new Error(response.message || 'Failed to save segment');
      }
    } catch (err) {
      console.error('Error saving segment:', err);
      alert('Failed to save segment: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold mb-1">Customer Segmentation</h2>
          <p className="text-muted mb-0">Analyze customer groups with segmentation builder</p>
        </div>
      </div>

      <div className="row">
        {/* Segmentation Builder */}
        <div className="col-lg-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Segmentation Builder</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Add Criteria</label>
                <div className="mb-3">
                  {segmentCriteria.map((criterion, index) => (
                    <div key={criterion.id} className="d-flex align-items-center gap-2 mb-2">
                      {index > 0 && (
                        <select className="form-select" style={{ width: '80px' }}>
                          <option>AND</option>
                          <option>OR</option>
                        </select>
                      )}
                      <select 
                        className="form-select"
                        value={criterion.field}
                        onChange={(e) => {
                          const updated = [...segmentCriteria];
                          updated[index].field = e.target.value;
                          setSegmentCriteria(updated);
                        }}
                      >
                        <option value="churn_probability">Churn Score</option>
                        <option value="balance">Balance</option>
                        <option value="segment">Segment</option>
                        <option value="account_type">Product Type</option>
                        <option value="branch">Branch</option>
                        <option value="risk_level">Risk Level</option>
                      </select>
                      <select 
                        className="form-select" 
                        style={{ width: '120px' }}
                        value={criterion.operator}
                        onChange={(e) => {
                          const updated = [...segmentCriteria];
                          updated[index].operator = e.target.value;
                          setSegmentCriteria(updated);
                        }}
                      >
                        <option value="&gt;=">&gt;=</option>
                        <option value="&lt;=">&lt;=</option>
                        <option value="=">=</option>
                        <option value="&gt;">&gt;</option>
                        <option value="&lt;">&lt;</option>
                      </select>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Value" 
                        value={criterion.value}
                        onChange={(e) => {
                          const updated = [...segmentCriteria];
                          updated[index].value = e.target.value;
                          setSegmentCriteria(updated);
                        }}
                      />
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => {
                          setSegmentCriteria(segmentCriteria.filter((_, i) => i !== index));
                        }}
                      >
                        <MdDelete />
                      </button>
                    </div>
                  ))}
                </div>
                <button className="btn btn-outline-primary" onClick={handleAddCriterion}>
                  <MdAdd className="me-2" />
                  Add Criterion
                </button>
              </div>

              <div className="mt-4">
                <button 
                  className="btn btn-primary" 
                  onClick={handleApplySegmentation}
                  disabled={loading || segmentCriteria.length === 0}
                >
                  {loading ? 'Processing...' : 'Apply Segmentation'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Segment Preview */}
        <div className="col-lg-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Segment Preview</h5>
            </div>
            <div className="card-body">
              {segmentPreview ? (
                <div>
                  <div className="mb-3">
                    <h4>{segmentPreview.customerCount.toLocaleString()}</h4>
                    <p className="text-muted small mb-0">Customers in Segment</p>
                  </div>
                  <div className="row mb-3">
                    <div className="col-6">
                      <p className="text-muted small mb-1">Avg Balance</p>
                      <h6>RWF {segmentPreview.avgBalance.toLocaleString()}</h6>
                    </div>
                    <div className="col-6">
                      <p className="text-muted small mb-1">Avg Churn Prob</p>
                      <h6>{segmentPreview.avgChurnProb.toFixed(1)}%</h6>
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-muted small mb-2">Risk Distribution</p>
                    <div>
                      <div className="d-flex justify-content-between mb-1">
                        <span>Critical</span>
                        <span>{segmentPreview.riskDistribution.critical}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span>High</span>
                        <span>{segmentPreview.riskDistribution.high}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Medium</span>
                        <span>{segmentPreview.riskDistribution.medium}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    className="btn btn-primary"
                    onClick={handleSaveSegment}
                    disabled={loading}
                  >
                    <MdSave className="me-2" />
                    Save Segment
                  </button>
                </div>
              ) : (
                <div className="text-center py-5">
                  <p className="text-muted">Apply segmentation to see preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Saved Segments */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Saved Segments</h5>
        </div>
        <div className="card-body">
          {savedSegments.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No saved segments</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Segment Name</th>
                    <th>Customer Count</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="4" className="text-center text-muted py-4">
                      No saved segments yet
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerSegmentation;


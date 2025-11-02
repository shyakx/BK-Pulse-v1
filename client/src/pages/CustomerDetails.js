import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { MdArrowBack, MdRefresh, MdPhone, MdEmail, MdAccountBalance, MdWarning, MdCall, MdSend, MdCardGiftcard, MdHistory, MdArrowUpward, MdArrowDownward } from 'react-icons/md';

const CustomerDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [shapValues, setShapValues] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [retentionNotes, setRetentionNotes] = useState([]);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    // Check if ID is invalid (literal ":id" string or undefined)
    if (!id || id === ':id' || id === 'undefined' || id === 'null') {
      setError('Invalid customer ID. Please navigate from the customers list by clicking on a customer.');
      setLoading(false);
      // Redirect to customers list after a short delay
      setTimeout(() => {
        window.location.href = '/customers';
      }, 3000);
      return;
    }
    
    // Valid ID - fetch customer
    fetchCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCustomer = async (skipAutoPredict = false) => {
    try {
      setLoading(true);
      setError(null);
      if (!id || id === ':id') {
        throw new Error('Invalid customer ID. Please navigate from the customers list.');
      }
      
      const response = await api.getCustomer(id);
      
      if (response.success) {
        const customerData = response.customer;
        
        // Check if prediction needs to be calculated/updated
        const needsPrediction = 
          !customerData.churn_score || 
          customerData.churn_score === null ||
          !customerData.updated_at ||
          (new Date() - new Date(customerData.updated_at)) > 7 * 24 * 60 * 60 * 1000; // Older than 7 days
        
        // Automatically calculate prediction if missing or stale (unless explicitly skipped)
        if (!skipAutoPredict && needsPrediction && ['retentionOfficer', 'retentionAnalyst', 'retentionManager', 'admin'].includes(user?.role)) {
          try {
            setUpdating(true);
            const predictResponse = await api.updateCustomerPrediction(id);
            if (predictResponse.success && predictResponse.prediction) {
              // Update customer data with fresh prediction
              customerData.churn_score = predictResponse.prediction.churn_score;
              customerData.risk_level = predictResponse.prediction.risk_level;
              customerData.updated_at = new Date().toISOString();
            }
          } catch (predictError) {
            console.warn('Auto-prediction failed, showing existing data:', predictError);
            // Continue with existing data if auto-prediction fails
          } finally {
            setUpdating(false);
          }
        } else if (!skipAutoPredict && needsPrediction && !['retentionAnalyst', 'retentionManager', 'admin'].includes(user?.role)) {
          // For non-privileged users, try to calculate prediction via the predictions endpoint
          try {
            const predictResponse = await api.predictCustomerChurn(id, { include_shap: false });
            if (predictResponse.success && predictResponse.prediction) {
              customerData.churn_score = predictResponse.prediction.churn_score;
              customerData.risk_level = predictResponse.prediction.risk_level;
              customerData.updated_at = new Date().toISOString();
            }
          } catch (predictError) {
            console.warn('Auto-prediction failed:', predictError);
          }
        }
        
        setCustomer(customerData);
        
        // Fetch SHAP values and recommendations from real API (only if we have a churn_score)
        if (customerData.churn_score) {
          try {
            // Fetch SHAP values
            const shapResponse = await api.getCustomerSHAP(id);
            if (shapResponse.success && shapResponse.shap_values) {
              setShapValues(shapResponse.shap_values);
            }
          } catch (shapError) {
            console.warn('Could not fetch SHAP values:', shapError);
            // If SHAP fails, it's not critical - just don't show SHAP section
          }

          try {
            // Fetch ML-based recommendations
            const recResponse = await api.getCustomerRecommendations(id);
            if (recResponse.success && recResponse.recommendations) {
              setRecommendations(recResponse.recommendations);
            }
          } catch (recError) {
            console.warn('Could not fetch recommendations:', recError);
            // Fallback to empty array if recommendations fail
            setRecommendations([]);
          }
        }
        
        // Fetch retention notes from API
        try {
          const notesResponse = await api.getRetentionNotes({ 
            customer_id: id,
            limit: 50 
          });
          if (notesResponse.success && notesResponse.notes) {
            const mappedNotes = notesResponse.notes.map(note => ({
              id: note.id,
              date: note.created_at,
              officer: note.officer_name || user?.name || 'Unknown',
              note: note.note,
              priority: note.priority,
              status: note.status
            }));
            setRetentionNotes(mappedNotes);
          } else {
            setRetentionNotes([]);
          }
        } catch (notesError) {
          console.warn('Could not fetch retention notes:', notesError);
          setRetentionNotes([]);
        }
      } else {
        throw new Error(response.message || 'Failed to fetch customer');
      }
    } catch (err) {
      console.error('Error fetching customer:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        id: id
      });
      
      // Check if it's an auth error (will be handled by interceptor)
      if (err.message && (err.message.includes('403') || err.message.includes('401') || err.message.includes('Forbidden'))) {
        setError('Authentication failed. Please login again.');
      } else if (err.message && err.message.includes('404')) {
        setError(`Customer not found. ID: ${id}`);
      } else {
        setError(err.message || 'Failed to load customer');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrediction = async () => {
    if (!['retentionOfficer', 'retentionAnalyst', 'retentionManager', 'admin'].includes(user?.role)) {
      alert('You do not have permission to update predictions');
      return;
    }

    try {
      setUpdating(true);
      const response = await api.updateCustomerPrediction(id);
      if (response.success) {
        // Refresh customer data (skip auto-predict since we just updated)
        await fetchCustomer(true);
        alert('Churn prediction updated successfully!');
      } else {
        throw new Error(response.message || 'Failed to update prediction');
      }
    } catch (err) {
      console.error('Error updating prediction:', err);
      alert(`Failed to update prediction: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNote = async () => {
    if (!newNote.trim()) {
      alert('Please enter a note before saving');
      return;
    }

    try {
      const noteData = {
        customer_id: id,
        note: newNote,
        priority: 'medium',
        status: 'active',
        tags: []
      };

      const response = await api.createRetentionNote(noteData);
      
      if (response.success) {
        // Clear the input and refresh notes
        setNewNote('');
        // Fetch updated notes
        const notesResponse = await api.getRetentionNotes({ 
          customer_id: id,
          limit: 50 
        });
        if (notesResponse.success && notesResponse.notes) {
          const mappedNotes = notesResponse.notes.map(note => ({
            id: note.id,
            date: note.created_at,
            officer: note.officer_name || user?.name || 'Unknown',
            note: note.note,
            priority: note.priority,
            status: note.status
          }));
          setRetentionNotes(mappedNotes);
        }
      } else {
        throw new Error(response.message || 'Failed to save note');
      }
    } catch (err) {
      console.error('Error saving note:', err);
      alert(`Failed to save note: ${err.message}`);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatChurnScore = (score) => {
    if (!score && score !== 0) return 'N/A';
    return `${parseFloat(score).toFixed(1)}%`;
  };

  const getRiskBadgeClass = (riskLevel) => {
    const badges = {
      high: 'bg-danger',
      medium: 'bg-warning',
      low: 'bg-success'
    };
    return badges[riskLevel] || 'bg-secondary';
  };

  const getRiskLabel = (riskLevel) => {
    const labels = {
      high: 'High Risk',
      medium: 'Medium Risk',
      low: 'Low Risk'
    };
    return labels[riskLevel] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">
          <h4>Error</h4>
          <p>{error || 'Customer not found'}</p>
          <Link to="/customers" className="btn btn-primary">
            <MdArrowBack className="me-2" />
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link to="/customers" className="btn btn-outline-secondary">
            <MdArrowBack className="me-2" />
            Back
          </Link>
          <div>
            <h2 className="fw-bold mb-1">{customer.name}</h2>
            <p className="text-muted mb-0">{customer.customer_id}</p>
          </div>
        </div>
        <div className="d-flex gap-2">
          {['retentionOfficer', 'retentionAnalyst', 'retentionManager', 'admin'].includes(user?.role) && (
            <button
              className="btn btn-primary"
              onClick={handleUpdatePrediction}
              disabled={updating}
            >
              <MdRefresh className={`me-2 ${updating ? 'spinning' : ''}`} />
              {updating ? 'Updating...' : 'Update Prediction'}
            </button>
          )}
        </div>
      </div>

      <div className="row">
        {/* Main Info Cards */}
        <div className="col-lg-4 mb-4">
          <div className="card h-100">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Customer Information</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="text-muted small">Email</label>
                <div className="d-flex align-items-center">
                  <MdEmail className="me-2 text-muted" />
                  <span>{customer.email || 'N/A'}</span>
                </div>
              </div>
              <div className="mb-3">
                <label className="text-muted small">Phone</label>
                <div className="d-flex align-items-center">
                  <MdPhone className="me-2 text-muted" />
                  <span>{customer.phone || 'N/A'}</span>
                </div>
              </div>
              <div className="mb-3">
                <label className="text-muted small">Segment</label>
                <div>
                  <span className="badge bg-info bg-opacity-10 text-info">
                    {customer.segment || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="mb-3">
                <label className="text-muted small">Branch</label>
                <div>{customer.branch || 'N/A'}</div>
              </div>
              <div className="mb-3">
                <label className="text-muted small">Product Type</label>
                <div>{customer.product_type || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Churn Score Card */}
        <div className="col-lg-4 mb-4">
          <div className="card h-100">
            <div className="card-header bg-warning text-dark">
              <h5 className="mb-0">Churn Prediction</h5>
            </div>
            <div className="card-body text-center">
              <div className="mb-4">
                <div className="display-1 fw-bold text-primary mb-2">
                  {formatChurnScore(customer.churn_score)}
                </div>
                <span className={`badge ${getRiskBadgeClass(customer.risk_level)} text-white px-3 py-2`}>
                  {getRiskLabel(customer.risk_level)}
                </span>
              </div>
              
              <div className="progress mb-3" style={{ height: '20px' }}>
                <div
                  className={`progress-bar ${
                    customer.churn_score > 70 ? 'bg-danger' :
                    customer.churn_score > 40 ? 'bg-warning' : 'bg-success'
                  }`}
                  style={{ width: `${customer.churn_score || 0}%` }}
                  role="progressbar"
                >
                  {formatChurnScore(customer.churn_score)}
                </div>
              </div>

              <div className="small text-muted">
                <div>Last Updated: {customer.updated_at ? new Date(customer.updated_at).toLocaleString() : 'N/A'}</div>
              </div>
            </div>
          </div>
          </div>
          
        {/* Account Balance Card */}
        <div className="col-lg-4 mb-4">
          <div className="card h-100">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">Account Details</h5>
            </div>
                <div className="card-body">
              <div className="mb-3">
                <label className="text-muted small">Account Balance</label>
                <div className="d-flex align-items-center">
                  <MdAccountBalance className="me-2 text-muted" />
                  <span className="fw-bold fs-5">
                    {formatCurrency(customer.account_balance)}
                  </span>
                </div>
              </div>
              {customer.churn_score > 70 && (
                <div className="alert alert-danger mb-0">
                  <MdWarning className="me-2" />
                  <strong>High Risk Customer</strong>
                  <p className="mb-0 small">Immediate attention required</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Customer Info | Prediction & Actions */}
      <div className="row">
        {/* Left Panel - Customer Information */}
        <div className="col-lg-6 mb-4">
          {/* Personal Details Card */}
          <div className="card mb-3">
            <div className="card-header">
              <h5 className="mb-0">Personal Details</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-6 mb-2">
                  <label className="text-muted small">Age</label>
                  <p className="mb-0">{customer.age || 'N/A'}</p>
                </div>
                <div className="col-6 mb-2">
                  <label className="text-muted small">Gender</label>
                  <p className="mb-0">{customer.gender || 'N/A'}</p>
                </div>
                <div className="col-12 mb-2">
                  <label className="text-muted small">Nationality</label>
                  <p className="mb-0">{customer.nationality || 'N/A'}</p>
                </div>
                <div className="col-12 mb-2">
                  <label className="text-muted small">Account Open Date</label>
                  <p className="mb-0">{customer.account_open_date ? new Date(customer.account_open_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="col-12 mb-2">
                  <label className="text-muted small">Tenure</label>
                  <p className="mb-0">{customer.tenure ? `${customer.tenure} months` : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Products & Services Card */}
          <div className="card mb-3">
            <div className="card-header">
              <h5 className="mb-0">Products & Services</h5>
            </div>
            <div className="card-body">
              <div className="mb-2">
                <label className="text-muted small">Number of Products</label>
                <p className="mb-0">{customer.num_of_products || 'N/A'}</p>
              </div>
              <div className="mb-2">
                <label className="text-muted small">Credit Card</label>
                <p className="mb-0">
                  <span className={`badge ${customer.has_credit_card ? 'bg-success' : 'bg-secondary'}`}>
                    {customer.has_credit_card ? 'Yes' : 'No'}
                  </span>
                </p>
              </div>
              <div className="mb-2">
                <label className="text-muted small">Mobile Banking</label>
                <p className="mb-0">
                  <span className={`badge ${customer.is_active_member ? 'bg-success' : 'bg-secondary'}`}>
                    {customer.is_active_member ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Transaction Activity Card */}
          <div className="card mb-3">
            <div className="card-header">
              <h5 className="mb-0">Transaction Activity</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-6 mb-2">
                  <label className="text-muted small">Transaction Frequency</label>
                  <p className="mb-0">{customer.transaction_frequency || 'N/A'} per month</p>
                </div>
                <div className="col-6 mb-2">
                  <label className="text-muted small">Avg Transaction Value</label>
                  <p className="mb-0">{formatCurrency(customer.avg_transaction_value)}</p>
                </div>
                <div className="col-12 mb-2">
                  <label className="text-muted small">Days Since Last Transaction</label>
                  <p className="mb-0">{customer.days_since_last_transaction || 'N/A'} days</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Churn Prediction & Actions */}
        <div className="col-lg-6 mb-4">
          {/* SHAP Explanation Card */}
          {shapValues && (
            <div className="card mb-3">
              <div className="card-header">
                <h5 className="mb-0">Why is this customer at risk?</h5>
              </div>
              <div className="card-body">
                <p className="text-muted small mb-3">Top factors driving churn prediction:</p>
                {shapValues && shapValues.length > 0 ? (
                  shapValues.slice(0, 5).map((item, index) => (
                    <div key={index} className="mb-3 p-2 border rounded">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{item.feature}</strong>
                          <div className="d-flex align-items-center mt-1">
                            {item.direction === 'increases' ? (
                              <MdArrowUpward className="text-danger me-1" />
                            ) : (
                              <MdArrowDownward className="text-success me-1" />
                            )}
                            <span className={`small ${item.direction === 'increases' ? 'text-danger' : 'text-success'}`}>
                              {item.direction === 'increases' ? 'Increases' : 'Decreases'} risk
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className={`badge ${item.direction === 'increases' ? 'bg-danger' : 'bg-success'}`}>
                            {item.impact > 0 ? '+' : ''}{item.impact.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted small">SHAP values not available. Click "Update Prediction" to calculate.</p>
                )}
                <button className="btn btn-sm btn-outline-primary">View Full Analysis</button>
              </div>
            </div>
          )}

          {/* Recommended Actions Card */}
          <div className="card mb-3">
            <div className="card-header">
              <h5 className="mb-0">Recommended Actions</h5>
              <small className="text-muted">ML-generated based on churn prediction</small>
            </div>
            <div className="card-body">
              {recommendations && recommendations.length > 0 ? (
                <div>
                  {recommendations.map((rec, index) => (
                    <div key={index} className="mb-3 p-3 border rounded">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <input type="checkbox" className="form-check-input" />
                            <span className="fw-bold">{rec.action}</span>
                            <span className={`badge ${
                              rec.priority === 'high' ? 'bg-danger' : 
                              rec.priority === 'medium' ? 'bg-warning' : 'bg-info'
                            }`}>
                              {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)} Priority
                            </span>
                            <span className="badge bg-secondary">
                              {rec.confidence}% confidence
                            </span>
                          </div>
                          <p className="text-muted small mb-0 ms-4">
                            <em>{rec.reason}</em>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3">
                  <p className="text-muted mb-2">
                    {customer.churn_score 
                      ? 'Generating recommendations...' 
                      : 'Generate churn prediction to get recommendations'}
                  </p>
                  {!customer.churn_score && (
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={handleUpdatePrediction}
                      disabled={updating}
                    >
                      {updating ? 'Generating...' : 'Generate Prediction'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Retention Notes Section */}
          <div className="card mb-3">
            <div className="card-header">
              <h5 className="mb-0">Retention Notes</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Add retention note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <button 
                  className="btn btn-sm btn-primary mt-2"
                  onClick={handleSaveNote}
                  disabled={!newNote.trim()}
                >
                  Save Note
                </button>
              </div>
              <div className="border-top pt-3">
                <h6 className="small text-muted mb-2">Previous Notes</h6>
                {retentionNotes.length === 0 ? (
                  <p className="text-muted small">No notes yet</p>
                ) : (
                  retentionNotes.map(note => (
                    <div key={note.id} className="mb-2 p-2 bg-light rounded">
                      <div className="d-flex justify-content-between">
                        <small className="fw-bold">{note.officer}</small>
                        <small className="text-muted">{new Date(note.date).toLocaleDateString()}</small>
                      </div>
                      <p className="mb-0 small">{note.note}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row g-2">
                <div className="col-6">
                  <button className="btn btn-outline-primary w-100">
                    <MdCall className="me-2" />
                    Call Customer
                  </button>
                </div>
                <div className="col-6">
                  <button className="btn btn-outline-primary w-100">
                    <MdSend className="me-2" />
                    Send Email
                  </button>
                </div>
                <div className="col-6">
                  <button className="btn btn-outline-primary w-100">
                    <MdCardGiftcard className="me-2" />
                    Create Offer
                  </button>
                </div>
                <div className="col-6">
                  <button className="btn btn-outline-primary w-100">
                    <MdHistory className="me-2" />
                    View History
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;

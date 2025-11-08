import React, { useState, useEffect } from 'react';
import { MdClose, MdPhone, MdEmail, MdAccountBalance, MdWarning, MdRefresh, MdNote, MdSend } from 'react-icons/md';
import api from '../services/api';

const CustomerDetailsModal = ({ customerId, isOpen, onClose, onNoteAdded }) => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shapValues, setShapValues] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [retentionNotes, setRetentionNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (isOpen && customerId) {
      fetchCustomerDetails();
    }
  }, [isOpen, customerId]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const response = await api.getCustomer(customerId);
      
      if (response.success) {
        setCustomer(response.customer);
        
        // Fetch SHAP values and recommendations
        if (response.customer.churn_score) {
          try {
            const shapResponse = await api.getCustomerSHAP(customerId);
            if (shapResponse.success && shapResponse.shap_values) {
              setShapValues(shapResponse.shap_values);
            }
          } catch (err) {
            // SHAP not critical
          }

          try {
            const recResponse = await api.getCustomerRecommendations(customerId);
            if (recResponse.success && recResponse.recommendations) {
              setRecommendations(recResponse.recommendations);
            }
          } catch (err) {
            setRecommendations([]);
          }
        }
        
        // Fetch retention notes
        try {
          const notesResponse = await api.getRetentionNotes({ 
            customer_id: customerId,
            limit: 50 
          });
          if (notesResponse.success && notesResponse.notes) {
            setRetentionNotes(notesResponse.notes);
          }
        } catch (err) {
          setRetentionNotes([]);
        }
      }
    } catch (err) {
      console.error('Error fetching customer details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!newNote.trim()) {
      alert('Please enter a note before saving');
      return;
    }

    try {
      setSavingNote(true);
      const noteData = {
        customer_id: customerId,
        note: newNote,
        priority: 'medium',
        status: 'active',
        tags: []
      };

      const response = await api.createRetentionNote(noteData);
      
      if (response.success) {
        setNewNote('');
        await fetchCustomerDetails();
        if (onNoteAdded) onNoteAdded();
      } else {
        throw new Error(response.message || 'Failed to save note');
      }
    } catch (err) {
      console.error('Error saving note:', err);
      alert(`Failed to save note: ${err.message}`);
    } finally {
      setSavingNote(false);
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

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {loading ? 'Loading...' : customer ? `${customer.name} - ${customer.customer_id}` : 'Customer Details'}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : customer ? (
              <div className="row">
                {/* Customer Information */}
                <div className="col-lg-4 mb-4">
                  <div className="card h-100">
                    <div className="card-header bg-primary text-white">
                      <h6 className="mb-0">Customer Information</h6>
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
                      <div className="mb-3">
                        <label className="text-muted small">Account Balance</label>
                        <div className="d-flex align-items-center">
                          <MdAccountBalance className="me-2 text-muted" />
                          <span className="fw-bold">{formatCurrency(customer.account_balance)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Churn Prediction */}
                <div className="col-lg-4 mb-4">
                  <div className="card h-100">
                    <div className="card-header bg-danger text-white">
                      <h6 className="mb-0">Churn Prediction</h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <label className="text-muted small">Churn Score</label>
                        <div>
                          <span className={`badge ${
                            (customer.churn_score || 0) >= 70 ? 'bg-danger' :
                            (customer.churn_score || 0) >= 50 ? 'bg-warning' : 'bg-success'
                          }`} style={{ fontSize: '1.2rem', padding: '0.5rem 1rem' }}>
                            {(customer.churn_score || 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="text-muted small">Risk Level</label>
                        <div>
                          <span className={`badge ${
                            customer.risk_level === 'high' ? 'bg-danger' :
                            customer.risk_level === 'medium' ? 'bg-warning' : 'bg-success'
                          }`}>
                            {customer.risk_level || 'low'}
                          </span>
                        </div>
                      </div>
                      {customer.updated_at && (
                        <div className="mb-3">
                          <label className="text-muted small">Last Updated</label>
                          <div>{new Date(customer.updated_at).toLocaleString()}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="col-lg-4 mb-4">
                  <div className="card h-100">
                    <div className="card-header bg-success text-white">
                      <h6 className="mb-0">Recommendations</h6>
                    </div>
                    <div className="card-body">
                      {recommendations.length > 0 ? (
                        <ul className="list-unstyled mb-0">
                          {recommendations.slice(0, 3).map((rec, idx) => (
                            <li key={idx} className="mb-2">
                              <small className="d-block fw-bold">{rec.action}</small>
                              <small className="text-muted">
                                Confidence: {(rec.confidence * 100).toFixed(0)}%
                              </small>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted small mb-0">No recommendations available</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Retention Notes */}
                <div className="col-12 mb-4">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">Retention Notes</h6>
                    </div>
                    <div className="card-body">
                      {/* Add Note Form */}
                      <div className="mb-3">
                        <label className="form-label">Add Note</label>
                        <div className="d-flex gap-2">
                          <textarea
                            className="form-control"
                            rows="2"
                            placeholder="Enter retention note..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                          />
                          <button
                            className="btn btn-primary"
                            onClick={handleSaveNote}
                            disabled={savingNote || !newNote.trim()}
                          >
                            {savingNote ? (
                              <span className="spinner-border spinner-border-sm" />
                            ) : (
                              <>
                                <MdSend className="me-1" />
                                Save
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Notes List */}
                      {retentionNotes.length > 0 ? (
                        <div className="list-group">
                          {retentionNotes.map((note) => (
                            <div key={note.id} className="list-group-item">
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="flex-grow-1">
                                  <p className="mb-1">{note.note}</p>
                                  <small className="text-muted">
                                    {note.officer_name} • {new Date(note.created_at).toLocaleString()}
                                  </small>
                                </div>
                                <span className={`badge ${
                                  note.priority === 'high' ? 'bg-danger' :
                                  note.priority === 'medium' ? 'bg-warning' : 'bg-info'
                                }`}>
                                  {note.priority}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted small mb-0">No notes yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert alert-warning">Customer not found</div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsModal;


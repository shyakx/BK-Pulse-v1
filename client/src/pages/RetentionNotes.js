import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MdAdd, MdSearch, MdFilterList, MdCalendarToday, MdCheckCircle, MdPending } from 'react-icons/md';
import api from '../services/api';

const RetentionNotes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    // Debounce search
    if (searchTerm !== undefined) {
      const timer = setTimeout(() => {
        fetchNotes();
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);
  const [newNote, setNewNote] = useState({
    customer_id: '',
    category: 'Call',
    note: '',
    follow_up_date: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 100,
        status: filterStatus !== 'all' ? filterStatus : null,
        search: searchTerm || null
      };
      
      const response = await api.getRetentionNotes(params);
      
      if (response.success) {
        // Map API response to UI format
        const mappedNotes = (response.notes || []).map(note => ({
          id: note.id,
          date: note.created_at,
          customer_id: note.customer_customer_id || note.customer_id,
          customer_name: note.customer_name || 'Unknown',
          note_preview: note.note?.substring(0, 80) + (note.note?.length > 80 ? '...' : ''),
          officer: note.officer_name || user?.name || 'Unknown',
          follow_up_date: note.follow_up_date || null,
          status: note.status === 'active' ? 'Pending' : note.status === 'resolved' ? 'Completed' : (note.status || 'Pending'),
          category: note.tags?.[0] || 'Other',
          priority: note.priority
        }));
        setNotes(mappedNotes);
      } else {
        // If API fails, set empty array instead of throwing
        setNotes([]);
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
      // Don't show alert, just log and set empty array
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    try {
      if (!newNote.note || !newNote.customer_id) {
        alert('Please fill in customer ID and note');
        return;
      }

      const noteData = {
        customer_id: newNote.customer_id,
        note: newNote.note,
        priority: newNote.priority,
        follow_up_date: newNote.follow_up_date || null,
        status: 'active',
        tags: newNote.category ? [newNote.category] : []
      };

      const response = await api.createRetentionNote(noteData);
      
      if (response.success) {
        alert('Note added successfully');
        setShowAddModal(false);
        setNewNote({
          customer_id: '',
          category: 'Call',
          note: '',
          follow_up_date: '',
          priority: 'medium'
        });
        fetchNotes();
      } else {
        throw new Error(response.message || 'Failed to add note');
      }
    } catch (err) {
      alert('Failed to add note: ' + (err.response?.data?.message || err.message));
    }
  };

  // Apply client-side search filter (status filter is done server-side)
  const filteredNotes = notes.filter(note => {
    if (!searchTerm) return true;
    return note.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           note.note_preview?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold mb-1">Retention Notes</h2>
          <p className="text-muted mb-0">Manage all retention interactions and notes</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <MdAdd className="me-2" />
          Add New Note
        </button>
      </div>

      {/* Notes Dashboard */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">Total Notes</p>
                  <h3 className="mb-0">{notes.length}</h3>
                </div>
                <div className="text-primary fs-1">📝</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">This Week</p>
                  <h3 className="mb-0">{notes.filter(n => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(n.date) > weekAgo;
                  }).length}</h3>
                </div>
                <div className="text-success fs-1">📅</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">Follow-ups Pending</p>
                  <h3 className="mb-0">{notes.filter(n => n.status === 'Pending').length}</h3>
                </div>
                <div className="text-warning fs-1">⏰</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">Completed</p>
                  <h3 className="mb-0">{notes.filter(n => n.status === 'Completed').length}</h3>
                </div>
                <div className="text-info fs-1">✅</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <MdSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <MdFilterList />
                </span>
                <select
                  className="form-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="resolved">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-3">No notes found</p>
              {notes.length === 0 && (
                <div>
                  <p className="text-muted small mb-3">
                    Get started by creating your first retention note!
                  </p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowAddModal(true)}
                  >
                    <MdAdd className="me-2" />
                    Add Your First Note
                  </button>
                  <p className="text-muted small mt-3 mb-0">
                    <em>Or run the seed script: <code>node server/scripts/seedRetentionNotes.js</code></em>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer ID</th>
                    <th>Customer Name</th>
                    <th>Note Preview</th>
                    <th>Officer</th>
                    <th>Category</th>
                    <th>Follow-up Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotes.map(note => (
                    <tr key={note.id}>
                      <td>{new Date(note.date).toLocaleDateString()}</td>
                      <td>{note.customer_id}</td>
                      <td>{note.customer_name}</td>
                      <td>{note.note_preview}</td>
                      <td>{note.officer}</td>
                      <td>
                        <span className="badge bg-info">{note.category}</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <MdCalendarToday className="me-1 text-muted" />
                          {new Date(note.follow_up_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        {note.status === 'Completed' ? (
                          <span className="badge bg-success">
                            <MdCheckCircle className="me-1" />
                            Completed
                          </span>
                        ) : (
                          <span className="badge bg-warning">
                            <MdPending className="me-1" />
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Note Modal */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Retention Note</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Customer ID</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newNote.customer_id}
                    onChange={(e) => setNewNote({...newNote, customer_id: e.target.value})}
                    placeholder="Enter customer ID"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={newNote.category}
                    onChange={(e) => setNewNote({...newNote, category: e.target.value})}
                  >
                    <option value="Call">Call</option>
                    <option value="Email">Email</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Note</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={newNote.note}
                    onChange={(e) => setNewNote({...newNote, note: e.target.value})}
                    placeholder="Enter retention note..."
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Follow-up Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={newNote.follow_up_date}
                    onChange={(e) => setNewNote({...newNote, follow_up_date: e.target.value})}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={newNote.priority}
                    onChange={(e) => setNewNote({...newNote, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleAddNote}>
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetentionNotes;


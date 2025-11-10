import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdLock, MdLockOpen } from 'react-icons/md';
import api from '../services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'retentionOfficer',
    password: '',
    is_active: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.getAdminUsers();
      if (response.success) {
        setUsers(response.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      alert('Failed to fetch users: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!formData.email || !formData.name || !formData.password) {
        alert('Email, name, and password are required');
        return;
      }

      const response = await api.createAdminUser({
        email: formData.email,
        name: formData.name,
        role: formData.role,
        password: formData.password
      });

      if (response.success) {
        alert('User created successfully!');
        setShowAddModal(false);
        setFormData({ email: '', name: '', role: 'retentionOfficer', password: '', is_active: true });
        fetchUsers();
      }
    } catch (err) {
      alert('Failed to create user: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateUser = async () => {
    try {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }

      const response = await api.updateAdminUser(editingUser.id, updateData);

      if (response.success) {
        alert('User updated successfully!');
        setEditingUser(null);
        setFormData({ email: '', name: '', role: 'retentionOfficer', password: '', is_active: true });
        fetchUsers();
      }
    } catch (err) {
      alert('Failed to update user: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleActive = async (user) => {
    try {
      const response = await api.updateAdminUser(user.id, { is_active: !user.is_active });
      if (response.success) {
        fetchUsers();
      }
    } catch (err) {
      alert('Failed to update user: ' + (err.response?.data?.message || err.message));
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-danger',
      retentionManager: 'bg-warning',
      retentionAnalyst: 'bg-info',
      retentionOfficer: 'bg-primary'
    };
    return badges[role] || 'bg-secondary';
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Admin',
      retentionManager: 'Manager',
      retentionAnalyst: 'Analyst',
      retentionOfficer: 'Officer'
    };
    return labels[role] || role;
  };

  return (
    <div>
          <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">User Management</h2>
          <p className="text-muted mb-0">Add/remove users, assign roles, manage permissions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <MdAdd className="me-2" />
          Add User
        </button>
          </div>
          
      {/* Users Table */}
              <div className="card">
                <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No users found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Assigned Customers</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${getRoleBadge(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${user.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{user.assigned_customers || 0}</td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => {
                              setEditingUser(user);
                              setFormData({
                                email: user.email,
                                name: user.name,
                                role: user.role,
                                password: '',
                                is_active: user.is_active
                              });
                            }}
                            title="Edit"
                          >
                            <MdEdit />
                          </button>
                          <button
                            className={`btn ${user.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            onClick={() => handleToggleActive(user)}
                            title={user.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {user.is_active ? <MdLock /> : <MdLockOpen />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New User</h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowAddModal(false);
                  setFormData({ email: '', name: '', role: 'retentionOfficer', password: '', is_active: true });
                }}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Role</label>
                  <select
                    className="form-select"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="retentionOfficer">Retention Officer</option>
                    <option value="retentionAnalyst">Retention Analyst</option>
                    <option value="retentionManager">Retention Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowAddModal(false);
                  setFormData({ email: '', name: '', role: 'retentionOfficer', password: '', is_active: true });
                }}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleCreateUser}>
                  Create User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit User</h5>
                <button type="button" className="btn-close" onClick={() => {
                  setEditingUser(null);
                  setFormData({ email: '', name: '', role: 'retentionOfficer', password: '', is_active: true });
                }}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Role</label>
                  <select
                    className="form-select"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="retentionOfficer">Retention Officer</option>
                    <option value="retentionAnalyst">Retention Analyst</option>
                    <option value="retentionManager">Retention Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">New Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    className="form-control"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter new password or leave blank"
                  />
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <label className="form-check-label">Active</label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setEditingUser(null);
                  setFormData({ email: '', name: '', role: 'retentionOfficer', password: '', is_active: true });
                }}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleUpdateUser}>
                  Update User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

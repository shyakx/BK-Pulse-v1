import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MdAccountCircle, MdEmail, MdLock, MdSave, MdEdit, MdCancel } from 'react-icons/md';
import api from '../services/api';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    position: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        position: user.position || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      const response = await api.updateProfile(formData);
      
      if (response.success) {
        // Update user in context
        setUser({ ...user, ...formData });
        setEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to update profile. Please try again.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      const response = await api.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.success) {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordForm(false);
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        throw new Error(response.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to change password. Please check your current password.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold mb-1">My Profile</h2>
          <p className="text-muted mb-0">Manage your personal information and account settings</p>
        </div>
        {!editing && (
          <button
            className="btn btn-primary"
            onClick={() => setEditing(true)}
          >
            <MdEdit className="me-2" />
            Edit Profile
          </button>
        )}
      </div>

      {message.text && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`}>
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
        </div>
      )}

      <div className="row">
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Personal Information</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!editing}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <MdEmail />
                    </span>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!editing}
                    />
                  </div>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!editing}
                    placeholder="+250 7XX XXX XXX"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    className="form-control"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    disabled={!editing}
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <label className="form-label">Position</label>
                  <input
                    type="text"
                    className="form-control"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    disabled={!editing}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Role</label>
                  <input
                    type="text"
                    className="form-control"
                    value={user?.role?.replace(/([A-Z])/g, ' $1').trim() || ''}
                    disabled
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                </div>
              </div>

              {editing && (
                <div className="d-flex justify-content-end mt-4">
                  <button
                    className="btn btn-outline-secondary me-2"
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        name: user.name || '',
                        email: user.email || '',
                        phone: user.phone || '',
                        department: user.department || '',
                        position: user.position || ''
                      });
                    }}
                  >
                    <MdCancel className="me-2" />
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    <MdSave className="me-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="mb-0">Change Password</h5>
              {!showPasswordForm && (
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setShowPasswordForm(true)}
                >
                  Change Password
                </button>
              )}
            </div>
            {showPasswordForm && (
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Current Password</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <MdLock />
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <MdLock />
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password (min. 6 characters)"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Confirm New Password</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <MdLock />
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end">
                  <button
                    className="btn btn-outline-secondary me-2"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleChangePassword}
                    disabled={saving}
                  >
                    {saving ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-body text-center">
              <div 
                className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ 
                  width: '120px', 
                  height: '120px',
                  background: 'linear-gradient(135deg, var(--bk-primary) 0%, var(--bk-primary-light) 100%)',
                  boxShadow: '0 4px 8px rgba(30, 58, 138, 0.2)'
                }}
              >
                <MdAccountCircle size={80} className="text-white" />
              </div>
              <h5 className="fw-bold">{user?.name || user?.email}</h5>
              <p className="text-muted mb-2">{user?.email}</p>
              <span className="badge bg-primary">
                {user?.role?.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;


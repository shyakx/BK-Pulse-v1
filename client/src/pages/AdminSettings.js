import React, { useState, useEffect } from 'react';
import { MdSave, MdSettings } from 'react-icons/md';
import api from '../services/api';

const AdminSettings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.getAdminSettings();
      if (response.success) {
        setSettings(response.settings || []);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      alert('Failed to fetch settings: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (setting) => {
    setEditingKey(setting.key);
    setEditValue(setting.value || '');
  };

  const handleSave = async (key) => {
    try {
      setSaving(true);
      const response = await api.updateAdminSetting(key, { value: editValue });
      if (response.success) {
        alert('Setting updated successfully!');
        setEditingKey(null);
        fetchSettings();
      }
    } catch (err) {
      alert('Failed to update setting: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Settings / Config</h2>
          <p className="text-muted mb-0">Configure system settings, notifications, and pipeline schedules</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            <MdSettings className="me-2" />
            System Configuration
          </h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : settings.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No system settings found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Setting Key</th>
                    <th>Value</th>
                    <th>Description</th>
                    <th>Last Updated</th>
                    <th>Updated By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.map((setting) => (
                    <tr key={setting.id}>
                      <td>
                        <strong>{setting.key}</strong>
                      </td>
                      <td>
                        {editingKey === setting.key ? (
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            style={{ width: '200px' }}
                          />
                        ) : (
                          <span>{setting.value || '-'}</span>
                        )}
                      </td>
                      <td>
                        <small className="text-muted">{setting.description || '-'}</small>
                      </td>
                      <td>
                        {setting.updated_at 
                          ? new Date(setting.updated_at).toLocaleString()
                          : '-'}
                      </td>
                      <td>{setting.updated_by_name || '-'}</td>
                      <td>
                        {editingKey === setting.key ? (
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-success"
                              onClick={() => handleSave(setting.key)}
                              disabled={saving}
                            >
                              <MdSave />
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={handleCancel}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEdit(setting)}
                          >
                            Edit
                          </button>
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
    </div>
  );
};

export default AdminSettings;

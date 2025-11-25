import React, { useState, useEffect } from 'react';
import { MdNotifications, MdEmail, MdLanguage, MdSave, MdDarkMode, MdLightMode } from 'react-icons/md';

const Settings = () => {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    taskReminders: true,
    weeklyReports: true,
    language: 'en',
    timezone: 'Africa/Kigali',
    theme: 'light'
  });

  useEffect(() => {
    // Load user settings from API or localStorage
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (err) {
        console.error('Error parsing saved settings:', err);
      }
    }
  }, []);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      // Save to localStorage
      localStorage.setItem('userSettings', JSON.stringify(settings));
      
      // In a real app, you would also save to the backend
      // await api.updateSettings(settings);
      
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold mb-1">Settings</h2>
          <p className="text-muted mb-0">Manage your application preferences and notification settings</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSaveSettings}
          disabled={saving}
        >
          <MdSave className="me-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`}>
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
        </div>
      )}

      <div className="row">
        <div className="col-md-8">
          {/* Notifications */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0 d-flex align-items-center">
                <MdNotifications className="me-2" />
                Notifications
              </h5>
            </div>
            <div className="card-body">
              <div className="form-check form-switch mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                />
                <label className="form-check-label" htmlFor="emailNotifications">
                  <strong>Email Notifications</strong>
                  <p className="text-muted small mb-0">Receive notifications via email</p>
                </label>
              </div>

              <div className="form-check form-switch mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="pushNotifications"
                  checked={settings.pushNotifications}
                  onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                />
                <label className="form-check-label" htmlFor="pushNotifications">
                  <strong>Push Notifications</strong>
                  <p className="text-muted small mb-0">Receive browser push notifications</p>
                </label>
              </div>

              <div className="form-check form-switch mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="taskReminders"
                  checked={settings.taskReminders}
                  onChange={(e) => handleSettingChange('taskReminders', e.target.checked)}
                />
                <label className="form-check-label" htmlFor="taskReminders">
                  <strong>Task Reminders</strong>
                  <p className="text-muted small mb-0">Get reminded about upcoming tasks</p>
                </label>
              </div>

              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="weeklyReports"
                  checked={settings.weeklyReports}
                  onChange={(e) => handleSettingChange('weeklyReports', e.target.checked)}
                />
                <label className="form-check-label" htmlFor="weeklyReports">
                  <strong>Weekly Reports</strong>
                  <p className="text-muted small mb-0">Receive weekly performance reports</p>
                </label>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0 d-flex align-items-center">
                <MdLanguage className="me-2" />
                Preferences
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Language</label>
                <select
                  className="form-select"
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="rw">Kinyarwanda</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Timezone</label>
                <select
                  className="form-select"
                  value={settings.timezone}
                  onChange={(e) => handleSettingChange('timezone', e.target.value)}
                >
                  <option value="Africa/Kigali">Africa/Kigali (EAT)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Theme</label>
                <div className="d-flex gap-2">
                  <button
                    className={`btn ${settings.theme === 'light' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => handleSettingChange('theme', 'light')}
                  >
                    <MdLightMode className="me-2" />
                    Light
                  </button>
                  <button
                    className={`btn ${settings.theme === 'dark' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => handleSettingChange('theme', 'dark')}
                  >
                    <MdDarkMode className="me-2" />
                    Dark
                  </button>
                </div>
                <p className="text-muted small mt-2 mb-0">Note: Dark mode is coming soon</p>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0 d-flex align-items-center">
                <MdEmail className="me-2" />
                Account
              </h5>
            </div>
            <div className="card-body">
              <p className="text-muted mb-3">
                For account-related changes, please visit your <a href="/profile">Profile</a> page.
              </p>
              <div className="alert alert-info mb-0">
                <strong>Need help?</strong> Contact your system administrator for assistance with account settings.
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Quick Actions</h6>
            </div>
            <div className="card-body">
              <button className="btn btn-outline-primary w-100 mb-2" onClick={() => window.location.href = '/profile'}>
                Edit Profile
              </button>
              <button className="btn btn-outline-secondary w-100 mb-2" onClick={() => window.location.href = '/dashboard'}>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;


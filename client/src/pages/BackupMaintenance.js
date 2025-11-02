import React, { useState, useEffect } from 'react';
import { MdBackup, MdRefresh, MdDataset, MdUpdate, MdCheckCircle } from 'react-icons/md';
import api from '../services/api';

const BackupMaintenance = () => {
  const [backupInfo, setBackupInfo] = useState(null);
  const [dbInfo, setDbInfo] = useState(null);
  const [systemVersion, setSystemVersion] = useState(null);
  const [backingUp, setBackingUp] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    fetchMaintenanceInfo();
  }, []);

  const fetchMaintenanceInfo = async () => {
    try {
      const response = await api.getMaintenanceInfo();
      
      if (response.success && response.maintenance) {
        const maintenance = response.maintenance;
        
        setBackupInfo({
          lastBackup: maintenance.system?.last_backup || null,
          nextBackup: null, // Not provided by API
          schedule: 'Daily at 2:00 AM',
          backupSize: maintenance.database?.size || 'unknown'
        });

        setDbInfo({
          size: maintenance.database?.size || 'unknown',
          status: 'Healthy',
          lastOptimized: null // TODO: Track optimization timestamps
        });

        setSystemVersion({
          current: maintenance.system?.version || '1.0.0',
          available: null,
          lastUpdated: null,
          uptime: maintenance.system?.uptime || 0,
          nodeVersion: maintenance.system?.node_version || 'unknown'
        });
      } else {
        throw new Error(response.message || 'Failed to fetch maintenance info');
      }
    } catch (err) {
      console.error('Error fetching maintenance info:', err);
      alert('Failed to fetch maintenance info: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleBackupNow = async () => {
    try {
      setBackingUp(true);
      const response = await api.createBackup();
      
      if (response.success) {
        alert('Backup process initiated successfully!');
        fetchMaintenanceInfo();
      } else {
        throw new Error(response.message || 'Failed to initiate backup');
      }
    } catch (err) {
      alert('Backup failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setBackingUp(false);
    }
  };

  const handleOptimizeDB = async () => {
    try {
      setOptimizing(true);
      const response = await api.optimizeDatabase();
      
      if (response.success) {
        alert('Database optimization completed!');
        fetchMaintenanceInfo();
      } else {
        throw new Error(response.message || 'Failed to optimize database');
      }
    } catch (err) {
      alert('Optimization failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold mb-1">Backup & Maintenance</h2>
          <p className="text-muted mb-0">System maintenance with backup management and database optimization</p>
        </div>
      </div>

      {/* Backup Management */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Backup Management</h5>
        </div>
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-6 mb-3">
              <div className="d-flex align-items-center mb-3">
                <MdBackup className="text-primary me-3" style={{ fontSize: '2rem' }} />
                <div>
                  <h6 className="mb-0">Last Backup</h6>
                  <p className="text-muted small mb-0">
                    {backupInfo && new Date(backupInfo.lastBackup).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="d-flex align-items-center mb-3">
                <MdCheckCircle className="text-success me-3" style={{ fontSize: '2rem' }} />
                <div>
                  <h6 className="mb-0">Next Backup</h6>
                  <p className="text-muted small mb-0">
                    {backupInfo && new Date(backupInfo.nextBackup).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="mb-3">
                <p className="text-muted small mb-1">Schedule</p>
                <p className="fw-bold">{backupInfo?.schedule || 'N/A'}</p>
              </div>
              <div className="mb-3">
                <p className="text-muted small mb-1">Backup Size</p>
                <p className="fw-bold">{backupInfo?.backupSize || 'N/A'}</p>
              </div>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-primary"
              onClick={handleBackupNow}
              disabled={backingUp}
            >
              <MdBackup className={`me-2 ${backingUp ? 'spinning' : ''}`} />
              {backingUp ? 'Backing up...' : 'Backup Now'}
            </button>
            <button className="btn btn-outline-secondary">
              Configure Schedule
            </button>
            <button className="btn btn-outline-primary">
              View Backup History
            </button>
          </div>
        </div>
      </div>

      {/* Database Maintenance */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Database Maintenance</h5>
        </div>
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-4 mb-3">
              <div className="d-flex align-items-center">
                <MdDataset className="text-info me-3" style={{ fontSize: '2rem' }} />
                <div>
                  <h6 className="mb-0">Database Size</h6>
                  <p className="fw-bold">{dbInfo?.size || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div>
                <p className="text-muted small mb-1">Status</p>
                <span className={`badge ${dbInfo?.status === 'Healthy' ? 'bg-success' : 'bg-warning'}`}>
                  {dbInfo?.status || 'Unknown'}
                </span>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div>
                <p className="text-muted small mb-1">Last Optimized</p>
                <p className="mb-0">
                  {dbInfo && new Date(dbInfo.lastOptimized).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleOptimizeDB}
            disabled={optimizing}
          >
            <MdRefresh className={`me-2 ${optimizing ? 'spinning' : ''}`} />
            {optimizing ? 'Optimizing...' : 'Optimize Database'}
          </button>
        </div>
      </div>

      {/* System Updates */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">System Updates</h5>
        </div>
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-6 mb-3">
              <div className="d-flex align-items-center">
                <MdUpdate className="text-primary me-3" style={{ fontSize: '2rem' }} />
                <div>
                  <h6 className="mb-0">Current Version</h6>
                  <p className="fw-bold">{systemVersion?.current || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div>
                <p className="text-muted small mb-1">Last Updated</p>
                <p className="mb-0">
                  {systemVersion && new Date(systemVersion.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          {systemVersion?.available ? (
            <div className="alert alert-warning">
              <strong>Update Available:</strong> Version {systemVersion.available} is available
              <button className="btn btn-sm btn-primary ms-3">
                Update Now
              </button>
            </div>
          ) : (
            <div className="alert alert-success">
              <strong>System is up to date</strong>
            </div>
          )}
          <button className="btn btn-outline-primary">
            Check for Updates
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupMaintenance;


import React, { useState, useEffect } from 'react';
import { MdRefresh, MdDataUsage, MdUpdate, MdStorage } from 'react-icons/md';
import api from '../services/api';

const AdminData = () => {
  const [dataInfo, setDataInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDataInfo();
  }, []);

  const fetchDataInfo = async () => {
    try {
      setLoading(true);
      const response = await api.getAdminData();
      if (response.success) {
        setDataInfo(response.data);
      }
    } catch (err) {
      console.error('Error fetching data info:', err);
      alert('Failed to fetch data information: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Data & ETL Management</h2>
          <p className="text-muted mb-0">Monitor and manage ETL pipelines, data sources, and schedules</p>
        </div>
        <button className="btn btn-primary" onClick={fetchDataInfo}>
          <MdRefresh className="me-2" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : dataInfo ? (
        <>
          {/* Data Sources */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <MdDataUsage className="me-2" />
                Data Sources
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Row Count</th>
                      <th>Last Updated</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataInfo.sources.map((source, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{source.name}</strong>
                        </td>
                        <td>{source.row_count.toLocaleString()}</td>
                        <td>
                          {source.last_updated 
                            ? new Date(source.last_updated).toLocaleString()
                            : 'Never'}
                        </td>
                        <td>
                          <span className="badge bg-success">Active</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Table Sizes */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <MdStorage className="me-2" />
                Database Table Sizes
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Table Name</th>
                      <th>Size</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataInfo.table_sizes.map((table, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{table.name}</strong>
                        </td>
                        <td>{table.size}</td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary">
                            <MdUpdate className="me-1" />
                            Refresh
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3">
                <div className="alert alert-info mb-0">
                  <strong>ETL Pipeline:</strong> Data is automatically synced from source systems. 
                  Last sync: {new Date().toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card">
          <div className="card-body text-center py-5">
            <p className="text-muted">No data information available</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminData;

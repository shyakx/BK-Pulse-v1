import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MdVisibility, MdPhone, MdEmail } from 'react-icons/md';

const CustomerTable = ({ customers = [], onFilter, onSort }) => {
  const [sortField, setSortField] = useState('churn_score');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = (field) => {
    const direction = sortField === field && sortDirection === 'desc' ? 'asc' : 'desc';
    setSortField(field);
    setSortDirection(direction);
    onSort && onSort(field, direction);
  };

  const getRiskBadge = (riskLevel) => {
    const badges = {
      high: 'status-high-risk',
      medium: 'status-medium-risk',
      low: 'status-low-risk'
    };
    return badges[riskLevel] || 'status-low-risk';
  };

  const formatCurrency = (amount) => {
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

  return (
    <div className="bk-table">
      <table className="table table-hover mb-0" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th 
              className="cursor-pointer"
              onClick={() => handleSort('name')}
            >
              Customer
              {sortField === 'name' && (
                <span className="ms-1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </th>
            <th 
              className="cursor-pointer"
              onClick={() => handleSort('segment')}
            >
              Segment
              {sortField === 'segment' && (
                <span className="ms-1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </th>
            <th 
              className="cursor-pointer"
              onClick={() => handleSort('churn_score')}
            >
              Churn Score
              {sortField === 'churn_score' && (
                <span className="ms-1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </th>
            <th>Risk Level</th>
            <th 
              className="cursor-pointer"
              onClick={() => handleSort('account_balance')}
            >
              Balance
              {sortField === 'account_balance' && (
                <span className="ms-1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </th>
            <th>Branch</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-center py-4 text-muted">
                No customers found
              </td>
            </tr>
          ) : (
            customers.map((customer, index) => {
              const customerId = customer.id || customer.customer_id;
              if (!customerId) {
                console.error(`[CustomerTable] No valid ID found for customer:`, customer);
              }
              return (
              <tr key={customerId || customer.customer_id}>
                <td>
                  <div className="d-flex align-items-center">
                    <div 
                      className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '40px', height: '40px' }}
                    >
                      <span className="text-primary fw-bold">
                        {customer.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="fw-medium">{customer.name || 'Unknown'}</div>
                      <div className="text-muted small">{customer.customer_id || customer.id}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="badge bg-info bg-opacity-10 text-info">
                    {customer.segment}
                  </span>
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    <div className="progress me-2" style={{ width: '60px', height: '8px' }}>
                      <div 
                        className={`progress-bar ${
                          customer.churn_score > 70 ? 'bg-danger' : 
                          customer.churn_score > 40 ? 'bg-warning' : 'bg-success'
                        }`}
                        style={{ width: `${customer.churn_score}%` }}
                      ></div>
                    </div>
                    <span className="fw-medium">
                      {formatChurnScore(customer.churn_score)}
                    </span>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${getRiskBadge(customer.risk_level)}`}>
                    {customer.risk_level}
                  </span>
                </td>
                <td className="fw-medium">
                  {formatCurrency(customer.account_balance)}
                </td>
                <td>
                  <span className="text-muted">{customer.branch}</span>
                </td>
                <td>
                  <div className="d-flex gap-1">
                    <Link
                      to={`/customers/${customerId}`}
                      className="btn btn-sm btn-outline-primary"
                      title="View Details"
                      onClick={(e) => {
                        if (!customerId) {
                          e.preventDefault();
                          console.error('Customer missing ID:', customer);
                          alert('Error: Customer ID is missing');
                        }
                      }}
                    >
                      <MdVisibility />
                    </Link>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      title="Contact Customer"
                    >
                      <MdPhone />
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      title="Send Email"
                    >
                      <MdEmail />
                    </button>
                  </div>
                </td>
              </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerTable;


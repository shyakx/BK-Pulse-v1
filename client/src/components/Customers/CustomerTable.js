import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MdVisibility, MdPhone, MdAdd } from 'react-icons/md';
import api from '../../services/api';

const CustomerTable = ({ customers = [], onFilter, onSort }) => {
  const [sortField, setSortField] = useState('churn_score');
  const [sortDirection, setSortDirection] = useState('desc');
  const [addingTask, setAddingTask] = useState(null);

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

  const handleAddTask = async (customer) => {
    if (!window.confirm(`Add task for ${customer.name}?`)) {
      return;
    }

    try {
      const customerId = customer.id || customer.customer_id;
      setAddingTask(customerId);
      
      const taskData = {
        customer_id: customerId,
        action_type: 'Customer Retention',
        description: `Retention task for ${customer.name} (Churn Score: ${customer.churn_score || 0}%)`,
        priority: (customer.churn_score || 0) >= 70 ? 'high' : 'medium'
      };

      const response = await api.createTask(taskData);
      
      if (response.success) {
        alert('Task created successfully! Check My Tasks page.');
      } else {
        throw new Error(response.message || 'Failed to create task');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      alert('Failed to create task: ' + (err.response?.data?.message || err.message));
    } finally {
      setAddingTask(null);
    }
  };

  return (
    <div className="bk-table">
      <table className="table table-hover table-sm mb-0" style={{ width: '100%' }}>
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
              <td colSpan="7" className="text-center py-3 text-muted">
                No customers found
              </td>
            </tr>
          ) : (
            customers.map((customer, index) => {
              // Always use customer_id (actual customer ID like 100012), not id (database ID like 424010)
              const customerId = customer.customer_id || customer.id;
              if (!customerId) {
                console.error(`[CustomerTable] No valid ID found for customer:`, customer);
              }
              return (
              <tr key={customerId || `customer-${index}`}>
                <td>
                  <div className="d-flex align-items-center">
                    <div 
                      className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-2"
                      style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}
                    >
                      <span className="text-primary fw-bold">
                        {customer.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="fw-medium" style={{ fontSize: '0.8125rem' }}>{customer.name || 'Unknown'}</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>{customer.customer_id || customer.id}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="badge bg-info bg-opacity-10 text-info" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>
                    {customer.segment}
                  </span>
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    <div className="progress me-2" style={{ width: '50px', height: '6px' }}>
                      <div 
                        className={`progress-bar ${
                          customer.churn_score > 70 ? 'bg-danger' : 
                          customer.churn_score > 40 ? 'bg-warning' : 'bg-success'
                        }`}
                        style={{ width: `${customer.churn_score}%` }}
                      ></div>
                    </div>
                    <span className="fw-medium" style={{ fontSize: '0.8125rem' }}>
                      {formatChurnScore(customer.churn_score)}
                    </span>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${getRiskBadge(customer.risk_level)}`} style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>
                    {customer.risk_level}
                  </span>
                </td>
                <td className="fw-medium" style={{ fontSize: '0.8125rem' }}>
                  {formatCurrency(customer.account_balance)}
                </td>
                <td>
                  <span className="text-muted">{customer.branch}</span>
                </td>
                <td>
                  <div className="d-flex" style={{ gap: '0.25rem' }}>
                    <Link
                      to={`/customers/${customer.customer_id || customer.id}`}
                      className="btn btn-sm btn-outline-primary"
                      title="View Details"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={(e) => {
                        const idToUse = customer.customer_id || customer.id;
                        if (!idToUse) {
                          e.preventDefault();
                          console.error('Customer missing ID:', customer);
                          alert('Error: Customer ID is missing');
                        } else {
                          // Log for debugging
                          console.log(`[CustomerTable] Navigating to customer: ${idToUse} (customer_id: ${customer.customer_id}, id: ${customer.id})`);
                        }
                      }}
                    >
                      <MdVisibility size={16} />
                    </Link>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      title="Contact Customer"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      <MdPhone size={16} />
                    </button>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      title="Add Task"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={() => handleAddTask(customer)}
                      disabled={addingTask === (customer.id || customer.customer_id)}
                    >
                      {addingTask === (customer.id || customer.customer_id) ? (
                        <span className="spinner-border spinner-border-sm" style={{ width: '16px', height: '16px' }} />
                      ) : (
                        <MdAdd size={16} />
                      )}
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


import React, { useState, useEffect } from 'react';
import { MdAdd, MdCheckCircle, MdPending, MdWarning, MdCalendarToday, MdVisibility, MdEmail, MdAccountBalance, MdDelete, MdDownload } from 'react-icons/md';
import { Link } from 'react-router-dom';
import api from '../services/api';
import CustomerDetailsModal from '../components/CustomerDetailsModal';

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 100,
        status: activeTab === 'completed' ? 'completed' : activeTab === 'all' ? null : 'pending'
      };
      
      const response = await api.getTasks(params);
      
      if (response.success) {
        // Map API response to UI format
        const mappedTasks = response.tasks.map(task => {
          // Ensure priority matches churn score (high-risk = churn_score >= 70 = high priority)
          const churnScore = parseFloat(task.customer_churn_score) || 0;
          let priority = task.priority || 'medium';
          
          // Auto-set priority based on churn score if not already set correctly
          if (churnScore >= 70) {
            priority = 'high';
          } else if (churnScore >= 50) {
            priority = priority === 'high' ? 'medium' : (priority || 'medium');
          } else {
            priority = priority === 'high' ? 'low' : (priority || 'low');
          }
          
          // Update priority in database if it doesn't match
          if (task.priority !== priority) {
            // Update in background (don't wait for it)
            api.updateTask(task.id, { priority }).catch(err => {
              console.error('Error updating task priority:', err);
            });
          }

          return {
            id: task.id,
            customer_id: task.customer_customer_id || task.customer_id,
            customer_name: task.customer_name || 'Unknown',
            customer_email: task.customer_email || '',
            customer_segment: task.customer_segment || '-',
            customer_branch: task.customer_branch || '-',
            customer_churn_score: churnScore,
            customer_account_balance: task.customer_account_balance || 0,
            customer_product_type: task.customer_product_type || '-',
            task_type: task.action_type || 'Task',
            description: task.description,
            due_date: task.due_date || null,
            priority: priority,
            status: task.status || 'pending',
            updated_at: task.updated_at || task.created_at,
            created_at: task.created_at
          };
        });
        setTasks(mappedTasks);
      } else {
        throw new Error(response.message || 'Failed to fetch tasks');
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      alert('Failed to fetch tasks: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setUpdatingStatus(taskId);
      const response = await api.updateTask(taskId, { status: newStatus });
      
      if (response.success) {
        // Update local state
        setTasks(tasks.map(t => t.id === taskId ? {...t, status: newStatus, updated_at: new Date().toISOString()} : t));
      } else {
        throw new Error(response.message || 'Failed to update task status');
      }
    } catch (err) {
      alert('Failed to update task status: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleViewDetails = (customerId) => {
    setSelectedCustomerId(customerId);
    setShowCustomerModal(true);
  };

  const handleSendEmail = (task) => {
    const customerEmail = task.customer_email || '';
    const subject = encodeURIComponent(`Retention Follow-up - ${task.customer_name}`);
    const body = encodeURIComponent(`Dear ${task.customer_name},\n\nWe hope this message finds you well. We wanted to reach out regarding your account with us.\n\nBest regards,\nBK Retention Team`);
    if (customerEmail) {
      window.location.href = `mailto:${customerEmail}?subject=${subject}&body=${body}`;
    } else {
      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    }
  };

  const handleDeleteTask = async (taskId, customerName) => {
    if (!window.confirm(`Delete task for ${customerName}? The customer will be returned to your Analysis page.`)) {
      return;
    }

    try {
      setDeletingTask(taskId);
      const response = await api.deleteTask(taskId);
      
      if (response.success) {
        // Remove task from list
        setTasks(tasks.filter(t => t.id !== taskId));
        alert('Task deleted successfully. Customer has been returned to your Analysis page.');
      } else {
        throw new Error(response.message || 'Failed to delete task');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Failed to delete task: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeletingTask(null);
    }
  };

  const getTaskStats = () => {
    const now = new Date();
    const totalTasks = tasks.length;
    const highPriority = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;
    const valueAtRisk = tasks
      .filter(t => t.status !== 'completed' && (t.customer_churn_score >= 70))
      .reduce((sum, t) => sum + (parseFloat(t.customer_account_balance) || 0), 0);

    return {
      totalTasks,
      highPriority,
      valueAtRisk
    };
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: 'bg-danger',
      medium: 'bg-warning',
      low: 'bg-info'
    };
    return badges[priority] || 'bg-secondary';
  };

  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'all') return true;
    if (activeTab === 'high') return task.priority === 'high' && task.status !== 'completed';
    if (activeTab === 'overdue') {
      const now = new Date();
      return task.status !== 'completed' && new Date(task.due_date) < now;
    }
    if (activeTab === 'completed') return task.status === 'completed';
    return true;
  });

  const stats = getTaskStats();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleExport = () => {
    if (filteredTasks.length === 0) {
      alert('No tasks to export');
      return;
    }

    // Create CSV content
    let csvContent = 'Today\'s Portfolio Export\n';
    csvContent += `Generated: ${new Date().toLocaleString()}\n`;
    csvContent += `Total Tasks: ${filteredTasks.length}\n\n`;
    
    // CSV Headers
    csvContent += 'Customer ID,Customer Name,Email,Segment,Branch,Product Type,Churn Score (%),Balance (RWF),Last Contacted,Due Date,Priority,Status,Task Type,Description\n';
    
    // CSV Data
    filteredTasks.forEach(task => {
      const row = [
        task.customer_id || '',
        `"${(task.customer_name || '').replace(/"/g, '""')}"`,
        task.customer_email || '',
        task.customer_segment || '',
        task.customer_branch || '',
        task.customer_product_type || '',
        task.customer_churn_score.toFixed(1),
        parseFloat(task.customer_account_balance || 0).toFixed(2),
        task.updated_at ? new Date(task.updated_at).toLocaleDateString() : 'Never',
        task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A',
        task.priority.toUpperCase(),
        task.status,
        task.task_type || '',
        `"${(task.description || '').replace(/"/g, '""')}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `my_tasks_portfolio_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold mb-1">Today's Portfolio</h2>
          <p className="text-muted mb-0">Manage your daily retention tasks and customer interactions</p>
        </div>
        <div className="d-flex gap-2">
          {filteredTasks.length > 0 && (
            <button className="btn btn-success" onClick={handleExport}>
              <MdDownload className="me-2" />
              Export CSV
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <MdAdd className="me-2" />
            Add Task
          </button>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="row mb-3 g-2">
        <div className="col-md-4">
          <div className="card border-primary h-100" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: '500' }}>Total Tasks</p>
                  <h4 className="mb-0 text-primary" style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stats.totalTasks}</h4>
                </div>
                <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <MdPending className="text-primary" style={{ fontSize: '1.5rem' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-danger h-100" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: '500' }}>High Priority</p>
                  <h4 className="mb-0 text-danger" style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stats.highPriority}</h4>
                </div>
                <div className="bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <MdWarning className="text-danger" style={{ fontSize: '1.5rem' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-warning h-100" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: '500' }}>Value at Risk</p>
                  <h4 className="mb-0 text-warning" style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                    {(stats.valueAtRisk / 1000000).toFixed(1)}M
                  </h4>
                </div>
                <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <MdAccountBalance className="text-warning" style={{ fontSize: '1.5rem' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Tasks
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'high' ? 'active' : ''}`}
            onClick={() => setActiveTab('high')}
          >
            High Priority
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'overdue' ? 'active' : ''}`}
            onClick={() => setActiveTab('overdue')}
          >
            Overdue
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed
          </button>
        </li>
      </ul>

      {/* Task List */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No tasks found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-sm" style={{ fontSize: '0.75rem' }}>
                <thead>
                  <tr>
                    <th width="25" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>✓</th>
                    <th width="120" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Customer</th>
                    <th width="70" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Segment</th>
                    <th width="80" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Branch</th>
                    <th width="70" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Churn</th>
                    <th width="80" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Product</th>
                    <th width="75" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Balance</th>
                    <th width="80" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Last Contact</th>
                    <th width="80" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Due Date</th>
                    <th width="50" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Priority</th>
                    <th width="90" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Status</th>
                    <th width="100" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map(task => (
                    <tr key={task.id}>
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        {task.status === 'completed' && (
                          <MdCheckCircle className="text-success" size={16} />
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        <div className="fw-medium" style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>
                          {task.customer_name?.length > 15 ? `${task.customer_name.substring(0, 15)}...` : task.customer_name}
                        </div>
                        <small className="text-muted" style={{ fontSize: '0.65rem' }}>{task.customer_id?.substring(0, 10)}...</small>
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        <span className="badge bg-info bg-opacity-10 text-info" style={{ fontSize: '0.65rem', padding: '0.15rem 0.3rem' }}>
                          {task.customer_segment?.substring(0, 6) || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {task.customer_branch?.length > 10 ? `${task.customer_branch.substring(0, 10)}...` : task.customer_branch || '-'}
                        </small>
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        <span className={`badge ${
                          task.customer_churn_score >= 70 ? 'bg-danger' :
                          task.customer_churn_score >= 50 ? 'bg-warning' : 'bg-success'
                        }`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.3rem' }}>
                          {task.customer_churn_score.toFixed(0)}%
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {task.customer_product_type?.length > 8 ? `${task.customer_product_type.substring(0, 8)}...` : task.customer_product_type || '-'}
                        </small>
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        <small className="fw-medium" style={{ fontSize: '0.7rem' }}>
                          {(parseFloat(task.customer_account_balance || 0) / 1000000).toFixed(1)}M
                        </small>
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                          {task.updated_at ? new Date(task.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}
                        </small>
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                          {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                        </small>
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        <span className={`badge ${getPriorityBadge(task.priority)}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.3rem' }}>
                          {task.priority.charAt(0).toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        <select
                          className={`form-select form-select-sm ${updatingStatus === task.id ? 'opacity-50' : ''}`}
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          disabled={updatingStatus === task.id}
                          style={{ 
                            minWidth: '85px',
                            fontSize: '0.65rem',
                            padding: '0.15rem 0.3rem',
                            height: '22px'
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleViewDetails(task.customer_id)}
                            title="View Details"
                            style={{ padding: '0.15rem 0.3rem', fontSize: '0.65rem' }}
                          >
                            <MdVisibility size={12} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleSendEmail(task)}
                            title="Send Email"
                            style={{ padding: '0.15rem 0.3rem', fontSize: '0.65rem' }}
                            disabled={!task.customer_name}
                          >
                            <MdEmail size={12} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteTask(task.id, task.customer_name)}
                            title="Delete Task"
                            style={{ padding: '0.15rem 0.3rem', fontSize: '0.65rem' }}
                            disabled={deletingTask === task.id}
                          >
                            {deletingTask === task.id ? (
                              <span className="spinner-border spinner-border-sm" style={{ width: '10px', height: '10px' }} />
                            ) : (
                              <MdDelete size={12} />
                            )}
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

      {/* Customer Details Modal */}
      <CustomerDetailsModal
        customerId={selectedCustomerId}
        isOpen={showCustomerModal}
        onClose={() => {
          setShowCustomerModal(false);
          setSelectedCustomerId(null);
        }}
        onNoteAdded={() => {
          fetchTasks();
        }}
      />
    </div>
  );
};

export default MyTasks;

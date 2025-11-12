import React, { useState, useEffect } from 'react';
import { MdAdd, MdCheckCircle, MdVisibility, MdEmail, MdDelete, MdDownload } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import CustomerDetailsModal from '../components/CustomerDetailsModal';
import ChurnOverviewCard from '../components/Dashboard/ChurnOverviewCard';

const MyTasks = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [creatingTask, setCreatingTask] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [, setShowAddModal] = useState(false);
  const [assignedCustomersCount, setAssignedCustomersCount] = useState(0);
  const [assignedCustomersChange, setAssignedCustomersChange] = useState('+0 this week');

  useEffect(() => {
    if (user) {
      if (user.role === 'retentionOfficer') {
        fetchAssignedCustomers();
      } else {
    fetchTasks();
      }
    fetchAssignedCustomersCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  const fetchAssignedCustomersCount = async () => {
    try {
      const response = await api.getDashboard();
      if (response.success || response.assignedCustomers !== undefined) {
        setAssignedCustomersCount(response.assignedCustomers || 0);
        setAssignedCustomersChange(response.assignedCustomersChange || '+0 this week');
      }
    } catch (err) {
      console.error('Error fetching assigned customers count:', err);
    }
  };

  const fetchAssignedCustomers = async () => {
    try {
      setLoading(true);
      
      // Fetch both assigned customers AND tasks to show complete portfolio
      const [assignmentsResponse, tasksResponse] = await Promise.all([
        api.getMyAssignedCustomers({ page: 1, limit: 500, search: '' }),
        api.getTasks({ page: 1, limit: 500, status: null }) // Get all tasks (pending, in_progress, completed)
      ]);
      
      const allCustomers = [];
      const customerTaskMap = new Map();
      
      // Map tasks to their customers
      if (tasksResponse.success && tasksResponse.tasks) {
        tasksResponse.tasks.forEach(task => {
          const customerId = task.customer_id || task.customer_customer_id;
          if (customerId) {
            customerTaskMap.set(customerId, {
              taskId: task.id,
              status: task.status,
              priority: task.priority,
              due_date: task.due_date,
              description: task.description,
              updated_at: task.updated_at,
              created_at: task.created_at
            });
          }
        });
      }
      
      // Process assigned customers
      if (assignmentsResponse.success && assignmentsResponse.customers) {
        assignmentsResponse.customers.forEach(customer => {
          const customerId = customer.id || customer.customer_id;
          const task = customerTaskMap.get(customerId);
          
          allCustomers.push({
            ...customer,
            hasTask: !!task,
            task: task || null
          });
        });
      }
      
      // Add customers that have tasks but might not be in assignments (edge case)
      if (tasksResponse.success && tasksResponse.tasks) {
        tasksResponse.tasks.forEach(task => {
          const customerId = task.customer_id || task.customer_customer_id;
          const exists = allCustomers.some(c => (c.id || c.customer_id) === customerId);
          
          if (!exists && task.customer_name) {
            // Customer has a task but not in assignments - add them
            allCustomers.push({
              id: task.customer_id,
              customer_id: task.customer_customer_id || task.customer_id,
              name: task.customer_name,
              email: task.customer_email,
              segment: task.customer_segment,
              branch: task.customer_branch,
              product_type: task.customer_product_type,
              churn_score: task.customer_churn_score,
              risk_level: task.customer_risk_level,
              account_balance: task.customer_account_balance,
              hasTask: true,
              task: {
                taskId: task.id,
                status: task.status,
                priority: task.priority,
                due_date: task.due_date,
                description: task.description,
                updated_at: task.updated_at,
                created_at: task.created_at
              }
            });
          }
        });
      }
      
      // Sort by churn score (high to low)
      allCustomers.sort((a, b) => {
        const scoreA = parseFloat(a.churn_score || 0) || 0;
        const scoreB = parseFloat(b.churn_score || 0) || 0;
        return scoreB - scoreA;
      });
      
      setCustomers(allCustomers);
    } catch (err) {
      console.error('Error fetching assigned customers:', err);
      alert('Failed to fetch assigned customers: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // For non-officer roles, fetch tasks as before
      const params = {
        page: 1,
        limit: 100,
        status: activeTab === 'completed' ? 'completed' : activeTab === 'all' ? null : activeTab === 'high' ? null : 'pending'
      };
      
      const response = await api.getTasks(params);
      
      if (response.success) {
        const mappedTasks = response.tasks.map(task => {
          const churnScore = parseFloat(task.customer_churn_score) || 0;
          let priority = task.priority || 'medium';
          
          if (churnScore >= 70) {
            priority = 'high';
          } else if (churnScore >= 50) {
            priority = priority === 'high' ? 'medium' : (priority || 'medium');
          } else {
            priority = priority === 'high' ? 'low' : (priority || 'low');
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
        setCustomers(mappedTasks);
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

  const handleCreateTask = async (customer) => {
    if (!window.confirm(`Create task for ${customer.name}?`)) {
      return;
    }

    try {
      setCreatingTask(customer.id || customer.customer_id);
      const customerId = customer.id || customer.customer_id;
      
      const taskData = {
        customer_id: customerId,
        action_type: 'Customer Retention',
        description: `Retention task for ${customer.name} (Churn Score: ${customer.churn_score || 0}%)`,
        priority: (customer.churn_score || 0) >= 70 ? 'high' : (customer.churn_score || 0) >= 50 ? 'medium' : 'low'
      };

      const response = await api.createTask(taskData);
      
      if (response.success) {
        // Update customer to show they now have a task
        setCustomers(customers.map(c => {
          const cId = c.id || c.customer_id;
          if (cId === customerId) {
            return {
              ...c,
              hasTask: true,
              task: {
                taskId: response.task?.id,
                status: 'pending',
                priority: taskData.priority,
                due_date: response.task?.due_date,
                description: taskData.description,
                updated_at: new Date().toISOString(),
                created_at: new Date().toISOString()
              }
            };
          }
          return c;
        }));
        alert('Task created successfully! The customer now appears with an active task.');
      } else {
        throw new Error(response.message || 'Failed to create task');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      alert('Failed to create task: ' + (err.response?.data?.message || err.message));
    } finally {
      setCreatingTask(null);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setUpdatingStatus(taskId);
      const response = await api.updateTask(taskId, { status: newStatus });
      
      if (response.success) {
        // Update local state - for officers, update the task within the customer object
        if (user?.role === 'retentionOfficer') {
          setCustomers(customers.map(c => {
            if (c.hasTask && c.task?.taskId === taskId) {
              return {
                ...c,
                task: {
                  ...c.task,
                  status: newStatus,
                  updated_at: new Date().toISOString()
                }
              };
            }
            return c;
          }));
        } else {
          // For non-officers, update task directly
          setCustomers(customers.map(t => t.id === taskId ? {...t, status: newStatus, updated_at: new Date().toISOString()} : t));
        }
      } else {
        throw new Error(response.message || 'Failed to update task status');
      }
    } catch (err) {
      alert('Failed to update task status: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteTask = async (taskId, customerName) => {
    if (!window.confirm(`Delete task for ${customerName}? The customer will remain assigned but without a task.`)) {
      return;
    }

    try {
      setDeletingTask(taskId);
      const response = await api.deleteTask(taskId);
      
      if (response.success) {
        // For officers, remove task from customer but keep customer in list
        if (user?.role === 'retentionOfficer') {
          setCustomers(customers.map(c => {
            if (c.hasTask && c.task?.taskId === taskId) {
              return {
                ...c,
                hasTask: false,
                task: null
              };
            }
            return c;
          }));
        } else {
          // For non-officers, remove task from list
          setCustomers(customers.filter(t => t.id !== taskId));
        }
        alert('Task deleted successfully. Customer remains in your portfolio.');
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

  const handleViewDetails = (customerId) => {
    setSelectedCustomerId(customerId);
    setShowCustomerModal(true);
  };

  const handleSendEmail = (customer) => {
    const customerEmail = customer.email || '';
    const subject = encodeURIComponent(`Retention Follow-up - ${customer.name}`);
    const body = encodeURIComponent(`Dear ${customer.name},\n\nWe hope this message finds you well. We wanted to reach out regarding your account with us.\n\nBest regards,\nBK Retention Team`);
    if (customerEmail) {
      window.location.href = `mailto:${customerEmail}?subject=${subject}&body=${body}`;
    } else {
      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    }
  };

  const getCustomerStats = () => {
    const totalCustomers = customers.length;
    const highPriority = customers.filter(c => (c.churn_score || 0) >= 70).length;
    const valueAtRisk = customers
      .filter(c => (c.churn_score || 0) >= 70)
      .reduce((sum, c) => sum + (parseFloat(c.account_balance) || 0), 0);

    return {
      totalCustomers,
      highPriority,
      valueAtRisk
    };
  };

  const getTaskStats = () => {
    const totalTasks = customers.length;
    const highPriority = customers.filter(t => t.priority === 'high' && t.status !== 'completed').length;
    const valueAtRisk = customers
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

  const getPriorityFromChurnScore = (churnScore) => {
    const score = parseFloat(churnScore) || 0;
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  };

  const filteredCustomers = user?.role === 'retentionOfficer' 
    ? customers.filter(customer => {
        // For retention officers, filter assigned customers by churn score/priority and task status
        if (activeTab === 'all') return true; // Show all assigned customers (with or without tasks)
        if (activeTab === 'high') {
          const score = parseFloat(customer.churn_score || 0) || 0;
          return score >= 70;
        }
        if (activeTab === 'overdue') {
          // Show customers with tasks that are overdue
          if (!customer.hasTask || !customer.task?.due_date) return false;
          const now = new Date();
          const dueDate = new Date(customer.task.due_date);
          return customer.task.status !== 'completed' && dueDate < now;
        }
        if (activeTab === 'completed') {
          // Show customers with completed tasks
          return customer.hasTask && customer.task?.status === 'completed';
        }
        return true;
      })
    : customers.filter(task => {
        // For non-officers, filter tasks as before
        if (activeTab === 'all') return task.status !== 'completed' && task.status !== 'cancelled';
    if (activeTab === 'high') return task.priority === 'high' && task.status !== 'completed';
    if (activeTab === 'overdue') {
      const now = new Date();
      return task.status !== 'completed' && new Date(task.due_date) < now;
    }
    if (activeTab === 'completed') return task.status === 'completed';
    return true;
  });

  const stats = user?.role === 'retentionOfficer' ? getCustomerStats() : getTaskStats();

  const handleExport = () => {
    if (filteredCustomers.length === 0) {
      alert('No customers to export');
      return;
    }

    // Create CSV content
    const isOfficer = user?.role === 'retentionOfficer';
    let csvContent = isOfficer ? 'My Assigned Customers Export\n' : 'Today\'s Portfolio Export\n';
    csvContent += `Generated: ${new Date().toLocaleString()}\n`;
    csvContent += `Total ${isOfficer ? 'Customers' : 'Tasks'}: ${filteredCustomers.length}\n\n`;
    
    // CSV Headers
    if (isOfficer) {
      csvContent += 'Customer ID,Customer Name,Email,Segment,Branch,Product Type,Churn Score (%),Risk Level,Balance (RWF),Assigned Date\n';
    } else {
    csvContent += 'Customer ID,Customer Name,Email,Segment,Branch,Product Type,Churn Score (%),Balance (RWF),Last Contacted,Due Date,Priority,Status,Task Type,Description\n';
    }
    
    // CSV Data
    filteredCustomers.forEach(item => {
      if (isOfficer) {
        const row = [
          item.customer_id || '',
          `"${(item.name || '').replace(/"/g, '""')}"`,
          item.email || '',
          item.segment || '',
          item.branch || '',
          item.product_type || '',
          (parseFloat(item.churn_score) || 0).toFixed(1),
          item.risk_level || 'low',
          parseFloat(item.account_balance || 0).toFixed(2),
          item.assigned_at ? new Date(item.assigned_at).toLocaleDateString() : 'N/A'
        ];
        csvContent += row.join(',') + '\n';
      } else {
      const row = [
          item.customer_id || '',
          `"${(item.customer_name || '').replace(/"/g, '""')}"`,
          item.customer_email || '',
          item.customer_segment || '',
          item.customer_branch || '',
          item.customer_product_type || '',
          (parseFloat(item.customer_churn_score) || 0).toFixed(1),
          parseFloat(item.customer_account_balance || 0).toFixed(2),
          item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'Never',
          item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A',
          item.priority?.toUpperCase() || 'MEDIUM',
          item.status || 'pending',
          item.task_type || '',
          `"${(item.description || '').replace(/"/g, '""')}"`
      ];
      csvContent += row.join(',') + '\n';
      }
    });

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = isOfficer ? `my_assigned_customers_${dateStr}.csv` : `my_tasks_portfolio_${dateStr}.csv`;
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
          <p className="text-muted mb-0">
            {user?.role === 'retentionOfficer' 
              ? 'Your assigned customers, ordered by churn score (high to low). Create tasks to start working on them.'
              : 'Manage your active retention tasks. Customers with pending or in-progress tasks appear here.'}
          </p>
        </div>
        <div className="d-flex gap-2">
          {filteredCustomers.length > 0 && (
            <button className="btn btn-success" onClick={handleExport}>
              <MdDownload className="me-2" />
              Export CSV
            </button>
          )}
          {user?.role !== 'retentionOfficer' && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <MdAdd className="me-2" />
            Add Task
          </button>
          )}
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <ChurnOverviewCard
            title={user?.role === 'retentionOfficer' ? 'Assigned Customers' : 'My Assigned Customers'}
            value={user?.role === 'retentionOfficer' ? stats.totalCustomers : assignedCustomersCount}
            change={user?.role === 'retentionOfficer' ? 'In portfolio' : assignedCustomersChange}
            trend="up"
            icon="people"
            color="primary"
            delay={0}
          />
        </div>
        <div className="col-md-4 mb-3">
          <ChurnOverviewCard
            title={user?.role === 'retentionOfficer' ? 'High Risk Customers' : 'High Priority Tasks'}
            value={stats.highPriority}
            change={user?.role === 'retentionOfficer' ? 'Churn ≥70%' : 'Active tasks'}
            trend="up"
            icon="warning"
            color="danger"
            delay={100}
          />
        </div>
        <div className="col-md-4 mb-3">
          <ChurnOverviewCard
            title="Value at Risk"
            value={`${(stats.valueAtRisk / 1000000).toFixed(1)}M`}
            change="RWF"
            trend="up"
            icon="trending-up"
            color="warning"
            delay={200}
          />
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
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">{user?.role === 'retentionOfficer' ? 'No assigned customers found' : 'No tasks found'}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-sm" style={{ fontSize: '0.75rem' }}>
                <thead>
                  <tr>
                    {user?.role !== 'retentionOfficer' && (
                    <th width="25" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>✓</th>
                    )}
                    <th width="120" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Customer</th>
                    <th width="70" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Segment</th>
                    <th width="80" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Branch</th>
                    <th width="80" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Product</th>
                    <th width="75" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Churn Score</th>
                    <th width="75" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Balance</th>
                    {user?.role !== 'retentionOfficer' && (
                      <>
                    <th width="80" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Last Contact</th>
                    <th width="80" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Due Date</th>
                      </>
                    )}
                    {user?.role === 'retentionOfficer' && (
                      <th width="80" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Assigned</th>
                    )}
                    {user?.role === 'retentionOfficer' && (
                      <th width="80" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Task Status</th>
                    )}
                    <th width="50" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Priority</th>
                    {user?.role !== 'retentionOfficer' && (
                      <th width="90" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Status</th>
                    )}
                    <th width="100" style={{ fontSize: '0.7rem', padding: '0.5rem 0.25rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(item => {
                    const isOfficer = user?.role === 'retentionOfficer';
                    const customer = isOfficer ? item : null;
                    const task = !isOfficer ? item : null;
                    const customerId = isOfficer ? (customer.id || customer.customer_id) : (task.customer_id || task.customer_customer_id);
                    const customerName = isOfficer ? customer.name : task.customer_name;
                    // Ensure churnScore is a number
                    const churnScore = parseFloat(isOfficer ? (customer.churn_score || 0) : (task.customer_churn_score || 0)) || 0;
                    const priority = isOfficer ? getPriorityFromChurnScore(churnScore) : task.priority;
                    // Convert customerId to string for display
                    const customerIdStr = customerId ? String(customerId) : '';
                    
                    return (
                      <tr key={isOfficer ? customerId : task.id}>
                        {!isOfficer && (
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        {task.status === 'completed' && (
                          <MdCheckCircle className="text-success" size={16} />
                        )}
                      </td>
                        )}
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        <div className="fw-medium" style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>
                            {isOfficer ? (
                              <Link to={`/customers/${customerId}`} style={{ textDecoration: 'none' }}>
                                {customerName?.length > 15 ? `${customerName.substring(0, 15)}...` : customerName}
                              </Link>
                            ) : (
                              customerName?.length > 15 ? `${customerName.substring(0, 15)}...` : customerName
                            )}
                        </div>
                          <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                            {customerIdStr ? (customerIdStr.length > 10 ? `${customerIdStr.substring(0, 10)}...` : customerIdStr) : '-'}
                          </small>
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        <span className="badge bg-info bg-opacity-10 text-info" style={{ fontSize: '0.65rem', padding: '0.15rem 0.3rem' }}>
                            {(isOfficer ? customer.segment : task.customer_segment)?.substring(0, 6) || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                            {(isOfficer ? customer.branch : task.customer_branch)?.length > 10 
                              ? `${(isOfficer ? customer.branch : task.customer_branch).substring(0, 10)}...` 
                              : (isOfficer ? customer.branch : task.customer_branch) || '-'}
                        </small>
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                            {(isOfficer ? customer.product_type : task.customer_product_type)?.length > 8 
                              ? `${(isOfficer ? customer.product_type : task.customer_product_type).substring(0, 8)}...` 
                              : (isOfficer ? customer.product_type : task.customer_product_type) || '-'}
                          </small>
                        </td>
                        <td style={{ padding: '0.5rem 0.25rem' }}>
                          <small className={`fw-medium ${churnScore >= 70 ? 'text-danger' : churnScore >= 50 ? 'text-warning' : ''}`} style={{ fontSize: '0.7rem' }}>
                            {churnScore.toFixed(1)}%
                        </small>
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        <small className="fw-medium" style={{ fontSize: '0.7rem' }}>
                            {(parseFloat(isOfficer ? customer.account_balance : task.customer_account_balance || 0) / 1000000).toFixed(1)}M
                        </small>
                      </td>
                        {!isOfficer && (
                          <>
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
                          </>
                        )}
                        {isOfficer && (
                          <td style={{ padding: '0.5rem 0.25rem' }}>
                            <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                              {customer.assigned_at ? new Date(customer.assigned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                            </small>
                          </td>
                        )}
                        {isOfficer && (
                          <td style={{ padding: '0.5rem 0.25rem' }}>
                            {customer.hasTask ? (
                              <select
                                className={`form-select form-select-sm ${updatingStatus === customer.task?.taskId ? 'opacity-50' : ''}`}
                                value={customer.task?.status || 'pending'}
                                onChange={(e) => {
                                  if (customer.task?.taskId) {
                                    handleStatusChange(customer.task.taskId, e.target.value);
                                  }
                                }}
                                disabled={updatingStatus === customer.task?.taskId}
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
                            ) : (
                              <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                                No task
                              </small>
                            )}
                          </td>
                        )}
                        <td style={{ padding: '0.5rem 0.25rem' }}>
                          <span className={`badge ${getPriorityBadge(priority)}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.3rem' }}>
                            {priority.charAt(0).toUpperCase()}
                          </span>
                        </td>
                        {!isOfficer && (
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
                        )}
                      <td style={{ padding: '0.5rem 0.25rem' }}>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-primary"
                              onClick={() => handleViewDetails(customerId)}
                            title="View Details"
                            style={{ padding: '0.15rem 0.3rem', fontSize: '0.65rem' }}
                          >
                            <MdVisibility size={12} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleSendEmail(isOfficer ? customer : task)}
                            title="Send Email"
                            style={{ padding: '0.15rem 0.3rem', fontSize: '0.65rem' }}
                              disabled={!customerName}
                          >
                            <MdEmail size={12} />
                          </button>
                            {isOfficer ? (
                              <>
                                {!customer.hasTask ? (
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => handleCreateTask(customer)}
                                    title="Create Task"
                                    style={{ padding: '0.15rem 0.3rem', fontSize: '0.65rem' }}
                                    disabled={creatingTask === customerId}
                                  >
                                    {creatingTask === customerId ? (
                                      <span className="spinner-border spinner-border-sm" style={{ width: '10px', height: '10px' }} />
                                    ) : (
                                      <MdAdd size={12} />
                                    )}
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => {
                                      if (customer.task?.taskId) {
                                        handleDeleteTask(customer.task.taskId, customerName);
                                      }
                                    }}
                                    title="Delete Task"
                                    style={{ padding: '0.15rem 0.3rem', fontSize: '0.65rem' }}
                                    disabled={deletingTask === customer.task?.taskId}
                                  >
                                    {deletingTask === customer.task?.taskId ? (
                                      <span className="spinner-border spinner-border-sm" style={{ width: '10px', height: '10px' }} />
                                    ) : (
                                      <MdDelete size={12} />
                                    )}
                                  </button>
                                )}
                              </>
                            ) : (
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
                            )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
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
          if (user?.role === 'retentionOfficer') {
            fetchAssignedCustomers();
          } else {
          fetchTasks();
          }
        }}
      />
    </div>
  );
};

export default MyTasks;

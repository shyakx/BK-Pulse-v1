import React, { useState, useEffect } from 'react';
import { MdAdd, MdCheckCircle, MdPending, MdWarning, MdCalendarToday } from 'react-icons/md';
import { Link } from 'react-router-dom';
import api from '../services/api';

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

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
        const mappedTasks = response.tasks.map(task => ({
          id: task.id,
          customer_id: task.customer_customer_id || task.customer_id,
          customer_name: task.customer_name || 'Unknown',
          task_type: task.action_type || 'Task',
          description: task.description,
          due_date: task.due_date || null,
          priority: task.priority || 'medium',
          status: task.status || 'pending'
        }));
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

  const handleCompleteTask = async (taskId) => {
    try {
      const response = await api.completeTask(taskId);
      
      if (response.success) {
        // Update local state
        setTasks(tasks.map(t => t.id === taskId ? {...t, status: 'completed'} : t));
      } else {
        throw new Error(response.message || 'Failed to complete task');
      }
    } catch (err) {
      alert('Failed to complete task: ' + (err.response?.data?.message || err.message));
    }
  };

  const getTaskStats = () => {
    const now = new Date();
    return {
      overdue: tasks.filter(t => t.status === 'pending' && new Date(t.due_date) < now).length,
      dueToday: tasks.filter(t => {
        const due = new Date(t.due_date);
        return t.status === 'pending' && 
               due.toDateString() === now.toDateString();
      }).length,
      dueThisWeek: tasks.filter(t => {
        const due = new Date(t.due_date);
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return t.status === 'pending' && due <= weekFromNow && due >= now;
      }).length,
      completed: tasks.filter(t => t.status === 'completed').length
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
    if (activeTab === 'high') return task.priority === 'high' && task.status === 'pending';
    if (activeTab === 'overdue') {
      const now = new Date();
      return task.status === 'pending' && new Date(task.due_date) < now;
    }
    if (activeTab === 'completed') return task.status === 'completed';
    return true;
  });

  const stats = getTaskStats();

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold mb-1">My Tasks</h2>
          <p className="text-muted mb-0">Track assigned work and follow-ups</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <MdAdd className="me-2" />
          Add Task
        </button>
      </div>

      {/* Task Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card border-danger">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">Overdue</p>
                  <h3 className="mb-0 text-danger">{stats.overdue}</h3>
                </div>
                <MdWarning className="text-danger" style={{ fontSize: '2rem' }} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border-warning">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">Due Today</p>
                  <h3 className="mb-0 text-warning">{stats.dueToday}</h3>
                </div>
                <MdCalendarToday className="text-warning" style={{ fontSize: '2rem' }} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border-info">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">Due This Week</p>
                  <h3 className="mb-0 text-info">{stats.dueThisWeek}</h3>
                </div>
                <MdPending className="text-info" style={{ fontSize: '2rem' }} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border-success">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">Completed</p>
                  <h3 className="mb-0 text-success">{stats.completed}</h3>
                </div>
                <MdCheckCircle className="text-success" style={{ fontSize: '2rem' }} />
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
        <div className="card-body">
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
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th width="50">Done</th>
                    <th>Customer</th>
                    <th>Task Type</th>
                    <th>Due Date</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map(task => (
                    <tr key={task.id}>
                      <td>
                        {task.status === 'pending' && (
                          <input
                            type="checkbox"
                            onChange={() => handleCompleteTask(task.id)}
                            className="form-check-input"
                          />
                        )}
                        {task.status === 'completed' && (
                          <MdCheckCircle className="text-success" />
                        )}
                      </td>
                      <td>
                        <Link to={`/customers/${task.customer_id}`}>
                          {task.customer_name}
                        </Link>
                        <br />
                        <small className="text-muted">{task.customer_id}</small>
                      </td>
                      <td>{task.task_type}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <MdCalendarToday className="me-1 text-muted" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getPriorityBadge(task.priority)}`}>
                          {task.priority.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {task.status === 'completed' ? (
                          <span className="badge bg-success">Completed</span>
                        ) : (
                          <span className="badge bg-warning">Pending</span>
                        )}
                      </td>
                      <td>
                        <Link
                          to={`/customers/${task.customer_id}`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          View Customer
                        </Link>
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

export default MyTasks;


import React from 'react';
import { MdPriorityHigh, MdSchedule, MdCheckCircle } from 'react-icons/md';

const TaskList = ({ tasks = [] }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <MdPriorityHigh />;
      case 'medium':
        return <MdSchedule />;
      case 'low':
        return <MdCheckCircle />;
      default:
        return <MdSchedule />;
    }
  };

  return (
    <div className="bk-card">
      <div className="bk-card-header">
        <h5 className="fw-bold mb-0">Recent Tasks</h5>
      </div>
      <div className="bk-card-body p-0">
        {tasks.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <MdCheckCircle size={48} className="mb-3 opacity-50" />
            <p className="mb-0">No pending tasks</p>
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {tasks.map((task, index) => (
              <div key={index} className="list-group-item border-0 py-3">
                <div className="d-flex align-items-start">
                  <div 
                    className={`bg-${getPriorityColor(task.priority)} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3`}
                    style={{ width: '32px', height: '32px', minWidth: '32px' }}
                  >
                    <span className={`text-${getPriorityColor(task.priority)}`}>
                      {getPriorityIcon(task.priority)}
                    </span>
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="fw-medium mb-1">{task.title}</h6>
                    <p className="text-muted small mb-2">{task.description}</p>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className={`badge bg-${getPriorityColor(task.priority)} bg-opacity-10 text-${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <small className="text-muted">{task.dueDate}</small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;


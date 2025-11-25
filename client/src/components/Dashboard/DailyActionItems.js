import React from 'react';
import { MdToday, MdWarning, MdPriorityHigh, MdArrowForward } from 'react-icons/md';
import { Link } from 'react-router-dom';

const DailyActionItems = ({ dailyActions }) => {
  const { dueToday = 0, overdueTasks = 0, highPriorityPending = 0 } = dailyActions || {};

  return (
    <div className="bk-card">
      <div className="bk-card-header">
        <h5 className="fw-bold mb-0">Daily Action Items</h5>
      </div>
      <div className="bk-card-body">
        <div className="row g-3">
          <div className="col-12">
            <Link to="/tasks?filter=due_today" className="text-decoration-none">
              <div className="d-flex align-items-center justify-content-between p-3 bg-primary bg-opacity-10 rounded">
                <div className="d-flex align-items-center">
                  <MdToday className="text-primary me-3" size={24} />
                  <div>
                    <h6 className="mb-0 fw-bold">Follow-ups Due Today</h6>
                    <small className="text-muted">Tasks scheduled for today</small>
                  </div>
                </div>
                <div className="d-flex align-items-center">
                  <span className="badge bg-primary rounded-pill me-2" style={{ fontSize: '1.1rem', padding: '0.5rem 1rem' }}>
                    {dueToday}
                  </span>
                  <MdArrowForward className="text-primary" />
                </div>
              </div>
            </Link>
          </div>
          
          <div className="col-12">
            <Link to="/tasks?filter=overdue" className="text-decoration-none">
              <div className="d-flex align-items-center justify-content-between p-3 bg-danger bg-opacity-10 rounded">
                <div className="d-flex align-items-center">
                  <MdWarning className="text-danger me-3" size={24} />
                  <div>
                    <h6 className="mb-0 fw-bold">Overdue Tasks</h6>
                    <small className="text-muted">Tasks past their due date</small>
                  </div>
                </div>
                <div className="d-flex align-items-center">
                  <span className="badge bg-danger rounded-pill me-2" style={{ fontSize: '1.1rem', padding: '0.5rem 1rem' }}>
                    {overdueTasks}
                  </span>
                  <MdArrowForward className="text-danger" />
                </div>
              </div>
            </Link>
          </div>
          
          <div className="col-12">
            <Link to="/tasks?filter=high_priority" className="text-decoration-none">
              <div className="d-flex align-items-center justify-content-between p-3 bg-warning bg-opacity-10 rounded">
                <div className="d-flex align-items-center">
                  <MdPriorityHigh className="text-warning me-3" size={24} />
                  <div>
                    <h6 className="mb-0 fw-bold">High Priority Pending</h6>
                    <small className="text-muted">Urgent tasks requiring attention</small>
                  </div>
                </div>
                <div className="d-flex align-items-center">
                  <span className="badge bg-warning rounded-pill me-2" style={{ fontSize: '1.1rem', padding: '0.5rem 1rem' }}>
                    {highPriorityPending}
                  </span>
                  <MdArrowForward className="text-warning" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyActionItems;


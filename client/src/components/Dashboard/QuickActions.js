import React from 'react';
import { MdPhone, MdAddTask, MdPerson, MdSms, MdSearch } from 'react-icons/md';
import { Link } from 'react-router-dom';

const QuickActions = () => {
  return (
    <div className="bk-card">
      <div className="bk-card-header">
        <h5 className="fw-bold mb-0">Quick Actions</h5>
      </div>
      <div className="bk-card-body">
        <div className="row g-3">
          <div className="col-6 col-md-4">
            <Link to="/customers" className="text-decoration-none">
              <div className="text-center p-3 bg-primary bg-opacity-10 rounded h-100 d-flex flex-column align-items-center justify-content-center">
                <MdSearch className="text-primary mb-2" size={32} />
                <span className="fw-medium">Search Customer</span>
              </div>
            </Link>
          </div>
          <div className="col-6 col-md-4">
            <Link to="/tasks?action=create" className="text-decoration-none">
              <div className="text-center p-3 bg-success bg-opacity-10 rounded h-100 d-flex flex-column align-items-center justify-content-center">
                <MdAddTask className="text-success mb-2" size={32} />
                <span className="fw-medium">Create Task</span>
              </div>
            </Link>
          </div>
          <div className="col-6 col-md-4">
            <button 
              className="btn btn-link text-decoration-none w-100 p-0"
              onClick={() => {
                alert('Please select a customer from the Customers page to make a call.');
              }}
            >
              <div className="text-center p-3 bg-info bg-opacity-10 rounded h-100 d-flex flex-column align-items-center justify-content-center">
                <MdPhone className="text-info mb-2" size={32} />
                <span className="fw-medium">Call Customer</span>
              </div>
            </button>
          </div>
          <div className="col-6 col-md-4">
            <button 
              className="btn btn-link text-decoration-none w-100 p-0"
              onClick={() => {
                alert('Please select a customer from the Customers page to send an SMS.');
              }}
            >
              <div className="text-center p-3 bg-warning bg-opacity-10 rounded h-100 d-flex flex-column align-items-center justify-content-center">
                <MdSms className="text-warning mb-2" size={32} />
                <span className="fw-medium">Send SMS</span>
              </div>
            </button>
          </div>
          <div className="col-6 col-md-4">
            <Link to="/customers" className="text-decoration-none">
              <div className="text-center p-3 bg-secondary bg-opacity-10 rounded h-100 d-flex flex-column align-items-center justify-content-center">
                <MdPerson className="text-secondary mb-2" size={32} />
                <span className="fw-medium">View Profile</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;


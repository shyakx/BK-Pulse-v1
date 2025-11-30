import React from 'react';
import { MdPhone, MdAddTask, MdPerson, MdSms, MdSearch } from 'react-icons/md';
import { Link } from 'react-router-dom';

const QuickActions = () => {
  return (
    <div className="row g-2">
      <div className="col-6 col-md-4">
        <Link to="/customers" className="text-decoration-none quick-action-btn">
          <div className="text-center p-3 bg-primary rounded h-100 d-flex flex-column align-items-center justify-content-center text-white">
            <MdSearch className="mb-2" size={28} />
            <span className="small fw-semibold">Search</span>
          </div>
        </Link>
      </div>
      <div className="col-6 col-md-4">
        <Link to="/tasks?action=create" className="text-decoration-none quick-action-btn">
          <div className="text-center p-3 bg-success rounded h-100 d-flex flex-column align-items-center justify-content-center text-white">
            <MdAddTask className="mb-2" size={28} />
            <span className="small fw-semibold">New Task</span>
          </div>
        </Link>
      </div>
      <div className="col-6 col-md-4">
        <button 
          className="btn btn-link text-decoration-none w-100 p-0 border-0 quick-action-btn"
          onClick={() => {
            alert('Please select a customer from the Customers page to make a call.');
          }}
        >
          <div className="text-center p-3 bg-info rounded h-100 d-flex flex-column align-items-center justify-content-center text-white">
            <MdPhone className="mb-2" size={28} />
            <span className="small fw-semibold">Call</span>
          </div>
        </button>
      </div>
      <div className="col-6 col-md-4">
        <button 
          className="btn btn-link text-decoration-none w-100 p-0 border-0 quick-action-btn"
          onClick={() => {
            alert('Please select a customer from the Customers page to send an SMS.');
          }}
        >
          <div className="text-center p-3 bg-warning rounded h-100 d-flex flex-column align-items-center justify-content-center text-dark">
            <MdSms className="mb-2" size={28} />
            <span className="small fw-semibold">SMS</span>
          </div>
        </button>
      </div>
      <div className="col-6 col-md-4">
        <Link to="/customers" className="text-decoration-none quick-action-btn">
          <div className="text-center p-3 bg-secondary rounded h-100 d-flex flex-column align-items-center justify-content-center text-white">
            <MdPerson className="mb-2" size={28} />
            <span className="small fw-semibold">Profile</span>
          </div>
        </Link>
      </div>
      <style>{`
        .quick-action-btn {
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .quick-action-btn:hover {
          transform: translateY(-2px);
        }
        .quick-action-btn:hover > div {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
};

export default QuickActions;


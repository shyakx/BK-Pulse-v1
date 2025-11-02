import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdLock, MdArrowBack } from 'react-icons/md';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="bk-card text-center">
              <div className="bk-card-body p-5">
                <div 
                  className="bg-danger rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                  style={{ width: '80px', height: '80px' }}
                >
                  <MdLock size={40} className="text-white" />
                </div>
                
                <h2 className="fw-bold text-danger mb-3">Access Denied</h2>
                <p className="text-muted mb-4">
                  You don't have permission to access this page. Please contact your administrator if you believe this is an error.
                </p>
                
                <div className="d-grid gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate(-1)}
                  >
                    <MdArrowBack className="me-2" />
                    Go Back
                  </button>
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => navigate('/dashboard')}
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;


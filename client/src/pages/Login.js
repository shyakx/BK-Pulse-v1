import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';

const Login = () => {
  const { login, isAuthenticated, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    clearError();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once when component mounts

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(formData.email, formData.password);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="bk-card">
              <div className="bk-card-header text-center">
                <div className="d-flex justify-content-center mb-3">
                  <img 
                    src="/bk-logo.png" 
                    alt="BK Logo" 
                    style={{ height: '60px', width: 'auto', maxWidth: '120px', objectFit: 'contain' }}
                  />
                </div>
                <h4 className="fw-bold text-primary mb-1">BK Pulse</h4>
                <p className="text-muted mb-0">Churn Intelligence Platform</p>
              </div>
              
              <div className="bk-card-body">
                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email Address
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <MdEmail />
                      </span>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="password" className="form-label">
                      Password
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <MdLock />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                      </button>
                    </div>
                  </div>

                  <div className="d-grid">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="d-flex align-items-center justify-content-center">
                          <div className="bk-spinner me-2"></div>
                          Signing in...
                        </div>
                      ) : (
                        'Sign In'
                      )}
                    </button>
                  </div>
                </form>
              </div>
              
              <div className="bk-card-header text-center">
                <small className="text-muted">
                  © 2025 Bank of Kigali. All rights reserved.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


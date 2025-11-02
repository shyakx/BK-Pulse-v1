import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  MdNotifications, 
  MdAccountCircle, 
  MdLogout,
  MdMenu,
  MdSearch,
  MdSettings
} from 'react-icons/md';

const Navbar = ({ onToggleSidebar, isCollapsed }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
      <div className="container-fluid">
        {/* Mobile menu button */}
        <button
          className="btn btn-link d-lg-none me-3"
          onClick={onToggleSidebar}
        >
          <MdMenu size={24} />
        </button>

        {/* Brand */}
        <div className="navbar-brand d-flex align-items-center">
          <div style={{ maxWidth: '40px', marginRight: '8px', flexShrink: 0 }}>
            <img 
              src="/bk-logo.png" 
              alt="BK Logo" 
              style={{ height: '32px', width: '100%', maxWidth: '40px', objectFit: 'contain' }}
            />
          </div>
          <span className="fw-bold text-primary">BK Pulse</span>
        </div>

        {/* Search Bar */}
        <div className="d-none d-md-flex flex-grow-1 mx-4">
          <div className="input-group" style={{ maxWidth: '400px' }}>
            <span className="input-group-text bg-light border-end-0">
              <MdSearch />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search customers, reports..."
              style={{ boxShadow: 'none' }}
            />
          </div>
        </div>

        {/* Right side items */}
        <div className="d-flex align-items-center">
          {/* Notifications */}
          <div className="position-relative me-3">
            <button className="btn btn-link position-relative">
              <MdNotifications size={24} className="text-muted" />
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                3
              </span>
            </button>
          </div>

          {/* User Menu */}
          <div className="dropdown">
            <button
              className="btn btn-link d-flex align-items-center text-decoration-none"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div 
                className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2"
                style={{ width: '32px', height: '32px' }}
              >
                <span className="text-white fw-bold small">
                  {user?.name?.charAt(0) || user?.email?.charAt(0)}
                </span>
              </div>
              <div className="d-none d-md-block text-start">
                <div className="fw-medium text-dark small">
                  {user?.name || user?.email}
                </div>
                <div className="text-muted small text-capitalize">
                  {user?.role?.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
            </button>

            {showUserMenu && (
              <div className="dropdown-menu dropdown-menu-end show">
                <div className="dropdown-header">
                  <div className="fw-medium">{user?.name || user?.email}</div>
                  <div className="text-muted small text-capitalize">
                    {user?.role?.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item d-flex align-items-center">
                  <MdAccountCircle className="me-2" />
                  Profile
                </button>
                <button className="dropdown-item d-flex align-items-center">
                  <MdSettings className="me-2" />
                  Settings
                </button>
                <div className="dropdown-divider"></div>
                <button 
                  className="dropdown-item d-flex align-items-center text-danger"
                  onClick={handleLogout}
                >
                  <MdLogout className="me-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

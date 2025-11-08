import React, { useState, useEffect, useRef } from 'react';
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
  const [logoError, setLogoError] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white">
      <div className="container-fluid px-4">
        {/* Mobile menu button */}
        <button
          className="btn btn-link d-lg-none me-3 p-2"
          onClick={onToggleSidebar}
          style={{ 
            borderRadius: '0.5rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bk-light)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <MdMenu size={24} className="text-dark" />
        </button>

        {/* Brand */}
        <div className="navbar-brand d-flex align-items-center me-4">
          <div 
            style={{ 
              width: '40px', 
              height: '40px',
              marginRight: '10px', 
              flexShrink: 0,
              borderRadius: '0.5rem',
              padding: '6px',
              background: 'linear-gradient(135deg, var(--bk-primary) 0%, var(--bk-primary-light) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {!logoError ? (
              <img 
                src={process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/bk-logo.png` : '/bk-logo.png'}
                alt="BK Logo" 
                onError={(e) => {
                  console.error('Logo failed to load:', e);
                  setLogoError(true);
                }}
                onLoad={() => {
                  console.log('Logo loaded successfully');
                }}
                style={{ 
                  height: '28px', 
                  width: '28px', 
                  objectFit: 'contain',
                  // Removed all filters - show logo as-is to ensure visibility
                  display: 'block',
                  maxWidth: '100%',
                  position: 'relative',
                  zIndex: 1
                }}
              />
            ) : (
              <span style={{ 
                color: 'rgba(255, 255, 255, 0.85)', 
                fontWeight: 'bold', 
                fontSize: '1.1rem', 
                lineHeight: 1,
                position: 'relative',
                zIndex: 1
              }}>
                BK
              </span>
            )}
          </div>
          <span className="fw-bold text-primary" style={{ fontSize: '1.25rem', letterSpacing: '-0.02em' }}>BK Pulse</span>
        </div>

        {/* Search Bar */}
        <div className="d-none d-md-flex flex-grow-1 mx-4">
          <div className="input-group" style={{ maxWidth: '450px' }}>
            <span className="input-group-text bg-light border-end-0" style={{ borderRadius: '0.5rem 0 0 0.5rem' }}>
              <MdSearch className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search customers, reports..."
              style={{ 
                borderRadius: '0 0.5rem 0.5rem 0',
                border: '1px solid var(--bk-border)',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>

        {/* Right side items */}
        <div className="d-flex align-items-center">
          {/* Notifications */}
          <div className="position-relative me-3">
            <button 
              className="btn btn-link position-relative p-2"
              style={{ 
                borderRadius: '0.5rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bk-light)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <MdNotifications size={22} className="text-muted" />
              <span 
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                style={{ 
                  fontSize: '0.65rem',
                  padding: '0.2rem 0.4rem',
                  minWidth: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                3
              </span>
            </button>
          </div>

          {/* User Menu */}
          <div className="dropdown" ref={dropdownRef}>
            <button
              className="btn btn-link d-flex align-items-center text-decoration-none p-2"
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{ 
                borderRadius: '0.5rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bk-light)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div 
                className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2"
                style={{ 
                  width: '36px', 
                  height: '36px',
                  background: 'linear-gradient(135deg, var(--bk-primary) 0%, var(--bk-primary-light) 100%)',
                  boxShadow: '0 2px 4px rgba(30, 58, 138, 0.2)'
                }}
              >
                <span className="text-white fw-bold" style={{ fontSize: '0.875rem' }}>
                  {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="d-none d-md-block text-start">
                <div className="fw-semibold text-dark" style={{ fontSize: '0.875rem', lineHeight: '1.2' }}>
                  {user?.name || user?.email}
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem', lineHeight: '1.2', textTransform: 'capitalize' }}>
                  {user?.role?.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
            </button>

            {showUserMenu && (
              <div 
                className="dropdown-menu dropdown-menu-end show"
                style={{
                  minWidth: '200px',
                  marginTop: '0.5rem'
                }}
              >
                <div className="dropdown-header px-3 py-2">
                  <div className="fw-semibold" style={{ fontSize: '0.875rem' }}>{user?.name || user?.email}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
                    {user?.role?.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                </div>
                <div className="dropdown-divider my-1"></div>
                <button 
                  className="dropdown-item d-flex align-items-center"
                  style={{ fontSize: '0.875rem' }}
                >
                  <MdAccountCircle className="me-2" size={18} />
                  Profile
                </button>
                <button 
                  className="dropdown-item d-flex align-items-center"
                  style={{ fontSize: '0.875rem' }}
                >
                  <MdSettings className="me-2" size={18} />
                  Settings
                </button>
                <div className="dropdown-divider my-1"></div>
                <button 
                  className="dropdown-item d-flex align-items-center text-danger"
                  onClick={handleLogout}
                  style={{ fontSize: '0.875rem' }}
                >
                  <MdLogout className="me-2" size={18} />
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

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  MdNotifications, 
  MdAccountCircle, 
  MdLogout,
  MdMenu,
  MdSearch,
  MdSettings,
  MdCheckCircle,
  MdWarning,
  MdInfo,
  MdError
} from 'react-icons/md';
import api from '../../services/api';

const Navbar = ({ onToggleSidebar, isCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showUserMenu || showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showNotifications]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await api.getNotifications({ limit: 10, unread_only: false });
      if (response.success) {
        setNotifications(response.notifications || []);
        setUnreadCount(response.unread_count || 0);
      } else {
        // Fallback to mock data if API not available
        const mockNotifications = [
          {
            id: 1,
            type: 'warning',
            title: 'High Risk Customer Alert',
            message: 'Customer #100001 has a churn score of 85%',
            read: false,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            type: 'info',
            title: 'New Task Assigned',
            message: 'You have been assigned a new retention task',
            read: false,
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 3,
            type: 'success',
            title: 'Campaign Completed',
            message: 'Q4 Retention Campaign has been completed successfully',
            read: true,
            created_at: new Date(Date.now() - 7200000).toISOString()
          }
        ];
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.read).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      // Use mock data on error
      const mockNotifications = [
        {
          id: 1,
          type: 'warning',
          title: 'High Risk Customer Alert',
          message: 'Customer #100001 has a churn score of 85%',
          read: false,
          created_at: new Date().toISOString()
        }
      ];
      setNotifications(mockNotifications);
      setUnreadCount(1);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await api.markNotificationRead(notification.id);
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }
    setShowNotifications(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <MdCheckCircle className="text-success" />;
      case 'warning':
        return <MdWarning className="text-warning" />;
      case 'error':
        return <MdError className="text-danger" />;
      default:
        return <MdInfo className="text-info" />;
    }
  };

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
                  // Logo loaded successfully
                }}
                style={{ 
                  height: '28px', 
                  width: '28px', 
                  objectFit: 'contain',
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
          <div className="position-relative me-3" ref={notificationsRef}>
            <button 
              className="btn btn-link position-relative p-2"
              style={{ 
                borderRadius: '0.5rem',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setShowNotifications(!showNotifications)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bk-light)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <MdNotifications size={22} className="text-muted" />
              {unreadCount > 0 && (
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
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div 
                className="dropdown-menu dropdown-menu-end show position-absolute"
                style={{
                  minWidth: '350px',
                  maxWidth: '400px',
                  maxHeight: '500px',
                  overflowY: 'auto',
                  marginTop: '0.5rem',
                  right: 0,
                  zIndex: 1050
                }}
              >
                <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
                  <h6 className="mb-0 fw-bold">Notifications</h6>
                  {unreadCount > 0 && (
                    <button 
                      className="btn btn-sm btn-link text-primary p-0"
                      onClick={handleMarkAllRead}
                      style={{ fontSize: '0.75rem' }}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {loadingNotifications ? (
                    <div className="text-center py-4">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <MdNotifications size={32} className="mb-2 opacity-50" />
                      <p className="mb-0" style={{ fontSize: '0.875rem' }}>No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-3 py-2 border-bottom ${!notification.read ? 'bg-light' : ''}`}
                        style={{ 
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onClick={() => handleNotificationClick(notification)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bk-light)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notification.read ? 'transparent' : 'var(--bk-light)'}
                      >
                        <div className="d-flex align-items-start">
                          <div className="me-2 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <div className="d-flex align-items-center justify-content-between">
                              <h6 className="mb-1 fw-semibold" style={{ fontSize: '0.875rem' }}>
                                {notification.title}
                              </h6>
                              {!notification.read && (
                                <span className="badge bg-primary rounded-pill" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem' }}>
                                  New
                                </span>
                              )}
                            </div>
                            <p className="mb-1 text-muted" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                              {notification.message}
                            </p>
                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                              {new Date(notification.created_at).toLocaleString()}
                            </small>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="text-center py-2 border-top">
                    <button 
                      className="btn btn-sm btn-link text-primary"
                      onClick={() => {
                        setShowNotifications(false);
                        // Navigate to a full notifications page if it exists
                      }}
                      style={{ fontSize: '0.75rem' }}
                    >
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
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
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/profile');
                  }}
                >
                  <MdAccountCircle className="me-2" size={18} />
                  Profile
                </button>
                <button 
                  className="dropdown-item d-flex align-items-center"
                  style={{ fontSize: '0.875rem' }}
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/settings');
                  }}
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

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import pages from '../../config/pages';
import { 
  MdDashboard, 
  MdPeople, 
  MdPerson, 
  MdAssessment, 
  MdAnalytics, 
  MdInsights, 
  MdThumbUp,
  MdSupervisorAccount,
  MdApproval,
  MdAdminPanelSettings,
  MdStorage,
  MdAutoAwesome,
  MdSecurity,
  MdSettings,
  MdMenu,
  MdClose,
  MdNote,
  MdTask,
  MdTrendingUp,
  MdCampaign,
  MdGroup,
  MdBarChart,
  MdAttachMoney,
  MdBackup
} from 'react-icons/md';

const Sidebar = ({ isCollapsed, toggleCollapse }) => {
  const { user } = useAuth();
  const location = useLocation();

  const getIcon = (iconName) => {
    const iconMap = {
      dashboard: MdDashboard,
      people: MdPeople,
      person: MdPerson,
      assessment: MdAssessment,
      analytics: MdAnalytics,
      insights: MdInsights,
      recommendations: MdThumbUp,
      thumb_up: MdThumbUp,
      supervisor_account: MdSupervisorAccount,
      approval: MdApproval,
      admin_panel_settings: MdAdminPanelSettings,
      storage: MdStorage,
      model_training: MdAutoAwesome,
      auto_awesome: MdAutoAwesome,
      security: MdSecurity,
      settings: MdSettings,
      note: MdNote,
      task: MdTask,
      trending_up: MdTrendingUp,
      campaign: MdCampaign,
      group: MdGroup,
      bar_chart: MdBarChart,
      attach_money: MdAttachMoney,
      backup: MdBackup
    };
    return iconMap[iconName] || MdDashboard;
  };

  const getPagesForRole = (role) => {
    switch (role) {
      case 'retentionOfficer':
        return pages.retentionOfficer;
      case 'retentionAnalyst':
        return pages.retentionAnalyst;
      case 'retentionManager':
        return pages.retentionManager;
      case 'admin':
        return pages.admin;
      default:
        return [];
    }
  };

  const userPages = getPagesForRole(user?.role);

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div 
          className="d-lg-none position-fixed w-100 h-100 bg-dark opacity-50"
          style={{ zIndex: 1040, top: 0, left: 0 }}
          onClick={toggleCollapse}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`sidebar position-fixed d-flex flex-column ${
          isCollapsed ? 'collapsed' : ''
        } ${!isCollapsed ? 'show' : ''}`}
        style={{ 
          width: isCollapsed ? '60px' : '280px',
          zIndex: 1050,
          top: 0,
          left: 0,
          height: '100vh'
        }}
      >
        {/* Sidebar Header */}
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom border-light" style={{ minWidth: 0 }}>
          <div className="d-flex align-items-center flex-grow-1" style={{ minWidth: 0, overflow: 'hidden' }}>
            {isCollapsed ? (
              <img 
                src="/bk-logo.png" 
                alt="BK" 
                style={{ height: '30px', width: 'auto', maxWidth: '30px', objectFit: 'contain', margin: '0 auto' }}
              />
            ) : (
              <>
                <div style={{ flexShrink: 0, maxWidth: '50px', marginRight: '12px' }}>
                  <img 
                    src="/bk-logo.png" 
                    alt="BK Logo" 
                    style={{ height: '40px', width: '100%', maxWidth: '50px', objectFit: 'contain' }}
                  />
                </div>
                <div style={{ minWidth: 0, flexShrink: 1 }}>
                  <h5 className="text-white mb-0" style={{ fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>BK Pulse</h5>
                  <small className="text-light opacity-75" style={{ fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Churn Intelligence</small>
                </div>
              </>
            )}
          </div>
          <button
            className="btn btn-link text-white p-0 ms-2"
            onClick={toggleCollapse}
            style={{ fontSize: '1.5rem', flexShrink: 0 }}
          >
            {isCollapsed ? <MdMenu /> : <MdClose />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-grow-1 p-3">
          <ul className="nav flex-column">
            {userPages
              .filter(page => !page.route.includes(':id')) // Exclude routes with dynamic params from sidebar
              .map((page, index) => {
                const IconComponent = getIcon(page.icon);
                const isActive = location.pathname === page.route || 
                  (page.route !== '/dashboard' && location.pathname.startsWith(page.route));
                
                return (
                  <li key={index} className="nav-item mb-1">
                    <NavLink
                      to={page.route}
                      className={`nav-link d-flex align-items-center ${
                        isActive ? 'active' : ''
                      }`}
                      title={isCollapsed ? page.name : ''}
                    >
                      <IconComponent 
                        style={{ 
                          fontSize: '1.25rem',
                          minWidth: '20px'
                        }} 
                      />
                      {!isCollapsed && (
                        <span className="ms-3">{page.name}</span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
          </ul>
        </nav>

        {/* User Info */}
        {!isCollapsed && user && (
          <div className="p-3 border-top border-light">
            <div className="d-flex align-items-center">
              <div 
                className="bg-white rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{ width: '36px', height: '36px' }}
              >
                <span className="text-primary fw-bold">
                  {user.name?.charAt(0) || user.email?.charAt(0)}
                </span>
              </div>
              <div className="flex-grow-1">
                <div className="text-white fw-medium small">
                  {user.name || user.email}
                </div>
                <div className="text-light opacity-75 small text-capitalize">
                  {user.role?.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;

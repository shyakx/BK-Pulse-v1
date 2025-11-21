// Sidebar Component with Professional Font Awesome Icons
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import pages from '../../config/pages';
import { 
  MdMenu,
  MdClose
} from 'react-icons/md';
import { 
  FaChartLine,
  FaUsers,
  FaUser,
  FaFileAlt,
  FaClipboardList,
  FaChartBar,
  FaChartPie,
  FaLightbulb,
  FaBullhorn,
  FaEye,
  FaRobot,
  FaDatabase,
  FaUserShield,
  FaCog,
  FaShieldAlt,
  FaCloudUploadAlt,
  FaCheckCircle,
  FaDollarSign,
  FaBrain,
  FaCheckDouble,
  FaUserCheck,
  FaArrowDown,
  FaClock
} from 'react-icons/fa';

// Logo component with fallback
const LogoImage = ({ size = '40px' }) => {
  const [logoError, setLogoError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  if (logoError) {
    return (
      <div 
        style={{ 
          width: size, 
          height: size, 
          borderRadius: '0.5rem',
          background: 'rgba(255, 255, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: size === '32px' ? '0.9rem' : '1.1rem'
        }}
      >
        BK
      </div>
    );
  }

  // Try multiple paths for logo
  const logoPath = process.env.PUBLIC_URL 
    ? `${process.env.PUBLIC_URL}/bk-logo.png`
    : '/bk-logo.png';

  return (
    <img 
      src={logoPath}
      alt="BK Logo" 
      onError={(e) => {
        console.error('Logo failed to load from:', logoPath, e);
        setLogoError(true);
      }}
      onLoad={() => {
        setImageLoaded(true);
      }}
      style={{ 
        height: size, 
        width: size, 
        objectFit: 'contain',
        transition: 'all 0.3s ease',
        display: 'block',
        opacity: imageLoaded ? 1 : 0.8
      }}
    />
  );
};

const Sidebar = ({ isCollapsed, toggleCollapse }) => {
  const { user } = useAuth();
  const location = useLocation();

  const getIcon = (iconName) => {
    const iconMap = {
      dashboard: FaChartLine,
      people: FaUsers,
      person: FaUser,
      assessment: FaChartPie,
      analytics: FaChartBar,
      insights: FaEye,
      recommendations: FaLightbulb,
      thumb_up: FaLightbulb,
      supervisor_account: FaUserShield,
      approval: FaCheckCircle,
      admin_panel_settings: FaUserShield,
      storage: FaDatabase,
      model_training: FaRobot,
      auto_awesome: FaRobot,
      security: FaShieldAlt,
      settings: FaCog,
      note: FaFileAlt,
      task: FaClipboardList,
      trending_up: FaChartBar,
      campaign: FaBullhorn,
      group: FaUsers,
      bar_chart: FaChartBar,
      attach_money: FaDollarSign,
      backup: FaCloudUploadAlt,
      account_circle: FaUser,
      psychology: FaBrain,
      fact_check: FaCheckDouble,
      verified_user: FaUserCheck,
      trending_down: FaArrowDown,
      timeline: FaClock
    };
    return iconMap[iconName] || FaChartLine;
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
          width: isCollapsed ? '72px' : '280px',
          zIndex: 1050,
          top: 0,
          left: 0,
          height: '100vh',
          background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)',
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Sidebar Header */}
        <div 
          className="d-flex align-items-center justify-content-between px-3 py-3" 
          style={{ 
            minWidth: 0,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="d-flex align-items-center flex-grow-1" style={{ minWidth: 0, overflow: 'hidden' }}>
            {isCollapsed ? (
              <div className="d-flex justify-content-center w-100">
                <LogoImage size="32px" />
              </div>
            ) : (
              <>
                <div style={{ flexShrink: 0, width: '40px', height: '40px', marginRight: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LogoImage size="40px" />
                </div>
                <div style={{ minWidth: 0, flexShrink: 1 }}>
                  <h5 className="text-white mb-0 fw-bold" style={{ 
                    fontSize: '1.1rem', 
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                  }}>
                    BK Pulse
                  </h5>
                  <small className="text-light opacity-80" style={{ 
                    fontSize: '0.7rem', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    fontWeight: 500
                  }}>
                    Churn Intelligence
                  </small>
                </div>
              </>
            )}
          </div>
          <button
            className="btn btn-link text-white p-1 ms-2 rounded-circle"
            onClick={toggleCollapse}
            style={{ 
              fontSize: '1.25rem', 
              flexShrink: 0,
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              opacity: 0.9
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '1';
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.transform = 'rotate(90deg)';
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '0.9';
              e.target.style.background = 'transparent';
              e.target.style.transform = 'rotate(0deg)';
            }}
          >
            {isCollapsed ? <MdMenu /> : <MdClose />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-grow-1 px-2 py-3" style={{ 
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
        }}>
          <style>{`
            nav::-webkit-scrollbar {
              width: 6px;
            }
            nav::-webkit-scrollbar-track {
              background: transparent;
            }
            nav::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.2);
              border-radius: 3px;
            }
            nav::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.3);
            }
          `}</style>
          <ul className="nav flex-column" style={{ gap: '4px' }}>
            {(() => {
              // Group pages by section for analyst and officer roles
              if (user?.role === 'retentionAnalyst' || user?.role === 'retentionOfficer') {
                const corePages = userPages.filter(p => p.section === 'core' && !p.route.includes(':id'));
                const insightsPages = userPages.filter(p => p.section === 'insights' && !p.route.includes(':id'));
                const analyticalPages = userPages.filter(p => p.section === 'analytical' && !p.route.includes(':id'));
                const performancePages = userPages.filter(p => p.section === 'performance' && !p.route.includes(':id'));
                const advancedPages = userPages.filter(p => p.section === 'advanced' && !p.route.includes(':id'));
                
                const renderPage = (page, index, prefix) => {
                  const IconComponent = getIcon(page.icon);
                  const isActive = location.pathname === page.route || 
                    (page.route !== '/dashboard' && location.pathname.startsWith(page.route));
                  
                  return (
                    <li key={`${prefix}-${index}`} className="nav-item" style={{ marginBottom: '4px' }}>
                      <NavLink
                        to={page.route}
                        className={`sidebar-nav-link d-flex align-items-center ${
                          isActive ? 'active' : ''
                        }`}
                        title={isCollapsed ? page.name : ''}
                        style={{
                          position: 'relative',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.85)',
                          background: isActive 
                            ? 'linear-gradient(90deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)'
                            : 'transparent',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          textDecoration: 'none',
                          margin: '0 8px',
                          borderLeft: isActive ? '3px solid #fff' : '3px solid transparent',
                          fontWeight: isActive ? 600 : 500,
                          boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.transform = 'translateX(4px)';
                            e.currentTarget.style.color = '#fff';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.transform = 'translateX(0)';
                            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)';
                          }
                        }}
                      >
                        <IconComponent 
                          style={{ 
                            fontSize: '1.35rem',
                            minWidth: '24px',
                            transition: 'all 0.2s ease',
                            transform: isActive ? 'scale(1.1)' : 'scale(1)'
                          }} 
                        />
                        {!isCollapsed && (
                          <span className="ms-3" style={{ 
                            fontSize: '0.9rem',
                            letterSpacing: '0.2px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {page.name}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                };
                
                // Helper function to render section divider
                const renderDivider = (label) => {
                  if (isCollapsed) return null;
                  return (
                    <li className="nav-item mb-2 mt-3" style={{ paddingLeft: '8px', paddingRight: '8px' }}>
                      <div className="d-flex align-items-center" style={{ marginBottom: '8px' }}>
                        <div style={{ 
                          flex: 1, 
                          height: '1px', 
                          background: 'rgba(255, 255, 255, 0.2)',
                          marginRight: '12px'
                        }}></div>
                        <small className="text-light opacity-60 px-2" style={{ 
                          fontSize: '0.65rem', 
                          fontWeight: 700, 
                          textTransform: 'uppercase', 
                          letterSpacing: '1px',
                          whiteSpace: 'nowrap'
                        }}>
                          {label}
                        </small>
                        <div style={{ 
                          flex: 1, 
                          height: '1px', 
                          background: 'rgba(255, 255, 255, 0.2)',
                          marginLeft: '12px'
                        }}></div>
                      </div>
                    </li>
                  );
                };

                return (
                  <>
                    {corePages.length > 0 && (
                      <>
                        {renderDivider('Core Daily Use')}
                        {corePages.map((page, index) => renderPage(page, index, 'core'))}
                      </>
                    )}
                    {insightsPages.length > 0 && (
                      <>
                        {renderDivider('Predictions & Insights')}
                        {insightsPages.map((page, index) => renderPage(page, index, 'insights'))}
                      </>
                    )}
                    {analyticalPages.length > 0 && (
                      <>
                        {renderDivider('Analytical & Strategic')}
                        {analyticalPages.map((page, index) => renderPage(page, index, 'analytical'))}
                      </>
                    )}
                    {performancePages.length > 0 && (
                      <>
                        {renderDivider('Campaigns & Performance')}
                        {performancePages.map((page, index) => renderPage(page, index, 'performance'))}
                      </>
                    )}
                    {advancedPages.length > 0 && (
                      <>
                        {renderDivider('Advanced Tools')}
                        {advancedPages.map((page, index) => renderPage(page, index, 'advanced'))}
                      </>
                    )}
                  </>
                );
              } else if (user?.role === 'retentionManager' || user?.role === 'admin') {
                // Group pages by section for manager and admin roles
                const corePages = userPages.filter(p => p.section === 'core' && !p.route.includes(':id'));
                const teamPages = userPages.filter(p => p.section === 'team' && !p.route.includes(':id'));
                const analyticalPages = userPages.filter(p => p.section === 'analytical' && !p.route.includes(':id'));
                const managementPages = userPages.filter(p => p.section === 'management' && !p.route.includes(':id'));
                const configurationPages = userPages.filter(p => p.section === 'configuration' && !p.route.includes(':id'));
                
                const renderPage = (page, index, prefix) => {
                  const IconComponent = getIcon(page.icon);
                  const isActive = location.pathname === page.route || 
                    (page.route !== '/dashboard' && location.pathname.startsWith(page.route));
                  
                  return (
                    <li key={`${prefix}-${index}`} className="nav-item" style={{ marginBottom: '4px' }}>
                      <NavLink
                        to={page.route}
                        className={`sidebar-nav-link d-flex align-items-center ${
                          isActive ? 'active' : ''
                        }`}
                        title={isCollapsed ? page.name : ''}
                        style={{
                          position: 'relative',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.85)',
                          background: isActive 
                            ? 'linear-gradient(90deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)'
                            : 'transparent',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          textDecoration: 'none',
                          margin: '0 8px',
                          borderLeft: isActive ? '3px solid #fff' : '3px solid transparent',
                          fontWeight: isActive ? 600 : 500,
                          boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.transform = 'translateX(4px)';
                            e.currentTarget.style.color = '#fff';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.transform = 'translateX(0)';
                            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)';
                          }
                        }}
                      >
                        <IconComponent 
                          style={{ 
                            fontSize: '1.35rem',
                            minWidth: '24px',
                            transition: 'all 0.2s ease',
                            transform: isActive ? 'scale(1.1)' : 'scale(1)'
                          }} 
                        />
                        {!isCollapsed && (
                          <span className="ms-3" style={{ 
                            fontSize: '0.9rem',
                            letterSpacing: '0.2px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {page.name}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                };
                
                // Helper function to render section divider
                const renderDivider = (label) => {
                  if (isCollapsed) return null;
                  return (
                    <li className="nav-item mb-2 mt-3" style={{ paddingLeft: '8px', paddingRight: '8px' }}>
                      <div className="d-flex align-items-center" style={{ marginBottom: '8px' }}>
                        <div style={{ 
                          flex: 1, 
                          height: '1px', 
                          background: 'rgba(255, 255, 255, 0.2)',
                          marginRight: '12px'
                        }}></div>
                        <small className="text-light opacity-60 px-2" style={{ 
                          fontSize: '0.65rem', 
                          fontWeight: 700, 
                          textTransform: 'uppercase', 
                          letterSpacing: '1px',
                          whiteSpace: 'nowrap'
                        }}>
                          {label}
                        </small>
                        <div style={{ 
                          flex: 1, 
                          height: '1px', 
                          background: 'rgba(255, 255, 255, 0.2)',
                          marginLeft: '12px'
                        }}></div>
                      </div>
                    </li>
                  );
                };

                return (
                  <>
                    {corePages.length > 0 && (
                      <>
                        {renderDivider(user?.role === 'retentionManager' ? 'Strategic Overview' : 'System Overview')}
                        {corePages.map((page, index) => renderPage(page, index, 'core'))}
                      </>
                    )}
                    {teamPages.length > 0 && (
                      <>
                        {renderDivider('Team & Operations')}
                        {teamPages.map((page, index) => renderPage(page, index, 'team'))}
                      </>
                    )}
                    {analyticalPages.length > 0 && (
                      <>
                        {renderDivider('Strategic Analysis')}
                        {analyticalPages.map((page, index) => renderPage(page, index, 'analytical'))}
                      </>
                    )}
                    {managementPages.length > 0 && (
                      <>
                        {renderDivider('Data & Model Management')}
                        {managementPages.map((page, index) => renderPage(page, index, 'management'))}
                      </>
                    )}
                    {configurationPages.length > 0 && (
                      <>
                        {renderDivider('System Configuration')}
                        {configurationPages.map((page, index) => renderPage(page, index, 'configuration'))}
                      </>
                    )}
                  </>
                );
              } else {
                // Default behavior for other roles (fallback)
                return userPages
                  .filter(page => !page.route.includes(':id'))
                  .map((page, index) => {
                    const IconComponent = getIcon(page.icon);
                    const isActive = location.pathname === page.route || 
                      (page.route !== '/dashboard' && location.pathname.startsWith(page.route));
                    
                    return (
                      <li key={index} className="nav-item" style={{ marginBottom: '4px' }}>
                        <NavLink
                          to={page.route}
                          className={`sidebar-nav-link d-flex align-items-center ${
                            isActive ? 'active' : ''
                          }`}
                          title={isCollapsed ? page.name : ''}
                          style={{
                            position: 'relative',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.85)',
                            background: isActive 
                              ? 'linear-gradient(90deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)'
                              : 'transparent',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            textDecoration: 'none',
                            margin: '0 8px',
                            borderLeft: isActive ? '3px solid #fff' : '3px solid transparent',
                            fontWeight: isActive ? 600 : 500,
                            boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none'
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                              e.currentTarget.style.transform = 'translateX(4px)';
                              e.currentTarget.style.color = '#fff';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.transform = 'translateX(0)';
                              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)';
                            }
                          }}
                        >
                          <IconComponent 
                            style={{ 
                              fontSize: '1.35rem',
                              minWidth: '24px',
                              transition: 'all 0.2s ease',
                              transform: isActive ? 'scale(1.1)' : 'scale(1)'
                            }} 
                          />
                          {!isCollapsed && (
                            <span className="ms-3" style={{ 
                              fontSize: '0.9rem',
                              letterSpacing: '0.2px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {page.name}
                            </span>
                          )}
                        </NavLink>
                      </li>
                    );
                  });
              }
            })()}
          </ul>
        </nav>

        {/* User Info */}
        {!isCollapsed && user && (
          <div 
            className="px-3 py-3"
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="d-flex align-items-center">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{ 
                  width: '42px', 
                  height: '42px',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
                }}
              >
                <span className="text-white fw-bold" style={{ fontSize: '1.1rem' }}>
                  {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <div 
                  className="text-white fw-semibold" 
                  style={{ 
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {user.name || user.email}
                </div>
                <div 
                  className="text-light opacity-80 small text-capitalize" 
                  style={{ 
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {user.role?.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Collapsed User Avatar */}
        {isCollapsed && user && (
          <div 
            className="px-2 py-3"
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)'
            }}
          >
            <div className="d-flex justify-content-center">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ 
                  width: '40px', 
                  height: '40px',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                title={`${user.name || user.email} - ${user.role?.replace(/([A-Z])/g, ' $1').trim()}`}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
                }}
              >
                <span className="text-white fw-bold" style={{ fontSize: '1rem' }}>
                  {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;

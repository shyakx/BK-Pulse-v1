import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="d-flex">
      <Sidebar 
        isCollapsed={sidebarCollapsed} 
        toggleCollapse={toggleSidebar} 
      />
      
      <div 
        className="main-content flex-grow-1"
        style={{ 
          marginLeft: sidebarCollapsed ? '72px' : '280px',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Navbar 
          onToggleSidebar={toggleSidebar}
          isCollapsed={sidebarCollapsed}
        />
        
        <main className="p-3">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

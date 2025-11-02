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
          marginLeft: sidebarCollapsed ? '60px' : '280px',
          transition: 'margin-left 0.3s ease'
        }}
      >
        <Navbar 
          onToggleSidebar={toggleSidebar}
          isCollapsed={sidebarCollapsed}
        />
        
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

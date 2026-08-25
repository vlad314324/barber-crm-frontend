import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { SettingsProvider } from '../context/SettingsContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <SettingsProvider>
    <div className="flex h-screen bg-canvas">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 lg:static lg:inset-auto transform transition-all duration-300 ease-in-out lg:flex-shrink-0 ${
          sidebarOpen
            ? 'translate-x-0 lg:w-64'
            : '-translate-x-full lg:w-0 lg:translate-x-0 lg:overflow-hidden'
        }`}
      >
        <Sidebar closeSidebar={closeSidebar} />
      </div>

      {/* Content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-canvas p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
    </SettingsProvider>
  );
};

export default Layout;
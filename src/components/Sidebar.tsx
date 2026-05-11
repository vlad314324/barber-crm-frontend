import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Scissors, 
  BarChart2, 
  Settings,
  User
} from 'lucide-react';

interface SidebarProps {
  closeSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ closeSidebar }) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Clients', path: '/clients', icon: <Users size={20} /> },
    { name: 'Appointments', path: '/appointments', icon: <Calendar size={20} /> },
    { name: 'Employees', path: '/employees', icon: <User size={20} /> },
    { name: 'Services', path: '/services', icon: <Scissors size={20} /> },
    { name: 'Reports', path: '/reports', icon: <BarChart2 size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex flex-col h-full w-64 bg-gray-900 text-white">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold flex items-center">
          <Scissors className="mr-2" />
          BarberCRM
        </h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm transition-colors duration-150 hover:bg-gray-800 ${
                    isActive ? 'bg-indigo-600' : ''
                  }`
                }
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
            <span className="text-white font-semibold">AM</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">Admin Manager</p>
            <p className="text-xs text-gray-400">admin@barbershop.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
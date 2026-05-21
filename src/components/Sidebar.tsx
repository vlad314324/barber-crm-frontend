import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar,
  Scissors, BarChart2, Settings, User, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps { closeSidebar: () => void; }

const Sidebar = ({ closeSidebar }: SidebarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin  = user?.role === 'admin';
  const isBarber = user?.role === 'barber';

  const navItems = [
    { name: 'Dashboard',    path: '/',            icon: <LayoutDashboard size={20}/>, show: isAdmin },
    { name: 'Clients',      path: '/clients',     icon: <Users size={20}/>,           show: isAdmin },
    { name: 'Appointments', path: '/appointments',icon: <Calendar size={20}/>,        show: isAdmin || isBarber },
    { name: 'Employees',    path: '/employees',   icon: <User size={20}/>,            show: isAdmin },
    { name: 'Services',     path: '/services',    icon: <Scissors size={20}/>,        show: isAdmin },
    { name: 'Reports',      path: '/reports',     icon: <BarChart2 size={20}/>,       show: isAdmin },
    { name: 'Settings',     path: '/settings',    icon: <Settings size={20}/>,        show: isAdmin || isBarber },
  ].filter(item => item.show);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const roleLabel: Record<string, string> = {
    admin: 'Адміністратор',
    barber: 'Барбер',
    client: 'Клієнт',
  };

  return (
    <div className="flex flex-col h-full w-64 bg-gray-900 text-white">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold flex items-center">
          <Scissors className="mr-2"/> BarberCRM
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {navItems.map(item => (
            <li key={item.path}>
              <NavLink to={item.path} onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm transition-colors hover:bg-gray-800 ${isActive ? 'bg-indigo-600' : ''}`
                }>
                <span className="mr-3">{item.icon}</span>
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-400">{roleLabel[user?.role || ''] || user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition">
          <LogOut size={16}/> Вийти
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
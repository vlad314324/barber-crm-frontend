import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar,
  Scissors, BarChart2, Settings, User, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../i18n/LocaleContext';

interface SidebarProps { closeSidebar: () => void; }

const Sidebar = ({ closeSidebar }: SidebarProps) => {
  const { user, logout } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin  = user?.role === 'admin';
  const isBarber = user?.role === 'barber';

  // Закривати сайдбар по кліку треба лише в мобільному drawer-режимі (<lg) —
  // на десктопі той самий sidebarOpen керує шириною колонки, і клік не має її згортати.
  const handleNavClick = () => {
    if (window.innerWidth < 1024) closeSidebar();
  };

  const navItems = [
    { name: t('sidebar.nav.dashboard'),    path: '/',            icon: <LayoutDashboard size={20}/>, show: isAdmin },
    { name: t('sidebar.nav.clients'),      path: '/clients',     icon: <Users size={20}/>,           show: isAdmin },
    { name: t('sidebar.nav.appointments'), path: '/appointments',icon: <Calendar size={20}/>,        show: isAdmin || isBarber },
    { name: t('sidebar.nav.employees'),    path: '/employees',   icon: <User size={20}/>,            show: isAdmin },
    { name: t('sidebar.nav.services'),     path: '/services',    icon: <Scissors size={20}/>,        show: isAdmin },
    { name: t('sidebar.nav.reports'),      path: '/reports',     icon: <BarChart2 size={20}/>,       show: isAdmin },
    { name: t('sidebar.nav.settings'),     path: '/settings',    icon: <Settings size={20}/>,        show: isAdmin || isBarber },
  ].filter(item => item.show);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const roleLabel: Record<string, string> = {
    admin: t('roles.admin'),
    barber: t('roles.barber'),
    client: t('roles.client'),
  };

  return (
    <div className="flex flex-col h-full w-64 bg-surface border-r border-line">
      <div className="h-16 px-4 flex items-center border-b border-line">
        <h1 className="text-xl font-extrabold text-ink flex items-center tracking-tight">
          <span className="w-8 h-8 rounded-sm bg-brand-soft text-brand flex items-center justify-center mr-2.5">
            <Scissors size={16} />
          </span>
          <span className="inline-flex items-baseline" style={{ letterSpacing: '-0.03em' }}>
            hirnix
            <span className="w-1 h-1 rounded-full bg-brand ml-0.5 self-end mb-0.5" />
          </span>
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map(item => (
            <li key={item.path}>
              <NavLink to={item.path} onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 text-sm rounded-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-soft text-brand-dark font-semibold'
                      : 'text-ink-secondary hover:bg-canvas-soft hover:text-ink'
                  }`
                }>
                <span className="mr-3">{item.icon}</span>
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-line space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-ink-muted">{roleLabel[user?.role || ''] || user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-secondary hover:text-ink hover:bg-canvas-soft rounded-sm transition-colors">
          <LogOut size={16}/> {t('sidebar.logout')}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
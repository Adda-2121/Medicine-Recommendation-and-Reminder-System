import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import NotificationBell from './common/NotificationBell';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Bell, 
  History, 
  Users, 
  UserCircle, 
  LogOut, 
  Activity,
  Search,
  Home
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getMenuItems = () => {
    if (user?.role === 'company_admin') {
      return [
        { path: '/admin', icon: LayoutDashboard, label: t('sidebar.dashboard') },
        { path: '/profile', icon: UserCircle, label: t('sidebar.profile') }
      ];
    }

    if (user?.role === 'patient') {
      return [
        { path: `/patient`, icon: LayoutDashboard, label: t('sidebar.dashboard') },
        { path: '/find-doctor', icon: Search, label: t('sidebar.findDoctor') },
        { path: '/consultations', icon: MessageSquare, label: t('sidebar.consultations') },
        { path: '/reminders', icon: Bell, label: t('sidebar.reminders') },
        { path: '/history', icon: History, label: t('sidebar.history') },
        { path: '/profile', icon: UserCircle, label: t('sidebar.profile') }
      ];
    }

    if (user?.role === 'laboratorist' || user?.role === 'radiologist') {
      return [
        { path: `/${user.role}`, icon: LayoutDashboard, label: t('sidebar.dashboard') || 'Dashboard' },
        { path: '/profile', icon: UserCircle, label: t('sidebar.profile') || 'Profile' }
      ];
    }

    return [
      { path: `/doctor`, icon: LayoutDashboard, label: t('sidebar.dashboard') },
      { path: '/consultations', icon: MessageSquare, label: t('sidebar.consultations') },
      { path: '/history', icon: History, label: t('sidebar.history') },
      { path: '/profile', icon: UserCircle, label: t('sidebar.profile') }
    ];
  };

  if (!user) return null;

  return (
    <aside className="bg-slate-900 text-slate-300 w-64 min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-40 transition-all duration-300">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 bg-slate-950/50 border-b border-slate-800">
        <Activity size={24} className="text-primary-500 mr-3" strokeWidth={2.5} />
        <span className="text-white font-bold text-xl tracking-tight">HealthConnect</span>
      </div>

      {/* User Info */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between relative z-50">
        <div className="flex items-center overflow-hidden">
          <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-primary-500 font-bold overflow-hidden border border-slate-700 mr-3 flex-shrink-0">
             {user.profile_picture ? (
                <img src={`${api.defaults.baseURL?.replace(/\/api$/, '') || 'http://localhost:5000'}${user.profile_picture}`} alt="User" className="w-full h-full object-cover" />
             ) : (
                user.name.charAt(0)
             )}
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] text-slate-500 uppercase font-semibold mb-0.5">Signed in as</p>
            <p className="font-medium text-white truncate text-sm">{user.name}</p>
            <p className="text-[10px] text-primary-400 capitalize">{user.role.replace('_', ' ')}</p>
          </div>
        </div>
        <NotificationBell />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 overflow-y-auto hidden-scrollbar">
        <ul className="space-y-1 px-3">
          {getMenuItems().map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-lg transition-colors group ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <item.icon size={20} className="mr-3 shrink-0" />
                <span className="font-bold text-lg">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Area (Logout) */}
      <div className="p-4 border-t border-slate-800 flex flex-col gap-3">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center w-full px-3 py-2.5 rounded-lg transition-colors ${
              isActive
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <Home size={20} className="mr-3 shrink-0" />
          <span className="font-medium text-sm">Home Page</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2.5 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors group"
        >
          <LogOut size={20} className="mr-3 shrink-0" />
          <span className="font-medium text-sm">{t('publicLayout.logout') || 'Logout'}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

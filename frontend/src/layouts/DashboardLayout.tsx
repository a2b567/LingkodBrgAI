import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Home, FileText, AlertOctagon,
  Briefcase, Calendar, Settings, LogOut, Sun, Moon,
  Menu, X, ShieldAlert, ListOrdered, Activity
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { AIFloatingPanel } from '../components/AIFloatingPanel';
import logo from '../assets/logo.png';

interface LayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState<{ title: string; content: string } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Screen size detection for responsiveness
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false); // Default to closed on mobile
      } else {
        setSidebarOpen(true);  // Default to open on desktop
      }
    };

    handleResize(); // Run on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // WebSocket Live announcements
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/api/ws');

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.title && data.content) {
          setLiveAnnouncement({ title: data.title, content: data.content });
          // Auto-hide alert after 8 seconds
          setTimeout(() => {
            setLiveAnnouncement(null);
          }, 8000);
        }
      } catch (err) {
        // Handle message parse error
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['Super Admin', 'Barangay Captain', 'Secretary', 'Treasurer', 'Staff'] },
    { name: 'Residents', path: '/residents', icon: <Users size={20} />, roles: ['Super Admin', 'Barangay Captain', 'Secretary', 'Health Worker', 'Staff'] },
    { name: 'Households', path: '/households', icon: <Home size={20} />, roles: ['Super Admin', 'Barangay Captain', 'Secretary', 'Health Worker', 'Staff'] },
    { name: 'Health Records', path: '/health-records', icon: <Activity size={20} />, roles: ['Super Admin', 'Barangay Captain', 'Health Worker', 'Staff'] },
    { name: 'Certificates', path: '/certificates', icon: <FileText size={20} />, roles: ['Super Admin', 'Barangay Captain', 'Secretary', 'Treasurer', 'Staff', 'Resident'] },
    { name: 'Appointments', path: '/appointments', icon: <Calendar size={20} />, roles: ['all'] },
    { name: 'Certificates Schedule', path: '/queue-schedule', icon: <ListOrdered size={20} />, roles: ['Super Admin', 'Barangay Captain', 'Secretary', 'Treasurer', 'Staff', 'Resident'] },
    { name: 'Blotter Records', path: '/blotter', icon: <AlertOctagon size={20} />, roles: ['Super Admin', 'Barangay Captain', 'Secretary', 'Staff'] },
    { name: 'Businesses', path: '/businesses', icon: <Briefcase size={20} />, roles: ['Super Admin', 'Barangay Captain', 'Secretary', 'Treasurer', 'Staff'] },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} />, roles: ['all'] },
  ];

  const allowedItems = navItems.filter(item =>
    item.roles.includes('all') || (user && (user.role === 'Super Admin' || item.roles.includes(user.role)))
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Dynamic Background Glows */}
      <div className="ambient-glow glow-blue top-10 left-10"></div>
      <div className="ambient-glow glow-gold bottom-10 right-10"></div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-[2px] z-30 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Side Navigation Bar */}
      <aside className={`fixed top-0 bottom-0 left-0 z-40 bg-white/80 dark:bg-slate-900/80 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col glass-panel ${sidebarOpen
          ? 'translate-x-0 w-64'
          : '-translate-x-full md:translate-x-0 md:w-20'
        }`}>

        {/* Letterhead Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <img src={logo} alt="Barangay Logo" className="w-9 h-9 object-contain rounded-xl shadow-md flex-shrink-0 transition-transform duration-300 hover:rotate-6" />
          {sidebarOpen && (
            <div className="flex flex-col justify-center">
              <div className="font-extrabold text-sm leading-tight tracking-tight text-gov-blue-850 dark:text-gov-blue-300">LingkodBrgyAI</div>
              <div className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold tracking-widest uppercase leading-tight">Barangay Info Sys</div>
            </div>
          )}
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/50 flex-shrink-0">
          <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-950/40 p-2.5 rounded-2xl border border-slate-200/40 dark:border-slate-800/45 shadow-sm">
            <div className="w-9 h-9 bg-gradient-to-tr from-gov-blue-100 to-gov-blue-200 dark:from-gov-blue-950 dark:to-gov-blue-900 text-gov-blue-800 dark:text-gov-blue-300 font-extrabold rounded-xl flex items-center justify-center text-xs uppercase shadow-sm">
              {user?.username.slice(0, 2)}
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{user?.username}</p>
                <span className="text-[9px] bg-gov-blue-500/10 text-gov-blue-600 dark:text-gov-blue-400 font-semibold px-2 py-0.5 rounded-full border border-gov-blue-500/20 uppercase tracking-wider block w-max mt-0.5">
                  {user?.role}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {allowedItems.map((item, idx) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={idx}
                to={item.path}
                className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 hover:translate-x-0.5 ${isActive
                    ? 'bg-gradient-to-r from-gov-blue-600 to-gov-blue-700 text-white shadow-lg shadow-gov-blue-650/20'
                    : 'text-slate-500 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-150'
                  }`}
              >
                <div className={`flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`}>{item.icon}</div>
                {sidebarOpen && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1 flex-shrink-0">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/40 transition-colors"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            {sidebarOpen && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-950/20 transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Log Out</span>}
          </button>

          {sidebarOpen && (
            <div className="text-center text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pt-2.5 border-t border-slate-200/50 dark:border-slate-800/50 mt-2.5">
              dev • lawreene b aranas
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${sidebarOpen
          ? 'pl-0 md:pl-64'
          : 'pl-0 md:pl-20'
        }`}>
        {/* Top Header navbar */}
        <header className="h-16 bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 backdrop-blur-md z-30">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-500 hover:text-black dark:hover:text-slate-200 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Toggle sidebar"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block text-xs font-bold text-slate-500 dark:text-slate-400">
              LingkodBrgyAI Laguna • Government Portal
            </div>
          </div>

          {/* Quick Stats Header info */}
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="flex items-center gap-2 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full status-pulse"></span>
              Live Sync
            </span>
            <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-800"></div>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              <p className="text-[10px] text-slate-550 dark:text-slate-400 font-bold uppercase tracking-wide">Laguna, PH</p>
            </div>
          </div>
        </header>

        {/* Core Page content wrapper */}
        <main className="flex-1 p-4 sm:p-6 relative z-10 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Real-time WebSocket announcement notification banner */}
      {liveAnnouncement && (
        <div className="fixed bottom-6 left-6 z-50 max-w-sm bg-gradient-to-r from-gov-blue-800 to-gov-blue-900 text-white p-4 rounded-2xl shadow-2xl border border-gov-gold-400 flex gap-3 animate-slide-up glass-panel">
          <ShieldAlert size={24} className="text-gov-gold-400 flex-shrink-0 animate-bounce" />
          <div className="space-y-1.5">
            <h4 className="font-extrabold text-xs tracking-wide uppercase text-gov-gold-300">LIVE ANNOUNCEMENT</h4>
            <h5 className="font-bold text-xs">{liveAnnouncement.title}</h5>
            <p className="text-[11px] text-slate-200 leading-normal">{liveAnnouncement.content}</p>
          </div>
          <button
            onClick={() => setLiveAnnouncement(null)}
            className="text-slate-300 hover:text-white absolute top-3 right-3"
            title="Close announcement"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Floating AI Panel */}
      <AIFloatingPanel />
    </div>
  );
};
export default DashboardLayout;

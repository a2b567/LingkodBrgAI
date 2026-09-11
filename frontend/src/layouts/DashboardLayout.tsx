import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Home, FileText, AlertOctagon,
  Briefcase, Calendar, Settings, LogOut, Sun, Moon,
  Menu, X, ShieldAlert, ListOrdered, Activity, Bell, CheckCheck, Megaphone, AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { AIFloatingPanel } from '../components/AIFloatingPanel';
import { api } from '../services/api';
import type { Notification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState<{ title: string; content: string } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [popupToast, setPopupToast] = useState<{ title: string; content: string; type?: string } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fetchNotifications = async () => {
    try {
      const data = await api.notifications.list();
      if (user?.role === 'Resident') {
        const filtered = (data || []).filter(n => 
          n.type === 'Announcement' || n.type === 'Certificate' || n.type === 'Account' || n.type === 'General'
        );
        setNotifications(filtered);
      } else {
        setNotifications(data || []);
      }
    } catch (err) {
      console.error("Failed fetching notifications", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.notifications.read(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await Promise.all(notifications.filter(n => !n.is_read).map(n => api.notifications.read(n.id)));
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
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

  // WebSocket Live announcements & real-time notifications
  useEffect(() => {
    const wsUrl = window.location.protocol === 'https:'
      ? `wss://${window.location.host}/api/ws`
      : 'ws://localhost:8080/api/ws';

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.title && data.content) {
            // Residents ONLY receive Announcements & personal notifications, NOT staff Kiosk alerts!
            if (user?.role === 'Resident' && (data.type === 'Document' || (data.title && data.title.includes('Kiosk')))) {
              return;
            }

            const newNotif: Notification = {
              id: Date.now().toString(),
              title: data.title,
              content: data.content,
              type: data.type || 'Announcement',
              is_read: false,
              created_at: new Date().toISOString()
            };

            setNotifications(prev => [newNotif, ...prev]);
            setLiveAnnouncement({ title: data.title, content: data.content });

            // Popup Toast Notification
            setPopupToast({
              title: data.title,
              content: data.content,
              type: data.type || 'Announcement'
            });

            // Auto-hide popup toast after 7 seconds
            setTimeout(() => {
              setPopupToast(null);
            }, 7000);

            setTimeout(() => {
              setLiveAnnouncement(null);
            }, 8000);
          }
        } catch (err) {}
      };
    } catch (e) {}

    return () => {
      if (ws) ws.close();
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
          <div className="w-9 h-9 bg-gradient-to-tr from-gov-blue-700 to-indigo-800 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0">
            <ShieldAlert size={20} className="text-gov-gold-400" />
          </div>
          {sidebarOpen && (
            <div className="flex flex-col justify-center">
              <div className="font-extrabold text-sm leading-tight tracking-tight text-gov-blue-850 dark:text-gov-blue-300">LingkodBrgyAi</div>
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

          {/* Header Right Actions: Notification Bell + Quick Stats info */}
          <div className="flex items-center gap-3 sm:gap-4 relative">
            
            {/* Global Notification Bell & Dropdown Panel (Works for Resident & Staff) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifDropdown(prev => !prev)}
                className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell size={20} />
              </button>

              {/* Notification Dropdown Panel */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-hidden glass-panel">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell size={16} className="text-gov-blue-600 dark:text-gov-blue-400" />
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/20">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-bold text-gov-blue-600 dark:text-gov-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck size={12} />
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 dark:text-slate-500 space-y-1">
                        <Bell size={24} className="mx-auto opacity-40 mb-2" />
                        <p className="text-xs font-bold">No notifications</p>
                        <p className="text-[10px]">Announcements and updates will appear here</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkRead(n.id)}
                          className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                            n.is_read 
                              ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60' 
                              : 'bg-gov-blue-50/50 dark:bg-gov-blue-950/30 hover:bg-gov-blue-50 dark:hover:bg-gov-blue-950/50'
                          }`}
                        >
                          <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                            n.type === 'Alert' || n.type === 'Emergency'
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              : 'bg-gov-blue-500/10 text-gov-blue-600 dark:text-gov-blue-400 border border-gov-blue-500/20'
                          }`}>
                            {n.type === 'Alert' || n.type === 'Emergency' ? <AlertTriangle size={15} /> : <Megaphone size={15} />}
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-xs truncate ${!n.is_read ? 'font-extrabold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                                {n.title}
                              </p>
                              {!n.is_read && (
                                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
                              {n.content}
                            </p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold pt-0.5">
                              {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <span className="flex items-center gap-2 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full status-pulse"></span>
              Live Sync
            </span>
            <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-800"></div>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">Laguna, PH</p>
            </div>
          </div>
        </header>

        {/* Core Page content wrapper */}
        <main className="flex-1 p-4 sm:p-6 relative z-10 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Floating Pop-up Toast Notification (Top-Right Corner) */}
      {popupToast && (
        <div className="fixed top-5 right-5 z-50 max-w-sm w-full bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-gov-gold-400/80 flex items-start gap-3.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-2.5 bg-gov-gold-500/20 text-gov-gold-400 rounded-xl border border-gov-gold-400/40 shrink-0">
            <Megaphone size={20} className="animate-pulse" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-gov-gold-400">
                NEW ANNOUNCEMENT
              </span>
              <span className="text-[9px] font-bold text-slate-400">Just now</span>
            </div>
            <h5 className="font-extrabold text-xs text-white leading-snug truncate">{popupToast.title}</h5>
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium line-clamp-3">{popupToast.content}</p>
          </div>
          <button
            onClick={() => setPopupToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            title="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}

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
            className="text-slate-300 hover:text-white absolute top-3 right-3 cursor-pointer"
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

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Home, FileText, AlertOctagon,
  Briefcase, Calendar, Settings, LogOut, Sun, Moon,
  Menu, X, ShieldAlert, ListOrdered, Activity, Bell, CheckCheck, Megaphone, AlertTriangle, UserCog, Stethoscope
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

  // Responsive screen-size tracking
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-close sidebar on mobile navigation
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // WebSocket Live announcements & notifications
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

            setPopupToast({
              title: data.title,
              content: data.content,
              type: data.type || 'Announcement'
            });

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
  }, [user]);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} />, roles: ['all'] },
    { name: 'Residents', path: '/residents', icon: <Users size={18} />, roles: ['Super Admin', 'Barangay Captain', 'Secretary', 'Health Worker', 'Staff'] },
    { name: 'Households', path: '/households', icon: <Home size={18} />, roles: ['Super Admin', 'Barangay Captain', 'Secretary', 'Health Worker', 'Staff'] },
    { name: 'Health Records', path: '/health-records', icon: <Activity size={18} />, roles: ['Super Admin', 'Barangay Captain', 'Health Worker', 'Staff'] },
    { name: 'Clinic Queue', path: '/clinic-queue', icon: <Stethoscope size={18} />, roles: ['Resident'] },
    { name: 'Certificates', path: '/certificates', icon: <FileText size={18} />, roles: ['Super Admin', 'Barangay Captain', 'Secretary', 'Treasurer', 'Staff', 'Resident'] },
    { name: 'Appointments', path: '/appointments', icon: <Calendar size={18} />, roles: ['all'] },
    { name: 'Certificates Schedule', path: '/queue-schedule', icon: <ListOrdered size={18} />, roles: ['Super Admin', 'Barangay Captain', 'Secretary', 'Treasurer', 'Staff', 'Resident'] },
    { name: 'Blotter Records', path: '/blotter', icon: <AlertOctagon size={18} />, roles: ['Super Admin', 'Barangay Captain', 'Secretary', 'Staff'] },
    { name: 'Businesses', path: '/businesses', icon: <Briefcase size={18} />, roles: ['Super Admin', 'Barangay Captain', 'Secretary', 'Treasurer', 'Staff'] },
    { name: 'Settings', path: '/settings', icon: <Settings size={18} />, roles: ['all'] },
    { name: 'Staff Accounts', path: '/staff-accounts', icon: <UserCog size={18} />, roles: ['Super Admin', 'Barangay Captain'] },
  ];

  const allowedItems = navItems.filter(item =>
    item.roles.includes('all') || (user && (user.role === 'Super Admin' || item.roles.includes(user.role)))
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/50 dark:bg-slate-950/70 backdrop-blur-xs z-30 transition-opacity duration-200"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Side Navigation Bar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-all duration-200 flex flex-col ${
          sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'
        }`}
        aria-label="Main Navigation"
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200/80 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gov-blue-600 text-white font-bold flex items-center justify-center shrink-0 shadow-subtle text-sm">
              LB
            </div>
            {sidebarOpen && (
              <div className="flex flex-col justify-center truncate">
                <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight">
                  LingkodBrgy
                </span>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  San Isidro Portal
                </span>
              </div>
            )}
          </div>
          {isMobile && sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* User Badge Profile */}
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800/80 flex-shrink-0">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60">
            <div className="w-8 h-8 rounded-lg bg-gov-blue-100 dark:bg-gov-blue-950 text-gov-blue-700 dark:text-gov-blue-300 font-bold flex items-center justify-center text-xs uppercase shrink-0">
              {user?.username ? user.username.slice(0, 2) : 'US'}
            </div>
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                  {user?.username}
                </p>
                <span className="inline-block text-[10px] font-medium text-gov-blue-600 dark:text-gov-blue-400">
                  {user?.role}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation items list */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {allowedItems.map((item, idx) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={idx}
                to={item.path}
                title={!sidebarOpen ? item.name : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-colors ${
                  isActive
                    ? 'bg-gov-blue-600 text-white shadow-subtle'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="shrink-0">{item.icon}</div>
                {sidebarOpen && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1 flex-shrink-0">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            {sidebarOpen && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 min-w-0 ${
          sidebarOpen ? 'pl-0 md:pl-64' : 'pl-0 md:pl-20'
        }`}
      >
        {/* Top Navbar */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 backdrop-blur-md z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              aria-label="Toggle navigation"
            >
              <Menu size={18} />
            </button>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 sm:gap-4 relative">
            {/* Live Indicator */}
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Connected
            </span>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifDropdown(prev => !prev)}
                className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="View notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-dropdown z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                        Notifications
                      </h4>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/60">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-semibold text-gov-blue-600 dark:text-gov-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck size={13} />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 dark:text-slate-500 space-y-1">
                        <Bell size={24} className="mx-auto opacity-40 mb-1" />
                        <p className="text-xs font-semibold">No notifications</p>
                        <p className="text-[10px]">Updates will appear here in real-time</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkRead(n.id)}
                          className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                            n.is_read
                              ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                              : 'bg-gov-blue-50/40 dark:bg-gov-blue-950/30 hover:bg-gov-blue-50/70'
                          }`}
                        >
                          <div
                            className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                              n.type === 'Alert' || n.type === 'Emergency'
                                ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800'
                                : 'bg-gov-blue-50 text-gov-blue-600 border border-gov-blue-200 dark:bg-gov-blue-950/60 dark:text-gov-blue-400 dark:border-gov-blue-800'
                            }`}
                          >
                            {n.type === 'Alert' || n.type === 'Emergency' ? (
                              <AlertTriangle size={15} />
                            ) : (
                              <Megaphone size={15} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-xs truncate ${!n.is_read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                {n.title}
                              </p>
                              {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {n.content}
                            </p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium pt-0.5">
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

            <div className="hidden sm:block text-right border-l border-slate-200 dark:border-slate-800 pl-4">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Brgy San Isidro
              </p>
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-around shadow-lg">
        {user?.role === 'Resident' ? (
          <>
            <Link
              to="/dashboard"
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-xs font-semibold ${
                location.pathname === '/dashboard'
                  ? 'text-gov-blue-600 dark:text-gov-blue-400'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'
              }`}
            >
              <LayoutDashboard size={18} />
              <span className="text-[10px] mt-0.5">Home</span>
            </Link>
            <Link
              to="/clinic-queue"
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-xs font-semibold ${
                location.pathname === '/clinic-queue'
                  ? 'text-gov-blue-600 dark:text-gov-blue-400'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'
              }`}
            >
              <Stethoscope size={18} />
              <span className="text-[10px] mt-0.5">Clinic</span>
            </Link>
            <Link
              to="/certificates"
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-xs font-semibold ${
                location.pathname === '/certificates'
                  ? 'text-gov-blue-600 dark:text-gov-blue-400'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'
              }`}
            >
              <FileText size={18} />
              <span className="text-[10px] mt-0.5">Certs</span>
            </Link>
            <Link
              to="/appointments"
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-xs font-semibold ${
                location.pathname === '/appointments'
                  ? 'text-gov-blue-600 dark:text-gov-blue-400'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'
              }`}
            >
              <Calendar size={18} />
              <span className="text-[10px] mt-0.5">Book</span>
            </Link>
            <Link
              to="/settings"
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-xs font-semibold ${
                location.pathname === '/settings'
                  ? 'text-gov-blue-600 dark:text-gov-blue-400'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'
              }`}
            >
              <Settings size={18} />
              <span className="text-[10px] mt-0.5">Settings</span>
            </Link>
          </>
        ) : (
          allowedItems.slice(0, 5).map((item, idx) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={idx}
                to={item.path}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-xs font-semibold ${
                  isActive
                    ? 'text-gov-blue-600 dark:text-gov-blue-400'
                    : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'
                }`}
              >
                {item.icon}
                <span className="text-[9px] mt-0.5 truncate max-w-[54px]">{item.name}</span>
              </Link>
            );
          })
        )}
      </nav>

      {/* Pop-up Toast Announcement */}
      {popupToast && (
        <div className="fixed top-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-slate-700 flex items-start gap-3.5 animate-in fade-in duration-200">
          <div className="p-2 bg-gov-blue-500/20 text-gov-blue-400 rounded-xl shrink-0">
            <Megaphone size={18} />
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <h5 className="font-bold text-xs text-white truncate">{popupToast.title}</h5>
            <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed">{popupToast.content}</p>
          </div>
          <button
            onClick={() => setPopupToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors shrink-0"
            aria-label="Dismiss toast"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Floating WebSocket announcement notification */}
      {liveAnnouncement && (
        <div className="fixed bottom-6 left-6 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-slate-700 flex gap-3">
          <ShieldAlert size={20} className="text-gov-gold-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="font-bold text-xs">{liveAnnouncement.title}</h5>
            <p className="text-[11px] text-slate-300 leading-normal">{liveAnnouncement.content}</p>
          </div>
          <button
            onClick={() => setLiveAnnouncement(null)}
            className="text-slate-400 hover:text-white absolute top-3 right-3"
            aria-label="Close announcement"
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

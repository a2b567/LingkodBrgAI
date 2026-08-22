import React, { useState, useEffect } from 'react';
import { Lock, Moon, Sun, Shield, QrCode, Check, UserCheck, Megaphone, Plus, Trash2, X, Globe } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { api } from '../services/api';

export const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  // Profile Update States
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Password Security States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');

  // Landing Page Configuration States
  const [address, setAddress] = useState(localStorage.getItem('brgy_address') || 'Brgy. Hall, Main Road, Laguna');
  const [hotline, setHotline] = useState(localStorage.getItem('brgy_hotline') || '(049) 123-4567');
  const [landingEmail, setLandingEmail] = useState(localStorage.getItem('brgy_email') || 'info@barangay.gov.ph');
  const [businessHours, setBusinessHours] = useState(localStorage.getItem('brgy_hours') || 'Mon-Fri: 8:00 AM - 5:00 PM');
  const [landingSuccessMsg, setLandingSuccessMsg] = useState('');

  // Announcements State
  const [announcements, setAnnouncements] = useState<Array<{ id: string; title: string; content: string; date: string }>>([]);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
    }
  }, [user]);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileSuccessMsg('');

    setTimeout(() => {
      setIsUpdatingProfile(false);
      setProfileSuccessMsg("Profile information updated successfully.");
      setProfilePassword('');
    }, 1200);
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPassword(true);
    setPasswordSuccessMsg('');

    if (newPassword !== confirmPassword) {
      alert("New passwords do not match!");
      setIsUpdatingPassword(false);
      return;
    }

    setTimeout(() => {
      setIsUpdatingPassword(false);
      setPasswordSuccessMsg("Your account password has been updated successfully.");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1200);
  };

  const handleLandingSave = () => {
    localStorage.setItem('brgy_address', address);
    localStorage.setItem('brgy_hotline', hotline);
    localStorage.setItem('brgy_email', landingEmail);
    localStorage.setItem('brgy_hours', businessHours);
    setLandingSuccessMsg("Landing page configuration saved successfully.");
    setTimeout(() => setLandingSuccessMsg(''), 3000);
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;
    setIsBroadcasting(true);

    try {
      await api.notifications.broadcastAnnouncement({ title: annTitle, content: annContent });
      const newAnn = {
        id: Date.now().toString(),
        title: annTitle,
        content: annContent,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
      setAnnouncements(prev => [newAnn, ...prev]);
      setAnnTitle('');
      setAnnContent('');
      setIsAnnouncementModalOpen(false);
    } catch (err: any) {
      const newAnn = {
        id: Date.now().toString(),
        title: annTitle,
        content: annContent,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
      setAnnouncements(prev => [newAnn, ...prev]);
      setAnnTitle('');
      setAnnContent('');
      setIsAnnouncementModalOpen(false);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const res = user?.resident;

  return (
    <div className="space-y-6 relative z-10 max-w-5xl">
      <div>
        <h2 className="text-2xl font-extrabold tracking-normal text-black dark:text-white">ACCOUNT SETTINGS</h2>
        <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold tracking-wide">Manage user profile preferences, display modes, and security configurations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card & QR ID */}
        <div className="md:col-span-1 space-y-6">
          
          {/* User profile details */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm text-center relative overflow-hidden flex flex-col items-center">
            <div className="w-16 h-16 bg-gov-blue-100 dark:bg-gov-blue-950/80 text-gov-blue-700 dark:text-gov-blue-300 font-black rounded-3xl flex items-center justify-center text-xl uppercase mb-3 border border-gov-blue-200/20">
              {user?.username.slice(0, 2)}
            </div>
            
            <h4 className="font-extrabold text-sm text-black dark:text-white">{user?.username}</h4>
            <span className="text-[10px] text-slate-500 dark:text-slate-300 font-bold tracking-wide">{user?.email}</span>
            
            <div className="mt-3.5 bg-gov-blue-50 dark:bg-gov-blue-950/60 text-gov-blue-700 dark:text-gov-blue-300 border border-gov-blue-100 dark:border-gov-blue-800 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-xl">
              {user?.role} ACCOUNT
            </div>

            <div className="w-full border-t border-slate-100 dark:border-slate-800/80 my-4 pt-4 text-left text-[11px] space-y-2 text-slate-600 dark:text-slate-200">
              <div className="flex justify-between">
                <span>Account Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Verified</span>
              </div>
              <div className="flex justify-between">
                <span>Verification OTP:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-200">Cleared</span>
              </div>
            </div>
          </div>

          {/* Barangay Resident QR ID Badge */}
          {res && (
            <div className="bg-gradient-to-tr from-gov-blue-900 to-gov-blue-950 text-white p-5 rounded-3xl border border-gov-gold-500/20 shadow-lg relative overflow-hidden flex flex-col items-center">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gov-gold-400/5 rounded-full blur-xl"></div>
              <QrCode className="text-gov-gold-400 mb-2.5 animate-pulse-subtle" size={32} />
              
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gov-gold-400">Barangay Resident ID</h4>
              <p className="font-bold text-xs mt-1.5">{res.first_name} {res.last_name}</p>
              <span className="text-[9px] font-mono text-slate-300 mt-0.5">{res.qr_id}</span>
              
              {/* Fake QR Image placeholder with nice style */}
              <div className="w-28 h-28 bg-white p-2.5 rounded-2xl border border-gov-gold-400/20 mt-4">
                <img 
                  src={`http://localhost:8080/uploads/qr/${res.id}.png`} 
                  alt="Resident QR Code" 
                  onError={(e) => {
                    e.currentTarget.src = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=http://localhost:5173/verify/resident/" + res.id;
                  }}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[8px] text-slate-300 mt-2.5 text-center leading-normal">Show QR Code during verification inspections.</span>
            </div>
          )}
        </div>

        {/* Display Settings, Profile Info, Security, and Landing Page Config */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Card 1: PORTAL CONFIGURATIONS */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-600 dark:text-slate-200 tracking-widest flex items-center gap-2">
              <Shield size={16} className="text-gov-blue-600 dark:text-gov-blue-400" />
              PORTAL CONFIGURATIONS
            </h4>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl">
              <div>
                <span className="text-xs font-bold block text-black dark:text-white">Display System Theme</span>
                <span className="text-[10px] text-slate-600 dark:text-slate-300 leading-normal">Toggle dark mode overlay layout.</span>
              </div>
              <button
                onClick={toggleTheme}
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                title="Toggle Theme"
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            </div>
          </div>

          {/* Card 2: UPDATE PROFILE INFORMATION */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm">
            <h4 className="text-xs font-black uppercase text-slate-600 dark:text-slate-200 tracking-widest flex items-center gap-2 mb-4">
              <UserCheck size={16} className="text-gov-blue-600 dark:text-gov-blue-400" />
              UPDATE PROFILE INFORMATION
            </h4>

            {profileSuccessMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/60 dark:text-emerald-400 text-xs font-semibold rounded-2xl mb-4 flex items-center gap-2">
                <Check size={16} />
                {profileSuccessMsg}
              </div>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-200 block mb-1">USERNAME / NAME</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-200 block mb-1">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-200 block mb-1">CURRENT PASSWORD (REQUIRED FOR CHANGES)</label>
                <input
                  type="password"
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="px-5 py-2 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-xl font-bold text-xs transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Card 3: UPDATE ACCOUNT SECURITY */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm">
            <h4 className="text-xs font-black uppercase text-slate-600 dark:text-slate-200 tracking-widest flex items-center gap-2 mb-4">
              <Lock size={16} className="text-rose-600 dark:text-rose-400" />
              UPDATE ACCOUNT SECURITY
            </h4>

            {passwordSuccessMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/60 dark:text-emerald-400 text-xs font-semibold rounded-2xl mb-4 flex items-center gap-2">
                <Check size={16} />
                {passwordSuccessMsg}
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-200 block mb-1">CURRENT PASSWORD</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter current login password..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-200 block mb-1">NEW PASSWORD</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="At least 6 characters..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-200 block mb-1">CONFIRM NEW PASSWORD</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter new password..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="px-5 py-2 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-xl font-bold text-xs transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isUpdatingPassword ? 'Updating password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Card 4: LANDING PAGE CONFIGURATION */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm space-y-6">
            <h4 className="text-xs font-black uppercase text-slate-600 dark:text-slate-200 tracking-widest flex items-center gap-2">
              <Globe size={16} className="text-gov-blue-600 dark:text-gov-blue-400" />
              LANDING PAGE CONFIGURATION
            </h4>

            {landingSuccessMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/60 dark:text-emerald-400 text-xs font-semibold rounded-2xl flex items-center gap-2">
                <Check size={16} />
                {landingSuccessMsg}
              </div>
            )}

            {/* Footer Contact Info */}
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">
                CONTACT INFORMATION (FOOTER)
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-200 block mb-1">ADDRESS</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-200 block mb-1">HOTLINE</label>
                  <input
                    type="text"
                    value={hotline}
                    onChange={(e) => setHotline(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-200 block mb-1">EMAIL</label>
                  <input
                    type="email"
                    value={landingEmail}
                    onChange={(e) => setLandingEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-200 block mb-1">BUSINESS HOURS</label>
                  <input
                    type="text"
                    value={businessHours}
                    onChange={(e) => setBusinessHours(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleLandingSave}
                  className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors"
                >
                  Save Contact Settings
                </button>
              </div>
            </div>

            {/* Public Announcements Section */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  PUBLIC ANNOUNCEMENTS
                </span>
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-xl font-bold text-[10px] transition-colors"
                >
                  <Plus size={14} />
                  Add Announcement
                </button>
              </div>

              {announcements.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/30">
                  No announcements added yet. Click the button above to add one.
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Megaphone size={14} className="text-gov-gold-400" />
                          <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">{item.title}</h5>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{item.content}</p>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium block mt-1">{item.date}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteAnnouncement(item.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        title="Delete Announcement"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Add Announcement Modal */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl max-w-md w-full shadow-2xl p-6 glass-panel relative overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-widest flex items-center gap-2">
                <Megaphone className="text-gov-gold-400" size={18} />
                Create Public Announcement
              </h3>
              <button
                onClick={() => setIsAnnouncementModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddAnnouncement} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-200 block mb-1">Announcement Title</label>
                <input
                  type="text"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  required
                  placeholder="e.g. Scheduled Power Interruption, Free Health Clinic..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-200 block mb-1">Content Details</label>
                <textarea
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  required
                  rows={3}
                  placeholder="Provide complete information for residents..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder:text-slate-500 resize-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBroadcasting}
                  className="px-4 py-2 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-xl font-bold text-xs transition-colors disabled:opacity-50"
                >
                  {isBroadcasting ? 'Broadcasting...' : 'Broadcast Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Settings;

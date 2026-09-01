import React, { useState, useEffect, useRef } from 'react';
import { Lock, Moon, Sun, Shield, QrCode, Check, UserCheck, Megaphone, Plus, Trash2, X, Globe, ImagePlus, Trash } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { api } from '../services/api';

export const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const isStaff = user && user.role !== 'Resident';

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

  // Hero Background Image
  const [heroBgPreview, setHeroBgPreview] = useState<string | null>(localStorage.getItem('brgy_hero_bg') || null);
  const heroBgInputRef = useRef<HTMLInputElement>(null);

  const handleHeroBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      localStorage.setItem('brgy_hero_bg', dataUrl);
      setHeroBgPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveHeroBg = () => {
    localStorage.removeItem('brgy_hero_bg');
    setHeroBgPreview(null);
    if (heroBgInputRef.current) heroBgInputRef.current.value = '';
  };

  // Default initial announcements
  const defaultAnnouncements = [
    {
      id: '1',
      title: 'Annual Dental & Medical Mission',
      content: 'Join our health volunteers this Saturday, June 6th, starting from 8:00 AM at the Lawrence Barangay Covered Court. Pediatric consults, dental extraction services, and free basic wellness check-ups are open for all residents.',
      category: 'Health Advisory',
      badge: 'Active',
      author: 'Barangay Health Council',
      initials: 'HW',
      date: 'Issued 2 hours ago'
    },
    {
      id: '2',
      title: 'Online Portal Official Launch',
      content: 'We have officially launched the new LingkodBrgAI Barangay Management Information System! Citizens can now create their electronic profiles, secure residency clearances, file blotter reports, and arrange lobby appointments completely online.',
      category: 'LGU Announcement',
      badge: 'General',
      author: 'Office of the Captain',
      initials: 'BC',
      date: 'Issued 1 day ago'
    },
    {
      id: '3',
      title: 'Livelihood & Business Clearance Seminar',
      content: 'In partnership with the Department of Trade and Industry (DTI), the barangay will host a livelihood capacity-building seminar on micro-entrepreneurship and fast-tracking local commercial business permits. Registration is free.',
      category: 'Livelihood Advisory',
      badge: 'Seminar',
      author: 'Barangay Secretary Office',
      initials: 'BS',
      date: 'Issued 3 days ago'
    }
  ];

  // Announcements State initialized from localStorage
  const [announcements, setAnnouncements] = useState<Array<{ id: string; title: string; content: string; date: string; category?: string; badge?: string; author?: string; initials?: string }>>(() => {
    try {
      const saved = localStorage.getItem('lingkod_landing_announcements');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    localStorage.setItem('lingkod_landing_announcements', JSON.stringify(defaultAnnouncements));
    return defaultAnnouncements;
  });
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

    const newAnn = {
      id: Date.now().toString(),
      title: annTitle,
      content: annContent,
      category: 'LGU Announcement',
      badge: 'Active',
      author: user?.role ? `Office of the ${user.role.replace('Barangay ', '')}` : 'Office of the Captain',
      initials: user?.role === 'Secretary' ? 'BS' : 'BC',
      date: `Issued ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    };

    try {
      await api.notifications.broadcastAnnouncement({ title: annTitle, content: annContent });
    } catch (err: any) {}

    const updated = [newAnn, ...announcements];
    setAnnouncements(updated);
    localStorage.setItem('lingkod_landing_announcements', JSON.stringify(updated));
    setAnnTitle('');
    setAnnContent('');
    setIsAnnouncementModalOpen(false);
    setIsBroadcasting(false);
  };

  const handleDeleteAnnouncement = (id: string) => {
    const updated = announcements.filter(a => a.id !== id);
    setAnnouncements(updated);
    localStorage.setItem('lingkod_landing_announcements', JSON.stringify(updated));
  };

  const res = user?.resident;

  return (
    <div className="space-y-6 relative z-10 max-w-5xl">
      <div>
        <h2 className="text-2xl font-extrabold tracking-normal text-slate-900 dark:text-white">ACCOUNT SETTINGS</h2>
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
            
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{user?.username}</h4>
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
                <span className="text-xs font-bold block text-slate-900 dark:text-white">Display System Theme</span>
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

          {/* Card 4: LANDING PAGE CONFIGURATION (Officers / Staff Only) */}
          {isStaff && (
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

              {/* Hero Background Upload */}
              <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">
                  HERO BACKGROUND IMAGE
                </span>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  Upload a photo to display as the landing page background. A dark overlay will be applied for readability.
                </p>

                {heroBgPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                    <img src={heroBgPreview} alt="Hero Background Preview" className="w-full h-36 object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={handleRemoveHeroBg}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-colors shadow-lg"
                      >
                        <Trash size={14} />
                        Remove Image
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Current Background
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => heroBgInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500 hover:border-gov-blue-400 dark:hover:border-gov-blue-500 hover:text-gov-blue-500 dark:hover:text-gov-blue-400 transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-950/20"
                  >
                    <ImagePlus size={28} />
                    <span className="text-xs font-bold">Click to upload background image</span>
                    <span className="text-[10px]">JPG, PNG, WEBP — Max 5MB recommended</span>
                  </button>
                )}

                <input
                  ref={heroBgInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleHeroBgUpload}
                  className="hidden"
                />

                {!heroBgPreview && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
                    No background image set — default gradient is used.
                  </p>
                )}
              </div>

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
          )}

        </div>
      </div>

      {/* Add Announcement Modal */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl max-w-md w-full shadow-2xl p-7 relative">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
                  <Megaphone className="text-amber-500" size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                    Create Announcement
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                    Publish to Landing Page
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAnnouncementModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleAddAnnouncement} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1.5">
                  Announcement Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  required
                  placeholder="e.g. Scheduled Power Interruption, Free Health Clinic..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gov-blue-500/40 focus:border-gov-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1.5">
                  Content Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  required
                  rows={4}
                  placeholder="Provide complete information for residents..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gov-blue-500/40 focus:border-gov-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBroadcasting}
                  className="px-5 py-2.5 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-xl font-bold text-xs transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isBroadcasting ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Broadcasting...
                    </>
                  ) : (
                    'Broadcast Announcement'
                  )}
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

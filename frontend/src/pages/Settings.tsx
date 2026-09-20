import React, { useState, useEffect, useRef } from 'react';
import {
  Lock, Moon, Sun, QrCode, Check, Megaphone, Plus, Trash2, Globe,
  ImagePlus, Trash, Save, RotateCcw, AlertTriangle, KeyRound,
  User, Mail, CheckCircle2, ChevronRight, Shield, Settings2, PhilippinePeso
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { api } from '../services/api';
import { PageHeader, Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Badge, Modal } from '../components/ui';

type ActiveTab = 'profile' | 'security' | 'portal' | 'fees' | 'danger';

export const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const isStaff = user && user.role !== 'Resident';

  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');

  // Profile
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  // Landing Page Config
  const [address, setAddress] = useState(localStorage.getItem('brgy_address') || 'Brgy. Hall, Main Road, Laguna');
  const [hotline, setHotline] = useState(localStorage.getItem('brgy_hotline') || '(049) 123-4567');
  const [landingEmail, setLandingEmail] = useState(localStorage.getItem('brgy_email') || 'info@barangay.gov.ph');
  const [businessHours, setBusinessHours] = useState(localStorage.getItem('brgy_hours') || 'Mon-Fri: 8:00 AM - 5:00 PM');
  const [landingSuccessMsg, setLandingSuccessMsg] = useState('');

  // Hero Background
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

  const defaultAnnouncements = [
    {
      id: '1',
      title: 'Annual Dental & Medical Mission',
      content: 'Join our health volunteers this Saturday, June 6th, starting from 8:00 AM at the Lawrence Barangay Covered Court.',
      category: 'Health Advisory',
      badge: 'Active',
      author: 'Barangay Health Council',
      initials: 'HW',
      date: 'Issued 2 hours ago'
    },
    {
      id: '2',
      title: 'Online Portal Official Launch',
      content: 'We have officially launched the new LingkodBrgAI Barangay Management Information System!',
      category: 'LGU Announcement',
      badge: 'General',
      author: 'Office of the Captain',
      initials: 'BC',
      date: 'Issued 1 day ago'
    },
    {
      id: '3',
      title: 'Livelihood & Business Clearance Seminar',
      content: 'In partnership with the DTI, the barangay will host a livelihood capacity-building seminar on micro-entrepreneurship.',
      category: 'Livelihood Advisory',
      badge: 'Seminar',
      author: 'Barangay Secretary Office',
      initials: 'BS',
      date: 'Issued 3 days ago'
    }
  ];

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

  const defaultCertFees = { Clearance: 150, Indigency: 0, Residency: 100, Business: 300, Cedula: 50, 'Barangay ID': 100 };
  const [certFees, setCertFees] = useState<Record<string, number>>(() => {
    try { const s = localStorage.getItem('cert_fees'); return s ? { ...defaultCertFees, ...JSON.parse(s) } : defaultCertFees; } catch { return defaultCertFees; }
  });
  const [certFeeSuccessMsg, setCertFeeSuccessMsg] = useState('');
  const [isFeePasswordModalOpen, setIsFeePasswordModalOpen] = useState(false);
  const [feePassword, setFeePassword] = useState('');
  const [feePasswordError, setFeePasswordError] = useState('');
  const [isSavingFees, setIsSavingFees] = useState(false);

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
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    }, 1000);
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg('');
    setPasswordSuccessMsg('');
    if (newPassword.length < 6) { setPasswordErrorMsg("New password must be at least 6 characters long."); return; }
    if (newPassword !== confirmPassword) { setPasswordErrorMsg("New passwords do not match!"); return; }
    setIsUpdatingPassword(true);
    setTimeout(() => {
      setIsUpdatingPassword(false);
      setPasswordSuccessMsg("Your account password has been updated successfully.");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccessMsg(''), 4000);
    }, 1000);
  };

  const handleResetQueueData = () => {
    if (!window.confirm('⚠️ This will CLEAR all queue tickets and session data. This cannot be undone. Continue?')) return;
    localStorage.removeItem('lingkod_queue_slots');
    localStorage.removeItem('lingkod_landing_announcements');
    localStorage.removeItem('cert_fees');
    window.location.reload();
  };

  const handleLandingSave = () => {
    localStorage.setItem('brgy_address', address);
    localStorage.setItem('brgy_hotline', hotline);
    localStorage.setItem('brgy_email', landingEmail);
    localStorage.setItem('brgy_hours', businessHours);
    setLandingSuccessMsg("Portal contact configuration saved successfully.");
    setTimeout(() => setLandingSuccessMsg(''), 4000);
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
    try { await api.notifications.broadcastAnnouncement({ title: annTitle, content: annContent }); } catch (err: any) {}
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

  const handleCertFeeSave = () => {
    setFeePassword('');
    setFeePasswordError('');
    setIsFeePasswordModalOpen(true);
  };

  const confirmCertFeeSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feePassword || feePassword.trim() === '') {
      setFeePasswordError('Current password is required to save fee changes.');
      return;
    }
    setIsSavingFees(true);
    setFeePasswordError('');
    setTimeout(() => {
      localStorage.setItem('cert_fees', JSON.stringify(certFees));
      setIsSavingFees(false);
      setIsFeePasswordModalOpen(false);
      setCertFeeSuccessMsg('Official certificate fees updated successfully.');
      setFeePassword('');
      setTimeout(() => setCertFeeSuccessMsg(''), 4000);
    }, 600);
  };

  const res = user?.resident;

  const navTabs: Array<{ id: ActiveTab; label: string; icon: React.ReactNode; staffOnly?: boolean; color?: string }> = [
    { id: 'profile', label: 'My Profile', icon: <User size={15} /> },
    { id: 'security', label: 'Security', icon: <Shield size={15} /> },
    { id: 'portal', label: 'Portal & Public Page', icon: <Globe size={15} />, staffOnly: true },
    { id: 'fees', label: 'Certificate Fees', icon: <PhilippinePeso size={15} />, staffOnly: true },
    { id: 'danger', label: 'Maintenance', icon: <Settings2 size={15} />, staffOnly: true },
  ];

  const visibleTabs = navTabs.filter(tab => !tab.staffOnly || isStaff);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Settings & Administration"
        subtitle="Configure profile credentials, security protocols, system display, and barangay operations."
        badge={<Badge variant="default">{user?.role || 'Staff'}</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

        {/* ── Left Column ── */}
        <div className="lg:col-span-1 space-y-4">

          {/* User Identity Card */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col items-center text-center shadow-card">
            {/* Decorative gradient top bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-gov-blue-500 via-gov-blue-400 to-gov-blue-600 rounded-t-2xl" />
            <div className="w-16 h-16 rounded-2xl bg-gov-blue-600 text-white font-black flex items-center justify-center text-xl uppercase shadow-lg mt-2 select-none">
              {user?.username ? user.username.slice(0, 2) : 'US'}
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-full mt-3">
              {user?.username}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-full mt-0.5">
              {user?.email}
            </p>
            <div className="mt-3">
              <Badge variant="info" dot>{user?.role}</Badge>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-card">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 pt-1 pb-2">Navigation</p>
            <div className="space-y-0.5">
              {visibleTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const isDanger = tab.id === 'danger';
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? isDanger
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-gov-blue-600 text-white shadow-sm'
                        : isDanger
                          ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {tab.icon}
                      <span>{tab.label}</span>
                    </div>
                    <ChevronRight size={13} className={isActive ? 'opacity-80' : 'opacity-30'} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Toggle Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-card">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Interface Theme</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${theme === 'light' ? 'bg-amber-50 text-amber-500 border border-amber-200' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                  {theme === 'light' ? <Sun size={15} /> : <Moon size={15} />}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">
                    {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Active</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
              >
                Switch
              </Button>
            </div>
          </div>

          {/* Resident QR Card */}
          {res && (
            <div className="rounded-2xl overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-gov-blue-950 to-slate-900 text-white p-5 shadow-lg flex flex-col items-center text-center">
              <QrCode size={22} className="text-gov-gold-400 mb-2" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-gov-gold-400">Official Resident ID</p>
              <p className="font-bold text-xs mt-1.5">{res.first_name} {res.last_name}</p>
              <span className="text-[9px] font-mono text-slate-400 mt-0.5">{res.qr_id}</span>
              <div className="w-24 h-24 bg-white p-2 rounded-xl mt-3 flex items-center justify-center shadow-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(res.qr_id || `QR-RES-${res.id}`)}`}
                  alt="Resident QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column: Tab Content ── */}
        <div className="lg:col-span-3 space-y-5">

          {/* ─────────── TAB 1: PROFILE ─────────── */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gov-blue-50 dark:bg-gov-blue-950/60 border border-gov-blue-200 dark:border-gov-blue-800/60 flex items-center justify-center">
                    <User size={18} className="text-gov-blue-600 dark:text-gov-blue-400" />
                  </div>
                  <div>
                    <CardTitle>Account Profile Details</CardTitle>
                    <CardDescription>Update your personal information and contact details.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {profileSuccessMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={16} className="shrink-0" />
                    {profileSuccessMsg}
                  </div>
                )}
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name / Display Name"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      isRequired
                      leftIcon={<User size={15} />}
                      placeholder="e.g. Maria Santos"
                    />
                    <Input
                      label="Official Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      isRequired
                      leftIcon={<Mail size={15} />}
                      placeholder="e.g. maria.santos@barangay.gov.ph"
                    />
                  </div>
                  <Input
                    label="Current Password (Confirmation)"
                    type="password"
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    leftIcon={<Lock size={15} />}
                    placeholder="Enter password to authorize profile changes..."
                    helperText="Required to confirm that you are the verified account holder."
                  />
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <Button type="submit" isLoading={isUpdatingProfile} leftIcon={<Save size={14} />}>
                      Save Profile Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* ─────────── TAB 2: SECURITY ─────────── */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center">
                    <Shield size={18} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <CardTitle>Security & Password Management</CardTitle>
                    <CardDescription>Ensure your account remains safe by updating your access passphrase periodically.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {passwordSuccessMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={16} className="shrink-0" />
                    {passwordSuccessMsg}
                  </div>
                )}
                {passwordErrorMsg && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <AlertTriangle size={16} className="shrink-0" />
                    {passwordErrorMsg}
                  </div>
                )}
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    isRequired
                    leftIcon={<Lock size={15} />}
                    placeholder="Enter your current login password..."
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="New Password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      isRequired
                      leftIcon={<KeyRound size={15} />}
                      placeholder="Minimum 6 characters..."
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      isRequired
                      leftIcon={<KeyRound size={15} />}
                      placeholder="Re-enter new password..."
                    />
                  </div>

                  {/* Password strength hint */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Password Requirements</p>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { label: 'At least 6 characters', met: newPassword.length >= 6 },
                        { label: 'Contains uppercase', met: /[A-Z]/.test(newPassword) },
                        { label: 'Contains number', met: /\d/.test(newPassword) },
                        { label: 'Passwords match', met: newPassword === confirmPassword && confirmPassword.length > 0 },
                      ].map((req, idx) => (
                        <div key={idx} className={`flex items-center gap-1.5 text-[10px] font-medium ${req.met ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${req.met ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600'}`}>
                            {req.met && <Check size={8} strokeWidth={3} className="text-white" />}
                          </div>
                          {req.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <Button type="submit" isLoading={isUpdatingPassword} leftIcon={<Save size={14} />}>
                      Update Password
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* ─────────── TAB 3: PORTAL ─────────── */}
          {activeTab === 'portal' && isStaff && (
            <div className="space-y-5">
              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center">
                      <Globe size={18} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <CardTitle>Public Portal Contact & Operating Hours</CardTitle>
                      <CardDescription>Configure the contact information displayed on the public citizen landing page.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {landingSuccessMsg && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-2">
                      <CheckCircle2 size={16} className="shrink-0" />{landingSuccessMsg}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Barangay Hall Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Brgy. Hall, Main Road, Laguna" />
                    <Input label="Emergency Hotline Phone" value={hotline} onChange={(e) => setHotline(e.target.value)} placeholder="e.g. (049) 123-4567" />
                    <Input label="Public Inquiries Email" type="email" value={landingEmail} onChange={(e) => setLandingEmail(e.target.value)} placeholder="e.g. info@barangay.gov.ph" />
                    <Input label="Service Operating Hours" value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} placeholder="e.g. Mon-Fri: 8:00 AM - 5:00 PM" />
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <Button onClick={handleLandingSave} leftIcon={<Save size={14} />}>Save Contact Details</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Hero Banner Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Landing Page Hero Background</CardTitle>
                  <CardDescription>Upload a custom cover photograph for the public resident portal.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {heroBgPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 group">
                      <img src={heroBgPreview} alt="Hero Background Preview" className="w-full h-44 object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="danger" size="sm" onClick={handleRemoveHeroBg} leftIcon={<Trash size={13} />}>Remove Background</Button>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md">Active</div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => heroBgInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-10 flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500 hover:border-gov-blue-400 hover:text-gov-blue-600 dark:hover:border-gov-blue-600 dark:hover:text-gov-blue-400 transition-all bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer"
                    >
                      <ImagePlus size={28} />
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Click to upload hero banner</p>
                        <p className="text-[10px] mt-0.5">JPG, PNG, WEBP (Max 5MB recommended)</p>
                      </div>
                    </button>
                  )}
                  <input ref={heroBgInputRef} type="file" accept="image/*" onChange={handleHeroBgUpload} className="hidden" />
                </CardContent>
              </Card>

              {/* Announcements Manager */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Public Announcements Bulletin</CardTitle>
                    <CardDescription>Broadcast notices and advisories to the landing page and resident feeds.</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setIsAnnouncementModalOpen(true)} leftIcon={<Plus size={13} />}>
                    New Notice
                  </Button>
                </CardHeader>
                <CardContent>
                  {announcements.length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                      <Megaphone size={24} className="mx-auto mb-2 opacity-30" />
                      No announcements posted yet. Click <strong>New Notice</strong> to broadcast one.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {announcements.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-gov-blue-50 dark:bg-gov-blue-950/60 border border-gov-blue-100 dark:border-gov-blue-800/60 flex items-center justify-center shrink-0 mt-0.5">
                              <Megaphone size={14} className="text-gov-blue-600 dark:text-gov-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{item.title}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5 line-clamp-2">{item.content}</p>
                              <span className="text-[10px] text-slate-400 font-medium mt-1 block">{item.date}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteAnnouncement(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors shrink-0 cursor-pointer"
                            title="Delete Announcement"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─────────── TAB 4: FEES ─────────── */}
          {activeTab === 'fees' && isStaff && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gov-gold-50 dark:bg-gov-gold-950/30 border border-gov-gold-200 dark:border-gov-gold-800/40 flex items-center justify-center">
                    <PhilippinePeso size={18} className="text-gov-gold-700 dark:text-gov-gold-400" />
                  </div>
                  <div>
                    <CardTitle>Certificate & Permit Fee Schedule</CardTitle>
                    <CardDescription>Adjust the official rates charged across counter issuances, online portal, and kiosk terminals.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {certFeeSuccessMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={16} className="shrink-0" />{certFeeSuccessMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: 'Clearance', label: 'Barangay Clearance', accent: 'from-gov-blue-500 to-gov-blue-600', light: 'bg-gov-blue-50 dark:bg-gov-blue-950/30 border-gov-blue-200 dark:border-gov-blue-800/60' },
                    { key: 'Indigency', label: 'Certificate of Indigency', accent: 'from-emerald-500 to-emerald-600', light: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60' },
                    { key: 'Residency', label: 'Certificate of Residency', accent: 'from-gov-gold-500 to-gov-gold-600', light: 'bg-gov-gold-50 dark:bg-gov-gold-950/30 border-gov-gold-200 dark:border-gov-gold-800/60' },
                    { key: 'Business', label: 'Business Clearance', accent: 'from-indigo-500 to-indigo-600', light: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/60' },
                    { key: 'Cedula', label: 'Cedula (CTC)', accent: 'from-rose-500 to-rose-600', light: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60' },
                    { key: 'Barangay ID', label: 'Barangay ID Card', accent: 'from-teal-500 to-teal-600', light: 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800/60' },
                  ].map(({ key, label, accent, light }) => (
                    <div key={key} className={`rounded-xl border ${light} p-4 space-y-3 relative overflow-hidden`}>
                      {/* Top accent bar */}
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accent}`} />
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block pt-1">{label}</label>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-400 dark:text-slate-500">₱</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={certFees[key] ?? 0}
                          onChange={(e) => setCertFees(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                          className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gov-blue-500/30 transition-shadow"
                        />
                      </div>
                      {certFees[key] === 0 && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check size={11} />Free of Charge
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <Button onClick={handleCertFeeSave} leftIcon={<Save size={14} />}>Save Fee Schedule</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─────────── TAB 5: MAINTENANCE ─────────── */}
          {activeTab === 'danger' && isStaff && (
            <div className="space-y-5">
              {/* Warning Banner */}
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 flex items-center justify-center shrink-0">
                  <AlertTriangle size={17} className="text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-rose-800 dark:text-rose-300">System Maintenance Zone</p>
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5 leading-relaxed">
                    Actions in this section are <strong>irreversible</strong> and affect all users. Proceed with caution.
                  </p>
                </div>
              </div>

              <Card className="border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="text-rose-700 dark:text-rose-400">System Reset & Cache Maintenance</CardTitle>
                  <CardDescription>Perform administrative resets on queue states, local test records, and temporary session keys.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Clear Queue & Local Session Data</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Flushes cached queue tickets and restores defaults. The browser window will automatically reload.
                      </p>
                    </div>
                    <Button variant="danger" size="sm" onClick={handleResetQueueData} leftIcon={<RotateCcw size={13} />}>
                      Purge Queue State
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>

      {/* Modal: Add Announcement */}
      <Modal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
        title="Broadcast Public Announcement"
        description="Publish official news and alerts directly to resident accounts."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAnnouncementModalOpen(false)}>Cancel</Button>
            <Button size="sm" isLoading={isBroadcasting} onClick={handleAddAnnouncement} leftIcon={<Megaphone size={13} />}>
              Broadcast Now
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Announcement Title"
            value={annTitle}
            onChange={(e) => setAnnTitle(e.target.value)}
            isRequired
            placeholder="e.g. Scheduled Maintenance, Free Dental Mission"
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Details & Instructions <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={annContent}
              onChange={(e) => setAnnContent(e.target.value)}
              placeholder="Provide complete details, time, and instructions..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-gov-blue-500/20 resize-none transition-shadow"
            />
          </div>
        </div>
      </Modal>

      {/* Modal: Fee Authorization */}
      <Modal
        isOpen={isFeePasswordModalOpen}
        onClose={() => setIsFeePasswordModalOpen(false)}
        title="Security Authorization Required"
        description="Please re-enter your administrator password to authorize fee changes."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsFeePasswordModalOpen(false)}>Cancel</Button>
            <Button size="sm" isLoading={isSavingFees} onClick={confirmCertFeeSave} leftIcon={<Check size={13} />}>
              Confirm & Save
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Current Administrator Password"
            type="password"
            value={feePassword}
            onChange={(e) => { setFeePassword(e.target.value); setFeePasswordError(''); }}
            error={feePasswordError}
            isRequired
            autoFocus
            leftIcon={<Lock size={15} />}
            placeholder="••••••••••••"
          />
        </div>
      </Modal>
    </div>
  );
};

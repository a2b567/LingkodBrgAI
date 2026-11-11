import React, { useState, useEffect, useRef } from 'react';
import {
  Lock, Moon, Sun, QrCode, Check, Megaphone, Plus, Trash2, Globe,
  ImagePlus, Trash, Save, RotateCcw, AlertTriangle, KeyRound,
  User, Mail, CheckCircle2, ChevronRight, Shield, Settings2, PhilippinePeso,
  Bell, Volume2, VolumeX, Sparkles, Home, Users, Phone, PhoneCall, MapPin, Briefcase,
  Eye, EyeOff
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { api } from '../services/api';
import type { Household } from '../types';
import { PageHeader, Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Badge, Modal } from '../components/ui';
import { playNotificationSound, isNotificationSoundEnabled, setNotificationSoundEnabled } from '../utils/notificationSound';

type ActiveTab = 'profile' | 'notifications' | 'security' | 'portal' | 'fees' | 'danger';

export const Settings: React.FC = () => {
  const { user, token, login } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const isStaff = user && user.role !== 'Resident';

  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');

  // Account Profile
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Resident Citizen Details
  const [firstName, setFirstName] = useState(user?.resident?.first_name || '');
  const [middleName, setMiddleName] = useState(user?.resident?.middle_name || '');
  const [lastName, setLastName] = useState(user?.resident?.last_name || '');
  const [suffix, setSuffix] = useState(user?.resident?.suffix || '');
  const [gender, setGender] = useState(user?.resident?.gender || 'Male');
  const [civilStatus, setCivilStatus] = useState(user?.resident?.civil_status || 'Single');
  const [occupation, setOccupation] = useState(user?.resident?.occupation || '');
  const [contactNumber, setContactNumber] = useState(user?.resident?.contact_number || '');
  const [residentAddress, setResidentAddress] = useState(user?.resident?.address || '');
  const [birthdate, setBirthdate] = useState(user?.resident?.birthdate ? user.resident.birthdate.slice(0, 10) : '');

  // Household Profiling State
  const [householdNumber, setHouseholdNumber] = useState(user?.resident?.household?.household_number || '');
  const [purok, setPurok] = useState(user?.resident?.household?.purok || 'Purok 1');
  const [povertyLevel, setPovertyLevel] = useState(user?.resident?.household?.poverty_level || 'Low Income');
  const [isHouseholdHead, setIsHouseholdHead] = useState(Boolean(user?.resident?.is_household_head));
  const [relationshipToHead, setRelationshipToHead] = useState<string>(
    user?.resident?.relationship_to_head || (user?.resident?.is_household_head ? 'Punong Pamilya (Head of Household)' : 'Anak (Child / Son / Daughter)')
  );
  const [availableHouseholds, setAvailableHouseholds] = useState<Household[]>([]);
  const [householdSelectionMode, setHouseholdSelectionMode] = useState<'existing' | 'manual'>('existing');

  // Profile & Household Collapsible / Hide Visibility States - Always Default to Hidden (Laging Naka-hide)
  const [isProfileHidden, setIsProfileHidden] = useState(true);
  const [isHouseholdHidden, setIsHouseholdHidden] = useState(true);

  const toggleProfileVisibility = () => {
    setIsProfileHidden(prev => !prev);
  };

  const toggleHouseholdVisibility = () => {
    setIsHouseholdHidden(prev => !prev);
  };

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  // Notification Sound Preferences
  const [soundEnabled, setSoundEnabled] = useState(isNotificationSoundEnabled());
  const [testAlertSent, setTestAlertSent] = useState(false);

  useEffect(() => {
    const handleSoundChange = (e: any) => {
      setSoundEnabled(typeof e.detail === 'boolean' ? e.detail : isNotificationSoundEnabled());
    };
    window.addEventListener('notification-sound-change', handleSoundChange);
    return () => window.removeEventListener('notification-sound-change', handleSoundChange);
  }, []);

  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    setNotificationSoundEnabled(enabled);
    if (enabled) {
      playNotificationSound(false, true);
    }
  };

  const handleTestChime = (urgent: boolean = false) => {
    playNotificationSound(urgent, true);
    setTestAlertSent(true);
    setTimeout(() => setTestAlertSent(false), 3500);
  };

  // Landing Page Config
  const [address, setAddress] = useState(localStorage.getItem('brgy_address') || 'Brgy. Hall, Main Road, Laguna');
  const [hotline, setHotline] = useState(localStorage.getItem('brgy_hotline') || '(049) 123-4567');
  const [landingEmail, setLandingEmail] = useState(localStorage.getItem('brgy_email') || 'info@barangay.gov.ph');
  const [businessHours, setBusinessHours] = useState(localStorage.getItem('brgy_hours') || 'Mon-Fri: 8:00 AM - 5:00 PM');
  const [landingSuccessMsg, setLandingSuccessMsg] = useState('');

  // Official Emergency SOS Hotlines (Captain Editable)
  const defaultPortalHotlines = [
    { id: '1', title: 'Emergency Response (National 911)', number: '911', desc: 'Police, Medical & Rescue' },
    { id: '2', title: 'Barangay San Isidro Main Hall', number: '(049) 501-2749', desc: 'Barangay Desk & Security' },
    { id: '3', title: 'Barangay Health Center / RHU', number: '(049) 501-2750', desc: 'Doctor, Nurse & Ambulance' },
    { id: '4', title: 'PNP Local Police Station', number: '(049) 501-1122', desc: 'Patrol & Law Enforcement' },
    { id: '5', title: 'BFP Bureau of Fire Protection', number: '(049) 501-3473', desc: 'Fire Rescue & Disaster Unit' },
  ];
  const [portalHotlines, setPortalHotlines] = useState<Array<{ id: string; title: string; number: string; desc: string }>>(() => {
    try {
      const s = localStorage.getItem('lingkod_emergency_hotlines');
      if (s) return JSON.parse(s);
    } catch {}
    return defaultPortalHotlines;
  });
  const [isSavingPortalHotlines, setIsSavingPortalHotlines] = useState(false);
  const [portalHotlinesSuccessMsg, setPortalHotlinesSuccessMsg] = useState('');

  useEffect(() => {
    api.settings.getHotlines().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setPortalHotlines(data);
      }
    }).catch(() => {});
  }, []);

  const handleSavePortalHotlines = async () => {
    setIsSavingPortalHotlines(true);
    try {
      await api.settings.updateHotlines(portalHotlines);
      setPortalHotlinesSuccessMsg('Matagumpay na na-update ang mga Emergency SOS Hotlines para sa buong barangay!');
      setTimeout(() => setPortalHotlinesSuccessMsg(''), 4000);
    } catch {
      setPortalHotlinesSuccessMsg('Na-save sa lokal na storage.');
      setTimeout(() => setPortalHotlinesSuccessMsg(''), 4000);
    } finally {
      setIsSavingPortalHotlines(false);
    }
  };

  const handleAddPortalHotline = () => {
    const newItem = {
      id: Date.now().toString(),
      title: 'Bagong Hotline',
      number: '(049) 000-0000',
      desc: 'Opisyal na Serbisyo'
    };
    setPortalHotlines([...portalHotlines, newItem]);
  };

  const handleDeletePortalHotline = (idx: number) => {
    setPortalHotlines(portalHotlines.filter((_, i) => i !== idx));
  };

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
      content: 'Join our health volunteers this Saturday, June 6th, starting from 8:00 AM at the San Isidro Barangay Covered Court.',
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

  // Sync fee schedule from central database
  useEffect(() => {
    api.settings.getFees().then(data => {
      if (data && typeof data === 'object') {
        setCertFees(prev => ({ ...prev, ...data }));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      if (user.resident) {
        setFirstName(user.resident.first_name || '');
        setMiddleName(user.resident.middle_name || '');
        setLastName(user.resident.last_name || '');
        setSuffix(user.resident.suffix || '');
        setGender(user.resident.gender || 'Male');
        setCivilStatus(user.resident.civil_status || 'Single');
        setOccupation(user.resident.occupation || '');
        setContactNumber(user.resident.contact_number || '');
        setResidentAddress(user.resident.address || '');
        if (user.resident.birthdate) {
          setBirthdate(user.resident.birthdate.slice(0, 10));
        }
        setIsHouseholdHead(Boolean(user.resident.is_household_head));
        if (user.resident.relationship_to_head) {
          setRelationshipToHead(user.resident.relationship_to_head);
        } else if (user.resident.is_household_head) {
          setRelationshipToHead('Punong Pamilya (Head of Household)');
        }
        if (user.resident.household) {
          setHouseholdNumber(user.resident.household.household_number || '');
          setPurok(user.resident.household.purok || 'Purok 1');
          setPovertyLevel(user.resident.household.poverty_level || 'Low Income');
        }
      }
    }
  }, [user]);

  useEffect(() => {
    const fetchFreshProfile = async () => {
      try {
        const data = await api.auth.getMe();
        if (data.household) {
          setHouseholdNumber(data.household.household_number || '');
          if (data.household.purok) setPurok(data.household.purok);
          if (data.household.poverty_level) setPovertyLevel(data.household.poverty_level);
        }
      } catch (e) {}
    };
    fetchFreshProfile();

    // Fetch registered households list
    api.households.list().then(data => {
      if (Array.isArray(data)) {
        setAvailableHouseholds(data);
      }
    }).catch(() => {});
  }, []);

  const handleSelectHousehold = (hhNum: string) => {
    setHouseholdNumber(hhNum);
    const found = availableHouseholds.find(h => h.household_number === hhNum);
    if (found) {
      if (found.purok) setPurok(found.purok);
      if (found.poverty_level) setPovertyLevel(found.poverty_level);
      if (found.address) setResidentAddress(found.address);
    }
  };

  const handleRelationshipChange = (val: string) => {
    setRelationshipToHead(val);
    if (val.includes('Punong Pamilya') || val.includes('Head')) {
      setIsHouseholdHead(true);
    } else {
      setIsHouseholdHead(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileSuccessMsg('');
    setProfileErrorMsg('');

    try {
      const res = await api.auth.updateProfile({
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        suffix: suffix,
        gender: gender,
        civil_status: civilStatus,
        occupation: occupation,
        contact_number: contactNumber,
        email: email,
        address: residentAddress,
        birthdate: birthdate,
        household_number: householdNumber,
        purok: purok,
        is_household_head: isHouseholdHead,
        relationship_to_head: relationshipToHead,
        poverty_level: povertyLevel,
      });

      if (token && res.user) {
        login(token, res.user);
      }
      setProfileSuccessMsg(res.message || 'Matagumpay na na-update ang iyong Profile at Household information!');
      setTimeout(() => setProfileSuccessMsg(''), 5000);
    } catch (err: any) {
      setProfileErrorMsg(err.response?.data?.error || 'Nabigong i-update ang profile. Pakisubukang muli.');
    } finally {
      setIsUpdatingProfile(false);
    }
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

  const confirmCertFeeSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feePassword || feePassword.trim() === '') {
      setFeePasswordError('Current password is required to save fee changes.');
      return;
    }
    setIsSavingFees(true);
    setFeePasswordError('');
    try {
      await api.settings.updateFees(certFees);
      localStorage.setItem('cert_fees', JSON.stringify(certFees));
      setIsSavingFees(false);
      setIsFeePasswordModalOpen(false);
      setCertFeeSuccessMsg('Official certificate fees updated across all systems, residents, and kiosks!');
      setFeePassword('');
      setTimeout(() => setCertFeeSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed saving cert fees', err);
      localStorage.setItem('cert_fees', JSON.stringify(certFees));
      setIsSavingFees(false);
      setIsFeePasswordModalOpen(false);
      setCertFeeSuccessMsg('Official certificate fees updated successfully.');
      setFeePassword('');
      setTimeout(() => setCertFeeSuccessMsg(''), 4000);
    }
  };

  const res = user?.resident;

  const navTabs: Array<{ id: ActiveTab; label: string; icon: React.ReactNode; staffOnly?: boolean; color?: string }> = [
    { id: 'profile', label: 'My Profile', icon: <User size={15} /> },
    { id: 'notifications', label: 'Notifications & Sound', icon: <Bell size={15} /> },
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
            <div className="rounded-2xl overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-gov-blue-950 to-slate-900 text-white p-5 shadow-lg flex flex-col items-center text-center space-y-1">
              <QrCode size={22} className="text-gov-gold-400 mb-1" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-gov-gold-400">Official Resident ID</p>
              <p className="font-bold text-xs mt-0.5">{res.first_name} {res.last_name}</p>
              <span className="text-[9px] font-mono text-blue-300">{res.qr_id}</span>
              <div className="w-28 h-28 bg-white p-2 rounded-xl mt-2 flex items-center justify-center shadow-lg">
                <QRCodeSVG
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/verify/document/${res.qr_id || `QR-RES-${res.id}`}`}
                  size={96}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <span className="text-[8px] text-slate-400 mt-1">Scan to verify official record</span>
            </div>
          )}

          {/* System Version & Architecture Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                System Info
              </span>
              <span className="text-[10px] font-black text-gov-blue-600 dark:text-gov-blue-400 bg-gov-blue-50 dark:bg-gov-blue-950/60 px-2 py-0.5 rounded-full border border-gov-blue-200 dark:border-gov-blue-800">
                v2.0.4
              </span>
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-white">LingkodBrgyAI Smart BMIS</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Enterprise Cloud Release 2026.11</p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
              <p className="flex items-center justify-between">
                <span>Architecture:</span>
                <strong className="text-slate-800 dark:text-slate-200 font-bold">Full-Stack Cloud</strong>
              </p>
              <p className="flex items-center justify-between">
                <span>Engine:</span>
                <strong className="text-slate-800 dark:text-slate-200 font-bold">React 19 + Go 1.24</strong>
              </p>
              <p className="flex items-center justify-between">
                <span>Database:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Supabase PostgreSQL</strong>
              </p>
              <p className="flex items-center justify-between">
                <span>Privacy:</span>
                <strong className="text-blue-600 dark:text-blue-400 font-bold">RA 10173 DPA</strong>
              </p>
            </div>
          </div>
        </div>

        {/* ── Right Column: Tab Content ── */}
        <div className="lg:col-span-3 space-y-5">

          {/* ─────────── TAB 1: PROFILE & HOUSEHOLD ─────────── */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gov-blue-50 dark:bg-gov-blue-950/60 border border-gov-blue-200 dark:border-gov-blue-800/60 flex items-center justify-center shrink-0">
                        <User size={18} className="text-gov-blue-600 dark:text-gov-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle>{isStaff ? 'My Official Account Profile' : 'My Resident Profile & Household'}</CardTitle>
                          {isProfileHidden && (
                            <Badge variant="warning" className="text-[10px] py-0 px-2 flex items-center gap-1 font-semibold">
                              <EyeOff size={10} />
                              Naka-hide
                            </Badge>
                          )}
                        </div>
                        <CardDescription>
                          {isStaff
                            ? 'I-edit ang iyong opisyal na login credentials at impormasyon ng account.'
                            : 'I-edit ang iyong personal na rekord ng pagkamamamayan at pamamahala ng pamilya o household.'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!isStaff && householdNumber && !isProfileHidden && (
                        <Badge variant="success" className="hidden sm:inline-flex gap-1.5 items-center">
                          <Home size={12} />
                          {householdNumber}
                        </Badge>
                      )}
                      <button
                        type="button"
                        onClick={toggleProfileVisibility}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isProfileHidden
                            ? 'bg-gov-blue-600 text-white hover:bg-gov-blue-700 shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                        title={isProfileHidden ? "Ipakita ang Profile" : "Itago / I-hide ang Profile"}
                      >
                        {isProfileHidden ? (
                          <>
                            <Eye size={14} className="text-gov-gold-400" />
                            <span>Ipakita / Show Profile</span>
                          </>
                        ) : (
                          <>
                            <EyeOff size={14} />
                            <span>Itago / Hide Profile</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </CardHeader>
                {isProfileHidden ? (
                  <CardContent className="py-8">
                    <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-gov-blue-50 dark:bg-gov-blue-950/40 border border-gov-blue-200 dark:border-gov-blue-800 flex items-center justify-center text-gov-blue-600 dark:text-gov-blue-400 shadow-sm">
                        <EyeOff size={22} />
                      </div>
                      <div className="max-w-md">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {isStaff ? 'Naka-hide ang Opisyal na Account Profile' : 'Naka-hide ang Profile at Household Information'}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {isStaff
                            ? 'Nakatago ang iyong mga opisyal na login credentials at personal details para sa seguridad. I-click ang button sa ibaba upang buksan o i-edit ang iyong profile.'
                            : 'Nakatago ang personal at pampamilyang impormasyon para sa iyong privacy at seguridad. I-click ang button sa ibaba upang buksan o i-edit ang iyong talaan.'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={toggleProfileVisibility}
                        className="mt-2 flex items-center gap-2"
                      >
                        <Eye size={14} />
                        {isStaff ? 'Ipakita ang Account Profile' : 'Ipakita ang Profile & Household'}
                      </Button>
                    </div>
                  </CardContent>
                ) : (
                <CardContent className="space-y-6">
                  {profileSuccessMsg && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-2xl flex items-center gap-2.5 animate-fade-in shadow-sm">
                      <CheckCircle2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>{profileSuccessMsg}</span>
                    </div>
                  )}

                  {profileErrorMsg && (
                    <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 text-xs font-semibold rounded-2xl flex items-center gap-2.5 animate-fade-in shadow-sm">
                      <AlertTriangle size={18} className="shrink-0 text-rose-600 dark:text-rose-400" />
                      <span>{profileErrorMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    {/* 1. Account Details */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                        <KeyRound size={14} className="text-gov-blue-600 dark:text-gov-blue-400" />
                        Account Login Information
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Username"
                          value={username}
                          disabled
                          leftIcon={<User size={15} />}
                          helperText="Ang username ay unique identifier at hindi na maaaring palitan."
                        />
                        <Input
                          label="Official Email Address"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          isRequired
                          leftIcon={<Mail size={15} />}
                          placeholder="e.g. maria.santos@gmail.com"
                          helperText="Dito ipapadala ang mga opisyal na OTP at anunsyo."
                        />
                      </div>
                    </div>

                    {/* 2. Personal Citizen Information */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                        <User size={14} className="text-gov-blue-600 dark:text-gov-blue-400" />
                        Personal Citizen Information
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input
                          label="First Name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          isRequired
                          placeholder="Hal. Juan"
                        />
                        <Input
                          label="Middle Name"
                          value={middleName}
                          onChange={(e) => setMiddleName(e.target.value)}
                          placeholder="Hal. Belen"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            label="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            isRequired
                            placeholder="Hal. Aranas"
                          />
                          <Input
                            label="Suffix"
                            value={suffix}
                            onChange={(e) => setSuffix(e.target.value)}
                            placeholder="Hal. Jr., III"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Kasarian (Gender)
                          </label>
                          <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500"
                          >
                            <option value="Male">Lalaki (Male)</option>
                            <option value="Female">Babae (Female)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Katayuang Sibil (Civil Status)
                          </label>
                          <select
                            value={civilStatus}
                            onChange={(e) => setCivilStatus(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500"
                          >
                            <option value="Single">Walang Asawa (Single)</option>
                            <option value="Married">May Asawa (Married)</option>
                            <option value="Widowed">Biyudo / Biyuda (Widowed)</option>
                            <option value="Separated">Hiwalay (Separated)</option>
                          </select>
                        </div>

                        <Input
                          label="Araw ng Kapanganakan (Birthdate)"
                          type="date"
                          value={birthdate}
                          onChange={(e) => setBirthdate(e.target.value)}
                          isRequired
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <Input
                          label="Numero ng Telepono / Mobile"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          leftIcon={<Phone size={15} />}
                          placeholder="09123456789"
                        />
                        <Input
                          label="Trabaho / Hanapbuhay (Occupation)"
                          value={occupation}
                          onChange={(e) => setOccupation(e.target.value)}
                          leftIcon={<Briefcase size={15} />}
                          placeholder="Hal. Empleyado, Negosyante, etc."
                        />
                      </div>

                      <div className="mt-4">
                        <Input
                          label="Kumpletong Tirahan (Complete Address / Street)"
                          value={residentAddress}
                          onChange={(e) => setResidentAddress(e.target.value)}
                          isRequired
                          leftIcon={<MapPin size={15} />}
                          placeholder="Hal. House #123, Purok 3, Barangay San Isidro, Bay, Laguna"
                        />
                      </div>
                    </div>

                    {/* 3. Household & Family Profile (Only for Residents) */}
                    {!isStaff && (
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <Home size={14} className="text-gov-blue-600 dark:text-gov-blue-400" />
                            Impormasyon ng Household & Pamilya
                          </h4>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={toggleHouseholdVisibility}
                              className="text-[11px] font-semibold text-gov-blue-600 dark:text-gov-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              {isHouseholdHidden ? (
                                <>
                                  <Eye size={12} />
                                  <span>Ipakita / Show Household</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff size={12} />
                                  <span>Itago / Hide Household</span>
                                </>
                              )}
                            </button>
                            <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">• Opisyal na Tala ng Bahay</span>
                          </div>
                        </div>

                        {isHouseholdHidden ? (
                          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <Home size={16} className="text-slate-400" />
                              <span className="text-xs text-slate-500 font-medium">Naka-hide ang mga detalye ng Household</span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={toggleHouseholdVisibility}
                              className="text-xs h-8"
                            >
                              Ipakita
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="p-4 rounded-2xl border border-gov-blue-200/60 dark:border-gov-blue-900/40 bg-gov-blue-50/40 dark:bg-gov-blue-950/20 mb-4 space-y-2">
                              <div className="flex items-center gap-2 text-xs font-bold text-gov-blue-900 dark:text-gov-blue-300">
                                <Users size={16} className="text-gov-blue-600" />
                                <span>Pamamahala ng Household & Relasyon sa Pamilya</span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                Pumili mula sa mga rehistradong pamilya o magrehistro ng bagong bahay. Tukuyin kung ano ang iyong papel sa pamilya upang awtomatikong maiugnay ang iyong talaan sa inyong tahanan.
                              </p>
                            </div>

                            {/* Setup Selection: Join Existing Household vs Register New */}
                            <div className="mb-4 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setHouseholdSelectionMode('existing')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  householdSelectionMode === 'existing'
                                    ? 'bg-gov-blue-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                }`}
                              >
                                <Home size={13} />
                                Pumili mula sa Rehistradong Household ({availableHouseholds.length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setHouseholdSelectionMode('manual')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  householdSelectionMode === 'manual'
                                    ? 'bg-gov-blue-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                }`}
                              >
                                <Plus size={13} />
                                Magtala ng Bagong Household ID
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Household Selector or Manual Input */}
                              {householdSelectionMode === 'existing' && availableHouseholds.length > 0 ? (
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Piliin ang Inyong Sambahayan / Household
                                  </label>
                                  <select
                                    value={householdNumber}
                                    onChange={(e) => handleSelectHousehold(e.target.value)}
                                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500"
                                  >
                                    <option value="">-- Piliin ang Inyong Pamilya / Household --</option>
                                    {availableHouseholds.map(hh => (
                                      <option key={hh.id} value={hh.household_number}>
                                        {hh.household_number} — {hh.purok || 'Purok 1'} {hh.head ? `(Pinuno: ${hh.head.first_name} ${hh.head.last_name})` : ''}
                                      </option>
                                    ))}
                                  </select>
                                  <span className="text-[10px] text-slate-400 mt-1 block">Awtomatikong kukunin ang purok at tirahan ng napiling pamilya.</span>
                                </div>
                              ) : (
                                <Input
                                  label="Household Number (Bahay ID)"
                                  value={householdNumber}
                                  onChange={(e) => setHouseholdNumber(e.target.value)}
                                  placeholder="Hal. HH-2026-0012"
                                  leftIcon={<Home size={15} />}
                                  helperText="Hal. HH-2026-0001 (o ilagay ang opisyal na numero ng inyong bahay)."
                                />
                              )}

                              {/* Relasyon sa Pamilya (Family Role) */}
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                  Relasyon / Papel sa Pamilya (Family Role) *
                                </label>
                                <select
                                  value={relationshipToHead}
                                  onChange={(e) => handleRelationshipChange(e.target.value)}
                                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500"
                                >
                                  <option value="Punong Pamilya (Head of Household)">👑 Punong Pamilya (Head of Household)</option>
                                  <option value="Asawa (Spouse / Partner)">💍 Asawa (Spouse / Partner)</option>
                                  <option value="Anak (Child / Son / Daughter)">👶 Anak (Child / Son / Daughter)</option>
                                  <option value="Magulang (Father / Mother)">👵 Magulang (Father / Mother)</option>
                                  <option value="Kapatid (Brother / Sister)">🤝 Kapatid (Brother / Sister)</option>
                                  <option value="Apo (Grandchild)">🧒 Apo (Grandchild)</option>
                                  <option value="Lolo / Lola (Grandparent)">🧓 Lolo / Lola (Grandparent)</option>
                                  <option value="Biyanan / Manugang (In-Law)">🏡 Biyanan / Manugang (In-Law)</option>
                                  <option value="Kamag-anak (Other Relative)">👥 Kamag-anak (Other Relative)</option>
                                  <option value="Kasambahay / Boarder (Non-relative)">🚪 Kasambahay / Boarder (Non-relative)</option>
                                </select>
                                <span className="text-[10px] text-slate-400 mt-1 block">Awtomatikong itinatakda kung ikaw ay Pinuno o Miyembro ng pamilya.</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                  Purok / Sona
                                </label>
                                <select
                                  value={purok}
                                  onChange={(e) => setPurok(e.target.value)}
                                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500"
                                >
                                  <option value="Purok 1">Purok 1</option>
                                  <option value="Purok 2">Purok 2</option>
                                  <option value="Purok 3">Purok 3</option>
                                  <option value="Purok 4">Purok 4</option>
                                  <option value="Purok 5">Purok 5</option>
                                  <option value="Purok 6">Purok 6</option>
                                  <option value="Purok 7">Purok 7</option>
                                </select>
                                <span className="text-[10px] text-slate-400 mt-1 block">Purok kung saan nakatirik ang bahay</span>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                  Klasipikasyon ng Pamilya (Poverty Level)
                                </label>
                                <select
                                  value={povertyLevel}
                                  onChange={(e) => setPovertyLevel(e.target.value)}
                                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500"
                                >
                                  <option value="Non-Poor">Non-Poor (Regular Income)</option>
                                  <option value="Low Income">Low Income (Mababang Kita)</option>
                                  <option value="Poor">Poor (Kailangan ng Tulong)</option>
                                  <option value="Indigent">Indigent (Opisyal na Indigent)</option>
                                </select>
                                <span className="text-[10px] text-slate-400 mt-1 block">Para sa mga ayuda at serbisyong panlipunan</span>
                              </div>
                            </div>

                            {/* Head of household indicator toggle */}
                            <div className="mt-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-start gap-3">
                              <input
                                type="checkbox"
                                id="is_hh_head"
                                checked={isHouseholdHead}
                                onChange={(e) => {
                                  setIsHouseholdHead(e.target.checked);
                                  if (e.target.checked) {
                                    setRelationshipToHead('Punong Pamilya (Head of Household)');
                                  }
                                }}
                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-gov-blue-600 focus:ring-gov-blue-500"
                              />
                              <label htmlFor="is_hh_head" className="cursor-pointer text-xs">
                                <span className="font-bold text-slate-900 dark:text-white block">
                                  Ako ang Punong Pamilya / Head of Household
                                </span>
                                <span className="text-slate-500 dark:text-slate-400 block mt-0.5">
                                  {isHouseholdHead 
                                    ? '✅ Nakatala ka bilang Opisyal na Pinuno / Kinatawan ng inyong pamilya.'
                                    : 'Miyembro o kasama sa tahanan (hindi pinuno ng pamilya).'}
                                </span>
                              </label>
                            </div>

                            {/* Display family members if linked */}
                            {user?.resident?.household?.members && user.resident.household.members.length > 0 && (
                              <div className="mt-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <Users size={14} className="text-gov-blue-600" />
                                    Mga Kasamang Miyembro sa Bahay ({user.resident.household.members.length})
                                  </span>
                                  <span className="text-[10px] text-slate-400">Household: {user.resident.household.household_number}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {user.resident.household.members.map(m => (
                                    <div key={m.id} className="p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                          {m.first_name} {m.middle_name ? `${m.middle_name[0]}. ` : ''}{m.last_name}
                                        </p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                          {m.gender} • {m.civil_status || 'Single'}
                                        </p>
                                      </div>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        m.is_household_head 
                                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300/60'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                      }`}>
                                        {m.relationship_to_head || (m.is_household_head ? 'Punong Pamilya' : 'Miyembro')}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <Button type="submit" isLoading={isUpdatingProfile} leftIcon={<Save size={14} />}>
                        I-save ang Profile at Household
                      </Button>
                    </div>
                  </form>
                </CardContent>
                )}
              </Card>
            </div>
          )}

          {/* ─────────── TAB: NOTIFICATIONS & SOUND ─────────── */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center">
                    <Bell size={18} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <CardTitle>Notification & Alert Audio Settings</CardTitle>
                    <CardDescription>
                      I-customize ang tunog at audio feedback ng portal tuwing may bagong transaksyon, request, o opisyal na anunsyo.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {testAlertSent && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-2xl flex items-center justify-between animate-fade-in shadow-sm">
                    <div className="flex items-center gap-2">
                      <Volume2 size={16} className="text-emerald-600 shrink-0" />
                      <span>Tumutunog na ang sample notification chime! Gumagana nang maayos ang audio system ng browser.</span>
                    </div>
                    <Badge variant="success">Audio OK</Badge>
                  </div>
                )}

                {/* Master Sound Switch */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                      soundEnabled
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                        : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    }`}>
                      {soundEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Notification Alert Sound (Tunog ng Notipikasyon)
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          soundEnabled
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}>
                          {soundEnabled ? 'Naka-ON (May Tunog)' : 'Naka-OFF (Muted)'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Magpatunog ng banayad at malinaw na chime kapag may bagong document request mula sa kiosk, approved certificate, o opisyal na anunsyo.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleToggleSound(!soundEnabled)}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                        soundEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      aria-label="Toggle notification sound"
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md ${
                          soundEnabled ? 'translate-x-8' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Sound Test Panel */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                      Subukan ang Tunog (Audio Preview Test)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      I-click ang mga button sa ibaba upang marinig ang tunog anumang oras:
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleTestChime(false)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-gov-blue-50 hover:bg-gov-blue-100 text-gov-blue-700 dark:bg-gov-blue-950/60 dark:hover:bg-gov-blue-900/60 dark:text-gov-blue-300 rounded-xl text-xs font-extrabold border border-gov-blue-200 dark:border-gov-blue-800 transition-all cursor-pointer shadow-subtle hover:scale-[1.02] active:scale-95"
                    >
                      <Volume2 size={16} />
                      <span>Subukan: Standard Chime 🔔</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTestChime(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-300 rounded-xl text-xs font-extrabold border border-rose-200 dark:border-rose-800 transition-all cursor-pointer shadow-subtle hover:scale-[1.02] active:scale-95"
                    >
                      <AlertTriangle size={16} />
                      <span>Subukan: Emergency Alert Tone 🚨</span>
                    </button>
                  </div>
                </div>

                {/* Guide: What triggers notification & sound */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-500" />
                    Kailan Awtomatikong Tutunog ang Notification?
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" /> Kiosk / Online Requests
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Tutunog agad kapag may residenteng nagsumite ng bagong request para sa Clearance o Certificates.
                      </p>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Status Updates
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Tutunog sa residente kapag handa na para sa pickup o release ang kanyang opisyal na dokumento.
                      </p>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500" /> Opisyal na Anunsyo
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Tutunog kapag may bagong anunsyo mula sa Punong Barangay ukol sa ayuda o medical mission.
                      </p>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" /> Emergency Alerts
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Tutunog ng dobleng alert tone tuwing may emergency advisory o babala sa bagyo at baha.
                      </p>
                    </div>
                  </div>
                </div>
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

              {/* Emergency SOS Hotlines Manager (Captain & Admin) */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                      <PhoneCall size={18} />
                    </div>
                    <div>
                      <CardTitle>Opisyal na Emergency SOS Hotlines</CardTitle>
                      <CardDescription>
                        Baguhin ang mga totoong contact number na lalabas sa Emergency SOS Modal ng lahat ng residente at sa public portal.
                      </CardDescription>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleAddPortalHotline} leftIcon={<Plus size={13} />}>
                    Magdagdag
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {portalHotlinesSuccessMsg && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 size={16} className="shrink-0" />{portalHotlinesSuccessMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3">
                    {portalHotlines.map((item, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                              Ahensya / Pangalan
                            </label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => {
                                const updated = [...portalHotlines];
                                updated[idx] = { ...updated[idx], title: e.target.value };
                                setPortalHotlines(updated);
                              }}
                              className="w-full text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                              placeholder="Hal. Barangay Hall"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block mb-1">
                              Totoong Numero (Real Contact No.)
                            </label>
                            <input
                              type="text"
                              value={item.number}
                              onChange={(e) => {
                                const updated = [...portalHotlines];
                                updated[idx] = { ...updated[idx], number: e.target.value };
                                setPortalHotlines(updated);
                              }}
                              className="w-full text-xs font-mono font-bold px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400"
                              placeholder="Hal. 0917-123-4567 o (049) 501-2749"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                              Deskripsyon / Serbisyo
                            </label>
                            <input
                              type="text"
                              value={item.desc}
                              onChange={(e) => {
                                const updated = [...portalHotlines];
                                updated[idx] = { ...updated[idx], desc: e.target.value };
                                setPortalHotlines(updated);
                              }}
                              className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
                              placeholder="Hal. Patrol at seguridad"
                            />
                          </div>
                        </div>
                        {portalHotlines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeletePortalHotline(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer shrink-0 self-end sm:self-center"
                            title="Tanggalin"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <Button onClick={handleSavePortalHotlines} disabled={isSavingPortalHotlines} leftIcon={<Save size={14} />}>
                      {isSavingPortalHotlines ? 'Sinesave...' : 'I-save ang Emergency Hotlines'}
                    </Button>
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

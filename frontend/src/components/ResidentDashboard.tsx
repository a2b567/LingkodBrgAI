import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope, FileText, Calendar, Clock,
  PhoneCall, ShieldCheck, QrCode,
  CheckCircle2, ChevronRight, Megaphone,
  Phone, Shield, Check, Copy, Layers, ExternalLink,
  Edit3, Save, Plus, Trash2, Sparkles
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import type { Certificate, Appointment, Notification } from '../types';
import { ResidentTutorialModal } from './ResidentTutorialModal';

interface ClinicQueueItem {
  id: string;
  residentName: string;
  service: string;
  queueNumber: number;
  timestamp: number;
  status: 'waiting' | 'served';
  isPriority?: boolean;
}

export const ResidentDashboard: React.FC = () => {
  const { user } = useAuthStore();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [clinicQueue, setClinicQueue] = useState<ClinicQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showHotlineModal, setShowHotlineModal] = useState(false);
  const [showIdModal, setShowIdModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'certs' | 'appointments'>('all');
  const [copiedId, setCopiedId] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => {
    try {
      const completed = localStorage.getItem('lingkod_resident_tutorial_completed');
      return completed !== 'true';
    } catch {
      return true;
    }
  });
  const [tutorialInitialMode, setTutorialInitialMode] = useState<'prompt' | 'steps'>('prompt');

  // Sync Clinic Queue & Clinic Schedule
  const [clinicSchedule, setClinicSchedule] = useState<{
    is_open: boolean;
    schedule_days: string;
    operating_hours: string;
    nurse_on_duty: string;
    advisory: string;
  }>({
    is_open: true,
    schedule_days: 'Lunes hanggang Biyernes (Mon - Fri)',
    operating_hours: '8:00 AM - 5:00 PM',
    nurse_on_duty: 'Barangay Health Worker / Duty Nurse',
    advisory: '',
  });

  const syncClinicQueue = () => {
    try {
      const saved = localStorage.getItem('lingkod_clinic_queue');
      if (saved) {
        const parsed: ClinicQueueItem[] = JSON.parse(saved);
        setClinicQueue(parsed);
      } else {
        setClinicQueue([]);
      }
    } catch {
      setClinicQueue([]);
    }

    // Also check clinic schedule
    api.settings.getClinicSchedule().then(s => {
      if (s && typeof s === 'object') {
        setClinicSchedule(prev => ({ ...prev, ...s }));
      }
    }).catch(() => {});
  };

  useEffect(() => {
    syncClinicQueue();
    const interval = setInterval(syncClinicQueue, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [appRes, certRes, notifRes] = await Promise.allSettled([
        api.appointments.list(),
        api.certificates.list(),
        api.notifications.list(),
      ]);

      if (appRes.status === 'fulfilled') {
        setAppointments(appRes.value || []);
      }
      if (certRes.status === 'fulfilled') {
        setCerts(certRes.value || []);
      }
      if (notifRes.status === 'fulfilled') {
        const filtered = (notifRes.value || []).filter(
          (n) =>
            n.type === 'Announcement' ||
            n.type === 'General' ||
            n.type === 'Alert' ||
            n.type === 'Emergency'
        );
        setNotifications(filtered);
      }
    } catch (e) {
      console.error('Failed fetching resident dashboard data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeClinicQueue = clinicQueue.filter((q) => q.status === 'waiting');
  const nowServingClinic = activeClinicQueue[0] || null;

  const pendingCerts = certs.filter(
    (c) => c.status === 'Pending' || c.status === 'Processing' || c.status === 'Approved'
  );
  const pendingAppointments = appointments.filter(
    (a) => a.status === 'Pending' || a.status === 'Confirmed'
  );

  const residentName = user?.resident
    ? `${user.resident.first_name} ${user.resident.last_name}`
    : (user as any)?.first_name && (user as any)?.last_name
    ? `${(user as any).first_name} ${(user as any).last_name}`
    : user?.username || 'Resident';

  const residentQrId = user?.resident?.qr_id || `SANISIDRO-${user?.id ? String(user.id).slice(0, 6) : '2026-889'}`;

  const qrVerificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/verify/document/${residentQrId}`
    : `/verify/document/${residentQrId}`;

  const defaultHotlinesList = [
    { id: '1', title: 'Emergency Response (National 911)', number: '911', desc: 'Police, Medical & Rescue', color: 'bg-rose-500' },
    { id: '2', title: 'Barangay San Isidro Main Hall', number: '(049) 501-2749', desc: 'Barangay Desk & Security', color: 'bg-blue-600' },
    { id: '3', title: 'Barangay Health Center / RHU', number: '(049) 501-2750', desc: 'Doctor, Nurse & Ambulance', color: 'bg-emerald-600' },
    { id: '4', title: 'PNP Local Police Station', number: '(049) 501-1122', desc: 'Patrol & Law Enforcement', color: 'bg-indigo-600' },
    { id: '5', title: 'BFP Bureau of Fire Protection', number: '(049) 501-3473', desc: 'Fire Rescue & Disaster Unit', color: 'bg-amber-600' },
  ];

  const [hotlines, setHotlines] = useState<Array<{ id?: string; title: string; number: string; desc: string; color?: string }>>(() => {
    try {
      const s = localStorage.getItem('lingkod_emergency_hotlines');
      if (s) return JSON.parse(s);
    } catch {}
    return defaultHotlinesList;
  });
  const [isEditingHotlines, setIsEditingHotlines] = useState(false);
  const [editableHotlines, setEditableHotlines] = useState(hotlines);
  const [isSavingHotlines, setIsSavingHotlines] = useState(false);
  const [hotlinesSuccessMsg, setHotlinesSuccessMsg] = useState('');

  // Sync hotlines from server or shared cache
  useEffect(() => {
    api.settings.getHotlines().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setHotlines(data);
        setEditableHotlines(data);
      }
    }).catch(() => {});
  }, []);

  const isCaptainOrStaff = user?.role === 'Captain' || 
                           user?.role === 'Barangay Captain' || 
                           user?.role === 'Admin' || 
                           user?.role === 'Super Admin' ||
                           user?.role === 'Secretary' ||
                           user?.role === 'Staff' ||
                           user?.role === 'Developer';

  const handleSaveHotlines = async () => {
    setIsSavingHotlines(true);
    try {
      await api.settings.updateHotlines(editableHotlines);
      setHotlines(editableHotlines);
      setIsEditingHotlines(false);
      setHotlinesSuccessMsg('Matagumpay na na-update ang mga emergency hotline numbers!');
      setTimeout(() => setHotlinesSuccessMsg(''), 4000);
    } catch (e) {
      console.error('Failed updating hotlines', e);
    } finally {
      setIsSavingHotlines(false);
    }
  };

  const handleAddHotline = () => {
    const newItem = {
      id: Date.now().toString(),
      title: 'Bagong Hotline',
      number: '(049) 000-0000',
      desc: 'Serbisyo ng Barangay',
      color: 'bg-blue-600'
    };
    setEditableHotlines([...editableHotlines, newItem]);
  };

  const handleDeleteHotline = (idx: number) => {
    setEditableHotlines(editableHotlines.filter((_, i) => i !== idx));
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(residentQrId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="p-3 sm:p-6 max-w-xl mx-auto space-y-4 animate-pulse pb-24">
        <div className="h-44 bg-slate-200 dark:bg-slate-800/60 rounded-3xl" />
        <div className="h-20 bg-slate-200 dark:bg-slate-800/60 rounded-3xl" />
        <div className="grid grid-cols-3 gap-2.5">
          <div className="h-24 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl md:max-w-2xl mx-auto space-y-4 pb-28 select-none font-sans px-1">
      
      {/* ── App Top Citizen Header ── */}
      <div className="flex items-center justify-between pt-1 pb-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white font-black text-sm flex items-center justify-center shadow-md border-2 border-white dark:border-slate-800">
              {residentName.slice(0, 2).toUpperCase()}
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] text-white">
              ✓
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                {residentName}
              </h2>
              <span className="px-1.5 py-0.2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase rounded tracking-wider border border-emerald-200 dark:border-emerald-800/60">
                Verified
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Barangay San Isidro Resident Portal
            </p>
          </div>
        </div>

        {/* Quick Top Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setTutorialInitialMode('steps');
              setShowTutorial(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 text-xs font-bold rounded-2xl shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Mabilis na gabay at tutorial sa paggamit ng resident portal"
          >
            <Sparkles size={14} className="text-blue-600 dark:text-blue-400" />
            <span className="text-[11px] font-black">Gabay</span>
          </button>

          <button
            onClick={() => setShowHotlineModal(true)}
            className="flex items-center gap-1 px-3 py-2 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-xs font-black rounded-2xl shadow-md shadow-rose-500/30 transition-all cursor-pointer animate-pulse"
            title="Emergency SOS Hotlines"
          >
            <PhoneCall size={14} />
            <span className="text-[11px] font-black">SOS</span>
          </button>
        </div>
      </div>

      {/* ── PhilSys Style Virtual Citizen e-Card ── */}
      <div 
        onClick={() => setShowIdModal(true)}
        className="relative bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-blue-950/30 border border-blue-400/30 overflow-hidden cursor-pointer active:scale-[0.99] transition-transform group"
      >
        {/* Holographic Background Watermark */}
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 pointer-events-none">
          <Shield size={160} />
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between h-36">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center">
                <ShieldCheck size={16} className="text-amber-300" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200 block">
                  REPUBLIKA NG PILIPINAS
                </span>
                <span className="text-xs font-black tracking-tight block">
                  BARANGAY DIGITAL CITIZEN CARD
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 text-[8px] font-mono border border-blue-400/30">
                v2.0.4
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[9px] font-black uppercase tracking-wider border border-amber-400/40">
                e-ID Active
              </span>
            </div>
          </div>

          <div className="flex items-end justify-between pt-2">
            <div>
              <p className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">RESIDENT NAME</p>
              <h3 className="text-base font-black tracking-wide truncate max-w-[200px] sm:max-w-xs">{residentName}</h3>
              <p className="text-[10px] font-mono text-blue-300/90 mt-0.5">{residentQrId}</p>
            </div>

            <div className="p-1.5 bg-white rounded-xl text-slate-950 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center">
              <QRCodeSVG 
                value={qrVerificationUrl} 
                size={38} 
                level="M" 
                includeMargin={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Live Clinic Queue Status Pill ── */}
      <Link
        to="/clinic-queue"
        className={`block bg-white dark:bg-slate-900 rounded-2xl border p-3.5 shadow-sm transition-all active:scale-[0.99] group ${
          clinicSchedule.is_open
            ? 'border-slate-200/80 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-900/60'
            : 'border-rose-500/30 bg-rose-50/20 dark:bg-rose-950/10'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              clinicSchedule.is_open
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-500 border-rose-200 dark:border-rose-900/40'
                : 'bg-rose-100 dark:bg-rose-950 text-rose-600 border-rose-300 dark:border-rose-800'
            }`}>
              <Stethoscope size={20} className={clinicSchedule.is_open ? 'animate-pulse' : ''} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Health Center Clinic
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                  clinicSchedule.is_open
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-500/30'
                }`}>
                  {clinicSchedule.is_open ? '● BUKAS' : '● SARADO'}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                {clinicSchedule.is_open ? (
                  nowServingClinic ? (
                    <>Serving: <strong className="text-rose-600 dark:text-rose-400 font-bold">#{nowServingClinic.queueNumber}</strong> ({nowServingClinic.service})</>
                  ) : (
                    <>Clinic Open • <strong className="text-blue-600 dark:text-blue-400">{activeClinicQueue.length} waiting</strong> ({clinicSchedule.operating_hours})</>
                  )
                ) : (
                  <>Kasalukuyang Sarado • Bukas: <strong className="text-slate-700 dark:text-slate-300">{clinicSchedule.operating_hours}</strong> ({clinicSchedule.schedule_days})</>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 group-hover:translate-x-1 transition-transform">
            <span>Tingnan</span>
            <ChevronRight size={14} />
          </div>
        </div>
      </Link>

      {/* ── 6-Grid Native Mobile Service Launcher ── */}
      <div>
        <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 mb-2.5">
          Serbisyong Barangay (Quick Launcher)
        </h3>

        <div className="grid grid-cols-3 gap-2.5">
          {/* Tile 1: Certificates */}
          <Link
            to="/certificates"
            className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center text-center justify-between hover:border-blue-400 active:scale-95 transition-all group min-h-[105px]"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <FileText size={20} />
            </div>
            <div className="mt-2">
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block leading-tight">
                Certificates
              </span>
              <span className="text-[9px] text-slate-400 font-medium">Clearances & ID</span>
            </div>
          </Link>

          {/* Tile 2: Appointments */}
          <Link
            to="/appointments"
            className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center text-center justify-between hover:border-amber-400 active:scale-95 transition-all group min-h-[105px]"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <Calendar size={20} />
            </div>
            <div className="mt-2">
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block leading-tight">
                Appointments
              </span>
              <span className="text-[9px] text-slate-400 font-medium">Book Consult</span>
            </div>
          </Link>

          {/* Tile 3: Clinic Queue */}
          <Link
            to="/clinic-queue"
            className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center text-center justify-between hover:border-rose-400 active:scale-95 transition-all group min-h-[105px]"
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <Stethoscope size={20} />
            </div>
            <div className="mt-2">
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block leading-tight">
                Clinic Queue
              </span>
              <span className="text-[9px] text-slate-400 font-medium">Live Numbers</span>
            </div>
          </Link>

          {/* Tile 4: Pick-up Schedule */}
          <Link
            to="/queue-schedule"
            className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center text-center justify-between hover:border-purple-400 active:scale-95 transition-all group min-h-[105px]"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <Clock size={20} />
            </div>
            <div className="mt-2">
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block leading-tight">
                Pick-up Pila
              </span>
              <span className="text-[9px] text-slate-400 font-medium">Schedule & Ticket</span>
            </div>
          </Link>

          {/* Tile 5: SOS Hotlines */}
          <button
            onClick={() => setShowHotlineModal(true)}
            className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center text-center justify-between hover:border-rose-400 active:scale-95 transition-all group min-h-[105px] cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-rose-500/20">
              <PhoneCall size={20} />
            </div>
            <div className="mt-2">
              <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 block leading-tight">
                Emergency SOS
              </span>
              <span className="text-[9px] text-slate-400 font-medium">911 & Barangay</span>
            </div>
          </button>

          {/* Tile 6: Digital QR */}
          <button
            onClick={() => setShowIdModal(true)}
            className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center text-center justify-between hover:border-emerald-400 active:scale-95 transition-all group min-h-[105px] cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <QrCode size={20} />
            </div>
            <div className="mt-2">
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block leading-tight">
                Resident ID
              </span>
              <span className="text-[9px] text-slate-400 font-medium">QR Pass</span>
            </div>
          </button>
        </div>
      </div>

      {/* ── Active Status Hub (Segmented Tabs) ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
            <Layers size={14} className="text-blue-500" />
            Active Requests & Status
          </h4>

          {/* Segmented Filter */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              All ({pendingCerts.length + pendingAppointments.length})
            </button>
            <button
              onClick={() => setActiveTab('certs')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                activeTab === 'certs'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Docs ({pendingCerts.length})
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                activeTab === 'appointments'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Appts ({pendingAppointments.length})
            </button>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-2 pt-1">
          {pendingCerts.length === 0 && pendingAppointments.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-1" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Walang pending na kahilingan</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Pindutin ang "Certificates" o "Appointments" upang mag-request.</p>
            </div>
          ) : (
            <>
              {(activeTab === 'all' || activeTab === 'certs') &&
                pendingCerts.map((c) => (
                  <Link
                    key={c.id}
                    to="/certificates"
                    className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between hover:border-blue-400 transition-colors block"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </div>
                      <div className="truncate space-y-0.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {c.type}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Ref #{c.document_number || c.id}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                        c.status === 'Approved'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : c.status === 'Processing'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {c.status}
                    </span>
                  </Link>
                ))}

              {(activeTab === 'all' || activeTab === 'appointments') &&
                pendingAppointments.map((a) => (
                  <Link
                    key={a.id}
                    to="/appointments"
                    className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between hover:border-amber-400 transition-colors block"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Calendar size={16} />
                      </div>
                      <div className="truncate space-y-0.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          Appointment: {a.purpose}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {new Date(a.appointment_date).toLocaleDateString()} • {a.time_slot}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                        a.status === 'Confirmed'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {a.status}
                    </span>
                  </Link>
                ))}
            </>
          )}
        </div>
      </div>

      {/* ── Community Announcements & Advisories Feed ── */}
      {notifications.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Megaphone size={16} className="text-blue-600 dark:text-blue-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Anunsyo at Paalala ng Barangay
            </h4>
          </div>

          <div className="space-y-2">
            {notifications.slice(0, 3).map((n) => (
              <div
                key={n.id}
                className="p-3.5 bg-blue-50/40 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/40 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-slate-900 dark:text-white">{n.title}</p>
                  <span className="text-[9px] font-bold text-slate-400">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {n.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Version & Portal Security Footer */}
      <div className="pt-4 pb-2 text-center text-[10px] text-slate-400 dark:text-slate-500 space-y-1">
        <p className="font-mono font-bold">
          LingkodBrgyAI Resident Portal <span className="text-blue-600 dark:text-blue-400">v2.0.4</span>
        </p>
        <p className="text-[9px] uppercase tracking-widest font-semibold opacity-75">
          DPA RA 10173 Protected • 256-bit Secure Session
        </p>
      </div>

      {/* ── Digital ID Modal (Bottom Sheet / Modal) ── */}
      {showIdModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowIdModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-blue-600" />
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                  Barangay Citizen QR ID
                </h3>
              </div>
              <button
                onClick={() => setShowIdModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                ✕
              </button>
            </div>

            {/* QR Card Presentation */}
            <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div className="w-52 h-52 mx-auto bg-white p-4 rounded-2xl shadow-md border border-slate-200 flex items-center justify-center">
                <QRCodeSVG 
                  value={qrVerificationUrl} 
                  size={176} 
                  level="H" 
                  includeMargin={false}
                />
              </div>

              <div>
                <h4 className="font-black text-base text-slate-900 dark:text-white">{residentName}</h4>
                <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">{residentQrId}</p>
                <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  ✓ PhilSys / Barangay Verified ID
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  Tunay na scannable QR Code. I-scan gamit ang phone camera o scanner upang ma-verify ang opisyal na rekord.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={handleCopyId}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedId ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  <span>{copiedId ? 'Copied QR Code!' : 'Copy Citizen ID'}</span>
                </button>
                <Link
                  to={`/verify/document/${residentQrId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink size={14} />
                  <span>Subukan I-Verify</span>
                </Link>
              </div>
              <button
                onClick={() => setShowIdModal(false)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Emergency SOS Hotlines Modal ── */}
      {showHotlineModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowHotlineModal(false)}
        >
          <div 
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/30">
                  <PhoneCall size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Emergency SOS Hotlines
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">1-Tap Quick Dial for Urgent Assistance</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowHotlineModal(false);
                  setIsEditingHotlines(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Captain / Admin Quick Edit Bar */}
            {isCaptainOrStaff && (
              <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl px-3 py-2">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  👑 Barangay Captain / Admin Mode
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (!isEditingHotlines) {
                      setEditableHotlines([...hotlines]);
                    }
                    setIsEditingHotlines(!isEditingHotlines);
                  }}
                  className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer bg-amber-100/70 dark:bg-amber-900/50 px-2.5 py-1 rounded-lg"
                >
                  <Edit3 size={12} />
                  {isEditingHotlines ? 'Tapusin ang Pag-edit' : 'I-edit ang mga Real Contact No.'}
                </button>
              </div>
            )}

            {hotlinesSuccessMsg && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-bold text-center">
                ✓ {hotlinesSuccessMsg}
              </div>
            )}

            {isEditingHotlines ? (
              /* ── EDIT MODE FOR CAPTAIN ── */
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Palitan ang mga contact number sa ibaba ng totoong opisyal na numero ng inyong barangay at ahensya:
                </p>
                {editableHotlines.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Hotline #{idx + 1}
                      </span>
                      {editableHotlines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteHotline(idx)}
                          className="text-rose-500 hover:text-rose-600 text-xs p-1 cursor-pointer"
                          title="Tanggalin"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Pangalan / Ahensya</label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const updated = [...editableHotlines];
                          updated[idx] = { ...updated[idx], title: e.target.value };
                          setEditableHotlines(updated);
                        }}
                        className="w-full text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        placeholder="Hal. Barangay San Isidro Hall"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-rose-500 block mb-0.5">Totoong Numero (Real Contact No.)</label>
                      <input
                        type="text"
                        value={item.number}
                        onChange={(e) => {
                          const updated = [...editableHotlines];
                          updated[idx] = { ...updated[idx], number: e.target.value };
                          setEditableHotlines(updated);
                        }}
                        className="w-full text-xs font-mono font-bold px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-900/60 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400"
                        placeholder="Hal. 0917-123-4567 o (049) 501-2749"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Deskripsyon / Serbisyo</label>
                      <input
                        type="text"
                        value={item.desc}
                        onChange={(e) => {
                          const updated = [...editableHotlines];
                          updated[idx] = { ...updated[idx], desc: e.target.value };
                          setEditableHotlines(updated);
                        }}
                        className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
                        placeholder="Hal. Tawagan para sa rescue at seguridad"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddHotline}
                  className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-gov-blue-500 text-slate-600 dark:text-slate-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus size={14} /> Magdagdag ng Ibang Hotline
                </button>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingHotlines(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Kanselahin
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveHotlines}
                    disabled={isSavingHotlines}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Save size={14} />
                    {isSavingHotlines ? 'Sinesave...' : 'I-save ang mga Numero'}
                  </button>
                </div>
              </div>
            ) : (
              /* ── NORMAL DIAL VIEW ── */
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {hotlines.map((h, i) => (
                  <div
                    key={i}
                    className="p-3.5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <h5 className="text-xs font-black text-slate-900 dark:text-white">{h.title}</h5>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{h.desc}</p>
                      <span className="font-mono text-xs font-black text-rose-600 dark:text-rose-400 block pt-0.5">
                        {h.number}
                      </span>
                    </div>
                    <a
                      href={`tel:${h.number.replace(/[^\d+]/g, '')}`}
                      className="p-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-md shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                      title={`Call ${h.title}`}
                    >
                      <Phone size={18} />
                    </a>
                  </div>
                ))}
              </div>
            )}

            {!isEditingHotlines && (
              <button
                onClick={() => setShowHotlineModal(false)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close Hotlines
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Resident Onboarding Tutorial Walkthrough ── */}
      <ResidentTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        initialMode={tutorialInitialMode}
      />

    </div>
  );
};

export default ResidentDashboard;

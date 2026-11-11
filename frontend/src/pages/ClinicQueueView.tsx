import React, { useState, useEffect } from 'react';
import {
  Clock, CheckCircle2, AlertTriangle, Stethoscope,
  Heart, Users, Zap, Star, Activity, Plus,
  Ticket, Eye, EyeOff, Shield, Calendar,
  Lock, Unlock, Phone, Check, RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePrivacyStore } from '../store/privacyStore';
import { maskName } from '../utils/privacy';
import { api } from '../services/api';

export interface QueueItem {
  id: string;
  residentName: string;
  service: string;
  queueNumber: number;
  timestamp: number;
  status: 'waiting' | 'served';
  isPriority?: boolean;
}

export interface ClinicSchedule {
  is_open: boolean;
  schedule_days: string;
  operating_hours: string;
  nurse_on_duty: string;
  advisory: string;
  allow_queue_while_closed: boolean;
  updated_at?: string;
  updated_by?: string;
}

const CLINIC_QUEUE_KEY = 'lingkod_clinic_queue';
const MY_TICKET_KEY = 'lingkod_my_clinic_ticket';

const DEFAULT_SCHEDULE: ClinicSchedule = {
  is_open: true,
  schedule_days: 'Lunes hanggang Biyernes (Mon - Fri)',
  operating_hours: '8:00 AM - 5:00 PM',
  nurse_on_duty: 'Nurse Joy Santos, RN',
  advisory: 'Bukas ang clinic para sa consultation, BP check, pagpapabakuna, at libreng gamot.',
  allow_queue_while_closed: false,
};

export const ClinicQueueView: React.FC = () => {
  const { user } = useAuthStore();
  const { isPrivacyMode, isItemRevealed, toggleRevealItem } = usePrivacyStore();
  const isResident = user?.role === 'Resident';

  // Health Worker (Nurse), Captain, Super Admin, and Staff are authorized to manage clinic schedule & status
  const isNurseOrStaff = user?.role === 'Health Worker' || user?.role === 'Barangay Captain' || user?.role === 'Super Admin' || user?.role === 'Staff';

  const [queueList, setQueueList] = useState<QueueItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [liveDot, setLiveDot] = useState(true);

  // Clinic Operating Schedule state
  const [clinicSchedule, setClinicSchedule] = useState<ClinicSchedule>(DEFAULT_SCHEDULE);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [scheduleSuccessMsg, setScheduleSuccessMsg] = useState('');
  const [scheduleForm, setScheduleForm] = useState<ClinicSchedule>(DEFAULT_SCHEDULE);

  // Closed Alert Modal for Residents
  const [isClosedAlertOpen, setIsClosedAlertOpen] = useState(false);
  
  // Get Queue Ticket Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [selectedService, setSelectedService] = useState('General Medical Consultation');
  const [isPriority, setIsPriority] = useState(false);
  const [myTicket, setMyTicket] = useState<QueueItem | null>(null);

  const services = [
    'General Medical Consultation',
    'Blood Pressure & Vitals Check',
    'Prenatal & Maternal Checkup',
    'Immunization & Vaccination',
    'Senior Citizen / PWD Consultation',
    'Dental & First Aid Care'
  ];

  // Fetch Schedule from Database
  const loadSchedule = async () => {
    try {
      const data = await api.settings.getClinicSchedule();
      if (data && typeof data === 'object') {
        const fullSched: ClinicSchedule = {
          is_open: data.is_open ?? true,
          schedule_days: data.schedule_days || DEFAULT_SCHEDULE.schedule_days,
          operating_hours: data.operating_hours || DEFAULT_SCHEDULE.operating_hours,
          nurse_on_duty: data.nurse_on_duty || (user?.role === 'Health Worker' ? `${user.username} (Health Worker)` : DEFAULT_SCHEDULE.nurse_on_duty),
          advisory: data.advisory || DEFAULT_SCHEDULE.advisory,
          allow_queue_while_closed: data.allow_queue_while_closed ?? false,
          updated_at: data.updated_at,
          updated_by: data.updated_by,
        };
        setClinicSchedule(fullSched);
      }
    } catch {
      // Keep existing or default
    }
  };

  const loadQueue = () => {
    try {
      const saved = localStorage.getItem(CLINIC_QUEUE_KEY);
      if (saved) {
        const parsed: QueueItem[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setQueueList(parsed);
        } else {
          setQueueList([]);
        }
      } else {
        setQueueList([]);
      }

      // Check if user has their own ticket
      const savedMyTicket = localStorage.getItem(MY_TICKET_KEY);
      if (savedMyTicket) {
        setMyTicket(JSON.parse(savedMyTicket));
      }
      setLastUpdated(new Date());
    } catch {
      setQueueList([]);
    }
  };

  useEffect(() => {
    loadSchedule();
    loadQueue();
    const interval = setInterval(() => {
      loadQueue();
      loadSchedule();
      setLiveDot(d => !d);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const activeQueue = queueList
    .filter(q => q.status === 'waiting')
    .sort((a, b) => {
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return a.timestamp - b.timestamp;
    });

  const servedQueue = queueList
    .filter(q => q.status === 'served')
    .sort((a, b) => b.timestamp - a.timestamp);

  const nowServing = activeQueue[0] || null;
  const nextInLine = activeQueue[1] || null;

  // Calculate position of user's ticket in active queue
  const myQueuePosition = myTicket 
    ? activeQueue.findIndex(q => q.id === myTicket.id)
    : -1;

  // Format patient name respecting DPA Privacy
  const formatPatientName = (item: QueueItem | null): string => {
    if (!item) return '';

    if (myTicket && item.id === myTicket.id) {
      return item.residentName;
    }

    const currentResidentFullName = user?.resident
      ? `${user.resident.first_name} ${user.resident.last_name}`.trim().toLowerCase()
      : '';
    if (currentResidentFullName && item.residentName.trim().toLowerCase() === currentResidentFullName) {
      return item.residentName;
    }

    const shouldMask = isResident || isPrivacyMode;
    if (shouldMask) {
      if (!isResident && isItemRevealed(item.id)) {
        return item.residentName;
      }
      return maskName(item.residentName);
    }

    return item.residentName;
  };

  // Quick Open / Close Toggle by Nurse / Staff
  const handleQuickToggleOpen = async () => {
    const nextState = !clinicSchedule.is_open;
    const updated: ClinicSchedule = {
      ...clinicSchedule,
      is_open: nextState,
      updated_by: user?.username || 'Nurse',
      updated_at: new Date().toISOString(),
    };
    setClinicSchedule(updated);
    try {
      await api.settings.updateClinicSchedule(updated);
    } catch (e) {
      console.error('Failed to update clinic status', e);
    }
  };

  // Open Schedule Edit Modal
  const handleOpenScheduleModal = () => {
    setScheduleForm({
      ...clinicSchedule,
      nurse_on_duty: clinicSchedule.nurse_on_duty || (user?.role === 'Health Worker' ? `Nurse ${user.username}` : DEFAULT_SCHEDULE.nurse_on_duty),
    });
    setScheduleSuccessMsg('');
    setIsScheduleModalOpen(true);
  };

  // Save Schedule to Database
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSchedule(true);
    try {
      const payload: ClinicSchedule = {
        ...scheduleForm,
        updated_by: user?.username || 'Nurse',
        updated_at: new Date().toISOString(),
      };
      await api.settings.updateClinicSchedule(payload);
      setClinicSchedule(payload);
      setScheduleSuccessMsg('Matagumpay na na-update ang Clinic Schedule & Status!');
      setTimeout(() => {
        setIsScheduleModalOpen(false);
        setScheduleSuccessMsg('');
      }, 1200);
    } catch (err) {
      console.error('Failed to save schedule', err);
      alert('May problemang naganap habang sine-save ang schedule.');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Handle clicking "Kumuha ng Queue Ticket"
  const handleRequestTicketClick = () => {
    if (!clinicSchedule.is_open && !clinicSchedule.allow_queue_while_closed) {
      setIsClosedAlertOpen(true);
      return;
    }
    if (user?.resident) {
      setPatientName(`${user.resident.first_name} ${user.resident.last_name}`);
    }
    setIsModalOpen(true);
  };

  const handleGetTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const name = patientName.trim() || (user?.resident ? `${user.resident.first_name} ${user.resident.last_name}` : user?.username || 'Resident Patient');
    
    const maxNum = queueList.reduce((max, q) => (q.queueNumber > max ? q.queueNumber : max), 100);
    const newQueueNumber = maxNum + 1;

    const newTicket: QueueItem = {
      id: `cq-${Date.now()}`,
      residentName: name,
      service: selectedService,
      queueNumber: newQueueNumber,
      timestamp: Date.now(),
      status: 'waiting',
      isPriority: isPriority,
    };

    const updated = [...queueList, newTicket];
    setQueueList(updated);
    setMyTicket(newTicket);
    try {
      localStorage.setItem(CLINIC_QUEUE_KEY, JSON.stringify(updated));
      localStorage.setItem(MY_TICKET_KEY, JSON.stringify(newTicket));
    } catch {}

    setIsModalOpen(false);
    setPatientName('');
  };

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-5 pb-28">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/25 shrink-0">
            <Heart size={26} className="animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Barangay Clinic Live Queue
              </h1>
              
              {/* Dynamic Clinic Status Badge */}
              <span className={`flex items-center gap-1.5 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-xs transition-all ${
                clinicSchedule.is_open
                  ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500/30'
                  : 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border-rose-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full transition-colors ${
                  clinicSchedule.is_open ? (liveDot ? 'bg-emerald-500' : 'bg-emerald-300') : 'bg-rose-500'
                }`} />
                {clinicSchedule.is_open ? 'BUKAS (OPEN)' : 'SARADO (CLOSED)'}
              </span>

              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                <Shield size={10} className="text-blue-500" />
                DPA RA 10173
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 flex flex-wrap items-center gap-x-2">
              <span>Barangay San Isidro Health & Wellness Center</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {clinicSchedule.operating_hours} ({clinicSchedule.schedule_days})
              </span>
            </p>
          </div>
        </div>

        {/* Action button to get queue ticket */}
        <button
          onClick={handleRequestTicketClick}
          className={`w-full sm:w-auto px-5 py-2.5 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
            clinicSchedule.is_open
              ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 shadow-rose-600/25'
              : 'bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 shadow-slate-900/20'
          }`}
        >
          <Plus size={16} />
          <span>Kumuha ng Queue Ticket</span>
        </button>
      </div>

      {/* ── NURSE & STAFF CLINIC OPERATIONS CONTROL PANEL ── */}
      {isNurseOrStaff && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-4 sm:p-5 border border-blue-400/30 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-rose-400 shrink-0">
                <Stethoscope size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-300/30">
                    Nurse & Health Worker Duty Controls
                  </span>
                  <span className="text-xs text-slate-300">
                    Naka-login bilang: <strong className="text-white">{user?.username} ({user?.role})</strong>
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                  Pamahalaan ang Schedule at Bukas/Sarado ng Clinic
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  Duty Nurse: <span className="font-bold text-white">{clinicSchedule.nurse_on_duty}</span> • Oras: <span className="font-bold text-white">{clinicSchedule.operating_hours}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Quick Toggle Open/Closed */}
              <button
                type="button"
                onClick={handleQuickToggleOpen}
                className={`flex-1 md:flex-initial px-4 py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer ${
                  clinicSchedule.is_open
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
                }`}
                title="Pindutin para buksan o isara ang clinic agad-agad"
              >
                {clinicSchedule.is_open ? (
                  <>
                    <Lock size={15} />
                    <span>Isara ang Clinic (Close)</span>
                  </>
                ) : (
                  <>
                    <Unlock size={15} />
                    <span>Buksan ang Clinic (Open)</span>
                  </>
                )}
              </button>

              {/* Edit Schedule Button */}
              <button
                type="button"
                onClick={handleOpenScheduleModal}
                className="flex-1 md:flex-initial px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Calendar size={15} className="text-amber-300" />
                <span>Baguhin ang Oras & Schedule</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CLINIC CLOSED PUBLIC ADVISORY BANNER (If Closed) ── */}
      {!clinicSchedule.is_open && (
        <div className="bg-gradient-to-r from-rose-900/90 via-rose-950 to-slate-900 border-2 border-rose-500/50 rounded-3xl p-5 sm:p-6 text-white shadow-xl animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <Lock size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-rose-200">
                    Kasalukuyang Sarado ang Barangay Clinic
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white">
                    Closed
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                  Ang ating Health Center ay magbubukas muli sa nakatakdang oras: <strong className="text-white underline">{clinicSchedule.operating_hours}</strong> tuwing <strong className="text-white">{clinicSchedule.schedule_days}</strong>.
                </p>
                {clinicSchedule.advisory && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-rose-100 flex items-center gap-2">
                    <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                    <span><strong>Paunawa ng Nurse:</strong> {clinicSchedule.advisory}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
              <a
                href="tel:911"
                className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <Phone size={14} />
                <span>Emergency: Tawag sa 911</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* User's Active Ticket Banner (If registered) */}
      {myTicket && myQueuePosition !== -1 && (
        <div className="bg-gradient-to-r from-gov-blue-700 via-gov-blue-800 to-indigo-900 text-white rounded-3xl p-4 sm:p-5 border border-gov-blue-400/40 shadow-xl relative overflow-hidden animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex flex-col items-center justify-center font-black">
                <span className="text-[9px] uppercase tracking-wider text-gov-gold-400">My Ticket</span>
                <span className="text-lg text-white">#{myTicket.queueNumber}</span>
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">{myTicket.residentName}</h4>
                <p className="text-xs text-slate-200 font-medium">{myTicket.service}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
              <div className="text-left sm:text-right">
                <p className="text-[10px] uppercase font-bold text-slate-300">Posisyon sa Pila</p>
                <p className="text-sm font-black text-gov-gold-400">
                  {myQueuePosition === 0 ? 'Kasalukuyang Kinokonsulta!' : `${myQueuePosition} pasyente bago ang turno mo`}
                </p>
              </div>
              <button
                onClick={() => {
                  setMyTicket(null);
                  localStorage.removeItem(MY_TICKET_KEY);
                }}
                className="px-2.5 py-1 text-[10px] bg-white/10 hover:bg-white/20 rounded-xl text-white/80 font-bold"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards (2 Columns for Resident, 3 Columns for Staff) */}
      <div className={`grid gap-2.5 sm:gap-4 ${isResident ? 'grid-cols-2' : 'grid-cols-3'}`}>
        
        {/* Waiting */}
        <div className="bg-white dark:bg-slate-900 border border-amber-400/30 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 text-center sm:text-left shadow-sm">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/50 shrink-0">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Waiting</p>
            <p className="text-xl sm:text-2xl font-black text-amber-500">{activeQueue.length}</p>
          </div>
        </div>

        {/* Now Serving */}
        <div className="bg-white dark:bg-slate-900 border border-rose-400/30 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 text-center sm:text-left shadow-sm">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center border border-rose-200/60 dark:border-rose-800/50 shrink-0">
            <Stethoscope size={18} />
          </div>
          <div>
            <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Now Serving</p>
            <p className="text-xl sm:text-2xl font-black text-rose-500">{nowServing ? `#${nowServing.queueNumber}` : '—'}</p>
          </div>
        </div>

        {/* Served Today (Visible only to Nurse & Staff accounts; hidden for Resident) */}
        {!isResident && (
          <div className="bg-white dark:bg-slate-900 border border-emerald-400/30 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 text-center sm:text-left shadow-sm animate-in fade-in">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/50 shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Served</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-500">{servedQueue.length}</p>
            </div>
          </div>
        )}

      </div>

      {/* Now Serving Highlight Banner */}
      <div className={`rounded-3xl p-5 sm:p-6 border transition-all duration-500 ${
        nowServing
          ? 'bg-gradient-to-br from-rose-600 via-rose-700 to-pink-700 border-rose-500/50 shadow-xl shadow-rose-600/20 text-white'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2 flex items-center gap-1.5">
          <Zap size={13} /> Kasalukuyang Kinokonsulta (Now Serving)
        </p>

        {nowServing ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <p className="text-3xl sm:text-5xl font-black tracking-tight">#{nowServing.queueNumber}</p>
                {nowServing.isPriority && (
                  <span className="text-[10px] font-black bg-amber-400/30 text-amber-200 border border-amber-400/40 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                    <Star size={10} className="fill-amber-300" /> Priority Lane
                  </span>
                )}
                {!isResident && isPrivacyMode && (
                  <button
                    onClick={() => toggleRevealItem(nowServing.id)}
                    className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors cursor-pointer"
                    title={isItemRevealed(nowServing.id) ? "Hide Name" : "Reveal Name (Authorized Staff)"}
                  >
                    {isItemRevealed(nowServing.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
              </div>
              <p className="text-base sm:text-xl font-bold opacity-95 mt-1">{formatPatientName(nowServing)}</p>
              <p className="text-xs opacity-80 mt-0.5 font-medium">{nowServing.service}</p>
            </div>

            {nextInLine && (
              <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 backdrop-blur-sm w-full sm:w-auto">
                <p className="text-[9px] font-black uppercase opacity-70 tracking-wider">Susunod na Pasyente</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-black text-lg">#{nextInLine.queueNumber}</span>
                  <span className="text-xs opacity-90 font-semibold truncate max-w-[150px]">{formatPatientName(nextInLine)}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 py-3">
            <Activity size={22} className="opacity-40" />
            <p className="text-sm font-bold">Walang pasyenteng kasalukuyang kinokonsulta</p>
          </div>
        )}
      </div>

      {/* Queue Lists (Waiting Queue for all; Served Today for Staff & Nurse only) */}
      <div className={`grid gap-4 ${isResident ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        
        {/* Waiting Queue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Nasa Pila (Waiting Queue)
              </h3>
            </div>
            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-amber-500/20">
              {activeQueue.length} waiting
            </span>
          </div>

          {activeQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-1.5 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Users size={28} className="text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Walang pasyenteng naghihintay</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {activeQueue.map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                    item.id === myTicket?.id
                      ? 'bg-gov-blue-50 dark:bg-gov-blue-950/40 border-gov-blue-400 shadow-sm'
                      : idx === 0
                      ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200/60 dark:border-slate-800/60'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-sm shrink-0 ${
                    item.isPriority ? 'bg-amber-500 text-white shadow-amber-500/20'
                    : idx === 0 ? 'bg-rose-600 text-white shadow-rose-600/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    #{item.queueNumber}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {formatPatientName(item)}
                      </p>
                      {!isResident && isPrivacyMode && (
                        <button
                          onClick={() => toggleRevealItem(item.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          title={isItemRevealed(item.id) ? "Hide Name" : "Reveal Name (Authorized Staff)"}
                        >
                          {isItemRevealed(item.id) ? <EyeOff size={11} /> : <Eye size={11} />}
                        </button>
                      )}
                      {item.isPriority && <Star size={10} className="text-amber-500 fill-amber-500 shrink-0" />}
                      {item.id === myTicket?.id && (
                        <span className="text-[8px] font-black uppercase bg-gov-blue-600 text-white px-1.5 py-0.2 rounded">Ikaw</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{item.service}</p>
                  </div>

                  {idx === 0 && (
                    <span className="text-[9px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-lg uppercase tracking-wide shrink-0">
                      Up Next
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Served Today - Hidden from Resident view for DPA Privacy and cleanliness */}
        {!isResident && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm p-4 sm:p-5 animate-in fade-in">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Natapos Ngayong Araw (Served)
                </h3>
              </div>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-emerald-500/20">
                {servedQueue.length} done
              </span>
            </div>

            {servedQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-1.5 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <CheckCircle2 size={28} className="text-slate-300 dark:text-slate-700" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Wala pang natapos na pasyente</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {servedQueue.slice(0, 10).map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl border bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200/60 dark:border-emerald-900/40 opacity-80">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs shrink-0">
                      ✓
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {formatPatientName(item)}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{item.service}</p>
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">#{item.queueNumber}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Paunawa / Resident Note */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl">
        <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-black text-amber-800 dark:text-amber-300">
            Paalala ng Barangay Health Center ({clinicSchedule.nurse_on_duty})
          </p>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed mt-0.5">
            {clinicSchedule.advisory || 'Maaari kang kumuha ng Queue Ticket gamit ang button sa itaas o mag-walk in nang direkta sa Health Center. Mangyaring dalhin ang iyong Barangay ID o valid ID.'}
          </p>
          <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold mt-1">
            Opisyal na Oras: {clinicSchedule.operating_hours} ({clinicSchedule.schedule_days}) · Huling na-update: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* ── NURSE SCHEDULE EDIT MODAL ── */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scale-up">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Oras at Schedule ng Clinic (Nurse Control)
                  </h3>
                  <p className="text-[11px] text-slate-400">Baguhin ang availability para sa lahat ng residente</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                ✕
              </button>
            </div>

            {scheduleSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <Check size={16} />
                <span>{scheduleSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveSchedule} className="space-y-4">
              
              {/* Quick Status Toggle */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">Status ng Clinic Ngayon</p>
                  <p className="text-[11px] text-slate-500">
                    {scheduleForm.is_open ? 'BUKAS - Makakakuha ng queue tickets ang mga residente' : 'SARADO - Makikita ng mga tao na sarado ang clinic'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setScheduleForm({ ...scheduleForm, is_open: !scheduleForm.is_open })}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    scheduleForm.is_open
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                      : 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                  }`}
                >
                  {scheduleForm.is_open ? '● BUKAS' : '● SARADO'}
                </button>
              </div>

              {/* Operating Days */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">
                  Mga Araw ng Operasyon (Schedule Days)
                </label>
                <input
                  type="text"
                  required
                  value={scheduleForm.schedule_days}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, schedule_days: e.target.value })}
                  placeholder="e.g. Lunes hanggang Biyernes (Mon - Fri)"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-rose-500 text-slate-900 dark:text-white"
                />
                <div className="flex gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setScheduleForm({ ...scheduleForm, schedule_days: 'Lunes hanggang Biyernes (Mon - Fri)' })}
                    className="text-[9px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    Mon - Fri
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleForm({ ...scheduleForm, schedule_days: 'Lunes hanggang Sabado (Mon - Sat)' })}
                    className="text-[9px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    Mon - Sat
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleForm({ ...scheduleForm, schedule_days: 'Daily / 24/7 Emergency Care' })}
                    className="text-[9px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    24/7 Care
                  </button>
                </div>
              </div>

              {/* Operating Hours */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">
                  Oras ng Konsultasyon (Operating Hours)
                </label>
                <input
                  type="text"
                  required
                  value={scheduleForm.operating_hours}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, operating_hours: e.target.value })}
                  placeholder="e.g. 8:00 AM - 5:00 PM"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-rose-500 text-slate-900 dark:text-white"
                />
                <div className="flex gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setScheduleForm({ ...scheduleForm, operating_hours: '8:00 AM - 5:00 PM' })}
                    className="text-[9px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    8 AM - 5 PM
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleForm({ ...scheduleForm, operating_hours: '8:00 AM - 12:00 PM (Half Day)' })}
                    className="text-[9px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    Half Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleForm({ ...scheduleForm, operating_hours: '1:00 PM - 5:00 PM (Afternoon)' })}
                    className="text-[9px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    Afternoon
                  </button>
                </div>
              </div>

              {/* Duty Nurse Name */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">
                  Duty Nurse / Assigned Health Worker
                </label>
                <input
                  type="text"
                  required
                  value={scheduleForm.nurse_on_duty}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, nurse_on_duty: e.target.value })}
                  placeholder="e.g. Nurse Joy Santos, RN"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-rose-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Advisory Note */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">
                  Paunawa / Mahalagang Advisory para sa Residente
                </label>
                <textarea
                  rows={2}
                  value={scheduleForm.advisory}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, advisory: e.target.value })}
                  placeholder="e.g. Bukas ang clinic para sa regular checkup, pagpapabakuna, at libreng gamot."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-rose-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Allow tickets while closed */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Payagan ang Queue Habang Sarado</p>
                  <p className="text-[10px] text-slate-500">Payagan ang residente na magpalista ng maaga kahit sarado pa</p>
                </div>
                <input
                  type="checkbox"
                  checked={scheduleForm.allow_queue_while_closed}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, allow_queue_while_closed: e.target.checked })}
                  className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Kanselahin
                </button>
                <button
                  type="submit"
                  disabled={isSavingSchedule}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md shadow-rose-600/25 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSavingSchedule ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Sine-save...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>I-save ang Schedule</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ── CLINIC CLOSED RESIDENT ALERT MODAL ── */}
      {isClosedAlertOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-rose-500/30 shadow-2xl space-y-4 text-center animate-scale-up">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center mx-auto">
              <Lock size={28} />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Kasalukuyang Sarado ang Clinic
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Hindi muna tumatanggap ng bagong queue ticket dahil sarado pa ang Barangay Health Center sa ngayon.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-1">
              <p className="text-slate-700 dark:text-slate-300">
                ⏰ <strong>Oras ng Konsultasyon:</strong> {clinicSchedule.operating_hours}
              </p>
              <p className="text-slate-700 dark:text-slate-300">
                📅 <strong>Araw:</strong> {clinicSchedule.schedule_days}
              </p>
              <p className="text-slate-700 dark:text-slate-300">
                👩‍⚕️ <strong>Duty Nurse:</strong> {clinicSchedule.nurse_on_duty}
              </p>
              {clinicSchedule.advisory && (
                <p className="text-rose-600 dark:text-rose-400 text-[11px] pt-1 border-t border-slate-200 dark:border-slate-800">
                  ℹ️ {clinicSchedule.advisory}
                </p>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href="tel:911"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone size={14} />
                <span>Para sa Emergency: Tawag sa 911</span>
              </a>
              <button
                type="button"
                onClick={() => setIsClosedAlertOpen(false)}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Naiintindihan Ko (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Get Queue Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scale-up">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="text-rose-500" size={20} />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Kumuha ng Clinic Queue Ticket
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGetTicket} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">
                  Pangalan ng Pasyente
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Juan Dela Cruz"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-rose-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">
                  Uri ng Konsultasyon / Serbisyo
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-rose-500 text-slate-900 dark:text-white"
                >
                  {services.map((s, idx) => (
                    <option key={idx} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-300">Priority Lane</p>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400">Senior Citizen, PWD, Pregnant, o Emergency</p>
                </div>
                <input
                  type="checkbox"
                  checked={isPriority}
                  onChange={(e) => setIsPriority(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Kanselahin
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md shadow-rose-600/25 cursor-pointer"
                >
                  Kumuha ng Ticket
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default ClinicQueueView;

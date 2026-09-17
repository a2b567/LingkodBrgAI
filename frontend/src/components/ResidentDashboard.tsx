import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope, FileText, Calendar, Clock,
  PhoneCall, ShieldCheck, QrCode, ArrowRight,
  CheckCircle2, ChevronRight, Megaphone, Heart,
  Phone
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import type { Certificate, Appointment, Notification } from '../types';

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

  // Sync Clinic Queue from localStorage
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
  };

  useEffect(() => {
    syncClinicQueue();
    const interval = setInterval(syncClinicQueue, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [appRes, certRes, notifRes] = await Promise.allSettled([
          api.appointments.list(),
          api.certificates.list(),
          api.notifications.list()
        ]);

        if (appRes.status === 'fulfilled') {
          setAppointments(appRes.value || []);
        }
        if (certRes.status === 'fulfilled') {
          setCerts(certRes.value || []);
        }
        if (notifRes.status === 'fulfilled') {
          const filtered = (notifRes.value || []).filter(n =>
            n.type === 'Announcement' || n.type === 'General' || n.type === 'Alert' || n.type === 'Emergency'
          );
          setNotifications(filtered);
        }
      } catch (e) {
        console.error("Failed fetching resident dashboard data", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const activeClinicQueue = clinicQueue.filter(q => q.status === 'waiting');
  const nowServingClinic = activeClinicQueue[0] || null;

  const pendingCerts = certs.filter(c => c.status === 'Pending' || c.status === 'Processing');
  const pendingAppointments = appointments.filter(a => a.status === 'Pending' || a.status === 'Confirmed');

  const residentName = user?.resident
    ? `${user.resident.first_name} ${user.resident.last_name}`
    : user?.username || 'Resident';

  const hotlines = [
    { title: 'Emergency Response / 911', number: '911', desc: 'National Police & Emergency', color: 'bg-rose-500 text-white' },
    { title: 'Barangay San Isidro Hall', number: '(049) 501-2749', desc: 'Main Desk / Assistance', color: 'bg-gov-blue-600 text-white' },
    { title: 'Barangay Health Center / RHU', number: '(049) 501-2750', desc: 'Clinic & Ambulance', color: 'bg-emerald-600 text-white' },
    { title: 'PNP Local Police Station', number: '(049) 501-1122', desc: 'Police Assistance & Security', color: 'bg-indigo-600 text-white' },
    { title: 'BFP Bureau of Fire Protection', number: '(049) 501-3473', desc: 'Fire Rescue & Disaster', color: 'bg-amber-600 text-white' },
  ];

  if (isLoading) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-5 animate-pulse">
        <div className="h-40 bg-slate-200 dark:bg-slate-800/60 rounded-3xl" />
        <div className="h-24 bg-slate-200 dark:bg-slate-800/60 rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="h-28 bg-slate-200 dark:bg-slate-800/60 rounded-3xl" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800/60 rounded-3xl" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800/60 rounded-3xl" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800/60 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-5 pb-28">
      
      {/* Top Welcome & Resident ID Banner */}
      <div className="bg-gradient-to-r from-gov-blue-800 via-gov-blue-700 to-gov-blue-900 text-white rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 backdrop-blur-3xl transform skew-x-12 pointer-events-none" />
        <div className="ambient-glow glow-gold top-0 right-0 opacity-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-gov-gold-500/20 text-gov-gold-300 text-[10px] font-extrabold uppercase tracking-wider border border-gov-gold-500/30 flex items-center gap-1">
                <ShieldCheck size={12} /> Verified Resident
              </span>
              <span className="text-white/60 text-xs font-semibold">Brgy. San Isidro</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
              Mabuhay, {residentName}! 👋
            </h1>
            <p className="text-xs text-slate-200/90 max-w-md font-medium">
              Mag-request ng mga dokumento, i-monitor ang clinic queue, at magpa-schedule ng appointment nang mabilis.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            <button
              onClick={() => setShowIdModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold rounded-2xl border border-white/20 backdrop-blur-md transition-all shadow-sm"
            >
              <QrCode size={16} className="text-gov-gold-400" />
              <span>Digital ID & QR</span>
            </button>
            <button
              onClick={() => setShowHotlineModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-xs font-bold rounded-2xl shadow-lg shadow-rose-900/30 transition-all"
            >
              <PhoneCall size={16} />
              <span>SOS Hotlines</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barangay Clinic Live Status Spotlight Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center shrink-0 shadow-sm">
              <Stethoscope size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Barangay Clinic Live Queue
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                {nowServingClinic ? (
                  <>Now Serving: <strong className="text-gov-blue-600 dark:text-gov-blue-400">#{nowServingClinic.queueNumber} - {nowServingClinic.residentName}</strong> ({nowServingClinic.service})</>
                ) : (
                  <>Walang pasyenteng kasalukuyang kinokonsulta. Handa para sa susunod.</>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
            <div className="text-left sm:text-right">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nasa Pila</div>
              <div className="text-base font-black text-slate-800 dark:text-slate-200">
                {activeClinicQueue.length} {activeClinicQueue.length === 1 ? 'Patient' : 'Patients'}
              </div>
            </div>
            <Link
              to="/clinic-queue"
              className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-rose-500/20 active:scale-95 transition-all"
            >
              <span>Buksan ang Queue</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile-Friendly Main Services 4-Grid */}
      <div className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
          Pangunahing Serbisyong Publiko
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          {/* Card 1: Clinic Queue */}
          <Link
            to="/clinic-queue"
            className="group bg-gradient-to-b from-white to-rose-50/40 dark:from-slate-900 dark:to-rose-950/10 border border-slate-200/80 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700/50 rounded-3xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-md active:scale-95"
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Heart size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                Clinic Live Queue
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                Real-time monitor ng mga pasyente sa Health Center
              </p>
            </div>
            <div className="mt-3 flex items-center text-[10px] font-bold text-rose-600 dark:text-rose-400 gap-1">
              <span>View Queue</span>
              <ChevronRight size={12} />
            </div>
          </Link>

          {/* Card 2: Request Certificates */}
          <Link
            to="/certificates"
            className="group bg-gradient-to-b from-white to-gov-blue-50/40 dark:from-slate-900 dark:to-gov-blue-950/10 border border-slate-200/80 dark:border-slate-800 hover:border-gov-blue-300 dark:hover:border-gov-blue-700/50 rounded-3xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-md active:scale-95"
          >
            <div className="w-10 h-10 rounded-2xl bg-gov-blue-500/10 text-gov-blue-600 dark:text-gov-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileText size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                Barangay Certificates
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                Clearance, Indigency, Residency, at ID Request
              </p>
            </div>
            <div className="mt-3 flex items-center text-[10px] font-bold text-gov-blue-600 dark:text-gov-blue-400 gap-1">
              <span>Mag-request</span>
              <ChevronRight size={12} />
            </div>
          </Link>

          {/* Card 3: Appointments */}
          <Link
            to="/appointments"
            className="group bg-gradient-to-b from-white to-amber-50/40 dark:from-slate-900 dark:to-amber-950/10 border border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700/50 rounded-3xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-md active:scale-95"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Calendar size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                Appointments
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                Schedule ng hearing, consultation, o inquiry
              </p>
            </div>
            <div className="mt-3 flex items-center text-[10px] font-bold text-amber-600 dark:text-amber-400 gap-1">
              <span>Mag-book</span>
              <ChevronRight size={12} />
            </div>
          </Link>

          {/* Card 4: Certificates Schedule */}
          <Link
            to="/queue-schedule"
            className="group bg-gradient-to-b from-white to-purple-50/40 dark:from-slate-900 dark:to-purple-950/10 border border-slate-200/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700/50 rounded-3xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-md active:scale-95"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Clock size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                Pick-up Schedule
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                Oras at numero para sa pagkuha ng dokumento
              </p>
            </div>
            <div className="mt-3 flex items-center text-[10px] font-bold text-purple-600 dark:text-purple-400 gap-1">
              <span>Tingnan Pila</span>
              <ChevronRight size={12} />
            </div>
          </Link>

        </div>
      </div>

      {/* Active Requests Tracker (Appointments & Certificates) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Certificate Requests Status */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-gov-blue-600 dark:text-gov-blue-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Aking Mga Dokumento
              </h4>
            </div>
            <Link to="/certificates" className="text-[11px] font-bold text-gov-blue-600 dark:text-gov-blue-400 hover:underline">
              View All ({certs.length})
            </Link>
          </div>

          {pendingCerts.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <CheckCircle2 size={24} className="mx-auto text-slate-400 mb-1" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Walang pending na request</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Lahat ng iyong requests ay naproseso na.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingCerts.slice(0, 3).map(c => (
                <div key={c.id} className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{c.type}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Doc: {c.document_number}</p>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                    c.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                    c.status === 'Processing' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                    'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scheduled Appointments Status */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-amber-500" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Aking Mga Appointment
              </h4>
            </div>
            <Link to="/appointments" className="text-[11px] font-bold text-gov-blue-600 dark:text-gov-blue-400 hover:underline">
              View All ({appointments.length})
            </Link>
          </div>

          {pendingAppointments.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Calendar size={24} className="mx-auto text-slate-400 mb-1" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Walang naka-schedule</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Mag-book ng appointment para sa serbisyo.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingAppointments.slice(0, 3).map(a => (
                <div key={a.id} className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">#{a.queue_number} - {a.purpose}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{new Date(a.appointment_date).toLocaleDateString()} • {a.time_slot}</p>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                    a.status === 'Confirmed' ? 'bg-gov-blue-500/10 text-gov-blue-600 dark:text-gov-blue-400 border border-gov-blue-500/20' :
                    'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Community Advisories & Notifications Feed */}
      {notifications.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Megaphone size={16} className="text-gov-blue-600 dark:text-gov-blue-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Mga Anunsyo at Paalala ng Barangay
            </h4>
          </div>

          <div className="space-y-2">
            {notifications.slice(0, 3).map(n => (
              <div key={n.id} className="p-3.5 bg-gov-blue-50/40 dark:bg-gov-blue-950/20 rounded-2xl border border-gov-blue-100 dark:border-gov-blue-900/40 space-y-1">
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

      {/* SOS / Hotlines Modal */}
      {showHotlineModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/30">
                  <PhoneCall size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Emergency Hotlines
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">Barangay San Isidro Quick Dial</p>
                </div>
              </div>
              <button
                onClick={() => setShowHotlineModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {hotlines.map((h, i) => (
                <div key={i} className="p-3.5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-black text-slate-900 dark:text-white">{h.title}</h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{h.desc}</p>
                    <p className="text-xs font-mono font-black text-rose-600 dark:text-rose-400 mt-0.5">{h.number}</p>
                  </div>
                  <a
                    href={`tel:${h.number.replace(/[^0-9]/g, '')}`}
                    className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all ${h.color}`}
                  >
                    <Phone size={14} />
                    <span>Call</span>
                  </a>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowHotlineModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-2xl transition-colors"
            >
              Isara
            </button>
          </div>
        </div>
      )}

      {/* Digital Resident ID Modal */}
      {showIdModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-scale-up text-center">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-[10px] font-black uppercase text-gov-blue-600 dark:text-gov-blue-400 tracking-wider">
                Digital Resident ID Card
              </span>
              <button
                onClick={() => setShowIdModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                ✕
              </button>
            </div>

            {/* Virtual Card Preview */}
            <div className="bg-gradient-to-tr from-gov-blue-900 via-gov-blue-800 to-indigo-900 text-white rounded-2xl p-5 shadow-xl text-left relative overflow-hidden border border-white/20">
              <div className="flex justify-between items-start border-b border-white/10 pb-3 mb-3">
                <div>
                  <div className="text-[9px] font-extrabold uppercase text-gov-gold-400 tracking-widest">Republic of the Philippines</div>
                  <div className="text-xs font-black">Barangay San Isidro</div>
                  <div className="text-[8px] text-white/70">Official Resident Identity</div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-gov-gold-400/20 flex items-center justify-center text-gov-gold-400 font-extrabold text-[10px]">
                  ID
                </div>
              </div>

              <div className="space-y-1 my-3">
                <p className="text-[9px] uppercase tracking-wider text-white/60">Resident Name</p>
                <p className="text-sm font-black tracking-wide">{residentName}</p>
                <p className="text-[10px] text-white/80 font-mono">ID: {user?.resident?.qr_id || `RES-${user?.id?.slice(0, 8) || '2026'}`}</p>
              </div>

              <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[8px] text-white/70">
                <span>Status: VERIFIED</span>
                <span className="font-mono">VALID UNTIL: 2027</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 space-y-2">
              <div className="w-24 h-24 mx-auto bg-white p-2 rounded-xl shadow-inner flex items-center justify-center">
                <QrCode size={80} className="text-slate-900" />
              </div>
              <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                {user?.resident?.qr_id || `RES-${user?.id?.slice(0, 8) || '2026'}`}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                I-scan ito sa Barangay Kiosk o sa Front Desk para sa instant verification.
              </p>
            </div>

            <button
              onClick={() => setShowIdModal(false)}
              className="w-full py-2.5 bg-gov-blue-600 hover:bg-gov-blue-700 text-white text-xs font-bold rounded-2xl transition-colors shadow-md shadow-gov-blue-600/20"
            >
              Naiintindihan Ko
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

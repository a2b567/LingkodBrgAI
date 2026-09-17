import React, { useState, useEffect } from 'react';
import {
  Clock, CheckCircle2, AlertTriangle, Stethoscope,
  Heart, Users, Zap, Star, Activity, Plus,
  Ticket
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface QueueItem {
  id: string;
  residentName: string;
  service: string;
  queueNumber: number;
  timestamp: number;
  status: 'waiting' | 'served';
  isPriority?: boolean;
}

const CLINIC_QUEUE_KEY = 'lingkod_clinic_queue';
const MY_TICKET_KEY = 'lingkod_my_clinic_ticket';

// Initial realistic default queue data so mobile phone never opens to a blank screen
const DEFAULT_INITIAL_QUEUE: QueueItem[] = [
  {
    id: 'cq-101',
    residentName: 'Juan Dela Cruz',
    service: 'General Medical Consultation',
    queueNumber: 101,
    timestamp: Date.now() - 1000 * 60 * 15,
    status: 'waiting',
    isPriority: true,
  },
  {
    id: 'cq-102',
    residentName: 'Maria Santos',
    service: 'Prenatal & Maternal Checkup',
    queueNumber: 102,
    timestamp: Date.now() - 1000 * 60 * 10,
    status: 'waiting',
    isPriority: true,
  },
  {
    id: 'cq-103',
    residentName: 'Pedro Reyes',
    service: 'Blood Pressure & Vitals Check',
    queueNumber: 103,
    timestamp: Date.now() - 1000 * 60 * 5,
    status: 'waiting',
    isPriority: false,
  }
];

export const ClinicQueueView: React.FC = () => {
  const { user } = useAuthStore();
  const [queueList, setQueueList] = useState<QueueItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [liveDot, setLiveDot] = useState(true);
  
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

  const loadQueue = () => {
    try {
      const saved = localStorage.getItem(CLINIC_QUEUE_KEY);
      if (saved) {
        const parsed: QueueItem[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQueueList(parsed);
        } else {
          setQueueList(DEFAULT_INITIAL_QUEUE);
          localStorage.setItem(CLINIC_QUEUE_KEY, JSON.stringify(DEFAULT_INITIAL_QUEUE));
        }
      } else {
        setQueueList(DEFAULT_INITIAL_QUEUE);
        localStorage.setItem(CLINIC_QUEUE_KEY, JSON.stringify(DEFAULT_INITIAL_QUEUE));
      }

      // Check if user has their own ticket
      const savedMyTicket = localStorage.getItem(MY_TICKET_KEY);
      if (savedMyTicket) {
        setMyTicket(JSON.parse(savedMyTicket));
      }
      setLastUpdated(new Date());
    } catch {
      setQueueList(DEFAULT_INITIAL_QUEUE);
    }
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(() => {
      loadQueue();
      setLiveDot(d => !d);
    }, 2000);
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

  const handleGetTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const name = patientName.trim() || (user?.resident ? `${user.resident.first_name} ${user.resident.last_name}` : user?.username || 'Resident Patient');
    
    // Calculate next queue number
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
    } catch (err) {}

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
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Barangay Clinic Live Queue
              </h1>
              <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className={`w-1.5 h-1.5 rounded-full transition-colors ${liveDot ? 'bg-emerald-500' : 'bg-emerald-300'}`} />
                Live
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Barangay San Isidro Health & Wellness Center
            </p>
          </div>
        </div>

        {/* Action button to get queue ticket */}
        <button
          onClick={() => {
            if (user?.resident) {
              setPatientName(`${user.resident.first_name} ${user.resident.last_name}`);
            }
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 active:scale-95 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition-all"
        >
          <Plus size={16} />
          <span>Kumuha ng Queue Ticket</span>
        </button>
      </div>

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

      {/* Stats Cards (3 Columns) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        
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

        {/* Served Today */}
        <div className="bg-white dark:bg-slate-900 border border-emerald-400/30 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 text-center sm:text-left shadow-sm">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/50 shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Served</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-500">{servedQueue.length}</p>
          </div>
        </div>

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
              </div>
              <p className="text-base sm:text-xl font-bold opacity-95 mt-1">{nowServing.residentName}</p>
              <p className="text-xs opacity-80 mt-0.5 font-medium">{nowServing.service}</p>
            </div>

            {nextInLine && (
              <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 backdrop-blur-sm w-full sm:w-auto">
                <p className="text-[9px] font-black uppercase opacity-70 tracking-wider">Susunod na Pasyente</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-black text-lg">#{nextInLine.queueNumber}</span>
                  <span className="text-xs opacity-90 font-semibold truncate max-w-[150px]">{nextInLine.residentName}</span>
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

      {/* Queue Lists (Waiting Queue & Served) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
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
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.residentName}</p>
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

        {/* Served Today */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm p-4 sm:p-5">
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
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.residentName}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{item.service}</p>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">#{item.queueNumber}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Paunawa / Resident Note */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl">
        <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-black text-amber-800 dark:text-amber-300">Paalala para sa mga Pasyente</p>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed mt-0.5">
            Maaari kang kumuha ng Queue Ticket gamit ang button sa itaas o mag-walk in nang direkta sa Health Center. Mangyaring dalhin ang iyong Barangay ID o valid ID.
          </p>
          <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold mt-1">
            Auto-refresh bawat 2 segundo · Huling na-update: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      </div>

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
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl"
                >
                  Kanselahin
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md shadow-rose-600/25"
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

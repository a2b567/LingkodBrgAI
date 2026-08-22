import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, Clock, Volume2, VolumeX, Monitor, Plus, 
  ChevronLeft, ChevronRight, CheckCircle2, Zap, FileText, X, PhoneCall
} from 'lucide-react';

interface QueueSlot {
  id: string;
  ticket_number: string;
  resident_name: string;
  cert_type: string;
  date: string;
  time_slot: string;
  status: 'Waiting' | 'Serving' | 'Completed' | 'Cancelled';
  is_priority?: boolean;
}

export const QueueSchedule: React.FC = () => {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [queueSlots, setQueueSlots] = useState<QueueSlot[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form inputs for scheduling slot
  const [residentName, setResidentName] = useState('');
  const [certType, setCertType] = useState('Barangay Clearance');
  const [timeSlot, setTimeSlot] = useState('09:00 AM');
  const [isPriority, setIsPriority] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeSlots = [
    '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
  ];

  // Helper date formatting
  const formattedDateHeader = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).toUpperCase();

  const formattedDateShort = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).toUpperCase();

  // Generate current week dates for calendar view
  const getCurrentWeekDays = () => {
    const curr = new Date(selectedDate);
    const first = curr.getDate() - curr.getDay() + 1; // Monday
    const week = [];
    for (let i = 0; i < 7; i++) {
      const next = new Date(curr.setDate(first + i));
      week.push(next);
    }
    return week;
  };

  const weekDays = getCurrentWeekDays();

  // Voice Announcement helper using Web Speech API
  const announceQueueCall = (ticketNumber: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop ongoing speech
    const text = `Calling ticket number ${ticketNumber}, please proceed to counter 1 for document pickup.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Compute stats
  const waitingSlots = queueSlots.filter(s => s.status === 'Waiting');
  const nowServingSlot = queueSlots.find(s => s.status === 'Serving');
  const completedSlots = queueSlots.filter(s => s.status === 'Completed');
  const totalScheduled = queueSlots.length;

  const handleCallNext = () => {
    if (waitingSlots.length === 0) {
      alert("No tickets waiting in queue!");
      return;
    }

    const next = waitingSlots[0];
    setQueueSlots(prev => prev.map(s => {
      if (s.id === next.id) return { ...s, status: 'Serving' };
      if (s.status === 'Serving') return { ...s, status: 'Completed' };
      return s;
    }));

    announceQueueCall(next.ticket_number);
  };

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!residentName) return alert("Please enter resident name");
    setIsSubmitting(true);

    const prefix = isPriority ? 'P' : 'A';
    const num = Math.floor(100 + Math.random() * 900);
    const newSlot: QueueSlot = {
      id: Date.now().toString(),
      ticket_number: `${prefix}-${num}`,
      resident_name: residentName,
      cert_type: certType,
      date: selectedDate,
      time_slot: timeSlot,
      status: 'Waiting',
      is_priority: isPriority
    };

    setQueueSlots(prev => [...prev, newSlot]);
    setIsSubmitting(false);
    setIsModalOpen(false);
    setResidentName('');
  };

  const handleStatusChange = (id: string, status: QueueSlot['status']) => {
    setQueueSlots(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  return (
    <div className="space-y-6 relative z-10">
      {/* Top Header Tabs */}
      <div className="flex items-center justify-center sm:justify-start gap-2 bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-2xl w-max border border-slate-200/50 dark:border-slate-800">
        <Link
          to="/certificates"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
        >
          <FileText size={15} />
          Document Issuance & Approvals
        </Link>
        <Link
          to="/queue-schedule"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-gov-blue-600 text-white shadow-md shadow-gov-blue-600/20 transition-all"
        >
          <CalendarIcon size={15} />
          CERTIFICATES PICKUP & QUEUE SCHEDULE
        </Link>
      </div>

      {/* Title Header & Main Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-normal text-black dark:text-white uppercase">
            CERTIFICATES PICKUP & QUEUE SCHEDULE
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold tracking-wide">
            Schedule document collection slots, call live pickup queue numbers, and manage daily counter loads
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
              voiceEnabled 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20' 
                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {voiceEnabled ? 'Voice ON' : 'Voice OFF'}
          </button>

          <Link
            to="/kiosk/queue"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Monitor size={16} />
            Queue Monitor
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-gov-blue-600/20 transition-all active:scale-95"
          >
            <Plus size={16} />
            Schedule Queue Slot
          </button>
        </div>
      </div>

      {/* Row of 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Waiting */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-amber-500/30 dark:border-amber-500/20 shadow-sm relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">WAITING</span>
            <span className="text-3xl font-black text-amber-500">{waitingSlots.length}</span>
          </div>
        </div>

        {/* Now Serving */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-emerald-500/30 dark:border-emerald-500/20 shadow-sm relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
            <Zap size={24} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">NOW SERVING</span>
            <span className="text-3xl font-black text-emerald-500">{nowServingSlot ? nowServingSlot.ticket_number : '0'}</span>
          </div>
        </div>

        {/* Completed Today */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gov-blue-500/10 text-gov-blue-400 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">COMPLETED TODAY</span>
            <span className="text-3xl font-black text-slate-800 dark:text-white">{completedSlots.length}</span>
          </div>
        </div>

        {/* Scheduled */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
            <CalendarIcon size={24} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">SCHEDULED</span>
            <span className="text-3xl font-black text-slate-800 dark:text-white">{totalScheduled}</span>
          </div>
        </div>
      </div>

      {/* Big Action Banner - Call Next in Queue */}
      <button
        onClick={handleCallNext}
        className="w-full py-4 px-6 bg-gradient-to-r from-gov-blue-700 via-gov-blue-600 to-indigo-700 hover:from-gov-blue-800 hover:to-indigo-800 text-white rounded-3xl font-extrabold text-sm shadow-xl shadow-gov-blue-900/30 flex items-center justify-center gap-3 transition-all active:scale-[0.99] border border-gov-blue-500/30"
      >
        <PhoneCall size={20} className="animate-bounce" />
        <span className="tracking-wide">📢 Call Next in Queue</span>
      </button>

      {/* Main Grid: Weekly Schedule + Queue List */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Weekly Schedule & Slot Load (5 cols) */}
        <div className="md:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-slate-600 dark:text-slate-200 tracking-widest flex items-center gap-2">
              <CalendarIcon size={16} className="text-gov-blue-500" />
              WEEKLY SCHEDULE
            </h4>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              <button 
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() - 7);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-2 py-0.5 hover:underline text-gov-blue-500"
              >
                Today
              </button>
              <button 
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() + 7);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Days bar */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
              <span key={idx} className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">{day}</span>
            ))}
            {weekDays.map((d, idx) => {
              const dStr = d.toISOString().split('T')[0];
              const isSelected = dStr === selectedDate;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(dStr)}
                  className={`py-2 rounded-2xl text-xs font-bold transition-all ${
                    isSelected 
                      ? 'bg-gov-blue-600 text-white shadow-md shadow-gov-blue-600/30' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <div className="text-center text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            {formattedDateHeader}
          </div>

          {/* Slot Load list */}
          <div className="space-y-3 pt-2">
            <h5 className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest flex items-center gap-1.5">
              <Clock size={13} />
              SLOT LOAD
            </h5>

            <div className="space-y-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {timeSlots.map((slot) => {
                const count = queueSlots.filter(s => s.time_slot === slot && s.date === selectedDate).length;
                const maxLoad = 10;
                const percent = Math.min(100, (count / maxLoad) * 100);

                return (
                  <div key={slot} className="flex items-center gap-3">
                    <span className="w-16 font-mono text-[11px] font-bold">{slot}</span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-950/80 h-2.5 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800/60">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                          percent > 70 ? 'bg-rose-500' : percent > 40 ? 'bg-amber-500' : 'bg-gov-blue-500'
                        }`}
                        style={{ width: `${Math.max(4, percent)}%` }}
                      />
                    </div>
                    <span className="w-5 text-right font-mono font-bold text-[11px]">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Queue Slots for Date (7 cols) */}
        <div className="md:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-black uppercase text-slate-600 dark:text-slate-200 tracking-widest flex items-center gap-2">
                <FileText size={16} className="text-gov-blue-500" />
                QUEUE FOR {formattedDateShort}
              </h4>
              <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-xl">
                {queueSlots.filter(s => s.date === selectedDate).length} scheduled
              </span>
            </div>

            {queueSlots.filter(s => s.date === selectedDate).length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400">
                  <CalendarIcon size={28} />
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-300">No queue slots scheduled for this date</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-2xl font-bold text-xs transition-colors shadow-md shadow-gov-blue-600/20"
                >
                  + Schedule a Slot
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {queueSlots.filter(s => s.date === selectedDate).map((slot) => (
                  <div 
                    key={slot.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                      slot.status === 'Serving'
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/50'
                        : slot.status === 'Completed'
                        ? 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/60 opacity-60'
                        : 'bg-slate-50/50 dark:bg-slate-950/60 border-slate-200/60 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-gov-blue-600 dark:text-gov-blue-400">{slot.ticket_number}</span>
                        {slot.is_priority && (
                          <span className="text-[9px] bg-amber-500/10 text-amber-500 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                            Priority
                          </span>
                        )}
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                          slot.status === 'Serving' ? 'bg-emerald-500 text-white' :
                          slot.status === 'Completed' ? 'bg-slate-300 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                          'bg-amber-500/10 text-amber-500'
                        }`}>
                          {slot.status}
                        </span>
                      </div>
                      <p className="font-bold text-xs text-slate-800 dark:text-slate-100">{slot.resident_name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{slot.cert_type} • {slot.time_slot}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {slot.status === 'Waiting' && (
                        <button
                          onClick={() => {
                            handleStatusChange(slot.id, 'Serving');
                            announceQueueCall(slot.ticket_number);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-xl transition-colors"
                        >
                          Call Now
                        </button>
                      )}
                      {slot.status === 'Serving' && (
                        <button
                          onClick={() => handleStatusChange(slot.id, 'Completed')}
                          className="px-3 py-1.5 bg-gov-blue-600 hover:bg-gov-blue-700 text-white font-bold text-[10px] rounded-xl transition-colors"
                        >
                          Complete
                        </button>
                      )}
                      {slot.status !== 'Completed' && (
                        <button
                          onClick={() => handleStatusChange(slot.id, 'Cancelled')}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                          title="Cancel Slot"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal - Schedule Queue Slot */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl max-w-md w-full shadow-2xl p-6 glass-panel relative overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-widest flex items-center gap-2">
                <CalendarIcon className="text-gov-blue-500" size={18} />
                Schedule Queue Slot
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSlot} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-200 block mb-1">Resident Full Name</label>
                <input
                  type="text"
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                  required
                  placeholder="e.g. Lawrence Aranas"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-200 block mb-1">Document Type</label>
                <select
                  value={certType}
                  onChange={(e) => setCertType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white"
                >
                  <option value="Barangay Clearance">Barangay Clearance</option>
                  <option value="Indigency Certificate">Indigency Certificate</option>
                  <option value="Residency Certificate">Residency Certificate</option>
                  <option value="Business Clearance">Business Clearance</option>
                  <option value="Cedula (CTC)">Cedula (CTC)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-200 block mb-1">Pickup Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-200 block mb-1">Time Slot</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white"
                  >
                    {timeSlots.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="priorityCheck"
                  checked={isPriority}
                  onChange={(e) => setIsPriority(e.target.checked)}
                  className="rounded border-slate-300 text-gov-blue-600 focus:ring-gov-blue-500"
                />
                <label htmlFor="priorityCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Priority Queue (Senior Citizen / PWD / Pregnant)
                </label>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-xl font-bold text-xs transition-colors disabled:opacity-50"
                >
                  Confirm Queue Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default QueueSchedule;

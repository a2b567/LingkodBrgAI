import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, Clock, CheckCircle2, Zap } from 'lucide-react';
import logo from '../assets/logo.png';

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

export const QueueMonitor: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [queueSlots, setQueueSlots] = useState<QueueSlot[]>([]);
  const [lastAnnouncedTicket, setLastAnnouncedTicket] = useState<string | null>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll queue state from localStorage or mock every 2 seconds
  useEffect(() => {
    const loadQueue = () => {
      try {
        const saved = localStorage.getItem('lingkod_queue_slots');
        if (saved) {
          const parsed: QueueSlot[] = JSON.parse(saved);
          setQueueSlots(parsed);
        }
      } catch (e) {
        console.error("Failed loading queue state", e);
      }
    };

    loadQueue();
    const interval = setInterval(loadQueue, 2000);
    return () => clearInterval(interval);
  }, []);

  // AI Voice Announcement when a ticket turns to "Serving"
  const servingSlot = queueSlots.find(s => s.status === 'Serving');

  useEffect(() => {
    if (servingSlot && servingSlot.ticket_number !== lastAnnouncedTicket) {
      setLastAnnouncedTicket(servingSlot.ticket_number);
      
      if (voiceEnabled && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const text = `Attention. Now serving ticket number ${servingSlot.ticket_number}, ${servingSlot.resident_name}. Please proceed to Counter 1 for document issuance.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [servingSlot, lastAnnouncedTicket, voiceEnabled]);

  const formattedTime = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();

  const waitingSlots = queueSlots.filter(s => s.status === 'Waiting');
  const completedSlots = queueSlots.filter(s => s.status === 'Completed');
  const priorityWaiting = waitingSlots.filter(s => s.is_priority);
  const regularWaiting = waitingSlots.filter(s => !s.is_priority);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-8 flex flex-col justify-between select-none font-sans relative overflow-hidden">
      {/* Top Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gov-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Top Header Banner */}
      <header className="flex items-center justify-between pb-6 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Barangay Logo" className="w-14 h-14 object-contain rounded-2xl shadow-lg border border-slate-700 bg-slate-900 p-1" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider font-display">QUEUE MONITOR</h1>
            <p className="text-xs font-bold text-gov-blue-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              BARANGAY DOCUMENT PROCESSING • AI VOICE CONNECTED
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
              voiceEnabled 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-md' 
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{voiceEnabled ? 'AI Voice ON' : 'AI Voice OFF'}</span>
          </button>

          <div className="text-right">
            <div className="text-3xl font-black font-mono tracking-tight text-white">{formattedTime}</div>
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{formattedDate}</div>
          </div>
        </div>
      </header>

      {/* Center Main Display Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6 flex-1 items-stretch relative z-10">
        
        {/* Main "NOW SERVING" Card (2 cols) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900 to-gov-blue-950/40 p-8 rounded-3xl border border-gov-blue-500/40 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gov-blue-500/10 rounded-full blur-3xl"></div>
          
          <span className="text-xs font-black uppercase text-gov-blue-400 tracking-[0.25em] mb-2 flex items-center gap-2">
            <Sparkles size={18} className="text-gov-gold-400 animate-pulse" />
            NOW SERVING
          </span>

          <div className="text-7xl sm:text-8xl lg:text-9xl font-black font-mono tracking-wider text-white my-4 drop-shadow-2xl text-gov-gold-300">
            {servingSlot ? servingSlot.ticket_number : '-- --'}
          </div>

          {servingSlot && (
            <div className="text-base sm:text-lg font-extrabold text-slate-200 mb-2">
              {servingSlot.resident_name} • <span className="text-gov-blue-400">{servingSlot.cert_type}</span>
            </div>
          )}

          <div className="mt-2 px-6 py-2 bg-gov-blue-500/20 text-gov-blue-300 rounded-full border border-gov-blue-500/30 font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
            <Zap size={16} className="text-amber-400" />
            Counter 1 • Document Issuance
          </div>
        </div>

        {/* Right Status Overview Cards (1 col) */}
        <div className="flex flex-col gap-4">
          <div className="flex-1 bg-slate-900/90 p-6 rounded-3xl border border-amber-500/30 flex items-center justify-between shadow-md">
            <div>
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">WAITING IN QUEUE</span>
              <span className="text-5xl font-black text-amber-400 mt-1 block font-mono">{waitingSlots.length}</span>
            </div>
            <Clock size={32} className="text-amber-400/40" />
          </div>

          <div className="flex-1 bg-slate-900/90 p-6 rounded-3xl border border-emerald-500/30 flex items-center justify-between shadow-md">
            <div>
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">NOW SERVING</span>
              <span className="text-5xl font-black text-emerald-400 mt-1 block font-mono">{servingSlot ? 1 : 0}</span>
            </div>
            <Zap size={32} className="text-emerald-400/40" />
          </div>

          <div className="flex-1 bg-slate-900/90 p-6 rounded-3xl border border-slate-800 flex items-center justify-between shadow-md">
            <div>
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">COMPLETED TODAY</span>
              <span className="text-5xl font-black text-white mt-1 block font-mono">{completedSlots.length}</span>
            </div>
            <CheckCircle2 size={32} className="text-slate-600" />
          </div>
        </div>

      </div>

      {/* Bottom Queue Lists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        
        {/* Priority Queue Card */}
        <div className="bg-slate-900/90 p-6 rounded-3xl border border-amber-500/30 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
              ⭐ PRIORITY QUEUE (SENIOR / PWD / PREGNANT)
            </h3>
            <span className="text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full">
              {priorityWaiting.length} waiting
            </span>
          </div>

          {priorityWaiting.length === 0 ? (
            <div className="py-8 text-center text-xs font-bold text-slate-500">
              No priority tickets waiting
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {priorityWaiting.map(s => (
                <div key={s.id} className="px-3.5 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl font-mono font-black text-sm">
                  {s.ticket_number}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Regular Queue Card */}
        <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
              📁 REGULAR QUEUE
            </h3>
            <span className="text-[10px] font-extrabold bg-slate-800 text-slate-400 px-3 py-1 rounded-full">
              {regularWaiting.length} waiting
            </span>
          </div>

          {regularWaiting.length === 0 ? (
            <div className="py-8 text-center text-xs font-bold text-slate-500">
              No regular tickets waiting
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {regularWaiting.map(s => (
                <div key={s.id} className="px-3.5 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl font-mono font-black text-sm">
                  {s.ticket_number}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Footer ticker */}
      <footer className="pt-6 border-t border-slate-800 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center justify-center gap-2 relative z-10">
        <Clock size={12} />
        LINGKODBRGAI • AI VOICE ANNOUNCEMENT SYSTEM CONNECTED
      </footer>
    </div>
  );
};
export default QueueMonitor;

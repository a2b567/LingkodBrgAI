import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, Clock } from 'lucide-react';
import logo from '../assets/logo.png';

export const QueueMonitor: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-8 flex flex-col justify-between select-none font-sans">
      {/* Top Header Banner */}
      <header className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Barangay Logo" className="w-14 h-14 object-contain rounded-2xl shadow-lg border border-slate-700" />
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-wider">QUEUE MONITOR</h1>
            <p className="text-xs font-bold text-gov-blue-400 uppercase tracking-widest">BARANGAY DOCUMENT PROCESSING</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-extrabold"
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{voiceEnabled ? 'Voice ON' : 'Voice OFF'}</span>
          </button>

          <div className="text-right">
            <div className="text-3xl font-black font-mono tracking-tight text-white">{formattedTime}</div>
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{formattedDate}</div>
          </div>
        </div>
      </header>

      {/* Center Main Display Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6 flex-1 items-stretch">
        
        {/* Main "NOW SERVING" Card (2 cols) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 p-8 rounded-3xl border border-gov-blue-500/30 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gov-blue-500/5 rounded-full blur-3xl"></div>
          
          <span className="text-xs font-black uppercase text-gov-blue-400 tracking-[0.25em] mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-gov-gold-400 animate-pulse" />
            NOW SERVING
          </span>

          <div className="text-8xl lg:text-9xl font-black font-mono tracking-wider text-white my-4 drop-shadow-2xl">
            -- --
          </div>

          <div className="mt-4 px-6 py-2 bg-gov-blue-500/10 text-gov-blue-300 rounded-full border border-gov-blue-500/20 font-bold text-sm uppercase tracking-wider">
            Counter 1 • Document Issuance
          </div>
        </div>

        {/* Right Status Overview Cards (1 col) */}
        <div className="flex flex-col gap-4">
          <div className="flex-1 bg-slate-900/80 p-6 rounded-3xl border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">WAITING</span>
              <span className="text-5xl font-black text-amber-400 mt-1 block">0</span>
            </div>
          </div>

          <div className="flex-1 bg-slate-900/80 p-6 rounded-3xl border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">SERVING</span>
              <span className="text-5xl font-black text-emerald-400 mt-1 block">0</span>
            </div>
          </div>

          <div className="flex-1 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">COMPLETED</span>
              <span className="text-5xl font-black text-white mt-1 block">0</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Queue Lists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Priority Queue Card */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-amber-500/20 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
              ⭐ PRIORITY QUEUE
            </h3>
            <span className="text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full">
              0 waiting
            </span>
          </div>
          <div className="py-10 text-center text-xs font-bold text-slate-500">
            No priority tickets
          </div>
        </div>

        {/* Regular Queue Card */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
              📁 REGULAR QUEUE
            </h3>
            <span className="text-[10px] font-extrabold bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full">
              0 waiting
            </span>
          </div>
          <div className="py-10 text-center text-xs font-bold text-slate-500">
            No tickets in queue
          </div>
        </div>

      </div>

      {/* Footer ticker */}
      <footer className="pt-6 border-t border-slate-800 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center justify-center gap-2">
        <Clock size={12} />
        LINGKODBRGAI • AUTO-REFRESHES EVERY 5 SECONDS
      </footer>
    </div>
  );
};
export default QueueMonitor;

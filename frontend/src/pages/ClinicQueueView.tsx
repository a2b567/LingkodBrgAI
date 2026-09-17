import React, { useState, useEffect } from 'react';
import {
  Clock, CheckCircle2, AlertTriangle, Stethoscope,
  Heart, Users, RefreshCw, Zap, Star, Activity
} from 'lucide-react';

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

export const ClinicQueueView: React.FC = () => {
  const [queueList, setQueueList] = useState<QueueItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [liveDot, setLiveDot] = useState(true);

  const loadQueue = () => {
    try {
      const saved = localStorage.getItem(CLINIC_QUEUE_KEY);
      const parsed: QueueItem[] = saved ? JSON.parse(saved) : [];
      setQueueList(parsed);
      setLastUpdated(new Date());
    } catch {
      setQueueList([]);
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

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6 pb-24">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-600 flex items-center justify-center text-white shadow-xl shadow-rose-500/30 ring-4 ring-rose-500/10 shrink-0">
            <Heart size={28} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Barangay Clinic Live Queue
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
              Real-time view of the Barangay Health Center queue
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
          <span className={`w-2 h-2 rounded-full transition-colors ${liveDot ? 'bg-emerald-500' : 'bg-emerald-300'}`} />
          <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Live</span>
          <RefreshCw size={11} className="text-emerald-500 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-amber-400/30 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/50">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Waiting</p>
            <p className="text-2xl font-black text-amber-500">{activeQueue.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-rose-400/30 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center border border-rose-200/60 dark:border-rose-800/50">
            <Stethoscope size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Now Serving</p>
            <p className="text-2xl font-black text-rose-500">{nowServing ? `#${nowServing.queueNumber}` : '—'}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-emerald-400/30 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/50">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Served Today</p>
            <p className="text-2xl font-black text-emerald-500">{servedQueue.length}</p>
          </div>
        </div>
      </div>

      {/* Now Serving Banner */}
      <div className={`rounded-3xl p-6 border transition-all duration-500 ${
        nowServing
          ? 'bg-gradient-to-br from-rose-600 via-rose-700 to-pink-700 border-rose-500/50 shadow-xl shadow-rose-600/20 text-white'
          : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-2 flex items-center gap-1.5">
          <Zap size={11} /> Now Being Served
        </p>
        {nowServing ? (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-4xl font-black tracking-tight">#{nowServing.queueNumber}</p>
              <p className="text-lg font-bold opacity-90 mt-1">{nowServing.residentName}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs font-bold opacity-70">{nowServing.service}</span>
                {nowServing.isPriority && (
                  <span className="text-[9px] font-black bg-amber-400/20 text-amber-200 border border-amber-400/30 px-2 py-0.5 rounded-full uppercase">Priority</span>
                )}
              </div>
            </div>
            {nextInLine && (
              <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase opacity-60">Next Up</p>
                <p className="font-black text-xl">#{nextInLine.queueNumber}</p>
                <p className="text-xs opacity-80 font-semibold">{nextInLine.residentName}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <Activity size={20} className="opacity-40" />
            <p className="text-base font-bold">No patient is currently being served</p>
          </div>
        )}
      </div>

      {/* Queue Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Waiting */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6">
          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2"><Clock size={16} className="text-amber-500" /> Waiting Queue</span>
            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-black border border-amber-500/20">{activeQueue.length} waiting</span>
          </h3>
          {activeQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
              <Users size={32} className="text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-bold text-slate-400 dark:text-slate-600">Queue is empty — no patients waiting</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {activeQueue.map((item, idx) => (
                <div key={item.id} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                  idx === 0
                    ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300/60 dark:border-rose-800/50 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0 ${
                    item.isPriority ? 'bg-amber-500 text-white shadow-amber-500/30'
                    : idx === 0 ? 'bg-rose-600 text-white shadow-rose-600/30'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    #{item.queueNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.residentName}</p>
                      {item.isPriority && <Star size={10} className="text-amber-500 fill-amber-500 flex-shrink-0" />}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{item.service}</p>
                  </div>
                  {idx === 0 && (
                    <span className="text-[9px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-lg uppercase tracking-wide flex-shrink-0">Up Next</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Served */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6">
          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Served Today</span>
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-black border border-emerald-500/20">{servedQueue.length} done</span>
          </h3>
          {servedQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
              <CheckCircle2 size={32} className="text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-bold text-slate-400 dark:text-slate-600">No patients served yet today</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {servedQueue.slice(0, 10).map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl border bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200/60 dark:border-emerald-900/40 opacity-80">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm flex-shrink-0">✓</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{item.residentName}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{item.service}</p>
                  </div>
                  <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400">#{item.queueNumber}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resident Notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl">
        <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-black text-amber-800 dark:text-amber-300">Resident Note</p>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed mt-0.5">
            This is a read-only live view of the Barangay Clinic queue. To get a queue ticket, please visit the Barangay Health Center in person and ask the Health Worker on duty.
          </p>
          <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold mt-1.5">
            Auto-refreshing every 2s · Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      </div>

    </div>
  );
};

export default ClinicQueueView;

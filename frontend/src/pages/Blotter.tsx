import React, { useState, useEffect } from 'react';
import { AlertOctagon, Plus, Cpu, Sparkles, Calendar, Scale, Search } from 'lucide-react';
import { api } from '../services/api';
import type { Blotter } from '../types';

const formatHearingSchedule = (sched: any): string => {
  if (!sched) return '';
  if (typeof sched === 'string') {
    return sched;
  }
  if (typeof sched === 'object') {
    const dateVal = sched.hearing_date || sched.hearingDate;
    const remarksVal = sched.remarks || '';
    if (!dateVal) return JSON.stringify(sched);
    
    try {
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) {
        const dateStr = d.toLocaleDateString(undefined, { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        const timeStr = d.toLocaleTimeString(undefined, { 
          hour: 'numeric', 
          minute: '2-digit' 
        });
        return `${dateStr} @ ${timeStr}${remarksVal ? ` - ${remarksVal}` : ''}`;
      }
    } catch (e) {
      // Fallback
    }
    return `${dateVal}${remarksVal ? ` - ${remarksVal}` : ''}`;
  }
  return String(sched);
};

const convertToISODateTime = (dateStr: string, timeStr: string): string => {
  try {
    const [time, modifier] = timeStr.split(' ');
    let [hoursStr, minutesStr] = time.split(':');
    let hours = parseInt(hoursStr, 10);
    if (hours === 12) {
      hours = 0;
    }
    if (modifier === 'PM') {
      hours += 12;
    }
    return `${dateStr}T${hours.toString().padStart(2, '0')}:${minutesStr}:00Z`;
  } catch (e) {
    return `${dateStr}T09:00:00Z`; // fallback
  }
};

export const BlotterPage: React.FC = () => {
  const [cases, setCases] = useState<Blotter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form states
  const [complainant, setComplainant] = useState('');
  const [respondent, setRespondent] = useState('');
  const [details, setDetails] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hearing modal state
  const [selectedCase, setSelectedCase] = useState<Blotter | null>(null);
  const [isHearingModalOpen, setIsHearingModalOpen] = useState(false);
  const [hearingDate, setHearingDate] = useState('');
  const [hearingTime, setHearingTime] = useState('09:00 AM');
  const [isSummarizing, setIsSummarizing] = useState<string | null>(null);

  const fetchCases = async () => {
    setIsLoading(true);
    try {
      const data = await api.blotters.list();
      setCases(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.blotters.create({
        complainant,
        respondent,
        details,
        incident_date: new Date(incidentDate).toISOString(),
        status: 'Pending',
        hearing_schedules: '[]'
      });

      setIsModalOpen(false);
      setComplainant('');
      setRespondent('');
      setDetails('');
      setIncidentDate('');
      fetchCases();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to log case");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSummarize = async (id: string) => {
    setIsSummarizing(id);
    try {
      const res = await api.blotters.summarize(id);
      // Update case summary locally
      setCases(prev => prev.map(c => c.id === id ? { ...c, ai_summary: res.summary } : c));
    } catch (err: any) {
      alert(err.response?.data?.error || "AI Summarization failed");
    } finally {
      setIsSummarizing(null);
    }
  };

  const handleScheduleHearing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    try {
      let currentSchedules: any[] = [];
      try {
        if (selectedCase.hearing_schedules) {
          currentSchedules = JSON.parse(selectedCase.hearing_schedules);
        }
      } catch (err) {
        currentSchedules = [];
      }

      const isoDateTime = convertToISODateTime(hearingDate, hearingTime);
      const newScheduleObj = {
        hearing_date: isoDateTime,
        remarks: "Scheduled Peace Hearing"
      };
      const updatedSchedules = JSON.stringify([...currentSchedules, newScheduleObj]);

      await api.blotters.update(selectedCase.id, {
        hearing_schedules: updatedSchedules
      });

      setIsHearingModalOpen(false);
      setHearingDate('');
      fetchCases();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to schedule hearing");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.blotters.update(id, { status: newStatus });
      fetchCases();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update case status");
    }
  };

  const filteredCases = cases.filter(c => {
    const complainantMatch = c.complainant.toLowerCase().includes(search.toLowerCase());
    const respondentMatch = c.respondent.toLowerCase().includes(search.toLowerCase());
    const caseNoMatch = c.case_number.toLowerCase().includes(search.toLowerCase());
    const statusMatch = statusFilter === '' || c.status === statusFilter;
    return (complainantMatch || respondentMatch || caseNoMatch) && statusMatch;
  });

  return (
    <div className="space-y-6 relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-normal text-black dark:text-white">BLOTTER & INCIDENT REGISTRY</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wide">Official records of disputes, public disturbance logs, scheduled peace hearings, and AI incident digests</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-rose-600/20 transition-all active:scale-95"
        >
          <Plus size={16} />
          Report Incident (File Blotter)
        </button>
      </div>

      {/* Main Grid for Filter, Search & Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search case #, complainant, respondent..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-700 dark:text-slate-200"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {['', 'Pending', 'Active', 'Settled', 'Dismissed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${
                  statusFilter === status 
                    ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/30 dark:border-rose-900' 
                    : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                {status || 'All Status'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-10 text-center text-xs font-bold text-slate-500 dark:text-slate-400">Loading blotter database...</div>
          ) : filteredCases.length === 0 ? (
            <div className="p-10 text-center text-xs font-bold text-slate-500 dark:text-slate-400">No blotter logs found matching criteria.</div>
          ) : (
            <div className="p-6 space-y-6">
              {filteredCases.map((c) => {
                let schedules: any[] = [];
                try {
                  if (c.hearing_schedules) {
                    schedules = JSON.parse(c.hearing_schedules);
                  }
                } catch (err) {
                  schedules = [];
                }

                return (
                  <div key={c.id} className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col md:flex-row gap-6 relative overflow-hidden group">
                    <div className="flex-1 space-y-4">
                      {/* Case details header */}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="font-mono font-black text-xs text-gov-blue-700 dark:text-gov-blue-300 block">
                            {c.case_number}
                          </span>
                          <h4 className="font-bold text-sm text-black dark:text-slate-200 mt-1">
                            {c.complainant} <span className="text-slate-500 dark:text-slate-400 font-medium">vs</span> {c.respondent}
                          </h4>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">
                            Incident Date: {new Date(c.incident_date).toLocaleDateString()} • Filed: {new Date(c.filing_date).toLocaleDateString()}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          c.status === 'Settled'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : c.status === 'Active'
                            ? 'bg-gov-blue-50 text-gov-blue-600 dark:bg-gov-blue-950/20 dark:text-gov-blue-400'
                            : c.status === 'Pending'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {c.status}
                        </span>
                      </div>

                      {/* Details of Incident */}
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/40 dark:border-slate-800/40">
                        <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed font-medium">
                          {c.details}
                        </p>
                      </div>

                      {/* AI Agent Summarizer Section */}
                      <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white p-4 rounded-2xl border border-slate-800/80 shadow-md">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <Cpu size={16} className="text-gov-gold-400 animate-pulse-subtle" />
                            <span className="text-[10px] font-black uppercase text-gov-gold-300 tracking-wider">AI Case Summary</span>
                          </div>
                          <button
                            onClick={() => handleSummarize(c.id)}
                            disabled={isSummarizing === c.id}
                            className="flex items-center gap-1 text-[9px] font-bold bg-gov-blue-800 text-gov-gold-400 border border-gov-gold-400/20 px-2.5 py-1 rounded-lg hover:bg-gov-blue-700 transition-colors disabled:opacity-50"
                          >
                            <Sparkles size={10} />
                            {isSummarizing === c.id ? 'Analyzing...' : c.ai_summary ? 'Re-Analyze Case' : 'Analyze with AI'}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-300 mt-2 leading-relaxed font-medium">
                          {c.ai_summary || 'No AI summary generated for this case. Click "Analyze with AI" to generate a strategic dispute digest.'}
                        </p>
                      </div>
                    </div>

                    {/* Hearing scheduling & actions panel */}
                    <div className="w-full md:w-60 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0 md:pl-6 space-y-4">
                      <div>
                        <h5 className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5 mb-2.5">
                          <Calendar size={13} className="text-gov-blue-500" />
                          Peace Hearing Schedules
                        </h5>
                        <div className="space-y-1.5">
                          {schedules.map((sched, sIdx) => (
                            <div key={sIdx} className="text-[10px] font-bold bg-gov-blue-50/50 dark:bg-gov-blue-950/20 text-gov-blue-700 dark:text-gov-blue-300 px-2.5 py-1.5 rounded-xl border border-gov-blue-100 dark:border-gov-blue-900/40">
                              Session {sIdx + 1}: {formatHearingSchedule(sched)}
                            </div>
                          ))}
                          {schedules.length === 0 && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 italic">No hearings scheduled yet.</div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            setSelectedCase(c);
                            setIsHearingModalOpen(true);
                          }}
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
                        >
                          Schedule Hearing
                        </button>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateStatus(c.id, 'Settled')}
                            className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold transition-all"
                          >
                            Mark Settled
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(c.id, 'Dismissed')}
                            className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-lg text-[10px] font-bold transition-all"
                          >
                            Dismiss Case
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Incident Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl max-w-md w-full shadow-2xl p-6 glass-panel relative overflow-hidden animate-scale-up">
            <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-widest flex items-center gap-2 mb-4">
              <AlertOctagon className="text-rose-500" size={18} />
              Log Blotter Case File
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Complainant (Accuser)</label>
                  <input
                    type="text"
                    value={complainant}
                    onChange={(e) => setComplainant(e.target.value)}
                    required
                    placeholder="Full name of complainant..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-700 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Respondent (Accused)</label>
                  <input
                    type="text"
                    value={respondent}
                    onChange={(e) => setRespondent(e.target.value)}
                    required
                    placeholder="Full name of respondent..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Incident Date & Time</label>
                <input
                  type="datetime-local"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  required
                  title="Incident Date & Time"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-700 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Incident Case Details</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  required
                  placeholder="Provide detailed description of the dispute, physical damages, witnesses, or public peace violation..."
                  rows={4}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-700 dark:text-slate-200 resize-none"
                />
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
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-colors disabled:opacity-50 shadow-md shadow-rose-600/10"
                >
                  {isSubmitting ? 'Logging...' : 'File Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hearing Scheduler Modal */}
      {isHearingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl max-w-sm w-full shadow-2xl p-6 glass-panel relative overflow-hidden animate-scale-up">
            <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-widest flex items-center gap-2 mb-4">
              <Scale className="text-gov-blue-500" size={18} />
              Schedule Peace Mediation
            </h3>

            <form onSubmit={handleScheduleHearing} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Hearing Date</label>
                <input
                  type="date"
                  value={hearingDate}
                  onChange={(e) => setHearingDate(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  title="Hearing Date"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-700 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Hearing Time</label>
                <select
                  value={hearingTime}
                  onChange={(e) => setHearingTime(e.target.value)}
                  title="Hearing Time"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-700 dark:text-slate-200"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="01:30 PM">01:30 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsHearingModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-xl font-bold text-xs transition-colors"
                >
                  Book Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default BlotterPage;

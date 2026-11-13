import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Clock, AlertTriangle, Check, X, TrendingUp, Plus,
  Scale, ExternalLink, Search, Eye, EyeOff, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Appointment, Resident, Blotter } from '../types';
import { useAuthStore } from '../store/authStore';
import { usePrivacyStore } from '../store/privacyStore';
import { maskName } from '../utils/privacy';

export interface UnifiedSchedule {
  id: string;
  source: 'appointment' | 'blotter';
  queue_number: string | number;
  resident_name: string;
  complainant?: string;
  respondent?: string;
  purpose: string;
  date_iso: string;
  date_display: string;
  time_display: string;
  status: string;
  rawDate: Date;
  blotterCaseNumber?: string;
  blotterCaseId?: string;
  session_title?: string;
  appointmentRef?: Appointment;
}

export const Appointments: React.FC = () => {
  const { user } = useAuthStore();
  const { isPrivacyMode, isItemRevealed, toggleRevealItem } = usePrivacyStore();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blotters, setBlotters] = useState<Blotter[]>([]);
  const [congestion, setCongestion] = useState<{ date: string; bookings_count: number; congestion_risk: string }[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter and search states
  const [activeTab, setActiveTab] = useState<'all' | 'appointments' | 'blotters'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  // Form inputs for booking standard appointment
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('09:00 AM - 10:00 AM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStaff = user && user.role !== 'Resident';

  const timeSlots = [
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '01:00 PM - 02:00 PM',
    '02:00 PM - 03:00 PM',
    '03:00 PM - 04:00 PM',
    '05:00 PM - 06:00 PM',
  ];

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [appRes, blotterRes] = await Promise.allSettled([
        api.appointments.list(),
        api.blotters.list()
      ]);

      if (appRes.status === 'fulfilled') {
        setAppointments(appRes.value || []);
      }
      if (blotterRes.status === 'fulfilled') {
        setBlotters(blotterRes.value || []);
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCongestion = async () => {
    try {
      const data = await api.appointments.getCongestion();
      setCongestion(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchResidents = async () => {
    if (isStaff) {
      try {
        const res = await api.residents.list({ limit: 100 });
        setResidents(res.data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    fetchData();
    fetchCongestion();
    fetchResidents();
  }, [fetchData]);

  // Unified Schedule builder: merges standard appointments + Blotter Peace Hearing sessions
  const unifiedSchedules = useMemo<UnifiedSchedule[]>(() => {
    const list: UnifiedSchedule[] = [];

    // 1. Process regular Appointments
    appointments.forEach((app) => {
      const d = new Date(app.appointment_date);
      const isValid = !isNaN(d.getTime());
      const dateIso = isValid ? d.toISOString().split('T')[0] : String(app.appointment_date).split('T')[0];
      const dateDisplay = isValid
        ? d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
        : String(app.appointment_date);

      list.push({
        id: `app-${app.id}`,
        source: 'appointment',
        queue_number: `#${app.queue_number}`,
        resident_name: app.resident ? `${app.resident.first_name} ${app.resident.last_name}` : 'Resident Profile',
        purpose: app.purpose,
        date_iso: dateIso,
        date_display: dateDisplay,
        time_display: app.time_slot,
        status: app.status,
        rawDate: isValid ? d : new Date(),
        appointmentRef: app,
      });
    });

    // 2. Process Blotter Peace Mediation Hearings
    blotters.forEach((caseItem) => {
      if (!caseItem.hearing_schedules) return;
      let schedules: any[] = [];
      try {
        schedules = typeof caseItem.hearing_schedules === 'string'
          ? JSON.parse(caseItem.hearing_schedules)
          : caseItem.hearing_schedules;
      } catch (_) {
        schedules = [];
      }
      if (!Array.isArray(schedules)) return;

      schedules.forEach((sched, idx) => {
        const rawDate = sched.hearing_date || sched.hearingDate || sched.date;
        if (!rawDate) return;

        const d = new Date(rawDate);
        const isValid = !isNaN(d.getTime());
        const dateIso = isValid ? d.toISOString().split('T')[0] : String(rawDate).split('T')[0];
        const dateDisplay = isValid
          ? d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
          : String(rawDate).split('T')[0];
        const timeDisplay = isValid
          ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
          : '05:00 PM';

        const sessionTitle = `Session ${idx + 1}`;
        const remarks = sched.remarks || 'Scheduled Peace Hearing';

        list.push({
          id: `blotter-${caseItem.id}-${idx}`,
          source: 'blotter',
          queue_number: caseItem.case_number,
          resident_name: `${caseItem.complainant} vs ${caseItem.respondent}`,
          complainant: caseItem.complainant,
          respondent: caseItem.respondent,
          purpose: `Peace Mediation (${sessionTitle}) - ${remarks}`,
          date_iso: dateIso,
          date_display: dateDisplay,
          time_display: timeDisplay,
          status: caseItem.status === 'Settled' ? 'Settled' : caseItem.status === 'Dismissed' ? 'Dismissed' : 'Scheduled',
          rawDate: isValid ? d : new Date(),
          blotterCaseNumber: caseItem.case_number,
          blotterCaseId: caseItem.id,
          session_title: sessionTitle,
        });
      });
    });

    // Sort chronologically
    return list.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
  }, [appointments, blotters]);

  // Combined 7-Day Congestion Forecast (incorporating appointments + peace mediation hearings)
  const dynamicCongestion = useMemo(() => {
    const now = new Date();
    const days: { date: string; bookings_count: number; congestion_risk: string }[] = [];

    for (let i = 0; i < 7; i++) {
      const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const dateKey = target.toISOString().split('T')[0];

      // Count all items scheduled on this day
      const countOnDay = unifiedSchedules.filter((s) => s.date_iso === dateKey).length;

      // Backend match if present
      const backendMatch = congestion.find(c => c.date && c.date.split('T')[0] === dateKey);
      const backendCount = backendMatch ? Number(backendMatch.bookings_count) : 0;

      const totalBookings = Math.max(countOnDay, backendCount);

      let risk = 'Low';
      if (totalBookings > 10) risk = 'High';
      else if (totalBookings > 4) risk = 'Medium';

      days.push({
        date: dateKey,
        bookings_count: totalBookings,
        congestion_risk: risk,
      });
    }
    return days;
  }, [unifiedSchedules, congestion]);

  // Filtered schedules for the table
  const filteredSchedules = useMemo(() => {
    return unifiedSchedules.filter((item) => {
      if (activeTab === 'appointments' && item.source !== 'appointment') return false;
      if (activeTab === 'blotters' && item.source !== 'blotter') return false;

      if (selectedDateFilter && item.date_iso !== selectedDateFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.resident_name.toLowerCase().includes(q);
        const matchesPurpose = item.purpose.toLowerCase().includes(q);
        const matchesRef = String(item.queue_number).toLowerCase().includes(q);
        if (!matchesName && !matchesPurpose && !matchesRef) return false;
      }

      return true;
    });
  }, [unifiedSchedules, activeTab, selectedDateFilter, searchQuery]);

  const appointmentsCount = useMemo(() => {
    return unifiedSchedules.filter(s => s.source === 'appointment').length;
  }, [unifiedSchedules]);

  const blottersCount = useMemo(() => {
    return unifiedSchedules.filter(s => s.source === 'blotter').length;
  }, [unifiedSchedules]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const residentId = isStaff ? selectedResidentId : user?.resident_id;
      if (!residentId) {
        alert("No resident profile associated with this account. Please update your profile.");
        setIsSubmitting(false);
        return;
      }

      await api.appointments.book({
        resident_id: residentId,
        purpose,
        appointment_date: appointmentDate.includes('T') ? appointmentDate : `${appointmentDate}T09:00:00Z`,
        time_slot: timeSlot
      });

      setIsModalOpen(false);
      setPurpose('');
      setAppointmentDate('');
      fetchData();
      fetchCongestion();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to book appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.appointments.updateStatus(id, status);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update appointment status");
    }
  };

  const getRiskForDate = (dateStr: string) => {
    if (!dateStr) return null;
    const formatted = new Date(dateStr).toISOString().split('T')[0];
    const match = dynamicCongestion.find(c => c.date.split('T')[0] === formatted);
    return match ? match.congestion_risk : 'Low';
  };

  return (
    <div className="space-y-6 relative z-10">
      {/* Header Title & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white tracking-tight uppercase">
              Appointments & Queue
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gov-blue-50 text-gov-blue-700 dark:bg-gov-blue-950/60 dark:text-gov-blue-300 border border-gov-blue-200 dark:border-gov-blue-800">
              <Sparkles size={11} /> Unified Schedule Sync
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
            Book community visits, document pickups, or mediations, powered by crowd congestion forecasting
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/blotter"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-xs transition-colors"
          >
            <Scale size={15} className="text-amber-500" />
            <span>Open Blotter</span>
          </Link>
          <button
            onClick={() => {
              setAppointmentDate(new Date().toISOString().split('T')[0]);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gov-blue-600 to-gov-blue-800 hover:from-gov-blue-700 hover:to-gov-blue-900 text-white rounded-2xl font-bold text-xs shadow-md shadow-gov-blue-600/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            Book Appointment
          </button>
        </div>
      </div>

      {/* Congestion Checker Panel */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 tracking-widest flex items-center gap-2">
            <TrendingUp size={16} className="text-gov-blue-500" />
            Congestion Risk & Smart Load Balancing
          </h4>
          {selectedDateFilter && (
            <button
              onClick={() => setSelectedDateFilter(null)}
              className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X size={13} />
              Clear Date Filter ({selectedDateFilter})
            </button>
          )}
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal mb-4">
          Below is the projected daily queue levels based on current reservation volumes (including peace hearings and scheduled barangay appointments). Click any day to filter schedules.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {dynamicCongestion.map((item, idx) => {
            const isSelected = selectedDateFilter === item.date;
            return (
              <div 
                key={idx} 
                onClick={() => {
                  setSelectedDateFilter(prev => prev === item.date ? null : item.date);
                }}
                title={`Click to filter schedules for ${new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`}
                className={`p-3.5 rounded-2xl border text-center relative overflow-hidden cursor-pointer hover:scale-[1.03] active:scale-95 transition-all shadow-xs ${
                  isSelected ? 'ring-2 ring-gov-blue-500 ring-offset-2 dark:ring-offset-slate-900' : ''
                } ${
                  item.congestion_risk === 'High' 
                    ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300' 
                    : item.congestion_risk === 'Medium'
                    ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                }`}
              >
                <span className="text-[10px] font-bold block text-slate-700 dark:text-slate-300">
                  {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className="text-2xl font-black block mt-1.5">{item.bookings_count}</span>
                <span className="text-[9px] font-black uppercase tracking-wider block mt-1">
                  {item.congestion_risk} Load
                </span>
                {item.bookings_count > 0 && (
                  <span className="text-[9px] font-semibold block text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.bookings_count} scheduled
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Appointments & Peace Hearings Unified Ledger Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        {/* Table Header with Tabs and Search Filter */}
        <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 tracking-widest flex items-center gap-2">
              <CalendarIcon size={14} className="text-gov-blue-600" />
              {isStaff ? 'Barangay Appointment Ledger & Hearing Schedule' : 'My Scheduled Bookings & Hearings'}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Showing {filteredSchedules.length} scheduled session{filteredSchedules.length !== 1 ? 's' : ''}
              {selectedDateFilter && ` on ${new Date(selectedDateFilter).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Pills */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-slate-700 text-gov-blue-600 dark:text-gov-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All ({unifiedSchedules.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('appointments')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === 'appointments'
                    ? 'bg-white dark:bg-slate-700 text-gov-blue-600 dark:text-gov-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Appointments ({appointmentsCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('blotters')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'blotters'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Scale size={13} />
                <span>Peace Hearings ({blottersCount})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search citizen or case #..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-gov-blue-500 w-48 sm:w-56 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          {isLoading ? (
            <div className="p-10 text-center text-xs font-bold text-slate-500 dark:text-slate-400">Loading appointment logs & blotter hearings...</div>
          ) : filteredSchedules.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <CalendarIcon size={32} className="mx-auto opacity-30" />
              <p className="text-xs font-bold">No appointments or peace hearings scheduled.</p>
              <p className="text-[11px]">
                {selectedDateFilter ? 'Try clearing the date filter or booking a new slot.' : 'Scheduled peace hearings from Blotter and booked appointments will appear here automatically.'}
              </p>
              {selectedDateFilter && (
                <button
                  onClick={() => setSelectedDateFilter(null)}
                  className="mt-2 px-3 py-1 bg-gov-blue-50 text-gov-blue-600 rounded-xl text-xs font-bold hover:bg-gov-blue-100"
                >
                  Show All Dates
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200/50 dark:border-slate-800/50 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  <th className="p-4">Queue / Case #</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Citizen / Parties Involved</th>
                  <th className="p-4">Purpose / Mediation Details</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Time Slot</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredSchedules.map((item) => {
                  const isBlotter = item.source === 'blotter';
                  const isRevealed = isItemRevealed(item.id);

                  // Format parties with privacy mask if active
                  let displayCitizen = item.resident_name;
                  if (isBlotter && item.complainant && item.respondent) {
                    const comp = isPrivacyMode && !isRevealed ? maskName(item.complainant) : item.complainant;
                    const resp = isPrivacyMode && !isRevealed ? maskName(item.respondent) : item.respondent;
                    displayCitizen = `${comp} vs ${resp}`;
                  } else if (isPrivacyMode && !isRevealed) {
                    displayCitizen = maskName(item.resident_name);
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                      {/* Queue # / Case # */}
                      <td className="p-4 font-mono font-black text-sm">
                        {isBlotter ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-lg">
                            {item.queue_number}
                          </span>
                        ) : (
                          <span className="text-gov-blue-700 dark:text-gov-blue-300">
                            {item.queue_number}
                          </span>
                        )}
                      </td>

                      {/* Schedule Type */}
                      <td className="p-4">
                        {isBlotter ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Scale size={11} /> Peace Hearing
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-gov-blue-50 text-gov-blue-700 dark:bg-gov-blue-950/50 dark:text-gov-blue-300 border border-gov-blue-200 dark:border-gov-blue-800">
                            <CalendarIcon size={11} /> Appointment
                          </span>
                        )}
                      </td>

                      {/* Citizen / Parties */}
                      <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span>{displayCitizen}</span>
                          {isPrivacyMode && (
                            <button
                              type="button"
                              onClick={() => toggleRevealItem(item.id)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5"
                              title={isRevealed ? "Hide sensitive names" : "Reveal sensitive names"}
                            >
                              {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Purpose */}
                      <td className="p-4 text-slate-600 dark:text-slate-400 max-w-xs">
                        <p className="truncate" title={item.purpose}>
                          {item.purpose}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon size={12} className={isBlotter ? "text-amber-500" : "text-gov-blue-500"} />
                          <span>{item.date_display}</span>
                        </div>
                      </td>

                      {/* Time Slot */}
                      <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className={isBlotter ? "text-amber-500" : "text-gov-blue-500"} />
                          <span>{item.time_display}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                          item.status === 'Completed' || item.status === 'Settled'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : item.status === 'Confirmed' || item.status === 'Scheduled' || item.status === 'Active'
                            ? 'bg-gov-blue-50 text-gov-blue-600 dark:bg-gov-blue-950/20 dark:text-gov-blue-400'
                            : item.status === 'Pending'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                            : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                        }`}>
                          {item.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        {isBlotter ? (
                          <Link
                            to="/blotter"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 rounded-lg transition-colors border border-amber-200 dark:border-amber-800/60"
                            title="Go to Blotter Case Records"
                          >
                            <ExternalLink size={12} />
                            <span>View Case</span>
                          </Link>
                        ) : (
                          <div className="flex justify-end gap-1.5">
                            {item.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(item.appointmentRef!.id, 'Confirmed')}
                                  className="p-1.5 bg-gov-blue-50 hover:bg-gov-blue-100 dark:bg-gov-blue-950/30 text-gov-blue-600 dark:text-gov-blue-400 rounded-lg transition-colors"
                                  title="Confirm Slot"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(item.appointmentRef!.id, 'Cancelled')}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-lg transition-colors"
                                  title="Cancel Booking"
                                >
                                  <X size={14} />
                                </button>
                              </>
                            )}
                            {item.status === 'Confirmed' && isStaff && (
                              <button
                                onClick={() => handleUpdateStatus(item.appointmentRef!.id, 'Completed')}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors font-bold text-[10px]"
                              >
                                Mark Completed
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {isLoading ? (
            <div className="p-8 text-center text-xs font-bold text-slate-500">Loading schedule logs...</div>
          ) : filteredSchedules.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-slate-500">No appointments or hearings scheduled.</div>
          ) : (
            filteredSchedules.map((item) => {
              const isBlotter = item.source === 'blotter';
              const isRevealed = isItemRevealed(item.id);

              let displayCitizen = item.resident_name;
              if (isBlotter && item.complainant && item.respondent) {
                const comp = isPrivacyMode && !isRevealed ? maskName(item.complainant) : item.complainant;
                const resp = isPrivacyMode && !isRevealed ? maskName(item.respondent) : item.respondent;
                displayCitizen = `${comp} vs ${resp}`;
              } else if (isPrivacyMode && !isRevealed) {
                displayCitizen = maskName(item.resident_name);
              }

              return (
                <div key={item.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-lg border ${
                        isBlotter 
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 border-amber-500/20'
                          : 'bg-gov-blue-50 text-gov-blue-700 dark:bg-gov-blue-950/40 border-gov-blue-500/20'
                      }`}>
                        {item.queue_number}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        isBlotter ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40' : 'bg-gov-blue-100 text-gov-blue-800 dark:bg-gov-blue-900/40'
                      }`}>
                        {isBlotter ? 'Peace Hearing' : 'Appointment'}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                      item.status === 'Completed' || item.status === 'Settled'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : item.status === 'Confirmed' || item.status === 'Scheduled' || item.status === 'Active'
                        ? 'bg-gov-blue-50 text-gov-blue-600 dark:bg-gov-blue-950/20 dark:text-gov-blue-400'
                        : item.status === 'Pending'
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">{item.purpose}</h5>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{displayCitizen}</span>
                      {isPrivacyMode && (
                        <button
                          type="button"
                          onClick={() => toggleRevealItem(item.id)}
                          className="text-slate-400 p-0.5"
                        >
                          {isRevealed ? <EyeOff size={11} /> : <Eye size={11} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1">
                      <CalendarIcon size={12} className={isBlotter ? "text-amber-500" : "text-gov-blue-500"} />
                      <span>{item.date_display}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} className={isBlotter ? "text-amber-500" : "text-gov-blue-500"} />
                      <span>{item.time_display}</span>
                    </div>
                  </div>

                  {isBlotter ? (
                    <div className="pt-1">
                      <Link
                        to="/blotter"
                        className="w-full flex items-center justify-center gap-1 py-1.5 bg-amber-50 text-amber-700 dark:bg-amber-950/30 rounded-xl text-xs font-bold border border-amber-200 dark:border-amber-800"
                      >
                        <ExternalLink size={13} />
                        <span>View in Blotter Module</span>
                      </Link>
                    </div>
                  ) : (
                    <>
                      {item.status === 'Pending' && (
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => handleUpdateStatus(item.appointmentRef!.id, 'Confirmed')}
                            className="flex-1 py-1.5 bg-gov-blue-600 hover:bg-gov-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 shadow-sm"
                          >
                            <Check size={14} />
                            <span>Confirm</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(item.appointmentRef!.id, 'Cancelled')}
                            className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 border border-rose-200 dark:border-rose-900/40"
                          >
                            <X size={14} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      )}
                      {item.status === 'Confirmed' && isStaff && (
                        <button
                          onClick={() => handleUpdateStatus(item.appointmentRef!.id, 'Completed')}
                          className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors font-bold shadow-sm"
                        >
                          Mark as Completed
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Booking Form Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl max-w-md w-full shadow-2xl p-6 glass-panel relative overflow-hidden animate-scale-up">
            <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-widest flex items-center gap-2 mb-4">
              <CalendarIcon className="text-gov-blue-500" size={18} />
              Book Appointment Slot
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isStaff && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Select Resident</label>
                  <select
                    value={selectedResidentId}
                    onChange={(e) => setSelectedResidentId(e.target.value)}
                    required
                    title="Select Resident"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-700 dark:text-slate-200"
                  >
                    <option value="">-- Select Resident Profile --</option>
                    {residents.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.first_name} {r.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Purpose of Visit</label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                  placeholder="e.g. Indigency document pickup, Captain consultation, Blotter conciliation..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-700 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Appointment Date</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    title="Appointment Date"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-700 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Time Slot</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    title="Time Slot"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-700 dark:text-slate-200"
                  >
                    {timeSlots.map((s, idx) => (
                      <option key={idx} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Real-time Load Indicator Alert */}
              {appointmentDate && (
                <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                  getRiskForDate(appointmentDate) === 'High' 
                    ? 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/60 dark:text-rose-400' 
                    : getRiskForDate(appointmentDate) === 'Medium'
                    ? 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/60 dark:text-amber-400'
                    : 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/60 dark:text-emerald-400'
                }`}>
                  <AlertTriangle size={15} />
                  <span className="text-[10px] font-bold">
                    Projected queue load for selected date: **{getRiskForDate(appointmentDate)}**
                  </span>
                </div>
              )}

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
                  {isSubmitting ? 'Booking...' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;

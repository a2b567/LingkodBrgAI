import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, Clock, AlertTriangle, Check, X, TrendingUp, Plus, Monitor, Users, CheckCircle2, PhoneCall } from 'lucide-react';
import { api } from '../services/api';
import type { Appointment, Resident } from '../types';
import { useAuthStore } from '../store/authStore';

export const Appointments: React.FC = () => {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [congestion, setCongestion] = useState<{ date: string; bookings_count: number; congestion_risk: string }[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCallingNext, setIsCallingNext] = useState(false);

  // Form inputs
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
  ];

  // Queue Management derived state from live appointments
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a =>
    a.appointment_date.split('T')[0] === todayStr
  );
  const waitingQueue = todayAppointments.filter(a => a.status === 'Confirmed')
    .sort((a, b) => (a.queue_number ?? 0) - (b.queue_number ?? 0));
  const nowServing = waitingQueue[0] ?? null;
  const doneCount = todayAppointments.filter(a => a.status === 'Completed').length;

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.appointments.list();
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCongestion = async () => {
    try {
      const data = await api.appointments.getCongestion();
      setCongestion(data);
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
    fetchAppointments();
    fetchCongestion();
    fetchResidents();
  }, [fetchAppointments]);

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
        appointment_date: new Date(appointmentDate).toISOString(),
        time_slot: timeSlot
      });

      setIsModalOpen(false);
      setPurpose('');
      setAppointmentDate('');
      fetchAppointments();
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
      fetchAppointments();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update appointment status");
    }
  };

  // Call Next: marks current "Now Serving" as Completed, queue auto-advances
  const handleCallNext = async () => {
    if (!nowServing) return;
    setIsCallingNext(true);
    try {
      await api.appointments.updateStatus(nowServing.id, 'Completed');
      await fetchAppointments();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to call next");
    } finally {
      setIsCallingNext(false);
    }
  };

  // Get risk status for select dates
  const getRiskForDate = (dateStr: string) => {
    if (!dateStr) return null;
    const formatted = new Date(dateStr).toISOString().split('T')[0];
    const match = congestion.find(c => c.date.split('T')[0] === formatted);
    return match ? match.congestion_risk : 'Low';
  };

  return (
    <div className="space-y-6 relative z-10">
      {/* Header Title & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white tracking-tight uppercase">
            Appointments & Queue
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
            Book community visits, document pickups, or mediations, powered by crowd congestion forecasting
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gov-blue-600 to-gov-blue-800 hover:from-gov-blue-700 hover:to-gov-blue-900 text-white rounded-2xl font-bold text-xs shadow-md shadow-gov-blue-600/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
        >
          <Plus size={16} />
          Book Appointment
        </button>
      </div>

      {/* Queue Management Panel — Staff Only */}
      {isStaff && (
        <div className="bg-slate-900 dark:bg-slate-950 rounded-3xl border border-slate-700/60 shadow-lg overflow-hidden">
          {/* Queue Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-teal-500/20 flex items-center justify-center">
                <Monitor size={18} className="text-teal-400" />
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase tracking-widest">Queue Management</p>
                <p className="text-[10px] text-slate-400">Call next resident &amp; manage service window</p>
              </div>
            </div>
            {/* Stats Bar */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Clock size={12} className="text-amber-400" />
                <span className="text-[10px] font-black text-amber-400">{waitingQueue.length}</span>
                <span className="text-[9px] font-bold text-amber-500/70 uppercase tracking-wider">Waiting</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20">
                <PhoneCall size={12} className="text-teal-400" />
                <span className="text-[10px] font-black text-teal-400">{nowServing ? 1 : 0}</span>
                <span className="text-[9px] font-bold text-teal-500/70 uppercase tracking-wider">Serving</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-400">{doneCount}</span>
                <span className="text-[9px] font-bold text-emerald-500/70 uppercase tracking-wider">Done</span>
              </div>
            </div>
          </div>

          {/* Queue Body */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* NOW SERVING */}
            <div className="p-6 bg-gradient-to-br from-teal-600 to-teal-800 border-r border-teal-700/40">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-200 mb-3">Now Serving</p>
              {nowServing ? (
                <div>
                  <p className="text-xl font-black text-white leading-tight">
                    {nowServing.resident
                      ? `${nowServing.resident.first_name} ${nowServing.resident.last_name}`
                      : `Queue #${nowServing.queue_number}`}
                  </p>
                  <p className="text-xs text-teal-200 mt-1 font-medium">{nowServing.purpose}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[10px] font-black bg-teal-500/30 text-teal-100 px-2 py-0.5 rounded-lg">
                      #{nowServing.queue_number}
                    </span>
                    <span className="text-[10px] text-teal-200/70 font-medium">{nowServing.time_slot}</span>
                  </div>
                </div>
              ) : (
                <p className="text-lg font-black text-teal-100/60 leading-snug">
                  No one is being served right now
                </p>
              )}
            </div>

            {/* WAITING QUEUE + CALL NEXT */}
            <div className="p-6 bg-slate-800/60 dark:bg-slate-900/80">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Waiting Queue</p>
                <button
                  onClick={handleCallNext}
                  disabled={isCallingNext || waitingQueue.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-black text-[11px] uppercase tracking-wide transition-all active:scale-95"
                >
                  <PhoneCall size={13} />
                  {isCallingNext ? 'Calling...' : 'Call Next'}
                </button>
              </div>

              {waitingQueue.length === 0 ? (
                <div className="flex items-center justify-center h-20 text-center">
                  <p className="text-xs font-bold text-slate-500">Queue is empty — no residents waiting</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {waitingQueue.slice(1, 6).map((app, idx) => (
                    <div key={app.id} className="flex items-center gap-3 p-2.5 bg-slate-700/40 rounded-xl">
                      <span className="w-6 h-6 rounded-lg bg-slate-600 flex items-center justify-center text-[10px] font-black text-slate-300">
                        {idx + 2}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {app.resident
                            ? `${app.resident.first_name} ${app.resident.last_name}`
                            : `Queue #${app.queue_number}`}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{app.purpose}</p>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 shrink-0">#{app.queue_number}</span>
                    </div>
                  ))}
                  {waitingQueue.length > 6 && (
                    <p className="text-center text-[10px] text-slate-500 font-bold pt-1">
                      +{waitingQueue.length - 6} more in queue
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Congestion Checker Panel */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm">
        <h4 className="text-xs font-black uppercase text-slate-600 dark:text-slate-200 tracking-widest flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-gov-blue-500" />
          Congestion Risk & Smart Load Balancing
        </h4>
        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal mb-4">
          Below is the projected daily queue levels based on current reservation volumes. We recommend booking on **Low Congestion** days for immediate service.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {congestion.map((item, idx) => (
            <div 
              key={idx} 
              className={`p-3.5 rounded-2xl border text-center relative overflow-hidden ${
                item.congestion_risk === 'High' 
                  ? 'bg-rose-50/50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/60 dark:text-rose-400' 
                  : item.congestion_risk === 'Medium'
                  ? 'bg-amber-50/50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/60 dark:text-amber-400'
                  : 'bg-emerald-50/50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/60 dark:text-emerald-400'
              }`}
            >
              <span className="text-[10px] font-bold block text-slate-700 dark:text-slate-300">
                {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <span className="text-2xl font-black block mt-2">{item.bookings_count}</span>
              <span className="text-[9px] font-black uppercase tracking-wider block mt-1">
                {item.congestion_risk} Load
              </span>
            </div>
          ))}
          {congestion.length === 0 && (
            <div className="col-span-full text-center text-xs font-bold text-slate-500 dark:text-slate-400 py-3">
              Gathering traffic load predictions...
            </div>
          )}
        </div>
      </div>

      {/* Appointments List Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/50">
          <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">
            {isStaff ? 'Barangay Appointment Ledger' : 'My Scheduled Bookings'}
          </h4>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-10 text-center text-xs font-bold text-slate-500 dark:text-slate-400">Loading appointment logs...</div>
          ) : appointments.length === 0 ? (
            <div className="p-10 text-center text-xs font-bold text-slate-500 dark:text-slate-400">No appointments scheduled.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200/50 dark:border-slate-800/50 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  <th className="p-4">Queue #</th>
                  <th className="p-4">Resident Name</th>
                  <th className="p-4">Purpose</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Time Slot</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {appointments.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-mono font-black text-sm text-gov-blue-700 dark:text-gov-blue-300">
                      #{app.queue_number}
                    </td>
                    <td className="p-4 font-semibold">
                      {app.resident ? `${app.resident.first_name} ${app.resident.last_name}` : 'Resident Profile'}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{app.purpose}</td>
                    <td className="p-4 font-medium text-slate-600 dark:text-slate-300">
                      {new Date(app.appointment_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-4 font-semibold text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-gov-blue-500" />
                        {app.time_slot}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                        app.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : app.status === 'Confirmed'
                          ? 'bg-gov-blue-50 text-gov-blue-600 dark:bg-gov-blue-950/20 dark:text-gov-blue-400'
                          : app.status === 'Pending'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        {app.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'Confirmed')}
                              className="p-1.5 bg-gov-blue-50 hover:bg-gov-blue-100 dark:bg-gov-blue-950/30 text-gov-blue-600 dark:text-gov-blue-400 rounded-lg transition-colors"
                              title="Confirm Slot"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'Cancelled')}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-lg transition-colors"
                              title="Cancel Booking"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                        {app.status === 'Confirmed' && isStaff && (
                          <button
                            onClick={() => handleUpdateStatus(app.id, 'Completed')}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors font-bold text-[10px]"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                  placeholder="e.g. Indigency document pickup, Captain consultation, Blotter hearing..."
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

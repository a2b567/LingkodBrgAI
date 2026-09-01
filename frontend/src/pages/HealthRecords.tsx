import React, { useState } from 'react';
import { 
  Heart, Plus, Search, FileText, Pill, Activity, User, Stethoscope, Droplet
} from 'lucide-react';

interface HealthRecord {
  id: string;
  resident_name: string;
  age: number;
  blood_type: string;
  allergies: string;
  conditions: string;
  last_checkup: string;
  status: 'Healthy' | 'Under Observation' | 'Critical';
}

export const HealthRecords: React.FC = () => {
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState<HealthRecord[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<HealthRecord>>({
    resident_name: '', blood_type: 'O+', allergies: '', conditions: '', last_checkup: '', status: 'Healthy'
  });

  const filteredRecords = records.filter(r => 
    r.resident_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: HealthRecord = {
      id: `HR-00${records.length + 1}`,
      resident_name: form.resident_name || 'Unknown',
      age: Math.floor(Math.random() * 50) + 20, // Mock age
      blood_type: form.blood_type || 'Unknown',
      allergies: form.allergies || 'None',
      conditions: form.conditions || 'None',
      last_checkup: form.last_checkup || new Date().toISOString().split('T')[0],
      status: form.status as 'Healthy' | 'Under Observation' | 'Critical' || 'Healthy',
    };
    setRecords([newRecord, ...records]);
    setIsModalOpen(false);
    setForm({ resident_name: '', blood_type: 'O+', allergies: '', conditions: '', last_checkup: '', status: 'Healthy' });
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-rose-500/30 ring-4 ring-rose-500/10">
              <Activity size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Health Records
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-bold mt-1">
                Manage resident medical histories and health statuses
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-95 border border-rose-500/50 uppercase tracking-wider"
        >
          <Plus size={18} strokeWidth={3} />
          New Health Record
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 p-6 rounded-[2rem] border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-slate-200/20 dark:shadow-slate-950/50 flex items-center justify-between group hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">Total Records</p>
            <p className="text-4xl font-black text-slate-900 dark:text-white">{records.length}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <User size={26} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/20 p-6 rounded-[2rem] border border-emerald-500/20 shadow-xl shadow-emerald-500/5 flex items-center justify-between group hover:border-emerald-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-500 tracking-widest">Healthy</p>
            <p className="text-4xl font-black text-emerald-700 dark:text-emerald-400">{records.filter(r => r.status === 'Healthy').length}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-emerald-100 dark:border-emerald-900">
            <Heart size={26} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-amber-50/30 dark:from-slate-900 dark:to-amber-950/20 p-6 rounded-[2rem] border border-amber-500/20 shadow-xl shadow-amber-500/5 flex items-center justify-between group hover:border-amber-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-500 tracking-widest">Under Observation</p>
            <p className="text-4xl font-black text-amber-700 dark:text-amber-400">{records.filter(r => r.status === 'Under Observation').length}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-amber-100 dark:border-amber-900">
            <Pill size={26} />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search resident..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 dark:text-white transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Resident</th>
                <th className="px-6 py-4">Blood Type</th>
                <th className="px-6 py-4">Conditions</th>
                <th className="px-6 py-4">Last Checkup</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-all group">
                  <td className="px-6 py-5 font-mono text-xs font-black text-slate-400 dark:text-slate-500 group-hover:text-rose-500 transition-colors">{record.id}</td>
                  <td className="px-6 py-5">
                    <p className="font-extrabold text-sm text-slate-900 dark:text-white">{record.resident_name}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Age: {record.age}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 font-black text-xs border border-rose-100 dark:border-rose-900/50 shadow-sm">
                      <Droplet size={12} className="fill-rose-500" /> {record.blood_type}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-slate-700 dark:text-slate-300">{record.conditions}</p>
                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Allergies: <span className="text-amber-600 dark:text-amber-400">{record.allergies}</span></p>
                  </td>
                  <td className="px-6 py-5 font-bold text-slate-600 dark:text-slate-400">{record.last_checkup}</td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                      record.status === 'Healthy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/50' :
                      record.status === 'Under Observation' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800/50' :
                      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/50'
                    }`}>
                      {record.status === 'Healthy' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>}
                      {record.status === 'Under Observation' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2"></span>}
                      {record.status === 'Critical' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2 animate-ping"></span>}
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <FileText size={32} className="mx-auto mb-3 opacity-20" />
                    <p className="font-bold">No health records found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6 relative">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Stethoscope className="text-rose-500" />
              New Health Record
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">Resident Name</label>
                <input required type="text" value={form.resident_name} onChange={e => setForm({...form, resident_name: e.target.value})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">Blood Type</label>
                  <select value={form.blood_type} onChange={e => setForm({...form, blood_type: e.target.value})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white">
                    <option>O+</option><option>O-</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value as 'Healthy' | 'Under Observation' | 'Critical'})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white">
                    <option>Healthy</option><option>Under Observation</option><option>Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">Medical Conditions</label>
                <input type="text" value={form.conditions} onChange={e => setForm({...form, conditions: e.target.value})} placeholder="e.g. Hypertension" className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">Allergies</label>
                <input type="text" value={form.allergies} onChange={e => setForm({...form, allergies: e.target.value})} placeholder="e.g. Peanuts" className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white" />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-bold text-xs text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 rounded-xl">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Home, Plus, Search, Edit2, Trash2, 
  MapPin, Loader2, Sparkles, UserPlus, XCircle
} from 'lucide-react';
import { api } from '../services/api';
import type { Household, Resident } from '../types';

export const Households: React.FC = () => {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]); // For member assignment dropdown
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [poverty, setPoverty] = useState('');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    household_number: '',
    poverty_level: 'Non-Poor',
    address: '',
  });

  const [assignForm, setAssignForm] = useState({
    household_id: '',
    resident_id: '',
    is_head: false,
  });

  const fetchHouseholds = async () => {
    setIsLoading(true);
    try {
      const data = await api.households.list({
        address: search,
        poverty_level: poverty,
      });
      setHouseholds(data);
    } catch (err) {
      // Fetch error
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResidentsWithoutHousehold = async () => {
    try {
      const data = await api.residents.list({ limit: 100 });
      // Keep residents that are not linked or can be re-linked
      setResidents(data.data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchHouseholds();
  }, [search, poverty]);

  useEffect(() => {
    fetchResidentsWithoutHousehold();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      household_number: 'HH-2026-' + Math.floor(100 + Math.random() * 900),
      poverty_level: 'Non-Poor',
      address: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (h: Household) => {
    setEditingId(h.id);
    setForm({
      household_number: h.household_number,
      poverty_level: h.poverty_level,
      address: h.address,
    });
    setShowModal(true);
  };

  const handleOpenAssign = (h: Household) => {
    setAssignForm({
      household_id: h.id,
      resident_id: '',
      is_head: false,
    });
    setShowAssignModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await api.households.update(editingId, form);
      } else {
        await api.households.create(form);
      }
      setShowModal(false);
      fetchHouseholds();
    } catch (err) {
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.resident_id) return;
    setIsSaving(true);
    try {
      await api.households.assignMember(assignForm);
      setShowAssignModal(false);
      fetchHouseholds();
      fetchResidentsWithoutHousehold();
    } catch (err) {
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this household? Members will be unlinked but resident profiles remain intact.')) {
      try {
        await api.households.delete(id);
        fetchHouseholds();
      } catch (err) {}
    }
  };

  return (
    <div className="space-y-6 relative z-10">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-normal text-black dark:text-white">HOUSEHOLD PROFILES</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold tracking-wide">Group residents by family units and track poverty indexes</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-gov-blue-600 hover:bg-gov-blue-700 text-white text-xs font-bold rounded-2xl shadow-md transition-colors"
        >
          <Plus size={16} />
          Create Household
        </button>
      </div>

      {/* Query Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-3 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            placeholder="Search address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs focus:outline-none"
          />
        </div>

        <select 
          value={poverty} 
          onChange={(e) => setPoverty(e.target.value)}
          title="Filter by poverty level"
          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 text-xs focus:outline-none w-full md:w-auto"
        >
          <option value="">All Poverty Levels</option>
          <option value="Non-Poor">Non-Poor</option>
          <option value="Low Income">Low Income</option>
          <option value="Poor">Poor</option>
          <option value="Indigent">Indigent</option>
        </select>
      </div>

      {/* Grid of Household Panels */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
          <Loader2 size={32} className="animate-spin text-gov-blue-500" />
          <p className="text-xs">Fetching household records...</p>
        </div>
      ) : households.length === 0 ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400">
          <Home size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-xs font-semibold">No household profiles found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {households.map((h) => (
            <div key={h.id} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
              
              {/* Header */}
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] bg-gov-blue-50 dark:bg-gov-blue-950/40 text-gov-blue-700 dark:text-gov-blue-300 font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                    {h.household_number}
                  </span>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEdit(h)} title="Edit Household" className="p-1 text-slate-500 hover:text-gov-blue-600 transition-colors"><Edit2 size={12} /></button>
                    <button onClick={() => handleDelete(h.id)} title="Delete Household" className="p-1 text-slate-500 hover:text-rose-500 transition-colors"><Trash2 size={12} /></button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-white mt-3">
                  <Home size={14} className="text-gov-blue-500" />
                  Head: {h.head ? `${h.head.first_name} ${h.head.last_name}` : 'No assigned head'}
                </div>

                <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                  <MapPin size={12} />
                  {h.address}
                </p>
              </div>

              {/* Members listing */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">FAMILY MEMBERS ({h.members?.length || 0})</span>
                {h.members && h.members.length > 0 ? (
                  <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                    {h.members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between text-[11px] font-medium bg-slate-50 dark:bg-slate-950/40 px-2 py-1 rounded-lg">
                        <span className="truncate">{m.first_name} {m.last_name}</span>
                        {m.is_household_head && (
                          <span className="text-[8px] bg-gov-gold-100 dark:bg-gov-gold-950/50 text-gov-gold-700 dark:text-gov-gold-300 font-bold px-1 rounded uppercase">Head</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">No members assigned to this household.</p>
                )}
              </div>

              {/* Poverty Indicator and Assignment button */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded ${
                  h.poverty_level === 'Indigent' 
                    ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400' 
                    : h.poverty_level === 'Poor'
                    ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400'
                    : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'
                }`}>
                  <Sparkles size={10} />
                  {h.poverty_level}
                </span>

                <button 
                  onClick={() => handleOpenAssign(h)}
                  className="flex items-center gap-1 text-[10px] font-bold text-gov-blue-600 hover:text-gov-blue-800 dark:text-gov-blue-400 transition-colors"
                >
                  <UserPlus size={12} />
                  Assign Resident
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Household Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden glass-panel">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gov-blue-800 dark:text-gov-blue-300 uppercase">
                {editingId ? 'Modify Household Profile' : 'Create Household Profile'}
              </h3>
              <button onClick={() => setShowModal(false)} title="Close Modal" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"><XCircle size={18} /></button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Household Code</label>
                <input type="text" readOnly title="Household Code" value={form.household_number} className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-500" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Poverty Index Level</label>
                <select value={form.poverty_level} title="Poverty Index Level" onChange={(e) => setForm({...form, poverty_level: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none">
                  <option value="Non-Poor">Non-Poor</option>
                  <option value="Low Income">Low Income</option>
                  <option value="Poor">Poor</option>
                  <option value="Indigent">Indigent</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Barangay Address</label>
                <input type="text" required placeholder="Street No., Zone Location" title="Barangay Address" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none" />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-xl text-xs font-bold shadow-md">{isSaving ? 'Saving...' : 'Save Profile'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Member Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden glass-panel">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gov-blue-800 dark:text-gov-blue-300 uppercase">Assign Citizen to Family Group</h3>
              <button onClick={() => setShowAssignModal(false)} title="Close Modal" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"><XCircle size={18} /></button>
            </div>

            <form onSubmit={handleSaveAssign} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Select Resident</label>
                <select 
                  required 
                  value={assignForm.resident_id} 
                  title="Select Resident"
                  onChange={(e) => setAssignForm({...assignForm, resident_id: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="">-- Choose Resident --</option>
                  {residents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.last_name}, {r.first_name} {r.qr_id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                <input 
                  type="checkbox" 
                  id="is_head" 
                  checked={assignForm.is_head} 
                  onChange={(e) => setAssignForm({...assignForm, is_head: e.target.checked})} 
                  className="rounded border-slate-300 text-gov-blue-600 focus:ring-gov-blue-500" 
                />
                <label htmlFor="is_head" className="text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                  Designate as Household Head
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-xl text-xs font-bold shadow-md">Assign Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default Households;

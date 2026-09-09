import React, { useState, useEffect } from 'react';
import { 
  Home, Plus, Search, Edit2, Trash2, 
  MapPin, Loader2, Sparkles, UserPlus, XCircle, Users, ShieldAlert,
  User, DollarSign, Phone, Trash, CheckCircle2, ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import type { Household, Resident, HouseholdMemberInfo } from '../types';

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
  const [activeTab, setActiveTab] = useState<'head' | 'family' | 'housing' | 'economy' | 'contact'>('head');

  const defaultFormState = {
    household_number: '',
    poverty_level: 'Non-Poor',
    address: '',

    // 1. Household Head Details
    head_first_name: '',
    head_middle_name: '',
    head_last_name: '',
    head_birthdate: '',
    head_birthplace: '',
    head_gender: 'Male',
    head_civil_status: 'Single',
    head_religion: 'Roman Catholic',
    head_education: 'College',
    head_occupation: '',
    head_monthly_income: '',

    // 2. Family Composition (List of Housemates)
    family_members_list: [] as HouseholdMemberInfo[],

    // 3. Housing & Property Info
    housing_tenure: 'Owned',
    house_materials: 'Concrete',
    number_of_rooms: '2',
    water_source: 'Maynilad / Local Waterworks',
    power_source: 'Meralco / Local Electric Coop',
    toilet_type: 'Flush Toilet',
    waste_disposal: 'Garbage Collection',

    // 4. Socio-Economic & 4Ps
    total_family_income: '',
    other_income_sources: 'None',
    is_4ps_member: false,
    special_categories: 'None',
    philhealth_coverage: 'Yes',

    // 5. Contact Details
    contact_number: '',
    email_address: '',
  };

  const [form, setForm] = useState(defaultFormState);

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
    setActiveTab('head');
    setForm({
      ...defaultFormState,
      household_number: 'HH-2026-' + Math.floor(100 + Math.random() * 900),
    });
    setShowModal(true);
  };

  const handleOpenEdit = (h: Household) => {
    setEditingId(h.id);
    setActiveTab('head');
    setForm({
      household_number: h.household_number || `HH-2026-${Math.floor(100 + Math.random() * 900)}`,
      poverty_level: h.poverty_level || 'Non-Poor',
      address: h.address || '',
      head_first_name: h.head_first_name || (h.head?.first_name || ''),
      head_middle_name: h.head_middle_name || (h.head?.middle_name || ''),
      head_last_name: h.head_last_name || (h.head?.last_name || ''),
      head_birthdate: h.head_birthdate || ((h.head as any)?.birth_date || h.head?.birthdate || ''),
      head_birthplace: h.head_birthplace || ((h.head as any)?.place_of_birth || ''),
      head_gender: h.head_gender || (h.head?.gender || 'Male'),
      head_civil_status: h.head_civil_status || (h.head?.civil_status || 'Single'),
      head_religion: h.head_religion || 'Roman Catholic',
      head_education: h.head_education || 'College',
      head_occupation: h.head_occupation || (h.head?.occupation || ''),
      head_monthly_income: h.head_monthly_income || '',
      family_members_list: h.family_members_list || [],
      housing_tenure: h.housing_tenure || 'Owned',
      house_materials: h.house_materials || 'Concrete',
      number_of_rooms: h.number_of_rooms || '2',
      water_source: h.water_source || 'Maynilad / Local Waterworks',
      power_source: h.power_source || 'Meralco / Local Electric Coop',
      toilet_type: h.toilet_type || 'Flush Toilet',
      waste_disposal: h.waste_disposal || 'Garbage Collection',
      total_family_income: h.total_family_income || '',
      other_income_sources: h.other_income_sources || 'None',
      is_4ps_member: h.is_4ps_member || false,
      special_categories: h.special_categories || 'None',
      philhealth_coverage: h.philhealth_coverage || 'Yes',
      contact_number: h.contact_number || ((h.head as any)?.phone || h.head?.email || ''),
      email_address: h.email_address || (h.head?.email || ''),
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

  const handleAddFamilyMember = () => {
    setForm({
      ...form,
      family_members_list: [
        ...form.family_members_list,
        {
          id: Date.now().toString(),
          full_name: '',
          relation: 'Asawa (Spouse)',
          birthdate: '',
          gender: 'Female',
          civil_status: 'Married',
          education_level: 'High School',
          occupation: '',
          monthly_income: '0',
        },
      ],
    });
  };

  const handleRemoveFamilyMember = (index: number) => {
    const updated = [...form.family_members_list];
    updated.splice(index, 1);
    setForm({ ...form, family_members_list: updated });
  };

  const handleUpdateFamilyMember = (index: number, field: keyof HouseholdMemberInfo, value: string) => {
    const updated = [...form.family_members_list];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, family_members_list: updated });
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

  // Compute overview stats from loaded data
  const totalHouseholds = households.length;
  const indigentCount = households.filter(h => h.poverty_level === 'Indigent' || h.poverty_level === 'Poor').length;
  const totalMembers = households.reduce((sum, h) => sum + (h.members?.length || h.family_members_list?.length || 0) + 1, 0);
  const fourPsCount = households.filter(h => h.is_4ps_member).length;

  return (
    <div className="space-y-6 relative z-10">
      
      {/* Title */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white tracking-tight uppercase">
            Household Profiling & Registry
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
            Complete RBI profiling: Household Heads, Family Members, Housing Conditions, 4Ps & Socio-Economic Index
          </p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gov-blue-600 to-gov-blue-800 hover:from-gov-blue-700 hover:to-gov-blue-900 text-white text-xs font-bold rounded-2xl shadow-md shadow-gov-blue-600/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
        >
          <Plus size={16} />
          Create Household Profile
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gov-blue-500/10 text-gov-blue-500 flex items-center justify-center flex-shrink-0">
            <Home size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider block">TOTAL HOUSEHOLDS</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalHouseholds}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider block">INDIGENT / POOR</span>
            <span className="text-2xl font-black text-rose-500">{indigentCount}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider block">POPULATION (REGISTERED)</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalMembers}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider block">4Ps BENEFICIARIES</span>
            <span className="text-2xl font-black text-amber-500">{fourPsCount}</span>
          </div>
        </div>
      </div>

      {/* Query Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-3 text-slate-500 dark:text-slate-300" />
          <input
            type="text"
            placeholder="Search household code, head name, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        <select 
          value={poverty} 
          onChange={(e) => setPoverty(e.target.value)}
          title="Filter by poverty level"
          className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs focus:outline-none w-full md:w-auto text-slate-800 dark:text-white"
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
          {households.map((h) => {
            const headName = h.head 
              ? `${h.head.first_name} ${h.head.last_name}` 
              : h.head_first_name 
              ? `${h.head_first_name} ${h.head_last_name}` 
              : 'No assigned head';

            const memberCount = (h.members?.length || 0) + (h.family_members_list?.length || 0);

            return (
              <div key={h.id} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                
                {/* Header */}
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] bg-gov-blue-50 dark:bg-gov-blue-950/40 text-gov-blue-700 dark:text-gov-blue-300 font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                      {h.household_number}
                    </span>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenEdit(h)} title="Edit Household Profile" className="p-1 text-slate-500 hover:text-gov-blue-600 dark:text-slate-400 dark:hover:text-gov-blue-400 transition-colors"><Edit2 size={13} /></button>
                      <button onClick={() => handleDelete(h.id)} title="Delete Household" className="p-1 text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-white mt-3">
                    <Home size={14} className="text-gov-blue-500 flex-shrink-0" />
                    <span className="truncate">Head: {headName}</span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mt-1 font-medium truncate">
                    <MapPin size={12} className="flex-shrink-0 text-slate-400" />
                    {h.address || 'No address specified'}
                  </p>

                  {(h.housing_tenure || h.total_family_income) && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 pt-1">
                      {h.housing_tenure && <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">🏠 {h.housing_tenure}</span>}
                      {h.total_family_income && <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 px-2 py-0.5 rounded font-mono">₱{h.total_family_income}/mo</span>}
                    </div>
                  )}
                </div>

                {/* Members listing */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest block">FAMILY MEMBERS ({memberCount})</span>
                    {h.is_4ps_member && (
                      <span className="text-[8px] bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black px-1.5 py-0.5 rounded uppercase">4Ps Member</span>
                    )}
                  </div>

                  {h.members && h.members.length > 0 ? (
                    <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                      {h.members.map((m) => (
                        <div key={m.id} className="flex items-center justify-between text-[11px] font-medium bg-slate-50 dark:bg-slate-950/60 px-2 py-1 rounded-lg">
                          <span className="truncate text-slate-700 dark:text-slate-200">{m.first_name} {m.last_name}</span>
                          {m.is_household_head && (
                            <span className="text-[8px] bg-gov-gold-100 dark:bg-gov-gold-950/50 text-gov-gold-700 dark:text-gov-gold-300 font-bold px-1 rounded uppercase">Head</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : h.family_members_list && h.family_members_list.length > 0 ? (
                    <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                      {h.family_members_list.map((fm, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] font-medium bg-slate-50 dark:bg-slate-950/60 px-2 py-1 rounded-lg">
                          <span className="truncate text-slate-700 dark:text-slate-200">{fm.full_name || 'Member'}</span>
                          <span className="text-[8px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-1.5 py-0.5 rounded">{fm.relation}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 dark:text-slate-300 italic">No family members registered.</p>
                  )}
                </div>

                {/* Poverty Indicator and Assignment button */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded ${
                    h.poverty_level === 'Indigent' 
                      ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400' 
                      : h.poverty_level === 'Poor'
                      ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400'
                      : h.poverty_level === 'Low Income'
                      ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                      : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    <Sparkles size={10} />
                    {h.poverty_level}
                  </span>

                  <button 
                    onClick={() => handleOpenAssign(h)}
                    className="flex items-center gap-1 text-[10px] font-bold text-gov-blue-600 hover:text-gov-blue-800 dark:text-gov-blue-400 dark:hover:text-gov-blue-300 transition-colors cursor-pointer"
                  >
                    <UserPlus size={12} />
                    Link Resident
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Comprehensive Create / Edit Household Profiling Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden glass-panel max-h-[90vh] flex flex-col my-auto">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gov-blue-500/10 text-gov-blue-500 flex items-center justify-center font-bold">
                  <Home size={18} />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                    {editingId ? 'Edit Household Profile & RBI Record' : 'Create New Household Profile'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Registry of Barangay Inhabitants (RBI) Official Survey Form
                  </p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} title="Close Modal" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <XCircle size={22} />
              </button>
            </div>

            {/* Modal Nav Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/80 px-4 pt-2 gap-1 overflow-x-auto flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('head')}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'head'
                    ? 'bg-white dark:bg-slate-900 text-gov-blue-600 dark:text-gov-blue-400 border-t-2 border-gov-blue-500 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <User size={14} />
                1. Household Head
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('family')}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'family'
                    ? 'bg-white dark:bg-slate-900 text-gov-blue-600 dark:text-gov-blue-400 border-t-2 border-gov-blue-500 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Users size={14} />
                2. Family Members ({form.family_members_list.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('housing')}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'housing'
                    ? 'bg-white dark:bg-slate-900 text-gov-blue-600 dark:text-gov-blue-400 border-t-2 border-gov-blue-500 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Home size={14} />
                3. Housing & Property
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('economy')}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'economy'
                    ? 'bg-white dark:bg-slate-900 text-gov-blue-600 dark:text-gov-blue-400 border-t-2 border-gov-blue-500 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <DollarSign size={14} />
                4. Socio-Economic & 4Ps
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('contact')}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'contact'
                    ? 'bg-white dark:bg-slate-900 text-gov-blue-600 dark:text-gov-blue-400 border-t-2 border-gov-blue-500 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Phone size={14} />
                5. Contact & Address
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              
              {/* TAB 1: Impormasyon ng Household Head */}
              {activeTab === 'head' && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-gov-blue-600 dark:text-gov-blue-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gov-blue-500"></span>
                      1. Impormasyon ng Household Head (Punong Kapatid)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Punan ang opisyal na impormasyon ng namumuno sa tahanan.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Unang Pangalan (First Name) *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Juan"
                        value={form.head_first_name} 
                        onChange={(e) => setForm({...form, head_first_name: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Gitnang Pangalan (Middle Name)</label>
                      <input 
                        type="text" 
                        placeholder="Mercado"
                        value={form.head_middle_name} 
                        onChange={(e) => setForm({...form, head_middle_name: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Apelyido (Last Name) *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Dela Cruz"
                        value={form.head_last_name} 
                        onChange={(e) => setForm({...form, head_last_name: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Petsa ng Kapanganakan (Birthdate)</label>
                      <input 
                        type="date" 
                        value={form.head_birthdate} 
                        onChange={(e) => setForm({...form, head_birthdate: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Lugar ng Kapanganakan (Birthplace)</label>
                      <input 
                        type="text" 
                        placeholder="City / Province"
                        value={form.head_birthplace} 
                        onChange={(e) => setForm({...form, head_birthplace: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Kasarian (Gender)</label>
                      <select 
                        value={form.head_gender} 
                        onChange={(e) => setForm({...form, head_gender: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none text-slate-800 dark:text-white"
                      >
                        <option value="Male">Lalaki (Male)</option>
                        <option value="Female">Babae (Female)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Katayuang Sibil (Civil Status)</label>
                      <select 
                        value={form.head_civil_status} 
                        onChange={(e) => setForm({...form, head_civil_status: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none text-slate-800 dark:text-white"
                      >
                        <option value="Single">Walang Asawa (Single)</option>
                        <option value="Married">Kasal (Married)</option>
                        <option value="Widowed">Biyudo / Biyuda (Widowed)</option>
                        <option value="Separated">Hiwalay (Separated)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Relihiyon (Religion)</label>
                      <input 
                        type="text" 
                        placeholder="E.g., Roman Catholic, INC, Islam, Christian"
                        value={form.head_religion} 
                        onChange={(e) => setForm({...form, head_religion: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Antas ng Edukasyon (Education)</label>
                      <select 
                        value={form.head_education} 
                        onChange={(e) => setForm({...form, head_education: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none text-slate-800 dark:text-white"
                      >
                        <option value="Elementary Graduate">Elementary Graduate</option>
                        <option value="High School Graduate">High School Graduate</option>
                        <option value="College Level">College Level</option>
                        <option value="College Graduate">College Graduate</option>
                        <option value="Vocational">Vocational / Technical</option>
                        <option value="Post Graduate">Post Graduate / Masteral</option>
                        <option value="None">Walang Pormal na Edukasyon</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Hanapbuhay / Trabaho (Occupation)</label>
                      <input 
                        type="text" 
                        placeholder="E.g., Vendor, Driver, Private Employee, Fisherman"
                        value={form.head_occupation} 
                        onChange={(e) => setForm({...form, head_occupation: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Buwanang Kita (Monthly Income ₱)</label>
                      <input 
                        type="number" 
                        placeholder="15000.00"
                        value={form.head_monthly_income} 
                        onChange={(e) => setForm({...form, head_monthly_income: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white font-mono" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Komposisyon ng Pamilya */}
              {activeTab === 'family' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-gov-blue-600 dark:text-gov-blue-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gov-blue-500"></span>
                        2. Komposisyon ng Pamilya (Listahan ng mga Kasambahay)
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Ilista ang lahat ng miyembro ng pamilya o kasambahay na nakatira sa parehong tirahan.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddFamilyMember}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                    >
                      <Plus size={14} />
                      Dagdag Miyembro
                    </button>
                  </div>

                  {form.family_members_list.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                      <Users size={36} className="mx-auto mb-2 text-slate-400" />
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Walang karagdagang miyembro ng pamilya na nairehistro.</p>
                      <p className="text-[11px] text-slate-400 mt-1">I-click ang "+ Dagdag Miyembro" sa itaas para magdagdag ng asawa, anak, o kamag-anak.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {form.family_members_list.map((m, idx) => (
                        <div key={m.id || idx} className="p-4 bg-slate-50 dark:bg-slate-950/70 rounded-2xl border border-slate-200/80 dark:border-slate-800 relative space-y-3">
                          <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-800">
                            <span className="text-[11px] font-black text-gov-blue-600 dark:text-gov-blue-400 uppercase tracking-wider">
                              Miyembro #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFamilyMember(idx)}
                              className="text-rose-500 hover:text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash size={12} />
                              Alisin
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Buong Pangalan *</label>
                              <input
                                type="text"
                                placeholder="Maria Dela Cruz"
                                value={m.full_name}
                                onChange={(e) => handleUpdateFamilyMember(idx, 'full_name', e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Relasyon sa Head *</label>
                              <select
                                value={m.relation}
                                onChange={(e) => handleUpdateFamilyMember(idx, 'relation', e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none text-slate-800 dark:text-white"
                              >
                                <option value="Asawa (Spouse)">Asawa (Spouse)</option>
                                <option value="Anak (Son / Daughter)">Anak (Son / Daughter)</option>
                                <option value="Magulang (Parent)">Magulang (Parent)</option>
                                <option value="Kapatid (Sibling)">Kapatid (Sibling)</option>
                                <option value="Apo (Grandchild)">Apo (Grandchild)</option>
                                <option value="Kamag-anak (Relative)">Kamag-anak (Relative)</option>
                                <option value="Kasambahay / Helper">Kasambahay / Helper</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Petsa ng Kapanganakan</label>
                              <input
                                type="date"
                                value={m.birthdate}
                                onChange={(e) => handleUpdateFamilyMember(idx, 'birthdate', e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Kasarian</label>
                              <select
                                value={m.gender}
                                onChange={(e) => handleUpdateFamilyMember(idx, 'gender', e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none text-slate-800 dark:text-white"
                              >
                                <option value="Male">Lalaki</option>
                                <option value="Female">Babae</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Katayuang Sibil</label>
                              <select
                                value={m.civil_status}
                                onChange={(e) => handleUpdateFamilyMember(idx, 'civil_status', e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none text-slate-800 dark:text-white"
                              >
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Widowed">Widowed</option>
                                <option value="Separated">Separated</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Antas ng Edukasyon</label>
                              <input
                                type="text"
                                placeholder="E.g., Grade 10 / College"
                                value={m.education_level}
                                onChange={(e) => handleUpdateFamilyMember(idx, 'education_level', e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Buwanang Kita (₱)</label>
                              <input
                                type="number"
                                placeholder="0"
                                value={m.monthly_income}
                                onChange={(e) => handleUpdateFamilyMember(idx, 'monthly_income', e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Uri ng Tirahan at Ari-arian */}
              {activeTab === 'housing' && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-gov-blue-600 dark:text-gov-blue-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gov-blue-500"></span>
                      3. Uri ng Tirahan at Ari-arian (Housing & Living Conditions)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Impormasyon ukol sa kalagayan ng bahay at mga batayang serbisyo.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Uri ng Bahay (Housing Tenure)</label>
                      <select 
                        value={form.housing_tenure} 
                        onChange={(e) => setForm({...form, housing_tenure: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none text-slate-800 dark:text-white"
                      >
                        <option value="Owned">Sarili / Owned</option>
                        <option value="Rented">Nangungupahan / Rented</option>
                        <option value="Rent-Free">Rent-Free (nakitira sa kamag-anak)</option>
                        <option value="Informal Settler">Informal Settler</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Materyales ng Bahay (House Structure)</label>
                      <select 
                        value={form.house_materials} 
                        onChange={(e) => setForm({...form, house_materials: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none text-slate-800 dark:text-white"
                      >
                        <option value="Concrete">Semento / Concrete</option>
                        <option value="Semi-Concrete">Semi-Concrete (Kahoy & Semento)</option>
                        <option value="Light Materials">Kahoy / Kawayan / Light Materials</option>
                        <option value="Salvaged">Salvaged / Temporary Materials</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Bilang ng Kuwarto (No. of Rooms)</label>
                      <select 
                        value={form.number_of_rooms} 
                        onChange={(e) => setForm({...form, number_of_rooms: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none text-slate-800 dark:text-white font-mono"
                      >
                        <option value="1">1 Kuwarto / Studio</option>
                        <option value="2">2 Kuwarto</option>
                        <option value="3">3 Kuwarto</option>
                        <option value="4+">4 o Higit Pang Kuwarto</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Pinagmumulan ng Tubig (Water Source)</label>
                      <select 
                        value={form.water_source} 
                        onChange={(e) => setForm({...form, water_source: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none text-slate-800 dark:text-white"
                      >
                        <option value="Maynilad / Local Waterworks">Maynilad / Manila Water / Local Waterworks</option>
                        <option value="Deep Well">Deep Well / Poso (Motorized)</option>
                        <option value="Poso">Manwal na Poso (Handpump)</option>
                        <option value="Balon">Balon / Spring</option>
                        <option value="Bottled Water">Mineral / Bottled Water Station</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Pinagmumulan ng Kuryente (Power Source)</label>
                      <select 
                        value={form.power_source} 
                        onChange={(e) => setForm({...form, power_source: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none text-slate-800 dark:text-white"
                      >
                        <option value="Meralco / Local Electric Coop">Meralco / Local Electric Coop</option>
                        <option value="Solar Power">Solar Power System</option>
                        <option value="Generator">Generator</option>
                        <option value="Walang Kuryente">Walang Kuryente / Kerosene</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Uri ng Palikuran (Sanitation Toilet Type)</label>
                      <select 
                        value={form.toilet_type} 
                        onChange={(e) => setForm({...form, toilet_type: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none text-slate-800 dark:text-white"
                      >
                        <option value="Flush Toilet">Flush Toilet (Water-sealed w/ Septic Tank)</option>
                        <option value="Poso / Pit Latrine">Pit Latrine / Balon na Palikuran</option>
                        <option value="Walang Palikuran">Walang Sariling Palikuran (Public/Shared)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Paraan ng Pagtatapon ng Basura (Waste Disposal)</label>
                      <select 
                        value={form.waste_disposal} 
                        onChange={(e) => setForm({...form, waste_disposal: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none text-slate-800 dark:text-white"
                      >
                        <option value="Garbage Collection">Barangay / City Garbage Collection</option>
                        <option value="Segregation">Materials Recovery Facility (MRF) Segregation</option>
                        <option value="Composting">Composting (Pagbubulok)</option>
                        <option value="Burning">Pagsisiga / Burning</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Katayuang Pang-ekonomiya at Pantawid */}
              {activeTab === 'economy' && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-gov-blue-600 dark:text-gov-blue-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gov-blue-500"></span>
                      4. Katayuang Pang-ekonomiya at Pantawid (Socio-Economic & Assistance Status)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Kabuuang kita ng pamilya at eligibility para sa pamahalaang ayuda (4Ps, Social Pension, PhilHealth).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Kabuuang Buwanang Kita ng Pamilya (Total Household Income ₱)</label>
                      <input 
                        type="number" 
                        placeholder="25000.00"
                        value={form.total_family_income} 
                        onChange={(e) => setForm({...form, total_family_income: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white font-mono" 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Iba pang Pinagkukunan ng Kita (Other Income Sources)</label>
                      <input 
                        type="text" 
                        placeholder="E.g., OFW Remittances, Small Business, Pension, Tulong sa Kamag-anak"
                        value={form.other_income_sources} 
                        onChange={(e) => setForm({...form, other_income_sources: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                      <label className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase block">Kasapi ba sa 4Ps? (Pantawid Pamilya)</label>
                      <div className="flex items-center gap-3 pt-1">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white cursor-pointer">
                          <input 
                            type="radio" 
                            name="is_4ps" 
                            checked={form.is_4ps_member} 
                            onChange={() => setForm({...form, is_4ps_member: true})} 
                            className="text-gov-blue-600 focus:ring-gov-blue-500"
                          />
                          Oo (Yes)
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white cursor-pointer">
                          <input 
                            type="radio" 
                            name="is_4ps" 
                            checked={!form.is_4ps_member} 
                            onChange={() => setForm({...form, is_4ps_member: false})} 
                            className="text-gov-blue-600 focus:ring-gov-blue-500"
                          />
                          Hindi (No)
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">May Senior Citizen / PWD sa Pamilya?</label>
                      <select 
                        value={form.special_categories} 
                        onChange={(e) => setForm({...form, special_categories: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none text-slate-800 dark:text-white"
                      >
                        <option value="None">Wala (None)</option>
                        <option value="Senior Citizen">May Senior Citizen</option>
                        <option value="PWD">May PWD (Persons with Disability)</option>
                        <option value="Both Senior & PWD">May parehong Senior Citizen & PWD</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">PhilHealth Coverage</label>
                      <select 
                        value={form.philhealth_coverage} 
                        onChange={(e) => setForm({...form, philhealth_coverage: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none text-slate-800 dark:text-white"
                      >
                        <option value="Yes">Oo (Active Member / Beneficiary)</option>
                        <option value="Dependent">Dependent Member</option>
                        <option value="No">Walang PhilHealth Coverage</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: Contact Details & Address */}
              {activeTab === 'contact' && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-gov-blue-600 dark:text-gov-blue-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gov-blue-500"></span>
                      5. Contact Details & Barangay Location
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Pangalan ng kalye, numero sa barangay registry, at opisyal na contact details.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Household Code (RBI Index)</label>
                      <input 
                        type="text" 
                        readOnly 
                        value={form.household_number} 
                        className="w-full bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 font-mono" 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Poverty Index Level (Assessment)</label>
                      <select 
                        value={form.poverty_level} 
                        onChange={(e) => setForm({...form, poverty_level: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none text-slate-800 dark:text-white font-semibold"
                      >
                        <option value="Non-Poor">Non-Poor (Higit sa Poverty Threshold)</option>
                        <option value="Low Income">Low Income (Mababang Kita)</option>
                        <option value="Poor">Poor (Mahirap)</option>
                        <option value="Indigent">Indigent (Nangangailangan ng Lubos na Tulong)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Kumpletong Tirahan sa Barangay (Barangay Address) *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="House No., Street Name, Zone Location, Barangay Lawrence"
                      value={form.address} 
                      onChange={(e) => setForm({...form, address: e.target.value})} 
                      className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white" 
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Numero ng Telepono / Mobile Phone *</label>
                      <input 
                        type="text" 
                        placeholder="0917-XXX-XXXX"
                        value={form.contact_number} 
                        onChange={(e) => setForm({...form, contact_number: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white font-mono" 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Email Address (kung mayroon)</label>
                      <input 
                        type="email" 
                        placeholder="household@example.com"
                        value={form.email_address} 
                        onChange={(e) => setForm({...form, email_address: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex gap-1">
                  {activeTab !== 'head' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs: ('head' | 'family' | 'housing' | 'economy' | 'contact')[] = ['head', 'family', 'housing', 'economy', 'contact'];
                        const currIdx = tabs.indexOf(activeTab);
                        if (currIdx > 0) setActiveTab(tabs[currIdx - 1]);
                      }}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      Previous Tab
                    </button>
                  )}
                  {activeTab !== 'contact' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs: ('head' | 'family' | 'housing' | 'economy' | 'contact')[] = ['head', 'family', 'housing', 'economy', 'contact'];
                        const currIdx = tabs.indexOf(activeTab);
                        if (currIdx < tabs.length - 1) setActiveTab(tabs[currIdx + 1]);
                      }}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      Next Tab
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving} 
                    className="px-5 py-2 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    {isSaving ? 'Saving Profile...' : 'Save Profile'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Assign Member Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden glass-panel">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <h3 className="font-black text-xs text-gov-blue-700 dark:text-gov-blue-300 uppercase tracking-widest flex items-center gap-2">
                <UserPlus size={16} className="text-gov-blue-500" />
                Assign Citizen to Family Group
              </h3>
              <button onClick={() => setShowAssignModal(false)} title="Close Modal" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"><XCircle size={18} /></button>
            </div>

            <form onSubmit={handleSaveAssign} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-200 uppercase block">Select Resident</label>
                <select 
                  required 
                  value={assignForm.resident_id} 
                  title="Select Resident"
                  onChange={(e) => setAssignForm({...assignForm, resident_id: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white"
                >
                  <option value="">-- Choose Resident --</option>
                  {residents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.last_name}, {r.first_name} ({r.qr_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800/80">
                <input 
                  type="checkbox" 
                  id="is_head" 
                  checked={assignForm.is_head} 
                  onChange={(e) => setAssignForm({...assignForm, is_head: e.target.checked})} 
                  className="rounded border-slate-300 text-gov-blue-600 focus:ring-gov-blue-500" 
                />
                <label htmlFor="is_head" className="text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                  Designate as Household Head
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50 transition-colors cursor-pointer">Assign Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default Households;

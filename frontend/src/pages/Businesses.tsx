import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Search, Building2, CheckCircle2, Clock, AlertTriangle, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import type { Business, Resident } from '../types';

export const Businesses: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form states
  const [businessName, setBusinessName] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('Retail/Store');
  const [permitNumber, setPermitNumber] = useState('');
  const [registrationDate, setRegistrationDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [inspectionStatus] = useState('Pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBusinesses = async () => {
    setIsLoading(true);
    try {
      const data = await api.businesses.list();
      setBusinesses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResidents = async () => {
    try {
      const res = await api.residents.list({ limit: 100 });
      setResidents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBusinesses();
    fetchResidents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.businesses.create({
        business_name: businessName,
        owner_id: ownerId,
        permit_number: permitNumber || "PERMIT-TEMP-" + Math.floor(Math.random()*10000),
        status: 'Active',
        address,
        category,
        registration_date: new Date(registrationDate).toISOString(),
        expiry_date: new Date(expiryDate).toISOString(),
        inspection_status: inspectionStatus
      });

      setIsModalOpen(false);
      setBusinessName('');
      setOwnerId('');
      setAddress('');
      setPermitNumber('');
      setRegistrationDate('');
      setExpiryDate('');
      fetchBusinesses();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to register business");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateInspection = async (id: string, status: string) => {
    try {
      await api.businesses.update(id, { inspection_status: status });
      fetchBusinesses();
    } catch (err: any) {
      alert(err.response?.data?.error || "Inspection update failed");
    }
  };

  const handleUpdatePermitStatus = async (id: string, status: string) => {
    try {
      await api.businesses.update(id, { status: status });
      fetchBusinesses();
    } catch (err: any) {
      alert(err.response?.data?.error || "Permit status update failed");
    }
  };

  const filteredBiz = businesses.filter(b => {
    const bizNameMatch = b.business_name.toLowerCase().includes(search.toLowerCase());
    const ownerNameMatch = b.owner ? `${b.owner.first_name} ${b.owner.last_name}`.toLowerCase().includes(search.toLowerCase()) : false;
    const permitMatch = b.permit_number.toLowerCase().includes(search.toLowerCase());
    const statusMatch = statusFilter === '' || b.status === statusFilter;
    return (bizNameMatch || ownerNameMatch || permitMatch) && statusMatch;
  });

  // Calculate Overview Stats
  const totalCount = businesses.length;
  const activeCount = businesses.filter(b => b.status === 'Active').length;
  const pendingInspectionCount = businesses.filter(b => b.inspection_status === 'Pending').length;
  const expiredCount = businesses.filter(b => b.status === 'Expired').length;

  return (
    <div className="space-y-6 relative z-10">
      
      {/* 1. Header Title & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-gov-blue-500/10 text-gov-blue-600 dark:text-gov-blue-400 rounded-xl">
              <Building2 size={18} />
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white tracking-tight uppercase">
              Commercial Business Permits
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
            Register local business permits, track health/sanitation inspections, and monitor commercial compliance
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gov-blue-600 to-gov-blue-800 hover:from-gov-blue-700 hover:to-gov-blue-900 text-white rounded-2xl font-bold text-xs shadow-md shadow-gov-blue-600/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
        >
          <Plus size={16} />
          Register Business
        </button>
      </div>

      {/* 2. Responsive 4 Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">REGISTERED BUSINESSES</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white">{totalCount}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gov-blue-50 dark:bg-gov-blue-950/80 text-gov-blue-600 dark:text-gov-blue-400 flex items-center justify-center border border-gov-blue-200/60 dark:border-gov-blue-800/60">
            <Building2 size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">ACTIVE PERMITS</span>
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{activeCount}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">PENDING INSPECTION</span>
            <span className="text-3xl font-black text-amber-500 dark:text-amber-400">{pendingInspectionCount}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-500 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/60">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">EXPIRED PERMITS</span>
            <span className="text-3xl font-black text-rose-600 dark:text-rose-400">{expiredCount}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/60 dark:border-rose-800/60">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* 3. Main Data Table & Filter Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search business name, owner, permit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto flex-wrap">
            {['', 'Active', 'Pending', 'Expired', 'Suspended'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border transition-all cursor-pointer ${
                  statusFilter === status 
                    ? 'bg-gov-blue-600 border-gov-blue-600 text-white shadow-sm' 
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {status || 'All Permits'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-xs font-bold text-slate-500 dark:text-slate-400">Loading business registry...</div>
          ) : filteredBiz.length === 0 ? (
            <div className="p-12 text-center text-xs font-bold text-slate-500 dark:text-slate-400">No businesses registered matching criteria.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider">
                  <th className="p-4">Permit #</th>
                  <th className="p-4">Business Name</th>
                  <th className="p-4">Owner Name</th>
                  <th className="p-4">Address</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Inspection</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {filteredBiz.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-[11px] text-gov-blue-700 dark:text-gov-blue-400">
                      {b.permit_number}
                    </td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{b.business_name}</td>
                    <td className="p-4">
                      {b.owner ? (
                        <div className="font-bold text-slate-900 dark:text-slate-200">{b.owner.first_name} {b.owner.last_name}</div>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Unknown Owner</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 truncate max-w-[150px] font-medium">{b.address}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-extrabold text-[10px] text-slate-700 dark:text-slate-300">
                        {b.category || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        b.inspection_status === 'Passed'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                          : b.inspection_status === 'Failed'
                          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        {b.inspection_status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        b.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                          : b.status === 'Pending'
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.inspection_status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateInspection(b.id, 'Passed')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              Pass
                            </button>
                            <button
                              onClick={() => handleUpdateInspection(b.id, 'Failed')}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              Fail
                            </button>
                          </>
                        )}
                        {b.status === 'Active' ? (
                          <button
                            onClick={() => handleUpdatePermitStatus(b.id, 'Expired')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Expire
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdatePermitStatus(b.id, 'Active')}
                            className="px-2.5 py-1 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-xl text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Activate
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

      {/* 4. Register Business Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <Briefcase className="text-gov-blue-600 dark:text-gov-blue-400" size={18} />
                Register Commercial Entity
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <Sparkles size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  placeholder="e.g. Lawrence Bakery, Lawrence Hardware..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1">Owner Profile</label>
                <select
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  required
                  title="Owner Profile"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white"
                >
                  <option value="">-- Choose Resident Owner --</option>
                  {residents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.first_name} {r.last_name} ({r.address})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1">Business Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  placeholder="Street name, Barangay Lawrence, Laguna..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    title="Category"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white"
                  >
                    <option value="Retail/Store">Retail/Sari-Sari Store</option>
                    <option value="Food & Beverage">Restaurant / Food Stall</option>
                    <option value="Personal Services">Barbershop / Salon / Laundry</option>
                    <option value="Agriculture">Livestock / Farming</option>
                    <option value="Manufacturing">Livelihood Workshop</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1">Permit Number</label>
                  <input
                    type="text"
                    value={permitNumber}
                    onChange={(e) => setPermitNumber(e.target.value)}
                    placeholder="Auto-generated if empty"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1">Registration Date</label>
                  <input
                    type="date"
                    value={registrationDate}
                    onChange={(e) => setRegistrationDate(e.target.value)}
                    required
                    title="Registration Date"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                    title="Expiry Date"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
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
                  {isSubmitting ? 'Registering...' : 'Register Permit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Businesses;

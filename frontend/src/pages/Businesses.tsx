import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Search } from 'lucide-react';
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

  return (
    <div className="space-y-6 relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-normal text-black dark:text-white">COMMERCIAL BUSINESS PERMITS</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wide">Register local business permits, track health/sanitation inspections, and monitor commercial compliance</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-gov-blue-600/20 transition-all active:scale-95"
        >
          <Plus size={16} />
          Register Business
        </button>
      </div>

      {/* Main Grid for Filter, Search & Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search business name, owner, permit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-700 dark:text-slate-200"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {['', 'Active', 'Pending', 'Expired', 'Suspended'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${
                  statusFilter === status 
                    ? 'bg-gov-blue-50 border-gov-blue-200 text-gov-blue-600 dark:bg-gov-blue-950/30 dark:border-gov-blue-900' 
                    : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                {status || 'All Permits'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-10 text-center text-xs font-bold text-slate-500 dark:text-slate-400">Loading business registry...</div>
          ) : filteredBiz.length === 0 ? (
            <div className="p-10 text-center text-xs font-bold text-slate-500 dark:text-slate-400">No businesses registered.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200/50 dark:border-slate-800/50 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
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
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredBiz.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-mono font-bold text-[11px] text-gov-blue-700 dark:text-gov-blue-300">
                      {b.permit_number}
                    </td>
                    <td className="p-4 font-bold">{b.business_name}</td>
                    <td className="p-4">
                      {b.owner ? (
                        <div className="font-semibold">{b.owner.first_name} {b.owner.last_name}</div>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400">Unknown Owner</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{b.address}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold text-[10px] text-slate-500 dark:text-slate-300">
                        {b.category || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                        b.inspection_status === 'Passed'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : b.inspection_status === 'Failed'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                      }`}>
                        {b.inspection_status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                        b.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : b.status === 'Pending'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
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
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold"
                            >
                              Pass
                            </button>
                            <button
                              onClick={() => handleUpdateInspection(b.id, 'Failed')}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-lg text-[10px] font-bold"
                            >
                              Fail
                            </button>
                          </>
                        )}
                        {b.status === 'Active' ? (
                          <button
                            onClick={() => handleUpdatePermitStatus(b.id, 'Expired')}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-200 rounded-lg text-[10px] font-bold"
                          >
                            Expire
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdatePermitStatus(b.id, 'Active')}
                            className="px-2 py-1 bg-gov-blue-50 hover:bg-gov-blue-100 dark:bg-gov-blue-950/30 text-gov-blue-600 dark:text-gov-blue-400 rounded-lg text-[10px] font-bold"
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

      {/* Register Business Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl max-w-md w-full shadow-2xl p-6 glass-panel relative overflow-hidden animate-scale-up">
            <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-widest flex items-center gap-2 mb-4">
              <Briefcase className="text-gov-blue-500" size={18} />
              Register Commercial Entity
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  placeholder="e.g. Lawrence Bakery, Lawrence Hardware Store..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-700 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Owner Profile</label>
                <select
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  required
                  title="Owner Profile"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-700 dark:text-slate-200"
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
                <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Business Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  placeholder="Street name, Barangay Lawrence, Laguna..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-700 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    title="Category"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-700 dark:text-slate-200"
                  >
                    <option value="Retail/Store">Retail/Sari-Sari Store</option>
                    <option value="Food & Beverage">Restaurant / Food Stall</option>
                    <option value="Personal Services">Barbershop / Salon / Laundry</option>
                    <option value="Agriculture">Livestock / Farming / Feed supplies</option>
                    <option value="Manufacturing">Livelihood Workshop / Crafting</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Permit Number (Optional)</label>
                  <input
                    type="text"
                    value={permitNumber}
                    onChange={(e) => setPermitNumber(e.target.value)}
                    placeholder="Auto-generated if empty"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Registration Date</label>
                  <input
                    type="date"
                    value={registrationDate}
                    onChange={(e) => setRegistrationDate(e.target.value)}
                    required
                    title="Registration Date"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-700 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                    title="Expiry Date"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-700 dark:text-slate-200"
                  />
                </div>
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
                  className="px-4 py-2 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-xl font-bold text-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register permit'}
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

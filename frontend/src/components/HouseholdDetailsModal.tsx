import React, { useState } from 'react';
import {
  Home, MapPin, Users, User, XCircle,
  DollarSign, Phone, Sparkles, CheckCircle2,
  Calendar, Briefcase, BookOpen, Heart,
  Shield, Droplets, Zap, Trash2 as TrashIcon, 
  MoreHorizontal, Building2, ExternalLink,
} from 'lucide-react';
import type { Household, HouseholdMemberInfo, Resident } from '../types';

// ─── Helper ────────────────────────────────────────────────────────────────
function computeAge(birthdate?: string): string {
  if (!birthdate) return '—';
  const today = new Date();
  const dob = new Date(birthdate);
  if (isNaN(dob.getTime())) return '—';
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return `${age} yrs`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <span className="text-xs font-semibold text-slate-800 dark:text-white truncate">
        {value || <span className="text-slate-400 dark:text-slate-600 italic font-normal">Not specified</span>}
      </span>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
      <span className="text-gov-blue-500">{icon}</span>
      <h4 className="text-[10px] font-black uppercase tracking-wider text-gov-blue-600 dark:text-gov-blue-400">
        {title}
      </h4>
    </div>
  );
}

// ─── Poverty badge helper ──────────────────────────────────────────────────
function PovertyBadge({ level }: { level?: string }) {
  const map: Record<string, string> = {
    'Indigent': 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60',
    'Poor': 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/60',
    'Low Income': 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/60',
    'Non-Poor': 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60',
  };
  const cls = map[level || 'Non-Poor'] ?? map['Non-Poor'];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border ${cls}`}>
      <Sparkles size={10} />
      {level || 'Non-Poor'}
    </span>
  );
}

// ─── Component Props ───────────────────────────────────────────────────────
interface Props {
  household: Household;
  onClose: () => void;
  onEdit?: (h: Household) => void;
}

type TabKey = 'head' | 'members' | 'location' | 'economy';

// ══════════════════════════════════════════════════════════════════════════
export const HouseholdDetailsModal: React.FC<Props> = ({ household: h, onClose, onEdit }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('head');

  const headName = h.head
    ? `${h.head.first_name}${h.head.middle_name ? ' ' + h.head.middle_name : ''} ${h.head.last_name}`
    : h.head_first_name
    ? `${h.head_first_name}${h.head_middle_name ? ' ' + h.head_middle_name : ''} ${h.head_last_name ?? ''}`
    : 'No assigned head';

  // Total members = RBI family_members_list + linked members[]
  const familyList: HouseholdMemberInfo[] = h.family_members_list ?? [];
  const linkedMembers: Resident[] = h.members ?? [];
  const totalMemberCount = familyList.length + linkedMembers.length;

  // Use the explicitly saved purok field
  const purok = h.purok || null;

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'head', label: 'Household Head', icon: <User size={13} /> },
    { key: 'members', label: `Family Members (${totalMemberCount})`, icon: <Users size={13} /> },
    { key: 'location', label: 'Location & Housing', icon: <Home size={13} /> },
    { key: 'economy', label: 'Socio-Economic', icon: <DollarSign size={13} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden glass-panel max-h-[92vh] flex flex-col my-auto">

        {/* ── Modal Header ───────────────────────────────────────────── */}
        <div className="relative flex-shrink-0">
          {/* Accent bar */}
          <div className={`absolute top-0 left-0 right-0 h-1 ${
            h.poverty_level === 'Indigent' ? 'bg-gradient-to-r from-rose-400 to-rose-600'
            : h.poverty_level === 'Poor' ? 'bg-gradient-to-r from-orange-400 to-orange-600'
            : h.poverty_level === 'Low Income' ? 'bg-gradient-to-r from-amber-400 to-amber-500'
            : 'bg-gradient-to-r from-gov-blue-400 to-gov-blue-600'
          }`} />

          <div className="pt-3 px-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60">
            <div className="flex items-start justify-between gap-3">
              {/* Left: title block */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-gov-blue-500/10 border border-gov-blue-200 dark:border-gov-blue-900/60 flex items-center justify-center flex-shrink-0">
                  <Home size={20} className="text-gov-blue-500" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    {/* Household code badge */}
                    <span className="text-[10px] bg-gov-blue-50 dark:bg-gov-blue-950/40 text-gov-blue-700 dark:text-gov-blue-300 font-bold px-2.5 py-0.5 rounded-lg tracking-wide uppercase border border-gov-blue-100 dark:border-gov-blue-900/60">
                      {h.household_number}
                    </span>
                    {/* Purok badge */}
                    {purok && (
                      <span className="flex items-center gap-1 text-[10px] bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-bold px-2.5 py-0.5 rounded-lg border border-teal-200 dark:border-teal-900/60">
                        <MapPin size={9} />
                        {purok}
                      </span>
                    )}
                    {/* Members count badge */}
                    <span className="flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Users size={9} />
                      {totalMemberCount} Member{totalMemberCount !== 1 ? 's' : ''}
                    </span>
                    {/* 4Ps badge */}
                    {h.is_4ps_member && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-400/30 font-black px-2 py-0.5 rounded uppercase">
                        4Ps Beneficiary
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white truncate">{headName}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin size={10} className="flex-shrink-0" />
                    {h.address || 'No address specified'}
                  </p>
                </div>
              </div>

              {/* Right: action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {onEdit && (
                  <button
                    onClick={() => { onClose(); onEdit(h); }}
                    className="text-[10px] font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gov-blue-50 dark:bg-gov-blue-950/30 text-gov-blue-600 dark:text-gov-blue-400 border border-gov-blue-100 dark:border-gov-blue-900/60 hover:bg-gov-blue-100 dark:hover:bg-gov-blue-950/60 transition-colors"
                  >
                    <ExternalLink size={11} />
                    Edit
                  </button>
                )}
                <button
                  onClick={onClose}
                  title="Close"
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <XCircle size={22} />
                </button>
              </div>
            </div>

            {/* Poverty level row */}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
              <PovertyBadge level={h.poverty_level} />
              {h.philhealth_coverage && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <Shield size={10} />
                  PhilHealth: {h.philhealth_coverage}
                </span>
              )}
              {h.total_family_income && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                  <DollarSign size={10} />
                  ₱{h.total_family_income}/mo
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Tab Navigation ─────────────────────────────────────────── */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/80 px-4 pt-2 gap-1 overflow-x-auto flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-[11px] font-bold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-slate-900 text-gov-blue-600 dark:text-gov-blue-400 border-t-2 border-gov-blue-500 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Body ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ── TAB 1: Household Head ─────────────────────────────────── */}
          {activeTab === 'head' && (
            <div className="space-y-5">
              <SectionTitle icon={<User size={14} />} title="Impormasyon ng Household Head (Punong Kapatid)" />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InfoRow label="Unang Pangalan" value={h.head_first_name || h.head?.first_name} />
                <InfoRow label="Gitnang Pangalan" value={h.head_middle_name || h.head?.middle_name} />
                <InfoRow label="Apelyido" value={h.head_last_name || h.head?.last_name} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InfoRow label="Petsa ng Kapanganakan" value={formatDate(h.head_birthdate || (h.head?.birthdate))} />
                <InfoRow
                  label="Edad"
                  value={computeAge(h.head_birthdate || (h.head as any)?.birthdate)}
                />
                <InfoRow label="Lugar ng Kapanganakan" value={h.head_birthplace} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InfoRow label="Kasarian (Gender)" value={h.head_gender || h.head?.gender} />
                <InfoRow label="Katayuang Sibil" value={h.head_civil_status || h.head?.civil_status} />
                <InfoRow label="Relihiyon" value={h.head_religion} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InfoRow label="Antas ng Edukasyon" value={h.head_education} />
                <InfoRow label="Hanapbuhay / Trabaho" value={h.head_occupation || h.head?.occupation} />
                <InfoRow label="Buwanang Kita" value={h.head_monthly_income ? `₱${Number(h.head_monthly_income).toLocaleString('en-PH')}/mo` : undefined} />
              </div>

              {/* Linked Resident profile note */}
              {h.head && (
                <div className="mt-2 p-3.5 bg-gov-blue-50 dark:bg-gov-blue-950/30 border border-gov-blue-100 dark:border-gov-blue-900/50 rounded-xl flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="text-gov-blue-500 flex-shrink-0" />
                  <p className="text-[11px] font-semibold text-gov-blue-700 dark:text-gov-blue-300">
                    Linked to registered Resident profile:{' '}
                    <span className="font-black">{h.head.first_name} {h.head.last_name}</span>
                    {h.head.qr_id && <span className="ml-1 font-mono opacity-60">({h.head.qr_id})</span>}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: Family Members ─────────────────────────────────── */}
          {activeTab === 'members' && (
            <div className="space-y-5">
              <SectionTitle icon={<Users size={14} />} title={`Komposisyon ng Pamilya · ${totalMemberCount} miyembro`} />

              {/* Combined member count banner */}
              {totalMemberCount === 0 ? (
                <div className="py-12 flex flex-col items-center gap-3 text-center">
                  <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Users size={24} className="text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    No family members registered for this household.
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Use the Edit button to add family members.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">

                  {/* ── RBI-registered family members ── */}
                  {familyList.length > 0 && (
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                        RBI Family List ({familyList.length})
                      </p>
                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
                              <th className="text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">#</th>
                              <th className="text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Full Name</th>
                              <th className="text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Relationship</th>
                              <th className="text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Age</th>
                              <th className="text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Gender</th>
                              <th className="text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Civil Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {familyList.map((fm: HouseholdMemberInfo, idx: number) => (
                              <tr
                                key={idx}
                                className="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-950/40 transition-colors"
                              >
                                <td className="px-3 py-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-500">{idx + 1}</td>
                                <td className="px-3 py-2.5 font-semibold text-slate-800 dark:text-white whitespace-nowrap">
                                  {fm.full_name || <span className="text-slate-400 italic font-normal">No name</span>}
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="inline-flex items-center gap-1 text-[10px] bg-gov-blue-50 dark:bg-gov-blue-950/40 text-gov-blue-700 dark:text-gov-blue-300 border border-gov-blue-100 dark:border-gov-blue-900/50 font-bold px-2 py-0.5 rounded-lg">
                                    <Heart size={9} />
                                    {fm.relation || '—'}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                  {computeAge(fm.birthdate)}
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                                    fm.gender === 'Female'
                                      ? 'bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400'
                                      : 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400'
                                  }`}>
                                    {fm.gender || '—'}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300 text-[11px]">
                                  {fm.civil_status || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ── Linked registered residents ── */}
                  {linkedMembers.length > 0 && (
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                        Linked Resident Profiles ({linkedMembers.length})
                      </p>
                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
                              <th className="text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">#</th>
                              <th className="text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Full Name</th>
                              <th className="text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Age</th>
                              <th className="text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Gender</th>
                              <th className="text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Civil Status</th>
                              <th className="text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Role</th>
                            </tr>
                          </thead>
                          <tbody>
                            {linkedMembers.map((m: Resident, idx: number) => (
                              <tr
                                key={m.id}
                                className="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-950/40 transition-colors"
                              >
                                <td className="px-3 py-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-500">{idx + 1}</td>
                                <td className="px-3 py-2.5 font-semibold text-slate-800 dark:text-white whitespace-nowrap">
                                  {m.first_name} {m.last_name}
                                  {m.qr_id && (
                                    <span className="ml-1.5 font-mono text-[9px] text-slate-400">{m.qr_id}</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                  {m.age ? `${m.age} yrs` : computeAge(m.birthdate)}
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                                    m.gender === 'Female'
                                      ? 'bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400'
                                      : 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400'
                                  }`}>
                                    {m.gender}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300 text-[11px]">
                                  {m.civil_status}
                                </td>
                                <td className="px-3 py-2.5">
                                  {m.is_household_head ? (
                                    <span className="text-[9px] bg-gov-gold-100 dark:bg-gov-gold-950/50 text-gov-gold-700 dark:text-gov-gold-300 font-black px-2 py-0.5 rounded-lg border border-gov-gold-200 dark:border-gov-gold-900/60 uppercase">
                                      Head
                                    </span>
                                  ) : (
                                    <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold px-2 py-0.5 rounded-lg uppercase">
                                      Member
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: Location / Housing ─────────────────────────────── */}
          {activeTab === 'location' && (
            <div className="space-y-5">
              <SectionTitle icon={<MapPin size={14} />} title="Lokasyon at Impormasyon ng Bahay" />

              {/* Address card */}
              <div className="p-4 bg-gov-blue-50 dark:bg-gov-blue-950/20 border border-gov-blue-100 dark:border-gov-blue-900/40 rounded-xl flex gap-3 items-start">
                <MapPin size={16} className="text-gov-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gov-blue-400 mb-0.5">Full Address</p>
                  <p className="text-xs font-semibold text-gov-blue-800 dark:text-gov-blue-200 leading-relaxed">
                    {h.address || <span className="italic font-normal text-slate-400">No address specified</span>}
                  </p>
                  {purok && (
                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-bold px-2 py-0.5 rounded-lg border border-teal-200 dark:border-teal-900/60">
                      <MapPin size={9} />
                      {purok}
                    </span>
                  )}
                </div>
              </div>

              {/* Housing details grid */}
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Housing Profile</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { icon: <Building2 size={13} />, label: 'Housing Tenure', value: h.housing_tenure },
                    { icon: <Home size={13} />, label: 'House Materials', value: h.house_materials },
                    { icon: <MoreHorizontal size={13} />, label: 'Number of Rooms', value: h.number_of_rooms },
                    { icon: <Droplets size={13} />, label: 'Water Source', value: h.water_source },
                    { icon: <Zap size={13} />, label: 'Power Source', value: h.power_source },
                    { icon: <TrashIcon size={13} />, label: 'Waste Disposal', value: h.waste_disposal },
                  ].map((item, i) => (
                    <div key={i} className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <div className="flex items-center gap-1.5 mb-1 text-slate-400">
                        {item.icon}
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-white">
                        {item.value || <span className="text-slate-400 italic font-normal">—</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Toilet type */}
              {h.toilet_type && (
                <InfoRow label="Toilet Type" value={h.toilet_type} />
              )}
            </div>
          )}

          {/* ── TAB 4: Socio-Economic ─────────────────────────────────── */}
          {activeTab === 'economy' && (
            <div className="space-y-5">
              <SectionTitle icon={<DollarSign size={14} />} title="Sosyo-Ekonomikong Impormasyon at 4Ps" />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InfoRow
                  label="Kabuuang Kita ng Pamilya"
                  value={h.total_family_income ? `₱${Number(h.total_family_income).toLocaleString('en-PH')}/mo` : undefined}
                />
                <InfoRow label="Ibang Pinagkukunan ng Kita" value={h.other_income_sources} />
                <InfoRow label="PhilHealth Coverage" value={h.philhealth_coverage} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow label="Espesyal na Kategorya" value={h.special_categories} />
                <InfoRow label="Poverty Classification" value={h.poverty_level} />
              </div>

              {/* 4Ps status */}
              <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                h.is_4ps_member
                  ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                  : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  h.is_4ps_member
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                }`}>
                  <Sparkles size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">4Ps Beneficiary Status</p>
                  <p className={`text-xs font-bold mt-0.5 ${
                    h.is_4ps_member
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {h.is_4ps_member ? '✓ Registered 4Ps Beneficiary' : 'Not a 4Ps Beneficiary'}
                  </p>
                </div>
              </div>

              {/* Contact info */}
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                  <Phone size={11} />
                  Contact Information
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow label="Contact Number" value={h.contact_number} />
                  <InfoRow label="Email Address" value={h.email_address} />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center justify-between">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            Household ID: <span className="font-mono">{h.id?.slice(0, 8)}…</span>
          </p>
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={() => { onClose(); onEdit(h); }}
                className="px-4 py-2 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink size={13} />
                Edit Household
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HouseholdDetailsModal;

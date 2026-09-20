import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCog, Plus, Search, Pencil, Trash2, X, Eye, EyeOff,
  ShieldCheck, RefreshCw, Check, AlertTriangle, Lock, Mail, User
} from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { PageHeader, Card, CardContent, Badge, Button, Input, Modal, EmptyState } from '../components/ui';

interface StaffUser {
  id: string;
  username: string;
  email: string;
  role: string;
  is_verified: boolean;
  created_at: string;
}

const STAFF_ROLES = [
  'Barangay Captain',
  'Secretary',
  'Treasurer',
  'Health Worker',
  'Staff',
  'Super Admin',
];

const ROLE_STYLES: Record<string, { badge: string; avatar: string; label: string }> = {
  'Super Admin':      { badge: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60', avatar: 'bg-purple-500', label: 'SA' },
  'Barangay Captain': { badge: 'bg-gov-blue-100 text-gov-blue-700 border-gov-blue-200 dark:bg-gov-blue-950/60 dark:text-gov-blue-300 dark:border-gov-blue-800/60', avatar: 'bg-gov-blue-500', label: 'BC' },
  'Secretary':        { badge: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/60', avatar: 'bg-sky-500', label: 'SE' },
  'Treasurer':        { badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60', avatar: 'bg-amber-500', label: 'TR' },
  'Health Worker':    { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60', avatar: 'bg-emerald-500', label: 'HW' },
  'Staff':            { badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', avatar: 'bg-slate-400', label: 'ST' },
};

/* ─────────────────────────────────────────────── */
/* Spinner Helper                                  */
/* ─────────────────────────────────────────────── */
const Spinner = () => (
  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
  </svg>
);

/* ─────────────────────────────────────────────── */
/* Modal: Create Staff Account                     */
/* ─────────────────────────────────────────────── */
interface CreateModalProps { onClose: () => void; onCreated: () => void; }

const CreateModal: React.FC<CreateModalProps> = ({ onClose, onCreated }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Staff');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.staffAccounts.create({ username, email, password, role });
      setSuccess('Staff account created successfully!');
      setTimeout(() => { onCreated(); onClose(); }, 900);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to create staff account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="New Staff Account"
      description="Create an officer or staff login for portal access."
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit as any} disabled={loading} leftIcon={loading ? <Spinner /> : <Check size={14} />}>
            {loading ? 'Creating...' : 'Create Account'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0" />{error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-2">
            <Check size={14} className="shrink-0" />{success}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            isRequired
            leftIcon={<User size={14} />}
            placeholder="e.g. sec_dela_cruz"
          />
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            isRequired
            leftIcon={<Mail size={14} />}
            placeholder="staff@barangay.gov.ph"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Role <span className="text-rose-500">*</span>
            </label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gov-blue-500/30 transition-shadow"
            >
              {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="relative">
            <Input
              label="Password"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              isRequired
              leftIcon={<Lock size={14} />}
              placeholder="Min 8 chars..."
              rightIcon={
                <button type="button" onClick={() => setShowPw(!showPw)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
            />
          </div>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
          Staff accounts are <strong className="text-slate-700 dark:text-slate-300">pre-verified</strong> and can log in immediately. Password must include uppercase, lowercase, digits, and a special character.
        </p>
      </div>
    </Modal>
  );
};

/* ─────────────────────────────────────────────── */
/* Modal: Edit Staff Account                       */
/* ─────────────────────────────────────────────── */
interface EditModalProps { staff: StaffUser; onClose: () => void; onUpdated: () => void; }

const EditModal: React.FC<EditModalProps> = ({ staff, onClose, onUpdated }) => {
  const [username, setUsername] = useState(staff.username);
  const [email, setEmail] = useState(staff.email);
  const [role, setRole] = useState(staff.role);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload: any = {};
      if (username !== staff.username) payload.username = username;
      if (email !== staff.email) payload.email = email;
      if (role !== staff.role) payload.role = role;
      if (password) payload.password = password;
      await api.staffAccounts.update(staff.id, payload);
      setSuccess('Account updated!');
      setTimeout(() => { onUpdated(); onClose(); }, 800);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Edit — @${staff.username}`}
      description="Update account information and access permissions."
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit as any} disabled={loading} leftIcon={loading ? <Spinner /> : <Check size={14} />}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0" />{error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-2">
            <Check size={14} className="shrink-0" />{success}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Username" value={username} onChange={e => setUsername(e.target.value)} leftIcon={<User size={14} />} />
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} leftIcon={<Mail size={14} />} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gov-blue-500/30 transition-shadow"
            >
              {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <Input
            label="New Password"
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            leftIcon={<Lock size={14} />}
            placeholder="Leave blank to keep current..."
            helperText="Optional: only fill to reset"
            rightIcon={
              <button type="button" onClick={() => setShowPw(!showPw)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            }
          />
        </div>
      </div>
    </Modal>
  );
};

/* ─────────────────────────────────────────────── */
/* Modal: Delete Confirmation                      */
/* ─────────────────────────────────────────────── */
interface DeleteModalProps { staff: StaffUser; onClose: () => void; onDeleted: () => void; }

const DeleteModal: React.FC<DeleteModalProps> = ({ staff, onClose, onDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.staffAccounts.delete(staff.id);
      onDeleted();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to delete account');
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Delete Account?"
      description={`This will permanently remove @${staff.username} (${staff.role}). This action cannot be undone.`}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={handleDelete} disabled={loading} leftIcon={loading ? <Spinner /> : <Trash2 size={14} />}>
            {loading ? 'Deleting...' : 'Delete Account'}
          </Button>
        </>
      }
    >
      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertTriangle size={14} className="shrink-0" />{error}
        </div>
      )}
      <div className="flex justify-center py-3">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex items-center justify-center">
          <Trash2 size={26} className="text-rose-500" />
        </div>
      </div>
    </Modal>
  );
};

/* ─────────────────────────────────────────────── */
/* Main Page Component                             */
/* ─────────────────────────────────────────────── */
export const StaffAccounts: React.FC = () => {
  const { user } = useAuthStore();
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [filtered, setFiltered] = useState<StaffUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.staffAccounts.list();
      setStaffList(res.data || []);
    } catch (err) {
      console.error('Failed to load staff accounts', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  useEffect(() => {
    let list = staffList;
    if (roleFilter !== 'All') list = list.filter(s => s.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.username.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [staffList, search, roleFilter]);

  const roleCounts = STAFF_ROLES.reduce((acc, r) => {
    acc[r] = staffList.filter(s => s.role === r).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Staff Accounts"
        subtitle="Manage officer and staff user accounts for portal access."
        badge={<Badge variant="neutral">{staffList.length} Total</Badge>}
        actions={
          <Button onClick={() => setShowCreate(true)} leftIcon={<Plus size={15} />}>
            New Staff Account
          </Button>
        }
      />

      {/* ── Role Overview Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAFF_ROLES.map(r => {
          const isActive = roleFilter === r;
          return (
            <button
              key={r}
              onClick={() => setRoleFilter(isActive ? 'All' : r)}
              className={`relative p-3.5 rounded-2xl border text-left transition-all duration-150 hover:shadow-card-hover cursor-pointer ${
                isActive
                  ? 'bg-gov-blue-600 border-gov-blue-700 shadow-card text-white'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-gov-blue-300 dark:hover:border-gov-blue-700'
              }`}
            >
              <div className={`text-2xl font-black leading-none mb-1 ${isActive ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                {roleCounts[r] || 0}
              </div>
              <div className={`text-[9px] font-bold uppercase tracking-wider leading-tight ${isActive ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
                {r}
              </div>
              {isActive && (
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-white/60" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Filter & Search Bar ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-card p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by username, email, or role..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-gov-blue-500/30 transition-shadow"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gov-blue-500/30 transition-shadow"
            >
              <option value="All">All Roles</option>
              {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button
              onClick={fetchStaff}
              className="p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:text-gov-blue-600 dark:hover:text-gov-blue-400 transition-colors"
              title="Refresh list"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Staff Table ── */}
      <Card>
        <CardContent className="!p-0">
          {loading ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-10 h-10 border-[3px] border-gov-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Loading staff accounts...</p>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<UserCog size={36} className="text-slate-300 dark:text-slate-700" />}
              title="No staff accounts found"
              description={search || roleFilter !== 'All' ? 'Try adjusting your search or filter criteria.' : 'Click "New Staff Account" to add the first one.'}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Account</th>
                      <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Role</th>
                      <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest hidden md:table-cell">Status</th>
                      <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest hidden lg:table-cell">Created</th>
                      <th className="text-right px-5 py-3.5 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filtered.map(staff => {
                      const style = ROLE_STYLES[staff.role] || ROLE_STYLES['Staff'];
                      return (
                        <tr key={staff.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors group">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl ${style.avatar} text-white text-[11px] font-black flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                {style.label}
                              </div>
                              <div>
                                <p className="font-bold text-xs text-slate-900 dark:text-white">@{staff.username}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">{staff.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${style.badge}`}>
                              {staff.role}
                            </span>
                          </td>
                          <td className="px-5 py-4 hidden md:table-cell">
                            {staff.is_verified ? (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                <ShieldCheck size={13} /> Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                <AlertTriangle size={13} /> Unverified
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 hidden lg:table-cell">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{staff.created_at}</span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditTarget(staff)}
                                className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors border border-amber-200 dark:border-amber-800/60"
                                title="Edit Account"
                              >
                                <Pencil size={13} />
                              </button>
                              {staff.id !== user?.id && (
                                <button
                                  onClick={() => setDeleteTarget(staff)}
                                  className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors border border-rose-200 dark:border-rose-800/60"
                                  title="Delete Account"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                  Showing <span className="text-slate-700 dark:text-slate-300 font-bold">{filtered.length}</span> of <span className="text-slate-700 dark:text-slate-300 font-bold">{staffList.length}</span> account{staffList.length !== 1 ? 's' : ''}
                </p>
                {(search || roleFilter !== 'All') && (
                  <button
                    onClick={() => { setSearch(''); setRoleFilter('All'); }}
                    className="text-[10px] font-semibold text-gov-blue-600 dark:text-gov-blue-400 hover:underline flex items-center gap-1"
                  >
                    <X size={11} />Clear filters
                  </button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={fetchStaff} />}
      {editTarget && <EditModal staff={editTarget} onClose={() => setEditTarget(null)} onUpdated={fetchStaff} />}
      {deleteTarget && <DeleteModal staff={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={fetchStaff} />}
    </div>
  );
};

export default StaffAccounts;

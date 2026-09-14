import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCog, Plus, Search, Pencil, Trash2, X, Eye, EyeOff,
  ShieldCheck, RefreshCw, Check, AlertTriangle, Lock, Mail, User
} from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

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

const ROLE_COLORS: Record<string, string> = {
  'Super Admin':      'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20',
  'Barangay Captain': 'bg-gov-blue-500/10 text-gov-blue-700 dark:text-gov-blue-300 border-gov-blue-500/20',
  'Secretary':        'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
  'Treasurer':        'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  'Health Worker':    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  'Staff':            'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20',
};

const ROLE_INITIALS: Record<string, string> = {
  'Super Admin':      'SA',
  'Barangay Captain': 'BC',
  'Secretary':        'SE',
  'Treasurer':        'TR',
  'Health Worker':    'HW',
  'Staff':            'ST',
};

/* ─────────────────────────────────── */
/* Modal: Create Staff Account         */
/* ─────────────────────────────────── */
interface CreateModalProps {
  onClose: () => void;
  onCreated: () => void;
}

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
      setTimeout(() => {
        onCreated();
        onClose();
      }, 900);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to create staff account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl max-w-lg w-full shadow-2xl p-7 relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gov-blue-500/10 border border-gov-blue-500/20 flex items-center justify-center">
              <Plus className="text-gov-blue-600 dark:text-gov-blue-400" size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">New Staff Account</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Create Officer / Staff Login</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <Check size={14} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">Username</label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  placeholder="e.g. sec_dela_cruz"
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">Email</label>
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="staff@barangay.gov.ph"
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white"
              >
                {STAFF_ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">Password</label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min 8 chars, mixed case..."
                  className="w-full pl-8 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
            Staff accounts are <strong>pre-verified</strong> and can log in immediately. Password must have uppercase, lowercase, digits, and a special character.
          </p>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-xl font-bold text-xs transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> Creating...</> : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─────────────────────────────────── */
/* Modal: Edit Staff Account           */
/* ─────────────────────────────────── */
interface EditModalProps {
  staff: StaffUser;
  onClose: () => void;
  onUpdated: () => void;
}

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl max-w-lg w-full shadow-2xl p-7 relative">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Pencil className="text-amber-600 dark:text-amber-400" size={16} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Edit Staff Account</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">@{staff.username}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <Check size={14} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white"
              >
                {STAFF_ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">New Password <span className="normal-case font-medium">(optional)</span></label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Leave blank to keep current..."
                  className="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> Saving...</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─────────────────────────────────── */
/* Delete Confirmation Modal           */
/* ─────────────────────────────────── */
interface DeleteModalProps {
  staff: StaffUser;
  onClose: () => void;
  onDeleted: () => void;
}

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl max-w-sm w-full shadow-2xl p-7">
        <div className="text-center space-y-3 mb-6">
          <div className="w-14 h-14 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
            <Trash2 className="text-rose-500" size={22} />
          </div>
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white">Delete Account?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              This will permanently remove <strong className="text-slate-700 dark:text-slate-200">@{staff.username}</strong> ({staff.role}). This action cannot be undone.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        <div className="flex gap-2.5">
          <button onClick={onClose} className="flex-1 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> Deleting...</> : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────── */
/* Main Page Component                 */
/* ─────────────────────────────────── */
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
    if (roleFilter !== 'All') {
      list = list.filter(s => s.role === roleFilter);
    }
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

  // Role summary counts
  const roleCounts = STAFF_ROLES.reduce((acc, r) => {
    acc[r] = staffList.filter(s => s.role === r).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 relative z-10 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-normal text-slate-900 dark:text-white flex items-center gap-2.5">
            <UserCog size={22} className="text-gov-blue-600 dark:text-gov-blue-400" />
            STAFF ACCOUNTS
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wide mt-0.5">
            Manage officer and staff user accounts for portal access
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-gov-blue-600/20 transition-all hover:scale-[1.02] active:scale-100"
        >
          <Plus size={15} />
          New Staff Account
        </button>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAFF_ROLES.map(r => (
          <button
            key={r}
            onClick={() => setRoleFilter(roleFilter === r ? 'All' : r)}
            className={`p-3.5 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-100 ${
              roleFilter === r
                ? 'bg-gov-blue-600 border-gov-blue-700 text-white shadow-lg shadow-gov-blue-600/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-gov-blue-400 dark:hover:border-gov-blue-600'
            }`}
          >
            <div className={`text-2xl font-black leading-none ${roleFilter === r ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
              {roleCounts[r] || 0}
            </div>
            <div className={`text-[9px] font-bold uppercase tracking-wider mt-1 leading-tight ${roleFilter === r ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
              {r}
            </div>
          </button>
        ))}
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by username, email, or role..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none text-slate-900 dark:text-white"
          >
            <option value="All">All Roles</option>
            {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button
            onClick={fetchStaff}
            className="p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:text-gov-blue-600 dark:hover:text-gov-blue-400 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-gov-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading staff accounts...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <UserCog size={32} className="text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No staff accounts found</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {search || roleFilter !== 'All' ? 'Try adjusting your search or filter.' : 'Click "New Staff Account" to add one.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Account</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Role</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider hidden md:table-cell">Status</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider hidden lg:table-cell">Created</th>
                  <th className="text-right px-5 py-3.5 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(staff => (
                  <tr
                    key={staff.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-2xl border text-[11px] font-black flex items-center justify-center flex-shrink-0 ${ROLE_COLORS[staff.role] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {ROLE_INITIALS[staff.role] || staff.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-white">@{staff.username}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{staff.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl border ${ROLE_COLORS[staff.role] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {staff.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      {staff.is_verified ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck size={13} /> Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 dark:text-amber-400">
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
                          className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors"
                          title="Edit Account"
                        >
                          <Pencil size={13} />
                        </button>
                        {staff.id !== user?.id && (
                          <button
                            onClick={() => setDeleteTarget(staff)}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete Account"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
            Showing {filtered.length} of {staffList.length} staff account{staffList.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={fetchStaff}
        />
      )}
      {editTarget && (
        <EditModal
          staff={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={fetchStaff}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          staff={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={fetchStaff}
        />
      )}
    </div>
  );
};

export default StaffAccounts;

import React, { useState, useEffect, useCallback } from 'react';
import {
  Terminal, Activity, Users, ShieldAlert, RefreshCw, Search,
  ChevronLeft, ChevronRight, Filter, Clock, Globe, User,
  AlertTriangle, CheckCircle, LogIn, FileText, Trash2, Edit,
  BarChart2, Cpu, Database, Eye, AlertOctagon
} from 'lucide-react';

import { api } from '../services/api';


// ─── Types ───────────────────────────────────────────────────────────────────

interface AuditLog {
  id: string;
  user_id?: string;
  username: string;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}

interface DevUser {
  id: string;
  username: string;
  email: string;
  role: string;
  is_verified: boolean;
  created_at: string;
  last_action?: string;
  last_ip?: string;
  last_seen?: string;
}

interface ErrorLogEntry {
  id: string;
  source: string;
  level: string;
  status_code?: number;
  method?: string;
  path?: string;
  message: string;
  stack?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

interface DevStats {
  total_users: number;
  total_residents: number;
  total_staff: number;
  total_audit_logs: number;
  total_ai_queries: number;
  logins_last_24h: number;
  top_actions: { action: string; count: number }[];
}


// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  LOGIN:                'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  REGISTER:             'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  FORGOT_PASSWORD_REQUEST: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  PASSWORD_RESET:       'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  CREATE_STAFF_ACCOUNT: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
  UPDATE_STAFF_ACCOUNT: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
  DELETE_STAFF_ACCOUNT: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  LOGIN:                <LogIn size={12} />,
  REGISTER:             <User size={12} />,
  FORGOT_PASSWORD_REQUEST: <AlertTriangle size={12} />,
  PASSWORD_RESET:       <ShieldAlert size={12} />,
  CREATE_STAFF_ACCOUNT: <Users size={12} />,
  UPDATE_STAFF_ACCOUNT: <Edit size={12} />,
  DELETE_STAFF_ACCOUNT: <Trash2 size={12} />,
};

const ROLE_COLORS: Record<string, string> = {
  'Super Admin':    'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  'Barangay Captain':'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  'Secretary':      'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'Treasurer':      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  'Health Worker':  'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  'Staff':          'bg-slate-50 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  'Resident':       'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  'Developer':      'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/50 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800',
};

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-PH', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  } catch { return iso; }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string }> = ({ icon, label, value, color }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
    <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
    <div>
      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-black text-slate-900 dark:text-white">{Number(value).toLocaleString()}</p>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = 'overview' | 'audit' | 'users' | 'errors';


export const DevConsole: React.FC = () => {
  const [tab, setTab] = useState<Tab>('overview');

  // Error logs state
  const [errorLogs, setErrorLogs] = useState<ErrorLogEntry[]>([]);
  const [errorLogsTotal, setErrorLogsTotal] = useState(0);
  const [errorLogsPage, setErrorLogsPage] = useState(1);
  const [errorLogsSearch, setErrorLogsSearch] = useState('');
  const [errorLogsSource, setErrorLogsSource] = useState('');
  const [errorLogsLevel, setErrorLogsLevel] = useState('');
  const [errorLogsLoading, setErrorLogsLoading] = useState(false);
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);

  // Audit logs state

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsSearch, setLogsSearch] = useState('');
  const [logsActionFilter, setLogsActionFilter] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);

  // Users state
  const [users, setUsers] = useState<DevUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRoleFilter, setUsersRoleFilter] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  // Stats state
  const [stats, setStats] = useState<DevStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const LIMIT = 25;

  // ── Fetch Error Logs ──────────────────────────────────────────────────────
  const fetchErrorLogs = useCallback(async () => {
    setErrorLogsLoading(true);
    try {
      const data = await api.dev.errorLogs({ page: errorLogsPage, limit: LIMIT, search: errorLogsSearch, source: errorLogsSource, level: errorLogsLevel });
      setErrorLogs(data.data || []);
      setErrorLogsTotal(data.total || 0);
    } catch (err) {
      console.error('DevConsole: fetch error logs failed', err);
    } finally {
      setErrorLogsLoading(false);
    }
  }, [errorLogsPage, errorLogsSearch, errorLogsSource, errorLogsLevel]);

  // ── Fetch Audit Logs ────────────────────────────────────────────────────────

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const data = await api.dev.auditLogs({ page: logsPage, limit: LIMIT, search: logsSearch, action: logsActionFilter });
      setLogs(data.data || []);
      setLogsTotal(data.total || 0);
    } catch (err) {
      console.error('DevConsole: fetch audit logs failed', err);
    } finally {
      setLogsLoading(false);
    }
  }, [logsPage, logsSearch, logsActionFilter]);

  // ── Fetch Users ─────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const data = await api.dev.users({ page: usersPage, limit: LIMIT, search: usersSearch, role: usersRoleFilter });
      setUsers(data.data || []);
      setUsersTotal(data.total || 0);
    } catch (err) {
      console.error('DevConsole: fetch users failed', err);
    } finally {
      setUsersLoading(false);
    }
  }, [usersPage, usersSearch, usersRoleFilter]);

  // ── Fetch Stats ─────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await api.dev.stats();
      setStats(data);
    } catch (err) {
      console.error('DevConsole: fetch stats failed', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { if (tab === 'errors') fetchErrorLogs(); }, [tab, fetchErrorLogs]);
  useEffect(() => { if (tab === 'audit') fetchLogs(); }, [tab, fetchLogs]);
  useEffect(() => { if (tab === 'users') fetchUsers(); }, [tab, fetchUsers]);
  useEffect(() => { if (tab === 'overview') fetchStats(); }, [tab, fetchStats]);


  const logsPages = Math.max(1, Math.ceil(logsTotal / LIMIT));
  const usersPages = Math.max(1, Math.ceil(usersTotal / LIMIT));
  const errorLogsPages = Math.max(1, Math.ceil(errorLogsTotal / LIMIT));

  const LEVEL_STYLES: Record<string, string> = {
    panic:   'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
    error:   'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
  };
  const SOURCE_STYLES: Record<string, string> = {
    backend:  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    frontend: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
  };


  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-fuchsia-600 text-white shadow-md">
            <Terminal size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Developer Console</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">System audit logs · User activity · Runtime statistics</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800">
          <Cpu size={12} />
          DEV ACCESS
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
        {([
          { key: 'overview', label: 'Overview',     icon: <BarChart2 size={14} /> },
          { key: 'errors',   label: 'Error Logs',   icon: <AlertOctagon size={14} /> },
          { key: 'audit',    label: 'Audit Logs',   icon: <FileText size={14} /> },
          { key: 'users',    label: 'User Activity', icon: <Users size={14} /> },
        ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(t => (

          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === t.key
                ? 'bg-white dark:bg-slate-800 text-fuchsia-700 dark:text-fuchsia-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {statsLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : stats ? (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard icon={<Users size={18} />}    label="Total Users"      value={stats.total_users}      color="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" />
                <StatCard icon={<User size={18} />}     label="Residents"        value={stats.total_residents}  color="bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400" />
                <StatCard icon={<ShieldAlert size={18}/>}label="Staff Accounts"  value={stats.total_staff}      color="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" />
                <StatCard icon={<FileText size={18} />} label="Audit Log Entries" value={stats.total_audit_logs} color="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" />
                <StatCard icon={<Activity size={18} />} label="AI Queries Total" value={stats.total_ai_queries}  color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" />
                <StatCard icon={<LogIn size={18} />}    label="Logins (24h)"    value={stats.logins_last_24h}  color="bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/50 dark:text-fuchsia-400" />
              </div>

              {/* Top Actions */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Activity size={16} className="text-fuchsia-600 dark:text-fuchsia-400" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Top Audit Actions</h3>
                </div>
                <div className="space-y-2">
                  {(stats.top_actions || []).map((a, i) => {
                    const max = stats.top_actions[0]?.count || 1;
                    const pct = Math.round((a.count / max) * 100);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-36 text-[11px] font-bold text-slate-600 dark:text-slate-400 truncate">{a.action}</span>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-[11px] font-black text-slate-700 dark:text-slate-300">{a.count.toLocaleString()}</span>
                      </div>
                    );
                  })}
                  {(!stats.top_actions || stats.top_actions.length === 0) && (
                    <p className="text-xs text-slate-400 text-center py-4">No audit data yet</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-slate-400 text-sm py-12">
              <Database size={32} className="mx-auto mb-2 opacity-40" />
              <p>Could not load stats. Backend may be offline.</p>
            </div>
          )}
        </div>
      )}

      {/* ── AUDIT LOGS TAB ── */}
      {tab === 'audit' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search details or IP…"
                value={logsSearch}
                onChange={e => { setLogsSearch(e.target.value); setLogsPage(1); }}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={logsActionFilter}
                onChange={e => { setLogsActionFilter(e.target.value); setLogsPage(1); }}
                className="pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 appearance-none cursor-pointer"
              >
                <option value="">All Actions</option>
                <option value="LOGIN">LOGIN</option>
                <option value="REGISTER">REGISTER</option>
                <option value="FORGOT_PASSWORD_REQUEST">FORGOT_PASSWORD</option>
                <option value="PASSWORD_RESET">PASSWORD_RESET</option>
                <option value="CREATE_STAFF_ACCOUNT">CREATE_STAFF</option>
                <option value="UPDATE_STAFF_ACCOUNT">UPDATE_STAFF</option>
                <option value="DELETE_STAFF_ACCOUNT">DELETE_STAFF</option>
              </select>
            </div>
            <button
              onClick={fetchLogs}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-fuchsia-600 text-white text-xs font-bold hover:bg-fuchsia-700 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} className={logsLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                    <th className="text-left px-4 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Time</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Details</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {logsLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        <FileText size={28} className="mx-auto mb-2 opacity-30" />
                        <p className="font-semibold">No audit logs found</p>
                      </td>
                    </tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <Clock size={11} />
                            <span>{fmtTime(log.created_at)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{log.username}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                            {ACTION_ICONS[log.action] || <Activity size={12} />}
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <span className="text-slate-600 dark:text-slate-400 line-clamp-1">{log.details}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <Globe size={11} />
                            <span className="font-mono">{log.ip_address}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {logsTotal.toLocaleString()} total entries · Page {logsPage} of {logsPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                  disabled={logsPage <= 1}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setLogsPage(p => Math.min(logsPages, p + 1))}
                  disabled={logsPage >= logsPages}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── USER ACTIVITY TAB ── */}
      {tab === 'users' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search username or email…"
                value={usersSearch}
                onChange={e => { setUsersSearch(e.target.value); setUsersPage(1); }}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={usersRoleFilter}
                onChange={e => { setUsersRoleFilter(e.target.value); setUsersPage(1); }}
                className="pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 appearance-none cursor-pointer"
              >
                <option value="">All Roles</option>
                {['Super Admin','Barangay Captain','Secretary','Treasurer','Health Worker','Staff','Resident','Developer'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <button
              onClick={fetchUsers}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-fuchsia-600 text-white text-xs font-bold hover:bg-fuchsia-700 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} className={usersLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* User Cards Grid */}
          {usersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                      <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded" />
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Users size={32} className="mx-auto mb-2 opacity-30" />
              <p className="font-semibold text-sm">No users found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.map(u => (
                <div key={u.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 hover:border-fuchsia-300 dark:hover:border-fuchsia-700 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-sm text-slate-600 dark:text-slate-400 uppercase">
                        {u.username.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-black text-sm text-slate-900 dark:text-white">{u.username}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200'}`}>
                        {u.role}
                      </span>
                      <span className={`flex items-center gap-1 text-[10px] font-semibold ${u.is_verified ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        <CheckCircle size={10} />
                        {u.is_verified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </div>

                  {/* Activity info */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {u.last_action && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <Activity size={11} />
                          <span>Last Action</span>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${ACTION_COLORS[u.last_action] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {u.last_action}
                        </span>
                      </div>
                    )}
                    {u.last_seen && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <Clock size={11} />
                          <span>Last Seen</span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{timeAgo(u.last_seen)}</span>
                      </div>
                    )}
                    {u.last_ip && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <Globe size={11} />
                          <span>Last IP</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">{u.last_ip}</span>
                      </div>
                    )}
                    {!u.last_action && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">No recorded activity yet</p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                        <Eye size={11} />
                        <span>Registered</span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{fmtTime(u.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {usersPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">{usersTotal.toLocaleString()} users · Page {usersPage} of {usersPages}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setUsersPage(p => Math.max(1, p - 1))} disabled={usersPage <= 1}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => setUsersPage(p => Math.min(usersPages, p + 1))} disabled={usersPage >= usersPages}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ERROR LOGS TAB ── */}
      {tab === 'errors' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search message, path, or IP…"
                value={errorLogsSearch}
                onChange={e => { setErrorLogsSearch(e.target.value); setErrorLogsPage(1); }}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={errorLogsSource}
                onChange={e => { setErrorLogsSource(e.target.value); setErrorLogsPage(1); }}
                className="pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 appearance-none cursor-pointer"
              >
                <option value="">All Sources</option>
                <option value="backend">Backend</option>
                <option value="frontend">Frontend</option>
              </select>
            </div>
            <div className="relative">
              <AlertTriangle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={errorLogsLevel}
                onChange={e => { setErrorLogsLevel(e.target.value); setErrorLogsPage(1); }}
                className="pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 appearance-none cursor-pointer"
              >
                <option value="">All Levels</option>
                <option value="panic">🔴 Panic / 5xx</option>
                <option value="error">🟠 Error / 4xx</option>
                <option value="warning">🟡 Warning</option>
              </select>
            </div>
            <button
              onClick={fetchErrorLogs}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} className={errorLogsLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Error list */}
          {errorLogsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 animate-pulse">
                  <div className="flex gap-3 mb-2">
                    <div className="h-5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
                    <div className="h-5 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
                    <div className="h-5 flex-1 bg-slate-100 dark:bg-slate-800 rounded" />
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : errorLogs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <CheckCircle size={36} className="mx-auto mb-3 opacity-30 text-emerald-500" />
              <p className="font-black text-sm text-emerald-600 dark:text-emerald-400">No errors detected</p>
              <p className="text-xs mt-1">System is running clean 🎉</p>
            </div>
          ) : (
            <div className="space-y-2">
              {errorLogs.map(err => (
                <div
                  key={err.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden transition-all ${
                    err.level === 'panic'
                      ? 'border-rose-200 dark:border-rose-800/60'
                      : err.level === 'warning'
                      ? 'border-amber-200 dark:border-amber-800/60'
                      : 'border-orange-200 dark:border-orange-800/60'
                  }`}
                >
                  {/* Header row */}
                  <button
                    className="w-full text-left px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    onClick={() => setExpandedErrorId(expandedErrorId === err.id ? null : err.id)}
                  >
                    {/* Level badge */}
                    <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full mt-0.5 ${LEVEL_STYLES[err.level] || LEVEL_STYLES.error}`}>
                      {err.level === 'panic' ? '🔴 PANIC' : err.level === 'warning' ? '🟡 WARN' : '🟠 ERROR'}
                    </span>

                    {/* Source badge */}
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${SOURCE_STYLES[err.source] || SOURCE_STYLES.backend}`}>
                      {err.source}
                    </span>

                    {/* Status + method + path */}
                    {err.status_code && (
                      <span className="shrink-0 font-mono text-[11px] font-black text-slate-500 dark:text-slate-400 mt-0.5">
                        {err.method} {err.status_code}
                      </span>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{err.message}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {err.path && (
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">{err.path}</span>
                        )}
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0">
                          <Clock size={10} />{fmtTime(err.created_at)}
                        </span>
                        {err.ip_address && (
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0 flex items-center gap-1">
                            <Globe size={10} />{err.ip_address}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight
                      size={14}
                      className={`shrink-0 text-slate-400 transition-transform mt-0.5 ${expandedErrorId === err.id ? 'rotate-90' : ''}`}
                    />
                  </button>

                  {/* Expanded stack trace */}
                  {expandedErrorId === err.id && err.stack && (
                    <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-3 bg-slate-950">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Stack Trace</p>
                      <pre className="text-[11px] text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap break-words max-h-48">
                        {err.stack}
                      </pre>
                      {err.user_agent && (
                        <p className="text-[10px] text-slate-500 mt-2">UA: {err.user_agent}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {errorLogsPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">{errorLogsTotal.toLocaleString()} errors · Page {errorLogsPage} of {errorLogsPages}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setErrorLogsPage(p => Math.max(1, p - 1))} disabled={errorLogsPage <= 1}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => setErrorLogsPage(p => Math.min(errorLogsPages, p + 1))} disabled={errorLogsPage >= errorLogsPages}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DevConsole;


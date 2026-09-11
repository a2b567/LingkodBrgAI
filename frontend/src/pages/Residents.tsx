import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Plus, Search, Edit2, Trash2, FileSpreadsheet, QrCode,
  XCircle, UserX, UserCheck, Loader2, Upload, CheckCircle2, Sparkles, Save
} from 'lucide-react';
import { api } from '../services/api';
import type { Resident } from '../types';

export const Residents: React.FC = () => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [voterStatus, setVoterStatus] = useState('');
  const [residencyStatus, setResidencyStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Editor Modal states
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');

  const [form, setForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    birthdate: '',
    gender: 'Male',
    civil_status: 'Single',
    occupation: '',
    contact_number: '',
    email: '',
    address: '',
    citizenship: 'Filipino',
    residency_status: 'Permanent',
    voter_status: 'Not Registered',
    is_pregnant: false,
    is_senior: false,
    is_pwd: false,
  });

  // QR Modal States
  const [qrModal, setQrModal] = useState<Resident | null>(null);

  const fetchResidents = async () => {
    setIsLoading(true);
    try {
      const data = await api.residents.list({
        page,
        limit: 10,
        search,
        voter_status: voterStatus,
        residency_status: residencyStatus,
      });
      setResidents(data.data);
      setTotal(data.total);
    } catch (err) {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, [page, voterStatus, residencyStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchResidents();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportCSV = () => {
    if (residents.length === 0) {
      alert('No resident records available to export.');
      return;
    }

    const headers = ['ID', 'First Name', 'Middle Name', 'Last Name', 'Suffix', 'Gender', 'Birthdate', 'Civil Status', 'Occupation', 'Contact Number', 'Email', 'Address', 'Citizenship', 'Residency Status', 'Voter Status'];

    const csvRows = [
      headers.join(','),
      ...residents.map(r => [
        `"${r.id || ''}"`,
        `"${(r.first_name || '').replace(/"/g, '""')}"`,
        `"${(r.middle_name || '').replace(/"/g, '""')}"`,
        `"${(r.last_name || '').replace(/"/g, '""')}"`,
        `"${(r.suffix || '').replace(/"/g, '""')}"`,
        `"${r.gender || ''}"`,
        `"${r.birthdate ? new Date(r.birthdate).toISOString().split('T')[0] : ''}"`,
        `"${r.civil_status || ''}"`,
        `"${(r.occupation || '').replace(/"/g, '""')}"`,
        `"${(r.contact_number || '').replace(/"/g, '""')}"`,
        `"${(r.email || '').replace(/"/g, '""')}"`,
        `"${(r.address || '').replace(/"/g, '""')}"`,
        `"${r.citizenship || 'Filipino'}"`,
        `"${r.residency_status || 'Permanent'}"`,
        `"${r.voter_status || 'Not Registered'}"`
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `resident_registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
      if (lines.length <= 1) {
        alert('The CSV file is empty or missing data rows.');
        return;
      }

      const parseLine = (line: string) => {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());
        return values.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
      };

      const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const rows = lines.slice(1);

      let count = 0;
      for (const rowStr of rows) {
        const vals = parseLine(rowStr);
        if (vals.length < 2) continue;

        const getValue = (keys: string[]) => {
          for (const k of keys) {
            const idx = headers.findIndex(h => h.includes(k));
            if (idx !== -1 && vals[idx]) return vals[idx];
          }
          return '';
        };

        const firstName = getValue(['first', 'fname', 'given']) || vals[0] || 'Resident';
        const lastName = getValue(['last', 'lname', 'surname']) || vals[2] || vals[1] || 'User';
        const middleName = getValue(['middle', 'mname']) || '';
        const gender = getValue(['gender', 'sex']) || 'Male';
        const address = getValue(['address', 'zone', 'street']) || 'Barangay Lawrence';
        const civilStatus = getValue(['civil', 'status', 'marital']) || 'Single';
        const contactNumber = getValue(['contact', 'phone', 'mobile']) || '';
        const email = getValue(['email', 'mail']) || '';
        const voterStatus = getValue(['voter']) || 'Not Registered';
        const birthdate = getValue(['birth', 'bday', 'date']) || '2000-01-01';

        const payload = {
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          gender: gender.toLowerCase().includes('f') ? 'Female' : 'Male',
          birthdate: new Date(birthdate).toString() !== 'Invalid Date' ? new Date(birthdate).toISOString() : new Date('2000-01-01').toISOString(),
          civil_status: civilStatus,
          occupation: 'Resident',
          contact_number: contactNumber,
          email: email,
          address: address,
          citizenship: 'Filipino',
          residency_status: 'Permanent',
          voter_status: voterStatus,
        };

        try {
          await api.residents.create(payload);
          count++;
        } catch (err) {
          console.error('Failed to import CSV row:', payload, err);
        }
      }

      alert(`Successfully imported ${count} resident records from CSV!`);
      fetchResidents();
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  const handleOpenEdit = (res: Resident) => {
    setEditingId(res.id);
    setForm({
      first_name: res.first_name,
      middle_name: res.middle_name || '',
      last_name: res.last_name,
      suffix: res.suffix || '',
      birthdate: res.birthdate.split('T')[0],
      gender: res.gender,
      civil_status: res.civil_status,
      occupation: res.occupation || '',
      contact_number: res.contact_number || '',
      email: res.email || '',
      address: res.address,
      citizenship: res.citizenship,
      residency_status: res.residency_status,
      voter_status: res.voter_status,
      is_pregnant: !!res.is_pregnant,
      is_senior: !!res.is_senior,
      is_pwd: !!res.is_pwd,
    });
    setPhotoUrl(res.profile_photo || '');
    setShowModal(true);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      first_name: '',
      middle_name: '',
      last_name: '',
      suffix: '',
      birthdate: '',
      gender: 'Male',
      civil_status: 'Single',
      occupation: '',
      contact_number: '',
      email: '',
      address: '',
      citizenship: 'Filipino',
      residency_status: 'Permanent',
      voter_status: 'Not Registered',
      is_pregnant: false,
      is_senior: false,
      is_pwd: false,
    });
    setPhotoUrl('');
    setShowModal(true);
  };

  const handleUploadPhoto = async (file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const res = await api.residents.uploadPhoto(formData);
      setPhotoUrl(res.photo_url);
    } catch (err) {
      // Photo upload failed
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        ...form,
        birthdate: new Date(form.birthdate).toISOString(),
        profile_photo: photoUrl,
      };

      if (editingId) {
        await api.residents.update(editingId, payload);
      } else {
        await api.residents.create(payload);
      }

      setShowModal(false);
      fetchResidents();
    } catch (err) {
      // Handle save error
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this resident record?')) {
      try {
        await api.residents.delete(id);
        fetchResidents();
      } catch (err) {
        // Delete error
      }
    }
  };

  return (
    <div className="space-y-6 relative z-10">
      
      {/* Header titles */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white tracking-tight uppercase">
            Resident Registry
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
            Manage, update, and search official citizen profiles
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportCSV}
            accept=".csv"
            className="hidden"
          />

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-black text-slate-700 dark:text-slate-200 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            title="Import Residents from CSV file"
          >
            <Upload size={16} className="text-blue-600 dark:text-blue-400" />
            <span>Import CSV</span>
          </button>

          <button 
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-black text-slate-700 dark:text-slate-200 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            title="Export Resident Registry to CSV file"
          >
            <FileSpreadsheet size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button 
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gov-blue-600 to-indigo-700 hover:from-gov-blue-700 hover:to-indigo-800 text-white text-xs font-black rounded-2xl shadow-lg shadow-gov-blue-600/25 border border-blue-400/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Add Resident</span>
          </button>
        </div>
      </div>

      {/* Query Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-3 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            placeholder="Search name, zone, or QR..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-gov-blue-500"
          />
        </form>

        <div className="flex gap-3 w-full md:w-auto">
          <select 
            value={voterStatus} 
            onChange={(e) => { setVoterStatus(e.target.value); setPage(1); }}
            title="Voter Status Filter"
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 text-xs focus:outline-none"
          >
            <option value="">All Voter Status</option>
            <option value="Registered">Registered</option>
            <option value="Not Registered">Not Registered</option>
          </select>

          <select 
            value={residencyStatus} 
            onChange={(e) => { setResidencyStatus(e.target.value); setPage(1); }}
            title="Residency Status Filter"
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 text-xs focus:outline-none"
          >
            <option value="">All Residency</option>
            <option value="Permanent">Permanent</option>
            <option value="Temporary">Temporary</option>
          </select>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
            <Loader2 size={32} className="animate-spin text-gov-blue-500" />
            <p className="text-xs">Loading residents data...</p>
          </div>
        ) : residents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <Users size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-xs font-semibold">No residents found matching criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                  <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Resident Name</th>
                  <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Age / Gender</th>
                  <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Address</th>
                  <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase text-center">Voter Status</th>
                  <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase text-center">Residency</th>
                  <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase text-center">QR ID</th>
                  <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
                {residents.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {r.profile_photo ? (
                            <img src={`http://localhost:8080${r.profile_photo}`} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">{r.first_name[0]}{r.last_name[0]}</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold">{r.last_name}, {r.first_name} {r.middle_name || ''}</p>
                            {r.is_pregnant && <span title="Pregnant" className="text-[10px]">🤰</span>}
                            {r.is_senior && <span title="Senior Citizen" className="text-[10px]">👴</span>}
                            {r.is_pwd && <span title="Person with Disability" className="text-[9px] bg-blue-600 text-white px-1 rounded font-bold">♿ PWD</span>}
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">{r.email || 'No email'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold">{r.age} yrs old</p>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">{r.gender}</span>
                    </td>
                    <td className="p-4 max-w-xs truncate font-medium text-slate-600 dark:text-slate-300">
                      {r.address}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        r.voter_status === 'Registered' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-slate-50 dark:bg-slate-800/80 text-slate-500'
                      }`}>
                        {r.voter_status === 'Registered' ? <UserCheck size={10} /> : <UserX size={10} />}
                        {r.voter_status}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold">
                      {r.residency_status}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => setQrModal(r)}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/60 rounded-lg text-slate-500 hover:text-black dark:hover:text-slate-100 transition-colors inline-flex items-center gap-1 text-[10px] font-bold"
                      >
                        <QrCode size={14} className="text-gov-blue-500" />
                        {r.qr_id}
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenEdit(r)}
                        title="Edit Resident"
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-gov-blue-600 transition-colors inline-flex"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(r.id)}
                        title="Delete Resident"
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-slate-500 hover:text-rose-500 dark:text-slate-400 transition-colors inline-flex"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Simple Pagination */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-500 dark:text-slate-400">Total: {total} records</span>
          <div className="flex gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl disabled:opacity-50 font-bold"
            >
              Previous
            </button>
            <button 
              disabled={page * 10 >= total}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl disabled:opacity-50 font-bold"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl sm:max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden glass-panel relative">
            <div className="h-1 bg-gradient-to-r from-gov-blue-600 via-gov-gold-400 to-indigo-600" />
            
            {/* Title */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gov-blue-500/10 text-gov-blue-600 dark:text-gov-blue-400 rounded-xl border border-gov-blue-500/20">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gov-blue-900 dark:text-gov-blue-300 uppercase tracking-wide">
                    {editingId ? 'Edit Resident Profile' : 'Register New Resident'}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                    Barangay Lawrence Resident Database Entry
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                title="Close Modal" 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-xl transition-colors cursor-pointer"
              >
                <XCircle size={22} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-thin">
              
              {/* SECTION F: Profile Photo */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-black text-gov-blue-600 dark:text-gov-blue-400 uppercase tracking-widest block">
                  F. Profile Photo (Litrato ng Mamamayan)
                </span>
                <div className="flex items-center gap-4 pt-1">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-700 shadow-inner">
                    {photoUrl ? (
                      <img src={`http://localhost:8080${photoUrl}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Users size={24} className="text-slate-400 dark:text-slate-500" />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Mag-upload ng malinaw na 2x2 o 1x1 ID photo (PNG, JPG, WEBP).
                    </p>
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all text-slate-700 dark:text-slate-200 shadow-sm">
                      <Upload size={14} className="text-gov-blue-500" />
                      Upload Profile Photo
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleUploadPhoto(e.target.files[0]);
                          }
                        }} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* SECTION A: Personal na Impormasyon */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-gov-blue-600 dark:text-gov-blue-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800 pb-1">
                  A. Personal na Impormasyon (Personal Information)
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">First Name (Unang Pangalan) *</label>
                    <input type="text" required title="First Name" placeholder="Juan" value={form.first_name} onChange={(e) => setForm({...form, first_name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-gov-blue-500 transition-colors font-medium text-slate-900 dark:text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Middle Name (Gitnang Pangalan)</label>
                    <input type="text" title="Middle Name" placeholder="Mercado" value={form.middle_name} onChange={(e) => setForm({...form, middle_name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-gov-blue-500 transition-colors font-medium text-slate-900 dark:text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Last Name (Apelyido) *</label>
                    <input type="text" required title="Last Name" placeholder="Dela Cruz" value={form.last_name} onChange={(e) => setForm({...form, last_name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-gov-blue-500 transition-colors font-medium text-slate-900 dark:text-white" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Petsa ng Kapanganakan (Birthdate) *</label>
                    <input 
                      type="date" 
                      required 
                      title="Birthdate" 
                      value={form.birthdate} 
                      onChange={(e) => {
                        const bdate = e.target.value;
                        let isSeniorAuto = form.is_senior;
                        let isPregnantAuto = form.is_pregnant;
                        if (bdate) {
                          const birthYear = new Date(bdate).getFullYear();
                          const currentYear = new Date().getFullYear();
                          if (currentYear - birthYear >= 60) {
                            isSeniorAuto = true;
                            isPregnantAuto = false;
                          }
                        }
                        setForm({
                          ...form,
                          birthdate: bdate,
                          is_senior: isSeniorAuto,
                          is_pregnant: isPregnantAuto
                        });
                      }} 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-gov-blue-500 transition-colors font-medium text-slate-900 dark:text-white" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Kasarian (Gender)</label>
                    <select 
                      value={form.gender} 
                      title="Gender" 
                      onChange={(e) => {
                        const g = e.target.value;
                        setForm({
                          ...form,
                          gender: g,
                          is_pregnant: g === 'Male' ? false : form.is_pregnant
                        });
                      }} 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-gov-blue-500 transition-colors font-medium text-slate-900 dark:text-white"
                    >
                      <option value="Male">Lalaki (Male)</option>
                      <option value="Female">Babae (Female)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Katayuang Sibil (Civil Status)</label>
                    <select value={form.civil_status} title="Civil Status" onChange={(e) => setForm({...form, civil_status: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-gov-blue-500 transition-colors font-medium text-slate-900 dark:text-white">
                      <option value="Single">Walang Asawa (Single)</option>
                      <option value="Married">Kasal (Married)</option>
                      <option value="Widowed">Biyudo / Biyuda (Widowed)</option>
                      <option value="Single Parent">Solo Parent (Single Parent)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION B: Contact at Trabaho */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-gov-blue-600 dark:text-gov-blue-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800 pb-1">
                  B. Contact at Trabaho (Contact & Occupation)
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Numero ng Telepono (Contact Number)</label>
                    <input type="text" title="Contact Number" placeholder="09XX-XXX-XXXX" value={form.contact_number} onChange={(e) => setForm({...form, contact_number: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-gov-blue-500 transition-colors font-medium text-slate-900 dark:text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Email Address</label>
                    <input type="email" title="Email" placeholder="resident@email.com" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-gov-blue-500 transition-colors font-medium text-slate-900 dark:text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Hanapbuhay (Occupation)</label>
                    <input type="text" title="Occupation" placeholder="E.g., Private Employee, Driver, Merchant" value={form.occupation} onChange={(e) => setForm({...form, occupation: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-gov-blue-500 transition-colors font-medium text-slate-900 dark:text-white" />
                  </div>
                </div>
              </div>

              {/* SECTION C: Tirahan */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-gov-blue-600 dark:text-gov-blue-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800 pb-1">
                  C. Tirahan (Complete Address)
                </span>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Kumpletong Address (Street, Purok, Zone, Barangay) *</label>
                  <input type="text" required title="Address" placeholder="Street, Purok, Zone Location..." value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-gov-blue-500 transition-colors font-medium text-slate-900 dark:text-white" />
                </div>
              </div>

              {/* SECTION D: Katayuan sa Pagboto at Paninirahan */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-gov-blue-600 dark:text-gov-blue-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800 pb-1">
                  D. Katayuan sa Pagboto at Paninirahan (Voter & Residency Status)
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Voter Status (Katayuan sa Pagboto)</label>
                    <select value={form.voter_status} title="Voter Status" onChange={(e) => setForm({...form, voter_status: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-gov-blue-500 transition-colors font-medium text-slate-900 dark:text-white">
                      <option value="Not Registered">Not Registered (Hindi Rehistrado)</option>
                      <option value="Registered">Registered (Rehistradong Botante)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block">Residency Status (Uri ng Paninirahan)</label>
                    <select value={form.residency_status} title="Residency Status" onChange={(e) => setForm({...form, residency_status: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-gov-blue-500 transition-colors font-medium text-slate-900 dark:text-white">
                      <option value="Permanent">Permanent (Permanente)</option>
                      <option value="Temporary">Temporary (Pansamantala / Nangungupahan)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION E: Kalusugan at Priority Category */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/70 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-gov-gold-600 dark:text-gov-gold-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles size={13} className="text-gov-gold-500" />
                    E. KALUSUGAN AT PRIORITY CATEGORY
                  </label>
                  <span className="text-[9px] text-slate-400 font-semibold">Kategorya ng mamamayan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Pregnant Option */}
                  <label 
                    className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between select-none ${
                      form.is_pregnant 
                        ? 'bg-pink-500/10 dark:bg-pink-500/15 border-pink-500/60 text-pink-700 dark:text-pink-200 shadow-sm ring-1 ring-pink-500/30' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">🤰</span>
                      <div>
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                          Pregnant
                        </div>
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                          Nagdadalang-tao
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.is_pregnant}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setForm({ 
                          ...form, 
                          is_pregnant: isChecked,
                          gender: isChecked ? 'Female' : form.gender,
                          is_senior: isChecked ? false : form.is_senior
                        });
                      }}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                      form.is_pregnant ? 'bg-pink-500 border-pink-400 text-white' : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-950'
                    }`}>
                      {form.is_pregnant && <CheckCircle2 size={12} />}
                    </div>
                  </label>

                  {/* Senior Citizen Option */}
                  <label 
                    className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between select-none ${
                      form.is_senior 
                        ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/60 text-amber-700 dark:text-amber-200 shadow-sm ring-1 ring-amber-500/30' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">👴</span>
                      <div>
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white">Senior Citizen</div>
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">60+ Years Old</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.is_senior}
                      onChange={(e) => {
                        const isSeniorChecked = e.target.checked;
                        setForm({ 
                          ...form, 
                          is_senior: isSeniorChecked,
                          is_pregnant: isSeniorChecked ? false : form.is_pregnant
                        });
                      }}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                      form.is_senior ? 'bg-amber-500 border-amber-400 text-white' : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-950'
                    }`}>
                      {form.is_senior && <CheckCircle2 size={12} />}
                    </div>
                  </label>

                  {/* PWD Option */}
                  <label 
                    className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between select-none ${
                      form.is_pwd 
                        ? 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500/60 text-blue-700 dark:text-blue-200 shadow-sm ring-1 ring-blue-500/30' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[9px] font-black">♿</span>
                      <div>
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white">PWD</div>
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">With Disability</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.is_pwd}
                      onChange={(e) => setForm({ ...form, is_pwd: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                      form.is_pwd ? 'bg-blue-500 border-blue-400 text-white' : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-950'
                    }`}>
                      {form.is_pwd && <CheckCircle2 size={12} />}
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-gradient-to-r from-gov-blue-600 to-indigo-600 hover:from-gov-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-gov-blue-600/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Resident
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* QR Verification Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 text-center glass-panel">
            <h3 className="font-extrabold text-sm text-black dark:text-white uppercase mb-2">QR ID Identity Card</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-6">Barangay Lawrence Secure Resident ID</p>

            <div className="w-48 h-48 bg-white p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner mx-auto mb-4 flex items-center justify-center">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrModal.qr_id || `QR-RES-${qrModal.id}`)}`} 
                alt={`QR Code for ${qrModal.first_name} ${qrModal.last_name}`} 
                onError={(e) => {
                  e.currentTarget.src = `http://localhost:8080/uploads/qr/${qrModal.id}.png`;
                }}
                className="w-full h-full object-contain rounded-lg" 
              />
            </div>

            <h4 className="font-black text-sm text-gov-blue-700 dark:text-gov-blue-300">{qrModal.first_name} {qrModal.last_name}</h4>
            <span className="text-[9px] bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded font-bold text-slate-500 mt-1 inline-block">
              {qrModal.qr_id}
            </span>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/85">
              <button 
                onClick={() => setQrModal(null)}
                className="w-full py-2 bg-gov-blue-600 hover:bg-gov-blue-700 text-white text-xs font-bold rounded-xl"
              >
                Close ID Card
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default Residents;

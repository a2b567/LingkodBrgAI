import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Heart, Search, FileText, Pill, Activity, User, Stethoscope, Droplet,
  Clock, CheckCircle2, SearchX, Package, AlertTriangle, PackagePlus, Trash2,
  Eye, Volume2, Filter, UserPlus
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
  dispensedItems?: { medicineName: string; quantity: number; date: string }[];
}

interface QueueItem {
  id: string;
  residentName: string;
  service: string;
  queueNumber: number;
  timestamp: number;
  status: 'waiting' | 'served';
  isPriority?: boolean;
}

interface MedicineStock {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  minStock: number;
}

export const HealthRecords: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [bloodFilter, setBloodFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [view, setView] = useState<'records' | 'queue' | 'stock'>('records');
  const [selectedPatientChart, setSelectedPatientChart] = useState<HealthRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<HealthRecord>>({
    resident_name: '', blood_type: 'O+', allergies: '', conditions: '', last_checkup: '', status: 'Healthy'
  });

  useEffect(() => {
    api.health.listRecords().then(data => {
      setRecords(Array.isArray(data) ? data : []);
    }).catch(() => {
      setRecords([]);
    });

    api.health.listStock().then(data => {
      setMedicineStock(Array.isArray(data) ? data : []);
    }).catch(() => {
      setMedicineStock([]);
    });
  }, []);

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.resident_name.toLowerCase().includes(search.toLowerCase()) ||
                          r.conditions.toLowerCase().includes(search.toLowerCase()) ||
                          r.allergies.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchesBlood = bloodFilter === 'All' || r.blood_type === bloodFilter;
    return matchesSearch && matchesStatus && matchesBlood;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      resident_name: form.resident_name || 'Unknown',
      age: form.age || Math.floor(Math.random() * 50) + 20,
      blood_type: form.blood_type || 'O+',
      allergies: form.allergies || 'None',
      conditions: form.conditions || 'None',
      last_checkup: form.last_checkup || new Date().toISOString().split('T')[0],
      status: form.status || 'Healthy',
    };
    try {
      const res = await api.health.createRecord(payload);
      setRecords(prev => [res, ...prev]);
    } catch {
      const newRecord: HealthRecord = { id: `HR-${Date.now().toString().slice(-4)}`, ...payload } as HealthRecord;
      setRecords(prev => [newRecord, ...prev]);
    }
    setIsModalOpen(false);
    setForm({ resident_name: '', blood_type: 'O+', allergies: '', conditions: '', last_checkup: '', status: 'Healthy' });
  };

  // --- Medicine Dispensing ---
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [dispenseForm, setDispenseForm] = useState({ medicineName: '', quantity: 1 });

  const handleDispense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordId || !dispenseForm.medicineName) return;

    const stockItem = medicineStock.find(m => m.name === dispenseForm.medicineName);
    if (stockItem && stockItem.stock < dispenseForm.quantity) {
      alert(`Insufficient stock! Only ${stockItem.stock} ${stockItem.unit} of ${stockItem.name} available.`);
      return;
    }

    api.health.dispenseMedicine(selectedRecordId, dispenseForm).catch(console.error);

    setMedicineStock(prev => prev.map(m =>
      m.name === dispenseForm.medicineName ? { ...m, stock: Math.max(0, m.stock - dispenseForm.quantity) } : m
    ));

    setRecords(prev => prev.map(record => {
      if (record.id === selectedRecordId) {
        const updated = {
          ...record,
          dispensedItems: [...(record.dispensedItems || []), {
            medicineName: dispenseForm.medicineName,
            quantity: dispenseForm.quantity,
            date: new Date().toISOString().split('T')[0]
          }]
        };
        if (selectedPatientChart?.id === record.id) {
          setSelectedPatientChart(updated);
        }
        return updated;
      }
      return record;
    }));

    setIsDispenseModalOpen(false);
    setDispenseForm({ medicineName: '', quantity: 1 });
    setSelectedRecordId(null);
  };

  const totalMedicinesDispensed = records.reduce((total, record) =>
    total + (record.dispensedItems?.reduce((sum, item) => sum + item.quantity, 0) || 0), 0);

  const [medicineStock, setMedicineStock] = useState<MedicineStock[]>([]);
  const [stockForm, setStockForm] = useState({ name: '', category: 'Analgesic', quantity: 50, unit: 'tablets', minStock: 10 });
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);

  const handleAddNewMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockForm.name.trim()) return;
    const payload = {
      name: stockForm.name,
      category: stockForm.category,
      quantity: stockForm.quantity,
      unit: stockForm.unit,
      minStock: stockForm.minStock,
    };
    try {
      const created = await api.health.addStock(payload);
      setMedicineStock(prev => [...prev, created]);
    } catch {
      const newMed: MedicineStock = { id: `MS-${Date.now().toString().slice(-4)}`, stock: stockForm.quantity, ...payload };
      setMedicineStock(prev => [...prev, newMed]);
    }
    setStockForm({ name: '', category: 'Analgesic', quantity: 50, unit: 'tablets', minStock: 10 });
    setIsAddStockModalOpen(false);
  };

  const handleRestock = (id: string, qty: number) => {
    api.health.restock(id, qty).catch(console.error);
    setMedicineStock(medicineStock.map(m =>
      m.id === id ? { ...m, stock: m.stock + qty } : m
    ));
  };

  const filteredStock = medicineStock.filter(m => {
    const matchesCategory = categoryFilter === 'All' || m.category === categoryFilter;
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const lowStockCount = medicineStock.filter(m => m.stock <= m.minStock).length;

  const handleDeleteStock = (id: string) => {
    if (confirm('Are you sure you want to remove this item from health inventory?')) {
      api.health.deleteStock(id).catch(console.error);
      setMedicineStock(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm('Are you sure you want to delete this patient medical record?')) {
      api.health.deleteRecord(id).catch(console.error);
      setRecords(prev => prev.filter(r => r.id !== id));
      if (selectedPatientChart?.id === id) {
        setSelectedPatientChart(null);
      }
    }
  };

  const handleDeleteQueue = (id: string) => {
    setQueueList(prev => prev.filter(q => q.id !== id));
  };

  // --- FCFS Clinic Queue (synced to localStorage for resident live view) ---
  const CLINIC_QUEUE_KEY = 'lingkod_clinic_queue';
  const [queueList, setQueueList] = useState<QueueItem[]>(() => {
    try {
      const saved = localStorage.getItem('lingkod_clinic_queue');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [queueForm, setQueueForm] = useState({ residentName: '', service: 'General Checkup', isPriority: false });

  // Persist to localStorage whenever queueList changes
  useEffect(() => {
    try { localStorage.setItem(CLINIC_QUEUE_KEY, JSON.stringify(queueList)); } catch {}
  }, [queueList]);

  const handleAddToQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queueForm.residentName) return;
    const newItem: QueueItem = {
      id: `Q-${Date.now().toString().slice(-4)}`,
      residentName: queueForm.residentName,
      service: queueForm.service,
      queueNumber: queueList.length + 1,
      timestamp: Date.now(),
      status: 'waiting',
      isPriority: queueForm.isPriority
    };
    setQueueList(prev => [...prev, newItem]);
    setQueueForm({ residentName: '', service: 'General Checkup', isPriority: false });
  };

  const announceCallQueue = (item: QueueItem) => {
    if ('speechSynthesis' in window) {
      const text = `Calling queue number ${item.queueNumber}, ${item.residentName}, please proceed to Health Center Station 1 for ${item.service}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
    markAsServed(item.id);
  };

  const markAsServed = (id: string) =>
    setQueueList(prev => prev.map(item => item.id === id ? { ...item, status: 'served' } : item));

  const activeQueue = queueList.filter(q => q.status === 'waiting').sort((a, b) => {
    if (a.isPriority && !b.isPriority) return -1;
    if (!a.isPriority && b.isPriority) return 1;
    return a.timestamp - b.timestamp;
  });
  const servedQueue = queueList.filter(q => q.status === 'served').sort((a, b) => b.timestamp - a.timestamp);

  const inputCls = 'w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold focus:outline-none focus:border-rose-500 text-slate-900 dark:text-white transition-all';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800 flex items-center justify-center shrink-0 shadow-subtle">
            <Activity size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Health & Medical Center
              </h1>
              <span className="hidden sm:inline-flex text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                RA 10173 Protected
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Barangay San Isidro Patient Records, Active Clinic Queue & Pharmacy Stock
            </p>
          </div>
        </div>

        {/* View Switcher Tabs & Actions */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap shrink-0">
          {/* Segmented View Switcher */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl gap-1">
            <button
              onClick={() => setView('records')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                view === 'records'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-subtle'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileText size={14} />
              <span>Medical Records</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                view === 'records' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
              }`}>
                {records.length}
              </span>
            </button>

            <button
              onClick={() => setView('queue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                view === 'queue'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-subtle'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Clock size={14} />
              <span>Clinic Queue</span>
              {activeQueue.length > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {activeQueue.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setView('stock')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                view === 'stock'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-subtle'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Package size={14} />
              <span>Pharmacy Stock</span>
              {lowStockCount > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                  {lowStockCount}
                </span>
              )}
            </button>
          </div>

          {/* Action Buttons */}
          {view === 'records' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-subtle cursor-pointer"
            >
              <UserPlus size={15} />
              <span>New Patient Record</span>
            </button>
          )}

          {view === 'stock' && (
            <button
              onClick={() => setIsAddStockModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-subtle cursor-pointer"
            >
              <PackagePlus size={15} />
              <span>Add Medicine</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 p-6 rounded-[2rem] border border-slate-200/80 dark:border-slate-800/80 shadow-xl flex items-center justify-between group hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">Total Patients</p>
            <p className="text-4xl font-black text-slate-900 dark:text-white">{records.length}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <User size={26} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/20 p-6 rounded-[2rem] border border-emerald-500/20 shadow-xl flex items-center justify-between group hover:border-emerald-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-500 tracking-widest">Healthy Status</p>
            <p className="text-4xl font-black text-emerald-700 dark:text-emerald-400">{records.filter(r => r.status === 'Healthy').length}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-emerald-100 dark:border-emerald-900">
            <Heart size={26} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-amber-50/30 dark:from-slate-900 dark:to-amber-950/20 p-6 rounded-[2rem] border border-amber-500/20 shadow-xl flex items-center justify-between group hover:border-amber-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-500 tracking-widest">Under Observation</p>
            <p className="text-4xl font-black text-amber-700 dark:text-amber-400">{records.filter(r => r.status === 'Under Observation').length}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-amber-100 dark:border-amber-900">
            <Pill size={26} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20 p-6 rounded-[2rem] border border-blue-500/20 shadow-xl flex items-center justify-between group hover:border-blue-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-500 tracking-widest">Total Meds Dispensed</p>
            <p className="text-4xl font-black text-blue-700 dark:text-blue-400">{totalMedicinesDispensed}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-blue-100 dark:border-blue-900">
            <Activity size={26} />
          </div>
        </div>
      </div>

      {/* ============ VIEW: RECORDS ============ */}
      {view === 'records' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search patient, conditions, or allergies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/50 dark:text-white transition-all"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Healthy">Healthy</option>
                  <option value="Under Observation">Under Observation</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <select
                value={bloodFilter}
                onChange={(e) => setBloodFilter(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="All">All Blood Types</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>


            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Patient Resident</th>
                  <th className="px-6 py-4">Blood Type</th>
                  <th className="px-6 py-4">Medical Conditions</th>
                  <th className="px-6 py-4">Medicines Dispensed</th>
                  <th className="px-6 py-4">Health Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-all group">
                    <td className="px-6 py-5 font-mono text-xs font-black text-slate-400 dark:text-slate-500 group-hover:text-rose-500 transition-colors">
                      {record.id}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white font-extrabold flex items-center justify-center text-xs shadow-sm">
                          {record.resident_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-sm text-slate-900 dark:text-white">{record.resident_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            Age: {record.age} • Last Checkup: {record.last_checkup}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 font-black text-xs border border-rose-200/60 dark:border-rose-900/60 shadow-sm">
                        <Droplet size={13} className="fill-rose-500" /> {record.blood_type}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-extrabold text-xs text-slate-800 dark:text-slate-200">{record.conditions}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        Allergies: <span className={record.allergies !== 'None' ? 'text-rose-500 font-black' : 'text-slate-400'}>{record.allergies}</span>
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      {record.dispensedItems && record.dispensedItems.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {record.dispensedItems.map((item, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                              <Pill size={11} /> {item.medicineName} x{item.quantity}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold italic">No prescriptions</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                        record.status === 'Healthy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/50' :
                        record.status === 'Under Observation' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800/50' :
                        'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/50 animate-pulse'
                      }`}>
                        {record.status === 'Healthy' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>}
                        {record.status === 'Under Observation' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2"></span>}
                        {record.status === 'Critical' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2 animate-ping"></span>}
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setSelectedPatientChart(record)}
                          title="View Patient Chart"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          <Eye size={13} />
                          Chart
                        </button>
                        <button
                          onClick={() => { setSelectedRecordId(record.id); setIsDispenseModalOpen(true); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 dark:text-blue-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border border-blue-200 dark:border-blue-800 cursor-pointer"
                        >
                          <Pill size={13} />
                          Dispense
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          title="Delete Record"
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800/60 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-400 dark:text-slate-500">
                      <FileText size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="font-extrabold text-sm text-slate-700 dark:text-slate-300">No medical records match your criteria.</p>
                      <p className="text-xs text-slate-500 mt-1">Try adjusting your search terms or click "+ New Patient Record" above.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============ VIEW: QUEUE ============ */}
      {view === 'queue' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="text-rose-500" />
              Barangay Clinic Live Queue Ticket Entry
            </h3>
            <form onSubmit={handleAddToQueue} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Resident Patient Name</label>
                <input id="queue-name-input" required type="text" value={queueForm.residentName} onChange={e => setQueueForm({...queueForm, residentName: e.target.value})} placeholder="Full name of patient..." className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Service Required</label>
                <select value={queueForm.service} onChange={e => setQueueForm({...queueForm, service: e.target.value})} className={inputCls}>
                  <option>General Checkup</option>
                  <option>Vaccination / Immunization</option>
                  <option>Medicine Pickup</option>
                  <option>Prenatal Consultation</option>
                  <option>Senior/PWD Priority Checkup</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={queueForm.isPriority}
                    onChange={(e) => setQueueForm({ ...queueForm, isPriority: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>Senior / PWD Priority</span>
                </label>

                <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-2xl font-black text-xs shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-95 border border-rose-500/50 uppercase tracking-wider cursor-pointer">
                  Issue Queue Ticket
                </button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity size={16} className="text-rose-500" /> Waiting Patients
                </span>
                <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-full text-xs font-black border border-rose-500/20">
                  {activeQueue.length} Active
                </span>
              </h3>
              <div className="space-y-3">
                {activeQueue.map(item => (
                  <div key={item.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-md ${
                        item.isPriority ? 'bg-amber-500 text-white shadow-amber-500/30' : 'bg-rose-600 text-white shadow-rose-600/30'
                      }`}>
                        #{item.queueNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-slate-900 dark:text-white text-sm">{item.residentName}</p>
                          {item.isPriority && (
                            <span className="text-[9px] font-black bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase">
                              Priority
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{item.service}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => announceCallQueue(item)}
                        title="Announce & Call Patient"
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                      >
                        <Volume2 size={15} />
                        Call Ticket
                      </button>
                      <button
                        onClick={() => handleDeleteQueue(item.id)}
                        title="Remove from Queue"
                        className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {activeQueue.length === 0 && (
                  <div className="text-center py-10 text-slate-400">
                    <SearchX size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-extrabold">Queue is clear</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" /> Served Patients Log
              </h3>
              <div className="space-y-3">
                {servedQueue.slice(0, 6).map(item => (
                  <div key={item.id} className="p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 flex items-center justify-center font-black text-xs">
                        #{item.queueNumber}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{item.residentName}</p>
                        <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest">{item.service}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">Served</span>
                  </div>
                ))}
                {servedQueue.length === 0 && (
                  <div className="text-center py-10 text-slate-400">
                    <p className="text-xs font-extrabold">No served logs yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ VIEW: STOCK ============ */}
      {view === 'stock' && (
        <div className="space-y-5">
          {lowStockCount > 0 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-amber-700 dark:text-amber-400 animate-pulse">
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} className="shrink-0" />
                <div>
                  <p className="font-extrabold text-xs">Low Stock Alert!</p>
                  <p className="text-[11px] font-medium opacity-90">{lowStockCount} item(s) are below minimum threshold safety levels.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddStockModalOpen(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-extrabold shadow cursor-pointer"
              >
                Restock Inventory
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="text-emerald-500" /> Health Center Pharmacy Stock & Vaccine Inventory
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time inventory levels for Barangay medicine distribution</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="All">All Categories</option>
                <option value="Analgesic">Analgesic</option>
                <option value="Antibiotic">Antibiotic</option>
                <option value="Supplement">Supplement</option>
                <option value="Vaccine">Vaccine</option>
                <option value="Antihypertensive">Antihypertensive</option>
                <option value="Antihistamine">Antihistamine</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Medicine / Vaccine</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Current Stock</th>
                    <th className="px-6 py-4">Min. Threshold</th>
                    <th className="px-6 py-4">Stock Status</th>
                    <th className="px-6 py-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  {filteredStock.map(med => {
                    const isLow = med.stock <= med.minStock;
                    const stockRatio = Math.min(100, Math.round((med.stock / (med.minStock * 3)) * 100));
                    return (
                      <tr key={med.id} className={`transition-all ${isLow ? 'bg-amber-50/50 dark:bg-amber-950/20' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/80'}`}>
                        <td className="px-6 py-4">
                          <p className="font-black text-sm text-slate-900 dark:text-white">{med.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{med.id}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-extrabold">{med.category}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className={`text-2xl font-black font-mono ${isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                              {med.stock}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">{med.unit}</span>
                          </div>
                          <div className="w-24 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${isLow ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${stockRatio}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-bold">{med.minStock} {med.unit}</td>
                        <td className="px-6 py-4">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                              <AlertTriangle size={12} /> Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Sufficient
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => handleRestock(med.id, 20)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 rounded-xl text-[10px] font-black uppercase border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                            >
                              <PackagePlus size={13} /> +20
                            </button>
                            <button
                              onClick={() => handleDeleteStock(med.id)}
                              title="Delete Medicine"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800/60 transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL: Patient Medical Chart Details ============ */}
      {selectedPatientChart && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white font-black flex items-center justify-center text-base shadow-md">
                  {selectedPatientChart.resident_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedPatientChart.resident_name}</h3>
                  <p className="text-xs text-slate-400 font-mono">Record ID: {selectedPatientChart.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatientChart(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Age</p>
                <p className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">{selectedPatientChart.age} years old</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Blood Type</p>
                <p className="font-black text-sm text-rose-600 dark:text-rose-400 mt-0.5 flex items-center gap-1">
                  <Droplet size={14} className="fill-rose-500" /> {selectedPatientChart.blood_type}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Medical Conditions</p>
                <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-1">{selectedPatientChart.conditions}</p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Known Allergies</p>
                <p className={`font-extrabold mt-1 ${selectedPatientChart.allergies !== 'None' ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                  {selectedPatientChart.allergies}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Prescription & Dispensed Items History</p>
                {selectedPatientChart.dispensedItems && selectedPatientChart.dispensedItems.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    {selectedPatientChart.dispensedItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Pill size={12} className="text-blue-500" /> {item.medicineName}
                        </span>
                        <span className="font-black text-blue-600 dark:text-blue-400">Qty: {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No dispensed medicines on record.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => { setSelectedRecordId(selectedPatientChart.id); setIsDispenseModalOpen(true); }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-2xl text-xs flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Pill size={15} /> Dispense Medicine
              </button>
              <button
                type="button"
                onClick={() => setSelectedPatientChart(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs cursor-pointer"
              >
                Close Chart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL: New Health Record ============ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Stethoscope className="text-rose-500" />
              New Patient Health Record
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Resident Patient Name</label>
                <input required type="text" value={form.resident_name} onChange={e => setForm({...form, resident_name: e.target.value})} placeholder="e.g. Maria Clara Santos" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Blood Type</label>
                  <select value={form.blood_type} onChange={e => setForm({...form, blood_type: e.target.value})} className={inputCls}>
                    <option>O+</option><option>O-</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Health Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value as 'Healthy' | 'Under Observation' | 'Critical'})} className={inputCls}>
                    <option>Healthy</option><option>Under Observation</option><option>Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Medical Conditions</label>
                <input type="text" value={form.conditions} onChange={e => setForm({...form, conditions: e.target.value})} placeholder="e.g. Mild Hypertension, Diabetes" className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Known Allergies</label>
                <input type="text" value={form.allergies} onChange={e => setForm({...form, allergies: e.target.value})} placeholder="e.g. Penicillin, Latex (or None)" className={inputCls} />
              </div>
              <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-bold text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 font-black text-xs text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 cursor-pointer">Save Patient Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ MODAL: Dispense Medicine ============ */}
      {isDispenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full shadow-2xl p-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Pill className="text-blue-500" />
              Dispense Medicine
            </h3>
            <form onSubmit={handleDispense} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Select Medicine / Vaccine</label>
                <select required value={dispenseForm.medicineName} onChange={e => setDispenseForm({...dispenseForm, medicineName: e.target.value})} className={inputCls}>
                  <option value="">-- Select Item --</option>
                  {medicineStock.map(m => (
                    <option key={m.id} value={m.name}>{m.name} ({m.stock} {m.unit} in stock)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Quantity</label>
                <input required type="number" min="1" value={dispenseForm.quantity} onChange={e => setDispenseForm({...dispenseForm, quantity: parseInt(e.target.value) || 1})} className={inputCls} />
              </div>
              <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsDispenseModalOpen(false)} className="px-4 py-2 font-bold text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 font-black text-xs text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 cursor-pointer">Confirm Dispense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ MODAL: Add New Medicine ============ */}
      {isAddStockModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full shadow-2xl p-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <PackagePlus className="text-emerald-500" />
              Add New Stock Item
            </h3>
            <form onSubmit={handleAddNewMedicine} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Medicine Name</label>
                <input required type="text" value={stockForm.name} onChange={e => setStockForm({...stockForm, name: e.target.value})} placeholder="e.g. Paracetamol 500mg" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Category</label>
                  <select value={stockForm.category} onChange={e => setStockForm({...stockForm, category: e.target.value})} className={inputCls}>
                    <option>Analgesic</option>
                    <option>Antibiotic</option>
                    <option>Supplement</option>
                    <option>Vaccine</option>
                    <option>Antihypertensive</option>
                    <option>Antihistamine</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Unit</label>
                  <select value={stockForm.unit} onChange={e => setStockForm({...stockForm, unit: e.target.value})} className={inputCls}>
                    <option>tablets</option>
                    <option>capsules</option>
                    <option>vials</option>
                    <option>bottles</option>
                    <option>sachets</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Initial Quantity</label>
                  <input type="number" min="0" value={stockForm.quantity} onChange={e => setStockForm({...stockForm, quantity: parseInt(e.target.value) || 0})} className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Min Threshold</label>
                  <input type="number" min="1" value={stockForm.minStock} onChange={e => setStockForm({...stockForm, minStock: parseInt(e.target.value) || 10})} className={inputCls} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsAddStockModalOpen(false)} className="px-4 py-2 font-bold text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 font-black text-xs text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/30 cursor-pointer">Add Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthRecords;

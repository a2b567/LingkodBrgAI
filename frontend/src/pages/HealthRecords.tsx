import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Heart, Plus, Search, FileText, Pill, Activity, User, Stethoscope, Droplet,
  Clock, CheckCircle2, SearchX, Package, AlertTriangle, Minus, PackagePlus, Trash2
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
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [view, setView] = useState<'records' | 'queue' | 'stock'>('records');

  // --- Health Record Form ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<HealthRecord>>({
    resident_name: '', blood_type: 'O+', allergies: '', conditions: '', last_checkup: '', status: 'Healthy'
  });

  useEffect(() => {
    api.health.listRecords().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setRecords(data);
      }
    }).catch(console.error);

    api.health.listStock().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setMedicineStock(data);
      }
    }).catch(console.error);
  }, []);

  const filteredRecords = records.filter(r =>
    r.resident_name.toLowerCase().includes(search.toLowerCase())
  );

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
      const newRecord: HealthRecord = { id: `HR-${Date.now()}`, ...payload } as HealthRecord;
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
        return {
          ...record,
          dispensedItems: [...(record.dispensedItems || []), {
            medicineName: dispenseForm.medicineName,
            quantity: dispenseForm.quantity,
            date: new Date().toISOString().split('T')[0]
          }]
        };
      }
      return record;
    }));

    setIsDispenseModalOpen(false);
    setDispenseForm({ medicineName: '', quantity: 1 });
    setSelectedRecordId(null);
  };

  const totalMedicinesDispensed = records.reduce((total, record) =>
    total + (record.dispensedItems?.reduce((sum, item) => sum + item.quantity, 0) || 0), 0);

  // --- Medicine Stock / Inventory ---
  const defaultStock: MedicineStock[] = [
    { id: 'MS-001', name: 'Paracetamol (Biogesic)', category: 'Analgesic', stock: 120, unit: 'tablets', minStock: 20 },
    { id: 'MS-002', name: 'Amoxicillin', category: 'Antibiotic', stock: 60, unit: 'capsules', minStock: 15 },
    { id: 'MS-003', name: 'Vitamin C (Ascorbic Acid)', category: 'Supplement', stock: 200, unit: 'tablets', minStock: 30 },
    { id: 'MS-004', name: 'Flu Vaccine', category: 'Vaccine', stock: 25, unit: 'vials', minStock: 5 },
    { id: 'MS-005', name: 'Losartan', category: 'Antihypertensive', stock: 80, unit: 'tablets', minStock: 10 },
  ];
  const [medicineStock, setMedicineStock] = useState<MedicineStock[]>(defaultStock);
  const [stockForm, setStockForm] = useState({ name: '', category: 'Analgesic', quantity: 0, unit: 'tablets', minStock: 10 });
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState(10);

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
      const newMed: MedicineStock = { id: `MS-${Date.now()}`, stock: stockForm.quantity, ...payload };
      setMedicineStock(prev => [...prev, newMed]);
    }
    setStockForm({ name: '', category: 'Analgesic', quantity: 0, unit: 'tablets', minStock: 10 });
    setIsAddStockModalOpen(false);
  };

  const handleRestock = (id: string) => {
    api.health.restock(id, restockQty).catch(console.error);
    setMedicineStock(medicineStock.map(m =>
      m.id === id ? { ...m, stock: m.stock + restockQty } : m
    ));
    setRestockId(null);
    setRestockQty(10);
  };

  const lowStockCount = medicineStock.filter(m => m.stock <= m.minStock).length;

  const handleDeleteStock = (id: string) => {
    if (confirm('Are you sure you want to delete this medicine from stock inventory?')) {
      api.health.deleteStock(id).catch(console.error);
      setMedicineStock(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm('Are you sure you want to delete this health record?')) {
      api.health.deleteRecord(id).catch(console.error);
      setRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleDeleteQueue = (id: string) => {
    setQueueList(prev => prev.filter(q => q.id !== id));
  };

  // --- FCFS Queue ---
  const [queueList, setQueueList] = useState<QueueItem[]>([]);
  const [queueForm, setQueueForm] = useState({ residentName: '', service: 'Checkup' });

  const handleAddToQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queueForm.residentName) return;
    const newItem: QueueItem = {
      id: `Q-${Date.now()}`,
      residentName: queueForm.residentName,
      service: queueForm.service,
      queueNumber: queueList.length + 1,
      timestamp: Date.now(),
      status: 'waiting'
    };
    setQueueList([...queueList, newItem]);
    setQueueForm({ residentName: '', service: 'Checkup' });
  };

  const markAsServed = (id: string) =>
    setQueueList(queueList.map(item => item.id === id ? { ...item, status: 'served' } : item));

  const activeQueue = queueList.filter(q => q.status === 'waiting').sort((a, b) => a.timestamp - b.timestamp);
  const servedQueue = queueList.filter(q => q.status === 'served').sort((a, b) => b.timestamp - a.timestamp);

  const inputCls = 'w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white';

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
      {/* Header */}
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800/60 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-rose-500/30 ring-4 ring-rose-500/10">
            <Activity size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Health Records</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-bold mt-1">Manage resident medical histories and health statuses</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Segmented View Switcher */}
          <div className="inline-flex p-1.5 bg-slate-100 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-inner gap-1">
            <button
              onClick={() => setView('records')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                view === 'records'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <FileText size={15} strokeWidth={2.5} />
              <span>Records</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                view === 'records' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {records.length}
              </span>
            </button>

            <button
              onClick={() => setView('queue')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all relative ${
                view === 'queue'
                  ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-lg shadow-slate-900/30 font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Clock size={15} strokeWidth={2.5} />
              <span>Queue</span>
              {activeQueue.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-white animate-pulse">
                  {activeQueue.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setView('stock')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all relative ${
                view === 'stock'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Package size={15} strokeWidth={2.5} />
              <span>Stock</span>
              {lowStockCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-white">
                  {lowStockCount}
                </span>
              )}
            </button>
          </div>

          {/* Dynamic Primary Action Button */}
          {view === 'records' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-2xl font-black text-xs shadow-xl shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-95 border border-rose-500/50 uppercase tracking-wider whitespace-nowrap"
            >
              <Plus size={16} strokeWidth={3} />
              New Record
            </button>
          )}

          {view === 'stock' && (
            <button
              onClick={() => setIsAddStockModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-xs shadow-xl shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-95 border border-emerald-500/50 uppercase tracking-wider whitespace-nowrap"
            >
              <PackagePlus size={16} strokeWidth={3} />
              Add Medicine
            </button>
          )}

          {view === 'queue' && (
            <button
              onClick={() => {
                const el = document.getElementById('queue-name-input');
                if (el) el.focus();
              }}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-black text-xs shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-95 border border-indigo-500/50 uppercase tracking-wider whitespace-nowrap"
            >
              <Plus size={16} strokeWidth={3} />
              Add to Queue
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 p-6 rounded-[2rem] border border-slate-200/80 dark:border-slate-800/80 shadow-xl flex items-center justify-between group hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">Total Records</p>
            <p className="text-4xl font-black text-slate-900 dark:text-white">{records.length}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <User size={26} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/20 p-6 rounded-[2rem] border border-emerald-500/20 shadow-xl flex items-center justify-between group hover:border-emerald-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-500 tracking-widest">Healthy</p>
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
            <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-500 tracking-widest">Meds Dispensed</p>
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
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-4 items-center">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search resident..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 dark:text-white transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Resident</th>
                  <th className="px-6 py-4">Blood Type</th>
                  <th className="px-6 py-4">Conditions</th>
                  <th className="px-6 py-4">Medicines Given</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-all group">
                    <td className="px-6 py-5 font-mono text-xs font-black text-slate-400 dark:text-slate-500 group-hover:text-rose-500 transition-colors">{record.id}</td>
                    <td className="px-6 py-5">
                      <p className="font-extrabold text-sm text-slate-900 dark:text-white">{record.resident_name}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Age: {record.age}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 font-black text-xs border border-rose-100 dark:border-rose-900/50 shadow-sm">
                        <Droplet size={12} className="fill-rose-500" /> {record.blood_type}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-700 dark:text-slate-300">{record.conditions}</p>
                      <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Allergies: <span className="text-amber-600 dark:text-amber-400">{record.allergies}</span></p>
                    </td>
                    <td className="px-6 py-5">
                      {record.dispensedItems && record.dispensedItems.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {record.dispensedItems.map((item, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[9px] font-bold border border-blue-200 dark:border-blue-800">
                              {item.medicineName} x{item.quantity}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                        record.status === 'Healthy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/50' :
                        record.status === 'Under Observation' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800/50' :
                        'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/50'
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
                          onClick={() => { setSelectedRecordId(record.id); setIsDispenseModalOpen(true); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors border border-blue-200 dark:border-blue-800"
                        >
                          <Pill size={12} />
                          Dispense
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          title="Delete Record"
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-800/60 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <FileText size={32} className="mx-auto mb-3 opacity-20" />
                      <p className="font-bold">No health records found.</p>
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
              Add to Queue
            </h3>
            <form onSubmit={handleAddToQueue} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">Resident Name</label>
                <input id="queue-name-input" required type="text" value={queueForm.residentName} onChange={e => setQueueForm({...queueForm, residentName: e.target.value})} placeholder="Enter name to queue..." className={inputCls} />
              </div>
              <div className="flex-1 w-full">
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">Service Type</label>
                <select value={queueForm.service} onChange={e => setQueueForm({...queueForm, service: e.target.value})} className={inputCls}>
                  <option>Checkup</option>
                  <option>Vaccination</option>
                  <option>Medicine Pickup</option>
                  <option>Consultation</option>
                </select>
              </div>
              <button type="submit" className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl font-black text-xs shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-95 border border-rose-500/50 uppercase tracking-wider">
                Add to Queue
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 flex items-center justify-between">
                <span>Active Queue</span>
                <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-lg text-xs">{activeQueue.length} Waiting</span>
              </h3>
              <div className="space-y-3">
                {activeQueue.map(item => (
                  <div key={item.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center font-black text-lg">{item.queueNumber}</div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{item.residentName}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.service}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => markAsServed(item.id)} title="Mark as Served" className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 rounded-xl transition-colors">
                        <CheckCircle2 size={20} />
                      </button>
                      <button onClick={() => handleDeleteQueue(item.id)} title="Remove from Queue" className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 rounded-xl transition-colors">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
                {activeQueue.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <SearchX size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-bold">Queue is empty</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 opacity-75">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4">Recently Served</h3>
              <div className="space-y-3">
                {servedQueue.slice(0, 5).map(item => (
                  <div key={item.id} className="p-3 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 flex items-center justify-center font-bold text-xs">{item.queueNumber}</div>
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">{item.residentName}</p>
                      <p className="text-[9px] text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-widest">{item.service}</p>
                    </div>
                  </div>
                ))}
                {servedQueue.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <p className="text-xs font-bold">No served records yet</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="text-emerald-500" /> Medicine & Vaccine Inventory
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Track stock levels. Rows highlighted amber are low on stock.</p>
            </div>
            <button onClick={() => setIsAddStockModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs shadow-lg transition-all hover:scale-[1.02] uppercase tracking-wider">
              <PackagePlus size={16} /> Add Medicine
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Medicine / Vaccine</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Current Stock</th>
                    <th className="px-6 py-4">Min. Stock</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  {medicineStock.map(med => {
                    const isLow = med.stock <= med.minStock;
                    return (
                      <tr key={med.id} className={`transition-all ${isLow ? 'bg-amber-50/60 dark:bg-amber-950/20' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/80'}`}>
                        <td className="px-6 py-4">
                          <p className="font-extrabold text-sm text-slate-900 dark:text-white">{med.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{med.id}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">{med.category}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-2xl font-black font-mono ${isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>{med.stock}</span>
                          <span className="text-[10px] text-slate-400 ml-1">{med.unit}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-bold">{med.minStock} {med.unit}</td>
                        <td className="px-6 py-4">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              <AlertTriangle size={11} /> Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> OK
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {restockId === med.id ? (
                            <div className="flex items-center gap-2 justify-end">
                              <input type="number" min="1" value={restockQty} onChange={e => setRestockQty(parseInt(e.target.value) || 1)} className="w-16 px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-center dark:text-white" />
                              <button onClick={() => handleRestock(med.id)} className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-black rounded-lg hover:bg-emerald-500 transition-colors">Save</button>
                              <button onClick={() => setRestockId(null)} className="px-2 py-1.5 text-slate-500 text-[10px] font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><Minus size={12} /></button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 justify-end">
                              <button onClick={() => { setRestockId(med.id); setRestockQty(10); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 rounded-lg text-[10px] font-black uppercase border border-emerald-200 dark:border-emerald-800 transition-colors">
                                <PackagePlus size={12} /> Restock
                              </button>
                              <button
                                onClick={() => handleDeleteStock(med.id)}
                                title="Delete Medicine"
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-800/60 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
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

      {/* ============ MODAL: New Health Record ============ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Stethoscope className="text-rose-500" />
              New Health Record
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">Resident Name</label>
                <input required type="text" value={form.resident_name} onChange={e => setForm({...form, resident_name: e.target.value})} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">Blood Type</label>
                  <select value={form.blood_type} onChange={e => setForm({...form, blood_type: e.target.value})} className={inputCls}>
                    <option>O+</option><option>O-</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value as 'Healthy' | 'Under Observation' | 'Critical'})} className={inputCls}>
                    <option>Healthy</option><option>Under Observation</option><option>Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">Medical Conditions</label>
                <input type="text" value={form.conditions} onChange={e => setForm({...form, conditions: e.target.value})} placeholder="e.g. Hypertension" className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">Allergies</label>
                <input type="text" value={form.allergies} onChange={e => setForm({...form, allergies: e.target.value})} placeholder="e.g. Peanuts" className={inputCls} />
              </div>
              <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-bold text-xs text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 rounded-xl">Save Record</button>
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
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">Select Medicine / Vaccine</label>
                <select required value={dispenseForm.medicineName} onChange={e => setDispenseForm({...dispenseForm, medicineName: e.target.value})} className={inputCls}>
                  <option value="">-- Choose Item --</option>
                  {medicineStock.map(m => (
                    <option key={m.id} value={m.name}>{m.name} ({m.stock} {m.unit} left)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">Quantity</label>
                <input required type="number" min="1" value={dispenseForm.quantity} onChange={e => setDispenseForm({...dispenseForm, quantity: parseInt(e.target.value) || 1})} className={inputCls} />
              </div>
              <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsDispenseModalOpen(false)} className="px-4 py-2 font-bold text-xs text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-xl">Confirm Dispense</button>
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
              Add New Medicine
            </h3>
            <form onSubmit={handleAddNewMedicine} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">Medicine Name</label>
                <input required type="text" value={stockForm.name} onChange={e => setStockForm({...stockForm, name: e.target.value})} placeholder="e.g. Ibuprofen" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">Category</label>
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
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">Unit</label>
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
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">Initial Stock</label>
                  <input type="number" min="0" value={stockForm.quantity} onChange={e => setStockForm({...stockForm, quantity: parseInt(e.target.value) || 0})} className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">Min. Stock Alert</label>
                  <input type="number" min="1" value={stockForm.minStock} onChange={e => setStockForm({...stockForm, minStock: parseInt(e.target.value) || 1})} className={inputCls} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsAddStockModalOpen(false)} className="px-4 py-2 font-bold text-xs text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl">Add to Inventory</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

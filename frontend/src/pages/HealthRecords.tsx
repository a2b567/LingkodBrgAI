import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { 
  Heart, Search, FileText, Pill, Activity, User, Stethoscope, Droplet,
  Clock, CheckCircle2, SearchX, Package, AlertTriangle, PackagePlus, Trash2,
  Eye, Volume2, Filter, UserPlus,
  FileSpreadsheet, Upload, Download, XCircle, AlertCircle, Loader2,
  History, Minus
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

export interface MedicineDispenseLog {
  id: string;
  medicineId?: string;
  medicineName: string;
  category: string;
  quantity: number;
  unit: string;
  recipientName: string;
  purpose: string;
  dispensedBy: string;
  notes?: string;
  date: string;
  timestamp: string;
  remainingStock: number;
}

export const HealthRecords: React.FC = () => {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [bloodFilter, setBloodFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [view, setView] = useState<'records' | 'queue' | 'stock' | 'dispense-logs'>('records');
  const [selectedPatientChart, setSelectedPatientChart] = useState<HealthRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<HealthRecord>>({
    resident_name: '', blood_type: 'O+', allergies: '', conditions: '', last_checkup: '', status: 'Healthy'
  });

  // Resident names for autocomplete suggestions
  const [residentNames, setResidentNames] = useState<string[]>([]);
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

    api.residents.list().then(res => {
      if (Array.isArray(res)) {
        setResidentNames(res.map((r: any) => `${r.first_name || ''} ${r.middle_name ? r.middle_name[0] + '.' : ''} ${r.last_name || ''}`.trim()).filter(Boolean));
      }
    }).catch(() => {});
  }, []);

  const filteredRecords = records.filter(r => {
    const matchesSearch = (r.resident_name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (r.conditions || '').toLowerCase().includes(search.toLowerCase()) ||
                          (r.allergies || '').toLowerCase().includes(search.toLowerCase());
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

  // --- Medicine Dispensing & Audit Logs ---
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
  const [dispenseFeedback, setDispenseFeedback] = useState<string | null>(null);
  const [dispenseLogSearch, setDispenseLogSearch] = useState('');
  const [dispenseLogMedFilter, setDispenseLogMedFilter] = useState('All');

  const [dispenseLogs, setDispenseLogs] = useState<MedicineDispenseLog[]>(() => {
    try {
      const saved = localStorage.getItem('medicine_dispense_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [dispenseForm, setDispenseForm] = useState({
    medicineName: '',
    quantity: 1,
    recipientName: '',
    purpose: 'Lagnat / Sakit ng Ulo',
    notes: '',
    selectedRecordId: null as string | null,
  });

  const handleOpenDispenseForMed = (med: MedicineStock) => {
    setDispenseForm({
      medicineName: med.name,
      quantity: 1,
      recipientName: '',
      purpose: 'Lagnat / Sakit ng Ulo',
      notes: '',
      selectedRecordId: null,
    });
    setIsDispenseModalOpen(true);
  };

  const handleOpenDispenseForRecord = (record: HealthRecord) => {
    setDispenseForm({
      medicineName: medicineStock[0]?.name || '',
      quantity: 1,
      recipientName: record.resident_name,
      purpose: record.conditions ? `Para sa: ${record.conditions}` : 'Medical assistance',
      notes: '',
      selectedRecordId: record.id,
    });
    setIsDispenseModalOpen(true);
  };

  const handleOpenGeneralDispense = () => {
    const firstMed = medicineStock[0]?.name || '';
    setDispenseForm({
      medicineName: firstMed,
      quantity: 1,
      recipientName: '',
      purpose: 'Lagnat / Sakit ng Ulo',
      notes: '',
      selectedRecordId: null,
    });
    setIsDispenseModalOpen(true);
  };

  const handleDispense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispenseForm.medicineName) {
      alert('Piliin ang gamot na ibabawas.');
      return;
    }
    if (!dispenseForm.recipientName.trim()) {
      alert('Pakilagay kung sinong pasyente o residente ang tumanggap ng gamot (Saan Napunta).');
      return;
    }

    const stockItem = medicineStock.find(m => m.name === dispenseForm.medicineName);
    if (!stockItem) {
      alert('Hindi mahanap ang gamot sa inventory stock.');
      return;
    }

    if (stockItem.stock < dispenseForm.quantity) {
      alert(`Kulang ang stock! Mayroon na lamang ${stockItem.stock} ${stockItem.unit} ng ${stockItem.name} na natitira.`);
      return;
    }

    const newStockCount = Math.max(0, stockItem.stock - dispenseForm.quantity);

    // 1. Deduct stock in backend
    try {
      await api.health.restock(stockItem.id, -dispenseForm.quantity);
    } catch (err) {
      console.warn('Backend restock fallback:', err);
    }

    // 2. Update frontend stock state immediately
    setMedicineStock(prev => prev.map(m =>
      m.name === dispenseForm.medicineName ? { ...m, stock: newStockCount } : m
    ));

    // 3. Create persistent Audit Trail entry (saan napunta ang gamot)
    const newLog: MedicineDispenseLog = {
      id: `DISP-${Date.now()}`,
      medicineId: stockItem.id,
      medicineName: stockItem.name,
      category: stockItem.category,
      quantity: dispenseForm.quantity,
      unit: stockItem.unit,
      recipientName: dispenseForm.recipientName.trim(),
      purpose: dispenseForm.purpose.trim() || 'General Medical Assistance',
      dispensedBy: user?.username || 'Health Worker',
      notes: dispenseForm.notes?.trim() || '',
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      remainingStock: newStockCount,
    };

    const updatedLogs = [newLog, ...dispenseLogs];
    setDispenseLogs(updatedLogs);
    try {
      localStorage.setItem('medicine_dispense_logs', JSON.stringify(updatedLogs));
    } catch {}

    // 4. Also update patient record if tied to a record
    if (dispenseForm.selectedRecordId) {
      api.health.dispenseMedicine(dispenseForm.selectedRecordId, {
        medicineName: dispenseForm.medicineName,
        quantity: dispenseForm.quantity,
      }).catch(console.error);

      setRecords(prev => prev.map(record => {
        if (record.id === dispenseForm.selectedRecordId) {
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
    }

    setDispenseFeedback(`✓ Naibawas ang ${dispenseForm.quantity} ${stockItem.unit} ng ${stockItem.name} para kay ${dispenseForm.recipientName}! (Natirang stock: ${newStockCount} ${stockItem.unit})`);
    setTimeout(() => setDispenseFeedback(null), 6000);

    setIsDispenseModalOpen(false);
    setDispenseForm({ medicineName: '', quantity: 1, recipientName: '', purpose: 'Lagnat / Sakit ng Ulo', notes: '', selectedRecordId: null });
  };

  const handleExportDispenseLogCSV = () => {
    if (dispenseLogs.length === 0) {
      alert('Walang talaan ng naipamahaging gamot upang i-export.');
      return;
    }
    const headers = ['date', 'time', 'medicine_name', 'category', 'quantity_dispensed', 'unit', 'recipient_patient', 'purpose_diagnosis', 'dispensed_by', 'remaining_stock', 'notes'];
    const rows = dispenseLogs.map(l => [
      l.date,
      l.timestamp,
      l.medicineName,
      l.category,
      l.quantity,
      l.unit,
      l.recipientName,
      l.purpose,
      l.dispensedBy,
      l.remainingStock,
      l.notes || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `barangay_medicine_dispense_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalMedicinesDispensed = dispenseLogs.reduce((sum, item) => sum + (item.quantity || 0), 0)
    + records.reduce((total, record) =>
      total + (record.dispensedItems?.reduce((sum, item) => sum + item.quantity, 0) || 0), 0);

  const [medicineStock, setMedicineStock] = useState<MedicineStock[]>([]);
  const [stockForm, setStockForm] = useState({ name: '', category: 'Analgesic', quantity: 50, unit: 'tablets', minStock: 10 });
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);

  // Pharmacy Stock Import States
  const [showImportStockModal, setShowImportStockModal] = useState(false);
  const [importStockFile, setImportStockFile] = useState<File | null>(null);
  const [importStockRows, setImportStockRows] = useState<any[]>([]);
  const [importStockErrors, setImportStockErrors] = useState<string[]>([]);
  const [isImportingStock, setIsImportingStock] = useState(false);
  const [importStockSuccess, setImportStockSuccess] = useState<number | null>(null);
  const importStockFileInputRef = useRef<HTMLInputElement>(null);

  // Patient Records Import States
  const [showImportRecordModal, setShowImportRecordModal] = useState(false);
  const [importRecordFile, setImportRecordFile] = useState<File | null>(null);
  const [importRecordRows, setImportRecordRows] = useState<any[]>([]);
  const [importRecordErrors, setImportRecordErrors] = useState<string[]>([]);
  const [isImportingRecord, setIsImportingRecord] = useState(false);
  const [importRecordSuccess, setImportRecordSuccess] = useState<number | null>(null);
  const importRecordFileInputRef = useRef<HTMLInputElement>(null);

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

  const filteredDispenseLogs = dispenseLogs.filter(log => {
    const matchesMed = dispenseLogMedFilter === 'ALL' || dispenseLogMedFilter === 'All' || log.medicineName === dispenseLogMedFilter;
    const term = dispenseLogSearch.toLowerCase().trim();
    if (!term) return matchesMed;
    const matchesSearch =
      log.recipientName?.toLowerCase().includes(term) ||
      log.medicineName?.toLowerCase().includes(term) ||
      log.purpose?.toLowerCase().includes(term) ||
      log.dispensedBy?.toLowerCase().includes(term) ||
      (log.notes && log.notes.toLowerCase().includes(term));
    return matchesMed && matchesSearch;
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

  // CSV Helpers
  const parseCSVData = (text: string) => {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length <= 1) return { headers: [], rows: [] };

    const parseLine = (line: string): string[] => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values.map(v => v.replace(/^"|"$/g, '').trim());
    };

    const rawHeaders = parseLine(lines[0]);
    const headers = rawHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const rows = lines.slice(1).map(l => parseLine(l)).filter(r => r.some(v => v !== ''));

    return { headers, rows };
  };

  // --- Pharmacy Stock Import / Export / Sample ---
  const handleDownloadStockSample = () => {
    const headers = ['name', 'category', 'quantity', 'unit', 'min_stock'];
    const sampleRows = [
      ['Paracetamol 500mg', 'Analgesic', '200', 'tablets', '30'],
      ['Amoxicillin 500mg', 'Antibiotic', '150', 'capsules', '20'],
      ['Cetirizine 10mg', 'Antihistamine', '120', 'tablets', '25'],
      ['Mefenamic Acid 500mg', 'Analgesic', '100', 'capsules', '20'],
      ['Oral Rehydration Salts', 'Other', '80', 'sachets', '15'],
      ['Multivitamins + Iron', 'Supplement', '250', 'capsules', '50'],
    ];

    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_pharmacy_stock.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportStockCSV = () => {
    if (medicineStock.length === 0) {
      alert('No pharmacy medicine stock records to export.');
      return;
    }
    const headers = ['Medicine Name', 'Category', 'Current Stock', 'Unit', 'Min Threshold', 'Status'];
    const rows = medicineStock.map(m => [
      `"${m.name.replace(/"/g, '""')}"`,
      `"${m.category}"`,
      `"${m.stock}"`,
      `"${m.unit}"`,
      `"${m.minStock}"`,
      `"${m.stock <= m.minStock ? 'Low Stock' : 'Adequate'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pharmacy_stock_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportStockFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStockFile(file);
    setImportStockErrors([]);
    setImportStockSuccess(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) {
        setImportStockErrors(['Selected file is empty.']);
        setImportStockRows([]);
        return;
      }

      const { headers, rows } = parseCSVData(text);
      if (rows.length === 0) {
        setImportStockErrors(['No valid medicine data rows found in the CSV.']);
        setImportStockRows([]);
        return;
      }

      const parsed: any[] = [];
      const errors: string[] = [];

      rows.forEach((vals, index) => {
        const rowNum = index + 2;
        const getValue = (keys: string[]) => {
          for (const k of keys) {
            const idx = headers.findIndex(h => h.includes(k));
            if (idx !== -1 && vals[idx] !== undefined && vals[idx] !== '') return vals[idx];
          }
          return '';
        };

        const name = getValue(['name', 'medicine', 'med', 'item']) || vals[0] || '';
        const category = getValue(['category', 'type']) || 'Analgesic';
        const rawQty = getValue(['quantity', 'qty', 'stock', 'amount', 'count']) || (vals.length > 2 ? vals[2] : '50');
        const quantity = parseInt(rawQty) || 0;
        const unit = getValue(['unit', 'packaging']) || 'tablets';
        const rawMin = getValue(['min_stock', 'minstock', 'threshold', 'minimum']) || (vals.length > 4 ? vals[4] : '10');
        const minStock = parseInt(rawMin) || 10;

        if (!name) {
          errors.push(`Row ${rowNum}: Missing medicine name.`);
          return;
        }

        parsed.push({
          name,
          category,
          quantity,
          unit,
          minStock,
        });
      });

      setImportStockErrors(errors);
      setImportStockRows(parsed);
    };

    reader.readAsText(file);
  };

  const handleExecuteImportStock = async () => {
    if (importStockRows.length === 0) return;
    setIsImportingStock(true);
    let count = 0;
    try {
      for (const row of importStockRows) {
        try {
          const res = await api.health.addStock(row);
          setMedicineStock(prev => [...prev, res]);
          count++;
        } catch {
          const fallbackMed: MedicineStock = {
            id: `MS-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
            name: row.name,
            category: row.category,
            stock: row.quantity,
            unit: row.unit,
            minStock: row.minStock,
          };
          setMedicineStock(prev => [...prev, fallbackMed]);
          count++;
        }
      }
      setImportStockSuccess(count);
      setTimeout(() => {
        setShowImportStockModal(false);
        setImportStockFile(null);
        setImportStockRows([]);
        setImportStockSuccess(null);
      }, 1500);
    } catch (err) {
      console.error('Stock import failed:', err);
    } finally {
      setIsImportingStock(false);
    }
  };

  // --- Patient Medical Records Import / Export / Sample ---
  const handleDownloadRecordSample = () => {
    const headers = ['resident_name', 'age', 'blood_type', 'allergies', 'conditions', 'last_checkup', 'status'];
    const sampleRows = [
      ['Juan Dela Cruz', '42', 'O+', 'Penicillin', 'Hypertension', '2026-10-15', 'Under Observation'],
      ['Maria Garcia', '34', 'A+', 'None', 'None', '2026-10-28', 'Healthy'],
      ['Pedro Mendoza', '68', 'B+', 'Aspirin', 'Type 2 Diabetes', '2026-10-20', 'Under Observation'],
      ['Ana Bautista', '24', 'AB+', 'Shellfish', 'Asthma', '2026-09-30', 'Healthy'],
    ];

    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_patient_records.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportRecordCSV = () => {
    if (records.length === 0) {
      alert('No patient medical records to export.');
      return;
    }
    const headers = ['ID', 'Resident Name', 'Age', 'Blood Type', 'Allergies', 'Conditions', 'Last Checkup', 'Status'];
    const rows = records.map(r => [
      `"${r.id}"`,
      `"${r.resident_name.replace(/"/g, '""')}"`,
      `"${r.age}"`,
      `"${r.blood_type}"`,
      `"${r.allergies.replace(/"/g, '""')}"`,
      `"${r.conditions.replace(/"/g, '""')}"`,
      `"${r.last_checkup}"`,
      `"${r.status}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `patient_medical_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportRecordFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportRecordFile(file);
    setImportRecordErrors([]);
    setImportRecordSuccess(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) {
        setImportRecordErrors(['Selected file is empty.']);
        setImportRecordRows([]);
        return;
      }

      const { headers, rows } = parseCSVData(text);
      if (rows.length === 0) {
        setImportRecordErrors(['No valid medical record rows found in the CSV.']);
        setImportRecordRows([]);
        return;
      }

      const parsed: any[] = [];
      const errors: string[] = [];

      rows.forEach((vals, index) => {
        const rowNum = index + 2;
        const getValue = (keys: string[]) => {
          for (const k of keys) {
            const idx = headers.findIndex(h => h.includes(k));
            if (idx !== -1 && vals[idx] !== undefined && vals[idx] !== '') return vals[idx];
          }
          return '';
        };

        const resident_name = getValue(['resident_name', 'name', 'patient', 'resident']) || vals[0] || '';
        const rawAge = getValue(['age']) || (vals.length > 1 ? vals[1] : '30');
        const age = parseInt(rawAge) || 30;
        const blood_type = getValue(['blood_type', 'blood']) || 'O+';
        const allergies = getValue(['allergies', 'allergy']) || 'None';
        const conditions = getValue(['conditions', 'condition', 'diagnosis']) || 'None';
        const last_checkup = getValue(['last_checkup', 'checkup', 'date']) || new Date().toISOString().split('T')[0];
        const rawStatus = getValue(['status']) || 'Healthy';
        const status = rawStatus.toLowerCase().includes('obs') ? 'Under Observation' : (rawStatus.toLowerCase().includes('crit') ? 'Critical' : 'Healthy');

        if (!resident_name) {
          errors.push(`Row ${rowNum}: Missing resident/patient name.`);
          return;
        }

        parsed.push({
          resident_name,
          age,
          blood_type,
          allergies,
          conditions,
          last_checkup,
          status,
        });
      });

      setImportRecordErrors(errors);
      setImportRecordRows(parsed);
    };

    reader.readAsText(file);
  };

  const handleExecuteImportRecord = async () => {
    if (importRecordRows.length === 0) return;
    setIsImportingRecord(true);
    let count = 0;
    try {
      for (const row of importRecordRows) {
        try {
          const res = await api.health.createRecord(row);
          setRecords(prev => [res, ...prev]);
          count++;
        } catch {
          const fallbackRec: HealthRecord = {
            id: `HR-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
            ...row,
          };
          setRecords(prev => [fallbackRec, ...prev]);
          count++;
        }
      }
      setImportRecordSuccess(count);
      setTimeout(() => {
        setShowImportRecordModal(false);
        setImportRecordFile(null);
        setImportRecordRows([]);
        setImportRecordSuccess(null);
      }, 1500);
    } catch (err) {
      console.error('Record import failed:', err);
    } finally {
      setIsImportingRecord(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 w-full min-w-0">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800 flex items-center justify-center shrink-0 shadow-subtle">
            <Activity size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Health & Medical Center
              </h1>
              <span className="inline-flex text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                RA 10173 Protected
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Barangay San Isidro Patient Records, Active Clinic Queue & Pharmacy Stock
            </p>
          </div>
        </div>

        {/* Action Buttons for Current View */}
        <div className="flex items-center gap-2 flex-wrap">
          {view === 'records' && (
            <>
              <button
                type="button"
                onClick={handleDownloadRecordSample}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                title="Download sample CSV format for patient medical records"
              >
                <FileText size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span>Sample Format</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowImportRecordModal(true);
                  setImportRecordFile(null);
                  setImportRecordRows([]);
                  setImportRecordErrors([]);
                  setImportRecordSuccess(null);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                title="Import patient records from CSV"
              >
                <Upload size={14} className="text-blue-600 dark:text-blue-400" />
                <span>Import CSV</span>
              </button>

              <button
                type="button"
                onClick={handleExportRecordCSV}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                title="Export patient records to CSV"
              >
                <FileSpreadsheet size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-xl font-bold text-xs transition-colors shadow-subtle cursor-pointer"
              >
                <UserPlus size={15} />
                <span>New Patient Record</span>
              </button>
            </>
          )}

          {view === 'stock' && (
            <>
              <button
                type="button"
                onClick={handleDownloadStockSample}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                title="Download sample CSV format for pharmacy inventory"
              >
                <FileText size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span>Sample Format</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowImportStockModal(true);
                  setImportStockFile(null);
                  setImportStockRows([]);
                  setImportStockErrors([]);
                  setImportStockSuccess(null);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                title="Import medicine stock from CSV"
              >
                <Upload size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Import CSV</span>
              </button>

              <button
                type="button"
                onClick={handleExportStockCSV}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                title="Export pharmacy stock to CSV"
              >
                <FileSpreadsheet size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={handleOpenGeneralDispense}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs transition-colors shadow-subtle cursor-pointer"
                title="Mag-dispense o mag-bawas ng gamot sa inventory"
              >
                <Pill size={14} />
                <span>Dispense Medicine</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddStockModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors shadow-subtle cursor-pointer"
              >
                <PackagePlus size={15} />
                <span>Add Medicine</span>
              </button>
            </>
          )}

          {view === 'dispense-logs' && (
            <>
              <button
                type="button"
                onClick={handleExportDispenseLogCSV}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                title="I-export ang kumpletong talaan ng naipamahaging gamot sa CSV"
              >
                <FileSpreadsheet size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Export Log (CSV)</span>
              </button>

              <button
                type="button"
                onClick={handleOpenGeneralDispense}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs transition-colors shadow-subtle cursor-pointer"
              >
                <Pill size={14} />
                <span>Dispense Medicine</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Segmented Navigation Tab Bar */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 max-w-full">
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl gap-1 shrink-0">
          <button
            onClick={() => setView('records')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              view === 'records'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-subtle font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText size={15} />
            <span>Medical Records</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              view === 'records' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
            }`}>
              {records.length}
            </span>
          </button>

          <button
            onClick={() => setView('queue')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              view === 'queue'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-subtle font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clock size={15} />
            <span>Clinic Queue</span>
            {activeQueue.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                {activeQueue.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setView('stock')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              view === 'stock'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-subtle font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Package size={15} />
            <span>Pharmacy Stock</span>
            {lowStockCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                {lowStockCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setView('dispense-logs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              view === 'dispense-logs'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-subtle font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <History size={15} />
            <span>Saan Napunta ang Gamot</span>
            {dispenseLogs.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                {dispenseLogs.length}
              </span>
            )}
          </button>
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

      {/* Dispense Success Feedback Alert */}
      {dispenseFeedback && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{dispenseFeedback}</span>
          </div>
          <button onClick={() => setDispenseFeedback(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

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
                          onClick={() => handleOpenDispenseForRecord(record)}
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
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => handleOpenDispenseForMed(med)}
                              title="Bawas Stock / Ibigay sa Residente"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 rounded-xl text-[10px] font-black uppercase border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                            >
                              <Minus size={12} /> Bawas
                            </button>
                            <button
                              onClick={() => handleRestock(med.id, 20)}
                              title="Dagdag +20 Stock"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 rounded-xl text-[10px] font-black uppercase border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                            >
                              <PackagePlus size={12} /> +20
                            </button>
                            <button
                              onClick={() => { setDispenseLogMedFilter(med.name); setView('dispense-logs'); }}
                              title="Tignan kung saan napunta ang gamot na ito"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 dark:text-blue-300 rounded-xl text-[10px] font-black uppercase border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                            >
                              <History size={12} /> History
                            </button>
                            <button
                              onClick={() => handleDeleteStock(med.id)}
                              title="Delete Medicine"
                              className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/50 dark:text-slate-400 dark:hover:text-rose-300 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
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

      {/* ============ VIEW: Saan Napunta Ang Gamot (Dispense History / Audit Trail) ============ */}
      {view === 'dispense-logs' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Hanapin pasyente, gamot, dahilan, o health worker..."
                value={dispenseLogSearch}
                onChange={e => setDispenseLogSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-sm"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <select
                value={dispenseLogMedFilter}
                onChange={e => setDispenseLogMedFilter(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold focus:outline-none shadow-sm cursor-pointer"
              >
                <option value="ALL">Lahat ng Gamot</option>
                {medicineStock.map(m => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
              <button
                onClick={handleOpenGeneralDispense}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                <Pill size={15} /> Magbawas / Mag-dispense
              </button>
              <button
                onClick={handleExportDispenseLogCSV}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                <Download size={15} /> Export CSV
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Petsa & Oras</th>
                    <th className="px-6 py-4">Gamot / Bakuna</th>
                    <th className="px-6 py-4 text-center">Bilang Na Bawas</th>
                    <th className="px-6 py-4">Kanino Napunta (Pasyente / Residente)</th>
                    <th className="px-6 py-4">Dahilan / Rekomendasyon</th>
                    <th className="px-6 py-4">Health Worker</th>
                    <th className="px-6 py-4">Natitirang Stock</th>
                    <th className="px-6 py-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  {filteredDispenseLogs.length > 0 ? (
                    filteredDispenseLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Clock size={13} className="text-slate-400" />
                            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                              {log.date} {log.timestamp ? `• ${log.timestamp}` : ''}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Pill size={14} className="text-rose-500" />
                            {log.medicineName}
                          </p>
                          <span className="text-[10px] text-slate-400 font-semibold">{log.category}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-black font-mono text-xs border border-rose-200 dark:border-rose-800/60">
                            -{log.quantity} {log.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white font-black text-xs flex items-center justify-center">
                              {log.recipientName ? log.recipientName.slice(0, 1).toUpperCase() : 'P'}
                            </div>
                            <div>
                              <p className="font-black text-sm text-slate-900 dark:text-white">{log.recipientName}</p>
                              {log.medicineId && (
                                <p className="text-[10px] text-slate-400 font-mono">ID: {log.medicineId}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                            {log.purpose}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            {log.dispensedBy}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-black text-slate-700 dark:text-slate-300">
                            {log.remainingStock} {log.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-500 italic">
                            {log.notes || '—'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                        <History size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                        <p className="font-bold text-sm">Walang tala ng nabawas na gamot.</p>
                        <p className="text-xs text-slate-500 mt-1">Kapag nag-bawas o nag-dispense ng gamot gamit ang "- Bawas", lilitaw rito ang buong detalye kung kanino napunta.</p>
                      </td>
                    </tr>
                  )}
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
                onClick={() => handleOpenDispenseForRecord(selectedPatientChart)}
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

      {/* ============ MODAL: Dispense Medicine (Bawas Gamot & San Napunta) ============ */}
      {isDispenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
              <Pill className="text-rose-500" />
              Bawas Gamot / Dispense Medicine
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              I-record ang pagbawas ng stock at kung kaninong pasyente o residente ito napunta.
            </p>
            <form onSubmit={handleDispense} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Piliin ang Gamot / Bakuna <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={dispenseForm.medicineName}
                  onChange={e => setDispenseForm({...dispenseForm, medicineName: e.target.value})}
                  className={inputCls}
                >
                  <option value="">-- Piliin ang Gamot --</option>
                  {medicineStock.map(m => (
                    <option key={m.id} value={m.name}>
                      {m.name} ({m.stock} {m.unit} natitira)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Bilang / Quantity na Ibabawas <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  value={dispenseForm.quantity}
                  onChange={e => setDispenseForm({...dispenseForm, quantity: parseInt(e.target.value) || 1})}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Kanino Napunta (Pangalan ng Pasyente / Residente) <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  list="resident-names-list"
                  placeholder="e.g. Maria Clara Santos o piliin sa listahan"
                  value={dispenseForm.recipientName}
                  onChange={e => setDispenseForm({...dispenseForm, recipientName: e.target.value})}
                  className={inputCls}
                />
                <datalist id="resident-names-list">
                  {residentNames.map((name, i) => (
                    <option key={i} value={name} />
                  ))}
                </datalist>
                <p className="text-[10px] text-slate-400 mt-1">May auto-complete mula sa registered residents ng barangay.</p>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Dahilan / Rekomendasyon (Purpose)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lagnat, Ubo, Maintenance, First Aid, Reseta ni Doc"
                  value={dispenseForm.purpose}
                  onChange={e => setDispenseForm({...dispenseForm, purpose: e.target.value})}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Karagdagang Tala / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 1 tableta bawat 8 oras pagkatapos kumain..."
                  value={dispenseForm.notes}
                  onChange={e => setDispenseForm({...dispenseForm, notes: e.target.value})}
                  className={inputCls}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDispenseModalOpen(false)}
                  className="px-4 py-2 font-bold text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 font-black text-xs text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer"
                >
                  <Pill size={14} /> I-bawas at I-rekord
                </button>
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
    
      {/* ============ MODAL: Import Pharmacy Stock CSV ============ */}
      {showImportStockModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <PackagePlus size={18} />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">Import Pharmacy Stock from CSV</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Bulk upload medicines & inventory stock using CSV</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setShowImportStockModal(false);
                  setImportStockFile(null);
                  setImportStockRows([]);
                  setImportStockErrors([]);
                }} 
                title="Close" 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <XCircle size={22} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                <FileText size={18} className="text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Sample Pharmacy CSV Template</p>
                  <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 mt-0.5">
                    Download our official pharmacy stock template with proper columns (name, category, quantity, unit, min_stock).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadStockSample}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all flex-shrink-0 cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download Sample</span>
                </button>
              </div>

              <div
                onClick={() => importStockFileInputRef.current?.click()}
                className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 rounded-2xl p-7 text-center cursor-pointer transition-colors group"
              >
                <input
                  ref={importStockFileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleImportStockFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30 flex items-center justify-center transition-colors">
                    <Upload size={22} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  {importStockFile ? (
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{importStockFile.name}</p>
                      <p className="text-[11px] text-slate-500">{(importStockFile.size / 1024).toFixed(1)} KB — Click to change file</p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Click to select Medicine CSV file</p>
                      <p className="text-[11px] text-slate-500">Supports standard .csv inventory exports</p>
                    </div>
                  )}
                </div>
              </div>

              {importStockErrors.length > 0 && (
                <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 p-4 space-y-1.5 max-h-36 overflow-y-auto">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertCircle size={14} className="text-rose-500 flex-shrink-0" />
                    <p className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wide">Validation Errors ({importStockErrors.length})</p>
                  </div>
                  {importStockErrors.map((err, i) => (
                    <p key={i} className="text-[11px] text-rose-600 dark:text-rose-400 font-medium pl-5">{err}</p>
                  ))}
                </div>
              )}

              {importStockSuccess !== null && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span>Successfully imported {importStockSuccess} medicine stock item{importStockSuccess !== 1 ? 's' : ''}!</span>
                </div>
              )}

              {importStockRows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                      Preview — First {Math.min(importStockRows.length, 5)} of {importStockRows.length} Medicine{importStockRows.length > 1 ? 's' : ''}
                    </p>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                      {importStockRows.length} Valid Row{importStockRows.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 sticky top-0">
                          {['Medicine Name', 'Category', 'Quantity', 'Unit', 'Min Threshold'].map(col => (
                            <th key={col} className="px-3 py-2 text-left font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importStockRows.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{row.name}</td>
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{row.category}</td>
                            <td className="px-3 py-2 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{row.quantity}</td>
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{row.unit}</td>
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{row.minStock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowImportStockModal(false);
                  setImportStockFile(null);
                  setImportStockRows([]);
                  setImportStockErrors([]);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteImportStock}
                disabled={isImportingStock || importStockRows.length === 0}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isImportingStock ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Upload size={13} />
                    <span>Import {importStockRows.length > 0 ? `${importStockRows.length} Items` : 'Stock'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL: Import Patient Medical Records CSV ============ */}
      {showImportRecordModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gov-blue-500/10 text-gov-blue-500 flex items-center justify-center">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">Import Patient Records from CSV</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Bulk upload medical and diagnostic records using CSV</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setShowImportRecordModal(false);
                  setImportRecordFile(null);
                  setImportRecordRows([]);
                  setImportRecordErrors([]);
                }} 
                title="Close" 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <XCircle size={22} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                <FileText size={18} className="text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Sample Patient Record Template</p>
                  <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 mt-0.5">
                    Download our official patient record format (resident_name, age, blood_type, allergies, conditions, last_checkup, status).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadRecordSample}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all flex-shrink-0 cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download Sample</span>
                </button>
              </div>

              <div
                onClick={() => importRecordFileInputRef.current?.click()}
                className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-gov-blue-500 dark:hover:border-gov-blue-400 rounded-2xl p-7 text-center cursor-pointer transition-colors group"
              >
                <input
                  ref={importRecordFileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleImportRecordFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 group-hover:bg-gov-blue-50 dark:group-hover:bg-gov-blue-950/30 flex items-center justify-center transition-colors">
                    <Upload size={22} className="text-slate-400 group-hover:text-gov-blue-500 transition-colors" />
                  </div>
                  {importRecordFile ? (
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-gov-blue-600 dark:text-gov-blue-400">{importRecordFile.name}</p>
                      <p className="text-[11px] text-slate-500">{(importRecordFile.size / 1024).toFixed(1)} KB — Click to change file</p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Click to select Patient CSV file</p>
                      <p className="text-[11px] text-slate-500">Supports standard .csv health record exports</p>
                    </div>
                  )}
                </div>
              </div>

              {importRecordErrors.length > 0 && (
                <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 p-4 space-y-1.5 max-h-36 overflow-y-auto">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertCircle size={14} className="text-rose-500 flex-shrink-0" />
                    <p className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wide">Validation Errors ({importRecordErrors.length})</p>
                  </div>
                  {importRecordErrors.map((err, i) => (
                    <p key={i} className="text-[11px] text-rose-600 dark:text-rose-400 font-medium pl-5">{err}</p>
                  ))}
                </div>
              )}

              {importRecordSuccess !== null && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span>Successfully imported {importRecordSuccess} patient record{importRecordSuccess !== 1 ? 's' : ''}!</span>
                </div>
              )}

              {importRecordRows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                      Preview — First {Math.min(importRecordRows.length, 5)} of {importRecordRows.length} Patient{importRecordRows.length > 1 ? 's' : ''}
                    </p>
                    <span className="text-[10px] font-bold text-gov-blue-600 dark:text-gov-blue-400 bg-gov-blue-50 dark:bg-gov-blue-950/40 px-2 py-0.5 rounded-md">
                      {importRecordRows.length} Valid Row{importRecordRows.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 sticky top-0">
                          {['Patient Name', 'Age', 'Blood', 'Allergies', 'Conditions', 'Status'].map(col => (
                            <th key={col} className="px-3 py-2 text-left font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importRecordRows.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{row.resident_name}</td>
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{row.age}</td>
                            <td className="px-3 py-2 font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">{row.blood_type}</td>
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{row.allergies}</td>
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap max-w-[140px] truncate">{row.conditions}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                row.status === 'Healthy'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                              }`}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowImportRecordModal(false);
                  setImportRecordFile(null);
                  setImportRecordRows([]);
                  setImportRecordErrors([]);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteImportRecord}
                disabled={isImportingRecord || importRecordRows.length === 0}
                className="flex items-center gap-2 px-5 py-2 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isImportingRecord ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Upload size={13} />
                    <span>Import {importRecordRows.length > 0 ? `${importRecordRows.length} Records` : 'Records'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HealthRecords;

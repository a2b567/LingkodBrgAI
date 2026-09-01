import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, Plus, Check, X, Search, ArrowDownToLine, Signature, MonitorSmartphone,
  Activity, Clock, CheckCircle2, XCircle, CreditCard, Sparkles, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import type { Certificate, Resident } from '../types';
import { useAuthStore } from '../store/authStore';

export const Certificates: React.FC = () => {
  const { user } = useAuthStore();
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form states
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [certType, setCertType] = useState('Clearance');
  const [purpose, setPurpose] = useState('');
  const [fee, setFee] = useState(150);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const isStaff = user && user.role !== 'Resident';

  const fetchCerts = async () => {
    setIsLoading(true);
    try {
      const data = await api.certificates.list({
        status: statusFilter || undefined,
      });
      setCerts(data);
    } catch (err) {
      console.error("Failed fetching certificates", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResidents = async () => {
    if (isStaff) {
      try {
        const res = await api.residents.list({ limit: 100 });
        setResidents(res.data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    fetchCerts();
    fetchResidents();
  }, [statusFilter]);

  // Adjust fee based on type
  useEffect(() => {
    switch (certType) {
      case 'Clearance':
        setFee(150);
        break;
      case 'Indigency':
        setFee(0);
        break;
      case 'Residency':
        setFee(100);
        break;
      case 'Business':
        setFee(300);
        break;
      case 'Cedula':
        setFee(50);
        break;
      case 'Barangay ID':
        setFee(100);
        break;
      default:
        setFee(100);
    }
  }, [certType]);

  // Handle signature drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000080'; // Navy ink

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const residentId = isStaff ? selectedResidentId : user?.resident_id;
      if (!residentId) {
        alert("No resident profile associated with this account. Please contact the administrator.");
        setIsSubmitting(false);
        return;
      }

      await api.certificates.request({
        resident_id: residentId,
        type: certType,
        purpose,
        fee
      });

      setIsModalOpen(false);
      setPurpose('');
      fetchCerts();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (window.confirm("Are you sure you want to approve this certificate? This will generate the printable PDF document.")) {
      try {
        await api.certificates.approve(id);
        fetchCerts();
      } catch (err: any) {
        alert(err.response?.data?.error || "Approval failed");
      }
    }
  };

  const handleReject = async (id: string) => {
    if (window.confirm("Are you sure you want to reject this certificate request?")) {
      try {
        await api.certificates.reject(id);
        fetchCerts();
      } catch (err: any) {
        alert(err.response?.data?.error || "Rejection failed");
      }
    }
  };

  const userCerts = isStaff 
    ? certs 
    : certs.filter(c => c.resident_id === user?.resident_id || (c.resident && `${c.resident.first_name} ${c.resident.last_name}`.toLowerCase().includes(user?.username.toLowerCase() || '')));

  const filteredCerts = userCerts.filter(c => {
    const residentName = c.resident ? `${c.resident.first_name} ${c.resident.last_name}`.toLowerCase() : '';
    const docNo = c.document_number.toLowerCase();
    const q = search.toLowerCase();
    return residentName.includes(q) || docNo.includes(q) || c.type.toLowerCase().includes(q);
  });

  // Calculate Overview Stats
  const totalRequests = userCerts.length;
  const pendingCount = userCerts.filter(c => c.status === 'Pending').length;
  const issuedCount = userCerts.filter(c => c.status === 'Issued').length;
  const rejectedCount = userCerts.filter(c => c.status === 'Rejected').length;
  const totalRevenue = userCerts.filter(c => c.status === 'Issued').reduce((sum, c) => sum + (c.fee || 0), 0);

  // Document Summary by type
  const docTypes = [
    { type: "Clearance", name: "Barangay Clearance", price: 150, color: "border-l-gov-blue-500", desc: "For employment, local licensing, background check verification." },
    { type: "Indigency", name: "Certificate of Indigency", price: 0, color: "border-l-emerald-500", desc: "For medical assistance, scholarships, social welfare requests." },
    { type: "Residency", name: "Certificate of Residency", price: 100, color: "border-l-gov-gold-500", desc: "Proof of residence verification, bank accounts setup." },
    { type: "Business", name: "Business Clearance", price: 300, color: "border-l-indigo-500", desc: "Required for municipal business permit operation." },
    { type: "Cedula", name: "Cedula (CTC)", price: 50, color: "border-l-rose-500", desc: "Official proof of community identity and taxes paid." },
    { type: "Barangay ID", name: "Barangay ID Card", price: 100, color: "border-l-teal-500", desc: "Official barangay identification card." }
  ];

  return (
    <div className="space-y-6 relative z-10">
      
      {/* 1. Top Header Navigation Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white/80 dark:bg-slate-900/80 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm glass-panel">
        <div className="flex items-center gap-2">
          <Link
            to="/certificates"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-gov-blue-600 to-gov-blue-800 text-white shadow-md shadow-gov-blue-600/20"
          >
            <FileText size={15} />
            DOCUMENT ISSUANCE & APPROVALS
          </Link>
          <Link
            to="/queue-schedule"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Clock size={15} />
            Certificates Pickup & Queue Schedule
          </Link>
        </div>
      </div>

      {/* 2. Header Title & Main CTA Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-gov-blue-500/10 text-gov-blue-600 dark:text-gov-blue-400 rounded-xl">
              <Sparkles size={18} />
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white tracking-tight uppercase">
              Certificate Registry & Clearances
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
            Official barangay document issuing, digital signatures, and e-clearance verification
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isStaff && (
            <Link
              to="/kiosk/certificates"
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <MonitorSmartphone size={16} />
              Open Kiosk Mode
            </Link>
          )}
          <button
            onClick={() => {
              setIsModalOpen(true);
              setTimeout(() => {
                if (canvasRef.current) {
                  canvasRef.current.width = canvasRef.current.offsetWidth;
                  canvasRef.current.height = 120;
                }
              }, 100);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gov-blue-600 to-gov-blue-800 hover:from-gov-blue-700 hover:to-gov-blue-900 text-white rounded-2xl font-bold text-xs shadow-md shadow-gov-blue-600/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            Request Certificate
          </button>
        </div>
      </div>

      {/* 3. Overview Stat Cards (Responsive Grid) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isStaff ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
        {/* Total Requests */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">MY REQUESTS</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalRequests}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gov-blue-50 dark:bg-gov-blue-950/80 text-gov-blue-600 dark:text-gov-blue-400 flex items-center justify-center border border-gov-blue-200/60 dark:border-gov-blue-800/60">
            <Activity size={22} />
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">PENDING</span>
            <span className="text-2xl font-black text-amber-500 dark:text-amber-400">{pendingCount}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/60">
            <Clock size={22} />
          </div>
        </div>

        {/* Issued */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">ISSUED</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{issuedCount}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60">
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">REJECTED</span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{rejectedCount}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/60 dark:border-rose-800/60">
            <XCircle size={22} />
          </div>
        </div>

        {/* Total Revenue (Officers / Staff Only) */}
        {isStaff && (
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">TOTAL REVENUE</span>
              <span className="text-2xl font-black text-gov-gold-600 dark:text-gov-gold-400">₱{totalRevenue.toFixed(2)}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gov-gold-50 dark:bg-gov-gold-950/80 text-gov-gold-600 dark:text-gov-gold-400 flex items-center justify-center border border-gov-gold-200/60 dark:border-gov-gold-800/60">
              <CreditCard size={22} />
            </div>
          </div>
        )}
      </div>

      {/* 4. Document Volume & Revenue Breakdown (Officers / Staff Only) */}
      {isStaff && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
            <FileText size={15} className="text-gov-blue-500" />
            Issuance Breakdown By Document Type
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {docTypes.map((item, idx) => {
              const typeCount = certs.filter(c => c.type.toLowerCase().includes(item.type.toLowerCase())).length;
              const typeRev = certs.filter(c => c.type.toLowerCase().includes(item.type.toLowerCase()) && c.status === 'Issued').reduce((s, c) => s + (c.fee || 0), 0);

              return (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between space-y-2" title={item.name}>
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate block">{item.name}</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-black text-slate-900 dark:text-white">{typeCount} <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">docs</span></span>
                    <span className="text-[11px] font-bold text-gov-blue-600 dark:text-gov-blue-400">₱{typeRev.toFixed(0)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Document Catalog (Responsive 3-Column Grid) */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
          <Sparkles size={15} className="text-gov-gold-500" />
          Official Document Catalog
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docTypes.map((item, idx) => (
            <div key={idx} className={`bg-white dark:bg-slate-900 p-5 rounded-3xl border-l-4 ${item.color} border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">LINGKODBRGAI DOCUMENT</span>
                  <span className="text-xs font-black text-gov-blue-600 dark:text-gov-gold-400 bg-gov-blue-50 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-gov-blue-200/60 dark:border-slate-700">
                    {item.price > 0 ? `₱${item.price.toFixed(2)}` : 'Free'}
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-gov-blue-600 dark:group-hover:text-gov-blue-400 transition-colors">
                  {item.name}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Verifiable QR Code included</span>
                <button
                  onClick={() => {
                    setCertType(item.type);
                    setIsModalOpen(true);
                  }}
                  className="text-[11px] font-extrabold text-gov-blue-600 dark:text-gov-blue-400 hover:underline bg-transparent border-0 p-0 cursor-pointer"
                >
                  Request Now &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Main Certificates Table & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
        
        {/* Table Header Filter Bar */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search records by name/doc #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto flex-wrap">
            {[
              { label: 'ALL STATUS', value: '' },
              { label: 'PENDING', value: 'Pending' },
              { label: 'ISSUED', value: 'Issued' },
              { label: 'REJECTED', value: 'Rejected' },
            ].map((st) => (
              <button
                key={st.label}
                onClick={() => setStatusFilter(st.value)}
                className={`px-3.5 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border transition-all cursor-pointer ${
                  statusFilter === st.value 
                    ? 'bg-gov-blue-600 border-gov-blue-600 text-white shadow-sm' 
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
              Loading certificate logs...
            </div>
          ) : filteredCerts.length === 0 ? (
            <div className="p-12 text-center space-y-2 text-slate-500 dark:text-slate-400">
              <AlertCircle size={28} className="mx-auto text-slate-400" />
              <p className="text-xs font-bold">No certificate requests found matching criteria.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider">
                  <th className="p-4">Document #</th>
                  <th className="p-4">Resident</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Purpose</th>
                  <th className="p-4">Fee</th>
                  <th className="p-4">Requested On</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {filteredCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-[11px] text-gov-blue-700 dark:text-gov-blue-400">
                      {cert.document_number}
                    </td>
                    <td className="p-4">
                      {cert.resident ? (
                        <div className="font-bold text-slate-900 dark:text-white">{cert.resident.first_name} {cert.resident.last_name}</div>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Unknown Resident</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="font-extrabold text-slate-900 dark:text-slate-200">{cert.type}</span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 truncate max-w-[180px] font-medium">{cert.purpose}</td>
                    <td className="p-4 font-extrabold text-slate-900 dark:text-slate-200">
                      {cert.fee > 0 ? `₱${cert.fee.toFixed(2)}` : <span className="text-emerald-600 dark:text-emerald-400 font-bold">Free</span>}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">
                      {new Date(cert.request_date).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        cert.status === 'Issued'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                          : cert.status === 'Pending'
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                      }`}>
                        {cert.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {cert.pdf_path && cert.status === 'Issued' && (
                          <a
                            href={`http://localhost:8080${cert.pdf_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors flex items-center gap-1 text-[10px] font-bold"
                          >
                            <ArrowDownToLine size={13} />
                            Print PDF
                          </a>
                        )}
                        {isStaff && cert.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(cert.id)}
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl transition-colors cursor-pointer"
                              title="Approve & Generate PDF"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleReject(cert.id)}
                              className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl transition-colors cursor-pointer"
                              title="Reject Request"
                            >
                              <X size={14} />
                            </button>
                          </>
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

      {/* 7. Modal - Request Clearance Wizard */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <FileText className="text-gov-blue-600 dark:text-gov-blue-400" size={18} />
                Certificate Request Wizard
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isStaff && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1">Select Resident</label>
                  <select
                    value={selectedResidentId}
                    onChange={(e) => setSelectedResidentId(e.target.value)}
                    required
                    title="Select Resident"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose Resident --</option>
                    {residents.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.first_name} {r.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1">Certificate Type</label>
                <select
                  value={certType}
                  onChange={(e) => setCertType(e.target.value)}
                  title="Certificate Type"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white"
                >
                  <option value="Clearance">Barangay Clearance</option>
                  <option value="Indigency">Certificate of Indigency</option>
                  <option value="Residency">Certificate of Residency</option>
                  <option value="Business">Business Permit Clearance</option>
                  <option value="Cedula">Cedula (CTC)</option>
                  <option value="Barangay ID">Barangay ID</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1">Purpose / Reason</label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                  placeholder="Employment, Scholarship application, medical support, business registry, etc."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Signature Canvas */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <Signature size={12} className="text-gov-blue-600 dark:text-gov-blue-400" />
                    e-Signature Pad (Required)
                  </label>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[9px] font-bold text-rose-500 hover:underline uppercase"
                  >
                    Clear Canvas
                  </button>
                </div>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="cursor-crosshair w-full block bg-white"
                  />
                </div>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1">Draw inside the white box to sign. Signature is securely appended to final PDF certificate.</p>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Fee Assessment</span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {fee > 0 ? `₱${fee.toFixed(2)}` : 'Free'}
                  </span>
                </div>
                <div className="flex gap-2">
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
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Certificates;

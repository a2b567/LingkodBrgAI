import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, Plus, Check, X, Search, ArrowDownToLine, Signature, MonitorSmartphone,
  Activity, Clock, CheckCircle2, XCircle, CreditCard, Sparkles, AlertCircle,
  Edit3, Trash2, FolderPlus, UserCheck
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

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [editDocNo, setEditDocNo] = useState('');
  const [editResidentId, setEditResidentId] = useState('');
  const [editType, setEditType] = useState('');
  const [editPurpose, setEditPurpose] = useState('');
  const [editFee, setEditFee] = useState<number>(0);
  const [editStatus, setEditStatus] = useState('Pending');
  const [editPaymentStatus, setEditPaymentStatus] = useState('Unpaid');

  // Print ID Card Modal State
  const [isIDModalOpen, setIsIDModalOpen] = useState(false);
  const [idCertToPrint, setIdCertToPrint] = useState<Certificate | null>(null);

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

  const fetchCerts = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await api.certificates.list({
        status: statusFilter || undefined,
      });
      setCerts(data);
    } catch (err) {
      console.error("Failed fetching certificates", err);
    } finally {
      if (!silent) setIsLoading(false);
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
    fetchCerts(false); // initial — show spinner
    fetchResidents();
    const interval = setInterval(() => fetchCerts(true), 10000); // silent poll every 10s
    return () => clearInterval(interval);
  }, [statusFilter]);

  // Adjust fee based on type — reads from Settings-stored localStorage
  useEffect(() => {
    const defaultFees: Record<string, number> = { Clearance: 150, Indigency: 0, Residency: 100, Business: 300, Cedula: 50, 'Barangay ID': 100 };
    let fees = defaultFees;
    try { const s = localStorage.getItem('cert_fees'); if (s) fees = { ...defaultFees, ...JSON.parse(s) }; } catch {}
    setFee(fees[certType] ?? 100);
  }, [certType]);

  const handleSeedSamples = async () => {
    try {
      await api.certificates.seedSamples();
      fetchCerts();
      alert("Sample certificates successfully added!");
    } catch (err) {
      alert("Failed adding sample certificates");
    }
  };

  const handleOpenEditModal = (cert: Certificate) => {
    setEditingCert(cert);
    setEditDocNo(cert.document_number);
    setEditResidentId(cert.resident_id || '');
    setEditType(cert.type);
    setEditPurpose(cert.purpose);
    setEditFee(cert.fee || 0);
    setEditStatus(cert.status);
    setEditPaymentStatus(cert.payment_status || 'Unpaid');
    setIsEditModalOpen(true);
  };

  const handleUpdateCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCert) return;
    setIsSubmitting(true);
    try {
      await api.certificates.update(editingCert.id, {
        document_number: editDocNo,
        resident_id: editResidentId || undefined,
        type: editType,
        purpose: editPurpose,
        fee: editFee,
        status: editStatus,
        payment_status: editPaymentStatus,
      });
      setIsEditModalOpen(false);
      setEditingCert(null);
      fetchCerts();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update certificate");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this certificate record?")) {
      try {
        await api.certificates.delete(id);
        fetchCerts();
      } catch (err: any) {
        alert(err.response?.data?.error || "Failed to delete certificate");
      }
    }
  };


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

    // Capture signature from canvas
    let signatureData: string | undefined;
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      // Check if canvas has any drawn content (not blank)
      const pixelBuffer = ctx?.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height).data;
      const hasSignature = pixelBuffer ? Array.from(pixelBuffer).some(v => v !== 0) : false;
      if (hasSignature) {
        signatureData = canvasRef.current.toDataURL('image/png');
      }
    }

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
        fee,
        ...(signatureData ? { signature: signatureData } : {})
      });

      setIsModalOpen(false);
      setPurpose('');
      clearCanvas();
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

  // Certificate fees — read from Settings localStorage, fallback to defaults
  const defaultCertFees: Record<string,number> = { Clearance: 150, Indigency: 0, Residency: 100, Business: 300, Cedula: 50, 'Barangay ID': 100 };
  const certFees: Record<string,number> = (() => {
    try { const s = localStorage.getItem('cert_fees'); return s ? { ...defaultCertFees, ...JSON.parse(s) } : defaultCertFees; } catch { return defaultCertFees; }
  })();

  // Document Summary by type
  const docTypes = [
    { type: "Clearance",   name: "Barangay Clearance",       price: certFees['Clearance'],   color: "border-l-gov-blue-500", desc: "For employment, local licensing, background check verification." },
    { type: "Indigency",   name: "Certificate of Indigency", price: certFees['Indigency'],   color: "border-l-emerald-500",  desc: "For medical assistance, scholarships, social welfare requests." },
    { type: "Residency",   name: "Certificate of Residency", price: certFees['Residency'],   color: "border-l-gov-gold-500", desc: "Proof of residence verification, bank accounts setup." },
    { type: "Business",    name: "Business Clearance",       price: certFees['Business'],    color: "border-l-indigo-500",   desc: "Required for municipal business permit operation." },
    { type: "Cedula",      name: "Cedula (CTC)",             price: certFees['Cedula'],      color: "border-l-rose-500",     desc: "Official proof of community identity and taxes paid." },
    { type: "Barangay ID", name: "Barangay ID Card",         price: certFees['Barangay ID'], color: "border-l-teal-500",     desc: "Official barangay identification card." }
  ];

  return (
    <div className="space-y-6 relative z-10">
      
      {/* 1. Top Header Navigation Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white/80 dark:bg-slate-900/80 p-2 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm glass-panel w-max">
        <div className="flex items-center gap-1">
          <Link
            to="/certificates"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black bg-gradient-to-r from-gov-blue-600 to-gov-blue-800 text-white shadow-md shadow-gov-blue-600/20"
          >
            <FileText size={15} />
            <span className="underline decoration-1 underline-offset-2">DOCUMENT ISSUANCE & APPROVALS</span>
          </Link>
          <Link
            to="/queue-schedule"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Clock size={15} />
            <span className="underline decoration-1 underline-offset-2">Certificates Pickup & Queue Schedule</span>
          </Link>
        </div>
      </div>

      {/* 2. Header Title & Main CTA Bar */}
      <div className="relative bg-gradient-to-br from-slate-900 via-gov-blue-950 to-slate-950 rounded-3xl border border-slate-700/50 shadow-2xl">
        {/* Decorative glows — clipped in their own layer */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-gov-blue-600/25 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 left-1/3 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.08),_transparent_60%)]" />
        </div>

        <div className="relative p-7 sm:p-9">
          {/* Top row: icon + title + subtitle + badge */}
          <div className="flex items-start gap-5 mb-6">
            <div className="flex-shrink-0 w-14 h-14 bg-gov-blue-500/20 border border-gov-blue-400/30 rounded-2xl flex items-center justify-center text-gov-blue-300 shadow-inner">
              <Sparkles size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black font-display text-white tracking-tight uppercase leading-tight">
                  Certificate Registry &amp; Clearances
                </h2>
                <span className="px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 text-[9px] font-black uppercase tracking-widest flex-shrink-0">
                  🏛 Official
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
                Official barangay document issuing, digital signatures, and e-clearance verification
              </p>
            </div>
          </div>

          {/* Bottom row: full-width adaptive buttons */}
          <div className="flex items-center gap-3 pt-5 border-t border-slate-700/60">
            {isStaff && (
              <>
                <button
                  onClick={handleSeedSamples}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-xs tracking-wide shadow-lg shadow-amber-500/30 border border-amber-300/20 transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <FolderPlus size={14} />
                  Add Samples
                </button>
                <Link
                  to="/kiosk/certificates"
                  className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-xs tracking-wide shadow-lg shadow-emerald-500/30 border border-emerald-300/20 transition-all duration-200 hover:scale-[1.02] active:scale-95"
                >
                  <MonitorSmartphone size={14} />
                  Kiosk Mode
                </Link>
              </>
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
              className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-full bg-gradient-to-r from-gov-blue-500 to-indigo-600 hover:from-gov-blue-400 hover:to-indigo-500 text-white font-extrabold text-xs tracking-wide shadow-lg shadow-gov-blue-600/40 border border-gov-blue-300/20 transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <Plus size={14} />
              Request Certificate
            </button>
          </div>
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
                  <span className="text-[9px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">LingkodBrgyAi DOCUMENT</span>
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
                        {cert.type === 'Barangay ID' && (
                          <button
                            onClick={() => {
                              setIdCertToPrint(cert);
                              setIsIDModalOpen(true);
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                            title="Print Barangay ID Card"
                          >
                            <CreditCard size={13} />
                            Print ID Card
                          </button>
                        )}
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
                        {isStaff && (
                          <>
                            {cert.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(cert.id)}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl transition-colors cursor-pointer"
                                  title="Approve & Generate PDF"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={() => handleReject(cert.id)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl transition-colors cursor-pointer"
                                  title="Reject Request"
                                >
                                  <X size={14} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleOpenEditModal(cert)}
                              className="p-1.5 bg-gov-blue-50 hover:bg-gov-blue-100 dark:bg-gov-blue-950/40 text-gov-blue-600 dark:text-gov-blue-400 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                              title="Edit Certificate Details"
                            >
                              <Edit3 size={13} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(cert.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 size={13} />
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
                <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1">Draw your signature above. It will be <strong className="text-gov-blue-500">automatically embedded</strong> into the final PDF certificate when approved.</p>
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
                    onClick={() => { setIsModalOpen(false); clearCanvas(); }}
                    className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs transition-all hover:scale-[1.02] active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-full bg-gradient-to-r from-gov-blue-600 to-indigo-700 hover:from-gov-blue-700 hover:to-indigo-800 text-white font-extrabold text-xs transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-md shadow-gov-blue-600/25"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Modal - Edit Certificate Details */}
      {isEditModalOpen && editingCert && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <Edit3 className="text-gov-blue-600 dark:text-gov-blue-400" size={18} />
                Edit Certificate Record
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateCert} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1">Document Number</label>
                <input
                  type="text"
                  value={editDocNo}
                  onChange={(e) => setEditDocNo(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              {residents.length > 0 && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1">Resident</label>
                  <select
                    value={editResidentId}
                    onChange={(e) => setEditResidentId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Keep Current Resident --</option>
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
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
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
                  value={editPurpose}
                  onChange={(e) => setEditPurpose(e.target.value)}
                  required
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1">Fee (₱)</label>
                  <input
                    type="number"
                    value={editFee}
                    onChange={(e) => setEditFee(parseFloat(e.target.value) || 0)}
                    step="0.01"
                    min="0"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Issued">Issued</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1">Payment Status</label>
                <select
                  value={editPaymentStatus}
                  onChange={(e) => setEditPaymentStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white"
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs transition-all hover:scale-[1.02] active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-gov-blue-600 to-indigo-700 hover:from-gov-blue-700 hover:to-indigo-800 text-white font-extrabold text-xs transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-md shadow-gov-blue-600/25"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Modal - Printable Barangay Resident ID Card */}
      {isIDModalOpen && idCertToPrint && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full shadow-2xl p-6 sm:p-8 text-white relative animate-scale-up space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-rose-500 to-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <CreditCard size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider text-white">OFFICIAL BARANGAY RESIDENT ID</h3>
                  <p className="text-xs text-slate-400 font-medium">Standard CR80 ISO Security ID • Barangay Lawrence, Laguna</p>
                </div>
              </div>
              <button 
                onClick={() => setIsIDModalOpen(false)} 
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Print Instruction Alert */}
            <div className="bg-gov-blue-950/40 border border-gov-blue-800/40 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-gov-blue-200">
              <Sparkles size={18} className="text-gov-gold-400 shrink-0" />
              <span>
                <strong>Ready for Lamination:</strong> Click <strong>"Print ID Card"</strong> to print directly onto standard CR80 photo card paper (Front & Back aligned on 1 sheet).
              </span>
            </div>

            {/* ID Card Front & Back Container (PRINTABLE CONTAINER) */}
            <div id="printable-id-card-sheet" className="flex flex-col items-center justify-center gap-6 my-2">
              
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 overflow-x-auto w-full py-2">
                
                {/* ========== FRONT SIDE ========== */}
                <div className="w-[360px] h-[228px] shrink-0 bg-gradient-to-br from-gov-blue-950 via-slate-900 to-indigo-950 border-2 border-gov-gold-500/80 rounded-2xl p-4 shadow-2xl relative overflow-hidden text-slate-100 flex flex-col justify-between">
                  
                  {/* Security Guilloché Background Accent */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#eab308_1px,transparent_1px)] [background-size:12px_12px]"></div>
                  <div className="absolute top-[-20px] right-[-20px] w-36 h-36 bg-gov-gold-500/10 rounded-full blur-2xl pointer-events-none"></div>

                  {/* Top Letterhead */}
                  <div className="flex items-center justify-between border-b border-gov-gold-500/40 pb-2 relative z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-gradient-to-tr from-gov-blue-600 to-gov-gold-500 rounded-xl flex items-center justify-center border border-white/40 font-black text-xs text-white shrink-0 shadow-md">
                        🏛️
                      </div>
                      <div className="leading-none">
                        <span className="text-[7.5px] font-extrabold uppercase tracking-widest text-gov-gold-400 block">REPUBLIC OF THE PHILIPPINES</span>
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-white mt-0.5">BARANGAY LAWRENCE • LAGUNA</h4>
                        <span className="text-[6.5px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">RESIDENT IDENTIFICATION CARD</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest bg-gov-gold-500/20 text-gov-gold-400 border border-gov-gold-500/50 shrink-0">
                      OFFICIAL
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="flex gap-3.5 items-start flex-1 mt-2.5 relative z-10">
                    {/* Photo & Verified Badge */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-[80px] h-[86px] bg-slate-800 border-2 border-gov-gold-400/90 rounded-xl overflow-hidden shadow-md flex items-center justify-center relative">
                        {idCertToPrint.resident?.profile_photo || idCertToPrint.resident?.photo_url ? (
                          <img src={idCertToPrint.resident?.profile_photo || idCertToPrint.resident?.photo_url} alt="Resident" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 p-2">
                            <UserCheck size={36} className="text-gov-gold-400" />
                            <span className="text-[7px] font-extrabold mt-1 text-slate-300">VERIFIED</span>
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-gov-blue-900/95 text-center py-0.5 text-[6.5px] font-black text-gov-gold-300 tracking-wider">
                          {idCertToPrint.resident?.qr_id || 'RES-2026'}
                        </div>
                      </div>
                    </div>

                    {/* Resident Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div>
                        <span className="text-[6.5px] font-extrabold text-gov-gold-400 uppercase tracking-widest block leading-none">FULL NAME</span>
                        <h3 className="text-[13px] font-black text-white uppercase tracking-tight leading-tight truncate">
                          {idCertToPrint.resident ? `${idCertToPrint.resident.first_name} ${idCertToPrint.resident.middle_name ? idCertToPrint.resident.middle_name[0] + '.' : ''} ${idCertToPrint.resident.last_name}` : 'Resident User'}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[8.5px] pt-0.5">
                        <div>
                          <span className="text-[6.5px] font-bold text-slate-400 uppercase block leading-none">CIVIL STATUS</span>
                          <span className="font-extrabold text-slate-200">{idCertToPrint.resident?.gender || 'Male'} • {idCertToPrint.resident?.civil_status || 'Single'}</span>
                        </div>
                        <div>
                          <span className="text-[6.5px] font-bold text-slate-400 uppercase block leading-none">VOTER STATUS</span>
                          <span className="font-extrabold text-emerald-400">{idCertToPrint.resident?.voter_status || 'Registered'}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[6.5px] font-bold text-slate-400 uppercase block leading-none">RESIDENTIAL ADDRESS</span>
                        <p className="text-[8px] font-bold text-slate-300 leading-tight line-clamp-2">
                          {idCertToPrint.resident?.address || 'Barangay Lawrence, Laguna, Philippines'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-1.5 flex items-center justify-between border-t border-gov-gold-500/30 relative z-10 text-[7.5px]">
                    <div>
                      <span className="text-[6px] font-bold text-slate-400 uppercase block leading-none">CONTROL NO.</span>
                      <span className="font-mono font-black text-gov-gold-400">{idCertToPrint.document_number}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[6px] font-bold text-slate-400 uppercase block leading-none">DATE ISSUED</span>
                      <span className="font-extrabold text-slate-200">
                        {idCertToPrint.issue_date ? new Date(idCertToPrint.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ========== BACK SIDE ========== */}
                <div className="w-[360px] h-[228px] shrink-0 bg-slate-950 border-2 border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden shadow-2xl text-slate-200">
                  
                  {/* Watermark */}
                  <div className="absolute top-2 left-2 opacity-5 pointer-events-none font-black text-6xl text-slate-500">
                    LAGUNA
                  </div>

                  {/* Header & Notice */}
                  <div className="space-y-1 text-left relative z-10">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="font-black text-gov-gold-400 uppercase text-[9px] tracking-wider">BARANGAY RESIDENT CREDENTIAL</span>
                      <span className="text-[7px] font-bold text-slate-500 uppercase">PHILIPPINES LGU</span>
                    </div>
                    <p className="text-[7px] text-slate-400 leading-tight pt-1">
                      This official identification card certifies that the bearer is a recognized resident of Barangay Lawrence, Laguna. If found, please return to the Barangay Hall or the nearest police station.
                    </p>
                  </div>

                  {/* Center Section: Info & QR Code */}
                  <div className="flex items-center justify-between gap-3 py-1 relative z-10">
                    <div className="flex-1 space-y-1.5 text-left">
                      <div>
                        <span className="text-[6.5px] uppercase font-bold text-slate-500 block">CARD PURPOSE</span>
                        <span className="text-[8.5px] font-extrabold text-slate-200 line-clamp-1">{idCertToPrint.purpose || 'Official Resident Identification'}</span>
                      </div>
                      <div>
                        <span className="text-[6.5px] uppercase font-bold text-slate-500 block">DIGITAL QR HASH</span>
                        <span className="text-[8px] font-mono text-gov-gold-400 font-bold">{idCertToPrint.qr_hash?.slice(0, 16)}</span>
                      </div>
                      <div>
                        <span className="text-[6.5px] uppercase font-bold text-slate-500 block">EMERGENCY HOTLINE</span>
                        <span className="text-[8px] font-extrabold text-rose-400">911 / (049) 501-BRGY</span>
                      </div>
                    </div>

                    {/* Live Cryptographic QR Code */}
                    <div className="w-[74px] h-[74px] bg-white p-1 rounded-xl flex items-center justify-center shrink-0 border border-slate-600 shadow-md">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/verify/document/${idCertToPrint.qr_hash}`)}`}
                        alt="Security QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Signatures Footer */}
                  <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-slate-800 text-center relative z-10">
                    <div>
                      <div className="h-4 border-b border-slate-600/80 mb-0.5 mx-2"></div>
                      <span className="text-[6px] font-extrabold text-slate-400 uppercase tracking-wider block">BEARER'S SIGNATURE</span>
                    </div>
                    <div>
                      <div className="h-4 border-b border-slate-600/80 mb-0.5 mx-2 font-serif italic text-[7px] text-gov-gold-400 flex items-center justify-center">
                        Hon. Barangay Captain
                      </div>
                      <span className="text-[6px] font-extrabold text-slate-400 uppercase tracking-wider block">PUNONG BARANGAY</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Cut & Lamination Indicator (Visible only when printed) */}
              <div className="hidden print:block text-center text-[8px] text-slate-500 font-bold tracking-widest uppercase border-t border-dashed border-slate-400 pt-2 mt-2 w-full">
                ✂️ CUT ALONG EDGES FOR STANDARD CR80 CARD LAMINATION • LINGKODBRGYAI OFFICIAL
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-800 gap-4">
              <span className="text-[11px] text-slate-400 font-medium">Standard CR80 Printable Format (85.6mm × 54mm)</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsIDModalOpen(false)}
                  className="px-6 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-extrabold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-gov-blue-600 to-indigo-700 hover:from-gov-blue-700 hover:to-indigo-800 text-white text-xs font-black shadow-lg shadow-gov-blue-600/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer border border-white/20"
                >
                  <ArrowDownToLine size={16} />
                  Print ID Card
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
export default Certificates;


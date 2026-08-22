import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, Plus, Check, X, Search, ArrowDownToLine, Signature, MonitorSmartphone,
  Activity, Clock, CheckCircle2, XCircle, CreditCard
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

  const filteredCerts = certs.filter(c => {
    const residentName = c.resident ? `${c.resident.first_name} ${c.resident.last_name}`.toLowerCase() : '';
    const docNo = c.document_number.toLowerCase();
    const q = search.toLowerCase();
    return residentName.includes(q) || docNo.includes(q) || c.type.toLowerCase().includes(q);
  });

  // Calculate Overview Stats
  const totalRequests = certs.length;
  const pendingCount = certs.filter(c => c.status === 'Pending').length;
  const issuedCount = certs.filter(c => c.status === 'Issued').length;
  const rejectedCount = certs.filter(c => c.status === 'Rejected').length;
  const totalRevenue = certs.filter(c => c.status === 'Issued').reduce((sum, c) => sum + (c.fee || 0), 0);

  // Document Summary by type
  const docTypes = [
    { type: "Clearance", name: "BARANGAY CLEARANCE", price: 150, color: "border-l-gov-blue-500", desc: "For employment, local licensing, background check verification." },
    { type: "Indigency", name: "INDIGENCY CERTIFICATE", price: 0, color: "border-l-emerald-500", desc: "For medical assistance, scholarships, social welfare requests." },
    { type: "Residency", name: "RESIDENCY CERTIFICATE", price: 100, color: "border-l-gov-gold-500", desc: "Proof of residence verification, bank accounts setup." },
    { type: "Business", name: "BUSINESS CLEARANCE", price: 300, color: "border-l-indigo-500", desc: "Required for municipal business permit operation." },
    { type: "Cedula", name: "CEDULA (CTC)", price: 50, color: "border-l-rose-500", desc: "Official proof of community identity and taxes paid." },
    { type: "Barangay ID", name: "BARANGAY ID", price: 100, color: "border-l-teal-500", desc: "Official barangay identification card." }
  ];

  return (
    <div className="space-y-6 relative z-10">
      {/* Top Header Tabs */}
      <div className="flex items-center justify-center sm:justify-start gap-2 bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-2xl w-max border border-slate-200/50 dark:border-slate-800">
        <Link
          to="/certificates"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-gov-blue-600 text-white shadow-md shadow-gov-blue-600/20 transition-all"
        >
          <FileText size={15} />
          DOCUMENT ISSUANCE & APPROVALS
        </Link>
        <Link
          to="/queue-schedule"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
        >
          <FileText size={15} />
          Certificates Pickup & Queue Schedule
        </Link>
      </div>

      {/* Header Title & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-normal text-black dark:text-white uppercase">
            CERTIFICATE REGISTRY & CLEARANCES
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold tracking-wide">
            Official barangay document issuing, digital signatures, and e-clearance verification
          </p>
        </div>
        <div className="flex gap-2.5">
          <Link
            to="/kiosk/certificates"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95"
          >
            <MonitorSmartphone size={16} />
            Open Kiosk Mode
          </Link>
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
            className="flex items-center gap-2 px-4 py-2.5 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-gov-blue-600/20 transition-all active:scale-95"
          >
            <Plus size={16} />
            Request Certificate
          </button>
        </div>
      </div>

      {/* Row 1: Top 5 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gov-blue-500/10 text-gov-blue-400 flex items-center justify-center flex-shrink-0">
            <Activity size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">TOTAL REQUESTS</span>
            <span className="text-xl font-black text-slate-800 dark:text-white">{totalRequests}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">PENDING</span>
            <span className="text-xl font-black text-amber-500">{pendingCount}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">ISSUED</span>
            <span className="text-xl font-black text-emerald-500">{issuedCount}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center flex-shrink-0">
            <XCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">REJECTED</span>
            <span className="text-xl font-black text-rose-500">{rejectedCount}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
            <CreditCard size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">TOTAL REVENUE</span>
            <span className="text-xl font-black text-slate-800 dark:text-white">₱{totalRevenue.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Row 2: Document Type Summary Cards (6 items) */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {docTypes.map((item, idx) => {
          const typeCount = certs.filter(c => c.type.toLowerCase().includes(item.type.toLowerCase())).length;
          const typeRev = certs.filter(c => c.type.toLowerCase().includes(item.type.toLowerCase()) && c.status === 'Issued').reduce((s, c) => s + (c.fee || 0), 0);

          return (
            <div key={idx} className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block truncate max-w-[110px]">{item.name}</span>
                <span className="text-lg font-black text-slate-800 dark:text-white mt-0.5 block">{typeCount}</span>
              </div>
              <span className="text-[10px] font-bold text-gov-blue-500 dark:text-gov-blue-400">₱{typeRev.toFixed(2)}</span>
            </div>
          );
        })}
      </div>

      {/* Row 3: Grid of 6 Available Documents (with Descriptions) */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {docTypes.map((item, idx) => (
          <div key={idx} className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border-l-4 ${item.color} border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex flex-col justify-between`}>
            <div>
              <span className="text-[9px] font-extrabold uppercase text-slate-500 dark:text-slate-400 block tracking-wider">LINGKODBRGAI DOCUMENT</span>
              <h4 className="font-bold text-xs mt-1 text-black dark:text-white">{item.name.replace(/\(.*?\)/g, '').trim()}</h4>
              <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-1 leading-normal">{item.desc}</p>
            </div>
            <span className="text-xs font-black text-slate-800 dark:text-gov-gold-300 mt-3 block">
              {item.price > 0 ? `₱${item.price.toFixed(2)}` : 'Free'}
            </span>
          </div>
        ))}
      </div>

      {/* Main Filter & Table Area */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-300" size={16} />
            <input
              type="text"
              placeholder="Search records by name/doc #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white placeholder:dark:text-slate-400"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto flex-wrap">
            {[
              { label: 'ALL STATUS', value: '' },
              { label: 'PENDING', value: 'Pending' },
              { label: 'ISSUED', value: 'Issued' },
              { label: 'COLLECTED', value: 'Collected' },
              { label: 'REJECTED', value: 'Rejected' },
            ].map((st) => (
              <button
                key={st.label}
                onClick={() => setStatusFilter(st.value)}
                className={`px-3.5 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border transition-all ${
                  statusFilter === st.value 
                    ? 'bg-gov-blue-600 border-gov-blue-600 text-white shadow-sm' 
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-10 text-center text-xs font-bold text-slate-500 dark:text-slate-300">Loading certificate logs...</div>
          ) : filteredCerts.length === 0 ? (
            <div className="p-10 text-center text-xs font-bold text-slate-600 dark:text-slate-300">No certificate requests found matching criteria.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/60 border-b border-slate-200/50 dark:border-slate-800/80 text-[10px] font-black uppercase text-slate-600 dark:text-slate-200 tracking-wider">
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
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-mono font-bold text-[11px] text-gov-blue-700 dark:text-gov-blue-300">
                      {cert.document_number}
                    </td>
                    <td className="p-4">
                      {cert.resident ? (
                        <div className="font-semibold">{cert.resident.first_name} {cert.resident.last_name}</div>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400">Unknown Resident</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="font-bold">{cert.type}</span>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-300 truncate max-w-[180px]">{cert.purpose}</td>
                    <td className="p-4 font-semibold">
                      {cert.fee > 0 ? `₱${cert.fee.toFixed(2)}` : <span className="text-emerald-500 font-bold">Free</span>}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-300 font-medium">
                      {new Date(cert.request_date).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                        cert.status === 'Issued'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : cert.status === 'Pending'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
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
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                          >
                            <ArrowDownToLine size={13} />
                            Print PDF
                          </a>
                        )}
                        {isStaff && cert.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(cert.id)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors"
                              title="Approve & Generate PDF"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleReject(cert.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-lg transition-colors"
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

      {/* Modal - Request Clearance Wizard */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl max-w-md w-full shadow-2xl p-6 glass-panel relative overflow-hidden animate-scale-up">
            <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-widest flex items-center gap-2 mb-4">
              <FileText className="text-gov-blue-500" size={18} />
              Certificate Request Wizard
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isStaff && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-200 block mb-1">Select Resident</label>
                  <select
                    value={selectedResidentId}
                    onChange={(e) => setSelectedResidentId(e.target.value)}
                    required
                    title="Select Resident"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white"
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
                <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-200 block mb-1">Certificate Type</label>
                <select
                  value={certType}
                  onChange={(e) => setCertType(e.target.value)}
                  title="Certificate Type"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white"
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
                <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-200 block mb-1">Purpose / Reason</label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                  placeholder="Employment, Scholarship application, medical support, business registry, etc."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-800 dark:text-white resize-none placeholder-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Signature Canvas */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-200 flex items-center gap-1">
                    <Signature size={12} className="text-gov-blue-500" />
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

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Fee Assessment</span>
                  <span className="font-extrabold text-sm text-slate-800 dark:text-white">
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

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, UserCheck, ArrowLeft, Stamp } from 'lucide-react';
import { api } from '../services/api';

export const VerifyDocument: React.FC = () => {
  const { hash } = useParams<{ hash: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    valid: boolean;
    message: string;
    document?: string;
    type?: string;
    recipient?: string;
    issued_on?: string;
    purpose?: string;
  } | null>(null);

  useEffect(() => {
    const runVerify = async () => {
      if (!hash) return;
      try {
        const res = await api.certificates.verifyQR(hash);
        setData(res);
      } catch (err: any) {
        setData({
          valid: false,
          message: err.response?.data?.message || "Verification failed. Network error or server offline."
        });
      } finally {
        setLoading(false);
      }
    };
    runVerify();
  }, [hash]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-black dark:text-slate-200">
        <div className="ambient-glow glow-blue top-1/4"></div>
        <div className="text-center space-y-3 z-10">
          <div className="w-12 h-12 border-4 border-gov-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Verifying Barangay Document authenticity...</p>
        </div>
      </div>
    );
  }

  const isValid = data?.valid;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-black dark:text-slate-200 relative overflow-hidden">
      
      {/* Background glow dynamics */}
      <div className="ambient-glow glow-blue top-10 left-10"></div>
      <div className="ambient-glow glow-gold bottom-10 right-10"></div>

      <div className="max-w-xl w-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 md:p-8 shadow-2xl glass-panel relative z-10 space-y-6">
        
        {/* Back Link */}
        <Link to="/login" className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 uppercase tracking-wider mb-2">
          <ArrowLeft size={12} />
          Back to Portal Login
        </Link>

        {/* Validation Status Header */}
        <div className="text-center space-y-2">
          {isValid ? (
            <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-2xl animate-bounce">
              <ShieldCheck size={40} />
            </div>
          ) : (
            <div className="inline-flex p-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl animate-pulse">
              <ShieldAlert size={40} />
            </div>
          )}
          <h2 className={`text-lg font-black uppercase tracking-widest ${isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {isValid ? 'VERIFIED AUTHENTIC' : 'VERIFICATION FAILED'}
          </h2>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold px-4">
            {data?.message}
          </p>
        </div>

        {/* Certificate metadata fields */}
        {isValid && (
          <div className="border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-6 bg-slate-50/50 dark:bg-slate-950/20 space-y-4 relative">
            
            {/* Watermark/stamp seal */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
              <Stamp size={200} />
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10 text-xs">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 block">Document Number</span>
                <span className="font-mono font-bold text-gov-blue-700 dark:text-gov-blue-300">{data?.document}</span>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 block">Document Type</span>
                <span className="font-bold text-black dark:text-slate-200">{data?.type}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 block">Issued To</span>
                <span className="font-extrabold text-sm flex items-center gap-1.5 mt-0.5 text-black dark:text-slate-200">
                  <UserCheck size={14} className="text-gov-blue-500" />
                  {data?.recipient}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 block">Purpose</span>
                <span className="text-slate-600 dark:text-slate-300 font-bold">{data?.purpose}</span>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 block">Issued On</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {data?.issued_on ? new Date(data.issued_on).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 block">Issuing Authority</span>
                <span className="font-bold text-slate-600 dark:text-slate-300">Barangay Lawrence Office</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Seal */}
        <div className="text-center text-[9px] text-slate-500 dark:text-slate-400 font-semibold leading-normal pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
          LingkodBrgAI — Barangay Lawrence (Laguna, PH) • Secure Ledger Checksum: <span className="font-mono">{hash?.slice(0, 8)}...</span>
        </div>

        <div className="text-center text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pt-4 border-t border-slate-200/50 dark:border-slate-800/50 mt-6">
          DEV: LAWREENE B ARANAS
        </div>
      </div>
    </div>
  );
};
export default VerifyDocument;

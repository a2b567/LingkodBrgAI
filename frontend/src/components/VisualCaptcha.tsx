import React, { useState } from 'react';
import { Check, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';

export interface RobotCaptchaProps {
  isVerified?: boolean;
  onVerify?: (verified: boolean) => void;
  // Compatibility props for seamless drop-in
  onCodeChange?: (code: string) => void;
  value?: string;
  onChange?: (val: string) => void;
  error?: boolean;
}

export const RobotCaptcha: React.FC<RobotCaptchaProps> = ({
  isVerified = false,
  onVerify,
  onChange,
  onCodeChange,
  error = false,
}) => {
  const [verified, setVerified] = useState(isVerified);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleCheckboxClick = () => {
    if (verified || isVerifying) return;

    setIsVerifying(true);

    // Realistic human verification delay (700ms)
    setTimeout(() => {
      setIsVerifying(false);
      setVerified(true);
      if (onVerify) onVerify(true);
      if (onChange) onChange('verified_human_token');
      if (onCodeChange) onCodeChange('verified_human_token');
    }, 700);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVerified(false);
    setIsVerifying(false);
    if (onVerify) onVerify(false);
    if (onChange) onChange('');
    if (onCodeChange) onCodeChange('');
  };

  return (
    <div className="w-full space-y-1.5 select-none">
      <div
        onClick={handleCheckboxClick}
        className={`w-full bg-white dark:bg-slate-900 border rounded-2xl p-3.5 sm:p-4 shadow-sm transition-all duration-200 flex items-center justify-between gap-3 ${
          error && !verified
            ? 'border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20 ring-2 ring-rose-500/20'
            : verified
            ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/20'
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer'
        }`}
      >
        {/* Left: Interactive Checkbox & Label */}
        <div className="flex items-center gap-3.5">
          <div
            className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
              verified
                ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/30 scale-105'
                : isVerifying
                ? 'border-gov-blue-500 bg-gov-blue-50 dark:bg-gov-blue-950/40'
                : error
                ? 'border-rose-400 dark:border-rose-600 bg-white dark:bg-slate-950'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 hover:border-gov-blue-500'
            }`}
          >
            {isVerifying ? (
              <div className="w-4 h-4 border-2 border-gov-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : verified ? (
              <Check size={18} className="stroke-[3] animate-in zoom-in-75 duration-200" />
            ) : null}
          </div>

          <div className="text-left">
            <span
              className={`text-xs sm:text-sm font-bold tracking-tight block ${
                verified
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-slate-800 dark:text-slate-100'
              }`}
            >
              {isVerifying
                ? 'Verifying identity...'
                : verified
                ? "I'm not a robot"
                : "I'm not a robot"}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block leading-none mt-0.5">
              {verified ? 'Security challenge passed' : 'Click checkbox to verify human'}
            </span>
          </div>
        </div>

        {/* Right: Security Branding & Verification Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-100 dark:border-slate-800/80 flex-shrink-0">
          {verified && (
            <button
              type="button"
              onClick={handleReset}
              title="Reset verification"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw size={13} />
            </button>
          )}

          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-7 h-7 rounded-lg bg-gov-blue-50 dark:bg-gov-blue-950/50 border border-gov-blue-100 dark:border-gov-blue-900/50 flex items-center justify-center text-gov-blue-600 dark:text-gov-blue-400">
              <ShieldCheck size={16} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">
              reCAPTCHA
            </span>
            <div className="text-[7px] text-slate-400 dark:text-slate-500 space-x-1 font-medium leading-none">
              <span>Privacy</span>
              <span>•</span>
              <span>Terms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error / Alert notice */}
      {error && !verified && (
        <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 pl-1 animate-in fade-in duration-200">
          <AlertCircle size={13} />
          Please check "I'm not a robot" before continuing.
        </p>
      )}
    </div>
  );
};

// Aliased export for compatibility with existing imports
export const VisualCaptcha = RobotCaptcha;
export default RobotCaptcha;
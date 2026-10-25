import React, { useState } from 'react';
import { ShieldCheck, X, CheckCircle2 } from 'lucide-react';
import { VisualCaptcha } from './VisualCaptcha';

interface CaptchaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (token: string) => void;
  title?: string;
  subtitle?: string;
}

export const CaptchaModal: React.FC<CaptchaModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  title = 'Kumpirmasyon sa Seguridad',
  subtitle = 'Paki-check ang box sa ibaba upang magpatuloy',
}) => {
  const [token, setToken] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCaptchaChange = (newToken: string) => {
    setToken(newToken);
    if (newToken && newToken.length > 5) {
      setIsSuccess(true);
      setTimeout(() => {
        onVerified(newToken);
        setIsSuccess(false);
        setToken('');
      }, 600);
    }
  };

  const handleClose = () => {
    setToken('');
    setIsSuccess(false);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-gov-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-gov-blue-600/20">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Isara"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body with Captcha */}
        <div className="p-6 space-y-4 text-center">
          {isSuccess ? (
            <div className="py-6 space-y-2 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl mx-auto flex items-center justify-center shadow-sm">
                <CheckCircle2 size={28} />
              </div>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                Na-verify nang matagumpay!
              </p>
              <p className="text-[10px] text-slate-400">
                Sandali lamang, pinoproseso na ang iyong kahilingan...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-center">
                <VisualCaptcha
                  value={token}
                  onChange={handleCaptchaChange}
                />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Proteksyon laban sa mga automated bot at spam.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

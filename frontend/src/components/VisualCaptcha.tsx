import React, { useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { AlertCircle } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Google reCAPTCHA v2 Site Key
// "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" is Google's official test key.
// It works on localhost for development (always passes, no "testing only" msg).
// Replace with your real key from: https://www.google.com/recaptcha/admin
// Set VITE_RECAPTCHA_SITE_KEY in your .env for production.
// ─────────────────────────────────────────────────────────────────────────────
const RECAPTCHA_SITE_KEY =
  import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

export interface RobotCaptchaProps {
  isVerified?: boolean;
  onVerify?: (verified: boolean) => void;
  onCodeChange?: (code: string) => void;
  value?: string;
  onChange?: (val: string) => void;
  error?: boolean;
  captchaRef?: React.RefObject<ReCAPTCHA>;
}

export const RobotCaptcha: React.FC<RobotCaptchaProps> = ({
  onChange,
  onCodeChange,
  onVerify,
  error = false,
  captchaRef: externalRef,
}) => {
  const internalRef = useRef<ReCAPTCHA>(null);
  const captchaRef = externalRef || internalRef;

  const handleChange = (token: string | null) => {
    const val = token ?? '';
    if (onChange) onChange(val);
    if (onCodeChange) onCodeChange(val);
    if (onVerify) onVerify(!!token);
  };

  const handleExpired = () => {
    if (onChange) onChange('');
    if (onCodeChange) onCodeChange('');
    if (onVerify) onVerify(false);
  };

  return (
    <div className="w-full space-y-1.5">
      <div
        className={`w-full flex items-center justify-center rounded-2xl border transition-all duration-200 overflow-hidden py-1 ${
          error
            ? 'border-rose-300 dark:border-rose-800 ring-2 ring-rose-500/20 bg-rose-50/30 dark:bg-rose-950/20'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
        }`}
      >
        <ReCAPTCHA
          ref={captchaRef}
          sitekey={RECAPTCHA_SITE_KEY}
          onChange={handleChange}
          onExpired={handleExpired}
          theme="light"
        />
      </div>

      {error && (
        <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 pl-1 animate-in fade-in duration-200">
          <AlertCircle size={13} />
          Please complete the CAPTCHA before continuing.
        </p>
      )}
    </div>
  );
};

// Aliased export for compatibility with existing imports in Login.tsx
export const VisualCaptcha = RobotCaptcha;
export default RobotCaptcha;
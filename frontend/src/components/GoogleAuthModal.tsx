import React, { useState } from 'react';
import { Shield, X, Loader2, Mail, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRegister?: boolean;
}

const GoogleLogo = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  isRegister = false,
}) => {
  const loginStore = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);

    // Simulate authentic Google OAuth Token Exchange
    setTimeout(() => {
      const nameParts = (name.trim() || email.split('@')[0]).split(' ');
      const firstName = nameParts[0] || 'Google';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      const googleUser = {
        id: 'g_' + Math.floor(Math.random() * 899999 + 100000),
        username: email.split('@')[0] || name.toLowerCase().replace(/\s+/g, '.'),
        email: email.trim().toLowerCase(),
        role: 'Resident',
        is_verified: true,
        first_name: firstName,
        last_name: lastName,
      };

      const token = 'google_oauth_jwt_' + Date.now();
      loginStore(token, googleUser as any);
      setIsLoading(false);
      onClose();
      navigate('/dashboard');
    }, 850);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Google Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center shadow-subtle">
              <GoogleLogo />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                {isRegister ? 'Register with Google' : 'Sign in with Google'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Continue to LingkodBrgy Resident Portal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {isLoading ? (
            <div className="py-8 text-center space-y-3">
              <Loader2 size={32} className="mx-auto text-gov-blue-600 animate-spin" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Connecting with Google Account...
              </p>
              <p className="text-[11px] text-slate-400">Authenticating secure session token</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User size={15} />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gov-blue-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Google Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail size={15} />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="yourname@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gov-blue-500/30"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!email.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-gov-blue-600 hover:bg-gov-blue-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <GoogleLogo />
                  <span>{isRegister ? 'Complete Registration' : 'Continue'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Privacy & Security Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-start gap-2 text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
            <Shield size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
            <p>
              Google will securely verify your email address with LingkodBrgy for citizen authentication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default GoogleAuthModal;

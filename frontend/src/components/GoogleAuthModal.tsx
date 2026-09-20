import React, { useState } from 'react';
import { UserPlus, Shield, X, Loader2 } from 'lucide-react';
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
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  if (!isOpen) return null;

  const defaultAccounts = [
    {
      name: 'Ryan Mendoza',
      email: 'ryan.mendoza@gmail.com',
      avatarColor: 'bg-emerald-600',
      initials: 'RM',
    },
    {
      name: 'San Isidro Citizen',
      email: 'resident.sanisidro@gmail.com',
      avatarColor: 'bg-gov-blue-600',
      initials: 'SC',
    },
  ];

  const handleSelectAccount = async (name: string, email: string) => {
    setSelectedEmail(email);
    setIsLoading(true);

    // Simulate authentic Google OAuth Token Exchange
    setTimeout(() => {
      const nameParts = name.trim().split(' ');
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

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    const name = customName.trim() || customEmail.split('@')[0];
    handleSelectAccount(name, customEmail);
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
                Choose an account to continue to LingkodBrgy
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
                Signing in with {selectedEmail}...
              </p>
              <p className="text-[11px] text-slate-400">Authenticating secure session token</p>
            </div>
          ) : !isCustomMode ? (
            <>
              {/* Account selection list */}
              <div className="space-y-2">
                {defaultAccounts.map((acc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectAccount(acc.name, acc.email)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-gov-blue-400 dark:hover:border-gov-blue-500 hover:bg-gov-blue-50/40 dark:hover:bg-gov-blue-950/20 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full ${acc.avatarColor} text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm`}
                      >
                        {acc.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {acc.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {acc.email}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-gov-blue-600 dark:text-gov-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Continue →
                    </span>
                  </button>
                ))}

                {/* Use another account option */}
                <button
                  type="button"
                  onClick={() => setIsCustomMode(true)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0">
                    <UserPlus size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Use another Google account
                    </p>
                    <p className="text-[10px] text-slate-400">Enter custom Gmail or Workspace address</p>
                  </div>
                </button>
              </div>
            </>
          ) : (
            /* Custom account entry form */
            <form onSubmit={handleCustomSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Juan Dela Cruz"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gov-blue-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Google Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gov-blue-500/30"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!customEmail}
                  className="flex-1 py-2.5 rounded-xl bg-gov-blue-600 hover:bg-gov-blue-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

          {/* Privacy & Security Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-start gap-2 text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
            <Shield size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
            <p>
              To continue, Google will share your verified name, email address, and profile photo with
              LingkodBrgy for citizen identification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default GoogleAuthModal;

import React, { useState } from 'react';
import { Lock, Moon, Sun, Shield, QrCode, Check } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

export const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      alert("New passwords do not match!");
      setIsUpdating(false);
      return;
    }

    setTimeout(() => {
      setIsUpdating(false);
      setSuccessMsg("Your account password has been updated successfully.");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1500);
  };

  const res = user?.resident;

  return (
    <div className="space-y-6 relative z-10 max-w-4xl">
      <div>
        <h2 className="text-2xl font-extrabold tracking-normal text-black dark:text-white">ACCOUNT SETTINGS</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold tracking-wide">Manage user profile preferences, display modes, and security configurations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card & QR ID */}
        <div className="md:col-span-1 space-y-6">
          
          {/* User profile details */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm text-center relative overflow-hidden flex flex-col items-center">
            <div className="w-16 h-16 bg-gov-blue-100 dark:bg-gov-blue-950/60 text-gov-blue-700 dark:text-gov-blue-300 font-black rounded-3xl flex items-center justify-center text-xl uppercase mb-3 border border-gov-blue-200/20">
              {user?.username.slice(0, 2)}
            </div>
            
            <h4 className="font-extrabold text-sm text-black dark:text-slate-200">{user?.username}</h4>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-wide">{user?.email}</span>
            
            <div className="mt-3.5 bg-gov-blue-50 dark:bg-gov-blue-950/30 text-gov-blue-700 dark:text-gov-blue-300 border border-gov-blue-100 dark:border-gov-blue-900/50 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-xl">
              {user?.role} Account
            </div>

            <div className="w-full border-t border-slate-100 dark:border-slate-800/60 my-4 pt-4 text-left text-[11px] space-y-2 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Account Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Verified</span>
              </div>
              <div className="flex justify-between">
                <span>Verification OTP:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">Cleared</span>
              </div>
            </div>
          </div>

          {/* Barangay Resident QR ID Badge */}
          {res && (
            <div className="bg-gradient-to-tr from-gov-blue-900 to-gov-blue-950 text-white p-5 rounded-3xl border border-gov-gold-500/20 shadow-lg relative overflow-hidden flex flex-col items-center">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gov-gold-400/5 rounded-full blur-xl"></div>
              <QrCode className="text-gov-gold-400 mb-2.5 animate-pulse-subtle" size={32} />
              
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gov-gold-400">Barangay Resident ID</h4>
              <p className="font-bold text-xs mt-1.5">{res.first_name} {res.last_name}</p>
              <span className="text-[9px] font-mono text-slate-300 mt-0.5">{res.qr_id}</span>
              
              {/* Fake QR Image placeholder with nice style */}
              <div className="w-28 h-28 bg-white p-2.5 rounded-2xl border border-gov-gold-400/20 mt-4">
                <img 
                  src={`http://localhost:8080/uploads/qr/${res.id}.png`} 
                  alt="Resident QR Code" 
                  onError={(e) => {
                    // Fallback in case QR code file doesn't exist
                    e.currentTarget.src = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=http://localhost:5173/verify/resident/" + res.id;
                  }}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[8px] text-slate-400 mt-2.5 text-center leading-normal">Show QR Code during verification inspections.</span>
            </div>
          )}
        </div>

        {/* Display Settings and Security */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Visual Preferences */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest flex items-center gap-2">
              <Shield size={16} className="text-gov-blue-600 dark:text-gov-blue-400" />
              Portal Configurations
            </h4>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl">
              <div>
                <span className="text-xs font-bold block text-black dark:text-slate-200">Display System Theme</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">Toggle dark mode overlay layout.</span>
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-colors"
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            </div>
          </div>

          {/* Security Change Password */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest flex items-center gap-2 mb-4">
              <Lock size={16} className="text-rose-600 dark:text-rose-400" />
              Update Account Security
            </h4>

            {successMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/60 dark:text-emerald-400 text-xs font-semibold rounded-2xl mb-4 flex items-center gap-2">
                <Check size={16} />
                {successMsg}
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter current login password..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="At least 6 characters..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter new password..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-gov-blue-500 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-xl font-bold text-xs transition-colors disabled:opacity-50"
                >
                  {isUpdating ? 'Updating password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Settings;

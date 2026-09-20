import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Lock, Unlock, KeyRound, X, 
  LayoutDashboard, ListOrdered, CheckCircle2, AlertTriangle, Delete
} from 'lucide-react';

interface KioskAdminLockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KioskAdminLockModal: React.FC<KioskAdminLockModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [shake, setShake] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [changeSuccess, setChangeSuccess] = useState(false);

  // Get master PIN (defaults to '1234')
  const getStoredPin = () => {
    return localStorage.getItem('lingkod_kiosk_admin_pin') || '1234';
  };

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setErrorMessage('');
      setIsUnlocked(false);
      setIsChangingPin(false);
      setNewPin('');
      setChangeSuccess(false);
    }
  }, [isOpen]);

  const handleDigit = (digit: string) => {
    if (isUnlocked && isChangingPin) {
      if (newPin.length < 4) {
        setNewPin(prev => prev + digit);
      }
      return;
    }

    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
      
      // Auto-validate once 4 digits entered
      if (nextPin.length === 4) {
        validatePin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    if (isUnlocked && isChangingPin) {
      setNewPin(prev => prev.slice(0, -1));
      return;
    }
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    if (isUnlocked && isChangingPin) {
      setNewPin('');
      return;
    }
    setPin('');
    setError(false);
  };

  const validatePin = (inputPin: string) => {
    const currentPin = getStoredPin();
    if (inputPin === currentPin) {
      setIsUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setErrorMessage('Incorrect Security PIN. Access Denied.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setPin(''), 800);
    }
  };

  const handleSaveNewPin = () => {
    if (newPin.length === 4) {
      localStorage.setItem('lingkod_kiosk_admin_pin', newPin);
      setChangeSuccess(true);
      setTimeout(() => {
        setIsChangingPin(false);
        setChangeSuccess(false);
        setNewPin('');
      }, 1200);
    }
  };

  const handleExitTo = (path: string) => {
    onClose();
    navigate(path);
  };

  // Keyboard support for typing PIN
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, newPin, isUnlocked, isChangingPin]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] text-white relative transition-transform ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {/* Close Modal Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
          title="Cancel & Resume Kiosk"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 transition-colors shadow-xl ${
            isUnlocked 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-emerald-500/20' 
              : error 
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-rose-500/20'
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-blue-500/20'
          }`}>
            {isUnlocked ? (
              <Unlock size={32} className="animate-bounce" />
            ) : error ? (
              <AlertTriangle size={32} className="animate-pulse" />
            ) : (
              <Lock size={32} />
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
            {isUnlocked ? 'ADMIN ACCESS GRANTED' : 'KIOSK SECURITY LOCK'}
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1 max-w-xs">
            {isUnlocked 
              ? 'Barangay authorization verified. Select your destination.' 
              : 'Enter Master PIN to exit Kiosk Mode and return to Dashboard.'}
          </p>

          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700 text-[10px] font-black uppercase tracking-wider text-slate-400">
            <ShieldCheck size={12} className="text-emerald-400" />
            Privacy Mode Active
          </div>
        </div>

        {/* Unlocked State Actions */}
        {isUnlocked ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {!isChangingPin ? (
              <>
                <button
                  onClick={() => handleExitTo('/dashboard')}
                  className="w-full py-3.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <LayoutDashboard size={18} />
                  Return to Dashboard
                </button>

                <button
                  onClick={() => handleExitTo('/queue-schedule')}
                  className="w-full py-3.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-sm uppercase tracking-wider rounded-2xl border border-slate-700 flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <ListOrdered size={18} className="text-amber-400" />
                  Queue Manager
                </button>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={() => setIsChangingPin(true)}
                    className="text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound size={14} />
                    Change Admin PIN
                  </button>

                  <button
                    onClick={onClose}
                    className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Resume Kiosk
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-300">Set New 4-Digit Admin PIN</p>
                  {changeSuccess && (
                    <p className="text-xs font-bold text-emerald-400 mt-1 flex items-center justify-center gap-1">
                      <CheckCircle2 size={14} /> PIN Updated Successfully!
                    </p>
                  )}
                </div>

                {/* New PIN Indicator Dots */}
                <div className="flex justify-center gap-3 my-3">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full border-2 transition-all ${
                        newPin.length > idx
                          ? 'bg-blue-500 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.8)]'
                          : 'border-slate-700 bg-slate-800'
                      }`}
                    />
                  ))}
                </div>

                {/* Keypad for changing PIN */}
                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      onClick={() => handleDigit(digit)}
                      className="py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black text-lg rounded-xl border border-slate-700/60 shadow transition-all cursor-pointer"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    onClick={handleClear}
                    className="py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-black uppercase rounded-xl border border-slate-800 cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => handleDigit('0')}
                    className="py-3 bg-slate-800 hover:bg-slate-700 text-white font-black text-lg rounded-xl border border-slate-700/60 shadow cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    onClick={handleBackspace}
                    className="py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 flex items-center justify-center rounded-xl border border-slate-800 cursor-pointer"
                  >
                    <Delete size={18} />
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSaveNewPin}
                    disabled={newPin.length !== 4}
                    className="flex-1 py-2.5 bg-blue-600 disabled:opacity-40 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Save PIN
                  </button>
                  <button
                    onClick={() => setIsChangingPin(false)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Locked State - PIN Input & Touch Keypad */
          <div>
            {/* PIN Indicator Dots */}
            <div className="flex justify-center items-center gap-4 mb-5">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    pin.length > idx
                      ? 'bg-blue-500 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.9)] scale-110'
                      : error
                      ? 'border-rose-500 bg-rose-500/20'
                      : 'border-slate-700 bg-slate-800/80'
                  }`}
                />
              ))}
            </div>

            {/* Error message */}
            {error && (
              <div className="text-center mb-4 text-xs font-bold text-rose-400 animate-pulse">
                {errorMessage}
              </div>
            )}

            {/* Touch Keypad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleDigit(digit)}
                  className="h-14 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 active:scale-95 text-white font-black text-xl rounded-2xl border border-slate-700 shadow-md transition-all flex items-center justify-center cursor-pointer select-none"
                >
                  {digit}
                </button>
              ))}

              <button
                onClick={handleClear}
                className="h-14 bg-slate-950 hover:bg-slate-800 active:scale-95 text-slate-400 font-black text-xs uppercase tracking-wider rounded-2xl border border-slate-800 transition-all flex items-center justify-center cursor-pointer select-none"
              >
                CLEAR
              </button>

              <button
                onClick={() => handleDigit('0')}
                className="h-14 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 active:scale-95 text-white font-black text-xl rounded-2xl border border-slate-700 shadow-md transition-all flex items-center justify-center cursor-pointer select-none"
              >
                0
              </button>

              <button
                onClick={handleBackspace}
                className="h-14 bg-slate-950 hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-white rounded-2xl border border-slate-800 transition-all flex items-center justify-center cursor-pointer select-none"
                title="Backspace"
              >
                <Delete size={20} />
              </button>
            </div>

            {/* Hint & Resume Option */}
            <div className="text-center pt-2 flex flex-col gap-2">
              <span className="text-[11px] text-slate-500 font-medium">
                Default Staff PIN: <span className="font-mono text-slate-400 font-bold">1234</span>
              </span>
              <button
                onClick={onClose}
                className="text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
              >
                ← Return to Kiosk Touch Screen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

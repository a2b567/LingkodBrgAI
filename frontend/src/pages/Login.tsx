import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, KeyRound, User as UserIcon, Loader2, Mail } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Forgot Password State
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sandboxOtp, setSandboxOtp] = useState('');
  
  const loginStore = useAuthStore(state => state.login);
  const navigate = useNavigate();

  // Password Complexity Verification Rules
  const meetsLength = newPassword.length >= 8;
  const meetsCase = /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword);
  const meetsDigitSpecial = /[0-9]/.test(newPassword) && /[!@#$%^&*()_+\-=\[\]{}|;':",./<>?]/.test(newPassword);
  const passwordsMatch = newPassword !== '' && newPassword === confirmPassword;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setInfo('');

    try {
      const data = await api.auth.login({ username, password });
      
      if (!data.user.is_verified) {
        setOtpMode(true);
        setInfo('Account is not verified. Please enter the OTP "123456" sent to your email.');
        setIsLoading(false);
        return;
      }

      loginStore(data.token, data.user);
      if (data.user.role === 'Resident') {
        navigate('/appointments');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials or connection issue.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await api.auth.verifyOtp({ username, otp: otpCode });
      setOtpMode(false);
      setInfo('Account verified successfully. You can now log in.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP. Try "123456"');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setInfo('');

    try {
      const data = await api.auth.forgotPassword({ email: forgotEmail });
      if (data.otp) {
        setSandboxOtp(data.otp);
      }
      setForgotStep(2);
      setInfo(data.message || 'OTP reset code has been sent to your email.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to request reset OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (!meetsLength || !meetsCase || !meetsDigitSpecial) {
      setError('Password does not meet complexity requirements.');
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.auth.resetPassword({
        email: forgotEmail,
        otp: forgotOtp,
        new_password: newPassword,
      });
      setForgotMode(false);
      setForgotStep(1);
      setForgotEmail('');
      setForgotOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setSandboxOtp('');
      setInfo(data.message || 'Password reset successfully. You can now log in.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-black dark:text-slate-200 overflow-hidden font-sans transition-colors duration-300">
      
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gov-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gov-gold-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-md p-8 bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl glass-panel relative z-10 mx-4">
        
        {/* Government Crest Logo Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-gov-blue-600 to-gov-blue-800 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-gov-blue-500/25 mx-auto">
            B
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-gov-blue-900 dark:text-gov-blue-300 uppercase">
            BMIS
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Barangay Management Information System (BMIS)
          </p>
        </div>

        {/* Notices */}
        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-2xl border border-rose-200/40 dark:border-rose-900/30 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
            {error}
          </div>
        )}
        {info && (
          <div className="mb-4 p-3.5 bg-gov-blue-50 dark:bg-gov-blue-950/20 text-gov-blue-700 dark:text-gov-blue-300 text-xs font-semibold rounded-2xl border border-gov-blue-200/40 dark:border-gov-blue-900/30 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-gov-blue-500 rounded-full"></span>
            {info}
          </div>
        )}

        {/* Dynamic Login / OTP / Forgot Password form */}
        {forgotMode ? (
          forgotStep === 1 ? (
            <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="your-email@domain.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs focus:outline-none focus:border-gov-blue-500 dark:focus:border-gov-blue-400 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-gov-blue-600 to-gov-blue-800 hover:from-gov-blue-700 hover:to-gov-blue-900 text-white font-bold py-3.5 rounded-2xl text-xs tracking-wider uppercase transition-all shadow-md shadow-gov-blue-600/25 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  'Send Reset OTP'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setForgotMode(false);
                  setError('');
                  setInfo('');
                }}
                className="w-full bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 text-xs py-2 rounded-2xl transition-colors font-semibold"
              >
                Back to Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              {sandboxOtp && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-2xl border border-amber-200/40 dark:border-amber-900/30">
                  <span className="font-bold">Sandbox Mode:</span> Your OTP is{' '}
                  <span className="bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded font-mono text-sm tracking-wider font-extrabold">{sandboxOtp}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Verification OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Enter OTP"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-center text-lg font-bold tracking-[8px] focus:outline-none focus:border-gov-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  New Password
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs focus:outline-none focus:border-gov-blue-500 dark:focus:border-gov-blue-400 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs focus:outline-none focus:border-gov-blue-500 dark:focus:border-gov-blue-400 transition-colors"
                  />
                </div>
              </div>

              {/* Password Complexity Checklist */}
              <div className="p-3 bg-slate-100/50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/30 dark:border-slate-800/30 text-[10px] space-y-1 text-slate-500 dark:text-slate-400">
                <div className="font-bold uppercase tracking-wider mb-1 text-slate-400">Password Strength Requirements:</div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${meetsLength ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
                  <span className={meetsLength ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>At least 8 characters long</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${meetsCase ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
                  <span className={meetsCase ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>At least 1 uppercase & 1 lowercase letter</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${meetsDigitSpecial ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
                  <span className={meetsDigitSpecial ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>At least 1 digit & 1 special character</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${passwordsMatch ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
                  <span className={passwordsMatch ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>Passwords match</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !meetsLength || !meetsCase || !meetsDigitSpecial || !passwordsMatch}
                className="w-full bg-gradient-to-r from-gov-blue-600 to-gov-blue-800 hover:from-gov-blue-700 hover:to-gov-blue-900 disabled:from-slate-400 disabled:to-slate-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-xs tracking-wider uppercase transition-all shadow-md shadow-gov-blue-600/25 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Reset Password'}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setForgotStep(1);
                    setError('');
                    setInfo('');
                  }}
                  className="flex-1 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 text-xs py-2 rounded-2xl transition-colors font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(false);
                    setForgotStep(1);
                    setError('');
                    setInfo('');
                  }}
                  className="flex-1 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 text-xs py-2 rounded-2xl transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )
        ) : !otpMode ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Username or Email
              </label>
              <div className="relative">
                <UserIcon size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="admin or resident"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs focus:outline-none focus:border-gov-blue-500 dark:focus:border-gov-blue-400 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(true);
                    setForgotStep(1);
                    setError('');
                    setInfo('');
                  }}
                  className="text-[10px] text-gov-blue-600 dark:text-gov-blue-400 font-bold hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="password123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs focus:outline-none focus:border-gov-blue-500 dark:focus:border-gov-blue-400 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-gov-blue-600 to-gov-blue-800 hover:from-gov-blue-700 hover:to-gov-blue-900 text-white font-bold py-3.5 rounded-2xl text-xs tracking-wider uppercase transition-all shadow-md shadow-gov-blue-600/25 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  Access Dashboard
                </>
              )}
            </button>

            <div className="text-center mt-6">
              <p className="text-xs text-slate-400 font-medium">
                New Resident?{' '}
                <Link to="/register" className="text-gov-blue-600 dark:text-gov-blue-400 font-bold hover:underline">
                  Create Profile & Register
                </Link>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Verification OTP Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="Enter 123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-center text-lg font-bold tracking-[8px] focus:outline-none focus:border-gov-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gov-blue-600 hover:bg-gov-blue-700 text-white font-bold py-3.5 rounded-2xl text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Verify Code'}
            </button>

            <button
              type="button"
              onClick={() => setOtpMode(false)}
              className="w-full bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 text-xs py-2 rounded-2xl transition-colors"
            >
              Back to Login
            </button>
          </form>
        )}

        <div className="text-center text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pt-4 border-t border-slate-200/50 dark:border-slate-800/50 mt-6">
          DEV: LAWREENE B ARANAS
        </div>
      </div>
    </div>
  );
};
export default Login;

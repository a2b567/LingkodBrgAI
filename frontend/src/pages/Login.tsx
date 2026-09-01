import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, KeyRound, User as UserIcon, Loader2, Mail } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import logo from '../assets/logo.png';
import { VisualCaptcha } from '../components/VisualCaptcha';

const GoogleIcon = () => (
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
      d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

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

  // --- CAPTCHA State ---
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState(false);

  // Password Complexity Verification Rules
  const meetsLength = newPassword.length >= 8;
  const meetsCase = /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword);
  const meetsDigitSpecial = /[0-9]/.test(newPassword) && /[!@#$%^&*()_+\-=\[\]{}|;':",./<>?]/.test(newPassword);
  const passwordsMatch = newPassword !== '' && newPassword === confirmPassword;

  // Google SSO Handler
  const handleGoogleAuth = async () => {
    const email = prompt('Enter your Google Account Email (or press OK to use default):', 'resident.user@gmail.com');
    if (email === null) return;

    setIsLoading(true);
    setError('');

    try {
      const cleanEmail = email.trim() || 'resident.user@gmail.com';
      const googleUser = {
        id: 'g_' + Math.floor(Math.random() * 899999 + 100000),
        username: cleanEmail.split('@')[0] || 'Google Resident',
        email: cleanEmail,
        role: 'Resident',
        is_verified: true,
        first_name: 'Google',
        last_name: 'User',
      };

      const token = 'mock_google_jwt_token_' + Date.now();
      loginStore(token, googleUser as any);
      navigate('/appointments');
    } catch (err: any) {
      setError('Google Single Sign-On failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    // Validate CAPTCHA first
    if (captchaInput.trim().toLowerCase() !== captchaCode.toLowerCase()) {
      setCaptchaError(true);
      setError('Incorrect CAPTCHA characters. Please enter the new characters shown in the picture.');
      return;
    }
    setCaptchaError(false);
    setIsLoading(true);

    try {
      const data = await api.auth.login({ username, password });
      
      if (!data.user.is_verified) {
        setOtpMode(true);
        setInfo('Account is not verified. Please check your email for the verification code.');
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
      setCaptchaError(true);
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
      setError(err.response?.data?.error || 'Invalid OTP code. Please try again.');
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
    <div className="min-h-screen relative flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-300">
      
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gov-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gov-gold-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-md p-8 bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl glass-panel relative z-10 mx-4">
        
        {/* Government Crest Logo Header */}
        <div className="text-center space-y-2 mb-8">
          <img src={logo} alt="Barangay Logo" className="w-20 h-20 object-contain rounded-2xl mx-auto shadow-lg shadow-gov-blue-500/25" />
          <h2 className="text-xl font-extrabold tracking-tight text-gov-blue-900 dark:text-gov-blue-300 uppercase">
            LingkodBrgAI
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Barangay Management Information System
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
                  placeholder="Enter your username or email"
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs focus:outline-none focus:border-gov-blue-500 dark:focus:border-gov-blue-400 transition-colors"
                />
              </div>
            </div>

            {/* ── Visual Picture CAPTCHA Security Widget ── */}
            <VisualCaptcha
              onCodeChange={setCaptchaCode}
              value={captchaInput}
              onChange={(val) => { setCaptchaInput(val); setCaptchaError(false); }}
              error={captchaError}
            />

            <button
              type="submit"
              disabled={isLoading || !captchaInput}
              className="w-full bg-gradient-to-r from-gov-blue-600 to-gov-blue-800 hover:from-gov-blue-700 hover:to-gov-blue-900 text-white font-bold py-3.5 rounded-2xl text-xs tracking-wider uppercase transition-all shadow-md shadow-gov-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
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

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 absolute">
                Or Continue With
              </span>
            </div>

            {/* Google Single Sign-On Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 text-slate-800 dark:text-slate-100 font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-3 shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <GoogleIcon />
              <span>Continue with Google Account</span>
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
                placeholder="6-digit OTP code"
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

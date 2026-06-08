import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import logo from '../assets/logo.png';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    birthdate: '',
    gender: 'Male',
    address: '',
    contact_number: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await api.auth.register(formData);
      setSuccess(true);
      // Wait 3 seconds, then redirect to login
      setTimeout(() => {
        navigate('/login');
      }, 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Check inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-black dark:text-slate-200 overflow-hidden font-sans p-6 transition-colors duration-300">
      
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gov-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gov-gold-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-2xl p-8 bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl glass-panel relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <img src={logo} alt="Barangay Logo" className="w-20 h-20 object-contain rounded-2xl mx-auto shadow-lg shadow-gov-blue-500/25" />
          <h2 className="text-xl font-extrabold tracking-tight text-gov-blue-900 dark:text-gov-blue-300 uppercase">
            Resident Registration
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Create user profile for online documents & appointments
          </p>
        </div>

        {/* Status Notices */}
        {error && (
          <div className="mb-6 p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-2xl border border-rose-200/40 dark:border-rose-900/30 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-2xl border border-emerald-200/40 dark:border-emerald-900/30">
            <p className="font-bold text-sm mb-1 text-emerald-700 dark:text-emerald-300">Registration Submitted!</p>
            Please check your details. Redirecting to Login in a moment. 
            Use OTP code <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">123456</code> to verify your email.
          </div>
        )}

        {!success && (
          <form onSubmit={handleRegister} className="space-y-6">
            
            {/* Section 1: Auth Information */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-gov-blue-600 dark:text-gov-blue-400 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                Account Credentials
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Username</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input type="text" name="username" required placeholder="User handle" value={formData.username} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-3 py-2.5 text-xs focus:outline-none focus:border-gov-blue-500" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input type="email" name="email" required placeholder="email@domain.com" value={formData.email} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-3 py-2.5 text-xs focus:outline-none focus:border-gov-blue-500" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input type="password" name="password" required placeholder="Minimum 6 characters" value={formData.password} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-3 py-2.5 text-xs focus:outline-none focus:border-gov-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Demographics Information */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-gov-blue-600 dark:text-gov-blue-400 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                Resident Profile Demographics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">First Name</label>
                  <input type="text" name="first_name" required placeholder="Juan" value={formData.first_name} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2.5 text-xs focus:outline-none focus:border-gov-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last Name</label>
                  <input type="text" name="last_name" required placeholder="Dela Cruz" value={formData.last_name} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2.5 text-xs focus:outline-none focus:border-gov-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="birthdate" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Birthdate</label>
                  <input id="birthdate" type="date" name="birthdate" required value={formData.birthdate} onChange={handleChange} title="Birthdate" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2.5 text-xs focus:outline-none focus:border-gov-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="gender" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gender</label>
                  <select id="gender" name="gender" value={formData.gender} onChange={handleChange} title="Gender" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2.5 text-xs focus:outline-none focus:border-gov-blue-500">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contact Number</label>
                  <input type="text" name="contact_number" placeholder="09xxxxxxxxx" value={formData.contact_number} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2.5 text-xs focus:outline-none focus:border-gov-blue-500" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Address</label>
                <input type="text" name="address" required placeholder="House No., Street Name, Zone" value={formData.address} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2.5 text-xs focus:outline-none focus:border-gov-blue-500" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-gov-blue-600 to-gov-blue-800 hover:from-gov-blue-700 hover:to-gov-blue-900 text-white font-bold py-3.5 rounded-2xl text-xs tracking-wider uppercase transition-all shadow-md shadow-gov-blue-600/25 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <UserPlus size={16} />
                    Register Citizen Profile
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-slate-400 font-medium">
                Already registered?{' '}
                <Link to="/login" className="text-gov-blue-600 dark:text-gov-blue-400 font-bold hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </form>
        )}

        <div className="text-center text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pt-4 border-t border-slate-200/50 dark:border-slate-800/50 mt-6">
          DEV: LAWREENE B ARANAS
        </div>
      </div>
    </div>
  );
};
export default Register;

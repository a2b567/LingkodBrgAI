import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileText, Calendar, AlertOctagon, Briefcase, Sun, Moon, 
  ArrowRight, Search, ShieldCheck, Sparkles, MessageSquareCode, 
  ChevronRight, MapPin, Phone, Mail, Clock, CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

export const Landing: React.FC = () => {
  const { token, user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const [verifyHash, setVerifyHash] = useState('');
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [simulatedAnswer, setSimulatedAnswer] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Automatic redirect if already logged in
  useEffect(() => {
    if (token && user) {
      if (user.role === 'Resident') {
        navigate('/appointments');
      } else {
        navigate('/dashboard');
      }
    }
  }, [token, user, navigate]);

  // Redirection for Portal CTA
  const handlePortalRedirect = () => {
    if (token && user) {
      if (user.role === 'Resident') {
        navigate('/appointments');
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/login');
    }
  };

  // Quick Verification Form Submit
  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyHash.trim()) {
      navigate(`/verify/document/${verifyHash.trim()}`);
    }
  };

  // Pre-defined AI Questions & Mock Answers
  const aiPrompts = [
    {
      question: "How do I request a Residency Certificate?",
      answer: "To request a Residency Certificate: \n1. Click 'Access Portal' and log in to your profile.\n2. Go to the 'Certificates' tab and click 'Request Document'.\n3. Choose 'Certificate of Residency', type in your purpose, and submit.\n4. Administrative staff will verify your records and sign the clearance with a secure digital QR code. You can download and print it once approved!"
    },
    {
      question: "What is required for a Business Clearance?",
      answer: "To apply for a Business Clearance: \n1. Access the portal and navigate to 'Businesses' in the sidebar.\n2. Click 'Register Business' and fill in details such as Business Name, Nature of Commerce, and location.\n3. Upload required attachments (like Barangay Business Clearance application form).\n4. Our Treasurer and Captain will review the application online, assess relevant local permit fees, and issue the signed clearance immediately upon payment approval."
    },
    {
      question: "How does the Congestion Risk predictor work?",
      answer: "Our portal features an automated Scheduling Congestion Risk predictor:\n- It analyzes historical booking requests and daily appointments in real-time.\n- When you try to book a date or time slot, the system flags congestion levels as 'Low', 'Medium', or 'High'.\n- We recommend scheduling on 'Low Risk' days (usually Tuesdays and Thursdays) to ensure immediate counter-service without standing in lines."
    }
  ];

  // AI Answer Streaming Simulation
  const handleAskAI = (prompt: typeof aiPrompts[0]) => {
    if (isTyping) return;
    setActiveQuestion(prompt.question);
    setSimulatedAnswer('');
    setIsTyping(true);

    let currentText = '';
    const textToType = prompt.answer;
    let index = 0;

    const interval = setInterval(() => {
      if (index < textToType.length) {
        currentText += textToType[index];
        setSimulatedAnswer(currentText);
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 15);
  };

  return (
    <div className="min-h-screen relative bg-slate-50 dark:bg-slate-950 text-black dark:text-slate-200 transition-colors duration-300 font-sans overflow-x-hidden">
      
      {/* Background Ambience / Glowing Orbs */}
      <div className="absolute top-[5%] left-[-15%] w-[45vw] h-[45vw] bg-gov-blue-500/10 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="absolute top-[40%] right-[-15%] w-[45vw] h-[45vw] bg-gov-gold-500/10 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[5%] left-[-10%] w-[40vw] h-[40vw] bg-gov-red-500/5 rounded-full blur-[140px] pointer-events-none z-0"></div>

      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Letterhead */}
          <div className="flex items-center gap-3.5 select-none">
            <div className="w-10 h-10 bg-gradient-to-tr from-gov-blue-600 to-gov-blue-800 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-gov-blue-600/25 transition-transform hover:scale-105 duration-200">
              B
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-extrabold text-base leading-tight tracking-tight text-gov-blue-900 dark:text-gov-blue-300">
                BMIS Portal
              </span>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black tracking-widest uppercase leading-tight">
                Laguna Government LGU
              </p>
            </div>
          </div>

          {/* Quick Links Menu */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-gov-blue-600 dark:hover:text-gov-blue-400 transition-colors">Services</a>
            <a href="#stats" className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-gov-blue-600 dark:hover:text-gov-blue-400 transition-colors">Portals & Stats</a>
            <a href="#announcements" className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-gov-blue-600 dark:hover:text-gov-blue-400 transition-colors">Announcements</a>
            <a href="#verify" className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-gov-blue-600 dark:hover:text-gov-blue-400 transition-colors">E-Verification</a>
            <a href="#ai-assistant" className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-gov-blue-600 dark:hover:text-gov-blue-400 transition-colors">LGU AI</a>
          </nav>

          {/* Action Menu (CTAs + Theme Toggle) */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {token && user ? (
              <button
                onClick={handlePortalRedirect}
                className="bg-gradient-to-r from-gov-blue-600 to-gov-blue-800 hover:from-gov-blue-700 hover:to-gov-blue-900 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md shadow-gov-blue-600/20 transition-all hover:translate-y-[-1px] active:translate-y-0"
              >
                Go to Portal
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300 px-5 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-gov-blue-600 to-gov-blue-800 hover:from-gov-blue-700 hover:to-gov-blue-900 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md shadow-gov-blue-600/20 transition-all hover:translate-y-[-1px] active:translate-y-0"
                >
                  Register Profile
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Text Block */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-gov-blue-500/10 text-gov-blue-600 dark:text-gov-blue-400 border border-gov-blue-500/25">
              <Sparkles size={11} className="animate-pulse" />
              Barangay E-Government Solution
            </span>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight leading-[1.05] text-gov-blue-900 dark:text-gov-blue-100">
              Modern LGU Governance, <br />
              <span className="bg-gradient-to-r from-gov-blue-500 to-gov-blue-700 dark:from-gov-blue-300 dark:to-gov-blue-500 bg-clip-text text-transparent">
                Empowered Citizens.
              </span>
            </h2>

            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Access digital certificates, real-time announcements, online appointment slots with AI congestion forecast, and secure business permit clearance directly from your device.
            </p>

            {/* Verification Form Quick Access */}
            <form onSubmit={handleVerifySubmit} className="max-w-md mx-auto lg:mx-0 p-1.5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 flex items-center shadow-lg shadow-slate-100 dark:shadow-none focus-within:border-gov-blue-500 transition-all">
              <div className="pl-3.5 text-slate-400">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={verifyHash}
                onChange={(e) => setVerifyHash(e.target.value)}
                placeholder="Enter E-Certificate Hash to Verify..."
                className="flex-1 bg-transparent border-0 outline-none text-xs px-3 py-3 w-full focus:ring-0 placeholder:text-slate-450 dark:placeholder:text-slate-550"
              />
              <button
                type="submit"
                className="bg-gov-blue-600 hover:bg-gov-blue-700 text-white font-bold text-xs py-3 px-5 rounded-2xl transition-colors shadow-md"
              >
                Verify
              </button>
            </form>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={handlePortalRedirect}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gov-blue-600 to-gov-blue-800 hover:from-gov-blue-700 hover:to-gov-blue-900 text-white font-bold text-xs px-7.5 py-4 rounded-2xl shadow-xl shadow-gov-blue-600/15 hover:translate-y-[-1px] active:translate-y-0 transition-all uppercase tracking-wider"
              >
                Access Citizen Portal
                <ArrowRight size={14} />
              </button>
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 px-7.5 py-4 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors uppercase tracking-wider"
              >
                Create Account
              </Link>
            </div>
          </div>

          {/* Right Visual Dashboard Mockup (Glow Glass Panel) */}
          <div className="lg:col-span-6 relative z-10 select-none flex justify-center">
            
            {/* Glowing Backdrop behind mockup */}
            <div className="absolute inset-0 bg-gradient-to-tr from-gov-blue-500/15 to-gov-gold-500/10 rounded-[3rem] blur-3xl scale-95 pointer-events-none"></div>

            {/* Dashboard Mockup Panel Container */}
            <div className="relative w-full max-w-lg aspect-[4/3] bg-white/40 dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-2xl p-6 glass-panel overflow-hidden animate-pulse-subtle">
              
              {/* Fake Menu bar */}
              <div className="flex items-center justify-between border-b border-slate-200/30 dark:border-slate-800/30 pb-4 mb-4 flex-shrink-0">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                </div>
                <div className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                  BMIS SECURE SYSTEM
                </div>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full status-pulse"></span>
              </div>

              {/* Fake Content Grid */}
              <div className="grid grid-cols-12 gap-4">
                
                {/* Visual Widget 1: Total Residents */}
                <div className="col-span-8 bg-white/70 dark:bg-slate-900/70 border border-slate-200/30 dark:border-slate-800/30 p-4 rounded-3xl shadow-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gov-blue-500/10 text-gov-blue-600 dark:text-gov-blue-400 rounded-lg flex items-center justify-center">
                      <CheckCircle2 size={12} />
                    </div>
                    <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">E-Gov System Active</span>
                  </div>
                  <p className="text-xl font-black font-display text-gov-blue-900 dark:text-gov-blue-300">
                    Laguna Barangay Hall
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Integrated digital network for clearances, public reporting, and local council appointments.
                  </p>
                </div>

                {/* Visual Widget 2: Calendar status */}
                <div className="col-span-4 bg-gradient-to-tr from-gov-blue-600 to-gov-blue-800 p-4 rounded-3xl text-white flex flex-col justify-between shadow-lg">
                  <Calendar size={18} className="opacity-80" />
                  <div>
                    <h5 className="text-[8px] font-extrabold tracking-widest uppercase opacity-75">TUESDAY</h5>
                    <p className="text-lg font-black leading-tight">LOW</p>
                    <p className="text-[8px] font-bold opacity-75">CONGESTION RISK</p>
                  </div>
                </div>

                {/* Visual Widget 3: Live updates mock list */}
                <div className="col-span-12 bg-white/70 dark:bg-slate-900/70 border border-slate-200/30 dark:border-slate-800/30 p-4 rounded-3xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Public Announcements</span>
                    <span className="text-[8px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wide">Emergency Alert</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-950/20 p-2 rounded-2xl border border-slate-200/20">
                      <div className="w-1.5 h-1.5 bg-gov-blue-500 rounded-full flex-shrink-0"></div>
                      <p className="text-[10px] font-bold text-slate-700 dark:text-slate-350 truncate">
                        Barangay Dental & Health Mission - Active slots open this Saturday
                      </p>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-950/20 p-2 rounded-2xl border border-slate-200/20">
                      <div className="w-1.5 h-1.5 bg-gov-blue-500 rounded-full flex-shrink-0"></div>
                      <p className="text-[10px] font-bold text-slate-700 dark:text-slate-350 truncate">
                        Secure QR Clearance validator successfully deployed. Check your documents!
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 3. Core Services Grid Section */}
      <section id="services" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-200/50 dark:border-slate-850/50">
        
        <div className="text-center space-y-3 mb-16">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-gov-gold-500/10 text-gov-gold-600 dark:text-gov-gold-400 border border-gov-gold-500/20">
            Digital Services
          </span>
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gov-blue-900 dark:text-gov-blue-100">
            Streamlined Services For Citizens
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
            We've digitized essential municipal services to eliminate waiting times, reduce red tape, and make local governance accessible, modern, and transparent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: E-Certificates */}
          <div className="bg-white/60 dark:bg-slate-900/60 p-6 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm glass-card transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-11 h-11 bg-gov-blue-500/10 text-gov-blue-600 dark:text-gov-blue-400 rounded-2xl flex items-center justify-center shadow-sm">
                <FileText size={20} />
              </div>
              <h4 className="font-extrabold text-sm text-gov-blue-950 dark:text-gov-blue-300">
                E-Certificates & Clearances
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
                Request Certificates of Residency, Indigency, and Barangay Clearances online. Automatically signed digitally with an authentic verifiable QR code.
              </p>
            </div>
            <button
              onClick={handlePortalRedirect}
              className="mt-6 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-gov-blue-600 dark:text-gov-blue-400 hover:text-gov-blue-800 group-hover:translate-x-1 transition-all text-left bg-transparent p-0 border-0"
            >
              Request Document
              <ChevronRight size={12} />
            </button>
          </div>

          {/* Card 2: Smart Appointments */}
          <div className="bg-white/60 dark:bg-slate-900/60 p-6 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm glass-card transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-11 h-11 bg-gov-blue-500/10 text-gov-blue-600 dark:text-gov-blue-400 rounded-2xl flex items-center justify-center shadow-sm">
                <Calendar size={20} />
              </div>
              <h4 className="font-extrabold text-sm text-gov-blue-950 dark:text-gov-blue-300">
                Smart Appointments
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
                Book physical visits to the Barangay Hall ahead of time. Use our scheduling congestion risk visualizer to select the fastest, most optimal slots.
              </p>
            </div>
            <button
              onClick={handlePortalRedirect}
              className="mt-6 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-gov-blue-600 dark:text-gov-blue-400 hover:text-gov-blue-800 group-hover:translate-x-1 transition-all text-left bg-transparent p-0 border-0"
            >
              Book Appointment
              <ChevronRight size={12} />
            </button>
          </div>

          {/* Card 3: Incident / Blotter Reporting */}
          <div className="bg-white/60 dark:bg-slate-900/60 p-6 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm glass-card transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-11 h-11 bg-gov-blue-500/10 text-gov-blue-600 dark:text-gov-blue-400 rounded-2xl flex items-center justify-center shadow-sm">
                <AlertOctagon size={20} />
              </div>
              <h4 className="font-extrabold text-sm text-gov-blue-950 dark:text-gov-blue-300">
                Secure Incident Reporting
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
                Submit confidential blotters, neighborhood dispute notifications, and community incident logs securely. Handled immediately by local officials.
              </p>
            </div>
            <button
              onClick={handlePortalRedirect}
              className="mt-6 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-gov-blue-600 dark:text-gov-blue-400 hover:text-gov-blue-800 group-hover:translate-x-1 transition-all text-left bg-transparent p-0 border-0"
            >
              Log Incident
              <ChevronRight size={12} />
            </button>
          </div>

          {/* Card 4: Business Permitting */}
          <div className="bg-white/60 dark:bg-slate-900/60 p-6 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm glass-card transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-11 h-11 bg-gov-blue-500/10 text-gov-blue-600 dark:text-gov-blue-400 rounded-2xl flex items-center justify-center shadow-sm">
                <Briefcase size={20} />
              </div>
              <h4 className="font-extrabold text-sm text-gov-blue-950 dark:text-gov-blue-300">
                Business Clearance Fast-Track
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
                Register local businesses and apply for official Barangay Business Clearances. Track official review and process corresponding fee structures digitally.
              </p>
            </div>
            <button
              onClick={handlePortalRedirect}
              className="mt-6 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-gov-blue-600 dark:text-gov-blue-400 hover:text-gov-blue-800 group-hover:translate-x-1 transition-all text-left bg-transparent p-0 border-0"
            >
              Apply Clearance
              <ChevronRight size={12} />
            </button>
          </div>

        </div>

      </section>

      {/* 4. Real-time stats & portal block */}
      <section id="stats" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-tr from-gov-blue-950 to-slate-900 text-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-800 select-none">
        
        {/* Glow */}
        <div className="absolute top-[-20%] right-[-10%] w-[35vw] h-[35vw] bg-gov-gold-500/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[35vw] h-[35vw] bg-gov-blue-500/10 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left stats panel */}
          <div className="lg:col-span-5 space-y-6">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/10 text-gov-gold-300 border border-white/10">
              Barangay Statistics
            </span>
            <h3 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight leading-tight">
              A Highly Connected, Active Digital Barangay
            </h3>
            <p className="text-xs text-slate-350 leading-relaxed font-semibold">
              Laguna BMIS actively monitors processing metrics and transaction statistics, improving resolution speeds and public transparent governance for thousands of residents.
            </p>
            <div className="pt-2">
              <button
                onClick={handlePortalRedirect}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-gov-gold-500 to-gov-gold-600 hover:from-gov-gold-600 hover:to-gov-gold-700 text-slate-950 font-black text-xs px-7.5 py-4 rounded-2xl shadow-xl transition-all hover:translate-y-[-1px] uppercase tracking-wider"
              >
                Log In To Portal
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Right counters grid */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            
            {/* Stat 1 */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md space-y-2">
              <p className="text-4xl font-black font-display text-gov-gold-400">12,450+</p>
              <h5 className="font-extrabold text-[10px] uppercase text-slate-300 tracking-wider">Active Residents</h5>
              <p className="text-[9px] text-slate-400 font-medium">Verified local citizen profile records updated live.</p>
            </div>

            {/* Stat 2 */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md space-y-2">
              <p className="text-4xl font-black font-display text-gov-blue-300">8,920+</p>
              <h5 className="font-extrabold text-[10px] uppercase text-slate-300 tracking-wider">Clearances Issued</h5>
              <p className="text-[9px] text-slate-400 font-medium">Securely printed and digitally signed with QR signatures.</p>
            </div>

            {/* Stat 3 */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md space-y-2">
              <p className="text-4xl font-black font-display text-emerald-400">4,500+</p>
              <h5 className="font-extrabold text-[10px] uppercase text-slate-300 tracking-wider">AI Queries Handled</h5>
              <p className="text-[9px] text-slate-400 font-medium">Automatic advisory information resolved dynamically.</p>
            </div>

            {/* Stat 4 */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md space-y-2 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full status-pulse"></span>
                <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">LOW / OPTIMAL</span>
              </div>
              <h5 className="font-extrabold text-[10px] uppercase text-slate-300 tracking-wider mt-2.5">Hall Congestion Risk</h5>
              <p className="text-[9px] text-slate-400 font-medium">Current estimated lobby wait times under 5 minutes.</p>
            </div>

          </div>

        </div>

      </section>

      {/* 5. Interactive simulated AI Assistant Teaser Widget */}
      <section id="ai-assistant" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-b border-slate-200/50 dark:border-slate-850/50">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Block */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-gov-blue-500/10 text-gov-blue-600 dark:text-gov-blue-400 border border-gov-blue-500/20">
              Artificial Intelligence
            </span>
            <h3 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight leading-tight text-gov-blue-900 dark:text-gov-blue-100">
              Interactive Barangay AI Digital Advisor
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              Get immediate, automated answers regarding local guidelines, registration rules, business requirements, and certificate fees.
            </p>
            
            <div className="space-y-3 pt-2">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Select a query to test the AI Advisor:</p>
              <div className="flex flex-col gap-2">
                {aiPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAskAI(p)}
                    className={`w-full text-left p-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between ${
                      activeQuestion === p.question
                        ? 'border-gov-blue-500 bg-gov-blue-500/5 text-gov-blue-750 dark:text-gov-blue-300 shadow-sm'
                        : 'border-slate-200/70 dark:border-slate-800/70 bg-white/40 dark:bg-slate-900/40 text-slate-650 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="truncate pr-4">{p.question}</span>
                    <MessageSquareCode size={14} className="flex-shrink-0 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right simulated Chat UI panel */}
          <div className="lg:col-span-7 flex justify-center">
            
            <div className="w-full max-w-xl h-[420px] bg-white/80 dark:bg-slate-900/80 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-2xl glass-panel p-5 flex flex-col justify-between overflow-hidden">
              
              {/* Fake Chat Header */}
              <div className="flex items-center gap-3 border-b border-slate-200/30 dark:border-slate-800/30 pb-3 flex-shrink-0">
                <div className="w-9 h-9 bg-gradient-to-tr from-gov-blue-600 to-gov-blue-800 text-white rounded-xl flex items-center justify-center shadow-md">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-gov-blue-900 dark:text-gov-blue-350">Barangay AI Advisor</h4>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full status-pulse"></span>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Ready & Active</span>
                  </div>
                </div>
              </div>

              {/* Chat Dialog Content Area */}
              <div className="flex-1 py-4 overflow-y-auto space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-350 select-text">
                {activeQuestion ? (
                  <>
                    {/* Citizen Question */}
                    <div className="flex items-end justify-end gap-2.5">
                      <div className="bg-gov-blue-600 text-white p-3.5 rounded-[1.5rem] rounded-br-none max-w-[85%] font-medium">
                        {activeQuestion}
                      </div>
                    </div>

                    {/* AI Answer Response */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 bg-slate-100 dark:bg-slate-800 text-gov-blue-600 dark:text-gov-blue-400 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Sparkles size={12} />
                      </div>
                      <div className="bg-slate-150/80 dark:bg-slate-950/60 p-3.5 rounded-[1.5rem] rounded-bl-none max-w-[85%] leading-relaxed whitespace-pre-line font-medium border border-slate-200/20 shadow-sm relative">
                        {simulatedAnswer}
                        {isTyping && (
                          <span className="inline-block w-1.5 h-3.5 bg-gov-blue-600 dark:bg-gov-blue-400 ml-1 animate-pulse"></span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3.5 text-slate-450 dark:text-slate-550 select-none">
                    <MessageSquareCode size={36} className="text-slate-300 dark:text-slate-700 animate-bounce" />
                    <p className="text-xs font-bold uppercase tracking-wider">LGU Simulated Advisor Channel</p>
                    <p className="text-[10px] max-w-xs font-semibold">Select a predefined citizen query on the left to see the Barangay AI respond dynamically in real-time.</p>
                  </div>
                )}
              </div>

              {/* Fake Input footer */}
              <div className="border-t border-slate-200/30 dark:border-slate-800/30 pt-3 flex-shrink-0">
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Citizen Query Console</span>
                  <span className="text-[8px] bg-slate-200 dark:bg-slate-850 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">Ready</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* 6. Document E-Verification Information Segment */}
      <section id="verify" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-b border-slate-200/50 dark:border-slate-850/50 text-center space-y-6">
        
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Secure Auditing
          </span>
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gov-blue-900 dark:text-gov-blue-100">
            Secure Digital QR Code Verification
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium leading-relaxed">
            Every administrative clearance and residency certificate issued by BMIS features an immutable, secure cryptographic hash printed as a scannable verification landing QR code.
          </p>
        </div>

        <div className="max-w-2xl mx-auto bg-white/40 dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-md glass-panel grid grid-cols-1 sm:grid-cols-2 gap-8 items-center text-left">
          
          <div className="space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center shadow-sm">
                <ShieldCheck size={14} />
              </div>
              <h4 className="font-extrabold text-xs text-gov-blue-950 dark:text-gov-blue-300 uppercase tracking-wider">LGU Cryptographic Verification</h4>
            </div>
            
            <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
              Institutions, banks, and government agencies can scan the QR code located on any printed document or input the document reference hash on this portal to instantly verify its authenticity online.
            </p>

            <ul className="space-y-2 text-[10px] font-bold text-slate-650">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-500" />
                Tamper-Proof Digital Verification
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-500" />
                Immediate Online Authenticity Check
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-500" />
                Free Public Clearance Registry Audit
              </li>
            </ul>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200/40 dark:border-slate-800/40 flex flex-col items-center justify-center space-y-4">
            
            {/* Fake QR Scanner Visual */}
            <div className="w-32 h-32 bg-white dark:bg-slate-900 border-4 border-gov-blue-500/20 p-2.5 rounded-2xl relative shadow-inner">
              
              {/* Scanning visual overlay */}
              <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 top-1/2 animate-bounce"></div>
              
              {/* QR representation using SVG segments */}
              <svg viewBox="0 0 100 100" className="w-full h-full fill-slate-800 dark:fill-slate-200">
                <rect x="0" y="0" width="25" height="25" />
                <rect x="5" y="5" width="15" height="15" fill="white" />
                <rect x="75" y="0" width="25" height="25" />
                <rect x="80" y="5" width="15" height="15" fill="white" />
                <rect x="0" y="75" width="25" height="25" />
                <rect x="5" y="80" width="15" height="15" fill="white" />
                <rect x="35" y="35" width="30" height="30" />
                <rect x="40" y="40" width="20" height="20" fill="white" />
                <rect x="10" y="35" width="15" height="10" />
                <rect x="75" y="45" width="15" height="15" />
                <rect x="45" y="10" width="15" height="15" />
                <rect x="15" y="55" width="10" height="10" />
              </svg>
            </div>
            
            <form onSubmit={handleVerifySubmit} className="w-full space-y-2">
              <input
                type="text"
                required
                value={verifyHash}
                onChange={(e) => setVerifyHash(e.target.value)}
                placeholder="Paste Certificate MD5 Hash..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 text-[10px] text-center font-mono focus:outline-none focus:border-gov-blue-500"
              />
              <button
                type="submit"
                className="w-full bg-gov-blue-600 hover:bg-gov-blue-700 text-white font-bold text-[10px] py-2.5 rounded-2xl transition-colors uppercase tracking-wider"
              >
                Validate Reference Hash
              </button>
            </form>
          </div>

        </div>

      </section>

      {/* 7. Public Announcements Board */}
      <section id="announcements" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-b border-slate-200/50 dark:border-slate-850/50">
        
        <div className="text-center space-y-3 mb-16">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-gov-red-500/10 text-gov-red-600 dark:text-gov-red-400 border border-gov-red-500/20">
            LGU Bulletin
          </span>
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gov-blue-900 dark:text-gov-blue-100">
            Latest Barangay Announcements & Alerts
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
            Stay updated with official advisories, dental/medical health drives, neighborhood assembly meetings, and weather advisories published by your local officials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Announcement 1 */}
          <div className="bg-white/60 dark:bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm glass-panel flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-wider">
                <span>Health advisory</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/15">Active</span>
              </div>
              <h4 className="font-extrabold text-sm text-gov-blue-950 dark:text-gov-blue-300">
                Annual Dental & Medical Mission
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
                Join our health volunteers this Saturday, June 6th, starting from 8:00 AM at the Lawrence Barangay Covered Court. Pediatric consults, dental extraction services, and free basic wellness check-ups are open for all residents.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-200/30 dark:border-slate-800/30 mt-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-gov-blue-700 dark:text-gov-blue-400">HW</div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-700 dark:text-slate-350">Barangay Health Council</p>
                <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Issued 2 hours ago</p>
              </div>
            </div>
          </div>

          {/* Announcement 2 */}
          <div className="bg-white/60 dark:bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm glass-panel flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-wider">
                <span>LGU Announcement</span>
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500">General</span>
              </div>
              <h4 className="font-extrabold text-sm text-gov-blue-950 dark:text-gov-blue-300">
                Online Portal Official Launch
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
                We have officially launched the new Barangay Management Information System (BMIS)! Citizens can now create their electronic profiles, secure residency clearances, file blotter reports, and arrange lobby appointments completely online.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-200/30 dark:border-slate-800/30 mt-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-gov-blue-700 dark:text-gov-blue-400">BC</div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-700 dark:text-slate-350">Office of the Captain</p>
                <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Issued 1 day ago</p>
              </div>
            </div>
          </div>

          {/* Announcement 3 */}
          <div className="bg-white/60 dark:bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm glass-panel flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-wider">
                <span>Livelihood advisory</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/15">Seminar</span>
              </div>
              <h4 className="font-extrabold text-sm text-gov-blue-950 dark:text-gov-blue-300">
                Livelihood & Business Clearance Seminar
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
                In partnership with the Department of Trade and Industry (DTI), the barangay will host a livelihood capacity-building seminar on micro-entrepreneurship and fast-tracking local commercial business permits. Registration is free.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-200/30 dark:border-slate-800/30 mt-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-gov-blue-700 dark:text-gov-blue-400">BS</div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-700 dark:text-slate-350">Barangay Secretary Office</p>
                <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Issued 3 days ago</p>
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* 8. Professional Footer */}
      <footer className="relative z-10 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-slate-650 transition-colors duration-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: LGU Seal Details */}
          <div className="space-y-4 col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 select-none">
              <div className="w-9 h-9 bg-gradient-to-tr from-gov-blue-600 to-gov-blue-800 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md shadow-gov-blue-500/20">
                B
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-gov-blue-900 dark:text-gov-blue-300">Laguna BMIS</h4>
                <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Local Government Unit Portal</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed font-semibold max-w-sm">
              Providing secure, cryptographic, digital citizen services for residency certificate registry, business clearances, and scheduling for residents.
            </p>
            <p className="text-[10px] font-black text-gov-blue-600 dark:text-gov-blue-400 uppercase tracking-widest pt-2">
              Modern Governance • Connected Community
            </p>
          </div>

          {/* Col 2: Services shortcuts */}
          <div className="space-y-3">
            <h5 className="font-black text-[10px] uppercase text-slate-400 tracking-wider">E-Services Quicklinks</h5>
            <ul className="space-y-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              <li><button onClick={handlePortalRedirect} className="hover:text-gov-blue-600 bg-transparent p-0 border-0 cursor-pointer">E-Certificates</button></li>
              <li><button onClick={handlePortalRedirect} className="hover:text-gov-blue-600 bg-transparent p-0 border-0 cursor-pointer">Local Appointments</button></li>
              <li><button onClick={handlePortalRedirect} className="hover:text-gov-blue-600 bg-transparent p-0 border-0 cursor-pointer">Incident Blotters</button></li>
              <li><button onClick={handlePortalRedirect} className="hover:text-gov-blue-600 bg-transparent p-0 border-0 cursor-pointer">Business Permits</button></li>
            </ul>
          </div>

          {/* Col 3: Hall Contact coordinates */}
          <div className="space-y-3">
            <h5 className="font-black text-[10px] uppercase text-slate-400 tracking-wider">Barangay Hall Contact</h5>
            <ul className="space-y-2.5 text-[11px] text-slate-550 dark:text-slate-400 font-semibold">
              <li className="flex items-center gap-2">
                <MapPin size={13} className="text-slate-400 flex-shrink-0" />
                Lawrence Barangay Hall, Laguna, PH
              </li>
              <li className="flex items-center gap-2">
                <Phone size={13} className="text-slate-400 flex-shrink-0" />
                LGU Hotline: +63 (49) 555-8291
              </li>
              <li className="flex items-center gap-2">
                <Mail size={13} className="text-slate-400 flex-shrink-0" />
                contact@lawrence-laguna.gov.ph
              </li>
              <li className="flex items-center gap-2">
                <Clock size={13} className="text-slate-400 flex-shrink-0" />
                Mon - Fri: 8:00 AM - 5:00 PM
              </li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-200/50 dark:border-slate-800/50 pt-8 mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest select-none">
          <p>© 2026 Barangay Lawrence, Laguna. All Rights Reserved.</p>
          <p>dev • lawreene b aranas</p>
        </div>
      </footer>

      {/* Real-time emergency announcement modal/watermark indicator */}
      <div className="fixed inset-0 pointer-events-none select-none z-[9999] flex items-center justify-center overflow-hidden opacity-[0.008] dark:opacity-[0.004]">
        <div className="text-[7vw] font-light uppercase tracking-[0.3em] -rotate-[30deg] whitespace-nowrap text-black dark:text-slate-200">
          DEV LAWREENE B ARANAS
        </div>
      </div>

    </div>
  );
};

export default Landing;

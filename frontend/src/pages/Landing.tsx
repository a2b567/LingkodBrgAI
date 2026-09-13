import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileText, Calendar, AlertOctagon, Briefcase, Sun, Moon, 
  ArrowRight, Search, ShieldCheck, Sparkles, MessageSquareCode, 
  ChevronRight, MapPin, Phone, Mail, Clock, CheckCircle2, QrCode, Camera, X
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { api } from '../services/api';

export const Landing: React.FC = () => {
  const { token, user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const [verifyHash, setVerifyHash] = useState('');
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [simulatedAnswer, setSimulatedAnswer] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  // Live database stats fetched from backend
  const [liveStats, setLiveStats] = useState<{
    total_residents: number;
    total_clearances: number;
    active_incidents: number;
    total_businesses: number;
    congestion_risk: string;
  } | null>(null);

  // Default initial announcements
  const defaultAnnouncements = [
    {
      id: '1',
      title: 'Annual Dental & Medical Mission',
      content: 'Join our health volunteers this Saturday, June 6th, starting from 8:00 AM at the Lawrence Barangay Covered Court. Pediatric consults, dental extraction services, and free basic wellness check-ups are open for all residents.',
      category: 'Health Advisory',
      badge: 'Active',
      author: 'Barangay Health Council',
      initials: 'HW',
      date: 'Issued 2 hours ago'
    },
    {
      id: '2',
      title: 'Online Portal Official Launch',
      content: 'We have officially launched the new LingkodBrgAI Barangay Management Information System! Citizens can now create their electronic profiles, secure residency clearances, file blotter reports, and arrange lobby appointments completely online.',
      category: 'LGU Announcement',
      badge: 'General',
      author: 'Office of the Captain',
      initials: 'BC',
      date: 'Issued 1 day ago'
    },
    {
      id: '3',
      title: 'Livelihood & Business Clearance Seminar',
      content: 'In partnership with the Department of Trade and Industry (DTI), the barangay will host a livelihood capacity-building seminar on micro-entrepreneurship and fast-tracking local commercial business permits. Registration is free.',
      category: 'Livelihood Advisory',
      badge: 'Seminar',
      author: 'Barangay Secretary Office',
      initials: 'BS',
      date: 'Issued 3 days ago'
    }
  ];

  // Synced state with Settings.tsx via localStorage
  const [announcements, setAnnouncements] = useState<Array<{ id: string; title: string; content: string; date: string; category?: string; badge?: string; author?: string; initials?: string }>>(() => {
    try {
      const saved = localStorage.getItem('lingkod_landing_announcements');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultAnnouncements;
  });

  const [contactAddress, setContactAddress] = useState(localStorage.getItem('brgy_address') || 'Brgy. Hall, Main Road, Laguna');
  const [contactHotline, setContactHotline] = useState(localStorage.getItem('brgy_hotline') || '(049) 123-4567');
  const [contactEmail, setContactEmail] = useState(localStorage.getItem('brgy_email') || 'info@barangay.gov.ph');
  const [contactHours, setContactHours] = useState(localStorage.getItem('brgy_hours') || 'Mon-Fri: 8:00 AM - 5:00 PM');
  const [heroBg, setHeroBg] = useState<string | null>(localStorage.getItem('brgy_hero_bg') || null);

  // Real-time synchronization polling for changes made in Settings.tsx and live DB stats
  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        const stats = await api.analytics.publicDashboard();
        setLiveStats(stats);
      } catch (e) {
        console.error('Failed to fetch public stats', e);
      }
    };
    fetchLiveStats();

    const syncData = () => {
      try {
        const savedAnn = localStorage.getItem('lingkod_landing_announcements');
        if (savedAnn) setAnnouncements(JSON.parse(savedAnn));
      } catch (e) {}
      setContactAddress(localStorage.getItem('brgy_address') || 'Brgy. Hall, Main Road, Laguna');
      setContactHotline(localStorage.getItem('brgy_hotline') || '(049) 123-4567');
      setContactEmail(localStorage.getItem('brgy_email') || 'info@barangay.gov.ph');
      setContactHours(localStorage.getItem('brgy_hours') || 'Mon-Fri: 8:00 AM - 5:00 PM');
      setHeroBg(localStorage.getItem('brgy_hero_bg') || null);
      fetchLiveStats();
    };
    const timer = setInterval(syncData, 3000);
    return () => clearInterval(timer);
  }, []);

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

  // ── Real Camera QR Scanner ──────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    import('jsqr').then(({ default: jsQR }) => {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });
      if (code?.data) {
        stopCamera();
        setIsScannerOpen(false);
        const raw = code.data.trim();
        // If it's a full URL, extract the hash from the path
        try {
          const url = new URL(raw);
          const parts = url.pathname.split('/');
          const hash = parts[parts.length - 1];
          navigate(`/verify/document/${hash}`);
        } catch {
          navigate(`/verify/document/${raw}`);
        }
        return;
      }
      animFrameRef.current = requestAnimationFrame(scanFrame);
    });
  }, [navigate, stopCamera]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
          animFrameRef.current = requestAnimationFrame(scanFrame);
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Permission') || msg.includes('denied') || msg.includes('NotAllowed')) {
        setCameraError('Camera access denied. Please allow camera permission in your browser settings.');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError('Could not start camera: ' + msg);
      }
    }
  }, [scanFrame]);

  useEffect(() => {
    if (isScannerOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isScannerOpen, startCamera, stopCamera]);
  // ────────────────────────────────────────────────────────────────────────────

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
    <div
      className="min-h-screen relative text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans overflow-x-hidden"
      style={heroBg ? {
        backgroundColor: 'transparent'
      } : {}}
    >
      {/* Hero Background Image Layer */}
      {heroBg && (
        <>
          <div
            className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroBg})` }}
          />
          {/* Dark overlay for readability */}
          <div className="fixed inset-0 z-0 bg-black/55 dark:bg-black/70" />
        </>
      )}

      {/* Default bg when no image */}
      {!heroBg && (
        <div className="fixed inset-0 z-0 bg-slate-50 dark:bg-slate-950" />
      )}
      
      {/* Dynamic Background Ambience / Glowing Orbs adapted to light & dark mode */}
      <div className="absolute top-[5%] left-[-15%] w-[45vw] h-[45vw] bg-gov-blue-500/10 dark:bg-gov-blue-500/15 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="absolute top-[40%] right-[-15%] w-[45vw] h-[45vw] bg-gov-gold-500/10 dark:bg-gov-gold-500/15 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[5%] left-[-10%] w-[40vw] h-[40vw] bg-gov-red-500/5 dark:bg-gov-red-500/10 rounded-full blur-[140px] pointer-events-none z-0"></div>

      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Letterhead */}
          <div className="flex items-center gap-3.5 select-none cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 bg-gradient-to-tr from-gov-blue-700 to-indigo-800 rounded-2xl shadow-md shadow-gov-blue-600/20 flex items-center justify-center text-white flex-shrink-0">
              <ShieldCheck size={22} className="text-gov-gold-400" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-extrabold text-base leading-tight tracking-tight text-gov-blue-900 dark:text-gov-blue-300">
                LingkodBrgyAi Portal
              </span>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-black tracking-widest uppercase leading-tight">
                Laguna Government LGU
              </p>
            </div>
          </div>

          {/* Quick Links Menu */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-gov-blue-600 dark:hover:text-gov-blue-400 transition-colors">Services</a>
            <a href="#stats" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-gov-blue-600 dark:hover:text-gov-blue-400 transition-colors">Portals & Stats</a>
            <a href="#announcements" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-gov-blue-600 dark:hover:text-gov-blue-400 transition-colors">Announcements</a>
            <a href="#verify" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-gov-blue-600 dark:hover:text-gov-blue-400 transition-colors">E-Verification</a>
            <a href="#ai-assistant" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-gov-blue-600 dark:hover:text-gov-blue-400 transition-colors">LGU AI</a>
          </nav>

          {/* Action Menu (CTAs + Theme Toggle) */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all duration-200 shadow-xs flex items-center gap-2 text-xs font-bold"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon size={16} className="text-slate-700" /> : <Sun size={16} className="text-amber-400" />}
              <span className="hidden sm:inline text-[11px] font-semibold">{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>

            {token && user ? (
              <button
                onClick={handlePortalRedirect}
                className="bg-gradient-to-r from-gov-blue-600 to-gov-blue-800 hover:from-gov-blue-700 hover:to-gov-blue-900 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md shadow-gov-blue-600/20 dark:shadow-gov-blue-900/40 transition-all hover:translate-y-[-1px] active:translate-y-0"
              >
                Go to Portal
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 px-5 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all bg-white/50 dark:bg-slate-900/50"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-gov-blue-600 to-gov-blue-800 hover:from-gov-blue-700 hover:to-gov-blue-900 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md shadow-gov-blue-600/20 dark:shadow-gov-blue-900/40 transition-all hover:translate-y-[-1px] active:translate-y-0"
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
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-gov-blue-500/10 dark:bg-gov-blue-500/20 text-gov-blue-700 dark:text-gov-blue-300 border border-gov-blue-500/25 shadow-xs">
              <Sparkles size={11} className="animate-pulse text-gov-blue-600 dark:text-gov-blue-400" />
              Barangay E-Government Solution
            </span>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight leading-[1.06] text-slate-900 dark:text-white">
              Modern LGU Governance, <br />
              <span className="bg-gradient-to-r from-gov-blue-600 via-gov-blue-700 to-gov-blue-900 dark:from-gov-blue-300 dark:via-gov-blue-400 dark:to-gov-gold-400 bg-clip-text text-transparent">
                Empowered Citizens.
              </span>
            </h2>

            <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Access digital certificates, real-time announcements, online appointment slots with AI congestion forecast, and secure business permit clearance directly from your device.
            </p>

            {/* Verification Form Quick Access */}
            <form onSubmit={handleVerifySubmit} className="max-w-md mx-auto lg:mx-0 p-1.5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex items-center shadow-lg dark:shadow-2xl dark:shadow-slate-950/80 focus-within:border-gov-blue-500 dark:focus-within:border-gov-blue-400 transition-all">
              <div className="pl-3.5 text-slate-400 dark:text-slate-500">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={verifyHash}
                onChange={(e) => setVerifyHash(e.target.value)}
                placeholder="Paste QR ID (e.g. QR-RES-...) or Certificate Hash..."
                className="flex-1 bg-transparent border-0 outline-none text-xs px-3 py-3 w-full focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <button
                type="submit"
                className="bg-gov-blue-600 hover:bg-gov-blue-700 dark:bg-gov-blue-500 dark:hover:bg-gov-blue-600 text-white font-bold text-xs py-3 px-5 rounded-2xl transition-colors shadow-md flex-shrink-0"
              >
                Verify QR
              </button>
            </form>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={handlePortalRedirect}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gov-blue-600 to-gov-blue-800 hover:from-gov-blue-700 hover:to-gov-blue-900 text-white font-bold text-xs px-7.5 py-4 rounded-2xl shadow-xl shadow-gov-blue-600/20 dark:shadow-gov-blue-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-wider"
              >
                Access Citizen Portal
                <ArrowRight size={14} />
              </button>
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 px-7.5 py-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors uppercase tracking-wider shadow-xs"
              >
                Create Account
              </Link>
            </div>
          </div>

          {/* Right Visual Dashboard Mockup (Glow Glass Panel) */}
          <div className="lg:col-span-6 relative z-10 select-none flex justify-center">
            
            {/* Glowing Backdrop behind mockup */}
            <div className="absolute inset-0 bg-gradient-to-tr from-gov-blue-500/20 to-gov-gold-500/15 dark:from-gov-blue-600/30 dark:to-gov-gold-500/20 rounded-[3rem] blur-3xl scale-95 pointer-events-none"></div>

            {/* Dashboard Mockup Panel Container */}
            <div className="relative w-full max-w-lg aspect-[4/3] bg-white/80 dark:bg-slate-900/80 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl dark:shadow-slate-950/90 p-6 glass-panel overflow-hidden animate-pulse-subtle">
              
              {/* Fake Menu bar */}
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-4 mb-4 flex-shrink-0">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                </div>
                <div className="text-[9px] font-extrabold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                  LINGKODBRG AI SECURE SYSTEM
                </div>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full status-pulse"></span>
              </div>

              {/* Fake Content Grid */}
              <div className="grid grid-cols-12 gap-4">
                
                {/* Visual Widget 1: Total Residents */}
                <div className="col-span-8 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 p-4 rounded-3xl shadow-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gov-blue-500/10 text-gov-blue-600 dark:text-gov-blue-400 rounded-lg flex items-center justify-center">
                      <CheckCircle2 size={12} />
                    </div>
                    <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">E-Gov System Active</span>
                  </div>
                  <p className="text-xl font-black font-display text-gov-blue-900 dark:text-gov-blue-300">
                    Laguna Barangay Hall
                  </p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                    Integrated digital network for clearances, public reporting, and local council appointments.
                  </p>
                </div>

                {/* Visual Widget 2: Calendar status */}
                <div className="col-span-4 bg-gradient-to-tr from-gov-blue-600 to-gov-blue-800 dark:from-gov-blue-700 dark:to-slate-800 p-4 rounded-3xl text-white flex flex-col justify-between shadow-lg">
                  <Calendar size={18} className="opacity-90" />
                  <div>
                    <h5 className="text-[8px] font-extrabold tracking-widest uppercase opacity-85">TUESDAY</h5>
                    <p className="text-lg font-black leading-tight">LOW</p>
                    <p className="text-[8px] font-bold opacity-85">CONGESTION RISK</p>
                  </div>
                </div>

                {/* Visual Widget 3: Live updates mock list */}
                <div className="col-span-12 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 p-4 rounded-3xl shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Public Announcements</span>
                    <span className="text-[8px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 uppercase tracking-wide">Emergency Alert</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900/80 p-2.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                      <div className="w-1.5 h-1.5 bg-gov-blue-500 rounded-full flex-shrink-0"></div>
                      <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                        Barangay Dental & Health Mission - Active slots open this Saturday
                      </p>
                    </div>
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900/80 p-2.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                      <div className="w-1.5 h-1.5 bg-gov-blue-500 rounded-full flex-shrink-0"></div>
                      <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
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
      <section id="services" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-200/80 dark:border-slate-800/80">
        
        <div className="text-center space-y-3 mb-16">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full bg-gov-gold-500/10 dark:bg-gov-gold-500/20 text-gov-gold-700 dark:text-gov-gold-400 border border-gov-gold-500/25">
            Digital Services
          </span>
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Streamlined Services For Citizens
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto font-medium leading-relaxed">
            We've digitized essential municipal services to eliminate waiting times, reduce red tape, and make local governance accessible, modern, and transparent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: E-Certificates */}
          <div className="bg-white dark:bg-slate-900/80 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800/80 shadow-md dark:shadow-slate-950/50 hover:border-gov-blue-500/50 dark:hover:border-gov-blue-400/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-11 h-11 bg-gov-blue-50 dark:bg-gov-blue-950/80 text-gov-blue-600 dark:text-gov-blue-400 border border-gov-blue-200/60 dark:border-gov-blue-800/60 rounded-2xl flex items-center justify-center shadow-xs">
                <FileText size={20} />
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                E-Certificates & Clearances
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Request Certificates of Residency, Indigency, and Barangay Clearances online. Automatically signed digitally with an authentic verifiable QR code.
              </p>
            </div>
            <button
              onClick={handlePortalRedirect}
              className="mt-6 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-gov-blue-600 dark:text-gov-blue-400 hover:text-gov-blue-800 dark:hover:text-gov-blue-300 group-hover:translate-x-1 transition-all text-left bg-transparent p-0 border-0 cursor-pointer"
            >
              Request Document
              <ChevronRight size={12} />
            </button>
          </div>

          {/* Card 2: Smart Appointments */}
          <div className="bg-white dark:bg-slate-900/80 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800/80 shadow-md dark:shadow-slate-950/50 hover:border-gov-blue-500/50 dark:hover:border-gov-blue-400/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-11 h-11 bg-gov-blue-50 dark:bg-gov-blue-950/80 text-gov-blue-600 dark:text-gov-blue-400 border border-gov-blue-200/60 dark:border-gov-blue-800/60 rounded-2xl flex items-center justify-center shadow-xs">
                <Calendar size={20} />
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Smart Appointments
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Book physical visits to the Barangay Hall ahead of time. Use our scheduling congestion risk visualizer to select the fastest, most optimal slots.
              </p>
            </div>
            <button
              onClick={handlePortalRedirect}
              className="mt-6 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-gov-blue-600 dark:text-gov-blue-400 hover:text-gov-blue-800 dark:hover:text-gov-blue-300 group-hover:translate-x-1 transition-all text-left bg-transparent p-0 border-0 cursor-pointer"
            >
              Book Appointment
              <ChevronRight size={12} />
            </button>
          </div>

          {/* Card 3: Incident / Blotter Reporting */}
          <div className="bg-white dark:bg-slate-900/80 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800/80 shadow-md dark:shadow-slate-950/50 hover:border-gov-blue-500/50 dark:hover:border-gov-blue-400/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-11 h-11 bg-gov-blue-50 dark:bg-gov-blue-950/80 text-gov-blue-600 dark:text-gov-blue-400 border border-gov-blue-200/60 dark:border-gov-blue-800/60 rounded-2xl flex items-center justify-center shadow-xs">
                <AlertOctagon size={20} />
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Secure Incident Reporting
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Submit confidential blotters, neighborhood dispute notifications, and community incident logs securely. Handled immediately by local officials.
              </p>
            </div>
            <button
              onClick={handlePortalRedirect}
              className="mt-6 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-gov-blue-600 dark:text-gov-blue-400 hover:text-gov-blue-800 dark:hover:text-gov-blue-300 group-hover:translate-x-1 transition-all text-left bg-transparent p-0 border-0 cursor-pointer"
            >
              Log Incident
              <ChevronRight size={12} />
            </button>
          </div>

          {/* Card 4: Business Permitting */}
          <div className="bg-white dark:bg-slate-900/80 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800/80 shadow-md dark:shadow-slate-950/50 hover:border-gov-blue-500/50 dark:hover:border-gov-blue-400/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-11 h-11 bg-gov-blue-50 dark:bg-gov-blue-950/80 text-gov-blue-600 dark:text-gov-blue-400 border border-gov-blue-200/60 dark:border-gov-blue-800/60 rounded-2xl flex items-center justify-center shadow-xs">
                <Briefcase size={20} />
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Business Clearance Fast-Track
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Register local businesses and apply for official Barangay Business Clearances. Track official review and process corresponding fee structures digitally.
              </p>
            </div>
            <button
              onClick={handlePortalRedirect}
              className="mt-6 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-gov-blue-600 dark:text-gov-blue-400 hover:text-gov-blue-800 dark:hover:text-gov-blue-300 group-hover:translate-x-1 transition-all text-left bg-transparent p-0 border-0 cursor-pointer"
            >
              Apply Clearance
              <ChevronRight size={12} />
            </button>
          </div>

        </div>

      </section>

      {/* 4. Real-time stats & portal block */}
      <section id="stats" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-br from-gov-blue-900 via-gov-blue-950 to-slate-900 dark:from-slate-900 dark:via-slate-950 dark:to-gov-blue-950 text-white rounded-[3rem] shadow-2xl overflow-hidden border border-gov-blue-800/40 dark:border-slate-800 select-none">
        
        {/* Glow Effects */}
        <div className="absolute top-[-20%] right-[-10%] w-[35vw] h-[35vw] bg-gov-gold-500/15 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[35vw] h-[35vw] bg-gov-blue-500/20 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left stats panel */}
          <div className="lg:col-span-5 space-y-6">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-white/10 text-gov-gold-300 border border-white/15 backdrop-blur-xs">
              Barangay Statistics
            </span>
            <h3 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight leading-tight">
              A Highly Connected, Active Digital Barangay
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              LingkodBrgAI actively monitors processing metrics and transaction statistics, improving resolution speeds and public transparent governance for thousands of residents.
            </p>
            <div className="pt-2">
              <button
                onClick={handlePortalRedirect}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-gov-gold-500 to-gov-gold-600 hover:from-gov-gold-600 hover:to-gov-gold-700 text-slate-950 font-black text-xs px-7.5 py-4 rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider"
              >
                Log In To Portal
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Right counters grid */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            
            {/* Stat 1 */}
            <div className="bg-white/10 dark:bg-slate-900/60 border border-white/15 dark:border-slate-800/80 p-6 rounded-3xl backdrop-blur-md space-y-2 hover:bg-white/15 dark:hover:bg-slate-800/60 transition-colors">
              <p className="text-4xl font-black font-display text-gov-gold-400">
                {liveStats !== null ? (liveStats.total_residents > 0 ? `${liveStats.total_residents.toLocaleString()}+` : liveStats.total_residents) : '...'}
              </p>
              <h5 className="font-extrabold text-[10px] uppercase text-slate-200 tracking-wider">Active Residents</h5>
              <p className="text-[9px] text-slate-300 font-medium">Verified local citizen profile records in database.</p>
            </div>

            {/* Stat 2 */}
            <div className="bg-white/10 dark:bg-slate-900/60 border border-white/15 dark:border-slate-800/80 p-6 rounded-3xl backdrop-blur-md space-y-2 hover:bg-white/15 dark:hover:bg-slate-800/60 transition-colors">
              <p className="text-4xl font-black font-display text-gov-blue-300">
                {liveStats !== null ? (liveStats.total_clearances > 0 ? `${liveStats.total_clearances.toLocaleString()}+` : liveStats.total_clearances) : '...'}
              </p>
              <h5 className="font-extrabold text-[10px] uppercase text-slate-200 tracking-wider">Clearances Issued</h5>
              <p className="text-[9px] text-slate-300 font-medium">Securely printed and digitally signed with QR signatures.</p>
            </div>

            {/* Stat 3 */}
            <div className="bg-white/10 dark:bg-slate-900/60 border border-white/15 dark:border-slate-800/80 p-6 rounded-3xl backdrop-blur-md space-y-2 hover:bg-white/15 dark:hover:bg-slate-800/60 transition-colors">
              <p className="text-4xl font-black font-display text-emerald-400">
                {liveStats !== null ? ((liveStats.active_incidents + liveStats.total_businesses) > 0 ? `${(liveStats.active_incidents + liveStats.total_businesses).toLocaleString()}+` : (liveStats.active_incidents + liveStats.total_businesses)) : '...'}
              </p>
              <h5 className="font-extrabold text-[10px] uppercase text-slate-200 tracking-wider">Active Permits &amp; Blotters</h5>
              <p className="text-[9px] text-slate-300 font-medium">Live registered business permits and active blotter cases.</p>
            </div>

            {/* Stat 4 */}
            <div className="bg-white/10 dark:bg-slate-900/60 border border-white/15 dark:border-slate-800/80 p-6 rounded-3xl backdrop-blur-md space-y-2 hover:bg-white/15 dark:hover:bg-slate-800/60 transition-colors flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full status-pulse"></span>
                <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                  {liveStats?.congestion_risk || 'LOW / OPTIMAL'}
                </span>
              </div>
              <h5 className="font-extrabold text-[10px] uppercase text-slate-200 tracking-wider mt-2.5">Hall Congestion Risk</h5>
              <p className="text-[9px] text-slate-300 font-medium">Current estimated lobby wait times under 5 minutes.</p>
            </div>

          </div>

        </div>

      </section>

      {/* 5. Interactive simulated AI Assistant Teaser Widget */}
      <section id="ai-assistant" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-b border-slate-200/80 dark:border-slate-800/80">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Block */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full bg-gov-blue-500/10 dark:bg-gov-blue-500/20 text-gov-blue-700 dark:text-gov-blue-300 border border-gov-blue-500/25">
              Artificial Intelligence
            </span>
            <h3 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight leading-tight text-slate-900 dark:text-white">
              Interactive Barangay AI Digital Advisor
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Get immediate, automated answers regarding local guidelines, registration rules, business requirements, and certificate fees.
            </p>
            
            <div className="space-y-3 pt-2">
              <p className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Select a query to test the AI Advisor:</p>
              <div className="flex flex-col gap-2">
                {aiPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAskAI(p)}
                    className={`w-full text-left p-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      activeQuestion === p.question
                        ? 'border-gov-blue-500 bg-gov-blue-50 dark:bg-gov-blue-950/80 text-gov-blue-900 dark:text-gov-blue-200 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 shadow-xs'
                    }`}
                  >
                    <span className="truncate pr-4">{p.question}</span>
                    <MessageSquareCode size={14} className="flex-shrink-0 text-slate-400 dark:text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right simulated Chat UI panel */}
          <div className="lg:col-span-7 flex justify-center">
            
            <div className="w-full max-w-xl h-[420px] rounded-[2.5rem] p-5 flex flex-col justify-between overflow-hidden glass-panel">
              
              {/* Fake Chat Header */}
              <div className="flex items-center gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-3 flex-shrink-0">
                <div className="w-9 h-9 bg-gradient-to-tr from-gov-blue-600 to-gov-blue-800 text-white rounded-xl flex items-center justify-center shadow-md">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Barangay AI Advisor</h4>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full status-pulse"></span>
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ready & Active</span>
                  </div>
                </div>
              </div>

              {/* Chat Dialog Content Area */}
              <div className="flex-1 py-4 overflow-y-auto space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300 select-text">
                {activeQuestion ? (
                  <>
                    {/* Citizen Question */}
                    <div className="flex items-end justify-end gap-2.5">
                      <div className="bg-gov-blue-600 text-white p-3.5 rounded-[1.5rem] rounded-br-none max-w-[85%] font-medium shadow-sm">
                        {activeQuestion}
                      </div>
                    </div>

                    {/* AI Answer Response */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 bg-slate-100 dark:bg-slate-800 text-gov-blue-600 dark:text-gov-blue-400 rounded-lg flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-700">
                        <Sparkles size={12} />
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-3.5 rounded-[1.5rem] rounded-bl-none max-w-[85%] leading-relaxed whitespace-pre-line font-medium border border-slate-200/80 dark:border-slate-700/80 shadow-xs relative">
                        {simulatedAnswer}
                        {isTyping && (
                          <span className="inline-block w-1.5 h-3.5 bg-gov-blue-600 dark:bg-gov-blue-400 ml-1 animate-pulse"></span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3.5 text-slate-500 dark:text-slate-400 select-none">
                    <MessageSquareCode size={36} className="text-slate-400 dark:text-slate-600 animate-bounce" />
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">LGU Simulated Advisor Channel</p>
                    <p className="text-[10px] max-w-xs font-medium text-slate-500 dark:text-slate-400">Select a predefined citizen query on the left to see the Barangay AI respond dynamically in real-time.</p>
                  </div>
                )}
              </div>

              {/* Fake Input footer */}
              <div className="border-t border-slate-200/80 dark:border-slate-800/80 pt-3 flex-shrink-0">
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Citizen Query Console</span>
                  <span className="text-[8px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 font-bold uppercase">Ready</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* 6. Document & Resident Account E-Verification Information Segment */}
      <section id="verify" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-b border-slate-200/80 dark:border-slate-800/80 text-center space-y-6">
        
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
            Secure Auditing & QR Scanner
          </span>
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Official QR & Document Verification Hub
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto font-medium leading-relaxed">
            Verify official Barangay Certificates, Indigency clearances, and Resident Digital QR Account IDs (<code className="text-gov-blue-600 dark:text-gov-blue-400 font-mono">QR-RES-...</code>) in real-time.
          </p>
        </div>

        <div className="max-w-2xl mx-auto p-8 rounded-[2.5rem] glass-panel grid grid-cols-1 sm:grid-cols-2 gap-8 items-center text-left">
          
          <div className="space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center shadow-xs">
                <ShieldCheck size={14} />
              </div>
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">LGU Cryptographic Ledger Check</h4>
            </div>
            
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Institutions, banks, law enforcement, and government agencies can scan or input any resident QR ID or certificate checksum hash to instantly verify official registration and clearance authenticity.
            </p>

            <ul className="space-y-2 text-[10px] font-bold text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
                Validates Resident Digital QR Accounts (<span className="font-mono">QR-RES-*</span>)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
                Tamper-Proof Certificate Checksums & Hashes
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
                Immediate Online Ledger Registry Audit
              </li>
            </ul>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-4">
            
            {/* Interactive QR Scanner Visual */}
            <div 
              onClick={() => setIsScannerOpen(true)}
              className="w-32 h-32 bg-white dark:bg-slate-900 border-4 border-gov-blue-500/20 dark:border-gov-blue-500/40 p-2.5 rounded-2xl relative shadow-inner cursor-pointer group hover:border-gov-blue-500 transition-all"
              title="Click to open QR Camera Scanner"
            >
              {/* Scanning visual overlay */}
              <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 top-1/2 animate-bounce"></div>
              
              {/* Camera overlay hover icon */}
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity rounded-xl">
                <Camera size={24} className="animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-wider mt-1">Scan QR</span>
              </div>

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
                placeholder="Paste QR ID (QR-RES-...) or Doc Hash..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 text-[10px] text-center font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-gov-blue-500"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-gov-blue-600 hover:bg-gov-blue-700 text-white font-bold text-[10px] py-2.5 rounded-2xl transition-colors uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  Verify Now
                </button>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="px-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl text-[10px] font-bold flex items-center justify-center transition-colors"
                  title="Open Camera Scanner"
                >
                  <Camera size={14} />
                </button>
              </div>
            </form>
          </div>

        </div>

      </section>

      {/* 7. Public Announcements Board */}
      <section id="announcements" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-b border-slate-200/80 dark:border-slate-800/80">
        
        <div className="text-center space-y-3 mb-16">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full bg-gov-red-500/10 dark:bg-gov-red-500/20 text-gov-red-700 dark:text-gov-red-400 border border-gov-red-500/25">
            LGU Bulletin
          </span>
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Latest Barangay Announcements & Alerts
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto font-medium leading-relaxed">
            Stay updated with official advisories, dental/medical health drives, neighborhood assembly meetings, and weather advisories published by your local officials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {announcements.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-slate-900/80 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/80 text-center space-y-2">
              <p className="font-extrabold text-sm text-slate-800 dark:text-slate-200">No Announcements Published Yet</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Official advisories will appear here once published by barangay officials in Settings.</p>
            </div>
          ) : (
            announcements.map((item) => (
              <div key={item.id} className="bg-white dark:bg-slate-900/80 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/80 shadow-md dark:shadow-slate-950/50 hover:shadow-xl transition-all flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span>{item.category || 'LGU Announcement'}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">{item.badge || 'Active'}</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    {item.content}
                  </p>
                </div>
                <div className="pt-6 border-t border-slate-200/60 dark:border-slate-800/60 mt-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-black text-gov-blue-700 dark:text-gov-blue-300">
                    {item.initials || 'BC'}
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200">{item.author || 'Office of the Captain'}</p>
                    <p className="text-[8px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{item.date}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </section>

      {/* 8. Professional Footer */}
      <footer className="relative z-10 bg-white dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-colors duration-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: LGU Seal Details */}
          <div className="space-y-4 col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 select-none">
              <div className="w-9 h-9 bg-gradient-to-tr from-gov-blue-600 to-gov-blue-800 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md shadow-gov-blue-500/20">
                B
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-gov-blue-900 dark:text-gov-blue-300">LingkodBrgyAi</h4>
                <p className="text-[8px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Local Government Unit Portal</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium max-w-sm">
              Providing secure, cryptographic, digital citizen services for residency certificate registry, business clearances, and scheduling for residents.
            </p>
            <p className="text-[10px] font-black text-gov-blue-700 dark:text-gov-blue-400 uppercase tracking-widest pt-2">
              Modern Governance • Connected Community
            </p>
          </div>

          {/* Col 2: Services shortcuts */}
          <div className="space-y-3">
            <h5 className="font-black text-[10px] uppercase text-slate-500 dark:text-slate-400 tracking-wider">E-Services Quicklinks</h5>
            <ul className="space-y-2 text-xs font-bold text-slate-600 dark:text-slate-300">
              <li><button onClick={handlePortalRedirect} className="hover:text-gov-blue-600 dark:hover:text-gov-blue-400 bg-transparent p-0 border-0 cursor-pointer transition-colors">E-Certificates</button></li>
              <li><button onClick={handlePortalRedirect} className="hover:text-gov-blue-600 dark:hover:text-gov-blue-400 bg-transparent p-0 border-0 cursor-pointer transition-colors">Local Appointments</button></li>
              <li><button onClick={handlePortalRedirect} className="hover:text-gov-blue-600 dark:hover:text-gov-blue-400 bg-transparent p-0 border-0 cursor-pointer transition-colors">Incident Blotters</button></li>
              <li><button onClick={handlePortalRedirect} className="hover:text-gov-blue-600 dark:hover:text-gov-blue-400 bg-transparent p-0 border-0 cursor-pointer transition-colors">Business Permits</button></li>
            </ul>
          </div>

          {/* Col 3: Hall Contact coordinates */}
          <div className="space-y-3">
            <h5 className="font-black text-[10px] uppercase text-slate-500 dark:text-slate-400 tracking-wider">Barangay Hall Contact</h5>
            <ul className="space-y-2.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              <li className="flex items-center gap-2">
                <MapPin size={13} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                {contactAddress}
              </li>
              <li className="flex items-center gap-2">
                <Phone size={13} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                {contactHotline}
              </li>
              <li className="flex items-center gap-2">
                <Mail size={13} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                {contactEmail}
              </li>
              <li className="flex items-center gap-2">
                <Clock size={13} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                {contactHours}
              </li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-200/60 dark:border-slate-800/60 pt-8 mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest select-none">
          <p>© 2026 Barangay Lawrence, Laguna. All Rights Reserved.</p>
          <p>dev • lawreene b aranas</p>
        </div>
      </footer>

      {/* Interactive Camera QR Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            
            <button
              onClick={() => setIsScannerOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gov-blue-500/10 text-gov-blue-600 dark:text-gov-blue-400 rounded-2xl flex items-center justify-center">
                <QrCode size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Barangay QR Scanner Hub
                </h3>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  Scan Resident ID Card or Document Hash
                </p>
              </div>
            </div>

            {/* Real Camera Scanner Viewport */}
            <div className="relative w-full aspect-square bg-slate-950 rounded-3xl overflow-hidden border-2 border-gov-blue-500/50 shadow-inner">
              
              {/* Hidden canvas for frame analysis */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Live video feed */}
              <video
                ref={videoRef}
                muted
                playsInline
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${cameraReady ? 'opacity-100' : 'opacity-0'}`}
              />

              {/* Corner framing brackets */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-gov-blue-400 rounded-tl-lg z-10" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-gov-blue-400 rounded-tr-lg z-10" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-gov-blue-400 rounded-bl-lg z-10" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-gov-blue-400 rounded-br-lg z-10" />

              {/* Scan laser line — shown only when camera is live */}
              {cameraReady && !cameraError && (
                <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent top-1/2 -translate-y-1/2 animate-pulse shadow-[0_0_15px_#34d399] z-10" />
              )}

              {/* Loading state */}
              {!cameraReady && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20">
                  <div className="w-8 h-8 border-2 border-gov-blue-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-slate-300">Starting camera…</p>
                </div>
              )}

              {/* Error state */}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 z-20">
                  <Camera size={36} className="text-rose-400" />
                  <p className="text-xs font-bold text-rose-300 text-center">{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="mt-2 px-4 py-2 bg-gov-blue-600 hover:bg-gov-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Live indicator badge */}
              {cameraReady && !cameraError && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-full z-10">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">Live Scanning</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Or enter Code / Hash manually:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verifyHash}
                  onChange={(e) => setVerifyHash(e.target.value)}
                  placeholder="e.g. QR-RES-LAWRENCE or hash..."
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-gov-blue-500"
                />
                <button
                  onClick={() => {
                    if (verifyHash.trim()) {
                      setIsScannerOpen(false);
                      navigate(`/verify/document/${verifyHash.trim()}`);
                    }
                  }}
                  className="bg-gov-blue-600 hover:bg-gov-blue-700 text-white font-extrabold text-xs px-5 rounded-2xl transition-colors uppercase tracking-wider"
                >
                  Verify
                </button>
              </div>
            </div>

          </div>
        </div>
      )}



    </div>
  );
};

export default Landing;

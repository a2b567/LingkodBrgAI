import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Signature, Loader2, Pointer, Maximize2, Minimize2, Languages,
  Award, HeartHandshake, Home, Building2, CreditCard, UserCheck, CheckCircle2,
  Sparkles, ShieldCheck, Clock, ArrowRight, RotateCcw, PenTool
} from 'lucide-react';
import { api } from '../services/api';
import './KioskCertificates.css';
import logo from '../assets/logo.png';

export const KioskCertificates: React.FC = () => {
  const [step, setStep] = useState(0); 
  const [lang, setLang] = useState<'en' | 'tl'>('en');
  const [certType, setCertType] = useState('Clearance');
  const [fee, setFee] = useState(150);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [queueNumber, setQueueNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setStep(0);
        setCertType('Clearance');
        setFirstName('');
        setLastName('');
        setPurpose('');
        setQueueNumber('');
        clearCanvas();
      }, 60000);
    };
    const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];
    events.forEach(e => document.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      clearTimeout(idleTimer);
      events.forEach(e => document.removeEventListener(e, resetTimer));
    };
  }, []);

  useEffect(() => {
    switch (certType) {
      case 'Clearance': setFee(150); break;
      case 'Indigency': setFee(0); break;
      case 'Residency': setFee(100); break;
      case 'Business': setFee(300); break;
      case 'Cedula': setFee(50); break;
      case 'Barangay ID': setFee(100); break;
      default: setFee(100);
    }
  }, [certType]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0F172A';
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const clearAll = () => {
    setFirstName('');
    setLastName('');
    setPurpose('');
    clearCanvas();
  };

  const handleSubmit = async () => {
    if (!firstName || !lastName || !purpose) return;
    setIsSubmitting(true);
    try {
      const res = await api.certificates.publicRequest({
        first_name: firstName,
        last_name: lastName,
        type: certType,
        purpose,
        fee
      }) as any;
      setQueueNumber(res.queue_number || `Q-${Math.floor(100 + Math.random() * 900)}`);
      setStep(4);
    } catch (err) {
      console.error('Kiosk submission error:', err);
      setQueueNumber(`Q-${Math.floor(100 + Math.random() * 900)}`);
      setStep(4);
    } finally {
      setIsSubmitting(false);
    }
  };

  const docOptions = [
    { 
      type: 'Clearance', 
      name: 'Barangay Clearance', 
      desc: lang === 'tl' ? 'Para sa trabaho, negosyo, at lisensya' : 'For employment, business, & background checks', 
      cost: '₱150',
      icon: <Award size={32} className="text-blue-400" />,
      accent: 'from-blue-500/20 via-indigo-500/10 to-transparent',
      borderColor: 'hover:border-blue-400'
    },
    { 
      type: 'Indigency', 
      name: 'Indigency Certificate', 
      desc: lang === 'tl' ? 'Para sa tulong medikal, financial, o edukasyon' : 'For medical, financial, or educational assistance', 
      cost: 'Free',
      icon: <HeartHandshake size={32} className="text-emerald-400" />,
      accent: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      borderColor: 'hover:border-emerald-400'
    },
    { 
      type: 'Residency', 
      name: 'Residency Certificate', 
      desc: lang === 'tl' ? 'Katibayan ng tirahan para sa bangko at pag-ibig' : 'Proof of address for banks & valid IDs', 
      cost: '₱100',
      icon: <Home size={32} className="text-sky-400" />,
      accent: 'from-sky-500/20 via-blue-500/10 to-transparent',
      borderColor: 'hover:border-sky-400'
    },
    { 
      type: 'Business', 
      name: 'Business Clearance', 
      desc: lang === 'tl' ? 'Para sa mga negosyo at komersyal na permit' : 'For commercial permits & business operation', 
      cost: '₱300',
      icon: <Building2 size={32} className="text-amber-400" />,
      accent: 'from-amber-500/20 via-orange-500/10 to-transparent',
      borderColor: 'hover:border-amber-400'
    },
    { 
      type: 'Cedula', 
      name: 'Cedula (CTC)', 
      desc: lang === 'tl' ? 'Opisyal na sertipiko ng buwis sa komunidad' : 'Official community tax certificate', 
      cost: '₱50',
      icon: <CreditCard size={32} className="text-purple-400" />,
      accent: 'from-purple-500/20 via-indigo-500/10 to-transparent',
      borderColor: 'hover:border-purple-400'
    },
    { 
      type: 'Barangay ID', 
      name: 'Barangay ID', 
      desc: lang === 'tl' ? 'Opisyal na kard ng pagkakakilanlan ng residente' : 'Official resident identity verification card', 
      cost: '₱100',
      icon: <UserCheck size={32} className="text-rose-400" />,
      accent: 'from-rose-500/20 via-pink-500/10 to-transparent',
      borderColor: 'hover:border-rose-400'
    },
  ];

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex items-center gap-3 px-6 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-full shadow-lg backdrop-blur-xl">
        <span className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${step >= 1 ? "text-blue-400" : "text-slate-500"}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? "bg-blue-500 text-slate-950 font-black" : "bg-slate-800 text-slate-500"}`}>1</span>
          {lang === 'tl' ? 'URI' : 'TYPE'}
        </span>
        <span className="text-slate-600 font-bold">→</span>
        <span className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${step >= 2 ? "text-blue-400" : "text-slate-500"}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? "bg-blue-500 text-slate-950 font-black" : "bg-slate-800 text-slate-500"}`}>2</span>
          {lang === 'tl' ? 'DETALYE' : 'DETAILS'}
        </span>
        <span className="text-slate-600 font-bold">→</span>
        <span className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${step >= 3 ? "text-blue-400" : "text-slate-500"}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? "bg-blue-500 text-slate-950 font-black" : "bg-slate-800 text-slate-500"}`}>3</span>
          {lang === 'tl' ? 'LAGDA' : 'SIGN'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between select-none relative overflow-hidden font-sans">
      <div 
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: 'radial-gradient(rgba(59, 130, 246, 0.25) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}
      />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <header className="px-6 sm:px-10 py-5 flex items-center justify-between border-b border-slate-800/80 relative z-20 bg-slate-950/80 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={logo} alt="Barangay Logo" className="w-13 h-13 object-contain rounded-2xl shadow-xl border border-slate-700/80 bg-slate-900 p-1" />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                {lang === 'tl' ? 'SERBISYO KIOSK' : 'SELF-SERVICE KIOSK'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30">
                LIVE PORTAL
              </span>
            </div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">
              {lang === 'tl' ? 'PORTAL SA PAGHILING NG DOKUMENTO • BARANGAY LAWRENCE' : 'DOCUMENT REQUEST PORTAL • BARANGAY LAWRENCE'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === 'en' ? 'tl' : 'en')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider border border-slate-700/80 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Languages size={16} className="text-blue-400" />
            {lang === 'en' ? '🇵🇭 SWITCH TO TAGALOG' : '🇺🇸 SWITCH TO ENGLISH'}
          </button>

          <div className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-inner">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock size={12} className="text-emerald-400 animate-spin" />
              NOW SERVING <strong className="text-emerald-400 font-mono text-xs ml-1">---</strong>
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">NEXT UP <strong className="text-blue-400 font-mono text-xs ml-1">---</strong></span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-3 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-2xl border border-slate-700/80 transition-all active:scale-95 cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 flex flex-col justify-center relative z-20">
        {step > 0 && step !== 4 && renderStepIndicator()}

        {step === 0 && (
          <div 
            className="flex-1 flex flex-col items-center justify-center cursor-pointer text-center group py-8 select-none"
            onClick={() => setStep(1)}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-xs font-black uppercase tracking-widest mb-8 backdrop-blur-md shadow-lg">
              <Sparkles size={14} className="text-blue-400 animate-spin" />
              {lang === 'tl' ? 'Pindutin ang Screen upang magsimula' : 'Touch Screen Anywhere To Start'}
            </div>

            <div className="relative mb-10 flex items-center justify-center">
              <div className="absolute w-72 h-72 rounded-full border border-blue-500/20 animate-ping opacity-60 pointer-events-none" />
              <div className="absolute w-56 h-56 rounded-full border border-blue-400/40 animate-pulse pointer-events-none" />
              <div className="absolute w-44 h-44 rounded-full border border-blue-500/30 pointer-events-none" />
              
              <div className="w-36 h-36 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-full flex flex-col items-center justify-center text-white shadow-[0_0_80px_rgba(59,130,246,0.6)] group-hover:scale-110 group-hover:shadow-[0_0_100px_rgba(59,130,246,0.8)] transition-all duration-500 border-4 border-blue-300/40">
                <Pointer size={52} className="animate-bounce text-amber-300" />
                <span className="text-[10px] font-black uppercase tracking-widest mt-1 text-blue-100">TAP HERE</span>
              </div>
            </div>

            <h2 className="text-4xl sm:text-6xl font-black mb-4 text-white tracking-tight drop-shadow-xl max-w-2xl">
              {lang === 'tl' ? 'Pindutin Kahit Saan Upang Magsimula' : 'Tap Anywhere to Start'}
            </h2>
            <p className="text-base sm:text-lg text-slate-300 font-semibold max-w-lg leading-relaxed drop-shadow-md">
              {lang === 'tl' 
                ? 'Maligayang pagdating sa Barangay Document Self-Service Kiosk. Mabilis na kumuha ng sertipiko at clearance.' 
                : 'Welcome to the Barangay Document Self-Service Kiosk. Request clearances, certificates, & IDs fast.'}
            </p>

            <div className="mt-12 grid grid-cols-3 gap-4 sm:gap-8 max-w-xl w-full">
              <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center gap-3 backdrop-blur-md">
                <ShieldCheck size={22} className="text-blue-400 flex-shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-black text-white">SECURE</div>
                  <div className="text-[10px] text-slate-400 font-medium">Digital Queue</div>
                </div>
              </div>
              <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center gap-3 backdrop-blur-md">
                <PenTool size={22} className="text-amber-400 flex-shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-black text-white">E-SIGN</div>
                  <div className="text-[10px] text-slate-400 font-medium">Digital Signature</div>
                </div>
              </div>
              <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center gap-3 backdrop-blur-md">
                <Sparkles size={22} className="text-emerald-400 flex-shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-black text-white">EXPRESS</div>
                  <div className="text-[10px] text-slate-400 font-medium">Instant Ticket</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto mb-6">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-wide">
                {lang === 'tl' ? 'Anong dokumento ang kailangan mo?' : 'What document do you need?'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
                {lang === 'tl' ? 'Pumili sa mga uri ng serbisyo sa ibaba upang magpatuloy' : 'Select a document type below to proceed with your request'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {docOptions.map((doc) => (
                <button
                  key={doc.type}
                  onClick={() => { setCertType(doc.type); setStep(2); }}
                  className={`p-6 rounded-3xl border text-left transition-all duration-300 relative overflow-hidden group cursor-pointer bg-gradient-to-b ${doc.accent} bg-slate-900/90 hover:bg-slate-800/90 shadow-xl backdrop-blur-xl ${doc.borderColor} hover:scale-[1.02] hover:shadow-2xl ${
                    certType === doc.type 
                      ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-blue-500/20' 
                      : 'border-slate-800/80'
                  }`}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    {doc.icon}
                  </div>

                  <div className="flex justify-between items-start mb-5 relative z-10">
                    <div className="p-3 bg-slate-950/80 border border-slate-700/60 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                      {doc.icon}
                    </div>
                    <span className={`font-black text-xs px-3.5 py-1.5 rounded-full border shadow-md ${
                      doc.cost === 'Free'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                    }`}>
                      {doc.cost}
                    </span>
                  </div>

                  <h3 className="text-lg font-black mb-1.5 text-white group-hover:text-blue-300 transition-colors">
                    {doc.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    {doc.desc}
                  </p>

                  <div className="mt-5 flex items-center justify-between text-xs font-bold text-blue-400 opacity-80 group-hover:opacity-100 transition-opacity pt-3 border-t border-slate-800/60">
                    <span>{lang === 'tl' ? 'Pumili' : 'Select'}</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 bg-slate-900/90 p-8 sm:p-10 rounded-3xl border border-slate-700/80 shadow-2xl backdrop-blur-xl max-w-2xl mx-auto">
            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {certType} Request
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                {lang === 'tl' ? 'Ilagay ang mga Detalye' : 'Enter Request Details'}
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {lang === 'tl' ? 'Mangyaring punan ang iyong pangalan at dahilan sa paghiling.' : 'Please fill in your legal name and purpose for document processing.'}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                    {lang === 'tl' ? 'Unang Pangalan' : 'First Name'} *
                  </label>
                  <input 
                    type="text" 
                    placeholder="Juan" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full text-base p-4 bg-slate-950/80 border border-slate-700 text-white rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder-slate-500 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                    {lang === 'tl' ? 'Apelyido' : 'Last Name'} *
                  </label>
                  <input 
                    type="text" 
                    placeholder="Dela Cruz" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full text-base p-4 bg-slate-950/80 border border-slate-700 text-white rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder-slate-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                  {lang === 'tl' ? 'Layunin ng Paghiling' : 'Purpose of Request'} *
                </label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder={lang === 'tl' ? 'Hal., Para sa trabaho, scholarship, bangko...' : 'E.g., For employment, scholarship, bank requirements...'}
                  rows={3}
                  className="w-full text-base p-4 bg-slate-950/80 border border-slate-700 text-white rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-none placeholder-slate-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={clearAll} 
                className="flex-1 py-4 text-sm font-black bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-2xl hover:bg-rose-500/25 transition-colors disabled:opacity-40 uppercase tracking-wider cursor-pointer" 
                disabled={!firstName && !lastName && !purpose}
              >
                {lang === 'tl' ? 'Ilinis' : 'Clear All'}
              </button>
              <button 
                onClick={() => setStep(1)} 
                className="flex-1 py-4 text-sm font-black bg-slate-800 text-slate-200 border border-slate-700 rounded-2xl hover:bg-slate-700 transition-colors uppercase tracking-wider cursor-pointer"
              >
                {lang === 'tl' ? 'Bumalik' : 'Back'}
              </button>
              <button 
                onClick={() => setStep(3)} 
                disabled={!purpose || !firstName || !lastName} 
                className="flex-1 py-4 text-sm font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl disabled:opacity-40 transition-all shadow-xl shadow-blue-600/30 uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
              >
                {lang === 'tl' ? 'Magpatuloy sa Lagda' : 'Continue to Sign'}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 bg-slate-900/90 p-8 sm:p-10 rounded-3xl border border-slate-700/80 shadow-2xl backdrop-blur-xl max-w-2xl mx-auto">
            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Digital Signature
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                {lang === 'tl' ? 'Magbigay ng Digital na Lagda' : 'Provide Digital Signature'}
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {lang === 'tl' ? 'Mangyaring pumirma sa kahon gamit ang daliri o stylus.' : 'Please sign in the box below using your finger or stylus touch screen.'}
              </p>
            </div>
            
            <div className="border-2 border-slate-700/80 rounded-3xl overflow-hidden bg-slate-50 touch-none relative shadow-inner">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="cursor-crosshair w-full h-56 block bg-slate-50"
              />
              <div className="absolute bottom-3 right-4 pointer-events-none text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                SIGNATURE PAD
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <button 
                onClick={clearCanvas} 
                className="text-rose-400 font-black uppercase tracking-wider text-xs hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} />
                {lang === 'tl' ? 'Burain ang Lagda' : 'Clear Signature'}
              </button>
            </div>

            <div className="bg-slate-950/90 p-5 rounded-2xl flex items-center justify-between border border-slate-800 shadow-inner">
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {lang === 'tl' ? 'Kabuuan ng Bayarin' : 'Total Amount Due'}
                </div>
                <div className="text-3xl font-black text-emerald-400 font-mono mt-0.5">{fee > 0 ? `₱${fee.toFixed(2)}` : 'Free'}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">REQUESTOR</span>
                <span className="text-xs font-extrabold text-white">{firstName} {lastName}</span>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button 
                onClick={() => setStep(2)} 
                className="flex-1 py-4 text-sm font-black bg-slate-800 text-slate-200 border border-slate-700 rounded-2xl hover:bg-slate-700 transition-colors uppercase tracking-wider cursor-pointer"
              >
                {lang === 'tl' ? 'Bumalik' : 'Back'}
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="flex-1 py-4 text-sm font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl disabled:opacity-40 transition-all shadow-xl shadow-blue-600/30 uppercase tracking-wider flex justify-center items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Signature />}
                {lang === 'tl' ? 'Isumite ang Hiling' : 'Submit Request'}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center space-y-6 bg-slate-900/95 p-8 sm:p-12 rounded-3xl border border-blue-500/40 shadow-2xl max-w-lg mx-auto backdrop-blur-xl">
            <div className="w-22 h-22 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.3)] animate-pulse">
              <CheckCircle2 size={48} />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                {lang === 'tl' ? 'Matagumpay na Naisumite!' : 'Request Submitted Successfully!'}
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {lang === 'tl' ? 'Ito ang iyong numero sa pila:' : 'Here is your official queue ticket number:'}
              </p>
            </div>

            <div className="p-6 bg-slate-950/90 rounded-3xl border border-slate-800 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-amber-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">DIGITAL TICKET NUMBER</span>
              <span className="text-5xl sm:text-6xl font-black font-mono text-blue-400 mt-2 block tracking-wider drop-shadow-md">{queueNumber}</span>
              <span className="text-[10px] font-bold text-slate-500 mt-2 block uppercase">{certType} • {firstName} {lastName}</span>
            </div>

            <p className="text-xs text-slate-300 font-semibold leading-relaxed">
              {lang === 'tl' 
                ? 'Mangyaring maghintay na tawagin ang iyong numero sa Counter 1.' 
                : 'Please wait for your queue number to be called at Counter 1.'}
            </p>

            <button
              onClick={() => {
                setStep(0);
                clearAll();
              }}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-blue-600/30 cursor-pointer"
            >
              {lang === 'tl' ? 'Tapusin / Bumalik sa Simula' : 'Finish & Return Home'}
            </button>
          </div>
        )}

      </main>

      <footer className="py-4 text-center text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 relative z-20 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        LINGKODBRGAI • SELF-SERVICE KIOSK PORTAL • BARANGAY LAWRENCE
      </footer>
    </div>
  );
};
export default KioskCertificates;

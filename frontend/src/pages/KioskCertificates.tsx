import React, { useState, useEffect, useRef } from 'react';
import { FileText, Signature, Loader2, Pointer, Maximize2, Minimize2, Languages } from 'lucide-react';
import { api } from '../services/api';
import './KioskCertificates.css';
import logo from '../assets/logo.png';

export const KioskCertificates: React.FC = () => {
  const [step, setStep] = useState(0); // 0: Welcome, 1: Select Type, 2: Details, 3: Sign, 4: Success
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

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Idle Timeout logic to return to welcome screen after 60 seconds of inactivity
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
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
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
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000080';
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

  const stopDrawing = () => setIsDrawing(false);
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const clearAll = () => {
    setStep(0);
    setCertType('Clearance');
    setFirstName('');
    setLastName('');
    setPurpose('');
    setQueueNumber('');
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSubmit = async () => {
    if (!firstName || !lastName) return alert(lang === 'tl' ? "Mangyaring ilagay ang iyong buong pangalan" : "Please enter your full name");
    if (!purpose) return alert(lang === 'tl' ? "Mangyaring ilagay ang layunin" : "Please enter a purpose");
    setIsSubmitting(true);
    try {
      const resp = await api.certificates.publicRequest({
        first_name: firstName,
        last_name: lastName,
        type: certType,
        purpose,
        fee
      }) as any;
      setQueueNumber(resp.queue_number || "A-101");
      setStep(4);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const docOptions = [
    { 
      type: 'Clearance', 
      name: 'Barangay Clearance', 
      desc: lang === 'tl' ? 'Para sa trabaho at lisensya' : 'For employment & background checks', 
      cost: '₱150' 
    },
    { 
      type: 'Indigency', 
      name: 'Indigency Certificate', 
      desc: lang === 'tl' ? 'Para sa tulong medikal o edukasyon' : 'For medical or educational assistance', 
      cost: 'Free' 
    },
    { 
      type: 'Residency', 
      name: 'Residency Certificate', 
      desc: lang === 'tl' ? 'Katibayan ng tirahan para sa bangko' : 'Proof of address for banks & IDs', 
      cost: '₱100' 
    },
    { 
      type: 'Business', 
      name: 'Business Clearance', 
      desc: lang === 'tl' ? 'Para sa permit ng negosyo' : 'For business permits', 
      cost: '₱300' 
    },
    { 
      type: 'Cedula', 
      name: 'Cedula (CTC)', 
      desc: lang === 'tl' ? 'Sertipiko ng buwis sa komunidad' : 'Community tax certificate', 
      cost: '₱50' 
    },
    { 
      type: 'Barangay ID', 
      name: 'Barangay ID', 
      desc: lang === 'tl' ? 'Opisyal na kard ng pagkakakilanlan' : 'Official identification card', 
      cost: '₱100' 
    },
  ];

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-slate-400">
        <span className={step >= 1 ? "text-blue-400 font-extrabold" : "text-slate-500"}>
          {lang === 'tl' ? '1. URI' : '1. TYPE'}
        </span>
        <span className="text-slate-600">→</span>
        <span className={step >= 2 ? "text-blue-400 font-extrabold" : "text-slate-500"}>
          {lang === 'tl' ? '2. DETALYE' : '2. DETAILS'}
        </span>
        <span className="text-slate-600">→</span>
        <span className={step >= 3 ? "text-blue-400 font-extrabold" : "text-slate-500"}>
          {lang === 'tl' ? '3. LAGDA' : '3. SIGN'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A1628] text-white flex flex-col justify-between select-none relative overflow-hidden font-sans">
      {/* Background Subtle Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Kiosk Header Bar */}
      <header className="px-8 py-5 flex items-center justify-between border-b border-slate-800/80 relative z-20 bg-[#0A1628]/90 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Barangay Logo" className="w-12 h-12 object-contain rounded-2xl shadow-lg border border-slate-700" />
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-wider">
              {lang === 'tl' ? 'SERBISYO KIOSK' : 'SELF-SERVICE KIOSK'}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {lang === 'tl' ? 'PORTAL SA PAGHILING NG DOKUMENTO' : 'DOCUMENT REQUEST PORTAL'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Tagalog Language Switcher */}
          <button
            onClick={() => setLang(lang === 'en' ? 'tl' : 'en')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider border border-slate-700 transition-colors"
          >
            <Languages size={15} className="text-blue-400" />
            {lang === 'en' ? '🇵🇭 SWITCH TO TAGALOG' : '🇺🇸 SWITCH TO ENGLISH'}
          </button>

          {/* Live Serving Ticker Badge */}
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-wider">
            <span className="text-slate-400">NOW SERVING <strong className="text-emerald-400 ml-1">---</strong></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">NEXT UP <strong className="text-blue-400 ml-1">---</strong></span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* Main Interactive Screen Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 flex flex-col justify-center relative z-20">
        {step > 0 && step !== 4 && renderStepIndicator()}

        {/* Step 0: Welcome Tap Screen */}
        {step === 0 && (
          <div 
            className="flex-1 flex flex-col items-center justify-center cursor-pointer text-center group py-12"
            onClick={() => setStep(1)}
          >
            {/* Outer Ripple Rings */}
            <div className="relative mb-10 flex items-center justify-center">
              <div className="absolute w-56 h-56 rounded-full border border-blue-500/20 animate-ping opacity-75"></div>
              <div className="absolute w-44 h-44 rounded-full border border-blue-500/40"></div>
              <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-[0_0_60px_rgba(37,99,235,0.6)] group-hover:scale-110 transition-transform duration-500">
                <Pointer size={56} className="animate-pulse" />
              </div>
            </div>

            <h2 className="text-5xl font-black mb-4 text-white tracking-tight drop-shadow-lg">
              {lang === 'tl' ? 'Pindutin Kahit Saan Upang Magsimula' : 'Tap Anywhere to Start'}
            </h2>
            <p className="text-lg text-slate-300 font-medium max-w-md leading-relaxed">
              {lang === 'tl' 
                ? 'Maligayang pagdating sa Barangay Document Self-Service Kiosk' 
                : 'Welcome to the Barangay Document Self-Service Kiosk'}
            </p>
          </div>
        )}

        {/* Step 1: Select Document Type */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-center mb-8 text-white tracking-wide">
              {lang === 'tl' ? 'Anong dokumento ang kailangan mo?' : 'What document do you need?'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {docOptions.map((doc) => (
                <button
                  key={doc.type}
                  onClick={() => { setCertType(doc.type); setStep(2); }}
                  className={`p-6 rounded-3xl border text-left transition-all relative overflow-hidden group ${
                    certType === doc.type 
                      ? 'border-blue-500 bg-slate-900/90 shadow-xl shadow-blue-500/20' 
                      : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-blue-500/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <FileText size={28} className="text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="font-extrabold text-sm bg-slate-800 text-slate-200 px-3.5 py-1.5 rounded-xl border border-slate-700">
                      {doc.cost}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-1 text-white">{doc.name}</h3>
                  <p className="text-xs text-slate-400 leading-normal">{doc.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Enter Resident Details & Purpose */}
        {step === 2 && (
          <div className="space-y-6 bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-2xl">
            <h2 className="text-2xl font-black text-white">
              {lang === 'tl' ? 'Ilagay ang mga Detalye' : 'Enter Request Details'}
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    {lang === 'tl' ? 'Unang Pangalan' : 'First Name'}
                  </label>
                  <input 
                    type="text" 
                    placeholder="Juan" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full text-base p-4 bg-slate-950 border border-slate-700 text-white rounded-2xl focus:outline-none focus:border-blue-500 placeholder-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    {lang === 'tl' ? 'Apelyido' : 'Last Name'}
                  </label>
                  <input 
                    type="text" 
                    placeholder="Dela Cruz" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full text-base p-4 bg-slate-950 border border-slate-700 text-white rounded-2xl focus:outline-none focus:border-blue-500 placeholder-slate-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {lang === 'tl' ? 'Layunin ng Paghiling' : 'Purpose of Request'}
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder={lang === 'tl' ? 'Hal., Para sa trabaho, scholarship, bangko...' : 'E.g., For employment, scholarship, bank requirements...'}
                rows={3}
                className="w-full text-base p-4 bg-slate-950 border border-slate-700 text-white rounded-2xl focus:outline-none focus:border-blue-500 resize-none placeholder-slate-500"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={clearAll} 
                className="flex-1 py-3.5 text-base font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-2xl hover:bg-rose-500/30 transition-colors disabled:opacity-40" 
                disabled={!firstName && !lastName && !purpose}
              >
                {lang === 'tl' ? 'Ilinis' : 'Clear All'}
              </button>
              <button 
                onClick={() => setStep(1)} 
                className="flex-1 py-3.5 text-base font-bold bg-slate-800 text-slate-200 border border-slate-700 rounded-2xl hover:bg-slate-700 transition-colors"
              >
                {lang === 'tl' ? 'Bumalik' : 'Back'}
              </button>
              <button 
                onClick={() => setStep(3)} 
                disabled={!purpose || !firstName || !lastName} 
                className="flex-1 py-3.5 text-base font-bold bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-40 transition-colors shadow-lg shadow-blue-600/30"
              >
                {lang === 'tl' ? 'Magpatuloy sa Lagda' : 'Continue to Sign'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Digital Signature Pad */}
        {step === 3 && (
          <div className="space-y-6 bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-2xl">
            <h2 className="text-2xl font-black text-white">
              {lang === 'tl' ? 'Magbigay ng Digital na Lagda' : 'Provide Digital Signature'}
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'tl' ? 'Mangyaring pumirma sa kahon gamit ang daliri o stylus.' : 'Please sign in the box below using your finger or a stylus.'}
            </p>
            
            <div className="border-2 border-slate-700 rounded-3xl overflow-hidden bg-white touch-none">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="cursor-crosshair w-full h-56 block bg-white"
              />
            </div>
            
            <button 
              onClick={clearCanvas} 
              className="text-rose-400 font-bold uppercase tracking-wider text-xs hover:underline"
            >
              {lang === 'tl' ? 'Burain ang Lagda' : 'Clear Signature'}
            </button>

            <div className="bg-slate-950 p-5 rounded-2xl flex items-center justify-between border border-slate-800">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {lang === 'tl' ? 'Kabuuan ng Bayarin' : 'Total Amount Due'}
                </div>
                <div className="text-3xl font-black text-blue-400">{fee > 0 ? `₱${fee.toFixed(2)}` : 'Free'}</div>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button 
                onClick={() => setStep(2)} 
                className="flex-1 py-3.5 text-base font-bold bg-slate-800 text-slate-200 border border-slate-700 rounded-2xl hover:bg-slate-700 transition-colors"
              >
                {lang === 'tl' ? 'Bumalik' : 'Back'}
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="flex-1 py-3.5 text-base font-bold bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-40 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-blue-600/30"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Signature />}
                {lang === 'tl' ? 'Isumite ang Hiling' : 'Submit Request'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success Ticket Screen */}
        {step === 4 && (
          <div className="text-center space-y-6 bg-slate-900/90 p-10 rounded-3xl border border-blue-500/30 shadow-2xl max-w-lg mx-auto">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <Signature size={40} />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">
                {lang === 'tl' ? 'Matagumpay na Naisumite!' : 'Request Submitted Successfully!'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'tl' ? 'Ito ang iyong numero sa pila:' : 'Here is your queue ticket number:'}
              </p>
            </div>

            <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">TICKET NUMBER</span>
              <span className="text-5xl font-black font-mono text-blue-400 mt-2 block tracking-wider">{queueNumber}</span>
            </div>

            <p className="text-xs text-slate-400">
              {lang === 'tl' 
                ? 'Mangyaring maghintay na tawagin ang iyong numero sa Counter 1.' 
                : 'Please wait for your queue number to be called at Counter 1.'}
            </p>

            <button
              onClick={() => setStep(0)}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition-colors shadow-lg shadow-blue-600/30"
            >
              {lang === 'tl' ? 'Tapusin / Bumalik' : 'Finish & Return Home'}
            </button>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 relative z-20 border-t border-slate-800/80">
        LINGKODBRGAI • SELF-SERVICE KIOSK PORTAL
      </footer>
    </div>
  );
};
export default KioskCertificates;

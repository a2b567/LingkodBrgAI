import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle2, ArrowLeft, Signature, Loader2, Pointer } from 'lucide-react';
import { api } from '../services/api';
// Removed unused Resident type import
import './KioskCertificates.css';
export const KioskCertificates: React.FC = () => {
  const navigate = useNavigate();
  
  // isStaff removed (not needed)

  const [step, setStep] = useState(0); // 0: Welcome, 1: Select Type, 2: Resident & Purpose, 3: Sign, 4: Success
  const [certType, setCertType] = useState('Clearance');
  const [fee, setFee] = useState(150);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Removed resident fetching since this is public

  // Idle Timeout logic to return to landing page
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        // Reset Kiosk if idle for 60 seconds
        setStep(0);
        setCertType('Clearance');
        setFirstName('');
        setLastName('');
        setPurpose('');
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

  const handleSubmit = async () => {
    if (!firstName || !lastName) return alert("Please enter your full name");
    if (!purpose) return alert("Please enter a purpose");
    setIsSubmitting(true);
    try {
      await api.certificates.publicRequest({
        first_name: firstName,
        last_name: lastName,
        type: certType,
        purpose,
        fee
      });
      setStep(4);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-wider">
        <span className={step >= 1 ? "text-gov-blue-600 dark:text-gov-blue-400" : "text-slate-400"}>1. Type</span>
        <span className="text-slate-300">→</span>
        <span className={step >= 2 ? "text-gov-blue-600 dark:text-gov-blue-400" : "text-slate-400"}>2. Details</span>
        <span className="text-slate-300">→</span>
        <span className={step >= 3 ? "text-gov-blue-600 dark:text-gov-blue-400" : "text-slate-400"}>3. Sign</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-8 flex flex-col">
      <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-tr from-gov-blue-600 to-gov-blue-800 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg">B</div>
          <div>
            <h1 className="text-3xl font-black text-gov-blue-900 dark:text-gov-blue-300 uppercase">Self-Service Kiosk</h1>
            <p className="text-sm font-bold text-slate-500 tracking-widest uppercase">Document Request Portal</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/certificates')}
          className="flex items-center gap-2 px-6 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-2xl font-bold transition-colors"
        >
          <ArrowLeft size={20} />
          Exit Kiosk
        </button>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto flex flex-col justify-center">
        {step > 0 && step !== 4 && renderStepIndicator()}

        {step === 0 && (
          <div 
            className="flex-1 flex flex-col items-center justify-center animate-fade-in cursor-pointer text-center h-full group"
            onClick={() => setStep(1)}
          >
            <div className="w-40 h-40 bg-gradient-to-br from-gov-blue-500 to-gov-blue-700 rounded-full flex items-center justify-center text-white mb-12 shadow-2xl shadow-gov-blue-600/40 group-hover:scale-110 transition-transform duration-500 animate-pulse">
              <Pointer size={80} />
            </div>
            <h2 className="text-6xl font-black mb-6 text-slate-900 dark:text-white">Tap Anywhere to Start</h2>
            <p className="text-2xl text-slate-500 dark:text-slate-400">Welcome to the Barangay Document Self-Service Kiosk</p>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-3xl font-extrabold text-center mb-8">What document do you need?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { type: 'Clearance', name: 'Barangay Clearance', icon: FileText, desc: 'For employment & background checks', cost: '₱150' },
                { type: 'Indigency', name: 'Indigency Certificate', icon: FileText, desc: 'For medical or educational assistance', cost: 'Free' },
                { type: 'Residency', name: 'Residency Certificate', icon: FileText, desc: 'Proof of address for banks & IDs', cost: '₱100' },
                { type: 'Business', name: 'Business Clearance', icon: FileText, desc: 'For business permits', cost: '₱300' },
                { type: 'Cedula', name: 'Cedula (CTC)', icon: FileText, desc: 'Community tax certificate', cost: '₱50' },
              ].map(doc => (
                <button
                  key={doc.type}
                  onClick={() => { setCertType(doc.type); setStep(2); }}
                  className={`p-6 rounded-3xl border-2 text-left transition-all ${
                    certType === doc.type 
                      ? 'border-gov-blue-500 bg-gov-blue-50 dark:bg-gov-blue-900/20 shadow-lg shadow-gov-blue-500/20' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gov-blue-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <doc.icon size={32} className={certType === doc.type ? 'text-gov-blue-600' : 'text-slate-400'} />
                    <span className="font-black text-lg bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">{doc.cost}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{doc.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{doc.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in space-y-8 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
            <h2 className="text-2xl font-extrabold mb-6">Enter Request Details</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-slate-500">First Name</label>
                  <input 
                    type="text" 
                    placeholder="Juan" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full text-lg p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-gov-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-slate-500">Last Name</label>
                  <input 
                    type="text" 
                    placeholder="Dela Cruz" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full text-lg p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-gov-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold uppercase tracking-wider text-slate-500">Purpose of Request</label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="E.g., For employment, scholarship, bank requirements..."
                rows={3}
                className="w-full text-lg p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-gov-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setStep(1)} className="flex-1 py-4 text-lg font-bold bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Back</button>
              <button onClick={() => setStep(3)} disabled={!purpose || !firstName || !lastName} className="flex-1 py-4 text-lg font-bold bg-gov-blue-600 text-white rounded-2xl hover:bg-gov-blue-700 disabled:opacity-50 transition-colors">Continue to Sign</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in space-y-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
            <h2 className="text-2xl font-extrabold">Provide Digital Signature</h2>
            <p className="text-slate-500 dark:text-slate-400">Please sign in the box below using your finger or a stylus.</p>
            
            <div className="border-2 border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden bg-white touch-none">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="cursor-crosshair w-full h-64 block canvas"
  
              />
            </div>
            
            <button onClick={clearCanvas} className="text-rose-500 font-bold uppercase tracking-wider text-sm hover:underline">Clear Signature</button>

            <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl flex items-center justify-between border border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Amount Due</div>
                <div className="text-3xl font-black text-gov-blue-600 dark:text-gov-blue-400">{fee > 0 ? `₱${fee.toFixed(2)}` : 'Free'}</div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setStep(2)} className="flex-1 py-4 text-lg font-bold bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Back</button>
              <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 py-4 text-lg font-bold bg-gov-blue-600 text-white rounded-2xl hover:bg-gov-blue-700 disabled:opacity-50 transition-colors flex justify-center items-center gap-2">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Signature />}
                Submit Request
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in bg-white dark:bg-slate-900 p-12 rounded-3xl border border-emerald-200 dark:border-emerald-900/50 shadow-2xl text-center space-y-6">
            <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white">Request Submitted!</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Your request for a <strong>{certType}</strong> has been successfully received. Please proceed to the cashier if payment is required, then wait for your name to be called.
            </p>
            <div className="pt-8">
              <button onClick={() => { setStep(0); setPurpose(''); setFirstName(''); setLastName(''); clearCanvas(); }} className="finishButton">
                Finish
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
export default KioskCertificates;

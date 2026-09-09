import React, { useState, useEffect, useRef } from 'react';
import { 
  Signature, Loader2, Pointer, Maximize2, Minimize2, Languages,
  Award, HeartHandshake, Home, Building2, CreditCard, UserCheck, CheckCircle2,
  Sparkles, ShieldCheck, Clock, ArrowRight, RotateCcw, PenTool
} from 'lucide-react';
import { api } from '../services/api';
import './KioskCertificates.css';

export const KioskCertificates: React.FC = () => {
  const [step, setStep] = useState(0); 
  const [lang, setLang] = useState<'en' | 'tl'>('en');
  const [certType, setCertType] = useState('Clearance');
  const [fee, setFee] = useState(150);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [queueNumber, setQueueNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cedula-specific states (CTC Form 175)
  const [gender, setGender] = useState('Male');
  const [civilStatus, setCivilStatus] = useState('Single');
  const [birthdate, setBirthdate] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [citizenship, setCitizenship] = useState('Filipino');
  const [spouseName, setSpouseName] = useState('');
  const [occupation, setOccupation] = useState('');
  const [employerName, setEmployerName] = useState('');
  const [grossAnnualIncome, setGrossAnnualIncome] = useState('');
  const [propertyValuation, setPropertyValuation] = useState('');
  const [tin, setTin] = useState('');

  // Business Clearance states
  const [bizAppType, setBizAppType] = useState<'New' | 'Renewal'>('New');
  const [bizName, setBizName] = useState('');
  const [bizType, setBizType] = useState('Sole Proprietorship');
  const [bizLine, setBizLine] = useState('');
  const [bizAddress, setBizAddress] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [bizCapital, setBizCapital] = useState('');
  const [bizEmployees, setBizEmployees] = useState('');
  const [bizVehicles, setBizVehicles] = useState('');
  const [cedulaNo, setCedulaNo] = useState('');
  const [prevPermitNo, setPrevPermitNo] = useState('');
  const [grossSales, setGrossSales] = useState('');

  // Residency Certificate state
  const [yearsOfResidency, setYearsOfResidency] = useState('');

  // Indigency Certificate state
  const [indigencyFamilyComposition, setIndigencyFamilyComposition] = useState('');

  // Barangay Clearance & ID additional states
  const [contactNo, setContactNo] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const fullDisplayName = [firstName, middleName, lastName].filter(Boolean).join(' ');

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
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
    setMiddleName('');
    setLastName('');
    setPurpose('');
    setGender('Male');
    setCivilStatus('Single');
    setBirthdate('');
    setPlaceOfBirth('');
    setAddress('');
    setCitizenship('Filipino');
    setSpouseName('');
    setOccupation('');
    setEmployerName('');
    setGrossAnnualIncome('');
    setPropertyValuation('');
    setTin('');
    setBizAppType('New');
    setBizName('');
    setBizType('Sole Proprietorship');
    setBizLine('');
    setBizAddress('');
    setBizPhone('');
    setBizEmail('');
    setBizCapital('');
    setBizEmployees('');
    setBizVehicles('');
    setCedulaNo('');
    setPrevPermitNo('');
    setGrossSales('');
    setYearsOfResidency('');
    setIndigencyFamilyComposition('');
    setContactNo('');
    setEmergencyContact('');
    setBloodType('');
    setAcceptedTerms(false);
    clearCanvas();
  };

  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setStep(0);
        setCertType('Clearance');
        clearAll();
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
    const defaultFees: Record<string, number> = { Clearance: 150, Indigency: 0, Residency: 100, Business: 300, Cedula: 50, 'Barangay ID': 100 };
    let fees = defaultFees;
    try { const s = localStorage.getItem('cert_fees'); if (s) fees = { ...defaultFees, ...JSON.parse(s) }; } catch {}
    setFee(fees[certType] ?? 100);
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

  const handleSubmit = async () => {
    if (!acceptedTerms) return;
    if (!firstName.trim() || !lastName.trim()) return;
    if (certType === 'Cedula' && (!birthdate || !address.trim() || !purpose.trim())) return;
    if (certType === 'Business' && (!bizName.trim() || !bizLine.trim() || !bizAddress.trim())) return;
    if (certType === 'Residency' && (!birthdate || !address.trim() || !yearsOfResidency.trim() || !purpose.trim())) return;
    if (certType === 'Indigency' && (!address.trim() || !purpose.trim())) return;
    if (certType === 'Clearance' && (!birthdate || !address.trim() || !purpose.trim())) return;
    if (certType === 'Barangay ID' && (!birthdate || !placeOfBirth.trim() || !address.trim() || !contactNo.trim() || !emergencyContact.trim())) return;
    if (certType !== 'Business' && certType !== 'Residency' && certType !== 'Cedula' && certType !== 'Indigency' && certType !== 'Clearance' && certType !== 'Barangay ID' && !purpose.trim()) return;

    setIsSubmitting(true);

    let finalPurpose = purpose.trim();
    if (certType === 'Cedula') {
      const details = [
        `Purpose: ${purpose.trim()}`,
        `Gender: ${gender}`,
        `Civil Status: ${civilStatus}`,
        `Birthdate: ${birthdate}`,
        placeOfBirth.trim() ? `Birthplace: ${placeOfBirth.trim()}` : null,
        `Address: ${address.trim()}`,
        `Citizenship: ${citizenship.trim()}`,
        spouseName.trim() ? `Spouse: ${spouseName.trim()}` : null,
        occupation.trim() ? `Occupation: ${occupation.trim()}` : null,
        employerName.trim() ? `Employer/Biz: ${employerName.trim()}` : null,
        grossAnnualIncome.trim() ? `Annual Income: ₱${grossAnnualIncome.trim()}` : null,
        propertyValuation.trim() ? `Property Value: ₱${propertyValuation.trim()}` : null,
        tin.trim() ? `TIN: ${tin.trim()}` : null,
      ].filter(Boolean).join(' | ');
      finalPurpose = details;
    } else if (certType === 'Business') {
      const details = [
        `App Type: ${bizAppType}`,
        `Business Name: ${bizName.trim()}`,
        `Business Type: ${bizType}`,
        `Line of Business: ${bizLine.trim()}`,
        `Business Address: ${bizAddress.trim()}`,
        bizPhone.trim() ? `Phone: ${bizPhone.trim()}` : null,
        bizEmail.trim() ? `Email: ${bizEmail.trim()}` : null,
        bizCapital.trim() ? `Capitalization: ₱${bizCapital.trim()}` : null,
        bizEmployees.trim() ? `Employees: ${bizEmployees.trim()}` : null,
        bizVehicles.trim() ? `Delivery Vehicles: ${bizVehicles.trim()}` : null,
        `Owner: ${fullDisplayName}`,
        address.trim() ? `Owner Address: ${address.trim()}` : null,
        citizenship.trim() ? `Citizenship: ${citizenship.trim()}` : null,
        tin.trim() ? `TIN: ${tin.trim()}` : null,
        cedulaNo.trim() ? `Cedula No: ${cedulaNo.trim()}` : null,
        bizAppType === 'Renewal' && prevPermitNo.trim() ? `Prev Permit/OR: ${prevPermitNo.trim()}` : null,
        bizAppType === 'Renewal' && grossSales.trim() ? `Gross Sales: ₱${grossSales.trim()}` : null,
        purpose.trim() ? `Purpose: ${purpose.trim()}` : `Purpose: Business Clearance Application`,
      ].filter(Boolean).join(' | ');
      finalPurpose = details;
    } else if (certType === 'Residency') {
      const details = [
        `Purpose: ${purpose.trim()}`,
        `Gender: ${gender}`,
        `Civil Status: ${civilStatus}`,
        `Birthdate: ${birthdate}`,
        placeOfBirth.trim() ? `Birthplace: ${placeOfBirth.trim()}` : null,
        `Address: ${address.trim()}`,
        `Length of Residency: ${yearsOfResidency.trim()}`,
        cedulaNo.trim() ? `Cedula No: ${cedulaNo.trim()}` : null,
      ].filter(Boolean).join(' | ');
      finalPurpose = details;
    } else if (certType === 'Indigency') {
      const details = [
        `Purpose: ${purpose.trim()}`,
        `Address: ${address.trim()}`,
        indigencyFamilyComposition.trim() ? `Family Composition: ${indigencyFamilyComposition.trim()}` : null,
        cedulaNo.trim() ? `Cedula No: ${cedulaNo.trim()}` : null,
      ].filter(Boolean).join(' | ');
      finalPurpose = details;
    } else if (certType === 'Clearance') {
      const details = [
        `Purpose: ${purpose.trim()}`,
        `Gender: ${gender}`,
        `Civil Status: ${civilStatus}`,
        `Birthdate: ${birthdate}`,
        placeOfBirth.trim() ? `Birthplace: ${placeOfBirth.trim()}` : null,
        `Address: ${address.trim()}`,
        citizenship.trim() ? `Citizenship: ${citizenship.trim()}` : null,
        contactNo.trim() ? `Contact: ${contactNo.trim()}` : null,
        occupation.trim() ? `Occupation: ${occupation.trim()}` : null,
        cedulaNo.trim() ? `Cedula No: ${cedulaNo.trim()}` : null,
      ].filter(Boolean).join(' | ');
      finalPurpose = details;
    } else if (certType === 'Barangay ID') {
      const details = [
        `Purpose: Barangay ID Application`,
        `Gender: ${gender}`,
        `Civil Status: ${civilStatus}`,
        `Birthdate: ${birthdate}`,
        `Birthplace: ${placeOfBirth.trim()}`,
        `Address: ${address.trim()}`,
        `Contact: ${contactNo.trim()}`,
        `Emergency Contact: ${emergencyContact.trim()}`,
        bloodType.trim() ? `Blood Type: ${bloodType.trim()}` : null,
        tin.trim() ? `TIN/SSS/GSIS: ${tin.trim()}` : null,
        purpose.trim() ? `Remarks: ${purpose.trim()}` : null,
      ].filter(Boolean).join(' | ');
      finalPurpose = details;
    }

    try {
      const res = await api.certificates.publicRequest({
        first_name: middleName.trim() ? `${firstName.trim()} ${middleName.trim()}` : firstName.trim(),
        last_name: lastName.trim(),
        type: certType,
        purpose: finalPurpose,
        fee
      }) as any;
      const tNo = res.queue_number || `Q-${Math.floor(100 + Math.random() * 900)}`;
      setQueueNumber(tNo);
      
      const applicantName = `${firstName.trim()} ${lastName.trim()}`.trim() || 'Kiosk Applicant';

      // Sync to live shared queue slots localStorage
      try {
        const saved = localStorage.getItem('lingkod_queue_slots');
        const existing: any[] = saved ? JSON.parse(saved) : [];
        const newQueueSlot = {
          id: `kiosk-${Date.now()}`,
          ticket_number: tNo,
          resident_name: applicantName,
          cert_type: certType,
          date: new Date().toISOString().split('T')[0],
          time_slot: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          status: 'Waiting',
          is_priority: tNo.startsWith('P-')
        };
        const updatedQueue = [...existing, newQueueSlot];
        localStorage.setItem('lingkod_queue_slots', JSON.stringify(updatedQueue));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        console.error("Failed saving kiosk queue ticket", e);
      }

      setStep(4);
    } catch (err) {
      console.error('Kiosk submission error:', err);
      const fallbackTicket = `Q-${Math.floor(100 + Math.random() * 900)}`;
      setQueueNumber(fallbackTicket);
      
      const applicantName = `${firstName.trim()} ${lastName.trim()}`.trim() || 'Kiosk Applicant';

      try {
        const saved = localStorage.getItem('lingkod_queue_slots');
        const existing: any[] = saved ? JSON.parse(saved) : [];
        const newQueueSlot = {
          id: `kiosk-${Date.now()}`,
          ticket_number: fallbackTicket,
          resident_name: applicantName,
          cert_type: certType,
          date: new Date().toISOString().split('T')[0],
          time_slot: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          status: 'Waiting',
          is_priority: false
        };
        const updatedQueue = [...existing, newQueueSlot];
        localStorage.setItem('lingkod_queue_slots', JSON.stringify(updatedQueue));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {}

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
            <div className="w-12 h-12 bg-gradient-to-tr from-gov-blue-700 to-indigo-800 rounded-2xl shadow-xl border border-slate-700/80 flex items-center justify-center">
              <ShieldCheck size={24} className="text-gov-gold-400" />
            </div>
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
          <div className={`space-y-6 bg-slate-900/90 p-6 sm:p-10 rounded-3xl border border-slate-700/80 shadow-2xl backdrop-blur-xl mx-auto transition-all ${
            certType === 'Cedula' || certType === 'Business' || certType === 'Residency' || certType === 'Indigency' || certType === 'Clearance' || certType === 'Barangay ID' ? 'max-w-4xl' : 'max-w-2xl'
          }`}>
            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {certType} Request
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                {lang === 'tl' ? 'Ilagay ang mga Detalye' : 'Enter Request Details'}
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {certType === 'Cedula'
                  ? (lang === 'tl' ? 'Mangyaring punan ang opisyal na impormasyon para sa iyong Cedula (CTC Form 175).' : 'Please fill in your official details for your Community Tax Certificate (Cedula).')
                  : certType === 'Business'
                  ? (lang === 'tl' ? 'Mangyaring punan ang impormasyon para sa Barangay Business Clearance Application.' : 'Please fill in business and owner details for Barangay Business Clearance Application.')
                  : certType === 'Residency'
                  ? (lang === 'tl' ? 'Mangyaring punan ang impormasyon para sa Barangay Certificate of Residency.' : 'Please fill in details for Barangay Certificate of Residency Application.')
                  : certType === 'Indigency'
                  ? (lang === 'tl' ? 'Mangyaring punan ang impormasyon para sa Barangay Certificate of Indigency.' : 'Please fill in details for Barangay Certificate of Indigency Application.')
                  : certType === 'Clearance'
                  ? (lang === 'tl' ? 'Mangyaring punan ang opisyal na impormasyon para sa Barangay Clearance.' : 'Please fill in details for Barangay Clearance Application.')
                  : certType === 'Barangay ID'
                  ? (lang === 'tl' ? 'Mangyaring punan ang opisyal na impormasyon para sa Barangay ID.' : 'Please fill in details for Barangay Identification Card Application.')
                  : (lang === 'tl' ? 'Mangyaring punan ang iyong buong pangalan at dahilan sa paghiling.' : 'Please fill in your legal full name and purpose for document processing.')}
              </p>
            </div>
            
            {certType === 'Cedula' ? (
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {/* Personal Information */}
                <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800/90 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    {lang === 'tl' ? 'Personal na Impormasyon' : 'Personal Information'}
                  </h3>

                  {/* Name fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Unang Pangalan' : 'First Name'} *
                      </label>
                      <input 
                        type="text" 
                        placeholder="Juan" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Gitnang Pangalan' : 'Middle Name'}
                      </label>
                      <input 
                        type="text" 
                        placeholder="Mercado" 
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Apelyido' : 'Last Name'} *
                      </label>
                      <input 
                        type="text" 
                        placeholder="Dela Cruz" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Gender & Civil Status & Citizenship */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Kasarian' : 'Gender'}
                      </label>
                      <select 
                        value={gender} 
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      >
                        <option value="Male">{lang === 'tl' ? 'Lalaki (Male)' : 'Male'}</option>
                        <option value="Female">{lang === 'tl' ? 'Babae (Female)' : 'Female'}</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Katayuang Sibil' : 'Civil Status'}
                      </label>
                      <select 
                        value={civilStatus} 
                        onChange={(e) => setCivilStatus(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      >
                        <option value="Single">{lang === 'tl' ? 'Walang Asawa (Single)' : 'Single'}</option>
                        <option value="Married">{lang === 'tl' ? 'Kasal (Married)' : 'Married'}</option>
                        <option value="Widowed">{lang === 'tl' ? 'Biyudo / Biyuda (Widowed)' : 'Widowed'}</option>
                        <option value="Separated">{lang === 'tl' ? 'Hiwalay (Separated)' : 'Separated'}</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Pagkamamamayan' : 'Citizenship'}
                      </label>
                      <input 
                        type="text" 
                        placeholder="Filipino" 
                        value={citizenship}
                        onChange={(e) => setCitizenship(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Birthdate & Birthplace */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Petsa ng Kapanganakan' : 'Birthdate'} *
                      </label>
                      <input 
                        type="date" 
                        value={birthdate}
                        onChange={(e) => setBirthdate(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Lugar ng Kapanganakan' : 'Place of Birth'}
                      </label>
                      <input 
                        type="text" 
                        placeholder="City / Municipality" 
                        value={placeOfBirth}
                        onChange={(e) => setPlaceOfBirth(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Complete Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {lang === 'tl' ? 'Kumpletong Tirahan (Bahay, Kalye, Barangay, Lungsod, Lalawigan)' : 'Complete Address'} *
                    </label>
                    <input 
                      type="text" 
                      placeholder="House No., Street Name, Barangay, City, Province" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                    />
                  </div>

                  {/* Spouse Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {lang === 'tl' ? 'Pangalan ng Asawa (kung kasal)' : 'Spouse Name (if married)'}
                    </label>
                    <input 
                      type="text" 
                      placeholder="Buong pangalan ng asawa" 
                      value={spouseName}
                      onChange={(e) => setSpouseName(e.target.value)}
                      className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Work & Financial Details */}
                <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800/90 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {lang === 'tl' ? 'Hanapbuhay at Kita (Para sa Cedula Computation)' : 'Employment & Financial Details'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Hanapbuhay / Propesyon' : 'Occupation / Profession'}
                      </label>
                      <input 
                        type="text" 
                        placeholder="E.g., Employee, Merchant, Driver" 
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Pangalan ng Employer / Negosyo' : 'Employer / Business Name'}
                      </label>
                      <input 
                        type="text" 
                        placeholder="Company or Business name" 
                        value={employerName}
                        onChange={(e) => setEmployerName(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Kabuuang Kita noong Nakaraang Taon (₱)' : 'Gross Annual Earnings (₱)'}
                      </label>
                      <input 
                        type="number" 
                        placeholder="0.00" 
                        value={grossAnnualIncome}
                        onChange={(e) => setGrossAnnualIncome(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-slate-500 transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Halaga ng Ari-arian (Lupa / Gusali) (₱)' : 'Real Property Assessed Value (₱)'}
                      </label>
                      <input 
                        type="number" 
                        placeholder="0.00" 
                        value={propertyValuation}
                        onChange={(e) => setPropertyValuation(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-slate-500 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800/90 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    {lang === 'tl' ? 'Iba Pang Detalye' : 'Additional Information'}
                  </h3>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      TIN (Tax Identification Number) — {lang === 'tl' ? 'kung mayroon' : 'Optional'}
                    </label>
                    <input 
                      type="text" 
                      placeholder="XXX-XXX-XXX-000" 
                      value={tin}
                      onChange={(e) => setTin(e.target.value)}
                      className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 placeholder-slate-500 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {lang === 'tl' ? 'Layunin ng Pagkuha ng Cedula' : 'Purpose of CTC / Cedula'} *
                    </label>
                    <textarea
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder={lang === 'tl' ? 'Hal., Para sa employment, business permit, notarization...' : 'E.g., Employment, business clearance, government requirements...'}
                      rows={2}
                      className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none placeholder-slate-500 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
            ) : certType === 'Business' ? (
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {/* Application Type selection */}
                <div className="flex gap-3 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setBizAppType('New')}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                      bizAppType === 'New'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lang === 'tl' ? 'Bagong Negosyo (New)' : 'New Business'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBizAppType('Renewal')}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                      bizAppType === 'Renewal'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lang === 'tl' ? 'Pababago / Renewal' : 'Renewal'}
                  </button>
                </div>

                {/* Section A: Business Details */}
                <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800/90 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    {lang === 'tl' ? 'A. Impormasyon ng Negosyo' : 'A. Business Information'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Pangalan ng Negosyo' : 'Business Name'} *
                      </label>
                      <input 
                        type="text" 
                        placeholder="E.g., Dela Cruz Trading & General Merchandise" 
                        value={bizName}
                        onChange={(e) => setBizName(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Uri ng Negosyo' : 'Business Organization Type'}
                      </label>
                      <select 
                        value={bizType} 
                        onChange={(e) => setBizType(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      >
                        <option value="Sole Proprietorship">Sole Proprietorship (DTI)</option>
                        <option value="Partnership">Partnership (SEC)</option>
                        <option value="Corporation">Corporation (SEC)</option>
                        <option value="Cooperative">Cooperative (CDA)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {lang === 'tl' ? 'Linya ng Negosyo / Business Activity' : 'Line of Business'} *
                    </label>
                    <input 
                      type="text" 
                      placeholder="E.g., Sari-Sari Store, Eatery, Hardware, IT Consultancy" 
                      value={bizLine}
                      onChange={(e) => setBizLine(e.target.value)}
                      className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {lang === 'tl' ? 'Kumpletong Address ng Negosyo' : 'Complete Business Address'} *
                    </label>
                    <input 
                      type="text" 
                      placeholder="Bldg No., Street, Barangay, City, Province, Zip Code" 
                      value={bizAddress}
                      onChange={(e) => setBizAddress(e.target.value)}
                      className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Numero ng Telepono' : 'Business Contact No.'}
                      </label>
                      <input 
                        type="text" 
                        placeholder="09XX-XXX-XXXX / (02) 8XXX-XXXX" 
                        value={bizPhone}
                        onChange={(e) => setBizPhone(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Email Address ng Negosyo' : 'Business Email Address'}
                      </label>
                      <input 
                        type="email" 
                        placeholder="business@example.com" 
                        value={bizEmail}
                        onChange={(e) => setBizEmail(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Puhunan / Capitalization (₱)' : 'Capitalization (₱)'}
                      </label>
                      <input 
                        type="number" 
                        placeholder="50000.00" 
                        value={bizCapital}
                        onChange={(e) => setBizCapital(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Bilang ng Empleyado' : 'No. of Employees'}
                      </label>
                      <input 
                        type="number" 
                        placeholder="1" 
                        value={bizEmployees}
                        onChange={(e) => setBizEmployees(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Delivery Vehicles' : 'Delivery Vehicles'}
                      </label>
                      <input 
                        type="number" 
                        placeholder="0" 
                        value={bizVehicles}
                        onChange={(e) => setBizVehicles(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {bizAppType === 'Renewal' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-amber-300">
                          {lang === 'tl' ? 'Dating Permit / OR No.' : 'Previous Permit / OR No.'}
                        </label>
                        <input 
                          type="text" 
                          placeholder="BP-2025-XXXXX" 
                          value={prevPermitNo}
                          onChange={(e) => setPrevPermitNo(e.target.value)}
                          className="w-full text-sm p-3.5 bg-slate-900 border border-amber-500/40 text-white rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 placeholder-slate-500 transition-all font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-amber-300">
                          {lang === 'tl' ? 'Gross Sales / Kita (₱)' : 'Gross Sales Last Year (₱)'}
                        </label>
                        <input 
                          type="number" 
                          placeholder="0.00" 
                          value={grossSales}
                          onChange={(e) => setGrossSales(e.target.value)}
                          className="w-full text-sm p-3.5 bg-slate-900 border border-amber-500/40 text-white rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 placeholder-slate-500 transition-all font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Section B: Owner / Operator Info */}
                <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800/90 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {lang === 'tl' ? 'B. Impormasyon ng May-ari / Operator' : 'B. Owner / Operator Details'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Unang Pangalan ng May-ari' : 'Owner First Name'} *
                      </label>
                      <input 
                        type="text" 
                        placeholder="Juan" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Gitnang Pangalan' : 'Middle Name'}
                      </label>
                      <input 
                        type="text" 
                        placeholder="Mercado" 
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Apelyido' : 'Owner Last Name'} *
                      </label>
                      <input 
                        type="text" 
                        placeholder="Dela Cruz" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Tirahan ng May-ari' : 'Owner Personal Address'}
                      </label>
                      <input 
                        type="text" 
                        placeholder="House No., Street, Barangay, City" 
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Pagkamamamayan' : 'Citizenship'}
                      </label>
                      <input 
                        type="text" 
                        placeholder="Filipino" 
                        value={citizenship}
                        onChange={(e) => setCitizenship(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        TIN (Tax Identification Number)
                      </label>
                      <input 
                        type="text" 
                        placeholder="XXX-XXX-XXX-000" 
                        value={tin}
                        onChange={(e) => setTin(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-slate-500 transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Cedula (CTC) Number' : 'Cedula (CTC) Number'}
                      </label>
                      <input 
                        type="text" 
                        placeholder="CTC-2026-XXXXX" 
                        value={cedulaNo}
                        onChange={(e) => setCedulaNo(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-slate-500 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Section C: Required Documents Checklist */}
                <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800/90 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    {lang === 'tl' ? 'C. Mga Dokumentong Isasama sa Application' : 'C. Required Application Documents Checklist'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                      {bizType === 'Sole Proprietorship' ? 'DTI Registration Certificate' : bizType === 'Cooperative' ? 'CDA Registration Certificate' : 'SEC Certificate & Articles'}
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                      {lang === 'tl' ? 'Proof of Right to Use Address (TCT / Lease / Contract)' : 'Proof of Right to Use Address (TCT / Lease)'}
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                      {lang === 'tl' ? 'Community Tax Certificate (Cedula)' : 'Community Tax Certificate (Cedula)'}
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                      {lang === 'tl' ? 'Barangay Business Clearance Fee (₱300.00)' : 'Barangay Business Clearance Fee (₱300.00)'}
                    </div>
                  </div>
                </div>
              </div>
            ) : certType === 'Residency' ? (
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {/* Section A: Personal Information */}
                <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800/90 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    {lang === 'tl' ? 'A. Personal na Impormasyon' : 'A. Personal Information'}
                  </h3>

                  {/* Name fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Unang Pangalan' : 'First Name'} *
                      </label>
                      <input 
                        type="text" 
                        placeholder="Juan" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Gitnang Pangalan' : 'Middle Name'}
                      </label>
                      <input 
                        type="text" 
                        placeholder="Mercado" 
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Apelyido' : 'Last Name'} *
                      </label>
                      <input 
                        type="text" 
                        placeholder="Dela Cruz" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Gender & Civil Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Kasarian' : 'Gender'}
                      </label>
                      <select 
                        value={gender} 
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      >
                        <option value="Male">{lang === 'tl' ? 'Lalaki (Male)' : 'Male'}</option>
                        <option value="Female">{lang === 'tl' ? 'Babae (Female)' : 'Female'}</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Katayuang Sibil' : 'Civil Status'}
                      </label>
                      <select 
                        value={civilStatus} 
                        onChange={(e) => setCivilStatus(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      >
                        <option value="Single">{lang === 'tl' ? 'Walang Asawa (Single)' : 'Single'}</option>
                        <option value="Married">{lang === 'tl' ? 'Kasal (Married)' : 'Married'}</option>
                        <option value="Widowed">{lang === 'tl' ? 'Biyudo / Biyuda (Widowed)' : 'Widowed'}</option>
                        <option value="Separated">{lang === 'tl' ? 'Hiwalay (Separated)' : 'Separated'}</option>
                      </select>
                    </div>
                  </div>

                  {/* Birthdate & Birthplace */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Petsa ng Kapanganakan' : 'Birthdate'} *
                      </label>
                      <input 
                        type="date" 
                        value={birthdate}
                        onChange={(e) => setBirthdate(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Lugar ng Kapanganakan' : 'Place of Birth'}
                      </label>
                      <input 
                        type="text" 
                        placeholder="City / Municipality" 
                        value={placeOfBirth}
                        onChange={(e) => setPlaceOfBirth(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Complete Address & Length of Residency */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Kumpletong Tirahan sa Barangay' : 'Complete Barangay Address'} *
                      </label>
                      <input 
                        type="text" 
                        placeholder="House No., Street Name, Barangay, City, Province" 
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Tagal ng Paninirahan' : 'Length of Residency'} *
                      </label>
                      <input 
                        type="text" 
                        placeholder="E.g., 5 Taon / 5 Years" 
                        value={yearsOfResidency}
                        onChange={(e) => setYearsOfResidency(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Section B: Required Documents */}
                <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800/90 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {lang === 'tl' ? 'B. Mga Dokumentong Isusumite sa Counter' : 'B. Required Documents Checklist'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {lang === 'tl' ? 'Valid Government ID (may pangalan at litrato)' : 'Valid Government ID (with photo & address)'}
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {lang === 'tl' ? 'Proof of Residency (utility bill, kontrata sa upa)' : 'Proof of Residency (utility bill, lease contract)'}
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {lang === 'tl' ? 'Community Tax Certificate (Cedula) — kung hinihingi' : 'Community Tax Certificate (Cedula) — optional'}
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {lang === 'tl' ? '2x2 ID Picture — depende sa barangay' : '2x2 ID Picture — depending on barangay'}
                    </div>
                  </div>
                </div>

                {/* Section C: Purpose & Cedula */}
                <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800/90 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    {lang === 'tl' ? 'C. Layunin ng Pagkuha' : 'C. Purpose of Request'}
                  </h3>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {lang === 'tl' ? 'Layunin ng Paghiling' : 'Purpose of Request'} *
                    </label>
                    <textarea
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder={lang === 'tl'
                        ? 'Hal., Para sa employment, loan application, school requirement, bank requirements...'
                        : 'E.g., For employment, loan application, school requirement, bank account opening...'}
                      rows={2}
                      className="w-full text-sm p-3.5 bg-slate-900 border border-amber-500/20 text-white rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none placeholder-slate-500 transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {lang === 'tl' ? 'Cedula Number — CTC No. (kung mayroon)' : 'Cedula Number — CTC No. (Optional)'}
                    </label>
                    <input
                      type="text"
                      placeholder="CTC-2026-XXXXX"
                      value={cedulaNo}
                      onChange={(e) => setCedulaNo(e.target.value)}
                      className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>
            ) : certType === 'Indigency' ? (
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {/* Info Header Banner */}
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-start gap-3">
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-black uppercase tracking-wider">
                    FREE
                  </span>
                  <div className="text-xs text-emerald-200/90 leading-relaxed">
                    <p className="font-bold text-emerald-300">
                      {lang === 'tl' ? 'Libre ang Barangay Certificate of Indigency' : 'Barangay Certificate of Indigency is completely FREE'}
                    </p>
                    <p className="mt-0.5 opacity-80">
                      {lang === 'tl'
                        ? 'Ito ay ibinibigay sa mga mamamayang nangangailangan ng tulong pampinansyal, medikal, o legal.'
                        : 'Issued to residents in need of financial, medical, educational, or legal assistance.'}
                    </p>
                  </div>
                </div>

                {/* Section A: Personal Information */}
                <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800/90 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    {lang === 'tl' ? 'A. Personal na Impormasyon' : 'A. Personal Information'}
                  </h3>

                  {/* Name fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Unang Pangalan' : 'First Name'} *
                      </label>
                      <input 
                        type="text" 
                        placeholder="Juan" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Gitnang Pangalan' : 'Middle Name'}
                      </label>
                      <input 
                        type="text" 
                        placeholder="Mercado" 
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Apelyido' : 'Last Name'} *
                      </label>
                      <input 
                        type="text" 
                        placeholder="Dela Cruz" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {lang === 'tl' ? 'Kumpletong Tirahan sa Barangay' : 'Complete Barangay Address'} *
                    </label>
                    <input 
                      type="text" 
                      placeholder="House No., Street Name, Barangay, City, Province" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                    />
                  </div>

                  {/* Family Composition / Living Status */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {lang === 'tl' ? 'Katayuan sa Pamumuhay / Family Info' : 'Living Status / Family Composition'}
                    </label>
                    <textarea
                      value={indigencyFamilyComposition}
                      onChange={(e) => setIndigencyFamilyComposition(e.target.value)}
                      placeholder={lang === 'tl'
                        ? 'Hal., Nakatira sa bahay ng kamag-anak, walang permanenteng trabaho...'
                        : 'E.g., Living with relatives, unemployed, daily wage earner...'}
                      rows={2}
                      className="w-full text-sm p-3.5 bg-slate-900 border border-blue-500/20 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none placeholder-slate-500 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Section B: Documents */}
                <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800/90 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    {lang === 'tl' ? 'B. Mga Dokumentong Isusumite' : 'B. Required Documents Checklist'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                      Valid Government ID
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                      Proof of Residency
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                      Application Form
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                      Request Letter
                    </div>
                  </div>
                </div>

                {/* Section C: Purpose */}
                <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800/90 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    {lang === 'tl' ? 'C. Layunin ng Pagkuha' : 'C. Purpose of Request'}
                  </h3>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {lang === 'tl' ? 'Layunin ng Paghiling' : 'Purpose of Request'} *
                    </label>
                    <textarea
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder={lang === 'tl'
                        ? 'Hal., Medical assistance, DSWD aid, scholarship...'
                        : 'E.g., Medical assistance, DSWD financial aid, scholarship...'
                      }
                      rows={2}
                      className="w-full text-sm p-3.5 bg-slate-900 border border-amber-500/20 text-white rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none placeholder-slate-500 transition-all font-medium"
                    />
                  </div>

                  <div className="p-3.5 bg-amber-950/30 border border-amber-500/20 rounded-xl text-[11px] text-amber-200/80 leading-relaxed">
                    <span className="font-black text-amber-400">ℹ {lang === 'tl' ? 'Tandaan:' : 'Note:'} </span>
                    {lang === 'tl'
                      ? 'Pagkatapos ng Barangay Hall, maaaring kailanganing i-process pa ito sa City/Municipal Social Welfare and Development Office (CSWDO/MSWDO). Processing time: 1 oras hanggang 14 na araw.'
                      : 'After the Barangay Hall, this may need further processing at the City/Municipal Social Welfare and Development Office (CSWDO/MSWDO). Processing time: 1 hour to 14 days depending on LGU.'}
                  </div>
                </div>
              </div>
            ) : certType === 'Clearance' ? (
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {/* Section A: Personal Information */}
                <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800/90 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    {lang === 'tl' ? 'A. Personal na Impormasyon' : 'A. Personal Information'}
                  </h3>

                  {/* Name fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Unang Pangalan' : 'First Name'} *
                      </label>
                      <input 
                        type="text" 
                        placeholder="Juan" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Gitnang Pangalan' : 'Middle Name'}
                      </label>
                      <input 
                        type="text" 
                        placeholder="Mercado" 
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Apelyido' : 'Last Name'} *
                      </label>
                      <input 
                        type="text" 
                        placeholder="Dela Cruz" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Gender & Civil Status & Citizenship */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Kasarian' : 'Gender'}
                      </label>
                      <select 
                        value={gender} 
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      >
                        <option value="Male">{lang === 'tl' ? 'Lalaki (Male)' : 'Male'}</option>
                        <option value="Female">{lang === 'tl' ? 'Babae (Female)' : 'Female'}</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Katayuang Sibil' : 'Civil Status'}
                      </label>
                      <select 
                        value={civilStatus} 
                        onChange={(e) => setCivilStatus(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      >
                        <option value="Single">{lang === 'tl' ? 'Walang Asawa (Single)' : 'Single'}</option>
                        <option value="Married">{lang === 'tl' ? 'Kasal (Married)' : 'Married'}</option>
                        <option value="Widowed">{lang === 'tl' ? 'Biyudo / Biyuda (Widowed)' : 'Widowed'}</option>
                        <option value="Separated">{lang === 'tl' ? 'Hiwalay (Separated)' : 'Separated'}</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Pagkamamamayan' : 'Citizenship'}
                      </label>
                      <input 
                        type="text" 
                        placeholder="Filipino" 
                        value={citizenship}
                        onChange={(e) => setCitizenship(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Birthdate & Birthplace */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Petsa ng Kapanganakan' : 'Birthdate'} *
                      </label>
                      <input 
                        type="date" 
                        value={birthdate}
                        onChange={(e) => setBirthdate(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Lugar ng Kapanganakan' : 'Place of Birth'}
                      </label>
                      <input 
                        type="text" 
                        placeholder="City / Municipality" 
                        value={placeOfBirth}
                        onChange={(e) => setPlaceOfBirth(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Complete Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {lang === 'tl' ? 'Kumpletong Tirahan (Bahay, Kalye, Barangay, Lungsod)' : 'Complete Address'} *
                    </label>
                    <input 
                      type="text" 
                      placeholder="House No., Street Name, Barangay, City, Province" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                    />
                  </div>

                  {/* Contact Number & Occupation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Numero ng Telepono / Mobile' : 'Contact / Mobile No.'}
                      </label>
                      <input 
                        type="text" 
                        placeholder="09XX-XXX-XXXX" 
                        value={contactNo}
                        onChange={(e) => setContactNo(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Hanapbuhay / Trabaho' : 'Occupation'}
                      </label>
                      <input 
                        type="text" 
                        placeholder="E.g., Private Employee, Driver, Self-Employed" 
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Section B: Required Documents */}
                <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800/90 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    {lang === 'tl' ? 'B. Mga Dokumentong Isusumite' : 'B. Required Documents Checklist'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                      {lang === 'tl' ? 'Valid Government ID (may larawan)' : 'Valid Government ID (with photo)'}
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                      {lang === 'tl' ? 'Community Tax Certificate (Cedula)' : 'Community Tax Certificate (Cedula)'}
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                      {lang === 'tl' ? 'Proof of Address / Residency' : 'Proof of Address / Billing Statement'}
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                      {lang === 'tl' ? 'Barangay Clearance Fee (₱150.00)' : 'Barangay Clearance Fee (₱150.00)'}
                    </div>
                  </div>
                </div>

                {/* Section C: Purpose & Cedula */}
                <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800/90 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    {lang === 'tl' ? 'C. Layunin ng Pagkuha' : 'C. Purpose of Request'}
                  </h3>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {lang === 'tl' ? 'Layunin ng Paghiling' : 'Purpose of Request'} *
                    </label>
                    <textarea
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder={lang === 'tl'
                        ? 'Hal., Para sa local employment, Postal ID application, bank account opening, license...'
                        : 'E.g., For local employment, Postal ID application, bank account opening, Police Clearance...'}
                      rows={2}
                      className="w-full text-sm p-3.5 bg-slate-900 border border-amber-500/20 text-white rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none placeholder-slate-500 transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {lang === 'tl' ? 'Cedula Number — CTC No. (kung mayroon)' : 'Cedula Number — CTC No. (Optional)'}
                    </label>
                    <input
                      type="text"
                      placeholder="CTC-2026-XXXXX"
                      value={cedulaNo}
                      onChange={(e) => setCedulaNo(e.target.value)}
                      className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>
            ) : certType === 'Barangay ID' ? (
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {/* Section A: ID Cardholder Information */}
                <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800/90 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    {lang === 'tl' ? 'A. Impormasyon ng May-ari ng ID' : 'A. Cardholder Personal Information'}
                  </h3>

                  {/* Name fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Unang Pangalan' : 'First Name'} *
                      </label>
                      <input 
                        type="text" 
                        placeholder="Juan" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Gitnang Pangalan' : 'Middle Name'}
                      </label>
                      <input 
                        type="text" 
                        placeholder="Mercado" 
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Apelyido' : 'Last Name'} *
                      </label>
                      <input 
                        type="text" 
                        placeholder="Dela Cruz" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Gender & Civil Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Kasarian' : 'Gender'}
                      </label>
                      <select 
                        value={gender} 
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      >
                        <option value="Male">{lang === 'tl' ? 'Lalaki (Male)' : 'Male'}</option>
                        <option value="Female">{lang === 'tl' ? 'Babae (Female)' : 'Female'}</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Katayuang Sibil' : 'Civil Status'}
                      </label>
                      <select 
                        value={civilStatus} 
                        onChange={(e) => setCivilStatus(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      >
                        <option value="Single">{lang === 'tl' ? 'Walang Asawa (Single)' : 'Single'}</option>
                        <option value="Married">{lang === 'tl' ? 'Kasal (Married)' : 'Married'}</option>
                        <option value="Widowed">{lang === 'tl' ? 'Biyudo / Biyuda (Widowed)' : 'Widowed'}</option>
                        <option value="Separated">{lang === 'tl' ? 'Hiwalay (Separated)' : 'Separated'}</option>
                      </select>
                    </div>
                  </div>

                  {/* Birthdate & Birthplace */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Petsa ng Kapanganakan' : 'Birthdate'} *
                      </label>
                      <input 
                        type="date" 
                        value={birthdate}
                        onChange={(e) => setBirthdate(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Lugar ng Kapanganakan' : 'Place of Birth'} *
                      </label>
                      <input 
                        type="text" 
                        placeholder="City / Municipality" 
                        value={placeOfBirth}
                        onChange={(e) => setPlaceOfBirth(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Complete Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {lang === 'tl' ? 'Kumpletong Tirahan sa Barangay' : 'Complete Barangay Address'} *
                    </label>
                    <input 
                      type="text" 
                      placeholder="House No., Street Name, Barangay, City, Province" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                    />
                  </div>

                  {/* Contact Number & Emergency Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Numero ng Telepono / Mobile' : 'Contact / Mobile No.'} *
                      </label>
                      <input 
                        type="text" 
                        placeholder="09XX-XXX-XXXX" 
                        value={contactNo}
                        onChange={(e) => setContactNo(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Ipaalam sa Oras ng Sakuna (Pangalan at No.)' : 'Emergency Contact (Name & Phone)'} *
                      </label>
                      <input 
                        type="text" 
                        placeholder="Pangalan - 09XX-XXX-XXXX" 
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Blood Type & TIN/SSS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'Uri ng Dugo (Blood Type)' : 'Blood Type (Optional)'}
                      </label>
                      <select 
                        value={bloodType} 
                        onChange={(e) => setBloodType(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      >
                        <option value="">{lang === 'tl' ? '-- Hindi Alam / N/A --' : '-- Not Specified --'}</option>
                        <option value="O+">O Positive (O+)</option>
                        <option value="O-">O Negative (O-)</option>
                        <option value="A+">A Positive (A+)</option>
                        <option value="A-">A Negative (A-)</option>
                        <option value="B+">B Positive (B+)</option>
                        <option value="B-">B Negative (B-)</option>
                        <option value="AB+">AB Positive (AB+)</option>
                        <option value="AB-">AB Negative (AB-)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'tl' ? 'TIN / SSS / GSIS No. (kung mayroon)' : 'TIN / SSS / GSIS No. (Optional)'}
                      </label>
                      <input 
                        type="text" 
                        placeholder="XXX-XXX-XXX-000" 
                        value={tin}
                        onChange={(e) => setTin(e.target.value)}
                        className="w-full text-sm p-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Section B: ID Requirements */}
                <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800/90 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {lang === 'tl' ? 'B. Mga Kailangang Dalhin sa Barangay Counter' : 'B. Requirements Checklist'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {lang === 'tl' ? '2x2 ID Picture (white background)' : '2x2 ID Photo (white background)'}
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {lang === 'tl' ? 'PSA Birth Certificate o Valid Government ID' : 'PSA Birth Certificate or Valid ID'}
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {lang === 'tl' ? 'Katibayan ng Paninirahan (Proof of Residency)' : 'Proof of Residency (Utility Bill / Lease)'}
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {lang === 'tl' ? 'Barangay ID Printing Fee (₱100.00)' : 'Barangay ID Printing Fee (₱100.00)'}
                    </div>
                  </div>
                </div>

                {/* Section C: Purpose / Remarks */}
                <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800/90 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    {lang === 'tl' ? 'C. Dagdag na Impormasyon / Layunin' : 'C. Purpose & Remarks'}
                  </h3>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {lang === 'tl' ? 'Layunin ng Paghiling (Remarks)' : 'Purpose / Additional Remarks'}
                    </label>
                    <textarea
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder={lang === 'tl'
                        ? 'Hal., Pangunahing ID para sa transaction sa bank, employment, remittance...'
                        : 'E.g., Primary valid ID for bank transactions, employment, remittance...'}
                      rows={2}
                      className="w-full text-sm p-3.5 bg-slate-900 border border-amber-500/20 text-white rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none placeholder-slate-500 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                      {lang === 'tl' ? 'Gitnang Pangalan' : 'Middle Name'}
                    </label>
                    <input 
                      type="text" 
                      placeholder="Mercado" 
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
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
            )}

            <div className="flex gap-4 pt-4 border-t border-slate-800/80">
              <button 
                onClick={clearAll} 
                className="flex-1 py-4 text-sm font-black bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-2xl hover:bg-rose-500/25 transition-colors disabled:opacity-40 uppercase tracking-wider cursor-pointer" 
                disabled={!firstName && !lastName && !purpose && !bizName && !birthdate && !yearsOfResidency && !contactNo && !emergencyContact}
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
                disabled={
                  !firstName.trim() || 
                  !lastName.trim() || 
                  (certType === 'Cedula' && (!birthdate || !address.trim() || !purpose.trim())) ||
                  (certType === 'Business' && (!bizName.trim() || !bizLine.trim() || !bizAddress.trim())) ||
                  (certType === 'Residency' && (!birthdate || !address.trim() || !yearsOfResidency.trim() || !purpose.trim())) ||
                  (certType === 'Indigency' && (!address.trim() || !purpose.trim())) ||
                  (certType === 'Clearance' && (!birthdate || !address.trim() || !purpose.trim())) ||
                  (certType === 'Barangay ID' && (!birthdate || !placeOfBirth.trim() || !address.trim() || !contactNo.trim() || !emergencyContact.trim())) ||
                  (certType !== 'Cedula' && certType !== 'Business' && certType !== 'Residency' && certType !== 'Indigency' && certType !== 'Clearance' && certType !== 'Barangay ID' && !purpose.trim())
                } 
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
                <span className="text-xs font-extrabold text-white">{fullDisplayName}</span>
              </div>
            </div>

            {/* Terms & Conditions / Data Privacy Act Confirmation */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 shadow-inner">
              <div className="flex items-center gap-2 text-blue-400">
                <ShieldCheck size={18} />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  {lang === 'tl' ? 'Pahayag sa Data Privacy at Mga Tuntunin' : 'Data Privacy Act & Terms Confirmation'}
                </h4>
              </div>
              <div className="text-[11px] text-slate-400 font-medium leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 max-h-24 overflow-y-auto">
                {lang === 'tl' ? (
                  <p>
                    Alinsunod sa <strong>Republic Act No. 10173 (Data Privacy Act of 2012)</strong>, ang lahat ng personal na impormasyong iyong ibinigay ay gagamitin lamang para sa pagproseso, pagpapatunay, at pag-isyu ng hininging dokumento ng Barangay. Ang iyong lagda ay nagsisilbing patunay ng katapatan ng mga impormasyon.
                  </p>
                ) : (
                  <p>
                    In compliance with <strong>Republic Act No. 10173 (Data Privacy Act of 2012)</strong>, all personal information provided herein shall be strictly used for the processing, verification, and issuance of requested Barangay documents. Your digital signature serves as certification of accuracy.
                  </p>
                )}
              </div>

              <label className="flex items-start gap-3 pt-1 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-950 cursor-pointer accent-blue-600"
                />
                <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors leading-snug">
                  {lang === 'tl'
                    ? 'Pinatutunayan ko na tama ang lahat ng aking ibinigay na impormasyon at sumasang-ayon ako sa mga Tuntunin at Data Privacy Policy.'
                    : 'I certify that all information provided is true and accurate, and I agree to the Terms & Data Privacy Policy.'} *
                </span>
              </label>
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
                disabled={isSubmitting || !acceptedTerms} 
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
              <span className="text-[10px] font-bold text-slate-500 mt-2 block uppercase">{certType} • {fullDisplayName}</span>
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

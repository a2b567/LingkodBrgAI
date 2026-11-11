import React, { useState } from 'react';
import {
  Sparkles, X, ChevronRight, ChevronLeft, QrCode, FileText,
  Stethoscope, Calendar, PhoneCall, ShieldCheck, CheckCircle2,
  Eye, ArrowRight
} from 'lucide-react';

interface ResidentTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'prompt' | 'steps';
}

interface StepData {
  title: string;
  tagline: string;
  desc: string;
  icon: React.ReactNode;
  iconColor: string;
  badgeBg: string;
  previewSnippet: React.ReactNode;
}

export const ResidentTutorialModal: React.FC<ResidentTutorialModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'prompt'
}) => {
  const [mode, setMode] = useState<'prompt' | 'steps'>(initialMode);
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const handleSkip = () => {
    try {
      localStorage.setItem('lingkod_resident_tutorial_completed', 'true');
    } catch {}
    onClose();
  };

  const handleComplete = () => {
    try {
      localStorage.setItem('lingkod_resident_tutorial_completed', 'true');
    } catch {}
    onClose();
  };

  const steps: StepData[] = [
    {
      title: 'Digital Barangay ID Card',
      tagline: 'Opisyal na Katibayan ng Pagkamamamayan',
      desc: 'Nasa itaas ng iyong dashboard ang iyong Digital Citizen Card na may QR Code. Magagamit mo ito bilang digital identity sa mga transaksyon sa barangay hall, verification, at ayuda nang hindi kailangan ng physical card.',
      icon: <QrCode size={26} />,
      iconColor: 'text-blue-500',
      badgeBg: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',
      previewSnippet: (
        <div className="p-3.5 bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 text-white rounded-2xl shadow-md border border-blue-400/30 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-200">Digital ID Card</span>
            </div>
            <p className="text-xs font-black mt-1">Tap card to expand full QR</p>
          </div>
          <div className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-xl text-[10px] font-mono font-bold border border-white/30">
            SANISIDRO-2026
          </div>
        </div>
      )
    },
    {
      title: 'Online Certificates & Permits',
      tagline: 'Iwas-Pila na Pag-request ng Dokumento',
      desc: 'Pumunta sa tab na "Documents" para mag-request ng Barangay Clearance, Certificate of Indigency (Libre), Residency, o Cedula. Maaari mong subaybayan ang approval status at i-download ang signed PDF kapag handa na.',
      icon: <FileText size={26} />,
      iconColor: 'text-indigo-500',
      badgeBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400',
      previewSnippet: (
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">LIBRE</span>
            <p className="text-[11px] font-bold mt-1 text-slate-800 dark:text-slate-200">Indigency Cert</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">ONLINE</span>
            <p className="text-[11px] font-bold mt-1 text-slate-800 dark:text-slate-200">Brgy Clearance</p>
          </div>
        </div>
      )
    },
    {
      title: 'Health Center Clinic & Live Queue',
      tagline: 'Real-time na Pila sa Barangay Clinic',
      desc: 'Makikita mo nang live sa portal kung sino ang kasalukuyang sineserbisyuhan sa Health Center bago ka pa umalis ng bahay. Pwede kang kumuha ng priority number para sa checkup, bakuna, o gamot nang mabilis.',
      icon: <Stethoscope size={26} />,
      iconColor: 'text-rose-500',
      badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400',
      previewSnippet: (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
              #03
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Now Serving</p>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">General Consultation</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white">Live</span>
        </div>
      )
    },
    {
      title: 'Appointments at Konsultasyon',
      tagline: 'Magpa-schedule kay Kapitan o Opisyal',
      desc: 'Iwasan ang pabalik-balik sa barangay hall. Mag-book ng petsa at oras para sa pakikipag-usap sa Barangay Captain, Lupon Tagapamayapa para sa settlement, o iba pang opisyal na gawain.',
      icon: <Calendar size={26} />,
      iconColor: 'text-amber-500',
      badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
      previewSnippet: (
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-amber-500" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Book Appointment</p>
              <p className="text-[10px] text-slate-500">Pumili ng araw at oras</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-gov-blue-600 dark:text-gov-blue-400">Schedule →</span>
        </div>
      )
    },
    {
      title: '24/7 Emergency SOS Hotlines',
      tagline: 'Mabilis na Saklolo sa Isang Pindot',
      desc: 'I-click lamang ang pulang "SOS" button sa itaas ng screen anumang oras para sa direct dial sa National 911, Barangay San Isidro Desk, Health Center Ambulance, Local Police, at Bumbero (BFP).',
      icon: <PhoneCall size={26} />,
      iconColor: 'text-rose-600',
      badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400',
      previewSnippet: (
        <div className="flex items-center gap-2">
          <span className="flex-1 px-3 py-2 bg-rose-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30">
            <PhoneCall size={13} /> 911 Emergency
          </span>
          <span className="flex-1 px-3 py-2 bg-blue-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30">
            Desk (049) 501-2749
          </span>
        </div>
      )
    },
    {
      title: 'Data Privacy Shield (RA 10173)',
      tagline: 'Protektado ang Iyong Personal na Impormasyon',
      desc: 'Ligtas at naka-encrypt ang iyong rekord. Sa itaas na navigation bar, maaari mong i-on o i-off ang "Privacy Mask" upang itago ang iyong cellphone number at tirahan kapag may katabi kang nakatingin.',
      icon: <ShieldCheck size={26} />,
      iconColor: 'text-emerald-500',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
      previewSnippet: (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-blue-500" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Privacy Mask ON</p>
              <p className="text-[10px] text-slate-500">Phone: 0912 ••• ••••</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-600 text-white">Active</span>
        </div>
      )
    }
  ];

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all">
        
        {/* Top Decorative Header Bar */}
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600" />

        {/* ================= MODE: PROMPT (WELCOME & CHOOSE) ================= */}
        {mode === 'prompt' ? (
          <div className="p-6 sm:p-7 space-y-5">
            <div className="flex items-start justify-between">
              <div className="w-13 h-13 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shadow-subtle">
                <Sparkles size={26} className="animate-spin-slow" />
              </div>
              <button
                type="button"
                onClick={handleSkip}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Laktawan (Close)"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider mb-2 border border-blue-500/20">
                Maligayang Pagdating
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Welcome sa LingkodBrgy Resident Portal!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-medium">
                Ito ang iyong opisyal na one-stop digital portal sa Barangay San Isidro. Nais mo ba ng mabilis na 1-minutong gabay (tutorial) para malaman ang lahat ng serbisyo at kung paano ito gamitin?
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
                <QrCode size={18} className="text-blue-500 shrink-0" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Digital Citizen ID</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
                <FileText size={18} className="text-indigo-500 shrink-0" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Online Clearances</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
                <Stethoscope size={18} className="text-rose-500 shrink-0" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Live Clinic Queue</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
                <PhoneCall size={18} className="text-emerald-500 shrink-0" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">24/7 SOS Hotlines</span>
              </div>
            </div>

            {/* Action Buttons: Skip vs Start */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs transition-colors cursor-pointer text-center"
              >
                Laktawan Muna (Skip)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('steps');
                  setCurrentStep(0);
                }}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Simulan ang Gabay</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          /* ================= MODE: STEPS (STEP-BY-STEP WALKTHROUGH) ================= */
          <div className="p-6 sm:p-7 space-y-5">
            {/* Top Bar with Step Tracker & Skip */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${step.badgeBg}`}>
                  Hakbang {currentStep + 1} ng {steps.length}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSkip}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Laktawan (Skip)</span>
                <X size={14} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            {/* Step Content */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 ${step.iconColor} flex items-center justify-center shrink-0 shadow-sm border border-slate-200 dark:border-slate-700`}>
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {step.tagline}
                  </p>
                </div>
              </div>

              {/* Preview Snippet */}
              <div className="pt-1">
                {step.previewSnippet}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium pt-1">
                {step.desc}
              </p>
            </div>

            {/* Step Navigation Dots & Controls */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              {/* Back Button */}
              <button
                type="button"
                disabled={currentStep === 0}
                onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentStep === 0
                    ? 'opacity-30 cursor-not-allowed text-slate-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ChevronLeft size={16} />
                <span>Bumalik</span>
              </button>

              {/* Dot Indicators */}
              <div className="flex items-center gap-1.5">
                {steps.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentStep(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === currentStep
                        ? 'w-6 bg-blue-600'
                        : 'w-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
                    }`}
                    title={`Pumunta sa hakbang ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Next / Finish Button */}
              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/30 transition-all active:scale-95 cursor-pointer"
                >
                  <span>Susunod</span>
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleComplete}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 size={15} />
                  <span>Tapusin</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

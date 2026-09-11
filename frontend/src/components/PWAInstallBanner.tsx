import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already in standalone / installed PWA mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if user previously dismissed banner this session
    if (sessionStorage.getItem('pwa_banner_dismissed') === 'true') {
      setIsDismissed(true);
    }

    // Detect iOS device (Safari doesn't support beforeinstallprompt)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    if (isIosDevice) {
      setIsIOS(true);
    }

    // Listen for beforeinstallprompt event on Android / Chromium / Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('[LingkodBrgyAi PWA] Successfully installed!');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (isInstalled || isDismissed) {
    return null;
  }

  // Show banner if install prompt is ready or if on iOS
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      <aside 
        aria-label="App Installation Prompt" 
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-bounce-subtle"
      >
        <div className="bg-slate-900/95 dark:bg-slate-900/95 text-white p-4 rounded-3xl border border-gov-gold-500/40 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3.5">
          
          {/* App Icon */}
          <div className="w-12 h-12 bg-gradient-to-tr from-gov-blue-700 via-gov-blue-800 to-indigo-900 rounded-2xl flex items-center justify-center border border-gov-gold-400/50 shadow-md shrink-0 p-1">
            <img src="/logo.png" alt="LingkodBrgyAi App Logo" className="w-full h-full object-contain rounded-xl" />
          </div>

          {/* Text Information */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-white truncate">Install LingkodBrgyAi</h4>
              <span className="px-1.5 py-0.5 rounded-full text-[8px] font-extrabold bg-gov-gold-500/20 text-gov-gold-400 border border-gov-gold-500/40">
                PWA APP
              </span>
            </div>
            <p className="text-[10px] text-slate-300 font-medium leading-tight mt-0.5">
              Fast, offline-ready mobile & desktop app experience.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-gov-gold-500 to-amber-500 hover:from-gov-gold-600 hover:to-amber-600 text-slate-950 font-black text-xs shadow-md shadow-gov-gold-500/30 transition-transform active:scale-95 cursor-pointer"
            >
              <Download size={14} className="stroke-[3]" />
              <span>Install</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title="Dismiss banner"
            >
              <X size={16} />
            </button>
          </div>

        </div>
      </aside>

      {/* iOS Safari Install Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 text-white text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-gov-blue-600/20 text-gov-blue-400 rounded-2xl mx-auto flex items-center justify-center border border-gov-blue-500/40">
              <Smartphone size={32} />
            </div>
            <h3 className="text-base font-black text-white">Install on iPhone / iPad</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              To install <strong>LingkodBrgyAi</strong> on your home screen:
            </p>
            <div className="bg-slate-950 p-4 rounded-2xl text-left text-xs space-y-2.5 text-slate-300 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-gov-blue-600 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                <span>Tap the <strong>Share</strong> button (⎋ / icon with arrow up) at the bottom of Safari.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-gov-blue-600 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                <span>Scroll down and tap <strong>"Add to Home Screen"</strong>.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-gov-blue-600 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">3</span>
                <span>Tap <strong>"Add"</strong> on the top right.</span>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-full bg-gov-blue-600 hover:bg-gov-blue-700 text-white font-bold text-xs"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

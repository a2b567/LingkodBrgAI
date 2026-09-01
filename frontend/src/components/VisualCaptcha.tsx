import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Volume2, ShieldCheck, HelpCircle } from 'lucide-react';

interface VisualCaptchaProps {
  onCodeChange?: (code: string) => void;
  value: string;
  onChange: (val: string) => void;
  error?: boolean;
}

export const VisualCaptcha: React.FC<VisualCaptchaProps> = ({
  onCodeChange,
  value,
  onChange,
  error = false,
}) => {
  const [code, setCode] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate random 5-character string (avoiding confusing chars like 0/O, 1/I/l)
  const generateRandomCode = useCallback(() => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  // Draw distorted canvas CAPTCHA image
  const drawCaptcha = useCallback((text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background fill
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Add noise background dots
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 150)}, 0.15)`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2 + 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add background noise lines
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, 0.3)`;
      ctx.lineWidth = Math.random() * 1.5 + 0.5;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height
      );
      ctx.stroke();
    }

    // Render each distorted character
    const fontFamilies = ['serif', 'sans-serif', 'monospace', 'cursive', 'Georgia', 'Trebuchet MS'];
    const charSpacing = width / (text.length + 1);

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      ctx.save();

      const fontSize = Math.floor(Math.random() * 6) + 24; // 24px - 30px
      const fontFamily = fontFamilies[Math.floor(Math.random() * fontFamilies.length)];
      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = `rgb(${Math.floor(Math.random() * 80)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 140)})`;

      const x = charSpacing * (i + 1) + (Math.random() * 4 - 2);
      const y = height / 2 + (Math.random() * 8 - 4) + 6;

      ctx.translate(x, y);
      const angle = (Math.random() * 40 - 20) * (Math.PI / 180); // Rotate -20deg to +20deg
      ctx.rotate(angle);

      ctx.fillText(char, -fontSize / 4, fontSize / 4);
      ctx.restore();
    }

    // Strike-through line over characters
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(10, height / 2 + Math.random() * 8 - 4);
    ctx.lineTo(width - 10, height / 2 + Math.random() * 8 - 4);
    ctx.stroke();
  }, []);

  const refreshCaptcha = useCallback(() => {
    const newCode = generateRandomCode();
    setCode(newCode);
    if (onCodeChange) onCodeChange(newCode);
    drawCaptcha(newCode);
  }, [generateRandomCode, onCodeChange, drawCaptcha]);

  useEffect(() => {
    refreshCaptcha();
  }, []);

  // Text-to-Speech audio reading
  const playAudio = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // Spells out characters separated by pauses
    const spokenText = code.split('').join('. ');
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = 0.7; // Slower rate for clarity
    utterance.pitch = 1.0;

    setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 ${
      error
        ? 'border-rose-400 bg-rose-50/40 dark:bg-rose-950/20'
        : 'border-sky-300 dark:border-sky-800 bg-sky-50/60 dark:bg-slate-900/90'
    }`}>
      {/* CAPTCHA Header Bar (Matching reference UI) */}
      <div className="bg-sky-400 dark:bg-sky-700 px-4 py-2.5 flex items-center justify-between text-white font-bold text-xs select-none">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-sky-100" />
          <span>Match the characters in the picture</span>
        </div>
        <button
          type="button"
          onClick={() => alert('Type the characters shown in the distorted image box. Click the speaker icon to listen, or refresh if unreadable.')}
          className="text-[11px] font-semibold text-sky-100 hover:text-white hover:underline flex items-center gap-1 bg-transparent border-none p-0 cursor-pointer"
        >
          <HelpCircle size={13} />
          Help
        </button>
      </div>

      {/* Content Area */}
      <div className="p-4 space-y-3">
        <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
          To continue, type the characters you see in the picture.{' '}
          <span
            onClick={refreshCaptcha}
            className="text-sky-600 dark:text-sky-400 hover:underline cursor-pointer font-bold"
          >
            Why?
          </span>
        </p>

        {/* Picture Box + Controls */}
        <div className="flex items-center gap-2">
          {/* Distorted Image Canvas Box */}
          <div className="relative border-2 border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white shadow-inner flex-1 max-w-[240px]">
            <canvas
              ref={canvasRef}
              width={230}
              height={65}
              className="block w-full h-[65px] select-none"
            />
          </div>

          {/* Audio & Refresh Buttons */}
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={playAudio}
              title="Listen to audio CAPTCHA"
              className={`p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-400 transition-colors ${
                isPlayingAudio ? 'animate-pulse text-sky-600 border-sky-400' : ''
              }`}
            >
              <Volume2 size={16} />
            </button>
            <button
              type="button"
              onClick={refreshCaptcha}
              title="Generate new characters"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-400 transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
          The picture contains <span className="font-bold text-slate-700 dark:text-slate-200">{code.length} characters</span>.
        </p>

        {/* Input Row */}
        <div className="flex items-center gap-3 pt-1">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex-shrink-0">
            Characters:
          </label>
          <input
            type="text"
            required
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type characters here"
            className={`flex-1 bg-white dark:bg-slate-950 border-2 rounded-xl px-3.5 py-2 text-sm font-extrabold tracking-widest focus:outline-none transition-colors ${
              error
                ? 'border-rose-400 text-rose-600 dark:text-rose-400'
                : 'border-slate-300 dark:border-slate-700 focus:border-sky-500 text-slate-900 dark:text-white'
            }`}
          />
        </div>

        {error && (
          <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full flex-shrink-0" />
            Incorrect code — please enter the new characters shown in the picture.
          </p>
        )}
      </div>
    </div>
  );
};
export default VisualCaptcha;
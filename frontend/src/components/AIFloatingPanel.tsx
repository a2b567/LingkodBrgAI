import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, User, Copy, Check, Trash, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

const parseMarkdown = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const code = part.slice(3, -3).trim();
      const firstLineBreak = code.indexOf('\n');
      const language = firstLineBreak !== -1 ? code.slice(0, firstLineBreak) : '';
      const actualCode = firstLineBreak !== -1 ? code.slice(firstLineBreak + 1) : code;
      return (
        <pre key={i} className="my-2 p-2.5 bg-slate-950 text-slate-200 rounded-xl overflow-x-auto text-[10px] font-mono border border-slate-800/80">
          {language && <div className="text-[8px] uppercase text-slate-500 font-bold mb-1 border-b border-slate-800/50 pb-0.5">{language}</div>}
          <code>{actualCode}</code>
        </pre>
      );
    }
    const lines = part.split('\n');
    return lines.map((line, lineIdx) => {
      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      const formatInline = (str: string) => {
        const boldParts = str.split(/(\*\*.*?\*\*)/g);
        return boldParts.map((bp, bpIdx) => {
          if (bp.startsWith('**') && bp.endsWith('**')) {
            return <strong key={bpIdx} className="font-extrabold text-gov-gold-400 dark:text-gov-gold-300">{bp.slice(2, -2)}</strong>;
          }
          return bp;
        });
      };
      if (isBullet) {
        return (
          <li key={lineIdx} className="ml-3 list-disc mt-1 list-inside text-current font-medium">
            {formatInline(line.trim().slice(2))}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={lineIdx} className="h-1.5"></div>;
      }
      return (
        <p key={lineIdx} className="mt-1 text-current font-medium">
          {formatInline(line)}
        </p>
      );
    });
  });
};

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

export const AIFloatingPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([
    { sender: 'ai', text: 'Mabuhay! I am your Barangay Lawrence AI Assistant. Ask me anything about residents, households, blotters, certificates, or scheduling.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  
  // Voice feature states
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const { user } = useAuthStore();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setPrompt(transcript);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your current browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  // Text to Speech AI Readout
  const speakText = (text: string) => {
    if (!voiceOutputEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    // Clean text for speech
    const cleanText = text.replace(/[*#`\-_]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(index);
    setTimeout(() => {
      setCopiedIdx(null);
    }, 2000);
  };

  const handleClearHistory = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setHistory([
      { sender: 'ai', text: 'Mabuhay! I am your Barangay Lawrence AI Assistant. Ask me anything about residents, households, blotters, certificates, or scheduling.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
  };

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || prompt;
    if (!query.trim()) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    // Add user message
    const newMsg: ChatMessage = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setHistory(prev => [...prev, newMsg]);
    if (!textToSend) setPrompt('');

    setIsTyping(true);

    try {
      const res = await api.ai.chat(query);
      setIsTyping(false);

      const aiMsg: ChatMessage = {
        sender: 'ai',
        text: res.response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setHistory(prev => [...prev, aiMsg]);

      // Speak AI response out loud if Voice Output is enabled
      speakText(res.response);
    } catch (error) {
      setIsTyping(false);
      const errMsg = 'Sorry, I encountered an issue querying the database. Please try again.';
      setHistory(prev => [...prev, {
        sender: 'ai',
        text: errMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      speakText(errMsg);
    }
  };

  const handleSuggestion = (txt: string) => {
    handleSend(txt);
  };

  const isAdmin = user && user.role !== 'Resident';

  const suggestions = isAdmin 
    ? ["Show senior citizens", "List indigent households", "Summarize today's blotters", "Appointment congestion"]
    : ["Request certificate status", "How to file a blotter", "Check upcoming holidays", "Schedule appointment"];

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-tr from-gov-blue-600 via-gov-blue-700 to-indigo-700 hover:from-gov-blue-700 hover:to-indigo-800 text-white p-3.5 sm:p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 group border border-gov-blue-400/30"
        >
          <Bot size={22} className="group-hover:rotate-12 transition-transform duration-300 text-gov-gold-400" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out font-bold whitespace-nowrap text-xs sm:text-sm">
            Ask Barangay AI
          </span>
        </button>
      )}

      {/* Main Chat Interface */}
      {isOpen && (
        <div className="w-[340px] sm:w-[400px] max-w-[calc(100vw-2rem)] h-[520px] sm:h-[580px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform scale-100 origin-bottom-right glass-panel">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-gov-blue-900 via-gov-blue-800 to-indigo-900 text-white p-4 flex items-center justify-between border-b border-gov-blue-800 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gov-blue-500/20 rounded-xl border border-gov-blue-400/30">
                <Bot size={20} className="text-gov-gold-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-wide">Barangay AI Voice Assistant</h3>
                <span className="text-[10px] text-slate-300 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                  AI Voice Connected
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {/* Toggle Voice Output TTS */}
              <button
                type="button"
                onClick={() => {
                  if (voiceOutputEnabled && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                  }
                  setVoiceOutputEnabled(!voiceOutputEnabled);
                }}
                className={`p-1.5 rounded-lg transition-colors ${
                  voiceOutputEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                }`}
                title={voiceOutputEnabled ? "Voice Output Enabled" : "Voice Output Muted"}
              >
                {voiceOutputEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              <button
                type="button"
                onClick={handleClearHistory}
                className="text-slate-300 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                title="Clear chat history"
              >
                <Trash size={15} />
              </button>

              <button
                onClick={() => {
                  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                  setIsOpen(false);
                }}
                className="text-slate-300 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                title="Close AI panel"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 scroll-smooth">
            {history.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 max-w-[88%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'} group`}
              >
                <div className={`p-2 rounded-2xl w-8 h-8 flex items-center justify-center flex-shrink-0 ${
                  msg.sender === 'user' 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200' 
                    : 'bg-gov-blue-900 text-gov-gold-400 border border-gov-blue-800'
                }`}>
                  {msg.sender === 'user' ? <User size={15} /> : <Bot size={15} />}
                </div>

                <div className="relative">
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gov-blue-600 text-white rounded-tr-none shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700/80 shadow-sm'
                  }`}>
                    {parseMarkdown(msg.text)}
                  </div>
                  <div className={`flex items-center gap-2 mt-1 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[9px] text-slate-400 font-medium">
                      {msg.time}
                    </span>
                    {msg.sender === 'ai' && msg.text && (
                      <button
                        onClick={() => speakText(msg.text)}
                        className="text-slate-400 hover:text-gov-blue-500 dark:hover:text-gov-blue-400 text-[10px] flex items-center gap-1 font-bold"
                        title="Read aloud"
                      >
                        <Volume2 size={11} />
                        Read
                      </button>
                    )}
                    {msg.text && (
                      <button
                        onClick={() => handleCopy(msg.text, i)}
                        type="button"
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                        title="Copy message"
                      >
                        {copiedIdx === i ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 mr-auto max-w-[85%]">
                <div className="p-2 rounded-2xl w-8 h-8 bg-gov-blue-900 text-gov-gold-400 border border-gov-blue-800 flex items-center justify-center flex-shrink-0">
                  <Bot size={15} />
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                  <div className="w-1.5 h-1.5 bg-gov-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gov-blue-500 rounded-full animate-bounce delay-75"></div>
                  <div className="w-1.5 h-1.5 bg-gov-blue-500 rounded-full animate-bounce delay-150"></div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold ml-1">AI Thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex-shrink-0">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestion(s)}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-gov-blue-50 dark:hover:bg-gov-blue-950 text-[10px] text-slate-700 dark:text-slate-300 hover:text-gov-blue-700 dark:hover:text-gov-blue-300 font-bold rounded-full border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
                >
                  <Sparkles size={10} className="text-gov-gold-500" />
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Input & Speech Recognition Controls */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 flex-shrink-0">
            
            {/* Microphone STT Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                isListening 
                  ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/30' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={isListening ? "Listening... Speak now" : "Speak to AI Assistant (Voice Input)"}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <input
              type="text"
              placeholder={isListening ? "Listening to your voice..." : "Ask AI or speak via mic..."}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-gov-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <button
              onClick={() => handleSend()}
              disabled={!prompt.trim()}
              className="p-2 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center cursor-pointer shadow-sm"
              title="Send message"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default AIFloatingPanel;

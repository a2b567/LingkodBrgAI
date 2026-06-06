import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, User, Copy, Check, Trash } from 'lucide-react';
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
          <li key={lineIdx} className="ml-3 list-disc mt-0.5 list-inside text-slate-700 dark:text-slate-300">
            {formatInline(line.trim().slice(2))}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={lineIdx} className="h-1.5"></div>;
      }
      return (
        <p key={lineIdx} className="mt-0.5">
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
  const { user } = useAuthStore();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(index);
    setTimeout(() => {
      setCopiedIdx(null);
    }, 2000);
  };

  const handleClearHistory = () => {
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

      // Create new AI message placeholder
      const aiMsgPlaceholder: ChatMessage = {
        sender: 'ai',
        text: '',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setHistory(prev => [...prev, aiMsgPlaceholder]);

      const fullResponse = res.response;
      const words = fullResponse.split(' ');
      let currentText = '';
      let i = 0;

      const timer = setInterval(() => {
        if (i < words.length) {
          currentText += (i === 0 ? '' : ' ') + words[i];
          setHistory(prev => {
            const updated = [...prev];
            if (updated.length > 0) {
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                text: currentText
              };
            }
            return updated;
          });
          i++;
        } else {
          clearInterval(timer);
        }
      }, 25);
    } catch (error) {
      setIsTyping(false);
      setHistory(prev => [...prev, {
        sender: 'ai',
        text: 'Sorry, I encountered an issue querying the database. Please try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
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
          className="flex items-center gap-2 bg-gradient-to-tr from-gov-blue-600 to-gov-blue-800 hover:from-gov-blue-700 hover:to-gov-blue-900 text-white p-3.5 sm:p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 group"
        >
          <Bot size={22} className="group-hover:rotate-12 transition-transform duration-300" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out font-medium whitespace-nowrap text-xs sm:text-sm">
            Ask Barangay AI
          </span>
        </button>
      )}

      {/* Main Chat Interface */}
      {isOpen && (
        <div className="w-[340px] sm:w-[380px] max-w-[calc(100vw-2rem)] h-[500px] sm:h-[550px] bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform scale-100 origin-bottom-right glass-panel">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-gov-blue-800 via-gov-blue-700 to-gov-blue-900 text-white p-4 flex items-center justify-between border-b border-gov-blue-900">
            <div className="flex items-center gap-2">
              <Bot size={22} className="text-gov-gold-400" />
              <div>
                <h3 className="font-semibold text-sm">Barangay AI Agent</h3>
                <span className="text-[10px] text-slate-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  Active Secure Session
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearHistory}
                className="text-slate-200 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                title="Clear chat history"
              >
                <Trash size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-200 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
                title="Close AI assistant panel"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
            {history.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'} group`}
              >
                <div className={`p-2 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 ${
                  msg.sender === 'user' ? 'bg-slate-100 dark:bg-slate-800' : 'bg-gov-blue-100 dark:bg-gov-blue-950 text-gov-blue-800 dark:text-gov-blue-200'
                }`}>
                  {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>

                <div className="relative">
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gov-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-black dark:text-slate-200 rounded-tl-none border border-slate-200/50 dark:border-slate-700/50'
                  }`}>
                    {parseMarkdown(msg.text)}
                  </div>
                  <div className={`flex items-center gap-1.5 mt-1 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[9px] text-slate-400">
                      {msg.time}
                    </span>
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
                <div className="p-2 rounded-full w-8 h-8 bg-gov-blue-100 dark:bg-gov-blue-950 text-gov-blue-800 dark:text-gov-blue-200 flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75"></div>
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestion(s)}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-gov-blue-50 dark:hover:bg-gov-blue-950 text-[10px] text-slate-600 dark:text-slate-300 hover:text-gov-blue-700 dark:hover:text-gov-blue-300 font-medium rounded-full border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-all flex items-center gap-1"
                >
                  <Sparkles size={10} className="text-gov-gold-500" />
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask about residents, files, schedules..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-gov-blue-500 dark:focus:border-gov-blue-400 text-black dark:text-slate-100"
            />
            <button
              onClick={() => handleSend()}
              disabled={!prompt.trim()}
              className="p-2 bg-gov-blue-600 hover:bg-gov-blue-700 text-white rounded-xl disabled:opacity-50 disabled:hover:bg-gov-blue-600 transition-colors flex items-center justify-center"
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

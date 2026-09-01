import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Users, Home, Bell, AlertTriangle, Briefcase, Cpu, UserCheck, Copy, Check, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { api } from '../services/api';
import type { DashboardStats } from '../types';

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
            return <strong key={bpIdx} className="font-extrabold text-gov-gold-400">{bp.slice(2, -2)}</strong>;
          }
          return bp;
        });
      };
      if (isBullet) {
        return (
          <li key={lineIdx} className="ml-3 list-disc mt-1 list-inside text-slate-100 font-medium">
            {formatInline(line.trim().slice(2))}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={lineIdx} className="h-1.5"></div>;
      }
      return (
        <p key={lineIdx} className="mt-1 text-slate-100 font-medium">
          {formatInline(line)}
        </p>
      );
    });
  });
};

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role === 'Resident') {
      navigate('/appointments');
    }
  }, [user, navigate]);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<{ sender: 'ai' | 'user'; text: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [isChatMinimized, setIsChatMinimized] = useState(true);

  // Notification state
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; content: string; type: string; is_read: boolean }>>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const streamIntervalRef = React.useRef<any>(null);
  const initialInsightFetched = React.useRef(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGeneratingInsight, isSending]);

  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, []);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(index);
    setTimeout(() => {
      setCopiedIdx(null);
    }, 2000);
  };

  const streamMessage = (text: string, sender: 'ai' | 'user') => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
    }

    // Create new AI message placeholder
    const aiMsgPlaceholder = {
      sender,
      text: ''
    };
    setMessages(prev => [...prev, aiMsgPlaceholder]);

    const words = text.split(' ');
    let currentText = '';
    let i = 0;

    streamIntervalRef.current = setInterval(() => {
      if (i < words.length) {
        currentText += (i === 0 ? '' : ' ') + words[i];
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              text: currentText
            };
          }
          return updated;
        });
        scrollToBottom();
        i++;
      } else {
        if (streamIntervalRef.current) {
          clearInterval(streamIntervalRef.current);
          streamIntervalRef.current = null;
        }
      }
    }, 20);
  };

  // Add notification bell to header
  const NotificationBell = () => (
    <div className="relative inline-block">
      <button
        type="button"
        className="relative flex items-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        onClick={() => setShowNotifPanel(!showNotifPanel)}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full border-2 border-white dark:border-gray-800">
            {unreadCount}
          </span>
        )}
      </button>
      {showNotifPanel && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20">
          <div className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-sm text-slate-700 dark:text-slate-300">
            Notifications
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {notifications.length === 0 && (
              <li className="p-3 text-sm text-slate-500 dark:text-slate-400">No notifications</li>
            )}
            {notifications.map(notif => (
              <li
                key={notif.id}
                className={`p-3 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer ${notif.is_read ? '' : 'bg-slate-100 dark:bg-slate-700'}`}
                onClick={() => handleMarkRead(notif.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{notif.title}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{notif.content}</p>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{notif.type}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const generateInitialInsight = async (currentStats: DashboardStats) => {
    setIsGeneratingInsight(true);
    setMessages([]);
    try {
      const prompt = `Based on the following statistics, write a 2-sentence actionable recommendation or summary insight for the Barangay Captain:\n` +
        `- Total Residents: ${currentStats.total_residents}\n` +
        `- Active Incident Blotters: ${currentStats.active_incidents}\n` +
        `- Households below sustenance/Indigent: ${currentStats.indigent_households}\n` +
        `- Active Business permits: ${currentStats.active_businesses}`;
      const res = await api.ai.chat(prompt);
      setIsGeneratingInsight(false);
      streamMessage(res.response, 'ai');
    } catch (err) {
      setIsGeneratingInsight(false);
      streamMessage("Demographic distributions indicate stable residency trends. Outstanding blotter disputes require scheduled mediations.", 'ai');
    }
  };

  const handleResetChat = () => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    generateInitialInsight(stats!);
  };

  // Fetch notifications on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.notifications.list();
        setNotifications(res);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };
    fetchNotifications();
  }, []);

  // Fetch dashboard statistics on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const res = await api.analytics.dashboard();
        setStats(res);
        setIsLoading(false);
        if (!initialInsightFetched.current) {
          initialInsightFetched.current = true;
          generateInitialInsight(res);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Mark a notification as read
  const handleMarkRead = async (id: string) => {
    try {
      await api.notifications.read(id);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending || !stats) return;

    const userText = inputValue;
    setInputValue('');
    
    // Add user message to history
    const updatedMessages: { sender: 'ai' | 'user'; text: string }[] = [...messages, { sender: 'user', text: userText }];
    setMessages(updatedMessages);
    setIsSending(true);

    try {
      // Build a contextual prompt for the AI including the dashboard stats
      const statsContext = `Context: You are the AI Assistant for Barangay Lawrence. Current Stats:\n` +
        `- Total Residents: ${stats.total_residents}\n` +
        `- Active Incident Blotters: ${stats.active_incidents}\n` +
        `- Households below sustenance/Indigent: ${stats.indigent_households}\n` +
        `- Active Business permits: ${stats.active_businesses}\n` +
        `Please answer the following user query contextually:`;

      // Build conversation history
      const historyText = updatedMessages.map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
      
      const fullPrompt = `${statsContext}\n\nConversation History:\n${historyText}\n\nAssistant:`;

      const res = await api.ai.chat(fullPrompt);
      setIsSending(false);
      streamMessage(res.response, 'ai');
    } catch (err) {
      setIsSending(false);
      streamMessage("I'm sorry, I couldn't reach the local AI service. Please try again later.", 'ai');
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-2xl w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
          ))}
        </div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
      </div>
    );
  }

  // Custom styled Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl text-white text-[11px] font-semibold">
          <p className="text-slate-400 mb-0.5">{label}</p>
          <p className="text-gov-gold-400 font-bold">
            {payload[0].name}: <span className="text-white font-extrabold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Charts data compilation
  const ageData = [
    { name: 'Children', value: stats.age_demographics.children, color: '#3b6fa8' },
    { name: 'Youth', value: stats.age_demographics.youth, color: '#cca210' },
    { name: 'Adults', value: stats.age_demographics.adults, color: '#2c568a' },
    { name: 'Seniors', value: stats.age_demographics.seniors, color: '#ef4444' },
  ];

  const genderData = [
    { name: 'Male', value: stats.gender_ratio?.Male ?? 0, color: '#3b6fa8' },
    { name: 'Female', value: stats.gender_ratio?.Female ?? 0, color: '#ec4899' },
  ];

  const statCards = [
    { title: 'Total Residents', val: stats.total_residents, desc: 'Registered in system', icon: <Users size={22} className="text-gov-blue-600 dark:text-gov-blue-400" />, bg: 'bg-gov-blue-50 dark:bg-gov-blue-950/20' },
    { title: 'Households Group', val: stats.total_households, desc: `${stats.indigent_households} Indigent profiles`, icon: <Home size={22} className="text-gov-gold-600 dark:text-gov-gold-400" />, bg: 'bg-gov-gold-50 dark:bg-gov-gold-950/20' },
    { title: 'Active Blotters', val: stats.active_incidents, desc: 'Mediation cases', icon: <AlertTriangle size={22} className="text-rose-600 dark:text-rose-400" />, bg: 'bg-rose-50 dark:bg-rose-950/20' },
    { title: 'Active Businesses', val: stats.active_businesses, desc: 'Commercial entities', icon: <Briefcase size={22} className="text-emerald-600 dark:text-emerald-400" />, bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
  ];

  return (
    <div className="space-y-6 relative z-10">
      
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-normal text-slate-900 dark:text-white uppercase">COMMUNITY DASHBOARD</h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold tracking-wide">Real-time demographic statistics & analytics</p>
        </div>
        {/* Notification bell */}
        <NotificationBell />
      </div>

      {/* AI Strategic Chat Assistant Panel */}
      <div className={`relative w-full bg-slate-900/95 text-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] overflow-hidden z-20 flex flex-col border border-slate-700/60 transition-all duration-300 ease-in-out ${isChatMinimized ? 'shadow-lg' : 'max-h-[700px]'}`}>
        {/* Decorative top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gov-gold-400 to-transparent opacity-75" />

        {/* Chat header (clickable to toggle) */}
        <div 
          onClick={() => setIsChatMinimized(prev => !prev)}
          className={`px-4 sm:px-6 py-3 flex items-center justify-between bg-slate-900/90 hover:bg-slate-800/80 transition-colors duration-200 cursor-pointer select-none relative z-10 ${isChatMinimized ? '' : 'border-b border-slate-700/50'}`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="p-2.5 bg-gradient-to-br from-gov-gold-500/20 to-gov-gold-600/10 rounded-xl text-gov-gold-400 border border-gov-gold-500/30 shadow-[0_0_16px_rgba(204,162,16,0.15)] flex items-center justify-center">
                <Cpu size={20} />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h4 className="text-xs sm:text-sm font-black uppercase text-gov-gold-400 tracking-wider flex items-center gap-1.5 truncate">
                  <Sparkles size={14} className="text-gov-gold-300 flex-shrink-0" />
                  AI STRATEGIC CHAT ASSISTANT
                </h4>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                  Groq AI Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">Barangay Lawrence Smart Operations Officer • Fast Groq AI Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button"
              onClick={handleResetChat} 
              disabled={isGeneratingInsight || isSending || isChatMinimized}
              className="text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 bg-white/5 hover:bg-white/15 text-gov-gold-400 hover:text-gov-gold-300 rounded-xl border border-gov-gold-500/25 hover:border-gov-gold-400/50 transition-all duration-200 disabled:opacity-30 active:scale-95 shadow-sm backdrop-blur-sm"
            >
              Reset Chat
            </button>
            <button
              type="button"
              onClick={() => setIsChatMinimized(prev => !prev)}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all duration-200 active:scale-95 border border-slate-700/50 hover:border-slate-600/80 flex items-center justify-center"
              title={isChatMinimized ? 'Expand' : 'Minimize'}
            >
              {isChatMinimized ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>
        </div>

        {/* Collapsible body */}
        {!isChatMinimized && (
        <>
        {/* Message history */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex flex-col min-h-[180px] max-h-[420px] scroll-smooth">
          {messages.map((msg, index) => {
            if (!msg.text || !msg.text.trim()) return null;
            return (
              <div 
                key={index} 
                className={`flex gap-3 max-w-[88%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'} group`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gov-gold-500/25 to-gov-gold-600/15 text-gov-gold-400 border border-gov-gold-500/30 flex items-center justify-center flex-shrink-0 text-[11px] font-black tracking-wide mt-0.5 shadow-[0_0_12px_rgba(204,162,16,0.12)]">
                    AI
                  </div>
                )}
                <div className="relative">
                  <div 
                    className={`p-4 rounded-2xl text-sm leading-relaxed font-medium shadow-lg ${
                      msg.sender === 'user' 
                        ? 'bg-gradient-to-br from-gov-blue-600 to-gov-blue-700 text-white rounded-tr-sm border border-gov-blue-500/40' 
                        : 'bg-slate-800/90 text-slate-100 rounded-tl-sm border border-slate-700/60 backdrop-blur-sm'
                    }`}
                  >
                    {parseMarkdown(msg.text)}
                  </div>
                  <div className={`flex items-center gap-1.5 mt-1 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.text && (
                      <button
                        onClick={() => handleCopy(msg.text, index)}
                        type="button"
                        className="text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded-lg hover:bg-white/5"
                        title="Copy message"
                      >
                        {copiedIdx === index ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isGeneratingInsight && (
            <div className="flex gap-3 max-w-[88%] self-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gov-gold-500/25 to-gov-gold-600/15 text-gov-gold-400 border border-gov-gold-500/30 flex items-center justify-center flex-shrink-0 text-[11px] font-black mt-0.5 animate-pulse shadow-[0_0_12px_rgba(204,162,16,0.12)]">
                AI
              </div>
              <div className="p-4 rounded-2xl text-sm leading-relaxed font-medium bg-slate-800/90 text-slate-400 rounded-tl-sm border border-slate-700/60 animate-pulse">
                Analyzing statistics and compiling strategy...
              </div>
            </div>
          )}

          {isSending && (
            <div className="flex gap-3 max-w-[88%] self-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gov-gold-500/25 to-gov-gold-600/15 text-gov-gold-400 border border-gov-gold-500/30 flex items-center justify-center flex-shrink-0 text-[11px] font-black mt-0.5 animate-pulse shadow-[0_0_12px_rgba(204,162,16,0.12)]">
                AI
              </div>
              <div className="p-4 rounded-2xl text-sm leading-relaxed font-medium bg-slate-800/90 text-slate-400 rounded-tl-sm border border-slate-700/60 flex items-center gap-2">
                <span className="w-2 h-2 bg-gov-gold-400 rounded-full animate-bounce [animation-delay:0ms]"></span>
                <span className="w-2 h-2 bg-gov-gold-400 rounded-full animate-bounce [animation-delay:150ms]"></span>
                <span className="w-2 h-2 bg-gov-gold-400 rounded-full animate-bounce [animation-delay:300ms]"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="px-6 py-4 border-t border-slate-700/50 bg-slate-950/60 backdrop-blur-sm flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about active incidents, poverty levels, business reports, or next steps..."
            disabled={isGeneratingInsight || isSending}
            className="flex-1 px-5 py-3 bg-slate-800/70 border border-slate-600/50 focus:border-gov-gold-400/60 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-gov-gold-400/20 placeholder-slate-500 disabled:opacity-40 transition-all duration-300 shadow-inner"
          />
          <button
            type="submit"
            disabled={isGeneratingInsight || isSending || !inputValue.trim()}
            className="px-6 py-3 bg-gradient-to-r from-gov-gold-500 to-gov-gold-400 hover:from-gov-gold-400 hover:to-gov-gold-300 text-gov-blue-950 font-extrabold text-sm rounded-2xl shadow-lg transition-all duration-300 disabled:opacity-40 active:scale-95 hover:shadow-[0_0_20px_rgba(204,162,16,0.4)]"
          >
            Send
          </button>
        </form>
        </>
        )}
      </div>

      {/* Numerical cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="glass-card p-5 flex items-center justify-between relative overflow-hidden group">
            <div className="space-y-1 z-10">
              <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-widest block">{card.title}</span>
              <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white transition-colors">{card.val}</h3>
              <p className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold">{card.desc}</p>
            </div>
            <div className={`p-4 rounded-2xl ${card.bg} z-10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-inner`}>
              {card.icon}
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Demographic charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Age demographics (Bar Chart) */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col">
          <h4 className="text-xs font-extrabold tracking-wider uppercase text-slate-700 dark:text-slate-200 mb-6">Population Age Demographics</h4>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5f8ec3" stopOpacity={0.95}/>
                    <stop offset="100%" stopColor="#2c568a" stopOpacity={0.6}/>
                  </linearGradient>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#eedc4e" stopOpacity={0.95}/>
                    <stop offset="100%" stopColor="#b07f0c" stopOpacity={0.6}/>
                  </linearGradient>
                  <linearGradient id="navyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b6fa8" stopOpacity={0.95}/>
                    <stop offset="100%" stopColor="#1f3550" stopOpacity={0.6}/>
                  </linearGradient>
                  <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity={0.95}/>
                    <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis dataKey="name" fontSize={11} stroke="#94A3B8" axisLine={false} tickLine={false} />
                <YAxis fontSize={11} stroke="#94A3B8" axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {ageData.map((_, index) => {
                    const grads = ['url(#blueGrad)', 'url(#goldGrad)', 'url(#navyGrad)', 'url(#redGrad)'];
                    return <Cell key={`cell-${index}`} fill={grads[index % grads.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Demographics (Pie Chart) */}
        <div className="glass-card p-6 flex flex-col">
          <h4 className="text-xs font-extrabold tracking-wider uppercase text-slate-700 dark:text-slate-200 mb-6">Gender Demographics</h4>
          <div className="h-56 flex-grow relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center indicators */}
            <div className="absolute top-[48%] left-0 right-0 transform -translate-y-1/2 text-center pointer-events-none">
              <span className="text-[10px] text-slate-600 dark:text-slate-300 uppercase tracking-widest font-extrabold block">TOTAL</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {genderData.reduce((a, b) => a + b.value, 0)}
              </span>
            </div>
          </div>

          {/* Color legends */}
          <div className="flex justify-center gap-6 mt-4">
            {genderData.map((g, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${g.name === 'Male' ? 'bg-[#3b6fa8]' : 'bg-[#ec4899]'}`}></span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{g.name} ({g.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly certificate revenues */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col">
          <h4 className="text-xs font-extrabold tracking-wider uppercase text-slate-700 dark:text-slate-200 mb-6">Certificate & Permit Revenues (PHP)</h4>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.revenue_history}>
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#cca210" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="#cca210" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis dataKey="month" fontSize={11} stroke="#94A3B8" axisLine={false} tickLine={false} />
                <YAxis fontSize={11} stroke="#94A3B8" axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="amount" stroke="#cca210" strokeWidth={3} dot={{ fill: '#cca210', r: 4, strokeWidth: 1, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demographic distribution details card */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <h4 className="text-xs font-extrabold tracking-wider uppercase text-slate-700 dark:text-slate-200 mb-4">Voter and Health Registry</h4>
          
          <div className="space-y-3.5 my-auto">
            <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/80 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:translate-x-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Registered Voters</span>
              <span className="text-xs font-extrabold bg-gov-blue-500/10 text-gov-blue-600 dark:text-gov-blue-400 px-2.5 py-0.5 rounded-full border border-gov-blue-500/20">
                {stats.voters_count} residents
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/80 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:translate-x-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Senior Citizens (60+)</span>
              <span className="text-xs font-extrabold bg-gov-gold-500/10 text-gov-gold-600 dark:text-gov-gold-400 px-2.5 py-0.5 rounded-full border border-gov-gold-500/20">
                {stats.senior_citizens} seniors
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/80 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:translate-x-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Solo Parents</span>
              <span className="text-xs font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                {stats.solo_parents} parents
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/80 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:translate-x-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">PWD Registry</span>
              <span className="text-xs font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {stats.pwd_residents} PWDs
              </span>
            </div>
          </div>
          
          <div className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold text-center border-t border-slate-200/55 dark:border-slate-800/55 pt-3.5 flex items-center justify-center gap-1">
            <UserCheck size={12} className="text-gov-blue-500" />
            Demographics data synced and audit logs active
          </div>
        </div>

      </div>
    </div>
  );
};
export default Dashboard;

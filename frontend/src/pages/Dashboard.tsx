import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Users, Home, AlertTriangle, Briefcase, Cpu, Lightbulb, UserCheck, Copy, Check
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

  const streamIntervalRef = React.useRef<any>(null);
  const initialInsightFetched = React.useRef(false);

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
        i++;
      } else {
        if (streamIntervalRef.current) {
          clearInterval(streamIntervalRef.current);
          streamIntervalRef.current = null;
        }
      }
    }, 20);
  };

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.analytics.dashboard();
        setStats(res);
        if (!initialInsightFetched.current) {
          initialInsightFetched.current = true;
          generateInitialInsight(res);
        }
      } catch (err) {
        // Handle fetch error
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

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
    { name: 'Male', value: stats.gender_ratio.Male || 3, color: '#3b6fa8' },
    { name: 'Female', value: stats.gender_ratio.Female || 3, color: '#ec4899' },
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
          <h2 className="text-2xl font-extrabold tracking-normal text-black dark:text-white">COMMUNITY DASHBOARD</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wide">Real-time demographic statistics & analytics</p>
        </div>
      </div>

      {/* AI Strategic Chat Assistant Panel */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Chat header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gov-gold-500/15 rounded-xl text-gov-gold-400 animate-pulse-subtle border border-gov-gold-500/25">
              <Cpu size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase text-gov-gold-400 tracking-widest flex items-center gap-1.5">
                <Lightbulb size={12} />
                AI Strategic Chat Assistant
              </h4>
              <p className="text-[10px] text-slate-300 font-medium">Barangay Lawrence Smart Operations Officer</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleResetChat} 
            disabled={isGeneratingInsight || isSending}
            className="text-[10px] font-bold uppercase tracking-widest px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-gov-gold-400 hover:text-gov-gold-300 rounded-full border border-gov-gold-500/30 transition-all duration-300 disabled:opacity-50 active:scale-95 shadow-sm"
          >
            Reset Chat
          </button>
        </div>

        {/* Message history */}
        <div className="p-5 space-y-4 max-h-[250px] overflow-y-auto min-h-[140px] flex flex-col">
          {messages.map((msg, index) => {
            if (!msg.text || !msg.text.trim()) return null;
            return (
              <div 
                key={index} 
                className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'} group`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-lg bg-gov-gold-500/20 text-gov-gold-400 border border-gov-gold-500/30 flex items-center justify-center flex-shrink-0 text-[10px] font-black tracking-wide mt-0.5 shadow-sm">
                    AI
                  </div>
                )}
                <div className="relative">
                  <div 
                    className={`p-3 rounded-2xl text-xs leading-relaxed font-medium shadow-md ${
                      msg.sender === 'user' 
                        ? 'bg-gov-blue-600 text-white rounded-tr-none border border-gov-blue-500/30' 
                        : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/50'
                    }`}
                  >
                    {parseMarkdown(msg.text)}
                  </div>
                  <div className={`flex items-center gap-1.5 mt-0.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.text && (
                      <button
                        onClick={() => handleCopy(msg.text, index)}
                        type="button"
                        className="text-slate-400 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                        title="Copy message"
                      >
                        {copiedIdx === index ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isGeneratingInsight && (
            <div className="flex gap-3 max-w-[85%] self-start">
              <div className="w-7 h-7 rounded-lg bg-gov-gold-500/20 text-gov-gold-400 border border-gov-gold-500/30 flex items-center justify-center flex-shrink-0 text-[10px] font-black mt-0.5 animate-pulse">
                AI
              </div>
              <div className="p-3 rounded-2xl text-xs leading-relaxed font-medium bg-slate-800 text-slate-400 rounded-tl-none border border-slate-700/50 animate-pulse">
                Analyzing statistics and compiling strategy...
              </div>
            </div>
          )}

          {isSending && (
            <div className="flex gap-3 max-w-[85%] self-start">
              <div className="w-7 h-7 rounded-lg bg-gov-gold-500/20 text-gov-gold-400 border border-gov-gold-500/30 flex items-center justify-center flex-shrink-0 text-[10px] font-black mt-0.5 animate-pulse">
                AI
              </div>
              <div className="p-3 rounded-2xl text-xs leading-relaxed font-medium bg-slate-800 text-slate-400 rounded-tl-none border border-slate-700/50 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]"></span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-950/40 flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about active incidents, poverty levels, business reports, or next steps..."
            disabled={isGeneratingInsight || isSending}
            className="flex-1 px-4 py-2.5 bg-slate-800/80 border border-slate-700 focus:border-gov-gold-400/60 rounded-xl text-xs text-white focus:outline-none placeholder-slate-400 disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={isGeneratingInsight || isSending || !inputValue.trim()}
            className="px-4 py-2.5 bg-gov-gold-500 hover:bg-gov-gold-400 text-gov-blue-950 font-bold text-xs rounded-xl shadow-md transition-all duration-200 disabled:opacity-50 active:scale-95 hover:shadow-[0_0_12px_rgba(204,162,16,0.35)]"
          >
            Send
          </button>
        </form>
      </div>

      {/* Numerical cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="glass-card p-5 flex items-center justify-between relative overflow-hidden group">
            <div className="space-y-1 z-10">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">{card.title}</span>
              <h3 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white transition-colors">{card.val}</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{card.desc}</p>
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
          <h4 className="text-xs font-extrabold tracking-wider uppercase text-slate-500 dark:text-slate-400 mb-6">Population Age Demographics</h4>
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
          <h4 className="text-xs font-extrabold tracking-wider uppercase text-slate-500 dark:text-slate-400 mb-6">Gender Demographics</h4>
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
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-extrabold block">TOTAL</span>
              <span className="text-2xl font-black text-black dark:text-white">
                {genderData.reduce((a, b) => a + b.value, 0)}
              </span>
            </div>
          </div>

          {/* Color legends */}
          <div className="flex justify-center gap-6 mt-4">
            {genderData.map((g, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${g.name === 'Male' ? 'bg-[#3b6fa8]' : 'bg-[#ec4899]'}`}></span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{g.name} ({g.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly certificate revenues */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col">
          <h4 className="text-xs font-extrabold tracking-wider uppercase text-slate-500 dark:text-slate-400 mb-6">Certificate & Permit Revenues (PHP)</h4>
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
          <h4 className="text-xs font-extrabold tracking-wider uppercase text-slate-500 dark:text-slate-400 mb-4">Voter and Health Registry</h4>
          
          <div className="space-y-3.5 my-auto">
            <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/80 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:translate-x-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Registered Voters</span>
              <span className="text-xs font-extrabold bg-gov-blue-500/10 text-gov-blue-600 dark:text-gov-blue-400 px-2.5 py-0.5 rounded-full border border-gov-blue-500/20">
                {stats.voters_count} residents
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/80 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:translate-x-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Senior Citizens (60+)</span>
              <span className="text-xs font-extrabold bg-gov-gold-500/10 text-gov-gold-600 dark:text-gov-gold-400 px-2.5 py-0.5 rounded-full border border-gov-gold-500/20">
                {stats.senior_citizens} seniors
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/80 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:translate-x-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Solo Parents</span>
              <span className="text-xs font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                {stats.solo_parents} parents
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/80 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:translate-x-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">PWD Registry</span>
              <span className="text-xs font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {stats.pwd_residents} PWDs
              </span>
            </div>
          </div>
          
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold text-center border-t border-slate-200/55 dark:border-slate-800/55 pt-3.5 flex items-center justify-center gap-1">
            <UserCheck size={12} className="text-gov-blue-500" />
            Demographics data synced and audit logs active
          </div>
        </div>

      </div>
    </div>
  );
};
export default Dashboard;

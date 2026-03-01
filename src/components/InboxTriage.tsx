import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, Star, ChevronRight, Mail, Search, Plus, Inbox, CheckCircle2 } from 'lucide-react';
import { EmailItem, Settings, Deal } from '../types';
import { motion } from 'motion/react';

interface InboxTriageProps {
  currentEmail: any;
}

export default function InboxTriage({ currentEmail }: InboxTriageProps) {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [extractedDeal, setExtractedDeal] = useState<Partial<Deal> | null>(null);
  const [finishedThreads, setFinishedThreads] = useState<string[]>([]);

  useEffect(() => {
    const init = async () => {
      const s = await fetchSettings();
      const f = await fetchFinishedThreads();
      generateMockEmails(s, f);
    };
    init();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
      return data;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const fetchFinishedThreads = async () => {
    try {
      const res = await fetch('/api/threads/finished');
      const data = await res.json();
      setFinishedThreads(data);
      return data;
    } catch (e) {
      return [];
    }
  };

  const markThreadFinished = async (id: string) => {
    await fetch('/api/threads/finish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thread_id: id })
    });
    setFinishedThreads([...finishedThreads, id]);
  };

  const calculatePriority = (email: any, settings: Settings | null): 'High' | 'Med' | 'Low' => {
    if (!settings) return 'Low';
    
    const body = (email.subject + " " + email.sender).toLowerCase();
    const isVip = settings.vips.some(v => email.sender.toLowerCase().includes(v.toLowerCase()));
    const hasKeywords = settings.rules.urgent_keywords.some(k => body.includes(k.toLowerCase()));
    
    const hoursOld = Math.floor((Date.now() - email.receivedAt.getTime()) / (1000 * 60 * 60));

    if (hasKeywords || isVip || (email.isUnread && hoursOld > 48)) return 'High';
    if (email.sender.includes('@') && hoursOld > 24) return 'Med';
    return 'Low';
  };

  const generateMockEmails = (s: Settings | null, f: string[] = []) => {
    const baseMock = [
      { id: '1', sender: 'nitzan@client.il', subject: 'Urgent: Quote for 50x Dell Servers', receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 3), isUnread: true },
      { id: '2', sender: 'procurement@global.com', subject: 'RFQ: Networking Hardware Q1', receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 49), isUnread: true },
      { id: '3', sender: 'vendor@cisco.com', subject: 'Price update for Catalyst series', receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 25), isUnread: false },
      { id: '4', sender: 'newsletter@itnews.com', subject: 'Weekly Tech Digest', receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 1), isUnread: false }
    ];

    const processed = baseMock
      .filter(m => !f.includes(m.id))
      .map(m => ({
        ...m,
        isVip: s?.vips.some(v => m.sender.toLowerCase().includes(v.toLowerCase())) || false,
        priority: calculatePriority(m, s)
      }));

    setEmails(processed as EmailItem[]);
    setLoading(false);
  };

  const saveDeal = async () => {
    if (!extractedDeal) return;
    await fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...extractedDeal,
        stage: 'new'
      })
    });
    setExtractedDeal(null);
    alert("Deal added to pipeline!");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50 border-red-100';
      case 'Med': return 'text-orange-600 bg-orange-50 border-orange-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const formatAge = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
          <Inbox className="w-4 h-4" /> Email Triage
        </h2>
        <div className="flex gap-2">
          <button className="p-2 bg-white border border-slate-200/60 rounded-xl hover:bg-slate-50 shadow-sm transition-all">
            <Mail className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {currentEmail && !finishedThreads.includes(currentEmail.id) && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200/60 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-[0.15em] ${getPriorityColor(calculatePriority(currentEmail, settings))}`}>
                {calculatePriority(currentEmail, settings)} Priority
              </span>
              {settings?.vips.some(v => currentEmail.sender.toLowerCase().includes(v.toLowerCase())) && (
                <span className="text-[10px] font-black px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1.5 uppercase tracking-[0.15em]">
                  <Star className="w-3.5 h-3.5 fill-amber-400" /> VIP Client
                </span>
              )}
            </div>
            <button 
              onClick={() => markThreadFinished(currentEmail.id)}
              className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-5 py-2.5 rounded-2xl border border-emerald-100 hover:bg-emerald-100 transition-all active:scale-95 shadow-sm shadow-emerald-100"
            >
              <CheckCircle2 className="w-4 h-4" /> Resolve Thread
            </button>
          </div>
          
          <div className="max-w-2xl">
            <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight tracking-tight">{currentEmail.subject}</h3>
            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black">
                {currentEmail.sender.charAt(0).toUpperCase()}
              </div>
              <p className="text-xs font-bold">{currentEmail.sender}</p>
            </div>
          </div>
        </motion.div>
      )}

      {(!currentEmail || finishedThreads.includes(currentEmail.id)) && (
        <div className="p-16 text-center bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] group hover:border-slate-300 transition-colors">
          <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
            <Mail className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
            {finishedThreads.includes(currentEmail?.id) ? "Thread successfully resolved" : "Select an email to begin triage"}
          </p>
        </div>
      )}

      {currentEmail && !finishedThreads.includes(currentEmail.id) && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Inbox className="w-4 h-4" /> Manual Pipeline Entry
              </h3>
              <button 
                onClick={() => setExtractedDeal({ customer_name: currentEmail.sender.split('@')[0], subject: currentEmail.subject, value: 0, notes: '' })}
                className="text-[10px] bg-slate-700 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-[0.2em] transition-all active:scale-95"
              >
                Manual Entry
              </button>
            </div>

            {extractedDeal ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-inner">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-2">Customer / Account</label>
                      <input 
                        type="text"
                        value={extractedDeal.customer_name}
                        onChange={(e) => setExtractedDeal({ ...extractedDeal, customer_name: e.target.value })}
                        className="w-full bg-transparent text-lg font-black text-white focus:outline-none border-b border-white/10 pb-2 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-2">Estimated Value</label>
                      <div className="flex items-center gap-2 border-b border-white/10 pb-2 focus-within:border-emerald-500 transition-colors">
                        <span className="text-lg font-black text-slate-500">$</span>
                        <input 
                          type="number"
                          value={extractedDeal.value}
                          onChange={(e) => setExtractedDeal({ ...extractedDeal, value: parseInt(e.target.value) })}
                          className="w-full bg-transparent text-lg font-black text-emerald-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-2">Strategic Notes</label>
                    <textarea 
                      value={extractedDeal.notes}
                      onChange={(e) => setExtractedDeal({ ...extractedDeal, notes: e.target.value })}
                      placeholder="Add strategic context..."
                      className="w-full bg-transparent text-sm text-slate-300 leading-relaxed focus:outline-none resize-none h-24 border-b border-white/10 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  
                  <button 
                    onClick={saveDeal}
                    className="w-full bg-emerald-500 text-white py-5 rounded-2xl text-xs font-black flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all active:scale-95 shadow-2xl shadow-emerald-900/40"
                  >
                    <Plus className="w-5 h-5" /> Commit to Pipeline
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-1">Priority Signal</span>
                  <span className={`text-sm font-black uppercase tracking-widest ${calculatePriority(currentEmail, settings) === 'High' ? 'text-red-400' : 'text-slate-200'}`}>
                    {calculatePriority(currentEmail, settings)}
                  </span>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-1">Keywords Detected</span>
                  <span className="text-sm text-slate-200 font-black uppercase tracking-tight truncate block">
                    {settings?.rules.urgent_keywords.filter(k => currentEmail.subject.toLowerCase().includes(k.toLowerCase())).join(", ") || "None"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      <div className="pt-4">
        <div className="flex items-center justify-between px-2 mb-6">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Recent Triage History</h3>
          <button onClick={() => {}} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">View Full Log</button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {emails.slice(0, 4).map((email, idx) => (
            <motion.div 
              key={email.id} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-5 bg-white border border-slate-200/60 rounded-[2rem] flex items-center justify-between shadow-sm hover:border-blue-200 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  {email.sender.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 truncate max-w-[200px] group-hover:text-blue-600 transition-colors">{email.subject}</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{email.sender}</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

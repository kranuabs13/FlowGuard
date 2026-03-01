import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  TrendingUp, 
  Users, 
  Clock, 
  ArrowUpRight, 
  ChevronRight, 
  AlertCircle,
  DollarSign,
  Zap,
  Globe,
  ShieldCheck,
  Mail,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Deal, Settings, TabType } from '../types';

interface DashboardProps {
  setActiveTab: (tab: TabType) => void;
  currentEmail: any;
  isConnected: boolean | null;
}

export default function Dashboard({ setActiveTab, currentEmail, isConnected }: DashboardProps) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [escalations, setEscalations] = useState<any[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const handleConnect = async () => {
    try {
      const res = await fetch('/api/auth/url');
      const { url } = await res.json();
      window.open(url, 'm365_auth', 'width=600,height=600');
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dealsRes, escRes, setRes] = await Promise.all([
          fetch('/api/deals'),
          fetch('/api/escalations'),
          fetch('/api/settings')
        ]);
        
        setDeals(await dealsRes.json());
        setEscalations(await escRes.json());
        setSettings(await setRes.json());
        setLoading(false);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  const totalValue = deals.filter(d => !d.is_finished).reduce((acc, d) => acc + d.value, 0);
  const activeDeals = deals.filter(d => d.stage !== 'won' && d.stage !== 'lost' && !d.is_finished).length;
  const overdueCount = escalations.length;

  const stats = [
    { label: 'Pipeline', value: `$${(totalValue / 1000).toFixed(1)}k`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active', value: activeDeals, icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'SLA Alerts', value: overdueCount, icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Initializing Command Center...</p>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-8">
      {/* Connection Prompt - High Impact */}
      {isConnected === false && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-600 rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 text-white shadow-2xl shadow-blue-200 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 md:p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Globe className="w-20 h-20 md:w-32 md:h-32" />
          </div>
          <div className="relative z-10 max-w-md">
            <div className="flex items-center gap-2 mb-2 md:mb-4">
              <span className="bg-white/20 text-[8px] md:text-[10px] font-black px-2 md:px-3 py-1 rounded-full uppercase tracking-[0.2em] backdrop-blur-md">Integration Required</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black mb-2 md:mb-3 leading-tight">Link Microsoft 365</h3>
            <p className="text-xs md:text-sm text-blue-100 mb-4 md:mb-8 leading-relaxed font-medium">Connect your inbox to enable triage and SLA monitoring.</p>
            <button 
              onClick={handleConnect}
              className="bg-white text-blue-600 px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black flex items-center gap-2 md:gap-3 hover:bg-blue-50 transition-all active:scale-95 shadow-xl shadow-blue-900/20"
            >
              Authorize Connection <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Stats Grid - Bento Style */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {stats.map((stat, idx) => (
          <motion.div 
            key={stat.label} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-3 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-md transition-all group"
          >
            <div className={`w-8 h-8 md:w-10 md:h-10 ${stat.bg} ${stat.color} rounded-xl md:rounded-2xl flex items-center justify-center mb-2 md:mb-4 group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <p className="text-[7px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] md:tracking-[0.15em] mb-0.5 md:mb-1 truncate">{stat.label}</p>
            <p className="text-sm md:text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Contextual Analysis Card */}
      {currentEmail ? (
        <div className="bg-white border border-slate-200/60 rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-xl md:rounded-2xl flex items-center justify-center text-blue-600">
              <Clock className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Responsiveness Goal</p>
              <h3 className="text-base md:text-lg font-black text-slate-900">Manual Triage Required</h3>
            </div>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mb-4 md:mb-8 leading-relaxed font-medium">Review this email manually to ensure we maintain our 24-hour response SLA for enterprise clients.</p>
          <button 
            onClick={() => setActiveTab('Inbox')}
            className="w-full bg-slate-900 text-white py-3 md:py-4 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
          >
            Open Triage View
          </button>
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl md:rounded-[2.5rem] p-6 md:p-12 text-center group hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 md:w-16 md:h-16 bg-slate-50 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-3 md:mb-6 group-hover:scale-110 transition-transform">
            <AlertCircle className="w-5 h-5 md:w-8 md:h-8 text-slate-300" />
          </div>
          <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Select an email to begin analysis</p>
        </div>
      )}

      {/* Main Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        
        {/* Urgent Escalations */}
        <section className="space-y-2 md:space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <ShieldAlert className="w-3 h-3 md:w-4 md:h-4 text-red-500" /> Urgent Escalations
            </h3>
            <button onClick={() => setActiveTab('Tasks')} className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">View All</button>
          </div>
          <div className="space-y-2 md:space-y-3">
            {escalations.length === 0 ? (
              <div className="bg-emerald-50/50 border border-emerald-100 p-4 md:p-6 rounded-2xl md:rounded-[2rem] flex items-center gap-3 md:gap-4">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-100 rounded-xl md:rounded-2xl flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-bold text-emerald-900">All clear!</p>
                  <p className="text-[9px] md:text-[11px] text-emerald-600 font-medium">No overdue responses.</p>
                </div>
              </div>
            ) : (
              escalations.slice(0, 2).map((esc) => (
                <div key={esc.id} className="bg-white p-3 md:p-5 rounded-2xl md:rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center justify-between group cursor-pointer hover:border-blue-200 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-8 h-8 md:w-12 md:h-12 bg-red-50 rounded-xl md:rounded-2xl flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                      <AlertCircle className="w-4 h-4 md:w-6 md:h-6" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm font-black text-slate-900">{esc.customer_name}</p>
                      <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest">Idle for 24h+</p>
                    </div>
                  </div>
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Pipeline Pulse */}
        <section className="space-y-2 md:space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-emerald-500" /> Pipeline Pulse
            </h3>
            <button onClick={() => setActiveTab('Pipeline')} className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Full Board</button>
          </div>
          <div className="bg-white rounded-2xl md:rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
            {deals.slice(0, 3).map((deal, idx) => (
              <div key={deal.id} className={`p-3 md:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${idx !== 2 ? 'border-b border-slate-100' : ''}`}>
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-100 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-500 font-black text-[10px] md:text-xs">
                    {deal.customer_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-bold text-slate-900">{deal.customer_name}</p>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <span className="text-[8px] md:text-[9px] text-slate-400 font-black uppercase tracking-widest">{deal.stage}</span>
                      <span className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-slate-300"></span>
                      <span className="text-[8px] md:text-[9px] text-emerald-500 font-black uppercase tracking-widest">Active</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs md:text-sm font-black text-slate-900">${deal.value.toLocaleString()}</p>
                  <p className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-tight">Est. Value</p>
                </div>
              </div>
            ))}
            {deals.length === 0 && (
              <div className="p-8 md:p-12 text-center">
                <p className="text-[10px] md:text-xs font-black text-slate-300 uppercase tracking-[0.2em]">No active deals</p>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

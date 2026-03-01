import React, { useState, useEffect } from 'react';
import { 
  Inbox, 
  LayoutDashboard, 
  Bell, 
  Settings as SettingsIcon, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Plus,
  ArrowRightLeft,
  ShieldCheck,
  Globe,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Deal, Settings, EmailItem, TabType } from './types';

// Components
import Dashboard from './components/Dashboard';
import InboxTriage from './components/InboxTriage';
import Pipeline from './components/Pipeline';
import TaskList from './components/TaskList';
import SettingsPanel from './components/SettingsPanel';

export default function App() {
  console.log("FlowGuard App Initializing...");
  const [activeTab, setActiveTab] = useState<TabType>('Dashboard');
  const [isRtl, setIsRtl] = useState(false);
  const [officeReady, setOfficeReady] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<any>(null);
  const [isQuoteReply, setIsQuoteReply] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      setIsConnected(data.authenticated);
    } catch (e) {
      setIsConnected(false);
    }
  };

  useEffect(() => {
    // @ts-ignore
    if (typeof Office !== 'undefined') {
      // @ts-ignore
      Office.onReady((info) => {
        if (info.host === Office.HostType.Outlook) {
          setOfficeReady(true);
          // @ts-ignore
          const item = Office.context.mailbox.item;
          if (item) {
            setCurrentEmail({
              subject: item.subject,
              sender: item.from?.emailAddress || 'Unknown',
              id: item.itemId
            });
          }
        }
      });
    } else {
      console.log("Office.js not detected, running in standalone mode");
    }
  }, []);

  const tabs: { id: TabType; icon: any; label: string }[] = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Command' },
    { id: 'Inbox', icon: Inbox, label: 'Triage' },
    { id: 'Pipeline', icon: ArrowRightLeft, label: 'Pipeline' },
    { id: 'Tasks', icon: CheckCircle2, label: 'Tasks' },
    { id: 'Settings', icon: SettingsIcon, label: 'Config' },
  ];

  return (
    <div className={`min-h-screen bg-[#F8FAFC] text-slate-900 font-sans ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-5 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200 group transition-transform hover:scale-105">
              <ShieldCheck className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-900 leading-none">FlowGuard</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Command Center</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
              isConnected === true 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                : isConnected === false 
                  ? 'bg-red-50 text-red-600 border-red-100'
                  : 'bg-slate-50 text-slate-400 border-slate-100'
            }`}>
              {isConnected === true ? 'M365 Active' : isConnected === false ? 'Offline' : 'Syncing...'}
            </div>
            <button 
              onClick={() => setIsRtl(!isRtl)}
              className="p-2 hover:bg-slate-50 rounded-xl transition-all border border-slate-100 active:scale-90"
            >
              <Globe className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto flex flex-col md:flex-row min-h-[calc(100vh-73px)]">
        {/* Navigation - Modern Vertical Rail for Desktop, Horizontal for Mobile */}
        <nav className="bg-white md:bg-transparent border-b md:border-b-0 md:border-r border-slate-200/60 flex md:flex-col overflow-x-auto no-scrollbar sticky top-[73px] md:h-[calc(100vh-73px)] z-30 md:w-24 flex-shrink-0">
          <div className="flex md:flex-col w-full p-2 md:p-4 gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 md:flex-none flex flex-col items-center justify-center py-3 px-2 rounded-2xl transition-all relative group ${
                  activeTab === tab.id 
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
              >
                <tab.icon className={`w-5 h-5 mb-1.5 transition-all ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-[9px] uppercase font-black tracking-widest">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTabGlow"
                    className="absolute inset-0 bg-white/10 rounded-2xl"
                  />
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-3 md:p-8 pb-24 md:pb-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -10 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            >
              {activeTab === 'Dashboard' && <Dashboard setActiveTab={setActiveTab} currentEmail={currentEmail} isConnected={isConnected} />}
              {activeTab === 'Inbox' && <InboxTriage currentEmail={currentEmail} />}
              {activeTab === 'Pipeline' && <Pipeline />}
              {activeTab === 'Tasks' && <TaskList />}
              {activeTab === 'Settings' && <SettingsPanel isRtl={isRtl} setIsRtl={setIsRtl} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Contextual Footer - Floating Glass Style */}
      {currentEmail && activeTab !== 'Pipeline' && (
        <div className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] md:w-[calc(100%-2rem)] max-w-2xl z-50">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-3 md:p-4 rounded-2xl md:rounded-3xl flex items-center justify-between shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
              </div>
              <div className="truncate">
                <p className="text-[8px] md:text-[10px] text-slate-400 uppercase font-black tracking-widest">Active Context</p>
                <p className="text-xs md:text-sm font-bold truncate text-white">{currentEmail.subject}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 pl-3 md:pl-4 border-l border-white/10">
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quote?</span>
                <button 
                  onClick={() => setIsQuoteReply(!isQuoteReply)}
                  className={`w-9 h-5 rounded-full transition-all relative ${isQuoteReply ? 'bg-emerald-500' : 'bg-white/20'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isQuoteReply ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
              <button 
                onClick={() => setActiveTab('Pipeline')}
                className="bg-blue-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-900/20 flex items-center gap-2"
              >
                Add <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

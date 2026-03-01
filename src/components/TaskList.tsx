import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  AlertTriangle, 
  Mail, 
  ArrowRight, 
  Filter,
  Search,
  Calendar,
  MoreVertical,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Task {
  id: string | number;
  type: 'escalation' | 'triage' | 'follow-up';
  title: string;
  desc: string;
  severity: 'high' | 'med' | 'low';
  action: string;
  timestamp: string;
  customer?: string;
}

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'med'>('all');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/escalations');
      const overdueDeals = await res.json();
      
      const escalations: Task[] = overdueDeals.map((deal: any) => ({
        id: `esc-${deal.id}`,
        type: 'escalation',
        title: `Overdue: ${deal.customer_name}`,
        desc: `Deal "${deal.subject}" has been idle for >24h in ${deal.stage} stage.`,
        severity: 'high',
        action: 'Update Stage',
        timestamp: deal.updated_at,
        customer: deal.customer_name
      }));

      // Mock Triage Tasks (In real app, fetch unread/untriaged emails)
      const triageTasks: Task[] = [
        {
          id: 'tri-1',
          type: 'triage',
          title: 'New Quote Request',
          desc: 'nitzan@client.il sent an urgent quote request for Dell Servers.',
          severity: 'high',
          action: 'Manual Review',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          customer: 'Emet Computing'
        }
      ];

      // Mock Follow-up Tasks
      const followUps: Task[] = [
        {
          id: 'fol-1',
          type: 'follow-up',
          title: 'Follow-up: Networking RFQ',
          desc: 'Waiting for customer feedback on Cisco Catalyst quote.',
          severity: 'med',
          action: 'Send Reminder',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
          customer: 'Global Corp'
        }
      ];

      setTasks([...escalations, ...triageTasks, ...followUps]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const completeTask = (id: string | number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-100 text-red-700';
      case 'med': return 'bg-amber-50 border-amber-100 text-amber-700';
      default: return 'bg-slate-50 border-slate-100 text-slate-700';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'escalation': return ShieldAlert;
      case 'triage': return Mail;
      case 'follow-up': return Clock;
      default: return CheckCircle2;
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    return t.severity === filter;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Tasks...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header & Filters */}
      <div className="flex flex-col gap-6 px-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Strategic Task List
            </h2>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Maintain zero-gap responsiveness across all accounts.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 bg-white border border-slate-200/60 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
              <Search className="w-4 h-4 text-slate-400" />
            </button>
            <button className="p-2.5 bg-white border border-slate-200/60 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
              <Filter className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {(['all', 'high', 'med'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                filter === f 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' 
                  : 'bg-white text-slate-400 border-slate-200/60 hover:border-slate-300'
              }`}
            >
              {f === 'all' ? 'All Tasks' : `${f} Priority`}
            </button>
          ))}
        </div>
      </div>

      {/* Task Grid */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-16 text-center bg-white border-2 border-dashed border-slate-100 rounded-[2.5rem]"
            >
              <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">All clear. SLAs are maintained.</p>
            </motion.div>
          ) : (
            filteredTasks.map((task) => {
              const Icon = getIcon(task.type);
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group bg-white p-6 rounded-[2.5rem] border border-slate-200/60 shadow-sm hover:shadow-xl transition-all relative overflow-hidden`}
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${
                    task.severity === 'high' ? 'bg-red-500' : 
                    task.severity === 'med' ? 'bg-amber-500' : 'bg-blue-500'
                  }`}></div>
                  
                  <div className="flex items-start gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                      task.severity === 'high' ? 'bg-red-50 text-red-500' : 
                      task.severity === 'med' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{task.type}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{task.customer}</span>
                        </div>
                        <button className="text-slate-300 hover:text-slate-600 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <h4 className="text-base font-black text-slate-900 mb-2 tracking-tight group-hover:text-blue-600 transition-colors">{task.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium mb-6 line-clamp-2">{task.desc}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(task.timestamp).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => completeTask(task.id)}
                            className="flex items-center gap-2 bg-slate-50 text-slate-400 hover:bg-emerald-500 hover:text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-slate-100"
                          >
                            <Check className="w-3.5 h-3.5" /> Resolve
                          </button>
                          <button className="p-2.5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200">
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Action */}
      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group mt-8">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Calendar className="w-32 h-32" />
        </div>
        <div className="relative z-10 max-w-sm">
          <p className="text-lg font-black mb-2">Weekly Performance</p>
          <p className="text-xs text-slate-400 mb-8 leading-relaxed font-medium">You've resolved 12 high-priority escalations this week. Your average response time is 1.4 hours.</p>
          <button className="w-full bg-white/10 hover:bg-white/20 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-white/10">
            Download BU Report
          </button>
        </div>
      </div>
    </div>
  );
}

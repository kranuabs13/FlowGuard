import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield, 
  Settings as SettingsIcon, 
  Plus, 
  Trash2, 
  Save, 
  Globe,
  Users,
  History,
  AlertTriangle,
  Download,
  FileCode
} from 'lucide-react';
import { motion } from 'motion/react';
import { Settings } from '../types';

interface SettingsPanelProps {
  isRtl: boolean;
  setIsRtl: (val: boolean) => void;
}

export default function SettingsPanel({ isRtl, setIsRtl }: SettingsPanelProps) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [newVip, setNewVip] = useState('');
  const [saving, setSaving] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchSettings();
    fetchAuditLogs();
  }, []);

  const fetchSettings = async () => {
    const res = await fetch('/api/settings');
    const data = await res.json();
    setSettings(data);
  };

  const fetchAuditLogs = async () => {
    const res = await fetch('/api/audit');
    const data = await res.json();
    setAuditLogs(data);
  };

  const downloadManifest = async (type: 'local' | 'cloud') => {
    try {
      const response = await fetch('/manifest.xml');
      let text = await response.text();
      
      if (type === 'cloud') {
        const cloudUrl = window.location.origin + "/";
        text = text.replace(/https:\/\/localhost:3000\//g, cloudUrl);
      }
      
      const blob = new Blob([text], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `manifest-${type}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading manifest:', error);
    }
  };

  const saveSettings = async (updated: Settings) => {
    setSaving(true);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'rules', value: updated.rules })
    });
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'vips', value: updated.vips })
    });
    setSaving(false);
    setSettings(updated);
  };

  const addVip = () => {
    if (!newVip || !settings) return;
    const updated = { ...settings, vips: [...settings.vips, newVip] };
    saveSettings(updated);
    setNewVip('');
  };

  const removeVip = (vip: string) => {
    if (!settings) return;
    const updated = { ...settings, vips: settings.vips.filter(v => v !== vip) };
    saveSettings(updated);
  };

  if (!settings) return null;

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Enterprise Configuration</h2>
        {saving && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Syncing...</span>
          </div>
        )}
      </div>

      {/* Deployment & Download - Bento Card */}
      <section className="space-y-4">
        <h3 className="text-xs font-black text-slate-700 flex items-center gap-2 px-2">
          <FileCode className="w-4 h-4 text-slate-400" /> Deployment Assets
        </h3>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm">
          <div className="max-w-md mb-8">
            <p className="text-lg font-black text-slate-900 mb-2">Outlook Manifest</p>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Download the XML configuration file to sideload FlowGuard into your enterprise Outlook environment.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={() => downloadManifest('local')}
              className="group bg-slate-50 text-slate-600 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-100 transition-all active:scale-95 border border-slate-100"
            >
              <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" /> Localhost (Dev)
            </button>
            <button 
              onClick={() => downloadManifest('cloud')}
              className="group bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
            >
              <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" /> Cloud (Production)
            </button>
          </div>
        </div>
      </section>

      {/* Interface & Language */}
      <section className="space-y-4">
        <h3 className="text-xs font-black text-slate-700 flex items-center gap-2 px-2">
          <Globe className="w-4 h-4 text-blue-500" /> Localization
        </h3>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">RTL Support</p>
              <p className="text-[11px] text-slate-500 font-medium">Toggle right-to-left layout for Hebrew/Arabic teams.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsRtl(!isRtl)}
            className={`w-14 h-7 rounded-full transition-all relative ${isRtl ? 'bg-blue-600 shadow-lg shadow-blue-100' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${isRtl ? 'right-1' : 'left-1'}`}></div>
          </button>
        </div>
      </section>

      {/* VIP Management */}
      <section className="space-y-4">
        <h3 className="text-xs font-black text-slate-700 flex items-center gap-2 px-2">
          <Shield className="w-4 h-4 text-slate-900" /> Strategic Accounts
        </h3>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
          <div className="flex gap-3">
            <input 
              type="text" 
              value={newVip}
              onChange={(e) => setNewVip(e.target.value)}
              placeholder="e.g. microsoft.com"
              className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all"
            />
            <button 
              onClick={addVip}
              className="bg-slate-900 text-white p-3 rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {settings.vips.map((vip) => (
              <span key={vip} className="bg-slate-50 text-slate-600 text-[10px] font-black px-4 py-2 rounded-xl flex items-center gap-2 border border-slate-100 group hover:bg-white hover:border-red-100 transition-all">
                {vip}
                <button onClick={() => removeVip(vip)} className="text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Escalation Rules */}
      <section className="space-y-4">
        <h3 className="text-xs font-black text-slate-700 flex items-center gap-2 px-2">
          <AlertTriangle className="w-4 h-4 text-red-500" /> SLA & Escalation Logic
        </h3>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-8">
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] block mb-3 px-1">Notification Endpoint</label>
            <input 
              type="email" 
              value={settings.rules.manager_email}
              onChange={(e) => saveSettings({ ...settings, rules: { ...settings.rules, manager_email: e.target.value } })}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] block mb-3 px-1">VIP Response SLA (Hrs)</label>
              <input 
                type="number" 
                value={settings.rules.vip_sla_hours}
                onChange={(e) => saveSettings({ ...settings, rules: { ...settings.rules, vip_sla_hours: parseInt(e.target.value) } })}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-black focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] block mb-3 px-1">Standard Response SLA (Hrs)</label>
              <input 
                type="number" 
                defaultValue={48}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-black focus:outline-none opacity-50"
                disabled
              />
            </div>
          </div>
        </div>
      </section>

      {/* Audit Log */}
      <section className="space-y-4">
        <h3 className="text-xs font-black text-slate-700 flex items-center gap-2 px-2">
          <History className="w-4 h-4 text-slate-400" /> System Audit Trail
        </h3>
        <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="max-h-60 overflow-y-auto no-scrollbar">
            {auditLogs.map((log, idx) => (
              <div key={log.id} className={`p-5 flex justify-between items-center hover:bg-slate-50 transition-colors ${idx !== auditLogs.length - 1 ? 'border-b border-slate-50' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{log.action}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-black font-mono bg-slate-50 px-2 py-1 rounded-lg">#{log.deal_id || 'SYS'}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Sharing */}
      <section className="space-y-4 pb-20">
        <h3 className="text-xs font-black text-slate-700 flex items-center gap-2 px-2">
          <Users className="w-4 h-4 text-blue-600" /> Enterprise Collaboration
        </h3>
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Users className="w-32 h-32" />
          </div>
          <div className="relative z-10 max-w-sm">
            <p className="text-lg font-black mb-2">Collaborative Pipeline</p>
            <p className="text-xs text-slate-400 mb-8 leading-relaxed font-medium">Share your deals and escalations with the IT Sales BU to ensure zero-gap responsiveness.</p>
            <button className="w-full bg-white/10 hover:bg-white/20 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-white/10">
              Invite Team Members
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

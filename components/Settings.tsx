
import React, { useState } from 'react';
import { AppConfig } from '../types';

interface SettingsProps {
  config: AppConfig;
  onUpdate: (newConfig: AppConfig) => void;
}

export const Settings: React.FC<SettingsProps> = ({ config, onUpdate }) => {
  const [form, setForm] = useState<AppConfig>(config);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onUpdate(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-10">
        <h2 className="text-2xl font-black text-slate-900 mb-2">Portal Branding</h2>
        <p className="text-sm text-slate-400 font-medium mb-10">Customize how your application looks for all users.</p>

        <div className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Application Name</label>
            <input
              type="text"
              value={form.appName}
              onChange={(e) => setForm({ ...form, appName: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              placeholder="e.g., EHA Summer Camp"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subtitle / Tagline</label>
            <input
              type="text"
              value={form.appSubtitle}
              onChange={(e) => setForm({ ...form, appSubtitle: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              placeholder="e.g., Digital Registration Portal"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Logo URL (PNG/JPG)</label>
            <input
              type="text"
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              placeholder="https://example.com/logo.png"
            />
            <p className="text-[10px] text-slate-400 mt-1 italic ml-1">Leave empty to use default icon</p>
          </div>

          <div className="pt-4">
            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Preview</h3>
            <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
               <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center overflow-hidden">
                  {form.logoUrl ? <img src={form.logoUrl} className="w-full h-full object-cover" /> : <span className="text-white font-black">E</span>}
               </div>
               <div>
                  <p className="font-bold text-slate-900 leading-none">{form.appName || 'App Name'}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{form.appSubtitle || 'Subtitle'}</p>
               </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6">
            {saved && <span className="text-green-600 text-xs font-bold animate-pulse">✓ Settings Updated Successfully</span>}
            <button
              onClick={handleSave}
              className="ml-auto px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-amber-50 border border-amber-100 p-8 rounded-[32px]">
        <h3 className="text-xs font-black text-amber-700 uppercase tracking-widest mb-2">Super Admin Role</h3>
        <p className="text-xs text-amber-900/70 leading-relaxed font-medium">
          Aapke paas 'super_admin' access hai. Sirf aap hi ye branding change kar sakte hain. Staff members ko ye 'Settings' tab nahi dikhega. Woh sirf data upload aur sync kar payenge.
        </p>
      </div>
    </div>
  );
};

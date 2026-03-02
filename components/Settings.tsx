import React, { useState, useEffect } from 'react';
import { AppConfig, UserAccount, UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings as SettingsIcon, Shield, UserPlus, Trash2, 
  Check, AlertCircle, Save, Key, User, 
  Mail, Globe, Layout, Palette, Lock,
  ChevronRight, UserCircle2, ShieldCheck, Hash,
  Zap, Building2, MessageSquare, Briefcase
} from 'lucide-react';

interface SettingsProps {
  config: AppConfig;
  onUpdate: (newConfig: AppConfig) => void;
  currentUsername: string;
}

const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle: string }) => (
  <div className="flex items-center gap-5 mb-10">
    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 dark:shadow-none">
      <Icon size={28} strokeWidth={2.5} />
    </div>
    <div>
      <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h2>
      <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">{subtitle}</p>
    </div>
  </div>
);

const InputWrapper = ({ label, icon: Icon, children }: { label: string, icon: any, children: React.ReactNode }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
      <Icon size={12} className="text-slate-400" />
      {label}
    </label>
    <div className="relative group">
      {children}
    </div>
  </div>
);

export const Settings: React.FC<SettingsProps> = ({ config, onUpdate, currentUsername }) => {
  const [form, setForm] = useState<AppConfig>(config);
  const [saved, setSaved] = useState(false);
  
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [newUser, setNewUser] = useState<UserAccount>({ username: '', password: '', role: 'staff' });
  const [userSaved, setUserSaved] = useState(false);

  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  useEffect(() => {
    const savedUsers = localStorage.getItem('eha_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
  }, []);

  const handleSaveBranding = () => {
    onUpdate(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAddUser = () => {
    if (!newUser.username || !newUser.password) return;
    if (users.some(u => u.username === newUser.username) || newUser.username === 'superadmin') {
      alert("Username already exists.");
      return;
    }
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('eha_users', JSON.stringify(updatedUsers));
    setNewUser({ username: '', password: '', role: 'staff' });
    setUserSaved(true);
    setTimeout(() => setUserSaved(false), 3000);
  };

  const handleDeleteUser = (username: string) => {
    if (username === 'superadmin') return alert("Cannot delete the primary superadmin account.");
    if (window.confirm(`Are you sure you want to delete user account "${username}"?`)) {
      const updatedUsers = users.filter(u => u.username !== username);
      setUsers(updatedUsers);
      localStorage.setItem('eha_users', JSON.stringify(updatedUsers));
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess(false);
    if (passForm.new !== passForm.confirm) return setPassError('New passwords do not match.');
    if (passForm.new.length < 4) return setPassError('Password must be at least 4 characters.');
    const savedUsers = localStorage.getItem('eha_users');
    let usersList: UserAccount[] = savedUsers ? JSON.parse(savedUsers) : [];
    let userIndex = usersList.findIndex(u => u.username === currentUsername);
    let currentUser: UserAccount | undefined;
    if (currentUsername === 'superadmin' && userIndex === -1) {
      currentUser = { username: 'superadmin', password: 'superadmin', role: 'super_admin' };
    } else {
      currentUser = usersList[userIndex];
    }
    if (!currentUser || (passForm.current !== currentUser.password)) return setPassError('Current password is incorrect.');
    if (userIndex > -1) usersList[userIndex].password = passForm.new;
    else usersList.push({ username: 'superadmin', password: passForm.new, role: 'super_admin' });
    localStorage.setItem('eha_users', JSON.stringify(usersList));
    setUsers(usersList);
    setPassSuccess(true);
    setPassForm({ current: '', new: '', confirm: '' });
    setTimeout(() => setPassSuccess(false), 5000);
  };

  const inputClasses = "w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-600 outline-none transition-all font-bold text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-700";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto py-12 space-y-16 pb-32 px-4"
    >
      {/* BRANDING SECTION */}
      <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-sm border border-slate-100 dark:border-slate-800 p-10 lg:p-16 transition-all hover:shadow-xl hover:shadow-indigo-500/5">
        <SectionHeader 
          icon={Palette} 
          title="Portal Branding" 
          subtitle="Identity & Visual Customization" 
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8">
            <InputWrapper label="Academy Name" icon={Building2}>
              <input type="text" value={form.appName} onChange={(e) => setForm({ ...form, appName: e.target.value })} className={inputClasses} placeholder="e.g. English House Academy" />
            </InputWrapper>
            <InputWrapper label="Portal Subtitle" icon={Layout}>
              <input type="text" value={form.appSubtitle} onChange={(e) => setForm({ ...form, appSubtitle: e.target.value })} className={inputClasses} placeholder="e.g. Digital Registration Portal" />
            </InputWrapper>
          </div>
          <div className="space-y-8">
            <InputWrapper label="Logo URL" icon={Globe}>
              <input type="text" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} className={inputClasses} placeholder="https://domain.com/logo.png" />
            </InputWrapper>
            <InputWrapper label="Recovery Email" icon={Mail}>
              <input type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} className={inputClasses} placeholder="admin@example.com" />
            </InputWrapper>
          </div>
        </div>

        <div className="flex items-center justify-between pt-12 border-t border-slate-50 dark:border-slate-800 mt-12">
          <AnimatePresence>
            {saved && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Check size={16} strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-widest">Branding Updated</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={handleSaveBranding} className="ml-auto px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-3">
            <Save size={18} strokeWidth={2.5} />
            Update Branding
          </button>
        </div>
      </div>

      {/* SECURITY SECTION */}
      <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-sm border border-slate-100 dark:border-slate-800 p-10 lg:p-16 transition-all hover:shadow-xl hover:shadow-indigo-500/5">
        <SectionHeader 
          icon={Lock} 
          title="Security Settings" 
          subtitle="Account Protection & Access" 
        />

        <form onSubmit={handleChangePassword} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <InputWrapper label="Current Password" icon={Key}>
              <input type="password" value={passForm.current} onChange={(e) => setPassForm({ ...passForm, current: e.target.value })} className={inputClasses} placeholder="••••••••" required />
            </InputWrapper>
            <InputWrapper label="New Password" icon={ShieldCheck}>
              <input type="password" value={passForm.new} onChange={(e) => setPassForm({ ...passForm, new: e.target.value })} className={inputClasses} placeholder="••••••••" required />
            </InputWrapper>
            <InputWrapper label="Confirm New" icon={ShieldCheck}>
              <input type="password" value={passForm.confirm} onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })} className={inputClasses} placeholder="••••••••" required />
            </InputWrapper>
          </div>

          <div className="flex items-center justify-between pt-12 border-t border-slate-50 dark:border-slate-800">
            <div className="flex flex-col gap-1">
              {passError && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><AlertCircle size={14} /> {passError}</p>}
              {passSuccess && <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse"><Check size={14} /> Password Updated</p>}
            </div>
            <button type="submit" className="ml-auto px-10 py-5 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-200 dark:shadow-none hover:bg-slate-800 transition-all flex items-center gap-3">
              <Key size={18} strokeWidth={2.5} />
              Change Password
            </button>
          </div>
        </form>
      </div>

      {/* USER MANAGEMENT SECTION */}
      <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-sm border border-slate-100 dark:border-slate-800 p-10 lg:p-16 transition-all hover:shadow-xl hover:shadow-indigo-500/5">
        <SectionHeader 
          icon={UserPlus} 
          title="User Management" 
          subtitle="Access Control & Permissions" 
        />

        <div className="space-y-12">
          {/* New User Creation */}
          <div className="p-8 bg-slate-50 dark:bg-slate-800/30 rounded-[32px] border border-slate-100 dark:border-slate-800 space-y-8">
            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Create New Access Account</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InputWrapper label="Username" icon={User}>
                <input type="text" placeholder="Enter username" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} className={inputClasses} />
              </InputWrapper>
              <InputWrapper label="Password" icon={Key}>
                <input type="password" placeholder="Enter password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className={inputClasses} />
              </InputWrapper>
              <InputWrapper label="Access Role" icon={Shield}>
                <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})} className={inputClasses}>
                  <option value="staff">Staff Member</option>
                  <option value="super_admin">Administrator</option>
                </select>
              </InputWrapper>
            </div>
            <div className="flex items-center justify-between pt-4">
              <AnimatePresence>
                {userSaved && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <Check size={16} strokeWidth={3} />
                    <span className="text-[10px] font-black uppercase tracking-widest">User Created</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <button onClick={handleAddUser} className="ml-auto px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center gap-3">
                <UserPlus size={18} strokeWidth={2.5} />
                Create Account
              </button>
            </div>
          </div>

          {/* User List Table */}
          <div className="overflow-hidden border border-slate-50 dark:border-slate-800 rounded-[32px]">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Username</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Access Role</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {users.length > 0 ? users.map((u, i) => (
                  <tr key={i} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                          <UserCircle2 size={20} />
                        </div>
                        <span className="text-sm font-black text-slate-900 dark:text-white">{u.username}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg inline-flex items-center gap-2 ${u.role === 'super_admin' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>
                        <Shield size={10} strokeWidth={3} />
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleDeleteUser(u.username)}
                        className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-xl flex items-center justify-center transition-all ml-auto"
                      >
                        <Trash2 size={16} strokeWidth={2.5} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-8 py-12 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-300 dark:text-slate-700">
                        <UserCircle2 size={48} strokeWidth={1} />
                        <p className="text-xs font-bold uppercase tracking-widest italic">No custom accounts configured</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

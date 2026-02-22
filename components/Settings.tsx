
import React, { useState, useEffect } from 'react';
import { AppConfig, UserAccount, UserRole } from '../types';

interface SettingsProps {
  config: AppConfig;
  onUpdate: (newConfig: AppConfig) => void;
}

export const Settings: React.FC<SettingsProps> = ({ config, onUpdate }) => {
  const [form, setForm] = useState<AppConfig>(config);
  const [saved, setSaved] = useState(false);
  
  // User Management State
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [newUser, setNewUser] = useState<UserAccount>({ username: '', password: '', role: 'staff' });
  const [userSaved, setUserSaved] = useState(false);

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
    
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('eha_users', JSON.stringify(updatedUsers));
    setNewUser({ username: '', password: '', role: 'staff' });
    setUserSaved(true);
    setTimeout(() => setUserSaved(false), 3000);
  };

  const handleDeleteUser = (username: string) => {
    if (window.confirm(`Are you sure you want to delete user account "${username}"?`)) {
      const updatedUsers = users.filter(u => u.username !== username);
      setUsers(updatedUsers);
      localStorage.setItem('eha_users', JSON.stringify(updatedUsers));
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-10 animate-in slide-in-from-bottom-4 duration-500 pb-20 px-4 transition-colors">
      {/* BRANDING CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 p-8 lg:p-10 transition-colors">
        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2 transition-colors">Portal Branding</h2>
        <p className="text-sm text-slate-400 dark:text-slate-500 font-medium mb-10 transition-colors">Customize your academy name, subtitle, and logo appearing across the application.</p>

        <div className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1 transition-colors">Academy Name</label>
            <input
              type="text"
              value={form.appName}
              onChange={(e) => setForm({ ...form, appName: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 outline-none transition-all font-medium dark:text-slate-100"
              placeholder="e.g., English House Academy"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1 transition-colors">Portal Subtitle</label>
            <input
              type="text"
              value={form.appSubtitle}
              onChange={(e) => setForm({ ...form, appSubtitle: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 outline-none transition-all font-medium dark:text-slate-100"
              placeholder="e.g., Digital Registration Portal"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1 transition-colors">Logo URL (Public Image Link)</label>
            <input
              type="text"
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 outline-none transition-all font-medium dark:text-slate-100"
              placeholder="https://your-domain.com/logo.png"
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1 italic ml-1 transition-colors">Provide a link to your hosted logo image.</p>
          </div>

          <div className="flex items-center justify-between pt-4 transition-colors">
            {saved && <span className="text-green-600 dark:text-green-400 text-xs font-bold animate-pulse">✓ Branding Settings Saved</span>}
            <button
              onClick={handleSaveBranding}
              className="ml-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all transition-colors"
            >
              Update Branding
            </button>
          </div>
        </div>
      </div>

      {/* USER MANAGEMENT CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 p-8 lg:p-10 transition-colors">
        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2 transition-colors">Account Management</h2>
        <p className="text-sm text-slate-400 dark:text-slate-500 font-medium mb-10 transition-colors">Create and manage access credentials for staff members and additional administrators.</p>

        <div className="space-y-8">
          {/* New User Form */}
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 transition-colors space-y-4">
            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 transition-colors">Create New User</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Username"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 outline-none dark:text-slate-100 transition-colors"
              />
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 outline-none dark:text-slate-100 transition-colors"
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
                className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 outline-none transition-colors"
              >
                <option value="staff">Staff Member</option>
                <option value="super_admin">Administrator</option>
              </select>
            </div>
            <button
              onClick={handleAddUser}
              className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-all transition-colors"
            >
              Add New User
            </button>
            {userSaved && <p className="text-green-600 dark:text-green-400 text-[10px] font-bold uppercase mt-2">✓ User Account Created Successfully</p>}
          </div>

          {/* User List */}
          <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-2xl transition-colors">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 transition-colors">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Username</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Access Role</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800 transition-colors">
                {users.length > 0 ? users.map((u, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-200">{u.username}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-lg ${u.role === 'super_admin' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400'}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDeleteUser(u.username)}
                        className="text-red-400 hover:text-red-600 dark:text-red-600/50 dark:hover:text-red-500 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-xs text-slate-400 dark:text-slate-700 italic">No custom user accounts configured. (Default administrator login is available)</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

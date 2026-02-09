
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
    <div className="max-w-3xl mx-auto py-10 space-y-10 animate-in slide-in-from-bottom-4 duration-500 pb-20 px-4">
      {/* BRANDING CARD */}
      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-8 lg:p-10">
        <h2 className="text-2xl font-black text-slate-900 mb-2">Portal Branding</h2>
        <p className="text-sm text-slate-400 font-medium mb-10">Customize your academy name, subtitle, and logo appearing across the application.</p>

        <div className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academy Name</label>
            <input
              type="text"
              value={form.appName}
              onChange={(e) => setForm({ ...form, appName: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              placeholder="e.g., English House Academy"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Portal Subtitle</label>
            <input
              type="text"
              value={form.appSubtitle}
              onChange={(e) => setForm({ ...form, appSubtitle: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              placeholder="e.g., Digital Registration Portal"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Logo URL (Public Image Link)</label>
            <input
              type="text"
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              placeholder="https://your-domain.com/logo.png"
            />
            <p className="text-[10px] text-slate-400 mt-1 italic ml-1">Provide a link to your hosted logo image.</p>
          </div>

          <div className="flex items-center justify-between pt-4">
            {saved && <span className="text-green-600 text-xs font-bold animate-pulse">✓ Branding Settings Saved</span>}
            <button
              onClick={handleSaveBranding}
              className="ml-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
            >
              Update Branding
            </button>
          </div>
        </div>
      </div>

      {/* USER MANAGEMENT CARD */}
      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-8 lg:p-10">
        <h2 className="text-2xl font-black text-slate-900 mb-2">Account Management</h2>
        <p className="text-sm text-slate-400 font-medium mb-10">Create and manage access credentials for staff members and additional administrators.</p>

        <div className="space-y-8">
          {/* New User Form */}
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Create New User</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Username"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
                className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="staff">Staff Member</option>
                <option value="super_admin">Administrator</option>
              </select>
            </div>
            <button
              onClick={handleAddUser}
              className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-all"
            >
              Add New User
            </button>
            {userSaved && <p className="text-green-600 text-[10px] font-bold uppercase mt-2">✓ User Account Created Successfully</p>}
          </div>

          {/* User List */}
          <div className="overflow-hidden border border-slate-100 rounded-2xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Role</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.length > 0 ? users.map((u, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{u.username}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-lg ${u.role === 'super_admin' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDeleteUser(u.username)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-xs text-slate-400 italic">No custom user accounts configured. (Default administrator login is available)</td>
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

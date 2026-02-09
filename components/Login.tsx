
import React, { useState, useEffect } from 'react';
import { UserRole, AppConfig, UserAccount } from '../types';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [config, setConfig] = useState<AppConfig>({
    appName: 'English House Academy',
    appSubtitle: 'Premium Registration Portal',
    logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4w7ji5StjjdpZTvD_pk6DJ-YIY2t5aA_ILQ&s'
  });

  useEffect(() => {
    const savedConfig = localStorage.getItem('eha_app_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const savedUsers = localStorage.getItem('eha_users');
    let users: UserAccount[] = [];
    
    if (savedUsers) {
      users = JSON.parse(savedUsers);
    }

    // Always allow fallback superadmin for initial setup
    if (username === 'superadmin' && password === 'superadmin') {
      onLogin('super_admin');
      return;
    }

    const foundUser = users.find(u => u.username === username && u.password === password);
    
    if (foundUser) {
      onLogin(foundUser.role);
    } else {
      setError('Invalid credentials. Please try again or contact administrator.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl shadow-indigo-100 p-10 border border-slate-100">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-[#000080] rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-200 mb-6 overflow-hidden">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-4xl font-black italic">E</span>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 text-center">{config.appName}</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 text-center">Secure Access Required</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account ID</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              placeholder="Enter username"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

          <button
            type="submit"
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-0.5 active:translate-y-0 mt-4"
          >
            Sign In to Portal
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-50 text-center">
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
             {config.appSubtitle}
           </p>
        </div>
      </div>
    </div>
  );
};

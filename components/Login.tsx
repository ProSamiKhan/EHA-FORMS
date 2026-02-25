
import React, { useState, useEffect } from 'react';
import { UserRole, AppConfig, UserAccount } from '../types';

interface LoginProps {
  onLogin: (role: UserRole, username: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('eha_theme') === 'dark';
  });
  const [config, setConfig] = useState<AppConfig>({
    appName: 'English House Academy',
    appSubtitle: 'Premium Registration Portal',
    logoUrl: 'https://englishhouseacademy.in/wp-content/uploads/2022/03/187-X-43-px-EHA-LOGO-PNG.png',
    adminEmail: '4tvsami@gmail.com'
  });

  useEffect(() => {
    const savedConfig = localStorage.getItem('eha_app_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  // Theme support for login page too
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const savedUsers = localStorage.getItem('eha_users');
    let users: UserAccount[] = [];
    
    if (savedUsers) {
      users = JSON.parse(savedUsers);
    }

    // Check for custom superadmin password first
    const customSuperAdmin = users.find(u => u.username === 'superadmin');
    if (customSuperAdmin) {
      if (username === 'superadmin' && password === customSuperAdmin.password) {
        onLogin('super_admin', 'superadmin');
        return;
      }
    } else {
      // Fallback superadmin
      if (username === 'superadmin' && password === 'superadmin') {
        onLogin('super_admin', 'superadmin');
        return;
      }
    }

    const foundUser = users.find(u => u.username === username && u.password === password);
    
    if (foundUser) {
      onLogin(foundUser.role, foundUser.username);
    } else {
      setError('Invalid credentials. Please try again or contact administrator.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300 relative">
      <div className="absolute top-6 right-6">
        <button 
          onClick={() => {
            const newMode = !isDarkMode;
            setIsDarkMode(newMode);
            localStorage.setItem('eha_theme', newMode ? 'dark' : 'light');
          }}
          className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-600 transition-all"
        >
           {isDarkMode ? (
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
           ) : (
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
           )}
        </button>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl shadow-indigo-100 dark:shadow-none p-10 border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-[#000080] dark:bg-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-200 dark:shadow-none mb-6 overflow-hidden transition-colors">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover dark:brightness-90" />
            ) : (
              <span className="text-white text-4xl font-black italic">E</span>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 text-center transition-colors">{config.appName}</h1>
          <p className="text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-[10px] mt-2 text-center">Secure Access Required</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1 transition-colors">Account ID</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 outline-none transition-all font-medium dark:text-slate-100"
              placeholder="Enter username"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1 transition-colors">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 outline-none transition-all font-medium dark:text-slate-100"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-red-500 dark:text-red-400 text-xs font-bold text-center">{error}</p>}

          <button
            type="submit"
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all hover:-translate-y-0.5 active:translate-y-0 mt-4 transition-colors"
          >
            Sign In to Portal
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 text-center transition-colors">
           <p className="text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-widest">
             {config.appSubtitle}
           </p>
        </div>
      </div>
    </div>
  );
};

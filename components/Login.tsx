
import React, { useState, useEffect } from 'react';
import { UserRole, AppConfig, UserAccount } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, User, Eye, EyeOff, Sun, Moon, ShieldCheck, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (role: UserRole, username: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

    const customSuperAdmin = users.find(u => u.username === 'superadmin');
    if (customSuperAdmin) {
      if (username === 'superadmin' && password === customSuperAdmin.password) {
        onLogin('super_admin', 'superadmin');
        return;
      }
    } else {
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-500 overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="absolute top-6 right-6">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const newMode = !isDarkMode;
            setIsDarkMode(newMode);
            localStorage.setItem('eha_theme', newMode ? 'dark' : 'light');
          }}
          className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
        >
           {isDarkMode ? <Sun size={20} strokeWidth={2.5} /> : <Moon size={20} strokeWidth={2.5} />}
        </motion.button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl shadow-slate-200/50 dark:shadow-none p-10 border border-slate-100 dark:border-slate-800 transition-colors relative z-10">
          <div className="flex flex-col items-center mb-10">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-full h-16 flex items-center justify-center mb-8 overflow-hidden group"
            >
              {config.logoUrl ? (
                <img src={config.logoUrl} alt="Logo" className="h-full w-auto object-contain dark:brightness-110" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-16 h-16 bg-slate-900 dark:bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-200 dark:shadow-none">
                  <span className="text-white text-3xl font-black italic">E</span>
                </div>
              )}
            </motion.div>
            
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 text-center tracking-tight transition-colors">
              {config.appName}
            </h1>
            <div className="flex items-center gap-2 mt-3">
              <ShieldCheck size={14} className="text-emerald-500" strokeWidth={3} />
              <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] text-center">
                Secure Access Portal
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                Account ID
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-600 outline-none transition-all font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-600 outline-none transition-all font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl p-3"
                >
                  <p className="text-red-600 dark:text-red-400 text-[11px] font-bold text-center leading-tight">
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-4.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-200 dark:shadow-none hover:bg-black dark:hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 mt-4"
            >
              <span>Sign In to Portal</span>
              <ArrowRight size={16} strokeWidth={3} />
            </motion.button>
          </form>

          <div className="mt-10 pt-10 border-t border-slate-50 dark:border-slate-800 text-center">
             <p className="text-slate-400 dark:text-slate-600 text-[9px] font-black uppercase tracking-[0.25em]">
               {config.appSubtitle}
             </p>
          </div>
        </div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 text-slate-400 dark:text-slate-600 text-[10px] font-bold uppercase tracking-widest"
        >
          © {new Date().getFullYear()} English House Academy • All Rights Reserved
        </motion.p>
      </motion.div>
    </div>
  );
};

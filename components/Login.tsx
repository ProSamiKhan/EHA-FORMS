
import React, { useState } from 'react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Predefined credentials
    if (username === 'admin' && password === 'admin') {
      onLogin();
    } else {
      setError('Invalid ID or Password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl shadow-indigo-100 p-10 border border-slate-100">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 mb-6">
            <span className="text-white text-3xl font-black italic">E</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">EHA Portal</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Staff Login Required</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff ID</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              placeholder="Enter ID"
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
            Access Dashboard
          </button>
        </form>

        <p className="text-center mt-8 text-slate-400 text-xs font-medium italic">
          High-Precision OCR Management System
        </p>
      </div>
    </div>
  );
};

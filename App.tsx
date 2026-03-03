import React, { useState, useRef, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Upload, LayoutDashboard, FileText, Settings as SettingsIcon, 
  LogOut, Sun, Moon, Search, Download, Trash2, 
  Database, Cloud, ShieldCheck, UserCircle2, 
  ChevronRight, Info, AlertCircle, Loader2,
  Filter, ArrowUpDown, Menu, X
} from 'lucide-react';
import { ProcessingRecord, RegistrationData, UserRole, AppConfig } from './types';
import { processRegistrationForm } from './services/geminiService';
import { syncToGoogleSheets } from './services/sheetService';
import { ProcessingCard } from './components/ProcessingCard';
import { ManualEntryModal } from './components/ManualEntryModal';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { Login } from './components/Login';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [activeTab, setActiveTab] = useState<'processing' | 'dashboard' | 'settings'>('dashboard');
  const [records, setRecords] = useState<ProcessingRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RegistrationData | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('eha_theme') === 'dark';
  });
  const [config, setConfig] = useState<AppConfig>({
    appName: 'English House Academy',
    appSubtitle: 'Premium Registration Portal',
    logoUrl: 'https://englishhouseacademy.in/wp-content/uploads/2022/03/187-X-43-px-EHA-LOGO-PNG.png',
    adminEmail: '4tvsami@gmail.com'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedRecords = localStorage.getItem('eha_ocr_records');
    if (savedRecords) {
      try {
        const parsed = JSON.parse(savedRecords);
        const normalized = parsed.map((r: any) => {
          if (r.data && r.data.status === 'active') {
            return { ...r, data: { ...r.data, status: 'confirm' } };
          }
          return r;
        });
        setRecords(normalized);
      } catch (e) {
        console.error("Failed to parse saved records");
      }
    }

    const savedConfig = localStorage.getItem('eha_app_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
    
    const session = sessionStorage.getItem('eha_session_v2');
    if (session) {
      const { role } = JSON.parse(session);
      setUserRole(role);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('eha_ocr_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('eha_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('eha_theme', 'light');
    }
  }, [isDarkMode]);

  const handleLogin = (role: UserRole, username: string) => {
    setUserRole(role);
    setIsLoggedIn(true);
    sessionStorage.setItem('eha_session_v2', JSON.stringify({ role, username }));
  };

  const updateAppConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStorage.setItem('eha_app_config', JSON.stringify(newConfig));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    sessionStorage.removeItem('eha_session_v2');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setActiveTab('processing');
    setIsUploading(true);
    const newRecords: ProcessingRecord[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imageUrl = URL.createObjectURL(file);
      const id = uuidv4();

      const newRecord: ProcessingRecord = {
        id,
        timestamp: Date.now(),
        fileName: file.name,
        imageUrl,
        data: null,
        status: 'pending',
        source: 'ocr',
        syncStatus: 'idle',
      };
      
      newRecords.push(newRecord);
    }

    setRecords(prev => [...newRecords, ...prev]);
    setIsUploading(false);

    for (const record of newRecords) {
        processRecord(record);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processRecord = async (record: ProcessingRecord) => {
    setRecords(prev => prev.map(r => r.id === record.id ? { ...r, status: 'processing' } : r));
    
    try {
      const response = await fetch(record.imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const base64 = await base64Promise;
      const extractedData = await processRegistrationForm(base64);

      setRecords(prev => prev.map(r => r.id === record.id ? { 
        ...r, 
        status: 'completed', 
        data: extractedData 
      } : r));
    } catch (error: any) {
      setRecords(prev => prev.map(r => r.id === record.id ? { 
        ...r, 
        status: 'error', 
        error: error.message || 'An unknown error occurred'
      } : r));
    }
  };

  const performSync = async (id: string, data: RegistrationData) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, syncStatus: 'syncing' } : r));
    const success = await syncToGoogleSheets(data);
    setRecords(prev => prev.map(r => r.id === id ? { ...r, syncStatus: success ? 'synced' : 'failed', syncedAt: success ? Date.now() : undefined } : r));
  };

  const handleManualSubmit = async (data: RegistrationData) => {
    if (editingRecord) {
      const existingRecord = records.find(r => r.data?.admission_id === data.admission_id);
      if (existingRecord) {
        updateRecordData(existingRecord.id, data);
      } else {
        // Remote record update: Add to local records so it can be tracked and synced
        const id = uuidv4();
        const newRecord: ProcessingRecord = {
          id,
          timestamp: Date.now(),
          fileName: `Cloud Edit - ${data.name || 'Student'}`,
          imageUrl: '',
          data: data,
          status: 'completed',
          source: 'manual',
          syncStatus: 'idle',
        };
        setRecords(prev => [newRecord, ...prev]);
        setActiveTab('processing');
        
        // Trigger sync for this new local record
        performSync(id, data);
      }
      setEditingRecord(null);
    } else {
      const id = uuidv4();
      const newRecord: ProcessingRecord = {
        id,
        timestamp: Date.now(),
        fileName: `Manual Entry - ${data.name || 'Student'}`,
        imageUrl: '',
        data: data,
        status: 'completed',
        source: 'manual',
        syncStatus: 'idle',
      };
      setRecords(prev => [newRecord, ...prev]);
      setActiveTab('processing');
    }
    setIsManualModalOpen(false);
  };

  const updateRecordData = (id: string, newData: RegistrationData) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, data: newData, syncStatus: 'idle' } : r));
  };

  const removeRecord = (id: string) => {
    if (window.confirm("Are you sure you want to remove this record?")) {
      setRecords(prev => {
          const record = prev.find(r => r.id === id);
          if (record && record.imageUrl) URL.revokeObjectURL(record.imageUrl);
          return prev.filter(r => r.id !== id);
      });
    }
  };

  const clearAll = () => {
    const confirmation = window.confirm("WARNING: This will permanently delete all local records. Data synced to Google Sheets will remain safe.");
    if (confirmation) {
      records.forEach(r => r.imageUrl && URL.revokeObjectURL(r.imageUrl));
      setRecords([]);
      localStorage.removeItem('eha_ocr_records');
    }
  };

  const filteredRecords = useMemo(() => {
    if (!searchQuery) return records;
    const lower = searchQuery.toLowerCase();
    return records.filter(r => 
        r.data?.name?.toLowerCase().includes(lower) || 
        r.data?.admission_id?.toLowerCase().includes(lower) ||
        r.fileName.toLowerCase().includes(lower) ||
        r.data?.city?.toLowerCase().includes(lower) ||
        r.data?.state?.toLowerCase().includes(lower)
    );
  }, [records, searchQuery]);

  const exportToCSV = () => {
    const completed = records.filter(r => r.status === 'completed' && r.data);
    if (completed.length === 0) return alert("No completed records found for export.");
    const headers = Object.keys(completed[0].data!).join(",");
    const rows = completed.map(r => Object.values(r.data!).map(val => `"${String(val).replace(/"/g, '""')}"`).join(","));
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Registration_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isLoggedIn) return <Login onLogin={handleLogin} />;

  const NavButton = ({ tab, icon: Icon, label }: { tab: any, icon: any, label: string }) => (
    <button 
      onClick={() => setActiveTab(tab)} 
      className={`relative px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${
        activeTab === tab 
          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xl shadow-indigo-500/10' 
          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
      }`}
    >
      <Icon size={16} strokeWidth={activeTab === tab ? 3 : 2} />
      <span>{label}</span>
      {activeTab === tab && (
        <motion.div 
          layoutId="activeTab" 
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full"
        />
      )}
    </button>
  );

  return (
    <div className="min-h-screen pb-32 lg:pb-10 bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-500">
      {/* HEADER */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50 transition-all duration-500">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 lg:h-24 flex items-center justify-between">
          
          <div className="flex items-center gap-12">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-4 group active:scale-95 transition-all"
            >
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 dark:shadow-none overflow-hidden">
                {config.logoUrl ? (
                  <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black italic">E</span>
                )}
              </div>
            </button>

            <nav className="hidden lg:flex items-center bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-[24px] border border-slate-100 dark:border-slate-800">
              <NavButton tab="dashboard" icon={LayoutDashboard} label="Analytics" />
              <NavButton tab="processing" icon={FileText} label="Records" />
              {userRole === 'super_admin' && <NavButton tab="settings" icon={SettingsIcon} label="Setup" />}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
             >
                {isDarkMode ? <Sun size={22} strokeWidth={2.5} /> : <Moon size={22} strokeWidth={2.5} />}
             </button>

             <div className="hidden lg:flex items-center gap-3">
               <button 
                  onClick={() => setIsManualModalOpen(true)}
                  className="px-6 py-3.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-3"
               >
                  <Plus size={18} strokeWidth={3} />
                  <span>Manual Entry</span>
               </button>
               <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3.5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center gap-3"
               >
                  <Upload size={18} strokeWidth={3} />
                  <span>Upload Image</span>
               </button>
             </div>
             
             <div className="w-px h-8 bg-slate-100 dark:bg-slate-800 mx-2 hidden sm:block"></div>

             <button onClick={handleLogout} className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-900/20">
                <LogOut size={22} strokeWidth={2.5} />
             </button>
          </div>
        </div>
      </header>

      {/* MOBILE ACTION BAR */}
      <div className="lg:hidden bg-white dark:bg-slate-900 px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex gap-4 transition-colors duration-500">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 bg-indigo-600 text-white px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <Upload size={16} strokeWidth={3} />
            <span>Upload</span>
          </button>
          <button 
            onClick={() => setIsManualModalOpen(true)}
            className="flex-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Manual</span>
          </button>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 px-8 py-5 flex items-center justify-around z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.05)] transition-all duration-500">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-2 transition-all ${activeTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}`}>
          <LayoutDashboard size={24} strokeWidth={activeTab === 'dashboard' ? 3 : 2} />
          <span className="text-[9px] font-black uppercase tracking-widest">Stats</span>
        </button>
        <button onClick={() => setActiveTab('processing')} className={`flex flex-col items-center gap-2 transition-all ${activeTab === 'processing' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}`}>
          <FileText size={24} strokeWidth={activeTab === 'processing' ? 3 : 2} />
          <span className="text-[9px] font-black uppercase tracking-widest">Records</span>
        </button>
        {userRole === 'super_admin' && (
          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-2 transition-all ${activeTab === 'settings' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}`}>
            <SettingsIcon size={24} strokeWidth={activeTab === 'settings' ? 3 : 2} />
            <span className="text-[9px] font-black uppercase tracking-widest">Setup</span>
          </button>
        )}
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 mt-12">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <Dashboard 
                records={records} 
                userRole={userRole}
                config={config}
                onEdit={(data) => {
                  setEditingRecord(data);
                  setIsManualModalOpen(true);
                }}
              />
            </motion.div>
          ) : activeTab === 'settings' && userRole === 'super_admin' ? (
            <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <Settings 
                config={config} 
                onUpdate={updateAppConfig} 
                currentUsername={sessionStorage.getItem('eha_session_v2') ? JSON.parse(sessionStorage.getItem('eha_session_v2')!).username : 'superadmin'}
              />
            </motion.div>
          ) : (
            <motion.div key="processing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="flex flex-col lg:flex-row gap-12">
              {/* SIDEBAR */}
              <div className="w-full lg:w-1/3 space-y-8">
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[48px] shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-xl hover:shadow-indigo-500/5">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Database size={20} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Storage Overview</h2>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800/50">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Total Records</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{records.length}</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-[32px] border border-emerald-100 dark:border-emerald-900/10">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Cloud Synced</p>
                        <p className="text-3xl font-black text-emerald-600 tracking-tighter">{records.filter(r => r.syncStatus === 'synced').length}</p>
                    </div>
                  </div>
                  
                  <div className="mt-10 space-y-4">
                    <button onClick={exportToCSV} disabled={records.filter(r => r.status === 'completed').length === 0} className="w-full py-5 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 dark:hover:bg-slate-600 transition-all disabled:opacity-30 flex items-center justify-center gap-3 shadow-xl shadow-slate-200 dark:shadow-none">
                        <Download size={18} strokeWidth={2.5} />
                        Download CSV
                    </button>
                    {userRole === 'super_admin' && records.length > 0 && (
                      <button onClick={clearAll} className="w-full py-4 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                        <Trash2 size={14} />
                        Purge Local Memory
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-indigo-600 dark:bg-indigo-900/40 p-10 rounded-[48px] text-white shadow-2xl shadow-indigo-200 dark:shadow-none relative overflow-hidden group">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="flex items-center gap-3 mb-6">
                      <Info size={20} strokeWidth={2.5} />
                      <h3 className="text-xs font-black uppercase tracking-[0.2em]">Data Security</h3>
                    </div>
                    <p className="text-sm font-bold text-indigo-100 leading-relaxed">
                        Your data is stored locally in this browser. Use the Cloud Sync feature to ensure your records are safely backed up to your centralized Google Sheet.
                    </p>
                    <div className="mt-8 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-indigo-200" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">End-to-End Encrypted</span>
                    </div>
                </div>
              </div>

              {/* MAIN LIST */}
              <div className="w-full lg:w-2/3 space-y-8">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                        <Search size={20} className="text-slate-400 dark:text-slate-600 group-focus-within:text-indigo-500 transition-colors" strokeWidth={2.5} />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search by name, ID, or location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-16 pr-8 py-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-sm dark:text-slate-100 dark:placeholder-slate-700"
                    />
                </div>

                <div className="space-y-6">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map(record => (
                      <ProcessingCard 
                        key={record.id} 
                        record={record} 
                        onRemove={removeRecord}
                        onUpdate={updateRecordData}
                        onSync={(id) => record.data && performSync(id, record.data)}
                      />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 border-dashed transition-all">
                      <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] flex items-center justify-center mb-8 text-slate-200 dark:text-slate-800">
                        <Database size={48} strokeWidth={1} />
                      </div>
                      <p className="text-slate-400 dark:text-slate-600 font-black text-xs uppercase tracking-[0.2em]">No records found in memory</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ManualEntryModal 
        isOpen={isManualModalOpen} 
        onClose={() => {
          setIsManualModalOpen(false);
          setEditingRecord(null);
        }}
        onSubmit={handleManualSubmit}
        initialData={editingRecord}
      />

      <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" multiple />
    </div>
  );
};

export default App;

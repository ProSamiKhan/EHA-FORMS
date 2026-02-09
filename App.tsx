
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
  const [activeTab, setActiveTab] = useState<'processing' | 'dashboard' | 'settings'>('processing');
  const [records, setRecords] = useState<ProcessingRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [config, setConfig] = useState<AppConfig>({
    appName: 'EHA Summer Camp',
    appSubtitle: 'Digital Registration Portal',
    logoUrl: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedRecords = localStorage.getItem('eha_ocr_records');
    if (savedRecords) {
      try {
        setRecords(JSON.parse(savedRecords));
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

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    setIsLoggedIn(true);
    sessionStorage.setItem('eha_session_v2', JSON.stringify({ role }));
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

  const addManualRecord = (data: RegistrationData) => {
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
    const confirmation = window.confirm("WARNING: This will delete ALL records from your local browser view.");
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
        r.data?.address?.toLowerCase().includes(lower)
    );
  }, [records, searchQuery]);

  const exportToCSV = () => {
    const completed = records.filter(r => r.status === 'completed' && r.data);
    if (completed.length === 0) return alert("No completed records to export!");

    const headers = Object.keys(completed[0].data!).join(",");
    const rows = completed.map(r => 
        Object.values(r.data!).map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
    );
    
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-10 bg-[#f8fafc]">
      {/* COMPACT HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 lg:h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 lg:space-x-8">
            <button 
              onClick={() => setActiveTab('processing')}
              className="flex items-center space-x-3 group active:scale-95 transition-transform"
            >
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-indigo-600 rounded-lg lg:rounded-xl flex items-center justify-center shadow-md shadow-indigo-100 group-hover:bg-indigo-700 overflow-hidden">
                  {config.logoUrl ? (
                    <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-base lg:text-xl font-black italic">E</span>
                  )}
              </div>
              <div className="text-left">
                <h1 className="text-sm lg:text-lg font-bold text-slate-900 leading-none truncate max-w-[120px] sm:max-w-none">{config.appName}</h1>
                <p className="hidden sm:block text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{config.appSubtitle}</p>
              </div>
            </button>

            {/* DESKTOP NAV */}
            <nav className="hidden lg:flex items-center bg-slate-100 p-1.5 rounded-2xl ml-4">
              <button onClick={() => setActiveTab('processing')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'processing' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Records</button>
              <button onClick={() => setActiveTab('dashboard')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Analytics</button>
              {userRole === 'super_admin' && (
                <button onClick={() => setActiveTab('settings')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Settings</button>
              )}
            </nav>
          </div>
          
          <div className="flex items-center gap-2">
             <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Logout">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
             </button>
             <button 
                onClick={() => setIsManualModalOpen(true)}
                className="hidden sm:flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                <span>Manual</span>
             </button>
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                <span className="hidden sm:inline">Upload</span>
                <span className="sm:hidden">Process</span>
             </button>
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-around z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('processing')} className={`flex flex-col items-center gap-1 ${activeTab === 'processing' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'processing' ? "3" : "2"} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <span className="text-[10px] font-bold uppercase tracking-widest">Records</span>
        </button>
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'dashboard' ? "3" : "2"} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <span className="text-[10px] font-bold uppercase tracking-widest">Stats</span>
        </button>
        {userRole === 'super_admin' && (
          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'settings' ? "3" : "2"} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span className="text-[10px] font-bold uppercase tracking-widest">Setup</span>
          </button>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 mt-6 lg:mt-10">
        {activeTab === 'dashboard' ? (
          <Dashboard records={records} />
        ) : activeTab === 'settings' && userRole === 'super_admin' ? (
          <Settings config={config} onUpdate={updateAppConfig} />
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* SIDEBAR - REORDERED ON MOBILE */}
            <div className="w-full lg:w-1/4 order-2 lg:order-1 space-y-4 lg:space-y-6">
              <div className="bg-white p-5 lg:p-6 rounded-2xl lg:rounded-3xl shadow-sm border border-slate-200">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Database</h2>
                <div className="grid grid-cols-2 gap-3 lg:gap-4">
                  <div className="bg-slate-50 p-3 lg:p-4 rounded-xl lg:rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total</p>
                      <p className="text-xl lg:text-2xl font-black text-slate-900 leading-none">{records.length}</p>
                  </div>
                  <div className="bg-green-50 p-3 lg:p-4 rounded-xl lg:rounded-2xl">
                      <p className="text-[10px] font-bold text-green-400 uppercase mb-1">Synced</p>
                      <p className="text-xl lg:text-2xl font-black text-green-600 leading-none">{records.filter(r => r.syncStatus === 'synced').length}</p>
                  </div>
                </div>
                
                <div className="mt-5 space-y-2 lg:space-y-3">
                  <button onClick={exportToCSV} disabled={records.filter(r => r.status === 'completed').length === 0} className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                      CSV Export
                  </button>
                  {userRole === 'super_admin' && records.length > 0 && (
                    <button onClick={clearAll} className="w-full py-3 bg-white text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 border border-slate-100 transition-all">Clear Memory</button>
                  )}
                </div>
              </div>

              <div className="hidden lg:block bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                  <h3 className="text-xs font-black text-indigo-400 uppercase mb-4 tracking-widest">Active Session</h3>
                  <p className="text-xs text-indigo-900/70 leading-relaxed font-medium">
                      Admin portal is optimized for both desktop and mobile use.
                  </p>
              </div>
            </div>

            {/* MAIN LIST */}
            <div className="w-full lg:w-3/4 order-1 lg:order-2 space-y-4 lg:space-y-6">
              <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-4 lg:h-5 w-4 lg:w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <input 
                      type="text" 
                      placeholder="Search registrations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-10 lg:pl-12 pr-4 py-3 lg:py-4 bg-white border border-slate-200 rounded-xl lg:rounded-3xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                  />
              </div>

              <div className="space-y-4 lg:space-y-6">
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
                  <div className="flex flex-col items-center justify-center py-12 lg:py-24 bg-white rounded-2xl lg:rounded-[40px] border border-slate-100 border-dashed">
                    <div className="w-16 h-16 lg:w-24 lg:h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4 lg:mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-200"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                    </div>
                    <p className="text-slate-400 font-bold text-sm lg:text-base">No records to display</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <ManualEntryModal 
        isOpen={isManualModalOpen} 
        onClose={() => setIsManualModalOpen(false)}
        onSubmit={addManualRecord}
      />

      <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" multiple />
    </div>
  );
};

export default App;

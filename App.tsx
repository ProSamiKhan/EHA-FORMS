import React, { useState, useRef, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Upload, LayoutDashboard, Settings as SettingsIcon, 
  LogOut, Sun, Moon, Search, Download, Trash2, 
  Database, Cloud, ShieldCheck, UserCircle2, 
  ChevronRight, Info, AlertCircle, Loader2,
  Filter, ArrowUpDown, Menu, X
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './services/firebase';
import { ProcessingRecord, RegistrationData, UserRole, AppConfig } from './types';
import { processRegistrationForm } from './services/geminiService';
import { syncToGoogleSheets } from './services/sheetService';
import { formatDateClean } from './services/utils';
import { ProcessingCard } from './components/ProcessingCard';
import { ManualEntryModal } from './components/ManualEntryModal';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { Login } from './components/Login';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');
  const [records, setRecords] = useState<ProcessingRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
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

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);
        
        // Fetch user role from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role as UserRole);
        } else {
          // Default role for first time login (e.g. if it's the admin email)
          const role = user.email === config.adminEmail ? 'super_admin' : 'viewer';
          setUserRole(role);
          // Create user doc
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            username: user.displayName || user.email?.split('@')[0] || 'User',
            email: user.email,
            role: role,
            createdAt: new Date().toISOString()
          });
        }
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
        setUserRole(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [config.adminEmail]);

  // Sync Config from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'config', 'global_config'), (doc) => {
      if (doc.exists()) {
        setConfig(doc.data() as AppConfig);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync Records from Firestore
  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;

    const q = query(collection(db, 'registrations'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestoreRecords: ProcessingRecord[] = snapshot.docs.map(doc => {
        const data = doc.data();
        const regData = data.data || data;
        return {
          id: doc.id,
          timestamp: data.timestamp || Date.now(),
          fileName: data.fileName || `Record - ${regData.name || 'Unknown'}`,
          imageUrl: data.imageUrl || '',
          data: regData as RegistrationData,
          status: data.status || 'completed',
          source: data.source || 'manual',
          syncStatus: data.syncStatus || 'synced'
        };
      });
      
      // Merge with local OCR pending records if any
      setRecords(prev => {
        const pending = prev.filter(r => r.status !== 'completed');
        return [...pending, ...firestoreRecords];
      });
    });

    return () => unsubscribe();
  }, [isLoggedIn, currentUser]);

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

  const updateAppConfig = async (newConfig: AppConfig) => {
    setConfig(newConfig);
    await setDoc(doc(db, 'config', 'global_config'), newConfig);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

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
      
      // Normalize dates from AI
      if (extractedData) {
        for (let i = 1; i <= 10; i++) {
          const key = `payment${i}_date`;
          if ((extractedData as any)[key]) {
            (extractedData as any)[key] = formatDateClean((extractedData as any)[key]);
          }
        }
      }

      setRecords(prev => prev.map(r => r.id === record.id ? { 
        ...r, 
        status: 'completed', 
        data: extractedData,
        syncStatus: 'syncing'
      } : r));

      // Auto-sync OCR result
      if (extractedData) {
        const success = await syncToGoogleSheets(extractedData);
        setRecords(prev => prev.map(r => r.id === record.id ? { 
          ...r, 
          syncStatus: success ? 'synced' : 'failed',
          syncedAt: success ? Date.now() : undefined
        } : r));
        
        if (success) {
          console.log(`OCR record ${record.fileName} synced successfully`);
        }
      }
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
    setIsSyncing(true);
    
    try {
      // Sync to Firestore
      const id = editingRecord?.id || uuidv4();
      const timestamp = Date.now();
      
      const recordToSave = {
        id,
        timestamp,
        data,
        status: 'completed',
        source: 'manual',
        syncStatus: 'synced',
        fileName: `Record - ${data.name}`
      };

      await setDoc(doc(db, 'registrations', id), recordToSave);

      // Sync to Google Sheets
      const success = await syncToGoogleSheets(data);
      setIsSyncing(false);
      
      if (success) {
        alert("Registration synced successfully!");
        setEditingRecord(null);
        setIsManualModalOpen(false);
      } else {
        alert("Synced to database, but failed to sync to Google Sheets.");
      }
    } catch (error) {
      console.error("Firestore sync error:", error);
      setIsSyncing(false);
      alert("Failed to sync to database.");
    }
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

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const handleCustomLogin = (role: UserRole, username: string) => {
    setIsLoggedIn(true);
    setUserRole(role);
    // We don't set currentUser here as onAuthStateChanged will handle it
  };

  if (!isLoggedIn) return <Login onLogin={handleCustomLogin} />;

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
              <div className="h-10 lg:h-12 w-auto flex items-center justify-center overflow-hidden">
                {config.logoUrl ? (
                  <img src={config.logoUrl} alt="Logo" className="h-full w-auto object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 dark:shadow-none">
                    <span className="text-2xl font-black italic">E</span>
                  </div>
                )}
              </div>
            </button>

            <nav className="hidden lg:flex items-center bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-[24px] border border-slate-100 dark:border-slate-800">
              <NavButton tab="dashboard" icon={LayoutDashboard} label="Analytics" />
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
          ) : (
            <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <Settings 
                config={config} 
                onUpdate={updateAppConfig} 
                currentUsername={currentUser?.displayName || currentUser?.email || 'User'}
                userRole={userRole}
              />
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
        isSyncing={isSyncing}
      />

      <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" multiple />
    </div>
  );
};

export default App;

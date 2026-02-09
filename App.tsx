import React, { useState, useRef, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ProcessingRecord, RegistrationData } from './types';
import { processRegistrationForm } from './services/geminiService';
import { syncToGoogleSheets } from './services/sheetService';
import { ProcessingCard } from './components/ProcessingCard';
import { ManualEntryModal } from './components/ManualEntryModal';

const App: React.FC = () => {
  const [records, setRecords] = useState<ProcessingRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      setRecords(prev => prev.map(r => r.id === record.id ? { 
        ...r, 
        status: 'completed', 
        data: extractedData 
      } : r));

      // Auto-sync removed: user must review first
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
    setRecords(prev => prev.map(r => r.id === id ? { ...r, syncStatus: success ? 'synced' : 'failed' } : r));
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
    
    // Auto-sync removed: user must review first
  };

  const updateRecordData = (id: string, newData: RegistrationData) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, data: newData, syncStatus: 'idle' } : r));
  };

  const removeRecord = (id: string) => {
    setRecords(prev => {
        const record = prev.find(r => r.id === id);
        if (record && record.imageUrl) URL.revokeObjectURL(record.imageUrl);
        return prev.filter(r => r.id !== id);
    });
  };

  const clearAll = () => {
    records.forEach(r => r.imageUrl && URL.revokeObjectURL(r.imageUrl));
    setRecords([]);
  };

  const filteredRecords = useMemo(() => {
    if (!searchQuery) return records;
    const lower = searchQuery.toLowerCase();
    return records.filter(r => 
        r.data?.name?.toLowerCase().includes(lower) || 
        r.data?.admission_id?.toLowerCase().includes(lower) ||
        r.fileName.toLowerCase().includes(lower)
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
    link.setAttribute("download", `EHA_SummerCamp_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen pb-20 bg-[#f8fafc]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <span className="text-white text-xl font-black italic">E</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-slate-900 leading-none">OCR Specialist</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">English House Academy</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsManualModalOpen(true)}
                className="hidden sm:flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                <span>Manual Entry</span>
             </button>
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                <span>Upload Form</span>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/4 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Process Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total</p>
                    <p className="text-2xl font-black text-slate-900 leading-none">{records.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-green-400 uppercase mb-1">Sheet Sync</p>
                    <p className="text-2xl font-black text-green-600 leading-none">{records.filter(r => r.syncStatus === 'synced').length}</p>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <button 
                    onClick={exportToCSV}
                    disabled={records.filter(r => r.status === 'completed').length === 0}
                    className="w-full py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    Export to Excel
                </button>
                {records.length > 0 && (
                  <button 
                    onClick={clearAll}
                    className="w-full py-3 bg-white text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 border border-slate-100 transition-all"
                  >
                    Clear All History
                  </button>
                )}
              </div>
            </div>

            <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                <h3 className="text-xs font-black text-indigo-400 uppercase mb-4 tracking-widest">Manual Confirmation</h3>
                <p className="text-xs text-indigo-900/70 leading-relaxed font-medium">
                    Data extract hone ke baad use **Review** karein. Sab kuch sahi hone par **"Submit to Sheet"** button dabayein.
                </p>
            </div>
          </div>

          <div className="w-full lg:w-3/4 space-y-6">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input 
                    type="text" 
                    placeholder="Search records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                />
            </div>

            <div className="space-y-6">
              {filteredRecords.map(record => (
                <ProcessingCard 
                  key={record.id} 
                  record={record} 
                  onRemove={removeRecord}
                  onUpdate={updateRecordData}
                  onSync={(id) => record.data && performSync(id, record.data)}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      <ManualEntryModal 
        isOpen={isManualModalOpen} 
        onClose={() => setIsManualModalOpen(false)}
        onSubmit={addManualRecord}
      />

      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        multiple
      />
    </div>
  );
};

export default App;
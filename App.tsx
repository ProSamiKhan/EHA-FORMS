
import React, { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ProcessingRecord, RegistrationData } from './types';
import { processRegistrationForm } from './services/geminiService';
import { ProcessingCard } from './components/ProcessingCard';

const App: React.FC = () => {
  const [records, setRecords] = useState<ProcessingRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
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
      };
      
      newRecords.push(newRecord);
    }

    setRecords(prev => [...newRecords, ...prev]);
    setIsUploading(false);

    // Start processing each one
    for (const record of newRecords) {
        processRecord(record);
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processRecord = async (record: ProcessingRecord) => {
    setRecords(prev => prev.map(r => r.id === record.id ? { ...r, status: 'processing' } : r));
    
    try {
      // Find the file again from the input or convert URL to Base64
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

  const removeRecord = (id: string) => {
    setRecords(prev => {
        const record = prev.find(r => r.id === id);
        if (record) URL.revokeObjectURL(record.imageUrl);
        return prev.filter(r => r.id !== id);
    });
  };

  const clearAll = () => {
    records.forEach(r => URL.revokeObjectURL(r.imageUrl));
    setRecords([]);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-indigo-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-inner">
                <span className="text-indigo-900 text-2xl font-black">EHA</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">OCR Specialist</h1>
              <p className="text-xs text-indigo-200 font-medium uppercase tracking-widest opacity-80">English House Academy</p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center space-x-6 text-sm font-medium">
             <div className="flex items-center space-x-2 text-indigo-100">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span>System Online</span>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Upload & Stats */}
          <div className="w-full lg:w-1/4 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-4">New Extraction</h2>
              <div 
                className={`
                  border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center text-center cursor-pointer
                  ${isUploading ? 'bg-slate-50 border-indigo-200' : 'bg-indigo-50/50 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400'}
                `}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                </div>
                <p className="text-sm font-semibold text-indigo-900 mb-1">Click to Upload</p>
                <p className="text-xs text-slate-500">Registration form photos (JPG/PNG)</p>
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  multiple
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Batch Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total Forms</span>
                  <span className="text-sm font-bold text-slate-900">{records.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Completed</span>
                  <span className="text-sm font-bold text-green-600">{records.filter(r => r.status === 'completed').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Errors</span>
                  <span className="text-sm font-bold text-red-600">{records.filter(r => r.status === 'error').length}</span>
                </div>
                
                {records.length > 0 && (
                  <button 
                    onClick={clearAll}
                    className="w-full mt-4 py-2 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest border border-slate-100 rounded-lg hover:bg-red-50"
                  >
                    Clear All Records
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-lg shadow-indigo-200">
                <div className="flex items-center space-x-2 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-300"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                    <h2 className="font-bold">Extraction Tips</h2>
                </div>
                <ul className="text-xs space-y-2 text-indigo-100 leading-relaxed">
                    <li>• Ensure good lighting when taking the photo.</li>
                    <li>• Keep the form flat and capture all corners.</li>
                    <li>• Handwritten text should be dark and clear.</li>
                    <li>• Use "Check Manually" flag to review illegible data.</li>
                </ul>
            </div>
          </div>

          {/* Right Column: Records List */}
          <div className="w-full lg:w-3/4">
            {records.length === 0 ? (
              <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 h-[400px] flex flex-col items-center justify-center text-center p-10">
                <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No forms processed yet</h3>
                <p className="text-slate-500 max-w-sm">Upload images of the English House Academy summer camp forms to start high-precision extraction.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {records.map(record => (
                  <ProcessingCard 
                    key={record.id} 
                    record={record} 
                    onRemove={removeRecord} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action for Mobile */}
      <div className="fixed bottom-6 right-6 lg:hidden">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>
    </div>
  );
};

export default App;

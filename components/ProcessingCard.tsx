
import React, { useState, useEffect } from 'react';
import { ProcessingRecord, RegistrationData } from '../types';

interface ProcessingCardProps {
  record: ProcessingRecord;
  onRemove: (id: string) => void;
  onUpdate: (id: string, data: RegistrationData) => void;
  onSync: (id: string) => void;
}

const BASE_FEES = 20000;

const DataRow: React.FC<{ 
  label: string; 
  value: string; 
  isEditing: boolean; 
  onChange: (val: string) => void 
  type?: string
}> = ({ label, value, isEditing, onChange, type = "text" }) => (
  <div className="flex flex-col py-1.5 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">{label}</span>
    {isEditing ? (
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-md px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
      />
    ) : (
      <span className={`text-xs font-bold truncate ${value === 'CHECK_MANUALLY' ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
        {value || <em className="text-slate-300 dark:text-slate-600 font-normal italic text-[10px]">blank</em>}
      </span>
    )}
  </div>
);

export const ProcessingCard: React.FC<ProcessingCardProps> = ({ record, onRemove, onUpdate, onSync }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempData, setTempData] = useState<RegistrationData | null>(null);

  useEffect(() => {
    if (isEditing && tempData) {
      let totalPaid = 0;
      for (let i = 1; i <= 10; i++) {
        totalPaid += parseFloat((tempData as any)[`payment${i}_amount`]) || 0;
      }
      const disc = parseFloat(tempData.discount) || 0;
      const remaining = BASE_FEES - totalPaid - disc;
      const finalRem = remaining >= 0 ? remaining : 0;
      
      if (tempData.remaining_amount !== String(finalRem)) {
        setTempData({ ...tempData, remaining_amount: String(finalRem) });
      }
    }
  }, [
    tempData?.payment1_amount, tempData?.payment2_amount, tempData?.payment3_amount, 
    tempData?.payment4_amount, tempData?.payment5_amount, tempData?.payment6_amount,
    tempData?.payment7_amount, tempData?.payment8_amount, tempData?.payment9_amount,
    tempData?.payment10_amount, tempData?.discount, isEditing
  ]);

  const startEditing = () => {
    setTempData({ ...record.data! });
    setIsEditing(true);
  };

  const saveEdits = () => {
    if (tempData) {
      onUpdate(record.id, tempData);
      setIsEditing(false);
    }
  };

  const handleDataChange = (key: keyof RegistrationData, val: string) => {
    if (tempData) {
      setTempData({ ...tempData, [key]: val });
    }
  };

  const syncIcon = () => {
    switch(record.syncStatus) {
      case 'syncing': return <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
      case 'synced': return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
      case 'failed': return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
      default: return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"/></svg>;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-all hover:shadow-md">
      {/* Top Header Section */}
      <div className="flex flex-col lg:flex-row border-b border-slate-100 dark:border-slate-800/80">
          <div className="w-full lg:w-48 h-32 lg:h-auto bg-slate-50 dark:bg-slate-800 relative border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 shrink-0">
            {record.source === 'ocr' ? (
              <img src={record.imageUrl} alt={record.fileName} className="w-full h-full object-contain p-2 dark:brightness-90" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-indigo-300 dark:text-indigo-500/50 gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                <span className="text-[8px] font-black uppercase tracking-widest">Manual Entry</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 p-5 flex justify-between items-center bg-white dark:bg-slate-900">
              <div className="overflow-hidden">
                  <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm lg:text-base font-black text-slate-900 dark:text-slate-100 truncate uppercase tracking-tight">{record.data?.name || record.fileName}</h3>
                      <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-md ${record.source === 'manual' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400' : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'}`}>
                        {record.source === 'manual' ? 'Man' : 'OCR'}
                      </span>
                      {record.data?.status === 'cancelled' && (
                        <span className="px-2 py-0.5 text-[8px] font-black uppercase rounded-md bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">
                          Cancelled
                        </span>
                      )}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold tracking-wider">{record.data?.admission_id || 'PENDING ID'}</p>
              </div>
              <div className="flex gap-2">
                  {record.status === 'completed' && (
                  <button 
                      onClick={isEditing ? saveEdits : startEditing}
                      className={`p-2.5 rounded-xl transition-all shadow-sm ${isEditing ? 'bg-green-600 text-white shadow-green-100 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                  >
                      {isEditing ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      )}
                  </button>
                  )}
                  <button onClick={() => onRemove(record.id)} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
              </div>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 lg:p-6 bg-white dark:bg-slate-900 transition-colors">
        {record.status === 'processing' ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-indigo-600 border-t-transparent"></div>
            <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest animate-pulse">Scanning Document...</p>
          </div>
        ) : record.status === 'completed' && record.data ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Profile Section */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> Student Profile
                </h4>
                <div className="bg-slate-50/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-1 border border-transparent dark:border-slate-800/30">
                    <DataRow label="Admission ID" value={isEditing ? tempData!.admission_id : record.data.admission_id} isEditing={isEditing} onChange={(v) => handleDataChange('admission_id', v)} />
                    <DataRow label="Student Name" value={isEditing ? tempData!.name : record.data.name} isEditing={isEditing} onChange={(v) => handleDataChange('name', v)} />
                    <div className="grid grid-cols-2 gap-4">
                        <DataRow label="Age" value={isEditing ? tempData!.age : record.data.age} isEditing={isEditing} onChange={(v) => handleDataChange('age', v)} />
                        <DataRow label="Gender" value={isEditing ? tempData!.gender : record.data.gender} isEditing={isEditing} onChange={(v) => handleDataChange('gender', v)} />
                    </div>
                    <DataRow label="Qualification" value={isEditing ? tempData!.qualification : record.data.qualification} isEditing={isEditing} onChange={(v) => handleDataChange('qualification', v)} />
                    <DataRow label="Medium" value={isEditing ? tempData!.medium : record.data.medium} isEditing={isEditing} onChange={(v) => handleDataChange('medium', v)} />
                    <div className="pt-2">
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 block">Status</span>
                      {isEditing ? (
                        <select 
                          value={tempData!.status} 
                          onChange={(e) => handleDataChange('status', e.target.value as any)}
                          className="text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-md px-2 py-1 w-full focus:outline-none"
                        >
                          <option value="active">Active</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <span className={`text-xs font-black uppercase ${record.data.status === 'cancelled' ? 'text-red-500' : 'text-green-500'}`}>
                          {record.data.status}
                        </span>
                      )}
                    </div>
                </div>
              </div>

              {/* Contact Section */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> Contact Info
                </h4>
                <div className="bg-slate-50/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-1 border border-transparent dark:border-slate-800/30">
                    <DataRow label="Primary No" value={isEditing ? tempData!.contact_no : record.data.contact_no} isEditing={isEditing} onChange={(v) => handleDataChange('contact_no', v)} />
                    <DataRow label="WhatsApp" value={isEditing ? tempData!.whatsapp_no : record.data.whatsapp_no} isEditing={isEditing} onChange={(v) => handleDataChange('whatsapp_no', v)} />
                    <DataRow label="State / UT" value={isEditing ? tempData!.state : record.data.state} isEditing={isEditing} onChange={(v) => handleDataChange('state', v)} />
                    <DataRow label="City" value={isEditing ? tempData!.city : record.data.city} isEditing={isEditing} onChange={(v) => handleDataChange('city', v)} />
                    <DataRow label="Received In A/C" value={isEditing ? tempData!.received_ac : record.data.received_ac} isEditing={isEditing} onChange={(v) => handleDataChange('received_ac', v)} />
                    <DataRow label="Discount" value={isEditing ? tempData!.discount : record.data.discount} isEditing={isEditing} onChange={(v) => handleDataChange('discount', v)} type="number" />
                    <DataRow label="Pending Amount" value={isEditing ? tempData!.remaining_amount : record.data.remaining_amount} isEditing={isEditing} onChange={(v) => handleDataChange('remaining_amount', v)} type="number" />
                </div>
              </div>

              {/* Payment Section */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> Payment History
                </h4>
                <div className="bg-slate-50/50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-4 border border-transparent dark:border-slate-800/30 custom-scrollbar max-h-[300px] overflow-y-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <div key={num} className="border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
                        <DataRow 
                          label={`Pay ${num} ${num === 1 ? '(Initial)' : ''}`} 
                          value={isEditing ? (tempData as any)[`payment${num}_amount`] : (record.data as any)[`payment${num}_amount`]} 
                          isEditing={isEditing} 
                          onChange={(v) => handleDataChange(`payment${num}_amount` as any, v)} 
                          type="number" 
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <DataRow 
                            label="Date" 
                            value={isEditing ? (tempData as any)[`payment${num}_date`] : (record.data as any)[`payment${num}_date`]} 
                            isEditing={isEditing} 
                            onChange={(v) => handleDataChange(`payment${num}_date` as any, v)} 
                          />
                          <DataRow 
                            label="UTR" 
                            value={isEditing ? (tempData as any)[`payment${num}_utr`] : (record.data as any)[`payment${num}_utr`]} 
                            isEditing={isEditing} 
                            onChange={(v) => handleDataChange(`payment${num}_utr` as any, v)} 
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-slate-50 dark:border-slate-800 transition-colors gap-4">
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${record.syncStatus === 'synced' ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700 animate-pulse'}`}></div>
                   <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">
                     {record.syncStatus === 'synced' ? 'Cloud Sync Completed' : 'Waiting for Data Sync'}
                   </span>
                </div>
                <button 
                    onClick={() => onSync(record.id)}
                    disabled={record.syncStatus === 'synced' || record.syncStatus === 'syncing' || isEditing}
                    className={`w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg ${
                    record.syncStatus === 'synced' ? 'bg-green-600 text-white shadow-green-100 dark:shadow-none' : 
                    record.syncStatus === 'failed' ? 'bg-red-600 text-white shadow-red-100 dark:shadow-none' : 
                    record.syncStatus === 'syncing' ? 'bg-amber-500 text-white shadow-amber-100 dark:shadow-none' : 
                    'bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600 active:scale-95 shadow-slate-200 dark:shadow-none'
                    } disabled:opacity-50 disabled:scale-100 disabled:shadow-none`}
                >
                    {syncIcon()}
                    <span>
                    {record.syncStatus === 'synced' ? 'Synced to Cloud' : 
                    record.syncStatus === 'syncing' ? 'Sending Data...' : 
                    record.syncStatus === 'failed' ? 'Retry Sync' : 
                    'Save to Google Sheet'}
                    </span>
                </button>
            </div>
          </div>
        ) : record.status === 'error' ? (
            <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-3xl border border-red-100 dark:border-red-900/20 flex flex-col items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="text-xs font-bold text-red-600 dark:text-red-400 text-center uppercase tracking-wider">{record.error || 'Failed to read document'}</p>
                <button onClick={() => window.location.reload()} className="mt-2 text-[10px] font-black text-red-400 uppercase tracking-widest underline decoration-2 underline-offset-4">Try Re-uploading</button>
            </div>
        ) : null}
      </div>
    </div>
  );
};

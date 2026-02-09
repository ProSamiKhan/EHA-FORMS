
import React, { useState } from 'react';
import { ProcessingRecord, RegistrationData } from '../types';

interface ProcessingCardProps {
  record: ProcessingRecord;
  onRemove: (id: string) => void;
  onUpdate: (id: string, data: RegistrationData) => void;
  onSync: (id: string) => void;
}

const DataRow: React.FC<{ 
  label: string; 
  value: string; 
  isEditing: boolean; 
  onChange: (val: string) => void 
}> = ({ label, value, isEditing, onChange }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between py-2 lg:py-2.5 border-b border-slate-100 last:border-0 gap-1 lg:gap-4">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[120px]">{label}</span>
    {isEditing ? (
      <input 
        type="text" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    ) : (
      <span className={`text-sm font-bold truncate ${value === 'CHECK_MANUALLY' ? 'text-red-500' : 'text-slate-700'}`}>
        {value || <em className="text-slate-300 font-normal italic text-xs">blank</em>}
      </span>
    )}
  </div>
);

export const ProcessingCard: React.FC<ProcessingCardProps> = ({ record, onRemove, onUpdate, onSync }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempData, setTempData] = useState<RegistrationData | null>(null);

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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col lg:flex-row transition-all hover:shadow-md">
      {/* Image Preview */}
      <div className="w-full lg:w-64 h-48 lg:h-auto bg-slate-100 relative group border-b lg:border-b-0 lg:border-r border-slate-200">
        {record.source === 'ocr' ? (
          <img src={record.imageUrl} alt={record.fileName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50 text-indigo-300 gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            <span className="text-[10px] font-black uppercase tracking-widest">Direct Entry</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-5 lg:p-6 flex flex-col">
        <div className="flex justify-between items-start mb-5">
          <div className="flex-1 mr-3 overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base lg:text-lg font-bold text-slate-900 truncate">{record.data?.name || record.fileName}</h3>
                {record.status === 'completed' && (
                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-lg ${record.source === 'manual' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                    {record.source === 'manual' ? 'Man' : 'OCR'}
                  </span>
                )}
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight">{record.data?.admission_id || 'ID Pending'}</p>
          </div>
          
          <div className="flex gap-1.5 shrink-0">
            {record.status === 'completed' && (
              <button 
                onClick={isEditing ? saveEdits : startEditing}
                className={`p-2 rounded-xl transition-all ${isEditing ? 'bg-green-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'}`}
              >
                {isEditing ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                )}
              </button>
            )}
            <button onClick={() => onRemove(record.id)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        {record.status === 'processing' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent"></div>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Reading form...</p>
          </div>
        )}

        {record.status === 'completed' && record.data && (
          <div className="flex-1 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div className="space-y-0.5">
                <h4 className="text-[9px] font-black text-indigo-400 uppercase mb-2 tracking-widest">Student Profile</h4>
                <DataRow label="Name" value={isEditing ? tempData!.name : record.data.name} isEditing={isEditing} onChange={(v) => handleDataChange('name', v)} />
                <DataRow label="Age/Sex" value={isEditing ? `${tempData!.age}/${tempData!.gender}` : `${record.data.age}/${record.data.gender}`} isEditing={isEditing} onChange={(v) => {
                    const [age, gender] = v.split('/');
                    handleDataChange('age', age || '');
                    handleDataChange('gender', gender || '');
                }} />
                <DataRow label="Contact" value={isEditing ? tempData!.contact_no : record.data.contact_no} isEditing={isEditing} onChange={(v) => handleDataChange('contact_no', v)} />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-[9px] font-black text-indigo-400 uppercase mb-2 tracking-widest">Account Details</h4>
                <DataRow label="Payment" value={isEditing ? tempData!.initial_payment : record.data.initial_payment} isEditing={isEditing} onChange={(v) => handleDataChange('initial_payment', v)} />
                <DataRow label="Txn ID" value={isEditing ? tempData!.utr : record.data.utr} isEditing={isEditing} onChange={(v) => handleDataChange('utr', v)} />
                <DataRow label="Due Amt" value={isEditing ? tempData!.remaining_amount : record.data.remaining_amount} isEditing={isEditing} onChange={(v) => handleDataChange('remaining_amount', v)} />
              </div>
            </div>

            {/* Submission Section */}
            <div className="flex justify-end pt-3 border-t border-slate-50">
              <button 
                onClick={() => onSync(record.id)}
                disabled={record.syncStatus === 'synced' || record.syncStatus === 'syncing' || isEditing}
                className={`flex items-center gap-2 px-4 lg:px-6 py-2.5 rounded-xl text-[10px] lg:text-xs font-black uppercase tracking-widest transition-all shadow-md ${
                  record.syncStatus === 'synced' ? 'bg-green-600 text-white' : 
                  record.syncStatus === 'failed' ? 'bg-red-600 text-white' : 
                  record.syncStatus === 'syncing' ? 'bg-amber-500 text-white' : 
                  'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                } disabled:opacity-50 disabled:scale-100`}
              >
                {syncIcon()}
                <span>
                  {record.syncStatus === 'synced' ? 'Saved to Sheet' : 
                   record.syncStatus === 'syncing' ? 'Saving...' : 
                   record.syncStatus === 'failed' ? 'Try Again' : 
                   'Sync to Google'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

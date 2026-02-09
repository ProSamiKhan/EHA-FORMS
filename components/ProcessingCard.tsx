
import React, { useState } from 'react';
import { ProcessingRecord, RegistrationData } from '../types';

interface ProcessingCardProps {
  record: ProcessingRecord;
  onRemove: (id: string) => void;
  onUpdate: (id: string, data: RegistrationData) => void;
}

const DataRow: React.FC<{ 
  label: string; 
  value: string; 
  isEditing: boolean; 
  onChange: (val: string) => void 
}> = ({ label, value, isEditing, onChange }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-slate-100 last:border-0 gap-1 sm:gap-4">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider min-w-[120px]">{label}</span>
    {isEditing ? (
      <input 
        type="text" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    ) : (
      <span className={`text-sm font-medium truncate ${value === 'CHECK_MANUALLY' ? 'text-red-500 font-bold' : 'text-slate-800'}`}>
        {value || <em className="text-slate-300 font-normal italic text-xs">blank</em>}
      </span>
    )}
  </div>
);

export const ProcessingCard: React.FC<ProcessingCardProps> = ({ record, onRemove, onUpdate }) => {
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

  const copyToClipboard = () => {
    if (!record.data) return;
    navigator.clipboard.writeText(JSON.stringify(record.data, null, 2));
    alert('JSON copied!');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col lg:flex-row transition-all hover:shadow-md">
      {/* Image Preview / Source Placeholder */}
      <div className="w-full lg:w-72 bg-slate-100 relative group aspect-video lg:aspect-auto border-b lg:border-b-0 lg:border-r border-slate-200">
        {record.source === 'ocr' ? (
          <img 
            src={record.imageUrl} 
            alt={record.fileName} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50 text-indigo-300 gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            <span className="text-[10px] font-black uppercase tracking-widest">Manual Entry</span>
          </div>
        )}
        
        {record.source === 'ocr' && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button 
                  onClick={() => window.open(record.imageUrl, '_blank')}
                  className="bg-white px-3 py-1.5 rounded-lg text-xs font-bold text-slate-900 hover:bg-indigo-50"
              >
                  View Full
              </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 mr-4 overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-slate-900 truncate">{record.data?.name || record.fileName}</h3>
                {record.status === 'completed' && (
                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full ${record.source === 'manual' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                      {record.source === 'manual' ? 'Manual' : 'Extracted'}
                    </span>
                )}
            </div>
            <p className="text-xs text-slate-400 font-mono">{record.data?.admission_id || 'ID Pending'}</p>
          </div>
          
          <div className="flex gap-2 shrink-0">
            {record.status === 'completed' && (
              <>
                <button 
                  onClick={isEditing ? saveEdits : startEditing}
                  className={`p-2 rounded-xl transition-all ${isEditing ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600'}`}
                  title={isEditing ? "Save" : "Edit"}
                >
                  {isEditing ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  )}
                </button>
                <button 
                  onClick={copyToClipboard}
                  className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-indigo-100 hover:text-indigo-600 transition-all"
                  title="Copy JSON"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </button>
              </>
            )}
            <button 
              onClick={() => onRemove(record.id)}
              className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-red-100 hover:text-red-600 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        {record.status === 'processing' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-8">
            <div className="relative">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent relative z-10"></div>
            </div>
            <p className="text-sm font-bold text-indigo-600 animate-pulse">Reading handwriting...</p>
          </div>
        )}

        {record.status === 'error' && (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center bg-red-50 rounded-xl border border-red-100">
            <div className="p-3 bg-red-100 rounded-full text-red-600 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            </div>
            <p className="text-sm font-bold text-red-600">Processing Error</p>
            <p className="text-xs text-red-500 max-w-xs mt-1">{record.error}</p>
          </div>
        )}

        {record.status === 'completed' && record.data && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-12">
            <div className="space-y-0.5">
              <h4 className="text-[10px] font-black text-indigo-400 uppercase mb-2 tracking-tighter">Student Info</h4>
              <DataRow label="Full Name" value={isEditing ? tempData!.name : record.data.name} isEditing={isEditing} onChange={(v) => handleDataChange('name', v)} />
              <DataRow label="Gender" value={isEditing ? tempData!.gender : record.data.gender} isEditing={isEditing} onChange={(v) => handleDataChange('gender', v)} />
              <DataRow label="Age" value={isEditing ? tempData!.age : record.data.age} isEditing={isEditing} onChange={(v) => handleDataChange('age', v)} />
              <DataRow label="Qualification" value={isEditing ? tempData!.qualification : record.data.qualification} isEditing={isEditing} onChange={(v) => handleDataChange('qualification', v)} />
              <DataRow label="Medium" value={isEditing ? tempData!.medium : record.data.medium} isEditing={isEditing} onChange={(v) => handleDataChange('medium', v)} />
              <DataRow label="Contact" value={isEditing ? tempData!.contact_no : record.data.contact_no} isEditing={isEditing} onChange={(v) => handleDataChange('contact_no', v)} />
              <DataRow label="Address" value={isEditing ? tempData!.address : record.data.address} isEditing={isEditing} onChange={(v) => handleDataChange('address', v)} />
            </div>
            <div className="space-y-0.5 mt-6 md:mt-0">
              <h4 className="text-[10px] font-black text-indigo-400 uppercase mb-2 tracking-tighter">Account & Payment</h4>
              <DataRow label="Initial Payment" value={isEditing ? tempData!.initial_payment : record.data.initial_payment} isEditing={isEditing} onChange={(v) => handleDataChange('initial_payment', v)} />
              <DataRow label="Date" value={isEditing ? tempData!.date : record.data.date} isEditing={isEditing} onChange={(v) => handleDataChange('date', v)} />
              <DataRow label="UTR / Txn ID" value={isEditing ? tempData!.utr : record.data.utr} isEditing={isEditing} onChange={(v) => handleDataChange('utr', v)} />
              <DataRow label="Received AC" value={isEditing ? tempData!.received_ac : record.data.received_ac} isEditing={isEditing} onChange={(v) => handleDataChange('received_ac', v)} />
              <DataRow label="Discount" value={isEditing ? tempData!.discount : record.data.discount} isEditing={isEditing} onChange={(v) => handleDataChange('discount', v)} />
              <DataRow label="Remaining" value={isEditing ? tempData!.remaining_amount : record.data.remaining_amount} isEditing={isEditing} onChange={(v) => handleDataChange('remaining_amount', v)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

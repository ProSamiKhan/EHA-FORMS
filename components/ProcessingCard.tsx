
import React from 'react';
import { ProcessingRecord, RegistrationData } from '../types';

interface ProcessingCardProps {
  record: ProcessingRecord;
  onRemove: (id: string) => void;
}

const DataRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
    <span className={`text-sm font-medium ${value === 'CHECK_MANUALLY' ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
      {value || <em className="text-slate-300 font-normal">empty</em>}
    </span>
  </div>
);

export const ProcessingCard: React.FC<ProcessingCardProps> = ({ record, onRemove }) => {
  const copyToClipboard = () => {
    if (!record.data) return;
    navigator.clipboard.writeText(JSON.stringify(record.data, null, 2));
    alert('JSON copied to clipboard!');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row h-full transition-all hover:shadow-md">
      {/* Image Preview */}
      <div className="w-full md:w-1/3 bg-slate-100 relative group aspect-video md:aspect-auto">
        <img 
          src={record.imageUrl} 
          alt={record.fileName} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
            <button 
                onClick={() => window.open(record.imageUrl, '_blank')}
                className="bg-white/90 px-3 py-1.5 rounded-full text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
            >
                View Full Image
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="w-full md:w-2/3 p-5 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 truncate max-w-[200px]">{record.fileName}</h3>
            <p className="text-xs text-slate-400">{new Date(record.timestamp).toLocaleString()}</p>
          </div>
          <div className="flex gap-2">
            {record.status === 'completed' && (
              <button 
                onClick={copyToClipboard}
                className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                title="Copy JSON"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              </button>
            )}
            <button 
              onClick={() => onRemove(record.id)}
              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              title="Remove"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            </button>
          </div>
        </div>

        {record.status === 'processing' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
            <p className="text-sm font-medium text-indigo-600">Extracting data...</p>
          </div>
        )}

        {record.status === 'error' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-2 py-10 text-center">
            <div className="p-3 bg-red-100 rounded-full text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            </div>
            <p className="text-sm font-semibold text-red-600">Processing Failed</p>
            <p className="text-xs text-slate-500 max-w-xs">{record.error}</p>
          </div>
        )}

        {record.status === 'completed' && record.data && (
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="bg-indigo-50/30 p-3 rounded-lg border border-indigo-100/50 mb-3">
                <DataRow label="Admission ID" value={record.data.admission_id} />
            </div>
            <div className="grid grid-cols-1 gap-x-6">
              <DataRow label="Student Name" value={record.data.name} />
              <DataRow label="Gender" value={record.data.gender} />
              <DataRow label="Age" value={record.data.age} />
              <DataRow label="Qualification" value={record.data.qualification} />
              <DataRow label="Medium" value={record.data.medium} />
              <DataRow label="Contact" value={record.data.contact_no} />
              <DataRow label="WhatsApp" value={record.data.whatsapp_no} />
              <DataRow label="Address" value={record.data.address} />
              <div className="mt-4 pt-4 border-t border-slate-200">
                <DataRow label="Initial Pay" value={record.data.initial_payment} />
                <DataRow label="Date" value={record.data.date} />
                <DataRow label="UTR / Txn ID" value={record.data.utr} />
                <DataRow label="Received AC" value={record.data.received_ac} />
                <DataRow label="Discount" value={record.data.discount} />
                <DataRow label="Remaining" value={record.data.remaining_amount} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ProcessingRecord, RegistrationData } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { formatDateClean } from '../services/utils';
import { 
  Trash2, Edit3, Check, Globe, FileText, 
  AlertCircle, Cloud, CloudOff, Loader2, 
  User, Phone, MapPin, CreditCard, Calendar,
  ChevronDown, ChevronUp, ExternalLink, ShieldCheck,
  Hash, Zap, IndianRupee, Building2, MessageSquare, Users, GraduationCap
} from 'lucide-react';

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
  icon?: any
}> = ({ label, value, isEditing, onChange, type = "text", icon: Icon }) => (
  <div className="flex flex-col py-3 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
    <div className="flex items-center gap-2 mb-1">
      {Icon && <Icon size={10} className="text-slate-400 dark:text-slate-600" />}
      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
    {isEditing ? (
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
      />
    ) : (
      <span className={`text-xs font-bold truncate ${value === 'CHECK_MANUALLY' ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
        {label.toLowerCase().includes('date') ? formatDateClean(value) : (value || <em className="text-slate-300 dark:text-slate-600 font-normal italic text-[10px]">blank</em>)}
      </span>
    )}
  </div>
);

export const ProcessingCard: React.FC<ProcessingCardProps> = ({ record, onRemove, onUpdate, onSync }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempData, setTempData] = useState<RegistrationData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isEditing && tempData) {
      let totalPaid = 0;
      for (let i = 1; i <= 10; i++) {
        totalPaid += parseFloat((tempData as any)[`payment${i}_amount`]) || 0;
      }
      const disc = parseFloat(tempData.discount) || 0;
      const totalFees = parseFloat(tempData.total_fees) || BASE_FEES;
      const remaining = totalFees - totalPaid - disc;
      const finalRem = remaining >= 0 ? remaining : 0;
      
      if (tempData.remaining_amount !== String(finalRem)) {
        setTempData({ ...tempData, remaining_amount: String(finalRem) });
      }
    }
  }, [
    tempData?.payment1_amount, tempData?.payment2_amount, tempData?.payment3_amount, 
    tempData?.payment4_amount, tempData?.payment5_amount, tempData?.payment6_amount,
    tempData?.payment7_amount, tempData?.payment8_amount, tempData?.payment9_amount,
    tempData?.payment10_amount, tempData?.discount, tempData?.total_fees, isEditing
  ]);

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempData({ ...record.data! });
    setIsEditing(true);
    setIsExpanded(true);
  };

  const saveEdits = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const getSyncIcon = () => {
    switch(record.syncStatus) {
      case 'syncing': return <Loader2 className="animate-spin" size={14} />;
      case 'synced': return <Cloud size={14} className="text-emerald-500" />;
      case 'failed': return <CloudOff size={14} className="text-red-500" />;
      default: return <Cloud size={14} className="text-slate-300 dark:text-slate-700" />;
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-all hover:shadow-xl hover:shadow-indigo-500/5 group"
    >
      {/* Header Section */}
      <div 
        onClick={() => !isEditing && setIsExpanded(!isExpanded)}
        className="flex flex-col lg:flex-row cursor-pointer select-none"
      >
        <div className="w-full lg:w-48 h-32 lg:h-auto bg-slate-50 dark:bg-slate-800 relative border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 shrink-0 overflow-hidden">
          {record.source === 'ocr' ? (
            <img src={record.imageUrl} alt={record.fileName} className="w-full h-full object-contain p-2 dark:brightness-90 transition-transform group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-indigo-300 dark:text-indigo-500/50 gap-2">
              <Edit3 size={32} strokeWidth={1.5} />
              <span className="text-[8px] font-black uppercase tracking-widest">Manual Entry</span>
            </div>
          )}
          {record.status === 'processing' && (
            <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
              <Loader2 className="animate-spin text-indigo-600" size={24} />
            </div>
          )}
        </div>
        
        <div className="flex-1 p-6 flex justify-between items-center bg-white dark:bg-slate-900 transition-colors">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 truncate uppercase tracking-tight">
                {record.data?.name || record.fileName}
              </h3>
              <div className="flex gap-1">
                <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-md ${record.source === 'manual' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400' : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'}`}>
                  {record.source === 'manual' ? 'Man' : 'OCR'}
                </span>
                {record.data?.status === 'cancelled' && (
                  <span className="px-2 py-0.5 text-[8px] font-black uppercase rounded-md bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">
                    Cancelled
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold tracking-wider">
                {record.data?.admission_id || 'PENDING ID'}
              </p>
              <div className="flex items-center gap-1.5">
                {getSyncIcon()}
                <span className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">
                  {record.syncStatus === 'synced' ? 'Synced' : 'Local'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-4">
            {record.status === 'completed' && (
              <button 
                onClick={isEditing ? saveEdits : startEditing}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-sm ${isEditing ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
              >
                {isEditing ? <Check size={20} strokeWidth={3} /> : <Edit3 size={18} strokeWidth={2.5} />}
              </button>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); onRemove(record.id); }} 
              className="w-11 h-11 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all flex items-center justify-center"
            >
              <Trash2 size={18} strokeWidth={2.5} />
            </button>
            <div className="w-8 flex justify-center text-slate-300 dark:text-slate-700">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white dark:bg-slate-900 border-t border-slate-50 dark:border-slate-800"
          >
            <div className="p-8 lg:p-10 space-y-12">
              {record.status === 'processing' ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl flex items-center justify-center">
                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                  </div>
                  <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest animate-pulse">Analyzing Document Structure...</p>
                </div>
              ) : record.status === 'completed' && record.data ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {/* Profile Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-3">
                        <User size={14} className="text-indigo-500" strokeWidth={3} />
                        <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Student Profile</h4>
                      </div>
                      <div className="space-y-1">
                          <DataRow label="Admission ID" value={isEditing ? tempData!.admission_id : record.data.admission_id} isEditing={isEditing} onChange={(v) => handleDataChange('admission_id', v)} icon={Hash} />
                          <DataRow label="Student Name" value={isEditing ? tempData!.name : record.data.name} isEditing={isEditing} onChange={(v) => handleDataChange('name', v)} icon={User} />
                          <div className="grid grid-cols-2 gap-4">
                              <DataRow label="Age" value={isEditing ? tempData!.age : record.data.age} isEditing={isEditing} onChange={(v) => handleDataChange('age', v)} icon={Calendar} />
                              <DataRow label="Gender" value={isEditing ? tempData!.gender : record.data.gender} isEditing={isEditing} onChange={(v) => handleDataChange('gender', v)} icon={Users} />
                          </div>
                          <DataRow label="Qualification" value={isEditing ? tempData!.qualification : record.data.qualification} isEditing={isEditing} onChange={(v) => handleDataChange('qualification', v)} icon={GraduationCap} />
                          <DataRow label="Medium" value={isEditing ? tempData!.medium : record.data.medium} isEditing={isEditing} onChange={(v) => handleDataChange('medium', v)} icon={MessageSquare} />
                          <div className="py-3">
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 block">Registration Status</span>
                            {isEditing ? (
                              <select 
                                value={tempData!.status} 
                                onChange={(e) => handleDataChange('status', e.target.value as any)}
                                className="text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl px-3 py-2 w-full focus:outline-none"
                              >
                                <option value="confirm">Confirm</option>
                                <option value="pending">Pending</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            ) : (
                              <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg inline-block ${
                                record.data.status === 'cancelled' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 
                                record.data.status === 'pending' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                                'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                              }`}>
                                {record.data.status}
                              </span>
                            )}
                          </div>
                      </div>
                    </div>

                    {/* Contact Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-3">
                        <Phone size={14} className="text-indigo-500" strokeWidth={3} />
                        <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Contact & Location</h4>
                      </div>
                      <div className="space-y-1">
                          <DataRow label="Primary No" value={isEditing ? tempData!.contact_no : record.data.contact_no} isEditing={isEditing} onChange={(v) => handleDataChange('contact_no', v)} icon={Phone} />
                          <DataRow label="WhatsApp" value={isEditing ? tempData!.whatsapp_no : record.data.whatsapp_no} isEditing={isEditing} onChange={(v) => handleDataChange('whatsapp_no', v)} icon={MessageSquare} />
                          <DataRow label="State / UT" value={isEditing ? tempData!.state : record.data.state} isEditing={isEditing} onChange={(v) => handleDataChange('state', v)} icon={MapPin} />
                          <DataRow label="City" value={isEditing ? tempData!.city : record.data.city} isEditing={isEditing} onChange={(v) => handleDataChange('city', v)} icon={Building2} />
                          <DataRow label="Received In A/C" value={isEditing ? tempData!.received_ac : record.data.received_ac} isEditing={isEditing} onChange={(v) => handleDataChange('received_ac', v)} icon={ShieldCheck} />
                          <DataRow label="Total Fees" value={isEditing ? tempData!.total_fees : record.data.total_fees} isEditing={isEditing} onChange={(v) => handleDataChange('total_fees', v)} type="number" icon={IndianRupee} />
                          <div className="grid grid-cols-2 gap-4">
                            <DataRow label="Discount" value={isEditing ? tempData!.discount : record.data.discount} isEditing={isEditing} onChange={(v) => handleDataChange('discount', v)} type="number" icon={Zap} />
                            <DataRow label="Pending" value={isEditing ? tempData!.remaining_amount : record.data.remaining_amount} isEditing={isEditing} onChange={(v) => handleDataChange('remaining_amount', v)} type="number" icon={IndianRupee} />
                          </div>
                      </div>
                    </div>

                    {/* Payment Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-3">
                        <CreditCard size={14} className="text-indigo-500" strokeWidth={3} />
                        <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Payment Schedule</h4>
                      </div>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                            const amount = isEditing ? (tempData as any)[`payment${num}_amount`] : (record.data as any)[`payment${num}_amount`];
                            
                            return (
                              <div key={num} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 bg-white dark:bg-slate-900 rounded-md flex items-center justify-center text-[9px] font-black text-slate-400 border border-slate-100 dark:border-slate-800">{num}</span>
                                  <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Installment</span>
                                </div>
                                <DataRow 
                                  label="Amount" 
                                  value={amount} 
                                  isEditing={isEditing} 
                                  onChange={(v) => handleDataChange(`payment${num}_amount` as any, v)} 
                                  type="number" 
                                  icon={IndianRupee}
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <DataRow 
                                    label="Date" 
                                    value={isEditing ? (tempData as any)[`payment${num}_date`] : (record.data as any)[`payment${num}_date`]} 
                                    isEditing={isEditing} 
                                    onChange={(v) => handleDataChange(`payment${num}_date` as any, v)} 
                                    icon={Calendar}
                                  />
                                  <DataRow 
                                    label="UTR / Ref" 
                                    value={isEditing ? (tempData as any)[`payment${num}_utr`] : (record.data as any)[`payment${num}_utr`]} 
                                    isEditing={isEditing} 
                                    onChange={(v) => handleDataChange(`payment${num}_utr` as any, v)} 
                                    icon={Hash}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-center pt-10 border-t border-slate-50 dark:border-slate-800 gap-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${record.syncStatus === 'synced' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                          {getSyncIcon()}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Cloud Synchronization</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {record.syncStatus === 'synced' ? 'Successfully synced to Google Sheets' : 'Pending synchronization to cloud storage'}
                          </p>
                        </div>
                      </div>
                      <button 
                          onClick={() => onSync(record.id)}
                          disabled={record.syncStatus === 'synced' || record.syncStatus === 'syncing' || isEditing}
                          className={`w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 rounded-[24px] text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl ${
                          record.syncStatus === 'synced' ? 'bg-emerald-600 text-white shadow-emerald-200 dark:shadow-none' : 
                          record.syncStatus === 'failed' ? 'bg-red-600 text-white shadow-red-200 dark:shadow-none' : 
                          record.syncStatus === 'syncing' ? 'bg-amber-500 text-white shadow-amber-200 dark:shadow-none' : 
                          'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-indigo-200 dark:shadow-none'
                          } disabled:opacity-50 disabled:scale-100 disabled:shadow-none`}
                      >
                          {record.syncStatus === 'syncing' ? <Loader2 className="animate-spin" size={18} /> : <Cloud size={18} strokeWidth={2.5} />}
                          <span>
                          {record.syncStatus === 'synced' ? 'Synced to Cloud' : 
                          record.syncStatus === 'syncing' ? 'Sending...' : 
                          record.syncStatus === 'failed' ? 'Retry Sync' : 
                          'Sync to Cloud'}
                          </span>
                      </button>
                  </div>
                </>
              ) : record.status === 'error' ? (
                  <div className="bg-red-50 dark:bg-red-900/10 p-10 rounded-[40px] border border-red-100 dark:border-red-900/20 flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600">
                        <AlertCircle size={32} strokeWidth={2.5} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-2">Processing Failed</p>
                        <p className="text-xs font-bold text-red-500/70 dark:text-red-400/50 max-w-xs">{record.error || 'The document could not be analyzed correctly. Please try a clearer image.'}</p>
                      </div>
                      <button onClick={() => window.location.reload()} className="mt-4 px-8 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-200 dark:shadow-none hover:bg-red-700 transition-all">Try Again</button>
                  </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

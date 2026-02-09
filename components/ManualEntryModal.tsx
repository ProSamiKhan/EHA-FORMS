
import React, { useState } from 'react';
import { RegistrationData } from '../types';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RegistrationData) => void;
}

const INITIAL_DATA: RegistrationData = {
  admission_id: '',
  name: '',
  gender: '',
  age: '',
  qualification: '',
  medium: '',
  contact_no: '',
  whatsapp_no: '',
  address: '',
  initial_payment: '',
  date: new Date().toLocaleDateString('en-GB'),
  utr: '',
  received_ac: '',
  discount: '',
  remaining_amount: ''
};

const InputField = ({ 
  label, 
  value, 
  field, 
  placeholder, 
  onChange 
}: { 
  label: string, 
  value: string, 
  field: keyof RegistrationData, 
  placeholder?: string,
  onChange: (key: keyof RegistrationData, val: string) => void
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(field, e.target.value)}
      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
    />
  </div>
);

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<RegistrationData>(INITIAL_DATA);

  if (!isOpen) return null;

  const handleChange = (key: keyof RegistrationData, val: string) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData(INITIAL_DATA);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in duration-300 flex flex-col max-h-[92vh] sm:max-h-[85vh]">
        <div className="px-6 py-4 lg:px-8 lg:py-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50 shrink-0">
          <div>
            <h2 className="text-lg lg:text-xl font-black text-slate-900">Registration</h2>
            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Manual Data Entry</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 lg:p-8 overflow-y-auto grow custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-50 pb-2">Student Info</h3>
              <InputField label="Admission ID" value={formData.admission_id} field="admission_id" placeholder="EHA-3HC-..." onChange={handleChange} />
              <InputField label="Full Name" value={formData.name} field="name" onChange={handleChange} />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Gender" value={formData.gender} field="gender" onChange={handleChange} />
                <InputField label="Age" value={formData.age} field="age" onChange={handleChange} />
              </div>
              <InputField label="Contact No" value={formData.contact_no} field="contact_no" onChange={handleChange} />
              <InputField label="Address" value={formData.address} field="address" onChange={handleChange} />
            </div>

            <div className="space-y-5">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-50 pb-2">Payments</h3>
              <InputField label="Amount Paid" value={formData.initial_payment} field="initial_payment" onChange={handleChange} />
              <InputField label="Date" value={formData.date} field="date" placeholder="DD/MM/YYYY" onChange={handleChange} />
              <InputField label="UTR / Txn ID" value={formData.utr} field="utr" onChange={handleChange} />
              <InputField label="Discount" value={formData.discount} field="discount" onChange={handleChange} />
              <InputField label="Due Amount" value={formData.remaining_amount} field="remaining_amount" onChange={handleChange} />
            </div>
          </div>
        </form>

        <div className="px-6 py-4 lg:px-8 lg:py-6 border-t border-slate-100 flex gap-3 justify-end bg-slate-50 shrink-0">
          <button type="button" onClick={onClose} className="hidden sm:block px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-white transition-all">Cancel</button>
          <button 
            type="submit" 
            onClick={handleSubmit}
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            Submit Record
          </button>
        </div>
      </div>
    </div>
  );
};

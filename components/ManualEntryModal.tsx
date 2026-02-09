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

  const InputField = ({ label, value, field, placeholder }: { label: string, value: string, field: keyof RegistrationData, placeholder?: string }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => handleChange(field, e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900">Manual Registration</h2>
            <p className="text-xs text-indigo-600 font-bold uppercase tracking-tighter">Direct Data Submission</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-50 pb-2">Student Information</h3>
              <InputField label="Admission ID" value={formData.admission_id} field="admission_id" placeholder="EHA-3HC-..." />
              <InputField label="Full Name" value={formData.name} field="name" />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Gender" value={formData.gender} field="gender" />
                <InputField label="Age" value={formData.age} field="age" />
              </div>
              <InputField label="Qualification" value={formData.qualification} field="qualification" />
              <InputField label="Medium" value={formData.medium} field="medium" />
              <InputField label="Contact No" value={formData.contact_no} field="contact_no" />
              <InputField label="Address" value={formData.address} field="address" />
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-50 pb-2">Payment Details</h3>
              <InputField label="Initial Payment" value={formData.initial_payment} field="initial_payment" />
              <InputField label="Date" value={formData.date} field="date" placeholder="DD/MM/YYYY" />
              <InputField label="UTR / Transaction ID" value={formData.utr} field="utr" />
              <InputField label="Received AC" value={formData.received_ac} field="received_ac" />
              <InputField label="Discount" value={formData.discount} field="discount" />
              <InputField label="Remaining Amount" value={formData.remaining_amount} field="remaining_amount" />
            </div>
          </div>
        </form>

        <div className="px-8 py-6 border-t border-slate-100 flex gap-3 justify-end bg-slate-50">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-white transition-all">Cancel</button>
          <button 
            type="submit" 
            onClick={handleSubmit}
            className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
          >
            Submit Record
          </button>
        </div>
      </div>
    </div>
  );
};
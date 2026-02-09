
import React, { useState, useEffect } from 'react';
import { RegistrationData } from '../types';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RegistrationData) => void;
}

const TOTAL_FEES = 20000;

const INITIAL_DATA: RegistrationData = {
  admission_id: 'EHA-3HC-',
  name: '',
  gender: '',
  age: '',
  qualification: '',
  medium: 'English',
  contact_no: '',
  whatsapp_no: '',
  address: '',
  initial_payment: '',
  date: new Date().toLocaleDateString('en-GB'),
  utr: '',
  received_ac: 'EHA Account',
  discount: '0',
  remaining_amount: '20000'
};

// Common Indian Cities for the Datalist
const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", 
  "Pune", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", 
  "Pimpri-Chinchwad", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", 
  "Meerut", "Rajkot", "Kalyan-Dombivli", "Vasai-Virar", "Varanasi", "Srinagar", "Aurangabad", 
  "Dhanbad", "Amritsar", "Navi Mumbai", "Allahabad", "Ranchi", "Howrah", "Jabalpur", "Gwalior", 
  "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Guwahati", "Chandigarh", "Solapur", 
  "Hubli-Dharwad", "Bareilly", "Moradabad", "Mysore", "Gurgaon", "Aligarh", "Jalandhar", 
  "Tiruchirappalli", "Bhubaneswar", "Salem", "Mira-Bhayandar", "Warangal", "Guntur"
];

const InputField = ({ 
  label, 
  value, 
  field, 
  placeholder, 
  type = "text",
  onChange 
}: { 
  label: string, 
  value: string, 
  field: keyof RegistrationData, 
  placeholder?: string,
  type?: string,
  onChange: (key: keyof RegistrationData, val: string) => void
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(field, e.target.value)}
      list={field === 'address' ? 'city-list' : undefined}
      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
    />
    {field === 'address' && (
      <datalist id="city-list">
        {INDIAN_CITIES.map(city => <option key={city} value={city} />)}
      </datalist>
    )}
  </div>
);

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<RegistrationData>(INITIAL_DATA);
  const [error, setError] = useState('');

  // Auto-calculate remaining amount
  useEffect(() => {
    const paid = parseFloat(formData.initial_payment) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const remaining = TOTAL_FEES - paid - discount;
    
    if (String(remaining) !== formData.remaining_amount) {
        setFormData(prev => ({ ...prev, remaining_amount: String(remaining >= 0 ? remaining : 0) }));
    }
  }, [formData.initial_payment, formData.discount]);

  if (!isOpen) return null;

  const handleChange = (key: keyof RegistrationData, val: string) => {
    setError('');
    // UTR constraint: max 12 digits
    if (key === 'utr') {
        const numericVal = val.replace(/[^0-9]/g, '').slice(0, 12);
        setFormData(prev => ({ ...prev, [key]: numericVal }));
        return;
    }
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!formData.name) return setError("Student Name is required");
    if (formData.utr.length > 0 && formData.utr.length !== 12) {
        return setError("UTR must be exactly 12 digits");
    }

    onSubmit(formData);
    setFormData(INITIAL_DATA);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in duration-300 flex flex-col max-h-[92vh] sm:max-h-[85vh]">
        <div className="px-6 py-4 lg:px-8 lg:py-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50 shrink-0">
          <div>
            <h2 className="text-lg lg:text-xl font-black text-slate-900">Manual Entry</h2>
            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Fees Fixed: ₹{TOTAL_FEES.toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 lg:p-8 overflow-y-auto grow custom-scrollbar">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span className="text-[10px] font-black uppercase tracking-wider">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-50 pb-2">Student Profile</h3>
              <InputField label="Admission ID" value={formData.admission_id} field="admission_id" onChange={handleChange} />
              <InputField label="Full Name" value={formData.name} field="name" placeholder="Enter student name" onChange={handleChange} />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                    <select 
                        value={formData.gender} 
                        onChange={(e) => handleChange('gender', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                </div>
                <InputField label="Age" value={formData.age} field="age" type="number" onChange={handleChange} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputField label="Contact No" value={formData.contact_no} field="contact_no" onChange={handleChange} />
                <InputField label="WhatsApp No" value={formData.whatsapp_no} field="whatsapp_no" onChange={handleChange} />
              </div>
              <InputField label="Address / City" value={formData.address} field="address" placeholder="Type city or select..." onChange={handleChange} />
            </div>

            <div className="space-y-5">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-50 pb-2">Financials</h3>
              <InputField label="Initial Payment" value={formData.initial_payment} field="initial_payment" placeholder="How much paid?" onChange={handleChange} />
              <InputField label="Discount" value={formData.discount} field="discount" onChange={handleChange} />
              
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Remaining Due</span>
                <span className="text-xl font-black text-indigo-600">₹{parseFloat(formData.remaining_amount).toLocaleString()}</span>
              </div>

              <InputField label="UTR (12 Digits Only)" value={formData.utr} field="utr" placeholder="Enter 12 digit ID" onChange={handleChange} />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Date" value={formData.date} field="date" onChange={handleChange} />
                <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Account</label>
                    <select 
                        value={formData.received_ac} 
                        onChange={(e) => handleChange('received_ac', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none"
                    >
                        <option value="EHA Account">EHA Account</option>
                        <option value="Cash">Cash</option>
                    </select>
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="px-6 py-4 lg:px-8 lg:py-6 border-t border-slate-100 flex gap-3 justify-end bg-slate-50 shrink-0">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-white transition-all">Cancel</button>
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

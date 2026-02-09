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

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<RegistrationData>(INITIAL_DATA);
  const [error, setError] = useState('');

  useEffect(() => {
    const paid = parseFloat(formData.initial_payment) || 0;
    const disc = parseFloat(formData.discount) || 0;
    const remaining = TOTAL_FEES - paid - disc;
    setFormData(prev => ({ ...prev, remaining_amount: String(remaining >= 0 ? remaining : 0) }));
  }, [formData.initial_payment, formData.discount]);

  if (!isOpen) return null;

  const handleChange = (key: keyof RegistrationData, val: string) => {
    setError('');
    if (key === 'utr') {
      const numeric = val.replace(/[^0-9]/g, '').slice(0, 12);
      setFormData(prev => ({ ...prev, [key]: numeric }));
      return;
    }
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return setError("Student Name is required");
    if (formData.utr && formData.utr.length !== 12) return setError("UTR must be exactly 12 digits");
    
    onSubmit(formData);
    setFormData(INITIAL_DATA);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900">New Registration</h2>
            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Base Fees: ₹{TOTAL_FEES.toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto grow custom-scrollbar space-y-8">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-50 pb-2">Student Profile</h3>
              
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Admission ID</label>
                <input type="text" value={formData.admission_id} onChange={(e) => handleChange('admission_id', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Student Name" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                  <select value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none">
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Age</label>
                  <input type="number" value={formData.age} onChange={(e) => handleChange('age', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Qualification</label>
                <input type="text" value={formData.qualification} onChange={(e) => handleChange('qualification', e.target.value)} placeholder="e.g. 10th, Graduate" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact No</label>
                  <input type="tel" value={formData.contact_no} onChange={(e) => handleChange('contact_no', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp No</label>
                  <input type="tel" value={formData.whatsapp_no} onChange={(e) => handleChange('whatsapp_no', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Address / City</label>
                <input list="cities" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="Type or Select City" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" />
                <datalist id="cities">
                  {INDIAN_CITIES.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>

            <div className="space-y-5">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-50 pb-2">Payment Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Pay</label>
                  <input type="number" value={formData.initial_payment} onChange={(e) => handleChange('initial_payment', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Discount</label>
                  <input type="number" value={formData.discount} onChange={(e) => handleChange('discount', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" />
                </div>
              </div>

              <div className="bg-indigo-600 p-4 rounded-2xl flex justify-between items-center shadow-lg shadow-indigo-100">
                <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">Balance Due</span>
                <span className="text-xl font-black text-white">₹{parseFloat(formData.remaining_amount).toLocaleString()}</span>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">UTR (12 Digits)</label>
                <input type="text" value={formData.utr} onChange={(e) => handleChange('utr', e.target.value)} placeholder="0000 0000 0000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold tracking-widest outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                  <input type="text" value={formData.date} onChange={(e) => handleChange('date', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Account</label>
                  <select value={formData.received_ac} onChange={(e) => handleChange('received_ac', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none">
                    <option value="EHA Account">EHA Account</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="px-8 py-6 border-t border-slate-100 flex gap-4 bg-slate-50">
          <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-all">Cancel</button>
          <button type="submit" onClick={handleSubmit} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">Submit Entry</button>
        </div>
      </div>
    </div>
  );
};


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
  payment1_amount: '',
  payment1_date: new Date().toLocaleDateString('en-GB'),
  payment1_utr: '',
  payment2_amount: '',
  payment2_date: '',
  payment2_utr: '',
  payment3_amount: '',
  payment3_date: '',
  payment3_utr: '',
  payment4_amount: '',
  payment4_date: '',
  payment4_utr: '',
  received_ac: 'EHA Account',
  discount: '0',
  remaining_amount: '20000',
  status: 'active'
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
    const p1 = parseFloat(formData.payment1_amount) || 0;
    const p2 = parseFloat(formData.payment2_amount) || 0;
    const p3 = parseFloat(formData.payment3_amount) || 0;
    const p4 = parseFloat(formData.payment4_amount) || 0;
    const disc = parseFloat(formData.discount) || 0;
    const totalPaid = p1 + p2 + p3 + p4;
    const remaining = TOTAL_FEES - totalPaid - disc;
    setFormData(prev => ({ ...prev, remaining_amount: String(remaining >= 0 ? remaining : 0) }));
  }, [formData.payment1_amount, formData.payment2_amount, formData.payment3_amount, formData.payment4_amount, formData.discount]);

  if (!isOpen) return null;

  const handleChange = (key: keyof RegistrationData, val: string) => {
    setError('');
    if (key === 'payment1_utr' || key === 'payment2_utr' || key === 'payment3_utr' || key === 'payment4_utr') {
      const numeric = val.replace(/[^0-9]/g, '').slice(0, 12);
      setFormData(prev => ({ ...prev, [key]: numeric }));
      return;
    }
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return setError("Student Name is required");
    if (formData.payment1_utr && formData.payment1_utr.length !== 12) return setError("Payment 1 UTR must be 12 digits");
    if (formData.payment2_utr && formData.payment2_utr.length !== 12) return setError("Payment 2 UTR must be 12 digits");
    if (formData.payment3_utr && formData.payment3_utr.length !== 12) return setError("Payment 3 UTR must be 12 digits");
    if (formData.payment4_utr && formData.payment4_utr.length !== 12) return setError("Payment 4 UTR must be 12 digits");
    
    onSubmit(formData);
    setFormData(INITIAL_DATA);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[32px] shadow-2xl dark:shadow-none overflow-hidden flex flex-col max-h-[90vh] transition-colors border border-transparent dark:border-slate-800">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-900/10 transition-colors">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">New Registration</h2>
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest">Base Fees: ₹{TOTAL_FEES.toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 dark:text-slate-600"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto grow custom-scrollbar space-y-8 dark:bg-slate-900 transition-colors">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-50 dark:border-indigo-900/20 pb-2 transition-colors">Student Profile</h3>
              
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1 transition-colors">Admission ID</label>
                <input type="text" value={formData.admission_id} onChange={(e) => handleChange('admission_id', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 outline-none dark:text-slate-100 transition-colors" />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1 transition-colors">Full Name</label>
                <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Student Name" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 outline-none dark:text-slate-100 transition-colors placeholder:text-slate-300 dark:placeholder:text-slate-700" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1 transition-colors">Gender</label>
                  <select value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none dark:text-slate-100 transition-colors">
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1 transition-colors">Age</label>
                  <input type="number" value={formData.age} onChange={(e) => handleChange('age', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none dark:text-slate-100 transition-colors" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1 transition-colors">Qualification</label>
                <input type="text" value={formData.qualification} onChange={(e) => handleChange('qualification', e.target.value)} placeholder="e.g. 10th, Graduate" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:text-slate-100 transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1 transition-colors">Contact No</label>
                  <input type="tel" value={formData.contact_no} onChange={(e) => handleChange('contact_no', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none dark:text-slate-100 transition-colors" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1 transition-colors">WhatsApp No</label>
                  <input type="tel" value={formData.whatsapp_no} onChange={(e) => handleChange('whatsapp_no', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none dark:text-slate-100 transition-colors" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1 transition-colors">Address / City</label>
                <input list="cities" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="Type or Select City" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none dark:text-slate-100 transition-colors" />
                <datalist id="cities">
                  {INDIAN_CITIES.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1 transition-colors">Registration Status</label>
                <select value={formData.status} onChange={(e) => handleChange('status', e.target.value)} className={`w-full border rounded-xl px-4 py-2.5 text-sm font-black outline-none transition-colors ${formData.status === 'cancelled' ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400' : 'bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100'}`}>
                  <option value="active">Active</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="space-y-5">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-50 dark:border-indigo-900/20 pb-2 transition-colors">Payment Schedule</h3>
              
              <div className="space-y-4">
                {/* Payment 1 */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Payment 1 (Initial)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder="Amount" value={formData.payment1_amount} onChange={(e) => handleChange('payment1_amount', e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none dark:text-slate-100" />
                    <input type="text" placeholder="Date" value={formData.payment1_date} onChange={(e) => handleChange('payment1_date', e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none dark:text-slate-100" />
                  </div>
                  <input type="text" placeholder="UTR (12 Digits)" value={formData.payment1_utr} onChange={(e) => handleChange('payment1_utr', e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold outline-none dark:text-slate-100" />
                </div>

                {/* Payment 2 */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Payment 2</span>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder="Amount" value={formData.payment2_amount} onChange={(e) => handleChange('payment2_amount', e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none dark:text-slate-100" />
                    <input type="text" placeholder="Date" value={formData.payment2_date} onChange={(e) => handleChange('payment2_date', e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none dark:text-slate-100" />
                  </div>
                  <input type="text" placeholder="UTR (12 Digits)" value={formData.payment2_utr} onChange={(e) => handleChange('payment2_utr', e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold outline-none dark:text-slate-100" />
                </div>

                {/* Payment 3 */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Payment 3</span>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder="Amount" value={formData.payment3_amount} onChange={(e) => handleChange('payment3_amount', e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none dark:text-slate-100" />
                    <input type="text" placeholder="Date" value={formData.payment3_date} onChange={(e) => handleChange('payment3_date', e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none dark:text-slate-100" />
                  </div>
                  <input type="text" placeholder="UTR (12 Digits)" value={formData.payment3_utr} onChange={(e) => handleChange('payment3_utr', e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold outline-none dark:text-slate-100" />
                </div>

                {/* Payment 4 */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Payment 4</span>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder="Amount" value={formData.payment4_amount} onChange={(e) => handleChange('payment4_amount', e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none dark:text-slate-100" />
                    <input type="text" placeholder="Date" value={formData.payment4_date} onChange={(e) => handleChange('payment4_date', e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none dark:text-slate-100" />
                  </div>
                  <input type="text" placeholder="UTR (12 Digits)" value={formData.payment4_utr} onChange={(e) => handleChange('payment4_utr', e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold outline-none dark:text-slate-100" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1 transition-colors">Discount</label>
                  <input type="number" value={formData.discount} onChange={(e) => handleChange('discount', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none dark:text-slate-100 transition-colors" />
                </div>

                <div className="bg-indigo-600 dark:bg-indigo-700 p-4 rounded-2xl flex justify-between items-center shadow-lg dark:shadow-none transition-colors">
                  <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">Balance Due</span>
                  <span className="text-xl font-black text-white">₹{parseFloat(formData.remaining_amount).toLocaleString()}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1 transition-colors">Received Account</label>
                  <select value={formData.received_ac} onChange={(e) => handleChange('received_ac', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none dark:text-slate-100 transition-colors">
                    <option value="EHA Account">EHA Account</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 flex gap-4 bg-slate-50 dark:bg-slate-800/50 transition-colors">
          <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-all transition-colors">Cancel</button>
          <button type="submit" onClick={handleSubmit} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all transition-colors">Submit Entry</button>
        </div>
      </div>
    </div>
  );
};

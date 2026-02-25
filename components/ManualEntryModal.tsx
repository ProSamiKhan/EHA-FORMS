
import React, { useState, useEffect } from 'react';
import { RegistrationData } from '../types';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RegistrationData) => void;
  initialData?: RegistrationData | null;
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
  city: '',
  state: '',
  payment1_amount: '',
  payment1_date: new Date().toLocaleDateString('en-GB'),
  payment1_utr: '',
  payment2_amount: '', payment2_date: '', payment2_utr: '',
  payment3_amount: '', payment3_date: '', payment3_utr: '',
  payment4_amount: '', payment4_date: '', payment4_utr: '',
  payment5_amount: '', payment5_date: '', payment5_utr: '',
  payment6_amount: '', payment6_date: '', payment6_utr: '',
  payment7_amount: '', payment7_date: '', payment7_utr: '',
  payment8_amount: '', payment8_date: '', payment8_utr: '',
  payment9_amount: '', payment9_date: '', payment9_utr: '',
  payment10_amount: '', payment10_date: '', payment10_utr: '', payment10_method: 'account',
  received_ac: 'EHA Account',
  discount: '0',
  remaining_amount: '20000',
  status: 'confirm'
};

const INDIAN_STATES_AND_UTS = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", 
  "Lakshadweep", "Puducherry"
];

const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Pune", 
  "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", 
  "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", 
  "Rajkot", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", 
  "Allahabad (Prayagraj)", "Ranchi", "Coimbatore", "Jabalpur", "Gwalior", "Vijayawada", 
  "Madurai", "Raipur", "Kota", "Guwahati", "Chandigarh", "Mysuru", "Tiruchirappalli", 
  "Noida", "Gurugram"
];

const toInputDate = (s: string) => {
  if (!s) return '';
  if (s.includes('T')) {
    try {
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch (e) {}
  }
  const parts = s.split('/');
  if (parts.length !== 3) return '';
  const [d, m, y] = parts;
  return `${y}-${m}-${d}`;
};

const fromInputDate = (s: string) => {
  if (!s) return '';
  const parts = s.split('-');
  if (parts.length !== 3) return '';
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
};

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<RegistrationData>(INITIAL_DATA);

  const [country, setCountry] = useState<'India' | 'Other'>('India');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      // Heuristic: if contact starts with something other than 10 digits or has non-numeric chars, it might be 'Other'
      // But let's just default to India unless we see a reason not to.
      // Actually, let's check if the contact number is exactly 10 digits.
      const isIndian = /^\d{10}$/.test(initialData.contact_no || '') || initialData.contact_no === '';
      setCountry(isIndian ? 'India' : 'Other');
    } else {
      setFormData(INITIAL_DATA);
      setCountry('India');
    }
  }, [initialData, isOpen]);
  const [error, setError] = useState('');

  useEffect(() => {
    const p1 = parseFloat(formData.payment1_amount) || 0;
    const p2 = parseFloat(formData.payment2_amount) || 0;
    const p3 = parseFloat(formData.payment3_amount) || 0;
    const p4 = parseFloat(formData.payment4_amount) || 0;
    const p5 = parseFloat(formData.payment5_amount) || 0;
    const p6 = parseFloat(formData.payment6_amount) || 0;
    const p7 = parseFloat(formData.payment7_amount) || 0;
    const p8 = parseFloat(formData.payment8_amount) || 0;
    const p9 = parseFloat(formData.payment9_amount) || 0;
    const p10 = parseFloat(formData.payment10_amount) || 0;
    const disc = parseFloat(formData.discount) || 0;
    const totalPaid = p1 + p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9 + p10;
    const remaining = TOTAL_FEES - totalPaid - disc;
    setFormData(prev => ({ ...prev, remaining_amount: String(remaining >= 0 ? remaining : 0) }));
  }, [
    formData.payment1_amount, formData.payment2_amount, formData.payment3_amount, 
    formData.payment4_amount, formData.payment5_amount, formData.payment6_amount,
    formData.payment7_amount, formData.payment8_amount, formData.payment9_amount,
    formData.payment10_amount, formData.discount
  ]);

  if (!isOpen) return null;

  const handleChange = (key: keyof RegistrationData, val: string) => {
    setError('');
    if (key.toString().includes('utr')) {
      const methodKey = key.toString().replace('utr', 'method') as keyof RegistrationData;
      const method = (formData as any)[methodKey] || 'account';
      
      if (method === 'account') {
        const numeric = val.replace(/[^0-9]/g, '').slice(0, 12);
        setFormData(prev => ({ ...prev, [key]: numeric }));
      } else {
        // For cash, it's "Received By" - allow text
        setFormData(prev => ({ ...prev, [key]: val }));
      }
      return;
    }
    
    if (country === 'India' && (key === 'contact_no' || key === 'whatsapp_no')) {
      const numeric = val.replace(/[^0-9]/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [key]: numeric }));
      return;
    }

    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return setError("Student Name is required");
    
    if (country === 'India') {
      if (formData.contact_no && formData.contact_no.length !== 10) return setError("Contact Number must be 10 digits");
      if (formData.whatsapp_no && formData.whatsapp_no.length !== 10) return setError("WhatsApp Number must be 10 digits");
    }

    for (let i = 1; i <= 10; i++) {
      const utr = (formData as any)[`payment${i}_utr`];
      const method = (formData as any)[`payment${i}_method`] || 'account';
      const amt = (formData as any)[`payment${i}_amount`];
      
      if (amt && amt !== '0') {
        if (method === 'account' && utr && utr.length !== 12) {
          return setError(`Payment ${i} UTR must be 12 digits`);
        }
        if (method === 'cash' && !utr) {
          return setError(`Payment ${i} Received By name is required for cash`);
        }
      }
    }
    
    onSubmit(formData);
    setFormData(INITIAL_DATA);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[32px] shadow-2xl dark:shadow-none overflow-hidden flex flex-col max-h-[90vh] transition-colors border border-transparent dark:border-slate-800">
        <div className="px-4 md:px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-900/10 transition-colors">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">New Registration</h2>
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest">Base Fees: ₹{TOTAL_FEES.toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 dark:text-slate-600"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-8 overflow-y-auto grow custom-scrollbar space-y-8 dark:bg-slate-900 transition-colors">
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

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1 transition-colors">Qualification</label>
                <input type="text" value={formData.qualification} onChange={(e) => handleChange('qualification', e.target.value)} placeholder="e.g. 10th, Graduate" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:text-slate-100 transition-colors" />
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1 transition-colors">Country</label>
                  <select 
                    value={country} 
                    onChange={(e) => setCountry(e.target.value as any)} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none dark:text-slate-100 transition-colors"
                  >
                    <option value="India">India (+91)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1 transition-colors">Medium</label>
                  <select value={formData.medium} onChange={(e) => handleChange('medium', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none dark:text-slate-100 transition-colors">
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Urdu">Urdu</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1 transition-colors">Contact No</label>
                  <div className="relative flex items-center">
                    {country === 'India' && (
                      <span className="absolute left-4 text-xs font-bold text-slate-400">+91</span>
                    )}
                    <input 
                      type="tel" 
                      value={formData.contact_no} 
                      onChange={(e) => handleChange('contact_no', e.target.value)} 
                      className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 text-sm font-bold outline-none dark:text-slate-100 transition-colors ${country === 'India' ? 'pl-12 pr-4' : 'px-4'}`} 
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1 transition-colors">WhatsApp No</label>
                  <div className="relative flex items-center">
                    {country === 'India' && (
                      <span className="absolute left-4 text-xs font-bold text-slate-400">+91</span>
                    )}
                    <input 
                      type="tel" 
                      value={formData.whatsapp_no} 
                      onChange={(e) => handleChange('whatsapp_no', e.target.value)} 
                      className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 text-sm font-bold outline-none dark:text-slate-100 transition-colors ${country === 'India' ? 'pl-12 pr-4' : 'px-4'}`} 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1 transition-colors">State / UT</label>
                  <select 
                    value={formData.state} 
                    onChange={(e) => handleChange('state', e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none dark:text-slate-100 transition-colors"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES_AND_UTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1 transition-colors">City</label>
                  <input list="cities" value={formData.city} onChange={(e) => handleChange('city', e.target.value)} placeholder="Select City" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none dark:text-slate-100 transition-colors" />
                  <datalist id="cities">
                    {INDIAN_CITIES.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1 transition-colors">Registration Status</label>
                <select 
                  value={formData.status} 
                  onChange={(e) => handleChange('status', e.target.value)} 
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm font-black outline-none transition-colors ${
                    formData.status === 'cancelled' 
                      ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400' 
                      : formData.status === 'pending'
                        ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-900/20 dark:border-amber-900/30 dark:text-amber-400'
                        : 'bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100'
                  }`}
                >
                  <option value="confirm">Confirm</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="space-y-5">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-50 dark:border-indigo-900/20 pb-2 transition-colors">Payment Schedule</h3>
              
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                  const method = (formData as any)[`payment${num}_method`] || 'account';
                  return (
                    <div key={num} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Payment {num} {num === 1 ? '(Initial)' : ''}</span>
                        <div className="flex bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          <button 
                            type="button"
                            onClick={() => handleChange(`payment${num}_method` as any, 'account')}
                            className={`px-2 py-1 text-[8px] font-black uppercase rounded-md transition-all ${method === 'account' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            Account
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleChange(`payment${num}_method` as any, 'cash')}
                            className={`px-2 py-1 text-[8px] font-black uppercase rounded-md transition-all ${method === 'cash' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            Cash
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input 
                          type="number" 
                          placeholder="Amount" 
                          value={(formData as any)[`payment${num}_amount`]} 
                          onChange={(e) => handleChange(`payment${num}_amount` as any, e.target.value)} 
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none dark:text-slate-100" 
                        />
                        <input 
                          type="date" 
                          placeholder="Date" 
                          value={toInputDate((formData as any)[`payment${num}_date`])} 
                          onChange={(e) => handleChange(`payment${num}_date` as any, fromInputDate(e.target.value))} 
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none dark:text-slate-100" 
                        />
                      </div>
                      <input 
                        type="text" 
                        placeholder={method === 'account' ? "UTR (12 Digits)" : "Received By (Name)"} 
                        value={(formData as any)[`payment${num}_utr`]} 
                        onChange={(e) => handleChange(`payment${num}_utr` as any, e.target.value)} 
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold outline-none dark:text-slate-100" 
                      />
                    </div>
                  );
                })}
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

        <div className="px-4 md:px-8 py-6 border-t border-slate-100 dark:border-slate-800 flex gap-4 bg-slate-50 dark:bg-slate-800/50 transition-colors">
          <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-all transition-colors">Cancel</button>
          <button type="submit" onClick={handleSubmit} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all transition-colors">Submit Entry</button>
        </div>
      </div>
    </div>
  );
};

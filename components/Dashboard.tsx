import React, { useMemo, useEffect, useState } from 'react';
import { ProcessingRecord, RegistrationData } from '../types';
import { fetchAllRegistrations } from '../services/sheetService';

interface DashboardProps {
  records: ProcessingRecord[];
}

const DetailRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between py-3 border-b border-slate-50 last:border-0">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-xs font-bold text-slate-700">{value || '—'}</span>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ records }) => {
  const [remoteData, setRemoteData] = useState<RegistrationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<number>(Date.now());
  const [viewingRecord, setViewingRecord] = useState<RegistrationData | null>(null);

  const normalizeData = (rawItems: any[]): RegistrationData[] => {
    return rawItems.map(item => {
      const row: any = {};
      Object.keys(item).forEach(k => {
        row[k.toLowerCase().trim()] = item[k];
      });

      return {
        admission_id: String(row['admission id'] || row['admission_id'] || row['id'] || ''),
        name: String(row['name'] || row['student name'] || ''),
        gender: String(row['gender'] || ''),
        age: String(row['age'] || ''),
        qualification: String(row['qualification'] || ''),
        medium: String(row['medium'] || ''),
        contact_no: String(row['contact no'] || row['contact_no'] || ''),
        whatsapp_no: String(row['whatsapp no'] || row['whatsapp_no'] || ''),
        address: String(row['address'] || ''),
        initial_payment: String(row['initial payment'] || row['initial_payment'] || '0'),
        date: String(row['date'] || ''),
        utr: String(row['utr'] || ''),
        received_ac: String(row['received ac'] || row['received_ac'] || ''),
        discount: String(row['discount'] || '0'),
        remaining_amount: String(row['remaining amount'] || row['remaining_amount'] || '0')
      };
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const rawData = await fetchAllRegistrations();
        if (Array.isArray(rawData)) {
          setRemoteData(normalizeData(rawData));
        } else if (rawData && (rawData as any).error) {
          setError(`Cloud Error: ${(rawData as any).error}`);
        }
      } catch (err) {
        setError("Network error: Could not sync with Google Sheets.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [lastRefreshed]);

  const allSyncedData = useMemo(() => {
    const localSynced = records.filter(r => r.syncStatus === 'synced' && r.data).map(r => r.data!);
    const uniqueMap = new Map<string, RegistrationData>();
    remoteData.forEach(item => { if (item.admission_id) uniqueMap.set(item.admission_id, item); });
    localSynced.forEach(item => { if (item.admission_id && !uniqueMap.has(item.admission_id)) uniqueMap.set(item.admission_id, item); });
    return Array.from(uniqueMap.values()).sort((a, b) => {
        try {
            // FIX: Explicitly type return value as number to avoid arithmetic operation errors
            const parseDate = (s: string): number => {
                if (!s) return 0;
                const parts = s.split('/');
                if (parts.length !== 3) return 0;
                const [d, m, y] = parts;
                const time = new Date(`${y}-${m}-${d}`).getTime();
                return isNaN(time) ? 0 : time;
            };
            const timeB = parseDate(b.date);
            const timeA = parseDate(a.date);
            return timeB - timeA;
        } catch(e) { return 0; }
    });
  }, [remoteData, records]);

  const stats = useMemo(() => {
    const total = allSyncedData.length;
    const genderMap: Record<string, number> = {};
    let revenue = 0;
    allSyncedData.forEach(d => {
      const g = (d.gender || 'Other').trim().toLowerCase();
      genderMap[g] = (genderMap[g] || 0) + 1;
      revenue += parseFloat(String(d.initial_payment).replace(/[^0-9.]/g, '')) || 0;
    });
    return { total, genderMap, revenue };
  }, [allSyncedData]);

  return (
    <div className="space-y-8 pb-10">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-xl font-black text-slate-900">Cloud Insights</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {error ? <span className="text-red-500">{error}</span> : "Synchronized Google Sheet Analytics"}
            </p>
        </div>
        <button onClick={() => setLastRefreshed(Date.now())} disabled={isLoading} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all active:scale-95 disabled:opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isLoading ? "animate-spin" : ""}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 relative">Total Admissions</h3>
          <p className="text-4xl font-black text-slate-900 relative">{stats.total}</p>
          <p className="mt-4 text-green-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 relative">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> {isLoading ? "Syncing..." : "Live Data"}
          </p>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Gender Distribution</h3>
          <div className="space-y-3">
            {Object.entries(stats.genderMap).map(([gender, count]) => {
                // FIX: Guard against division by zero and ensure operands are treated as numeric
                const perc = stats.total > 0 ? Math.round((Number(count) / stats.total) * 100) : 0;
                return (
                    <div key={gender} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                            <span className="text-slate-500">{gender}</span>
                            <span className="text-indigo-600">{count}</span>
                        </div>
                        <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${perc}%` }}></div>
                        </div>
                    </div>
                )
            })}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Revenue</h3>
          <p className="text-3xl font-black text-slate-900 tracking-tight">₹{stats.revenue.toLocaleString()}</p>
          <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth Index</span>
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Master Cloud Records</h3>
              <span className="text-[10px] font-bold text-indigo-600 bg-white px-3 py-1 rounded-full shadow-sm">{allSyncedData.length} Total</span>
          </div>
          <div className="overflow-x-auto grow">
              <table className="w-full text-left">
                  <thead>
                  <tr className="border-b border-slate-50">
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Admission ID</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Student Name</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">City</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Action</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                  {allSyncedData.map((data, idx) => (
                      <tr key={data.admission_id || idx} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-8 py-4">
                          <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{data.admission_id || 'N/A'}</span>
                      </td>
                      <td className="px-8 py-4">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{data.name}</span>
                      </td>
                      <td className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase">{data.address || '—'}</td>
                      <td className="px-8 py-4 text-right">
                          <button onClick={() => setViewingRecord(data)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90 group-hover:bg-indigo-50 group-hover:text-indigo-600 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                      </td>
                      </tr>
                  ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* DETAIL MODAL */}
      {viewingRecord && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-indigo-50/30">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">{viewingRecord.name}</h2>
                        <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">{viewingRecord.admission_id}</p>
                    </div>
                    <button onClick={() => setViewingRecord(null)} className="p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <div className="p-8 space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <DetailRow label="Date of Reg" value={viewingRecord.date} />
                    <DetailRow label="Gender" value={viewingRecord.gender} />
                    <DetailRow label="Age" value={viewingRecord.age} />
                    <DetailRow label="Qualification" value={viewingRecord.qualification} />
                    <DetailRow label="Medium" value={viewingRecord.medium} />
                    <DetailRow label="Contact" value={viewingRecord.contact_no} />
                    <DetailRow label="WhatsApp" value={viewingRecord.whatsapp_no} />
                    <DetailRow label="City / Address" value={viewingRecord.address} />
                    <DetailRow label="UTR / Txn ID" value={viewingRecord.utr} />
                    <DetailRow label="Account" value={viewingRecord.received_ac} />
                    <DetailRow label="Initial Pay" value={`₹${viewingRecord.initial_payment}`} />
                    <DetailRow label="Discount" value={`₹${viewingRecord.discount}`} />
                    <div className="flex justify-between py-4 mt-2 bg-indigo-600 px-6 rounded-2xl">
                        <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">Pending Balance</span>
                        <span className="text-lg font-black text-white">₹{viewingRecord.remaining_amount}</span>
                    </div>
                </div>
                <div className="p-8 pt-0">
                    <button onClick={() => setViewingRecord(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">Close Details</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

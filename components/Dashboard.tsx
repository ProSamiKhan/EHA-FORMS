
import React, { useMemo, useEffect, useState } from 'react';
import { ProcessingRecord, RegistrationData } from '../types';
import { fetchAllRegistrations } from '../services/sheetService';

interface DashboardProps {
  records: ProcessingRecord[];
}

export const Dashboard: React.FC<DashboardProps> = ({ records }) => {
  const [remoteData, setRemoteData] = useState<RegistrationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<number>(Date.now());

  // Precise mapping based on the user's screenshot headers
  const normalizeData = (rawItems: any[]): RegistrationData[] => {
    return rawItems.map(item => {
      // Create a lowercase key map for easy lookup
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
        console.log("Analytics: Received data from Cloud", rawData);
        
        if (Array.isArray(rawData)) {
          if (rawData.length > 0) {
            const processed = normalizeData(rawData);
            setRemoteData(processed);
          } else {
            console.warn("Sheet is connected but has no records yet.");
            setRemoteData([]);
          }
        } else if (rawData && (rawData as any).error) {
          setError(`Cloud Error: ${(rawData as any).error}`);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Network error: Could not sync with Google Sheets.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [lastRefreshed]);

  const allSyncedData = useMemo(() => {
    const localSynced = records
      .filter(r => r.syncStatus === 'synced' && r.data)
      .map(r => r.data!);
    
    const uniqueMap = new Map<string, RegistrationData>();
    
    // Remote data from Google Sheets takes priority
    remoteData.forEach(item => {
      if (item.admission_id) uniqueMap.set(item.admission_id, item);
    });
    
    // Add local synced data if not already present in remote
    localSynced.forEach(item => {
      if (item.admission_id && !uniqueMap.has(item.admission_id)) {
        uniqueMap.set(item.admission_id, item);
      }
    });

    const combined = Array.from(uniqueMap.values());

    return combined.sort((a, b) => {
        try {
            if (!a.date || !b.date) return 0;
            const parseDate = (dStr: string) => {
                const [d, m, y] = dStr.split('/');
                return new Date(`${y}-${m}-${d}`).getTime();
            };
            return parseDate(b.date) - parseDate(a.date);
        } catch (e) {
            return 0;
        }
    });
  }, [remoteData, records]);

  const stats = useMemo(() => {
    const total = allSyncedData.length;
    const genderMap: Record<string, number> = {};
    const cityMap: Record<string, number> = {};
    let totalRevenue = 0;

    allSyncedData.forEach(data => {
      const g = (data.gender || 'Other').trim().toLowerCase();
      genderMap[g] = (genderMap[g] || 0) + 1;

      const addr = (data.address || '').trim().toLowerCase();
      if (addr) {
          // Simple city extraction: last part of address
          const parts = addr.split(/[,\s]+/).filter(p => p.length > 1);
          const city = parts[parts.length - 1] || 'Other';
          cityMap[city] = (cityMap[city] || 0) + 1;
      }

      const payment = parseFloat(String(data.initial_payment).replace(/[^0-9.]/g, '')) || 0;
      totalRevenue += payment;
    });

    return { total, genderMap, cityMap, totalRevenue };
  }, [allSyncedData]);

  const handleRefresh = () => {
    setLastRefreshed(Date.now());
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-xl font-black text-slate-900">Cloud Insights</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {error ? <span className="text-red-500">{error}</span> : "Synchronized Google Sheet Analytics"}
            </p>
        </div>
        <button 
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-95 disabled:opacity-50"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isLoading ? "animate-spin" : ""}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 relative">Total Admissions</h3>
          <p className="text-4xl font-black text-slate-900 relative tracking-tighter">{isLoading ? "..." : stats.total}</p>
          <div className="mt-4 flex items-center text-green-500 text-xs font-bold gap-1 relative">
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : (stats.total > 0 ? 'bg-green-500' : 'bg-slate-300')}`}></div>
            <span>{isLoading ? "Fetching data..." : (stats.total > 0 ? "Synced with Sheet" : "Empty Sheet")}</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Gender Distribution</h3>
          <div className="space-y-4">
            {Object.entries(stats.genderMap).length > 0 ? Object.entries(stats.genderMap).map(([gender, count]) => {
              const percentage = Math.round((Number(count) / stats.total) * 100) || 0;
              return (
                <div key={gender} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                    <span className="text-slate-500">{gender}</span>
                    <span className="text-indigo-600">{count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            }) : (
                <div className="h-16 flex items-center justify-center border-2 border-dashed border-slate-50 rounded-2xl">
                    <p className="text-slate-300 text-[10px] font-black uppercase italic">Awaiting Records</p>
                </div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Revenue</h3>
          <p className="text-3xl font-black text-slate-900 tracking-tight">₹{stats.totalRevenue.toLocaleString()}</p>
          <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Across {stats.total} entries</span>
             <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col h-full">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Top Locations</h3>
            <div className="space-y-4 flex-1">
                {Object.entries(stats.cityMap)
                .sort((a, b) => Number(b[1]) - Number(a[1]))
                .slice(0, 8)
                .map(([city, count]) => (
                    <div key={city} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                        <span className="text-xs font-black text-slate-700 uppercase tracking-wider truncate max-w-[150px]">{city}</span>
                        <span className="text-xs font-black text-indigo-600 bg-white px-2 py-0.5 rounded-lg border border-slate-100">{count}</span>
                    </div>
                ))}
                {stats.total === 0 && !isLoading && <p className="text-slate-300 text-xs italic text-center py-10">No data available</p>}
            </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Latest Cloud Logs</h3>
                <span className="text-[10px] font-bold text-indigo-600 bg-white px-3 py-1 rounded-full shadow-sm">{allSyncedData.length} Records</span>
            </div>
            <div className="overflow-x-auto grow">
                <table className="w-full text-left">
                    <thead>
                    <tr className="border-b border-slate-50">
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Admission ID</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Student Name</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Date</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Payment</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                    {allSyncedData.map((data, idx) => (
                        <tr key={data.admission_id || idx} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-8 py-4">
                            <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{data.admission_id || 'N/A'}</span>
                        </td>
                        <td className="px-8 py-4">
                            <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{data.name}</span>
                        </td>
                        <td className="px-8 py-4 text-[10px] font-bold text-slate-500">{data.date}</td>
                        <td className="px-8 py-4 text-xs font-black text-slate-900 text-right">₹{data.initial_payment}</td>
                        </tr>
                    ))}
                    {allSyncedData.length === 0 && !isLoading && (
                        <tr>
                            <td colSpan={4} className="px-8 py-20 text-center">
                                <p className="text-slate-300 font-bold text-sm">No synchronized records found.</p>
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};


import React, { useMemo, useEffect, useState } from 'react';
import { ProcessingRecord, RegistrationData } from '../types';
import { fetchAllRegistrations } from '../services/sheetService';

interface DashboardProps {
  records: ProcessingRecord[];
}

export const Dashboard: React.FC<DashboardProps> = ({ records }) => {
  const [remoteData, setRemoteData] = useState<RegistrationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<number>(Date.now());

  // Fetch data from Google Sheets on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAllRegistrations();
        setRemoteData(data);
      } catch (err) {
        console.error("Cloud fetch failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [lastRefreshed]);

  // Combine local synced records with remote data, removing duplicates based on admission_id
  const allSyncedData = useMemo(() => {
    const localSynced = records
      .filter(r => r.syncStatus === 'synced' && r.data)
      .map(r => r.data!);
    
    // Use a Map to ensure unique records by admission_id
    const uniqueMap = new Map<string, RegistrationData>();
    
    // Add remote data first (Source of truth)
    remoteData.forEach(item => {
      if (item.admission_id) uniqueMap.set(item.admission_id, item);
    });
    
    // Add local synced records (might be newer or same)
    localSynced.forEach(item => {
      if (item.admission_id) uniqueMap.set(item.admission_id, item);
    });

    return Array.from(uniqueMap.values()).sort((a, b) => {
        // Sort by date (assuming DD/MM/YYYY) - simplest descending sort
        const [d1, m1, y1] = a.date.split('/');
        const [d2, m2, y2] = b.date.split('/');
        return new Date(`${y2}-${m2}-${d2}`).getTime() - new Date(`${y1}-${m1}-${d1}`).getTime();
    });
  }, [remoteData, records]);

  const stats = useMemo(() => {
    const total = allSyncedData.length;
    const genderMap: Record<string, number> = {};
    const cityMap: Record<string, number> = {};
    let totalRevenue = 0;

    allSyncedData.forEach(data => {
      const g = (data.gender || 'Unknown').trim().toLowerCase();
      genderMap[g] = (genderMap[g] || 0) + 1;

      const addr = data.address || '';
      const parts = addr.split(/[,\s]+/).filter(p => p.length > 3);
      const city = (parts[parts.length - 1] || 'Other').toLowerCase();
      cityMap[city] = (cityMap[city] || 0) + 1;

      const payment = parseFloat(data.initial_payment.replace(/[^0-9.]/g, '')) || 0;
      totalRevenue += payment;
    });

    return { total, genderMap, cityMap, totalRevenue };
  }, [allSyncedData]);

  const handleRefresh = () => {
    setLastRefreshed(Date.now());
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header with Refresh */}
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-xl font-black text-slate-900">Academy Performance</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Real-time Cloud Sync Analytics</p>
        </div>
        <button 
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-95 disabled:opacity-50"
            title="Refresh from Cloud"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isLoading ? "animate-spin" : ""}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 relative">Cloud Total Admissions</h3>
          <p className="text-4xl font-black text-slate-900 relative">{isLoading ? "..." : stats.total}</p>
          <div className="mt-4 flex items-center text-green-500 text-xs font-bold gap-1 relative">
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-green-500'}`}></div>
            <span>{isLoading ? "Fetching cloud data..." : "Database synchronized"}</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Registration Demographics</h3>
          <div className="space-y-4">
            {Object.entries(stats.genderMap).length > 0 ? Object.entries(stats.genderMap).map(([gender, count]) => {
              const percentage = Math.round((Number(count) / stats.total) * 100) || 0;
              return (
                <div key={gender} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                    <span className="text-slate-500">{gender}</span>
                    <span className="text-indigo-600">{count} students ({percentage}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            }) : (
                <div className="h-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-50 rounded-2xl">
                    <p className="text-slate-300 text-[10px] font-black uppercase italic">Calculating Cloud Data...</p>
                </div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm group">
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Financial Overview</h3>
          <div className="space-y-1">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Collected</p>
             <p className="text-3xl font-black text-slate-900 tracking-tight">₹{stats.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-50">
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Locations</span>
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{Object.keys(stats.cityMap).length} Cities</span>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Locations Table */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col h-full">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Geographic Reach</h3>
            <div className="space-y-4 flex-1">
                {Object.entries(stats.cityMap)
                .sort((a, b) => Number(b[1]) - Number(a[1]))
                .slice(0, 8)
                .map(([city, count]) => (
                    <div key={city} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100/50 hover:bg-white transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-[10px] font-black text-indigo-400 border border-slate-50 uppercase">
                            {city.substring(0, 1)}
                        </div>
                        <span className="text-xs font-black text-slate-700 uppercase tracking-wider">{city}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900">{count}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Reg.</span>
                    </div>
                    </div>
                ))}
                {stats.total === 0 && !isLoading && <p className="text-slate-300 text-xs italic text-center py-10">Waiting for cloud synchronization...</p>}
                {isLoading && <div className="space-y-3 animate-pulse">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-slate-50 rounded-2xl w-full"></div>)}
                </div>}
            </div>
        </div>

        {/* Global Success Log */}
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Cloud Master Record Log</h3>
            <div className="flex items-center gap-2">
                {isLoading && <span className="text-[9px] font-bold text-amber-500 animate-pulse uppercase">Updating...</span>}
                <span className="text-[10px] font-bold text-indigo-600 bg-white px-3 py-1 rounded-full shadow-sm">Verified Synced Data Only</span>
            </div>
            </div>
            <div className="overflow-x-auto grow">
            <table className="w-full text-left">
                <thead>
                <tr className="border-b border-slate-50">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Admission ID</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Student Name</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Address/City</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Paid</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                {allSyncedData.slice(0, 15).map((data, idx) => (
                    <tr key={data.admission_id || idx} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-4">
                        <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded-md">{data.admission_id || 'N/A'}</span>
                    </td>
                    <td className="px-8 py-4">
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{data.name}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{data.gender} / {data.age}</span>
                        </div>
                    </td>
                    <td className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase truncate max-w-[140px]">{data.address}</td>
                    <td className="px-8 py-4 text-[10px] font-bold text-slate-500">{data.date}</td>
                    <td className="px-8 py-4 text-xs font-black text-slate-900 text-right">₹{data.initial_payment}</td>
                    </tr>
                ))}
                {allSyncedData.length === 0 && !isLoading && (
                    <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-200"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                            </div>
                            <p className="text-slate-400 font-bold text-sm">No synchronized records found on cloud.</p>
                            <p className="text-[10px] text-slate-300 font-black uppercase mt-1 tracking-widest">Ensure your Google Script has a doGet function configured.</p>
                        </div>
                    </td>
                    </tr>
                )}
                {isLoading && (
                    <tr>
                        <td colSpan={5} className="px-8 py-20 text-center">
                             <div className="flex flex-col items-center gap-4">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Querying Cloud Database...</span>
                             </div>
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>
            {allSyncedData.length > 15 && (
                <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-50 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Displaying latest 15 of {allSyncedData.length} registrations</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};


import React, { useMemo } from 'react';
import { ProcessingRecord } from '../types';

interface DashboardProps {
  records: ProcessingRecord[];
}

export const Dashboard: React.FC<DashboardProps> = ({ records }) => {
  const syncedRecords = useMemo(() => records.filter(r => r.syncStatus === 'synced' && r.data), [records]);

  const stats = useMemo(() => {
    const total = syncedRecords.length;
    const genderMap: Record<string, number> = {};
    const cityMap: Record<string, number> = {};

    syncedRecords.forEach(r => {
      const g = (r.data?.gender || 'Unknown').trim().toLowerCase();
      genderMap[g] = (genderMap[g] || 0) + 1;

      // Extract city from address (assuming last part after comma or just the text)
      const addr = r.data?.address || '';
      const parts = addr.split(/[,\s]+/).filter(p => p.length > 3);
      const city = (parts[parts.length - 1] || 'Other').toLowerCase();
      cityMap[city] = (cityMap[city] || 0) + 1;
    });

    return { total, genderMap, cityMap };
  }, [syncedRecords]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 relative">Total Admissions</h3>
          <p className="text-4xl font-black text-slate-900 relative">{stats.total}</p>
          <div className="mt-4 flex items-center text-green-500 text-xs font-bold gap-1 relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            <span>Live Sync Active</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Gender Ratio</h3>
          <div className="space-y-4">
            {Object.entries(stats.genderMap).map(([gender, count]) => {
              // Fix: Explicitly convert count to number for arithmetic operations to resolve TS inference errors
              const percentage = Math.round((Number(count) / stats.total) * 100) || 0;
              return (
                <div key={gender} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold uppercase">
                    <span className="text-slate-600">{gender}</span>
                    <span className="text-indigo-600">{count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {stats.total === 0 && <p className="text-slate-300 text-xs italic">No data yet</p>}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Top Locations</h3>
          <div className="space-y-3">
            {Object.entries(stats.cityMap)
              // Fix: Explicitly convert entry values to number for subtraction to resolve TS arithmetic errors
              .sort((a, b) => Number(b[1]) - Number(a[1]))
              .slice(0, 5)
              .map(([city, count]) => (
                <div key={city} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                    <span className="text-sm font-bold text-slate-700 capitalize">{city}</span>
                  </div>
                  <span className="text-xs font-black text-slate-400 px-2 py-0.5 bg-slate-50 rounded-lg">{count}</span>
                </div>
              ))}
            {stats.total === 0 && <p className="text-slate-300 text-xs italic">No data yet</p>}
          </div>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Recent Success Log</h3>
          <span className="text-[10px] font-bold text-indigo-600 bg-white px-3 py-1 rounded-full shadow-sm">Synced Records Only</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Admission ID</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Student Name</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Gender</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Address/City</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Payment</th>
              </tr>
            </thead>
            <tbody>
              {syncedRecords.slice(0, 10).map((r) => (
                <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-4 text-xs font-mono text-indigo-600">{r.data!.admission_id}</td>
                  <td className="px-8 py-4 text-sm font-bold text-slate-800">{r.data!.name}</td>
                  <td className="px-8 py-4 text-xs font-bold text-slate-500 uppercase">{r.data!.gender}</td>
                  <td className="px-8 py-4 text-xs font-medium text-slate-400 truncate max-w-[150px]">{r.data!.address}</td>
                  <td className="px-8 py-4 text-xs font-medium text-slate-500">{r.data!.date}</td>
                  <td className="px-8 py-4 text-sm font-black text-slate-900 text-right">₹{r.data!.initial_payment}</td>
                </tr>
              ))}
              {syncedRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-slate-300 italic text-sm">No records found. Start syncing forms to see them here.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

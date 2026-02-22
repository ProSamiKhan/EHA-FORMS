
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { ProcessingRecord, RegistrationData } from '../types';
import { fetchAllRegistrations } from '../services/sheetService';
import html2canvas from 'html2canvas';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';
import { 
  format, subDays, subMonths, subYears, isAfter, parse, isValid, addDays,
  startOfDay, startOfWeek, startOfMonth, startOfYear 
} from 'date-fns';

type TimeRange = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'lifetime' | 'custom';

interface DashboardProps {
  records: ProcessingRecord[];
}

const DetailRow = ({ label, value, fullWidth = false }: { label: string, value: string, fullWidth?: boolean }) => (
  <div className={`flex flex-col py-3 border-b border-slate-50 dark:border-slate-800/50 last:border-0 ${fullWidth ? 'col-span-2' : ''}`}>
    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-1">{label}</span>
    <span className="text-[13px] font-bold text-slate-800 dark:text-slate-100 leading-tight">{value || '—'}</span>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ records }) => {
  const [remoteData, setRemoteData] = useState<RegistrationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<number>(Date.now());
  const [viewingRecord, setViewingRecord] = useState<RegistrationData | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!modalRef.current) return;
    try {
      // Temporarily remove max-height and overflow to capture full content
      const originalStyle = modalRef.current.style.cssText;
      modalRef.current.style.maxHeight = 'none';
      modalRef.current.style.overflow = 'visible';
      
      const canvas = await html2canvas(modalRef.current, {
        backgroundColor: '#ffffff',
        scale: 3, // Higher scale for better quality
        useCORS: true,
        logging: false,
        windowWidth: modalRef.current.scrollWidth,
        windowHeight: modalRef.current.scrollHeight
      });
      
      modalRef.current.style.cssText = originalStyle;

      const link = document.createElement('a');
      link.download = `EHA-Admission-${viewingRecord?.admission_id || 'record'}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handlePrint = () => {
    if (!modalRef.current) return;
    
    // Temporarily expand for printing
    const originalStyle = modalRef.current.style.cssText;
    modalRef.current.style.maxHeight = 'none';
    modalRef.current.style.overflow = 'visible';
    
    const printContent = modalRef.current.innerHTML;
    
    modalRef.current.style.cssText = originalStyle;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Admission Record - ${viewingRecord?.admission_id}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; }
            @media print {
              body { padding: 0; margin: 0; }
              .no-print { display: none; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body class="bg-white">
          <div class="p-8">
            ${printContent}
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

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
        payment1_amount: String(row['payment1_amount'] || row['payment 1 amount'] || row['initial payment'] || row['initial_payment'] || '0'),
        payment1_date: String(row['payment1_date'] || row['payment 1 date'] || row['date'] || ''),
        payment1_utr: String(row['payment1_utr'] || row['payment 1 utr'] || row['utr'] || ''),
        payment2_amount: String(row['payment2_amount'] || row['payment 2 amount'] || '0'),
        payment2_date: String(row['payment2_date'] || row['payment 2 date'] || ''),
        payment2_utr: String(row['payment2_utr'] || row['payment 2 utr'] || ''),
        payment3_amount: String(row['payment3_amount'] || row['payment 3 amount'] || '0'),
        payment3_date: String(row['payment3_date'] || row['payment 3 date'] || ''),
        payment3_utr: String(row['payment3_utr'] || row['payment 3 utr'] || ''),
        payment4_amount: String(row['payment4_amount'] || row['payment 4 amount'] || '0'),
        payment4_date: String(row['payment4_date'] || row['payment 4 date'] || ''),
        payment4_utr: String(row['payment4_utr'] || row['payment 4 utr'] || ''),
        payment5_amount: String(row['payment5_amount'] || row['payment 5 amount'] || '0'),
        payment5_date: String(row['payment5_date'] || row['payment 5 date'] || ''),
        payment5_utr: String(row['payment5_utr'] || row['payment 5 utr'] || ''),
        payment6_amount: String(row['payment6_amount'] || row['payment 6 amount'] || '0'),
        payment6_date: String(row['payment6_date'] || row['payment 6 date'] || ''),
        payment6_utr: String(row['payment6_utr'] || row['payment 6 utr'] || ''),
        payment7_amount: String(row['payment7_amount'] || row['payment 7 amount'] || '0'),
        payment7_date: String(row['payment7_date'] || row['payment 7 date'] || ''),
        payment7_utr: String(row['payment7_utr'] || row['payment 7 utr'] || ''),
        payment8_amount: String(row['payment8_amount'] || row['payment 8 amount'] || '0'),
        payment8_date: String(row['payment8_date'] || row['payment 8 date'] || ''),
        payment8_utr: String(row['payment8_utr'] || row['payment 8 utr'] || ''),
        payment9_amount: String(row['payment9_amount'] || row['payment 9 amount'] || '0'),
        payment9_date: String(row['payment9_date'] || row['payment 9 date'] || ''),
        payment9_utr: String(row['payment9_utr'] || row['payment 9 utr'] || ''),
        payment10_amount: String(row['payment10_amount'] || row['payment 10 amount'] || '0'),
        payment10_date: String(row['payment10_date'] || row['payment 10 date'] || ''),
        payment10_utr: String(row['payment10_utr'] || row['payment 10 utr'] || ''),
        received_ac: String(row['received ac'] || row['received_ac'] || ''),
        discount: String(row['discount'] || '0'),
        remaining_amount: String(row['remaining amount'] || row['remaining_amount'] || '0'),
        status: (row['status'] || 'active').toLowerCase() as 'active' | 'cancelled'
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
            const parseDate = (s: string): number => {
                if (!s) return 0;
                const parts = s.split('/');
                if (parts.length !== 3) return 0;
                const [d, m, y] = parts;
                const time = new Date(`${y}-${m}-${d}`).getTime();
                return isNaN(time) ? 0 : time;
            };
            const timeB = parseDate(b.payment1_date);
            const timeA = parseDate(a.payment1_date);
            return timeB - timeA;
        } catch(e) { return 0; }
    });
  }, [remoteData, records]);

  const [timeRange, setTimeRange] = useState<TimeRange>('lifetime');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [admRange, setAdmRange] = useState<TimeRange>('lifetime');
  const [revRange, setRevRange] = useState<TimeRange>('lifetime');
  const [genRange, setGenRange] = useState<TimeRange>('lifetime');
  const [chartRange, setChartRange] = useState<TimeRange>('lifetime');
  const [revChartRange, setRevChartRange] = useState<TimeRange>('lifetime');

  const [admCustom, setAdmCustom] = useState<{ start: string, end: string }>({ start: '', end: '' });
  const [revCustom, setRevCustom] = useState<{ start: string, end: string }>({ start: '', end: '' });
  const [genCustom, setGenCustom] = useState<{ start: string, end: string }>({ start: '', end: '' });
  const [chartCustom, setChartCustom] = useState<{ start: string, end: string }>({ start: '', end: '' });
  const [revChartCustom, setRevChartCustom] = useState<{ start: string, end: string }>({ start: '', end: '' });

  const parseDate = (s: string): Date | null => {
    if (!s) return null;
    const parts = s.split('/');
    if (parts.length !== 3) return null;
    const [d, m, y] = parts;
    const date = new Date(`${y}-${m}-${d}`);
    return isValid(date) ? date : null;
  };

  const getFilteredData = (range: TimeRange, custom?: { start: string, end: string }) => {
    if (range === 'lifetime') return allSyncedData;
    const now = new Date();
    const today = startOfDay(now);
    const yesterday = startOfDay(subDays(now, 1));
    let startDate: Date;
    let endDate: Date | null = null;
    switch (range) {
      case 'today': startDate = today; break;
      case 'yesterday': startDate = yesterday; endDate = today; break;
      case 'week': startDate = startOfWeek(now, { weekStartsOn: 1 }); break;
      case 'month': startDate = startOfMonth(now); break;
      case 'year': startDate = startOfYear(now); break;
      case 'custom':
        const start = custom?.start || customStart;
        const end = custom?.end || customEnd;
        if (!start) return allSyncedData;
        startDate = startOfDay(new Date(start));
        if (end) endDate = addDays(startOfDay(new Date(end)), 1);
        break;
      default: startDate = new Date(0);
    }
    return allSyncedData.filter(d => {
      const date = parseDate(d.payment1_date);
      if (!date) return false;
      const dTime = startOfDay(date).getTime();
      if (endDate) return dTime >= startDate.getTime() && dTime < endDate.getTime();
      return dTime >= startDate.getTime();
    });
  };

  const filteredData = useMemo(() => getFilteredData(timeRange), [allSyncedData, timeRange, customStart, customEnd]);
  const admData = useMemo(() => getFilteredData(admRange, admCustom), [allSyncedData, admRange, admCustom, customStart, customEnd]);
  const revData = useMemo(() => getFilteredData(revRange, revCustom), [allSyncedData, revRange, revCustom, customStart, customEnd]);
  const genData = useMemo(() => getFilteredData(genRange, genCustom), [allSyncedData, genRange, genCustom, customStart, customEnd]);
  const chartFiltered = useMemo(() => getFilteredData(chartRange, chartCustom), [allSyncedData, chartRange, chartCustom, customStart, customEnd]);
  const revChartFiltered = useMemo(() => getFilteredData(revChartRange, revChartCustom), [allSyncedData, revChartRange, revChartCustom, customStart, customEnd]);

  const getChartData = (data: RegistrationData[], range: TimeRange) => {
    const dailyMap: Record<string, number> = {};
    const revenueMap: Record<string, number> = {};
    const sorted = [...data].sort((a, b) => {
      const dateA = parseDate(a.payment1_date)?.getTime() || 0;
      const dateB = parseDate(b.payment1_date)?.getTime() || 0;
      return dateA - dateB;
    });
    sorted.forEach(d => {
      const date = parseDate(d.payment1_date);
      if (!date) return;
      const key = format(date, 'dd MMM');
      dailyMap[key] = (dailyMap[key] || 0) + 1;
      let studentTotal = 0;
      for (let i = 1; i <= 10; i++) {
        studentTotal += parseFloat(String((d as any)[`payment${i}_amount`]).replace(/[^0-9.]/g, '')) || 0;
      }
      revenueMap[key] = (revenueMap[key] || 0) + studentTotal;
    });
    const result = Object.keys(dailyMap).map(key => ({
      name: key,
      admissions: dailyMap[key],
      revenue: revenueMap[key]
    }));
    return range === 'lifetime' ? result.slice(-30) : result;
  };

  const admChartData = useMemo(() => getChartData(chartFiltered, chartRange), [chartFiltered, chartRange]);
  const revChartData = useMemo(() => getChartData(revChartFiltered, revChartRange), [revChartFiltered, revChartRange]);

  const getStats = (data: RegistrationData[]) => {
    const total = data.length;
    const genderMap: Record<string, number> = {};
    let revenue = 0;
    data.forEach(d => {
      if (d.status === 'cancelled') return;
      const g = (d.gender || 'Other').trim().toLowerCase();
      genderMap[g] = (genderMap[g] || 0) + 1;
      let studentTotal = 0;
      for (let i = 1; i <= 10; i++) {
        studentTotal += parseFloat(String((d as any)[`payment${i}_amount`]).replace(/[^0-9.]/g, '')) || 0;
      }
      revenue += studentTotal;
    });
    return { total, genderMap, revenue };
  };

  const globalStats = useMemo(() => getStats(filteredData), [filteredData]);
  const admStats = useMemo(() => getStats(admData), [admData]);
  const revStats = useMemo(() => getStats(revData), [revData]);
  const genStats = useMemo(() => getStats(genData), [genData]);

  const MiniFilter = ({ current, onChange, custom, onCustomChange }: { 
    current: TimeRange, 
    onChange: (r: TimeRange) => void,
    custom?: { start: string, end: string },
    onCustomChange?: (c: { start: string, end: string }) => void
  }) => (
    <div className="space-y-2 mt-2">
      <div className="flex flex-wrap gap-1">
        {(['today', 'yesterday', 'week', 'month', 'year', 'lifetime', 'custom'] as TimeRange[]).map(r => (
          <button
            key={r}
            onClick={() => onChange(r)}
            className={`px-1.5 py-0.5 text-[7px] font-black uppercase tracking-tighter rounded-md transition-all ${
              current === r ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      {current === 'custom' && onCustomChange && (
        <div className="flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
          <input 
            type="date" 
            value={custom?.start || ''} 
            onChange={(e) => onCustomChange({ ...custom!, start: e.target.value })}
            className="text-[7px] bg-slate-50 dark:bg-slate-800 border-none rounded p-0.5 text-slate-600 dark:text-slate-300 outline-none"
          />
          <span className="text-[7px] text-slate-400 font-bold">to</span>
          <input 
            type="date" 
            value={custom?.end || ''} 
            onChange={(e) => onCustomChange({ ...custom!, end: e.target.value })}
            className="text-[7px] bg-slate-50 dark:bg-slate-800 border-none rounded p-0.5 text-slate-600 dark:text-slate-300 outline-none"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 pb-10 transition-colors">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 transition-colors">Cloud Insights</h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest transition-colors">
              {error ? <span className="text-red-500">{error}</span> : "Synchronized Google Sheet Analytics"}
            </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-end gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1">
            {(['today', 'yesterday', 'week', 'month', 'year', 'lifetime', 'custom'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
                  timeRange === range 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          {timeRange === 'custom' && (
            <div className="flex items-center gap-2 px-2 animate-in fade-in slide-in-from-top-1">
              <input 
                type="date" 
                value={customStart} 
                onChange={(e) => setCustomStart(e.target.value)}
                className="text-[9px] bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-1 text-slate-600 dark:text-slate-300 outline-none"
              />
              <span className="text-[9px] text-slate-400 font-bold">to</span>
              <input 
                type="date" 
                value={customEnd} 
                onChange={(e) => setCustomEnd(e.target.value)}
                className="text-[9px] bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-1 text-slate-600 dark:text-slate-300 outline-none"
              />
            </div>
          )}
          <div className="w-px h-4 bg-slate-100 dark:bg-slate-800 mx-1 hidden md:block"></div>
          <button onClick={() => setLastRefreshed(Date.now())} disabled={isLoading} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={isLoading ? "animate-spin" : ""}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
          <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 relative transition-colors">Admissions</h3>
          <p className="text-4xl font-black text-slate-900 dark:text-slate-100 relative transition-colors">{admStats.total}</p>
          <MiniFilter current={admRange} onChange={setAdmRange} custom={admCustom} onCustomChange={setAdmCustom} />
          <p className="mt-4 text-green-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 relative">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> {isLoading ? "Syncing..." : "Live Data"}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 transition-colors">Gender Distribution</h3>
          <div className="space-y-3">
            {Object.entries(genStats.genderMap).map(([gender, count]) => {
                const perc = genStats.total > 0 ? Math.round((Number(count) / genStats.total) * 100) : 0;
                return (
                    <div key={gender} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                            <span className="text-slate-500 dark:text-slate-400">{gender}</span>
                            <span className="text-indigo-600 dark:text-indigo-400">{count}</span>
                        </div>
                        <div className="h-1.5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden transition-colors">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${perc}%` }}></div>
                        </div>
                    </div>
                )
            })}
          </div>
          <MiniFilter current={genRange} onChange={setGenRange} custom={genCustom} onCustomChange={setGenCustom} />
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 transition-colors">Total Revenue</h3>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight transition-colors">₹{revStats.revenue.toLocaleString()}</p>
          <MiniFilter current={revRange} onChange={setRevRange} custom={revCustom} onCustomChange={setRevCustom} />
          <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between transition-colors">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Growth Index</span>
            <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Admission Velocity</h3>
            <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase rounded-md">Daily Trend</span>
          </div>
          <MiniFilter current={chartRange} onChange={setChartRange} custom={chartCustom} onCustomChange={setChartCustom} />
          <div className="h-[250px] w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={admChartData}>
                <defs>
                  <linearGradient id="colorAdm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                  cursor={{ stroke: '#4f46e5', strokeWidth: 1 }}
                />
                <Area type="monotone" dataKey="admissions" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorAdm)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Revenue Growth</h3>
            <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase rounded-md">Cash Flow</span>
          </div>
          <MiniFilter current={revChartRange} onChange={setRevChartRange} custom={revChartCustom} onCustomChange={setRevChartCustom} />
          <div className="h-[250px] w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[500px] transition-colors">
          <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20 transition-colors">
              <h3 className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest transition-colors">Master Cloud Records</h3>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow-sm dark:shadow-none transition-colors">{allSyncedData.length} Total</span>
          </div>
          <div className="overflow-x-auto grow">
              <table className="w-full text-left">
                  <thead>
                  <tr className="border-b border-slate-50 dark:border-slate-800/50">
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-wider">Admission ID</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-wider">Student Name</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-wider">City</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-wider">Status</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-wider text-right">Action</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {allSyncedData.map((data, idx) => (
                      <tr key={data.admission_id || idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-8 py-4">
                          <button 
                            onClick={() => setViewingRecord(data)}
                            className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50 active:scale-95 transition-all outline-none"
                          >
                            {data.admission_id || 'N/A'}
                          </button>
                      </td>
                      <td className="px-8 py-4">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight transition-colors">{data.name}</span>
                      </td>
                      <td className="px-8 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-600 uppercase transition-colors">{data.address || '—'}</td>
                      <td className="px-8 py-4">
                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-md ${data.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'}`}>
                            {data.status}
                          </span>
                      </td>
                      <td className="px-8 py-4 text-right">
                          <button onClick={() => setViewingRecord(data)} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white transition-all active:scale-90 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shadow-sm dark:shadow-none transition-colors">
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 dark:bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800">
                {/* Header - Fixed */}
                <div className="p-6 border-b border-slate-50 dark:border-slate-800/50 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <img 
                          src="https://englishhouseacademy.in/wp-content/uploads/2022/03/187-X-43-px-EHA-LOGO-PNG.png" 
                          alt="EHA Logo" 
                          className="h-7 object-contain"
                          referrerPolicy="no-referrer"
                        />
                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">Admission Record</span>
                    </div>
                    <button onClick={() => setViewingRecord(null)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                
                {/* Scrollable Content Container */}
                <div className="max-h-[75vh] overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-slate-900/50">
                  <div ref={modalRef} className="bg-white dark:bg-slate-900 p-10">
                      {/* Branding for Export */}
                      <div className="hidden print:block mb-10 text-center border-b border-slate-100 pb-8">
                        <img 
                          src="https://englishhouseacademy.in/wp-content/uploads/2022/03/187-X-43-px-EHA-LOGO-PNG.png" 
                          alt="EHA Logo" 
                          className="h-12 mx-auto object-contain mb-4"
                          referrerPolicy="no-referrer"
                        />
                        <h1 className="text-2xl font-black uppercase tracking-[0.3em] text-slate-900">Official Admission Record</h1>
                        <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-widest">English House Academy</p>
                      </div>

                      {/* Top Section: Profile & ID */}
                      <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
                        <div>
                          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{viewingRecord.name}</h2>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-md tracking-widest uppercase">{viewingRecord.admission_id}</span>
                            <span className={`px-2 py-1 text-[10px] font-black rounded-md tracking-widest uppercase ${viewingRecord.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {viewingRecord.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right hidden md:block">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Registration Date</p>
                          <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{viewingRecord.payment1_date}</p>
                        </div>
                      </div>

                      {/* Grid Details */}
                      <div className="grid grid-cols-2 gap-x-12 gap-y-2 mb-10">
                        <DetailRow label="Gender" value={viewingRecord.gender} />
                        <DetailRow label="Age" value={viewingRecord.age} />
                        <DetailRow label="Qualification" value={viewingRecord.qualification} />
                        <DetailRow label="Medium" value={viewingRecord.medium} />
                        <DetailRow label="Contact Number" value={viewingRecord.contact_no} />
                        <DetailRow label="WhatsApp Number" value={viewingRecord.whatsapp_no} />
                        <DetailRow label="Address / City" value={viewingRecord.address} fullWidth />
                        <DetailRow label="Account Received In" value={viewingRecord.received_ac} />
                        <DetailRow label="Discount Applied" value={`₹${viewingRecord.discount}`} />
                      </div>
                      
                      {/* Payment History Section */}
                      <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                          Payment Installments
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                            const amt = (viewingRecord as any)[`payment${num}_amount`];
                            if (!amt || amt === '0') return null;
                            return (
                              <div key={num} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div>
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Installment {num}</p>
                                  <p className="text-sm font-black text-slate-900 dark:text-white">₹{amt}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[9px] font-bold text-slate-500">{(viewingRecord as any)[`payment${num}_date`]}</p>
                                  <p className="text-[8px] font-mono text-indigo-500 font-bold">{(viewingRecord as any)[`payment${num}_utr`]}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Footer Summary */}
                      <div className="mt-12 p-8 bg-slate-900 rounded-[32px] flex flex-col md:flex-row justify-between items-center gap-6">
                          <div className="text-center md:text-left">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Pending Balance</p>
                            <p className="text-3xl font-black text-white tracking-tighter">₹{viewingRecord.remaining_amount}</p>
                          </div>
                          <div className="h-10 w-px bg-slate-800 hidden md:block"></div>
                          <div className="text-center md:text-right">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Total Course Fee</p>
                            <p className="text-xl font-black text-indigo-400 tracking-tight">₹20,000</p>
                          </div>
                      </div>
                      
                      {/* Signature Area for Print */}
                      <div className="hidden print:flex justify-between mt-20">
                        <div className="text-center">
                          <div className="w-40 border-b border-slate-300 mb-2"></div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Student Signature</p>
                        </div>
                        <div className="text-center">
                          <div className="w-40 border-b border-slate-300 mb-2"></div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Authorized Signatory</p>
                        </div>
                      </div>
                  </div>
                </div>

                {/* Actions Bar - Fixed Footer */}
                <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-50 dark:border-slate-800 flex flex-col md:flex-row gap-3">
                    <button 
                      onClick={handlePrint}
                      className="flex-1 flex items-center justify-center gap-3 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                      Print Document
                    </button>
                    <button 
                      onClick={handleDownload}
                      className="flex-1 flex items-center justify-center gap-3 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      Download PNG
                    </button>
                    <button 
                      onClick={() => setViewingRecord(null)}
                      className="md:w-16 flex items-center justify-center py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl hover:bg-black transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

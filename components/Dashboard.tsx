
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { ProcessingRecord, RegistrationData, UserRole, AppConfig } from '../types';
import { fetchAllRegistrations } from '../services/sheetService';
import { domToPng } from 'modern-screenshot';
import * as XLSX from 'xlsx';
import { QRCodeSVG } from 'qrcode.react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Cell, PieChart, Pie, AreaChart, Area, LabelList, Legend
} from 'recharts';
import { 
  format, subDays, subMonths, subYears, isAfter, parse, isValid, addDays,
  startOfDay, startOfWeek, startOfMonth, startOfYear, isBefore, endOfDay, isSameDay,
  eachMonthOfInterval, eachYearOfInterval, eachWeekOfInterval, eachDayOfInterval,
  endOfMonth, endOfYear, endOfWeek
} from 'date-fns';
import { Calendar, ChevronDown, X, MapPin, Edit2, ChevronRight, ArrowLeft, Menu, Users, CreditCard, PieChart as PieIcon, Filter, Plus, BarChart3, Zap, Building2, GraduationCap, Languages, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDateClean, parseDate } from '../services/utils';

type TimeRange = 
  | 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'lifetime' | 'custom';

interface DashboardProps {
  records: ProcessingRecord[];
  userRole: UserRole | null;
  config: AppConfig;
  autoViewRecord?: RegistrationData | null;
  onAutoViewClose?: () => void;
  onEdit?: (record: RegistrationData) => void;
  onDelete?: (id: string, admissionId?: string) => void;
  onSeedData?: () => void;
}

const DetailRow = ({ label, value, fullWidth = false }: { label: string, value: string, fullWidth?: boolean }) => (
  <div className={`flex flex-col py-3 border-b border-slate-50 dark:border-slate-800/50 last:border-0 ${fullWidth ? 'col-span-1 sm:col-span-2' : 'col-span-1'}`}>
    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-1">{label}</span>
    <span className="text-[13px] font-bold text-slate-800 dark:text-slate-100 leading-tight">{value || '—'}</span>
  </div>
);

const AnalyticsView = ({ title, data, type, onBack }: { title: string, data: any, type: 'states' | 'cities' | 'admissions', onBack: () => void }) => {
  const sortedData = useMemo(() => {
    return Object.entries(data).sort((a: any, b: any) => b[1].total - a[1].total);
  }, [data]);

  const chartData = useMemo(() => {
    return sortedData.slice(0, 15).map(([name, d]: any) => ({
      name,
      total: d.total,
      paid: d.totalPaid,
      balance: d.balance
    }));
  }, [sortedData]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">In-depth Data Analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Registration Overview</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
              </div>
            </div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  interval={0}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="total" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8">Financial Distribution</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.slice(0, 5)}
                  dataKey="paid"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Top 5 Gender Split</h3>
            <div className="space-y-3">
              {sortedData.slice(0, 5).map(([name, d]: any) => {
                const total = d.male + d.female;
                const mPerc = total > 0 ? (d.male / total) * 100 : 0;
                const fPerc = total > 0 ? (d.female / total) * 100 : 0;
                return (
                  <div key={name} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-600 dark:text-slate-400">{name}</span>
                      <span className="text-slate-400">M: {d.male} | F: {d.female}</span>
                    </div>
                    <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <div className="bg-blue-500 h-full" style={{ width: `${mPerc}%` }}></div>
                      <div className="bg-pink-500 h-full" style={{ width: `${fPerc}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Total Revenue</span>
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">₹{chartData.reduce((acc: number, curr: any) => acc + curr.paid, 0).toLocaleString()}</span>
            </div>
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50">
              <span className="text-[10px] font-black text-red-600 uppercase tracking-widest block mb-1">Pending Balance</span>
              <span className="text-xl font-black text-red-700 dark:text-red-300">₹{chartData.reduce((acc: number, curr: any) => acc + curr.balance, 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Detailed Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{type === 'admissions' ? 'Month' : type === 'states' ? 'State' : 'City'}</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Students</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Male</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Female</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedData.map(([name, d]: any) => (
                  <tr key={name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">{name}</td>
                    <td className="px-8 py-4 text-sm font-black text-slate-600 dark:text-slate-400 text-center">{d.total}</td>
                    <td className="px-8 py-4 text-sm font-bold text-blue-600 text-center">{d.male}</td>
                    <td className="px-8 py-4 text-sm font-bold text-pink-600 text-center">{d.female}</td>
                    <td className="px-8 py-4 text-sm font-black text-emerald-600 text-right">₹{d.totalPaid.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {type !== 'admissions' && (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8">Age Demographics</h3>
            <div className="space-y-6">
              {sortedData.slice(0, 3).map(([name, d]: any) => {
                const ageData = Object.entries(d.ages || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);
                return (
                  <div key={name} className="space-y-3">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{name}</span>
                    <div className="space-y-2">
                      {ageData.map(([age, count]: any) => (
                        <div key={age} className="flex items-center gap-3">
                          <span className="text-[9px] font-bold text-slate-400 w-8">{age}</span>
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full" style={{ width: `${(count / d.total) * 100}%` }}></div>
                          </div>
                          <span className="text-[9px] font-black text-slate-600 dark:text-slate-400">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const CallerTrackingView = ({ data, onBack }: { data: RegistrationData[], onBack: () => void }) => {
  const [batchSize] = useState(100);
  const [selectedBatchIndex, setSelectedBatchIndex] = useState(0);

  const batches = useMemo(() => {
    const b = [];
    for (let i = 0; i < data.length; i += batchSize) {
      b.push(data.slice(i, i + batchSize));
    }
    return b;
  }, [data, batchSize]);

  const currentBatch = batches[selectedBatchIndex] || [];
  
  const stats = useMemo(() => {
    let paid = 0;
    let later = 0;
    let cancelled = 0;
    let pending = 0;

    currentBatch.forEach(d => {
      const status = (d.status || '').toLowerCase();
      const ps = (d.payment_status || '').toLowerCase();
      const notes = (d.notes || '').toLowerCase();

      if (ps === 'full paid') {
        paid++;
      } else if (status === 'cancelled') {
        cancelled++;
      } else if (notes.includes('later') || notes.includes('baad mein') || notes.includes('will pay') || notes.includes('call back')) {
        later++;
      } else if (status === 'pending' || notes.includes('no response') || notes.includes('pending') || notes.includes('not picking') || notes.includes('switch off')) {
        pending++;
      }
    });

    return { paid, later, cancelled, pending, total: currentBatch.length };
  }, [currentBatch]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Caller Tracking Insights</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Follow-up Progress by Batch</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Select Batch (Group of 100)</h3>
        <div className="flex flex-wrap gap-3">
          {batches.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedBatchIndex(idx)}
              className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border flex flex-col items-center gap-1 ${
                selectedBatchIndex === idx 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-none' 
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>Batch {idx + 1}</span>
              <span className={`text-[8px] opacity-60 ${selectedBatchIndex === idx ? 'text-white' : 'text-slate-400'}`}>
                {idx * batchSize + 1} - {Math.min((idx + 1) * batchSize, data.length)}
              </span>
            </button>
          ))}
          {batches.length === 0 && (
            <div className="p-8 text-center w-full border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No data available for batching</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center gap-2 mb-4 relative">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Payment</span>
          </div>
          <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter relative leading-none">{stats.paid}</p>
          <p className="mt-4 text-[9px] font-bold text-emerald-600 uppercase tracking-widest relative bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded inline-block">
            {stats.total > 0 ? ((stats.paid / stats.total) * 100).toFixed(1) : 0}% of Batch
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center gap-2 mb-4 relative">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pay Later</span>
          </div>
          <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter relative leading-none">{stats.later}</p>
          <p className="mt-4 text-[9px] font-bold text-blue-600 uppercase tracking-widest relative bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded inline-block">
            {stats.total > 0 ? ((stats.later / stats.total) * 100).toFixed(1) : 0}% of Batch
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 dark:bg-red-900/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center gap-2 mb-4 relative">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancelled</span>
          </div>
          <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter relative leading-none">{stats.cancelled}</p>
          <p className="mt-4 text-[9px] font-bold text-red-600 uppercase tracking-widest relative bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded inline-block">
            {stats.total > 0 ? ((stats.cancelled / stats.total) * 100).toFixed(1) : 0}% of Batch
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 dark:bg-amber-900/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center gap-2 mb-4 relative">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Response</span>
          </div>
          <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter relative leading-none">{stats.pending}</p>
          <p className="mt-4 text-[9px] font-bold text-amber-600 uppercase tracking-widest relative bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded inline-block">
            {stats.total > 0 ? ((stats.pending / stats.total) * 100).toFixed(1) : 0}% of Batch
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Batch {selectedBatchIndex + 1} Visual Breakdown</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Count</span>
              </div>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Paid', value: stats.paid, fill: '#10b981' },
                { name: 'Later', value: stats.later, fill: '#3b82f6' },
                { name: 'Cancelled', value: stats.cancelled, fill: '#ef4444' },
                { name: 'Pending', value: stats.pending, fill: '#f59e0b' },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={80}>
                  <LabelList dataKey="value" position="top" style={{ fontSize: 14, fontWeight: 900, fill: '#1e293b' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8">Summary</h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Students</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">{stats.total}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Response Rate</span>
              <span className="text-xl font-black text-indigo-700 dark:text-indigo-300">
                {stats.total > 0 ? (((stats.paid + stats.later + stats.cancelled) / stats.total) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 mt-4">
              <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic">
                * This analysis is based on batches of 100 students as they appear in the records. 
                "Pay Later" and "No Response" statuses are inferred from notes and registration status.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const CustomAnalyticsView = ({ records, onBack, onSeedData, onRefresh, isRefreshing, onOpenMasterView }: { records: RegistrationData[], onBack: () => void, onSeedData?: () => void, onRefresh: () => void, isRefreshing: boolean, onOpenMasterView: () => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeDimension, setActiveDimension] = useState<'state' | 'city' | 'gender' | 'ageRange' | 'paymentStatus' | 'status' | 'qualification' | 'medium'>('state');
  const [filters, setFilters] = useState({
    state: 'All',
    city: 'All',
    gender: 'All',
    ageRange: 'All',
    ageMin: '',
    ageMax: '',
    paymentStatus: 'All',
    status: 'All',
    qualification: 'All',
    medium: 'All'
  });

  const dimensionCategories = [
    {
      label: 'Geographic',
      dimensions: [
        { id: 'state', label: 'State', icon: MapPin },
        { id: 'city', label: 'City', icon: Building2 },
      ]
    },
    {
      label: 'Demographics',
      dimensions: [
        { id: 'gender', label: 'Gender', icon: Users },
        { id: 'ageRange', label: 'Age Group', icon: Calendar },
        { id: 'qualification', label: 'Qualification', icon: GraduationCap },
        { id: 'medium', label: 'Medium', icon: Languages },
      ]
    },
    {
      label: 'Financials & Status',
      dimensions: [
        { id: 'paymentStatus', label: 'Payment', icon: CreditCard },
        { id: 'status', label: 'Status', icon: Filter },
      ]
    }
  ];

  const dimensions = dimensionCategories.flatMap(c => c.dimensions);

  const dimensionOptions = useMemo(() => {
    const options: Record<string, string[]> = {
      gender: ['All', 'Male', 'Female', 'Other'],
      ageRange: ['All', 'Under 13', '13-18', '19-25', 'Above 25', 'Custom'],
      paymentStatus: ['All', 'Full Paid', 'Partial', 'Unpaid', 'Refund', 'Discount', 'Free'],
      status: ['All', 'Confirm', 'Pending', 'Cancelled', 'Stay Only'],
      qualification: ['All'],
      medium: ['All'],
    };

    const s = new Set<string>();
    const c = new Set<string>();
    const q = new Set<string>();
    const m = new Set<string>();
    let hasMissingState = false;
    let hasMissingCity = false;

    if (records) {
      records.forEach(d => {
        const state = d.state?.trim();
        if (state) s.add(state);
        else hasMissingState = true;

        const city = d.city?.trim();
        if (city) c.add(city);
        else hasMissingCity = true;

        const qualification = d.qualification?.trim();
        if (qualification) q.add(qualification);

        const medium = d.medium?.trim();
        if (medium) m.add(medium);
      });
    }

    options.state = ['All', ...Array.from(s).sort()];
    if (hasMissingState) options.state.push('Not Specified');
    
    options.city = ['All', ...Array.from(c).sort()];
    if (hasMissingCity) options.city.push('Not Specified');

    options.qualification = ['All', ...Array.from(q).sort()];
    options.medium = ['All', ...Array.from(m).sort()];

    return options;
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(d => {
      if (filters.state !== 'All') {
        const state = d.state?.trim() || 'Not Specified';
        if (state !== filters.state) return false;
      }
      
      if (filters.city !== 'All') {
        const city = d.city?.trim() || 'Not Specified';
        if (city !== filters.city) return false;
      }

      if (filters.gender !== 'All' && d.gender?.toLowerCase() !== filters.gender.toLowerCase()) return false;
      
      if (filters.ageRange !== 'All') {
        const age = parseInt(d.age) || 0;
        if (filters.ageRange === 'Under 13' && age >= 13) return false;
        if (filters.ageRange === '13-18' && (age < 13 || age > 18)) return false;
        if (filters.ageRange === '19-25' && (age < 19 || age > 25)) return false;
        if (filters.ageRange === 'Above 25' && age <= 25) return false;
        if (filters.ageRange === 'Custom') {
          const min = parseInt(filters.ageMin);
          const max = parseInt(filters.ageMax);
          if (!isNaN(min) && age < min) return false;
          if (!isNaN(max) && age > max) return false;
        }
      }

      if (filters.qualification !== 'All' && d.qualification?.toLowerCase() !== filters.qualification.toLowerCase()) return false;
      if (filters.medium !== 'All' && d.medium?.toLowerCase() !== filters.medium.toLowerCase()) return false;
      
      if (filters.paymentStatus !== 'All') {
        const ps = (d.payment_status || '').toLowerCase();
        const discountVal = parseFloat(String(d.discount || '0').replace(/[^0-9.]/g, '')) || 0;
        const freeVal = parseFloat(String(d.free || '0').replace(/[^0-9.]/g, '')) || 0;
        const totalFeesVal = parseFloat(String(d.total_fees || '20000').replace(/[^0-9.]/g, '')) || 20000;
        const remainingVal = parseFloat(String(d.remaining_amount || '0').replace(/[^0-9.]/g, '')) || 0;
        const status = (d.status || 'confirm').toLowerCase();

        let studentTotal = 0;
        for (let i = 1; i <= 10; i++) {
          studentTotal += parseFloat(String((d as any)[`payment${i}_amount`]).replace(/[^0-9.]/g, '')) || 0;
        }
        const target = totalFeesVal - discountVal - freeVal;

        const isActuallyFullyPaid = ps.includes('full') || remainingVal <= 0 || (studentTotal >= target && target > 0);
        const isActuallyFree = ps === 'free' || freeVal > 0 || (totalFeesVal === 0 && status !== 'cancelled');
        const isActuallyDiscount = ps === 'discount' || discountVal > 0;
        const isActuallyRefund = ps === 'refund';

        if (filters.paymentStatus === 'Refund') return isActuallyRefund;
        if (filters.paymentStatus === 'Free') return isActuallyFree;
        if (filters.paymentStatus === 'Discount') return isActuallyDiscount;
        if (filters.paymentStatus === 'Full Paid') return isActuallyFullyPaid && !isActuallyFree;
        
        if (isActuallyFree || isActuallyFullyPaid || isActuallyRefund) return false;

        if (filters.paymentStatus === 'Partial') return studentTotal > 0;
        if (filters.paymentStatus === 'Unpaid') return studentTotal === 0;
        return false;
      }

      if (filters.status !== 'All' && d.status?.toLowerCase() !== filters.status.toLowerCase()) return false;

      return true;
    });
  }, [records, filters]);

  const distributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRecords.forEach(d => {
      let val = '';
      if (activeDimension === 'state') val = d.state || 'Unknown';
      else if (activeDimension === 'city') val = d.city || 'Unknown';
      else if (activeDimension === 'gender') val = d.gender || 'Unknown';
      else if (activeDimension === 'status') val = d.status || 'Unknown';
      else if (activeDimension === 'qualification') val = d.qualification || 'Unknown';
      else if (activeDimension === 'medium') val = d.medium || 'Unknown';
      else if (activeDimension === 'ageRange') {
        const age = parseInt(d.age) || 0;
        if (age < 13) val = 'Under 13';
        else if (age <= 18) val = '13-18';
        else if (age <= 25) val = '19-25';
        else val = 'Above 25';
      } else if (activeDimension === 'paymentStatus') {
        const ps = (d.payment_status || '').toLowerCase();
        const discountVal = parseFloat(String(d.discount || '0')) || 0;
        const freeVal = parseFloat(String(d.free || '0')) || 0;
        const totalFeesVal = parseFloat(String(d.total_fees || '20000').replace(/[^0-9.]/g, '')) || 20000;
        const remaining = parseFloat(String(d.remaining_amount || '0').replace(/[^0-9.]/g, '')) || 0;

        if (ps === 'refund') {
          val = 'Refund';
        } else if (ps === 'free' || freeVal > 0 || (totalFeesVal === 0 && d.status !== 'cancelled')) {
          val = 'Free';
        } else if (ps === 'discount' || discountVal > 0) {
          val = 'Discount';
        } else if (remaining <= 0) {
          val = 'Full Paid';
        } else if (remaining < totalFeesVal) {
          val = 'Partial';
        } else {
          val = 'Unpaid';
        }
      }
      counts[val] = (counts[val] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRecords, activeDimension]);

  const stats = useMemo(() => {
    let totalFees = 0;
    let totalPaid = 0;
    let totalDiscount = 0;
    filteredRecords.forEach(d => {
      totalFees += parseFloat(d.total_fees) || 0;
      totalDiscount += parseFloat(d.discount) || 0;
      totalPaid += (parseFloat(d.total_fees) || 0) - (parseFloat(d.remaining_amount) || 0);
    });
    return { totalFees, totalPaid, totalDiscount, count: filteredRecords.length };
  }, [filteredRecords]);

  const handleDownloadReport = async () => {
    if (!containerRef.current) return;
    try {
      const dataUrl = await domToPng(containerRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        quality: 1,
      });
      const link = document.createElement('a');
      link.download = `EHA-Explorer-Report-${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Report download failed:', err);
    }
  };

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20 bg-white dark:bg-slate-950 p-8 rounded-[48px]"
    >
      {/* EDITORIAL HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-8">
        <div className="flex items-start gap-6">
          <button 
            onClick={onBack}
            className="mt-1 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400 group no-print"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h2 className="text-6xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-4">
              Explorer<span className="text-indigo-600">.</span>
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-8 h-px bg-slate-200 dark:bg-slate-700"></span>
              Multi-dimensional Data Analysis
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 no-print">
           <div className="text-right hidden sm:block">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Records</p>
             <p className="text-2xl font-black text-slate-900 dark:text-white">{records.length}</p>
           </div>
           <div className="w-px h-10 bg-slate-100 dark:bg-slate-800 hidden sm:block"></div>
           <button 
             onClick={onRefresh}
             disabled={isRefreshing}
             className={`px-6 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={isRefreshing ? 'animate-spin' : ''}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
             {isRefreshing ? 'Syncing...' : 'Refresh Data'}
           </button>
           <button 
             onClick={onOpenMasterView}
             className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center gap-2"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
             Master View
           </button>
           <button 
             onClick={() => window.print()}
             className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
             Print
           </button>
           <button 
             onClick={() => setFilters({ state: 'All', city: 'All', gender: 'All', ageRange: 'All', ageMin: '', ageMax: '', paymentStatus: 'All', status: 'All', qualification: 'All', medium: 'All' })}
             className="px-6 py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
           >
             Clear All
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: DIMENSIONS & FILTERS */}
        <div className="lg:col-span-3 space-y-8">
          <div className="space-y-6">
            {dimensionCategories.map((category) => (
              <div key={category.label} className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{category.label}</h3>
                <div className="flex flex-col gap-2">
                  {category.dimensions.map((dim) => (
                    <button
                      key={dim.id}
                      onClick={() => setActiveDimension(dim.id as any)}
                      className={`flex items-center justify-between px-6 py-4 rounded-[24px] transition-all border font-black uppercase tracking-widest text-[10px] group ${
                        activeDimension === dim.id 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl shadow-indigo-200 dark:shadow-none translate-x-2' 
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 hover:border-indigo-200 hover:text-indigo-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <dim.icon className={`w-4 h-4 ${activeDimension === dim.id ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                        {dim.label}
                      </div>
                      {activeDimension === dim.id && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Active Filters</h4>
            <div className="space-y-3">
              {Object.entries(filters).map(([key, val]) => val !== 'All' && (
                <div key={key} className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 group">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-indigo-600 uppercase mb-1">{key}</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{val}</span>
                  </div>
                  <button 
                    onClick={() => setFilters(f => ({ ...f, [key]: 'All' }))} 
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </div>
              ))}
              {Object.values(filters).every(v => v === 'All') && (
                <div className="py-10 text-center">
                  <Filter className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                  <p className="text-[10px] font-bold text-slate-400 italic">No active filters</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: VISUALIZATION & DATA */}
        <div className="lg:col-span-9 space-y-8">
          {/* VALUE SELECTOR */}
          <div className="bg-white dark:bg-slate-900 p-2 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar">
            <div className="px-6 py-4 border-r border-slate-50 dark:border-slate-800 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                <Filter className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{activeDimension}</span>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2">
              {dimensionOptions[activeDimension]?.length > 0 ? (
                <>
                  {dimensionOptions[activeDimension].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setFilters(f => ({ ...f, [activeDimension]: opt }))}
                      className={`px-6 py-3 rounded-2xl transition-all whitespace-nowrap border font-black uppercase tracking-widest text-[10px] ${
                        filters[activeDimension as keyof typeof filters] === opt 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 dark:shadow-none' 
                          : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-500 hover:border-slate-200'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                  {activeDimension === 'ageRange' && filters.ageRange === 'Custom' && (
                    <div className="flex items-center gap-2 ml-4 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <input 
                        type="number" 
                        placeholder="Min Age"
                        value={filters.ageMin}
                        onChange={(e) => setFilters(f => ({ ...f, ageMin: e.target.value }))}
                        className="w-20 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm dark:text-slate-100 dark:placeholder-slate-600"
                      />
                      <span className="text-[10px] font-black text-slate-400">TO</span>
                      <input 
                        type="number" 
                        placeholder="Max Age"
                        value={filters.ageMax}
                        onChange={(e) => setFilters(f => ({ ...f, ageMax: e.target.value }))}
                        className="w-20 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm dark:text-slate-100 dark:placeholder-slate-600"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-6 py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No {activeDimension} data found</span>
                  </div>
                </div>
              )}
              {dimensionOptions[activeDimension]?.length === 1 && onSeedData && (
                <button 
                  onClick={onSeedData}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center gap-2 ml-4"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                  Load Sample Data
                </button>
              )}
            </div>
          </div>

          {/* FINANCIAL SUMMARY */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-indigo-500 transition-all">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Average Fee</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">₹{Math.round(stats.totalFees / (stats.count || 1)).toLocaleString()}</p>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                <Zap className="w-3 h-3" />
                Per Student
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-emerald-500 transition-all">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Discount</p>
              <p className="text-3xl font-black text-emerald-600 tracking-tight">₹{stats.totalDiscount.toLocaleString()}</p>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                <Plus className="w-3 h-3" />
                Free
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-violet-500 transition-all">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Collection Efficiency</p>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {Math.round((stats.totalPaid / (stats.totalFees || 1)) * 100)}%
                </p>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-2 overflow-hidden">
                  <div 
                    className="h-full bg-violet-600 rounded-full transition-all duration-1000" 
                    style={{ width: `${(stats.totalPaid / (stats.totalFees || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* STATS & CHART GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
              
              <div className="flex justify-between items-center mb-10 relative z-10">
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Distribution</h3>
                  <p className="text-2xl font-black text-slate-900 dark:text-white capitalize">{activeDimension.replace(/([A-Z])/g, ' $1')}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-full border border-indigo-100 dark:border-indigo-800">
                    {stats.count} Records Found
                  </span>
                  <div className="flex items-center gap-2 text-[9px] font-bold text-green-500 uppercase tracking-widest">
                    <div className="w-1 h-1 rounded-full bg-green-500 animate-ping"></div>
                    Real-time Analysis
                  </div>
                </div>
              </div>

              <div className="h-[350px] relative z-10">
                {distributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData.slice(0, 15)} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px' }}
                        cursor={{ fill: '#f8fafc' }}
                      />
                      <Bar dataKey="count" radius={[12, 12, 0, 0]} barSize={40}>
                        {distributionData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.name === filters[activeDimension as keyof typeof filters] ? '#4f46e5' : '#e2e8f0'} 
                            fillOpacity={entry.name === filters[activeDimension as keyof typeof filters] ? 1 : 0.5}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-200">
                    <BarChart3 className="w-16 h-16 mb-4 opacity-10" />
                    <p className="text-sm font-black uppercase tracking-widest opacity-30">No Visualization Data</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-indigo-600 p-10 rounded-[48px] text-white shadow-2xl shadow-indigo-200 dark:shadow-none relative overflow-hidden group">
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Filtered Results</span>
                    <h4 className="text-7xl font-black mt-4 tracking-tighter">{stats.count}</h4>
                  </div>
                  <div className="flex flex-col gap-2 no-print">
                    <button 
                      onClick={onOpenMasterView}
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white"
                      title="Master View"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white"
                      title="Print"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                    </button>
                  </div>
                </div>
                <p className="text-xs font-bold opacity-60 mt-1 uppercase tracking-widest">Students Matched</p>
                
                <div className="mt-10 pt-10 border-t border-white/10 space-y-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-50 block mb-1">Total Revenue</span>
                      <span className="text-2xl font-black text-emerald-300 tracking-tight">₹{stats.totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-50 block mb-1">Balance</span>
                      <span className="text-2xl font-black text-orange-300 tracking-tight">₹{(stats.totalFees - stats.totalPaid).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats.totalPaid / (stats.totalFees || 1)) * 100}%` }}
                      className="h-full bg-emerald-400 rounded-full"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Summary</h4>
                  <Zap className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Avg Fee</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">₹{Math.round(stats.totalFees / (stats.count || 1)).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Discount</p>
                      <p className="text-sm font-black text-rose-500">₹{stats.totalDiscount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase">Collection Efficiency</p>
                      <p className="text-sm font-black text-emerald-600">{Math.round((stats.totalPaid / (stats.totalFees || 1)) * 100)}%</p>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${(stats.totalPaid / (stats.totalFees || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DATA TABLE */}
          <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-10 py-8 border-b border-slate-50 dark:border-slate-800/50 flex justify-between items-center">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Records</h3>
                <p className="text-xl font-black text-slate-900 dark:text-white">Matching Students</p>
              </div>
              <div className="flex items-center gap-4 no-print">
                <button 
                  onClick={onOpenMasterView}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  Master View
                </button>
                <button 
                  onClick={() => window.print()}
                  className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                  Print
                </button>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-full">
                  Page 1 of {Math.ceil(filteredRecords.length / 50)}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50 dark:border-slate-800/50">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Profile</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Demographics</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Financials</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {filteredRecords.slice(0, 50).map(d => {
                    const remaining = parseFloat(d.remaining_amount) || 0;
                    return (
                      <tr key={d.admission_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              {d.name.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-900 dark:text-white">{d.name}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d.admission_id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{d.city}</span>
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{d.state}</span>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-500 uppercase bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg">{d.gender}</span>
                            <span className="text-[10px] font-black text-slate-500 uppercase bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg">{d.age}Y</span>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">₹{(parseFloat(d.total_fees) - remaining).toLocaleString()}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <div className={`w-1.5 h-1.5 rounded-full ${remaining > 0 ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{remaining > 0 ? `₹${remaining.toLocaleString()} Left` : 'Paid'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                            d.status === 'confirm' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                            d.status === 'pending' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
                            'bg-rose-50 text-rose-600 border border-rose-100'
                          }`}>
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredRecords.length === 0 && (
                <div className="flex flex-col items-center justify-center py-40 text-slate-300">
                  <div className="w-32 h-32 bg-slate-50 dark:bg-slate-800/50 rounded-[40px] flex items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 bg-indigo-500/5 rounded-[40px] animate-pulse"></div>
                    <Filter className="w-12 h-12 opacity-20" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">No Matches Found</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] opacity-50">Try adjusting your filters or search query</p>
                  <button 
                    onClick={() => setFilters({ state: 'All', city: 'All', gender: 'All', ageRange: 'All', ageMin: '', ageMax: '', paymentStatus: 'All', status: 'All', qualification: 'All', medium: 'All' })}
                    className="mt-8 px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SidebarStat = ({ label, value, subValue, icon: Icon, color, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all ${onClick ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800' : ''}`}
  >
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</span>
        <span className="text-sm font-black text-slate-800 dark:text-slate-100 leading-none">{value}</span>
      </div>
    </div>
    {subValue && (
      <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">
        {subValue}
      </span>
    )}
  </div>
);

const numberToWords = (num: number): string => {
  if (num === 0) return "ZERO";
  const singleDigits = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teenDigits = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const doubleDigits = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const convertToWords = (n: number): string => {
    let res = "";
    if (n >= 100) {
      res += singleDigits[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      res += doubleDigits[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n >= 10) {
      res += teenDigits[n - 10] + " ";
      n = 0;
    }
    if (n > 0) {
      res += singleDigits[n] + " ";
    }
    return res;
  };

  let result = "";
  let crores = Math.floor(num / 10000000);
  num %= 10000000;
  let lakhs = Math.floor(num / 100000);
  num %= 100000;
  let thousands = Math.floor(num / 1000);
  num %= 1000;
  let remaining = num;

  if (crores > 0) result += convertToWords(crores) + "Crore ";
  if (lakhs > 0) result += convertToWords(lakhs) + "Lakh ";
  if (thousands > 0) result += convertToWords(thousands) + "Thousand ";
  if (remaining > 0) result += convertToWords(remaining);

  return result.trim().toUpperCase();
};

export const Dashboard: React.FC<DashboardProps> = ({ records, userRole, config, autoViewRecord, onAutoViewClose, onEdit, onDelete, onSeedData }) => {
  const [remoteData, setRemoteData] = useState<RegistrationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<number>(Date.now());
  const [viewingRecord, setViewingRecord] = useState<RegistrationData | null>(null);
  const [scannerResult, setScannerResult] = useState<RegistrationData | null>(null);
  const [viewingStudentForm, setViewingStudentForm] = useState<RegistrationData | null>(null);
  const [isMasterViewOpen, setIsMasterViewOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'states' | 'cities' | 'admissions'>('dashboard');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const studentFormRef = useRef<HTMLDivElement>(null);
  const masterViewRef = useRef<HTMLDivElement>(null);

  const [isTimeRangeMenuOpen, setIsTimeRangeMenuOpen] = useState(false);
  const timeRangeMenuRef = useRef<HTMLDivElement>(null);
  const [genderViewType, setGenderViewType] = useState<'confirm' | 'total'>('confirm');

  const TIME_RANGE_OPTIONS = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
    { id: 'lifetime', label: 'Day' },
    { divider: true },
    { id: 'custom', label: 'Custom' },
  ];
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState('');
  const [masterViewSearchQuery, setMasterViewSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const handleDownload = async () => {
    if (!modalRef.current) return;
    try {
      // Temporarily remove max-height and overflow to capture full content
      const originalStyle = modalRef.current.style.cssText;
      modalRef.current.style.maxHeight = 'none';
      modalRef.current.style.overflow = 'visible';
      
      const dataUrl = await domToPng(modalRef.current, {
        backgroundColor: '#ffffff',
        scale: 3, // Higher scale for better quality
        quality: 1,
      });
      
      modalRef.current.style.cssText = originalStyle;

      const link = document.createElement('a');
      link.download = `EHA-Admission-${viewingRecord?.admission_id || 'record'}.png`;
      link.href = dataUrl;
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

  const handleMasterDownload = async () => {
    if (!masterViewRef.current) return;
    try {
      const dataUrl = await domToPng(masterViewRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        quality: 1,
      });
      const link = document.createElement('a');
      link.download = `EHA-Master-Cloud-Records-${format(new Date(), 'dd-MM-yyyy')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Master download failed:', err);
    }
  };

  const handleMasterExcelDownload = () => {
    try {
      const dataToExport = sortedMasterData.map((record: RegistrationData) => {
        // Calculate total paid
        let totalPaid = 0;
        for (let i = 1; i <= 10; i++) {
          const amt = parseFloat((record as any)[`payment${i}_amount`]);
          if (!isNaN(amt)) totalPaid += amt;
        }

        return {
          'Admission ID': record.admission_id,
          'Student Name': record.name,
          'Admission Date': record.payment1_date,
          'Contact No': record.contact_no,
          'WhatsApp No': record.whatsapp_no,
          'City': record.city,
          'State': record.state,
          'Age': record.age,
          'Gender': record.gender,
          'Total Fees': record.total_fees,
          'Discount': record.discount || '0',
          'Free': record.free || '0',
          'Paid Amount': totalPaid,
          'Remaining': record.remaining_amount,
          'Admission Status': record.status,
          'Payment Status': record.payment_status || 'N/A',
          'Arrival Status': record.arrival_status || 'not_arrived',
          'Refund Date': record.refund_date || '-',
          'Notes': record.notes || '-'
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Admissions");
      
      // Generate filename with current date
      const fileName = `Master_Records_${format(new Date(), 'dd_MM_yyyy')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (err) {
      console.error('Excel download failed:', err);
    }
  };

  const handleMasterPrint = () => {
    if (!masterViewRef.current) return;
    const printContent = masterViewRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Master Cloud Records - ${format(new Date(), 'dd-MM-yyyy')}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; }
            @media print {
              body { padding: 0; margin: 0; }
              .no-print { display: none; }
              @page { margin: 1cm; size: landscape; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 10px; }
              th { background-color: #f8fafc; }
            }
          </style>
        </head>
        <body class="bg-white">
          <div class="p-8">
              <h1 class="text-xl font-black uppercase tracking-widest mb-6">Master Cloud Records</h1>
              <p class="text-[10px] font-bold text-slate-500 mb-8 uppercase tracking-widest">Generated on: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}</p>
              <style>
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 10px; }
                th { background-color: #f8fafc; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; }
              </style>
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

  const handleStudentFormDownload = async () => {
    if (!studentFormRef.current) return;
    try {
      const dataUrl = await domToPng(studentFormRef.current, {
        backgroundColor: '#ffffff',
        scale: 3,
        quality: 1,
      });
      const link = document.createElement('a');
      link.download = `Student-Form-${viewingStudentForm?.admission_id || 'record'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleStudentFormPrint = () => {
    if (!studentFormRef.current) return;
    const printContent = studentFormRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Student Form - ${viewingStudentForm?.admission_id}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { padding: 0; margin: 0; }
              .no-print { display: none; }
              @page { margin: 1cm; }
            }
            .qr-code svg { width: 100% !important; height: 100% !important; }
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

  const generateQRData = (data: RegistrationData) => {
    return `EHA ADMISSION RECORD
ID: ${data.admission_id}
Name: ${data.name}
Contact: ${data.contact_no}
City: ${data.city}
Status: ${data.status}
Payment: ${data.payment_status}
Arrival: ${data.arrival_status || 'not_arrived'}`;
  };

  const handleDownloadQR = async () => {
    const qrElement = document.getElementById('student-qr-code-container');
    if (!qrElement) return;
    
    try {
      const dataUrl = await domToPng(qrElement, {
        backgroundColor: '#ffffff',
        scale: 5,
      });
      const link = document.createElement('a');
      link.download = `QR-${viewingRecord?.admission_id || 'student'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('QR Download failed:', err);
    }
  };

  const normalizeData = (rawItems: any[]): RegistrationData[] => {
    return rawItems.map(item => {
      const row: any = {};
      Object.keys(item).forEach(k => {
        row[k.toLowerCase().trim()] = item[k];
      });

      const getVal = (keys: string[]) => {
        // First pass: look for keys that are NOT 'timestamp'
        for (const k of keys) {
          if (k === 'timestamp') continue;
          if (row[k] !== undefined && row[k] !== null && row[k] !== '') return String(row[k]);
        }
        // Second pass: look for 'timestamp'
        if (row['timestamp'] !== undefined && row['timestamp'] !== null && row['timestamp'] !== '') return String(row['timestamp']);
        return '';
      };

      return {
        admission_id: String(row['admission id'] || row['admission_id'] || row['id'] || ''),
        name: String(row['name'] || row['student name'] || ''),
        gender: String(row['gender'] || ''),
        age: String(row['age'] || ''),
        qualification: String(row['qualification'] || ''),
        medium: String(row['medium'] || ''),
        contact_no: String(row['contact no'] || row['contact_no'] || ''),
        whatsapp_no: String(row['whatsapp no'] || row['whatsapp_no'] || ''),
        city: String(row['city'] || row['address'] || ''),
        state: String(row['state'] || ''),
        payment1_amount: String(row['payment1'] || row['payment1_amount'] || row['payment 1 amount'] || row['initial payment'] || row['initial_payment'] || '0'),
        payment1_date: formatDateClean(getVal(['payment1_date', 'payment 1 date', 'date', 'registration date', 'reg date', 'admission date', 'timestamp'])),
        payment1_utr: String(row['payment1_utr'] || row['payment 1 utr'] || row['utr'] || ''),
        payment2_amount: String(row['payment2_amount'] || row['payment 2 amount'] || '0'),
        payment2_date: formatDateClean(getVal(['payment2_date', 'payment 2 date'])),
        payment2_utr: String(row['payment2_utr'] || row['payment 2 utr'] || ''),
        payment3_amount: String(row['payment3_amount'] || row['payment 3 amount'] || '0'),
        payment3_date: formatDateClean(getVal(['payment3_date', 'payment 3 date'])),
        payment3_utr: String(row['payment3_utr'] || row['payment 3 utr'] || ''),
        payment4_amount: String(row['payment4_amount'] || row['payment 4 amount'] || '0'),
        payment4_date: formatDateClean(getVal(['payment4_date', 'payment 4 date'])),
        payment4_utr: String(row['payment4_utr'] || row['payment 4 utr'] || ''),
        payment5_amount: String(row['payment5_amount'] || row['payment 5 amount'] || '0'),
        payment5_date: formatDateClean(getVal(['payment5_date', 'payment 5 date'])),
        payment5_utr: String(row['payment5_utr'] || row['payment 5 utr'] || ''),
        payment6_amount: String(row['payment6_amount'] || row['payment 6 amount'] || '0'),
        payment6_date: formatDateClean(getVal(['payment6_date', 'payment 6 date'])),
        payment6_utr: String(row['payment6_utr'] || row['payment 6 utr'] || ''),
        payment7_amount: String(row['payment7_amount'] || row['payment 7 amount'] || '0'),
        payment7_date: formatDateClean(getVal(['payment7_date', 'payment 7 date'])),
        payment7_utr: String(row['payment7_utr'] || row['payment 7 utr'] || ''),
        payment8_amount: String(row['payment8_amount'] || row['payment 8 amount'] || '0'),
        payment8_date: formatDateClean(getVal(['payment8_date', 'payment 8 date'])),
        payment8_utr: String(row['payment8_utr'] || row['payment 8 utr'] || ''),
        payment9_amount: String(row['payment9_amount'] || row['payment 9 amount'] || '0'),
        payment9_date: formatDateClean(getVal(['payment9_date', 'payment 9 date'])),
        payment9_utr: String(row['payment9_utr'] || row['payment 9 utr'] || ''),
        payment10_amount: String(row['payment10_amount'] || row['payment 10 amount'] || '0'),
        payment10_date: formatDateClean(getVal(['payment10_date', 'payment 10 date'])),
        payment10_utr: String(row['payment10_utr'] || row['payment 10 utr'] || ''),
        payment1_method: (row['payment1_method'] || row['payment 1 method'] || '').toLowerCase() as any || undefined,
        payment2_method: (row['payment2_method'] || row['payment 2 method'] || '').toLowerCase() as any || undefined,
        payment3_method: (row['payment3_method'] || row['payment 3 method'] || '').toLowerCase() as any || undefined,
        payment4_method: (row['payment4_method'] || row['payment 4 method'] || '').toLowerCase() as any || undefined,
        payment5_method: (row['payment5_method'] || row['payment 5 method'] || '').toLowerCase() as any || undefined,
        payment6_method: (row['payment6_method'] || row['payment 6 method'] || '').toLowerCase() as any || undefined,
        payment7_method: (row['payment7_method'] || row['payment 7 method'] || '').toLowerCase() as any || undefined,
        payment8_method: (row['payment8_method'] || row['payment 8 method'] || '').toLowerCase() as any || undefined,
        payment9_method: (row['payment9_method'] || row['payment 9 method'] || '').toLowerCase() as any || undefined,
        payment10_method: (row['payment10_method'] || row['payment 10 method'] || '').toLowerCase() as any || undefined,
        received_ac: String(row['received ac'] || row['received_ac'] || ''),
        discount: String(row['discount'] || '0'),
        free: String(row['free'] || '0'),
        total_fees: String(row['total_fees'] || row['total fees'] || '20000'),
        remaining_amount: String(row['remaining amount'] || row['remaining_amount'] || '0'),
        notes: String(row['notes'] || ''),
        refund_date: String(row['refund_date'] || row['refund date'] || ''),
        payment_status: (row['payment_status'] || row['payment status'] || '').toLowerCase() as any || undefined,
        pre_workshop_marks: String(row['pre_workshop_marks'] || row['pre workshop marks'] || ''),
        post_workshop_marks: String(row['post_workshop_marks'] || row['post workshop marks'] || ''),
        arrival_status: String(row['arrival_status'] || row['arrival status'] || 'not_arrived') as any,
        status: (() => {
          const s = (row['status'] || 'confirm').toLowerCase();
          if (s === 'active') return 'confirm';
          if (s === 'stay only' || s === 'stay_only') return 'stay only';
          return s as 'confirm' | 'cancelled' | 'pending' | 'stay only';
        })()
      };
    });
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    setIsRefreshing(true);
    try {
      const rawData = await fetchAllRegistrations();
      if (Array.isArray(rawData)) {
        setRemoteData(normalizeData(rawData));
      } else if (rawData && (rawData as any).error) {
        setError(`Cloud Error: ${(rawData as any).error}`);
      }
    } catch (err) {
      setError("Sync Error: Could not fetch data from Google Sheets. Please ensure your Apps Script is deployed as a Web App with 'Anyone' access.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [lastRefreshed]);

  useEffect(() => {
    if (autoViewRecord) {
      setScannerResult(autoViewRecord);
      if (onAutoViewClose) onAutoViewClose();
    }
  }, [autoViewRecord, onAutoViewClose]);

  const allSyncedData = useMemo(() => {
    const localSynced = records.filter(r => r.syncStatus === 'synced' && r.data).map(r => r.data!);
    const uniqueMap = new Map<string, RegistrationData>();
    remoteData.forEach(item => { if (item.admission_id) uniqueMap.set(item.admission_id, item); });
    localSynced.forEach(item => { if (item.admission_id && !uniqueMap.has(item.admission_id)) uniqueMap.set(item.admission_id, item); });
    return Array.from(uniqueMap.values()).sort((a, b) => {
        try {
            const timeB = parseDate(b.payment1_date)?.getTime() || 0;
            const timeA = parseDate(a.payment1_date)?.getTime() || 0;
            return timeB - timeA;
        } catch(e) { return 0; }
    });
  }, [remoteData, records]);

  const [activeFilters, setActiveFilters] = useState<{ key: string; value: string; label: string }[]>([]);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [selectedFilterType, setSelectedFilterType] = useState<string | null>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  const FILTER_CONFIG = [
    { id: 'status', label: 'Status', options: ['confirm', 'pending', 'cancelled', 'stay only'] },
    { id: 'payment_status', label: 'Payment Status', options: ['full paid', 'partial', 'unpaid', 'refund', 'discount', 'free'] },
    { id: 'gender', label: 'Gender', options: ['male', 'female', 'other'] },
    { id: 'age', label: 'Age', dynamic: true, custom: true },
    { id: 'payment_amount', label: 'Payment Amount', dynamic: true, custom: true },
    { id: 'remaining_amount', label: 'Remaining Amount', dynamic: true, custom: true },
    { id: 'medium', label: 'Medium', options: ['english', 'hindi', 'urdu'] },
    { id: 'payment_method', label: 'Payment Method', options: ['cash', 'account'] },
    { id: 'state', label: 'State', dynamic: true },
    { id: 'city', label: 'City', dynamic: true },
    { id: 'date_range', label: 'Date Range', custom: true },
    { id: 'pre_marks', label: 'Pre Workshop Marks', custom: true },
    { id: 'post_marks', label: 'Post Workshop Marks', custom: true },
    { id: 'arrival_status', label: 'Arrival Status', options: ['arrived', 'not_arrived', 'arrived_cancelled'] },
  ];

  const dynamicOptions = useMemo(() => {
    const states = new Set<string>();
    const cities = new Set<string>();
    const ages = new Set<string>();
    const payments = new Set<string>();
    allSyncedData.forEach(d => {
      if (d.state) states.add(d.state);
      if (d.city) cities.add(d.city);
      if (d.age) ages.add(d.age);
      
      for (let i = 1; i <= 10; i++) {
        const amt = parseFloat(String((d as any)[`payment${i}_amount`]).replace(/[^0-9.]/g, '')) || 0;
        if (amt > 0) payments.add(String(amt));
      }
    });

    const sortedAges = Array.from(ages).sort((a, b) => parseInt(a) - parseInt(b));
    const ageOptions = sortedAges;

    const sortedPayments = Array.from(payments).sort((a, b) => parseFloat(a) - parseFloat(b));
    // Also add multiples of 1k up to 20k as requested
    const standardPayments = Array.from({ length: 20 }, (_, i) => String((i + 1) * 1000));
    
    // Calculate total payments and remaining for each record to add to options
    const totalPaymentsSet = new Set<string>();
    const remainingAmountsSet = new Set<string>();
    allSyncedData.forEach(d => {
      let total = 0;
      for (let i = 1; i <= 10; i++) {
        total += parseFloat(String((d as any)[`payment${i}_amount`]).replace(/[^0-9.]/g, '')) || 0;
      }
      if (total > 0) totalPaymentsSet.add(String(total));
      
      const remaining = parseFloat(String(d.remaining_amount || '0').replace(/[^0-9.]/g, '')) || 0;
      if (remaining > 0) remainingAmountsSet.add(String(remaining));
    });

    const finalPaymentOptions = Array.from(new Set([...standardPayments, ...Array.from(totalPaymentsSet)])).sort((a, b) => parseFloat(a) - parseFloat(b));
    const finalRemainingOptions = Array.from(remainingAmountsSet).sort((a, b) => parseFloat(a) - parseFloat(b));

    return {
      state: Array.from(states).sort(),
      city: Array.from(cities).sort(),
      age: ageOptions,
      payment_amount: finalPaymentOptions,
      remaining_amount: finalRemainingOptions
    };
  }, [allSyncedData]);

  const addFilter = (key: string, value: string) => {
    const config = FILTER_CONFIG.find(c => c.id === key);
    const label = `${config?.label}: ${value}`;
    if (!activeFilters.find(f => f.key === key && f.value === value)) {
      setActiveFilters([...activeFilters, { key, value, label }]);
    }
    setIsFilterMenuOpen(false);
    setSelectedFilterType(null);
  };

  const removeFilter = (key: string, value: string) => {
    setActiveFilters(activeFilters.filter(f => !(f.key === key && f.value === value)));
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setDashboardSearchQuery('');
  };

  const hierarchicalStats = useMemo(() => {
    const stats: {
      states: Record<string, any>;
      cities: Record<string, any>;
      admissions: Record<string, any>;
      totalStates: number;
      totalCities: number;
    } = {
      states: {},
      cities: {},
      admissions: {},
      totalStates: 0,
      totalCities: 0
    };

    allSyncedData.forEach(d => {
      const state = (d.state || 'Unknown').trim();
      const city = (d.city || 'Unknown').trim();
      const gender = (d.gender || 'Other').trim().toLowerCase();
      const age = (d.age || 'Unknown').trim();
      
      let totalFees = parseFloat(String(d.total_fees || '0').replace(/[^0-9.]/g, '')) || 0;
      let totalPaid = 0;
      for (let i = 1; i <= 10; i++) {
        totalPaid += parseFloat(String((d as any)[`payment${i}_amount`]).replace(/[^0-9.]/g, '')) || 0;
      }
      let balance = totalFees - totalPaid;

      // State Stats
      if (!stats.states[state]) {
        stats.states[state] = { total: 0, male: 0, female: 0, ages: {}, totalFees: 0, totalPaid: 0, balance: 0, cities: new Set() };
      }
      stats.states[state].total++;
      if (gender === 'male') stats.states[state].male++;
      else if (gender === 'female') stats.states[state].female++;
      stats.states[state].ages[age] = (stats.states[state].ages[age] || 0) + 1;
      stats.states[state].totalFees += totalFees;
      stats.states[state].totalPaid += totalPaid;
      stats.states[state].balance += balance;
      stats.states[state].cities.add(city);

      // City Stats
      if (!stats.cities[city]) {
        stats.cities[city] = { total: 0, male: 0, female: 0, ages: {}, totalFees: 0, totalPaid: 0, balance: 0, states: new Set() };
      }
      stats.cities[city].total++;
      if (gender === 'male') stats.cities[city].male++;
      else if (gender === 'female') stats.cities[city].female++;
      stats.cities[city].ages[age] = (stats.cities[city].ages[age] || 0) + 1;
      stats.cities[city].totalFees += totalFees;
      stats.cities[city].totalPaid += totalPaid;
      stats.cities[city].balance += balance;
      stats.cities[city].states.add(state);

      // Admission Stats (by Month)
      const date = parseDate(d.payment1_date);
      if (date) {
        const monthYear = format(date, 'MMMM yyyy');
        if (!stats.admissions[monthYear]) {
          stats.admissions[monthYear] = { total: 0, male: 0, female: 0, totalFees: 0, totalPaid: 0, balance: 0 };
        }
        stats.admissions[monthYear].total++;
        if (gender === 'male') stats.admissions[monthYear].male++;
        else if (gender === 'female') stats.admissions[monthYear].female++;
        stats.admissions[monthYear].totalFees += totalFees;
        stats.admissions[monthYear].totalPaid += totalPaid;
        stats.admissions[monthYear].balance += balance;
      }
    });

    stats.totalStates = Object.keys(stats.states).length;
    stats.totalCities = Object.keys(stats.cities).length;

    return stats;
  }, [allSyncedData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setIsFilterMenuOpen(false);
        setSelectedFilterType(null);
      }
      if (timeRangeMenuRef.current && !timeRangeMenuRef.current.contains(event.target as Node)) {
        setIsTimeRangeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [timeRange, setTimeRange] = useState<TimeRange>('lifetime');
  const [drillLevel, setDrillLevel] = useState<'year' | 'month' | 'week' | 'day' | 'custom'>('year');
  const [drillContext, setDrillContext] = useState<{ year?: number; month?: Date; week?: Date }>({});
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [customAgeMin, setCustomAgeMin] = useState<string>('');
  const [customAgeMax, setCustomAgeMax] = useState<string>('');
  const [customPaymentMin, setCustomPaymentMin] = useState<string>('');
  const [customPaymentMax, setCustomPaymentMax] = useState<string>('');
  const [customRemainingMin, setCustomRemainingMin] = useState<string>('');
  const [customRemainingMax, setCustomRemainingMax] = useState<string>('');
  const [customDateStart, setCustomDateStart] = useState<string>('');
  const [customDateEnd, setCustomDateEnd] = useState<string>('');
  const [customPreMarksMin, setCustomPreMarksMin] = useState<string>('');
  const [customPreMarksMax, setCustomPreMarksMax] = useState<string>('');
  const [customPostMarksMin, setCustomPostMarksMin] = useState<string>('');
  const [customPostMarksMax, setCustomPostMarksMax] = useState<string>('');
  const [filterGender, setFilterGender] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<string | null>(null);
  const [filterCity, setFilterCity] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string | null>(null);
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<'cash' | 'account' | null>(null);
  const [filterAdmissionStatus, setFilterAdmissionStatus] = useState<string | null>(null);
  const [filterAgeRange, setFilterAgeRange] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof RegistrationData; direction: 'asc' | 'desc' } | null>(null);
  const [showRevenue, setShowRevenue] = useState(false);

  const requestSort = (key: keyof RegistrationData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getFilteredData = () => {
    let baseFiltered = allSyncedData;

    // Time Filtering based on Drill-down or Custom Range
    if (drillLevel === 'custom') {
      const start = customStart ? startOfDay(new Date(customStart)) : null;
      const end = customEnd ? endOfDay(new Date(customEnd)) : null;
      if (start && end) {
        baseFiltered = baseFiltered.filter(d => {
          const date = parseDate(d.payment1_date);
          return date && isAfter(date, start) && isBefore(date, end);
        });
      }
    } else if (drillLevel === 'day' && drillContext.week) {
      const start = startOfWeek(drillContext.week);
      const end = endOfWeek(drillContext.week);
      baseFiltered = baseFiltered.filter(d => {
        const date = parseDate(d.payment1_date);
        return date && date >= start && date <= end;
      });
    } else if (drillLevel === 'week' && drillContext.month) {
      const start = startOfMonth(drillContext.month);
      const end = endOfMonth(drillContext.month);
      baseFiltered = baseFiltered.filter(d => {
        const date = parseDate(d.payment1_date);
        return date && date >= start && date <= end;
      });
    } else if (drillLevel === 'month' && drillContext.year) {
      const start = startOfYear(new Date(drillContext.year, 0, 1));
      const end = endOfYear(new Date(drillContext.year, 0, 1));
      baseFiltered = baseFiltered.filter(d => {
        const date = parseDate(d.payment1_date);
        return date && date >= start && date <= end;
      });
    } else if (timeRange !== 'lifetime') {
      // Fallback to legacy timeRange if in Year view but a quick filter is selected
      const now = new Date();
      baseFiltered = baseFiltered.filter(d => {
        const date = parseDate(d.payment1_date);
        if (!date) return false;
        switch (timeRange) {
          case 'today': return isSameDay(date, now);
          case 'yesterday': return isSameDay(date, subDays(now, 1));
          case 'week': return isAfter(date, startOfWeek(now));
          case 'month': return isAfter(date, startOfMonth(now));
          case 'year': return isAfter(date, startOfYear(now));
          default: return true;
        }
      });
    }

    return baseFiltered.filter(d => {
      // Apply Active Filters (YouTube Style)
      for (const filter of activeFilters) {
        const { key, value } = filter;
        if (key === 'status') {
          const s = (d.status || 'confirm').toLowerCase();
          if (value === 'confirm') {
            if (s !== 'confirm' && s !== 'active') return false;
          } else if (s !== value) return false;
        } else if (key === 'gender') {
          if ((d.gender || 'Other').trim().toLowerCase() !== value.toLowerCase()) return false;
        } else if (key === 'age') {
          const ageVal = parseInt((d.age || '0').trim());
          if (value.includes('-')) {
            const [min, max] = value.split('-').map(v => parseInt(v));
            if (ageVal < min || ageVal > max) return false;
          } else {
            if ((d.age || '').trim() !== value.trim()) return false;
          }
        } else if (key === 'payment_amount') {
          let totalPaid = 0;
          for (let i = 1; i <= 10; i++) {
            totalPaid += parseFloat(String((d as any)[`payment${i}_amount`]).replace(/[^0-9.]/g, '')) || 0;
          }
          
          if (value.includes('-')) {
            const [min, max] = value.split('-').map(v => parseFloat(v));
            if (totalPaid < min || totalPaid > max) return false;
          } else {
            const targetAmt = parseFloat(value);
            if (totalPaid !== targetAmt) return false;
          }
        } else if (key === 'remaining_amount') {
          const remaining = parseFloat(String(d.remaining_amount || '0').replace(/[^0-9.]/g, '')) || 0;
          
          if (value.includes('-')) {
            const [min, max] = value.split('-').map(v => parseFloat(v));
            if (remaining < min || remaining > max) return false;
          } else {
            const targetAmt = parseFloat(value);
            if (remaining !== targetAmt) return false;
          }
        } else if (key === 'payment_status') {
          const remaining = parseFloat(d.remaining_amount) || 0;
          const total = parseFloat(d.total_fees) || 0;
          const ps = (d.payment_status || '').toLowerCase();

          if (value === 'refund') {
            if (ps !== 'refund') return false;
          } else if (ps === 'refund') {
            return false;
          } else if (value === 'full paid') {
            if (remaining > 0) return false;
          } else if (value === 'partial') {
            if (remaining <= 0 || remaining >= total) return false;
          } else if (value === 'unpaid') {
            if (remaining < total || total <= 0) return false;
          }
        } else if (key === 'medium') {
          if ((d.medium || '').trim().toLowerCase() !== value.toLowerCase()) return false;
        } else if (key === 'state') {
          if ((d.state || '').trim().toLowerCase() !== value.toLowerCase()) return false;
        } else if (key === 'city') {
          if ((d.city || '').trim().toLowerCase() !== value.toLowerCase()) return false;
        } else if (key === 'payment_method') {
          let hasMethod = false;
          for (let i = 1; i <= 10; i++) {
            const amt = parseFloat(String((d as any)[`payment${i}_amount`]).replace(/[^0-9.]/g, '')) || 0;
            const utr = (d as any)[`payment${i}_utr`];
            const rawMethod = (d as any)[`payment${i}_method`];
            
            let method = rawMethod || 'account';
            if (!rawMethod && utr) {
              const utrStr = String(utr).trim();
              if (utrStr && !/^\d{12}$/.test(utrStr)) {
                method = 'cash';
              }
            }
            
            if (amt > 0 && method === value) {
              hasMethod = true;
              break;
            }
          }
          if (!hasMethod) return false;
        } else if (key === 'payment_status') {
          let studentTotal = 0;
          for (let i = 1; i <= 10; i++) {
            studentTotal += parseFloat(String((d as any)[`payment${i}_amount`]).replace(/[^0-9.]/g, '')) || 0;
          }
          const discount = parseFloat(String(d.discount || '0')) || 0;
          const totalFees = parseFloat(String(d.total_fees || '20000').replace(/[^0-9.]/g, '')) || 20000;
          const target = totalFees - discount;
          if (value === 'pending') {
            if (studentTotal >= target) return false;
          }
        } else if (key === 'discount') {
          const discount = parseFloat(String(d.discount || '0')) || 0;
          if (value === 'yes' && discount === 0) return false;
        } else if (key === 'date_range') {
          const date = parseDate(d.payment1_date);
          if (!date) return false;
          const [startStr, endStr] = value.split(' to ');
          const start = parse(startStr, 'dd-MM-yyyy', new Date());
          const end = parse(endStr, 'dd-MM-yyyy', new Date());
          if (isBefore(date, startOfDay(start)) || isAfter(date, endOfDay(end))) return false;
        } else if (key === 'pre_marks') {
          const marksVal = parseFloat(d.pre_workshop_marks || '0');
          if (value.includes('-')) {
            const [min, max] = value.split('-').map(v => parseFloat(v));
            if (marksVal < min || marksVal > max) return false;
          } else {
            if (marksVal !== parseFloat(value)) return false;
          }
        } else if (key === 'post_marks') {
          const marksVal = parseFloat(d.post_workshop_marks || '0');
          if (value.includes('-')) {
            const [min, max] = value.split('-').map(v => parseFloat(v));
            if (marksVal < min || marksVal > max) return false;
          } else {
            if (marksVal !== parseFloat(value)) return false;
          }
        }
      }

      if (filterGender && (d.gender || 'Other').trim().toLowerCase() !== filterGender.toLowerCase()) return false;
      if (filterState && (d.state || 'Unknown').trim().toLowerCase() !== filterState.toLowerCase()) return false;
      if (filterCity && (d.city || 'Unknown').trim().toLowerCase() !== filterCity.toLowerCase()) return false;
      if (filterDate) {
        const date = parseDate(d.payment1_date);
        if (!date) return false;
        if (format(date, 'dd MMM') !== filterDate) return false;
      }

    if (filterAdmissionStatus) {
      const status = (d.status || 'confirm').toLowerCase();
      if (filterAdmissionStatus === 'confirm') {
        if (status !== 'confirm' && status !== 'active') return false;
      } else {
        if (status !== filterAdmissionStatus) return false;
      }
    }

    if (filterAgeRange) {
      const age = parseInt(d.age) || 0;
      let range = 'Unknown';
      if (age < 13) range = 'Under 13';
      else if (age <= 15) range = '13 to 15';
      else if (age <= 16) range = 'under 16';
      else if (age <= 18) range = '16 to 18';
      else if (age <= 20) range = '18 to 20';
      else if (age <= 22) range = '20 to 22';
      else if (age <= 25) range = '22 to 25';
      else if (age <= 30) range = '25 to 30';
      else if (age <= 35) range = '30 to 35';
      else range = '35+';
      if (range !== filterAgeRange) return false;
    }

    if (dashboardSearchQuery) {
        const query = dashboardSearchQuery.toLowerCase();
        const nameMatch = (d.name || '').toLowerCase().includes(query);
        const idMatch = (d.admission_id || '').toLowerCase().includes(query);
        const cityMatch = (d.city || '').toLowerCase().includes(query);
        const contactMatch = (d.contact_no || '').toLowerCase().includes(query);
        if (!nameMatch && !idMatch && !cityMatch && !contactMatch) return false;
      }

      if (filterPaymentStatus) {
        let studentTotal = 0;
        for (let i = 1; i <= 10; i++) {
          studentTotal += parseFloat(String((d as any)[`payment${i}_amount`]).replace(/[^0-9.]/g, '')) || 0;
        }
        const discountVal = parseFloat(String(d.discount || '0').replace(/[^0-9.]/g, '')) || 0;
        const freeVal = parseFloat(String(d.free || '0').replace(/[^0-9.]/g, '')) || 0;
        const totalFeesVal = parseFloat(String(d.total_fees || '20000').replace(/[^0-9.]/g, '')) || 20000;
        const remainingVal = parseFloat(String(d.remaining_amount || '0').replace(/[^0-9.]/g, '')) || 0;
        const target = totalFeesVal - discountVal - freeVal;
        const ps = (d.payment_status || '').toLowerCase();
        const status = (d.status || 'confirm').toLowerCase();

        const isActuallyFullyPaid = ps.includes('full') || remainingVal <= 0 || (studentTotal >= target && target > 0);
        const isActuallyFree = ps === 'free' || freeVal > 0 || (totalFeesVal === 0 && status !== 'cancelled');
        const isActuallyDiscount = ps === 'discount' || discountVal > 0;
        const isActuallyRefund = ps === 'refund';

        if (filterPaymentStatus === 'refund') {
          if (!isActuallyRefund) return false;
        } else if (filterPaymentStatus === 'free') {
          if (!isActuallyFree) return false;
        } else if (filterPaymentStatus === 'fully_paid') {
          if (!isActuallyFullyPaid || isActuallyFree) return false;
        } else if (filterPaymentStatus === 'discount') {
          // Now "Discount" filter shows ALL students with a discount, as requested
          if (!isActuallyDiscount) return false;
        } else if (filterPaymentStatus === 'partial') {
          if (isActuallyRefund || isActuallyFree || isActuallyFullyPaid) return false;
          const isPartial = ps === 'partial' || studentTotal > 0;
          if (!isPartial) return false;
        } else if (filterPaymentStatus === 'unpaid') {
          if (isActuallyRefund || isActuallyFree || isActuallyFullyPaid) return false;
          if (studentTotal > 0) return false;
        }
      }

      if (filterPaymentMethod) {
        const status = (d.status || 'confirm').toLowerCase();
        if (status === 'cancelled' || status === 'pending' || status === 'stay only') return false;

        let hasMethod = false;
        for (let i = 1; i <= 10; i++) {
          const amt = parseFloat(String((d as any)[`payment${i}_amount`]).replace(/[^0-9.]/g, '')) || 0;
          const utr = (d as any)[`payment${i}_utr`];
          const rawMethod = (d as any)[`payment${i}_method`];
          
          let method = rawMethod || 'account';
          if (!rawMethod && utr) {
            const utrStr = String(utr).trim();
            if (utrStr && !/^\d{12}$/.test(utrStr)) {
              method = 'cash';
            }
          }

          if (amt > 0 && method === filterPaymentMethod) {
            hasMethod = true;
            break;
          }
        }
        if (!hasMethod) return false;
      }

      return true;
    });
  };

  const filteredData = useMemo(() => getFilteredData(), [allSyncedData, timeRange, drillLevel, drillContext, customStart, customEnd, filterGender, filterState, filterCity, filterDate, filterPaymentStatus, filterAdmissionStatus, dashboardSearchQuery, filterPaymentMethod, filterAgeRange, activeFilters]);

  const sortedMasterData = useMemo(() => {
    let sortableData = [...filteredData];
    
    // Apply Master View Search if open
    if (isMasterViewOpen && masterViewSearchQuery) {
      const query = masterViewSearchQuery.toLowerCase();
      sortableData = sortableData.filter(d => 
        (d.name || '').toLowerCase().includes(query) ||
        (d.admission_id || '').toLowerCase().includes(query) ||
        (d.city || '').toLowerCase().includes(query) ||
        (d.contact_no || '').toLowerCase().includes(query)
      );
    }

    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        const aValue = String(a[sortConfig.key] || '').toLowerCase();
        const bValue = String(b[sortConfig.key] || '').toLowerCase();
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [filteredData, sortConfig, isMasterViewOpen, masterViewSearchQuery]);

  const handleDrillDown = (data: any) => {
    const item = data?.payload || data;
    if (!item || !item.rawDate) return;
    const date = item.rawDate;

    if (drillLevel === 'year') {
      setDrillLevel('month');
      setDrillContext({ year: date.getFullYear() });
    } else if (drillLevel === 'month') {
      setDrillLevel('week');
      setDrillContext({ year: drillContext.year, month: date });
    } else if (drillLevel === 'week') {
      setDrillLevel('day');
      setDrillContext({ year: drillContext.year, month: drillContext.month, week: date });
    }
  };

  const getChartData = (data: RegistrationData[]) => {
    const now = new Date();
    let dates: Date[] = [];
    let interval: 'year' | 'month' | 'week' | 'day' = 'year';

    if (drillLevel === 'year') {
      dates = eachYearOfInterval({ start: new Date(2020, 0, 1), end: now });
      interval = 'year';
    } else if (drillLevel === 'month' && drillContext.year) {
      dates = eachMonthOfInterval({ 
        start: startOfYear(new Date(drillContext.year, 0, 1)), 
        end: endOfYear(new Date(drillContext.year, 0, 1)) 
      });
      interval = 'month';
    } else if (drillLevel === 'week' && drillContext.month) {
      dates = eachWeekOfInterval({ 
        start: startOfMonth(drillContext.month), 
        end: endOfMonth(drillContext.month) 
      });
      interval = 'week';
    } else if (drillLevel === 'day' && drillContext.week) {
      dates = eachDayOfInterval({ 
        start: startOfWeek(drillContext.week), 
        end: endOfWeek(drillContext.week) 
      });
      interval = 'day';
    } else if (drillLevel === 'custom') {
      const start = customStart ? new Date(customStart) : subDays(now, 30);
      const end = customEnd ? new Date(customEnd) : now;
      dates = eachDayOfInterval({ start, end });
      interval = 'day';
    }

    const dataPoints: any[] = [];
    
    // Pre-parse and filter data
    const parsedData = data.map(d => ({
      status: d.status,
      _parsedDate: parseDate(d.payment1_date)
    })).filter(d => d._parsedDate);

    // Group data by interval key for O(M) lookup
    const groupedMap: Record<string, { confirmed: number, pending: number, cancelled: number, rawDate: Date }> = {};
    
    parsedData.forEach(d => {
      let key: string;
      const date = d._parsedDate!;
      if (interval === 'year') {
        key = format(date, 'yyyy');
      } else if (interval === 'month') {
        key = format(date, 'yyyy-MM');
      } else if (interval === 'week') {
        key = format(startOfWeek(date), 'yyyy-ww');
      } else {
        key = format(date, 'yyyy-MM-dd');
      }

      if (!groupedMap[key]) groupedMap[key] = { confirmed: 0, pending: 0, cancelled: 0, rawDate: date };
      if (d.status === 'confirm') groupedMap[key].confirmed++;
      else if (d.status === 'pending') groupedMap[key].pending++;
      else if (d.status === 'cancelled') groupedMap[key].cancelled++;
    });

    dates.forEach(date => {
      let key: string;
      let label: string;

      if (interval === 'year') {
        key = format(date, 'yyyy');
        label = key;
      } else if (interval === 'month') {
        key = format(date, 'yyyy-MM');
        label = format(date, 'MMM');
      } else if (interval === 'week') {
        const start = startOfWeek(date);
        key = format(start, 'yyyy-ww');
        label = `W${format(start, 'w')}`;
      } else {
        key = format(date, 'yyyy-MM-dd');
        label = format(date, 'dd MMM');
      }

      const stats = groupedMap[key] || { confirmed: 0, pending: 0, cancelled: 0 };

      dataPoints.push({
        name: label,
        confirmed: stats.confirmed,
        pending: stats.pending,
        cancelled: stats.cancelled,
        total: stats.confirmed + stats.pending + stats.cancelled,
        rawDate: date
      });
    });

    return dataPoints;
  };

  const admChartData = useMemo(() => getChartData(filteredData), [filteredData, drillLevel, drillContext, customStart, customEnd]);

  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartContainerRef.current) {
      chartContainerRef.current.scrollLeft = chartContainerRef.current.scrollWidth;
    }
  }, [admChartData]);

  const getStats = (data: RegistrationData[]) => {
    const total = data.length;
    const genderMapConfirm: Record<string, number> = {};
    const genderMapTotal: Record<string, number> = {};
    let revenue = 0;
    let cashRevenue = 0;
    let accountRevenue = 0;
    let cancelledCount = 0;
    let pendingCount = 0;
    let stayOnlyCount = 0;
    let fullyPaid = 0;
    let partialPaid = 0;
    let unpaidCount = 0;
    let discountCount = 0;
    let freeCount = 0;
    let refundCount = 0;
    let refundedAmount = 0;

    data.forEach(d => {
      const status = (d.status || 'confirm').toLowerCase();
      const g = (d.gender || 'Other').trim().toLowerCase();
      const ps = (d.payment_status || '').toLowerCase();
      
      // Always add to total map
      genderMapTotal[g] = (genderMapTotal[g] || 0) + 1;

      let studentTotal = 0;
      for (let i = 1; i <= 10; i++) {
        studentTotal += parseFloat(String((d as any)[`payment${i}_amount`]).replace(/[^0-9.]/g, '')) || 0;
      }

      const discountVal = parseFloat(String(d.discount || '0').replace(/[^0-9.]/g, '')) || 0;
      const freeVal = parseFloat(String(d.free || '0').replace(/[^0-9.]/g, '')) || 0;
      const totalFeesVal = parseFloat(String(d.total_fees || '20000').replace(/[^0-9.]/g, '')) || 20000;
      const remainingVal = parseFloat(String(d.remaining_amount || '0').replace(/[^0-9.]/g, '')) || 0;
      const target = totalFeesVal - discountVal - freeVal;

      // Payment Status Counting
      const isActuallyFullyPaid = ps.includes('full') || remainingVal <= 0 || (studentTotal >= target && target > 0);
      const isActuallyFree = ps === 'free' || freeVal > 0 || (totalFeesVal === 0 && status !== 'cancelled');
      const isActuallyDiscount = ps === 'discount' || discountVal > 0;
      const isActuallyRefund = ps === 'refund';

      // Count Discounts independently to show "Total Discounts" as requested
      if (isActuallyDiscount) {
        discountCount++;
      }

      if (isActuallyRefund) {
        refundCount++;
        refundedAmount += studentTotal;
      } else if (isActuallyFree) {
        freeCount++;
      } else if (isActuallyFullyPaid) {
        fullyPaid++;
      } else if (ps === 'partial' || studentTotal > 0) {
        partialPaid++;
      } else {
        unpaidCount++;
      }

      if (status === 'cancelled') {
        cancelledCount++;
        return;
      }
      if (status === 'pending') {
        pendingCount++;
        return;
      }
      if (status === 'stay only') {
        stayOnlyCount++;
        return;
      }
      
      // Only add to confirm map if not cancelled/pending/stay only
      genderMapConfirm[g] = (genderMapConfirm[g] || 0) + 1;
      
      for (let i = 1; i <= 10; i++) {
        const amt = parseFloat(String((d as any)[`payment${i}_amount`]).replace(/[^0-9.]/g, '')) || 0;
        const utr = (d as any)[`payment${i}_utr`];
        const rawMethod = (d as any)[`payment${i}_method`];
        
        // Inference logic: if method is missing but UTR is not a 12-digit number, assume Cash
        let method = rawMethod || 'account';
        if (!rawMethod && utr) {
          const utrStr = String(utr).trim();
          if (utrStr && !/^\d{12}$/.test(utrStr)) {
            method = 'cash';
          }
        }

        if (method === 'cash') {
          cashRevenue += amt;
        } else {
          accountRevenue += amt;
        }
      }
      revenue += studentTotal;
    });
    return { total, genderMapConfirm, genderMapTotal, revenue, cashRevenue, accountRevenue, refundedAmount, cancelledCount, pendingCount, stayOnlyCount, fullyPaid, partialPaid, unpaidCount, discountCount, freeCount, refundCount };
  };

  const globalStats = useMemo(() => getStats(filteredData), [filteredData]);
  const lifetimeStats = useMemo(() => getStats(allSyncedData), [allSyncedData]);

  const genderPieData = useMemo(() => {
    const map = genderViewType === 'confirm' ? globalStats.genderMapConfirm : globalStats.genderMapTotal;
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    return Object.entries(map).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0'
    }));
  }, [globalStats, genderViewType]);

  const stateDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(d => {
      const state = d.state || 'Unknown';
      counts[state] = (counts[state] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const cityDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(d => {
      const city = d.city || 'Unknown';
      counts[city] = (counts[city] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const ageDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(d => {
      const age = parseInt(d.age) || 0;
      let range = 'Unknown';
      if (age < 13) range = 'Under 13';
      else if (age <= 15) range = '13 to 15';
      else if (age <= 16) range = 'under 16';
      else if (age <= 18) range = '16 to 18';
      else if (age <= 20) range = '18 to 20';
      else if (age <= 22) range = '20 to 22';
      else if (age <= 25) range = '22 to 25';
      else if (age <= 30) range = '25 to 30';
      else if (age <= 35) range = '30 to 35';
      else range = '35+';
      counts[range] = (counts[range] || 0) + 1;
    });
    const order = [
      'Under 13', '13 to 15', 'under 16', '16 to 18', '18 to 20', 
      '20 to 22', '22 to 25', '25 to 30', '30 to 35', '35+', 'Unknown'
    ];
    return order
      .map(name => ({ name, count: counts[name] || 0 }))
      .filter(item => item.count > 0);
  }, [filteredData]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedMasterData.slice(start, start + itemsPerPage);
  }, [sortedMasterData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedMasterData.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [dashboardSearchQuery, activeFilters, timeRange, customStart, customEnd]);

  const handleGlobalTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };

  const handleGlobalCustomDateChange = (type: 'start' | 'end', val: string) => {
    if (type === 'start') {
      setCustomStart(val);
    } else {
      setCustomEnd(val);
    }
  };

  const clearAllFilters = () => {
    setTimeRange('lifetime');
    setCustomStart('');
    setCustomEnd('');
    setFilterGender(null);
    setFilterState(null);
    setFilterCity(null);
    setFilterDate(null);
    setFilterPaymentStatus(null);
    setFilterPaymentMethod(null);
    setFilterAdmissionStatus(null);
    setFilterAgeRange(null);
  };

  const isFiltered = timeRange !== 'lifetime' || filterGender || filterState || filterCity || filterDate || filterPaymentStatus || filterAdmissionStatus || filterPaymentMethod || filterAgeRange || activeFilters.length > 0;

  return (
    <div className="space-y-8 pb-10 transition-colors relative">
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            {/* Sidebar */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-full max-w-[380px] bg-white dark:bg-slate-900 shadow-2xl z-[101] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                    <PieIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Data Insights</h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Hierarchical Explorer</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                <button 
                  onClick={() => {
                    setCurrentView('dashboard');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${currentView === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentView === 'dashboard' ? 'bg-white/20' : 'bg-indigo-600'}`}>
                      <PieIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${currentView === 'dashboard' ? 'text-white/70' : 'text-slate-400'}`}>Main View</span>
                      <span className="text-sm font-black">Dashboard</span>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${currentView === 'dashboard' ? 'text-white/50' : 'text-slate-300'}`} />
                </button>

                <button 
                  onClick={() => {
                    setCurrentView('states');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${currentView === 'states' ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentView === 'states' ? 'bg-white/20' : 'bg-indigo-600'}`}>
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${currentView === 'states' ? 'text-white/70' : 'text-slate-400'}`}>Geographic</span>
                      <span className="text-sm font-black">States Analytics</span>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${currentView === 'states' ? 'text-white/50' : 'text-slate-300'}`} />
                </button>

                <button 
                  onClick={() => {
                    setCurrentView('cities');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${currentView === 'cities' ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentView === 'cities' ? 'bg-white/20' : 'bg-emerald-600'}`}>
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${currentView === 'cities' ? 'text-white/70' : 'text-slate-400'}`}>Regional</span>
                      <span className="text-sm font-black">Cities Analytics</span>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${currentView === 'cities' ? 'text-white/50' : 'text-slate-300'}`} />
                </button>

                <button 
                  onClick={() => {
                    setCurrentView('admissions');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${currentView === 'admissions' ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentView === 'admissions' ? 'bg-white/20' : 'bg-orange-600'}`}>
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${currentView === 'admissions' ? 'text-white/70' : 'text-slate-400'}`}>Temporal</span>
                      <span className="text-sm font-black">Admissions Analytics</span>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${currentView === 'admissions' ? 'text-white/50' : 'text-slate-300'}`} />
                </button>
              </div>
              
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="w-full py-3 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all"
                >
                  Close Explorer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .recharts-wrapper:focus, .recharts-surface:focus, .recharts-bar-rectangle:focus, .recharts-layer:focus, .recharts-sector:focus {
          outline: none !important;
        }
      ` }} />
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
            >
              <Menu className="w-6 h-6 text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 transition-colors" />
            </button>
            <div>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">EHA Dashboard</h1>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                System Operational & Live
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-3 w-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input 
                type="text" 
                placeholder="Search Analytics..."
                value={dashboardSearchQuery}
                onChange={(e) => setDashboardSearchQuery(e.target.value)}
                className="block w-full sm:w-48 pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm dark:text-slate-100 dark:placeholder-slate-600"
              />
            </div>
            {isFiltered && (
              <button 
                onClick={clearAllFilters}
                className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                Clear
              </button>
            )}
            <button onClick={() => setLastRefreshed(Date.now())} disabled={isLoading} className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm text-slate-400 hover:text-indigo-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={isLoading ? "animate-spin" : ""}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
          <button
            onClick={() => setTimeRange('lifetime')}
            className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap border ${
              timeRange === 'lifetime'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Lifetime
          </button>

          <div className="relative" ref={timeRangeMenuRef}>
            <button
              onClick={() => setIsTimeRangeMenuOpen(!isTimeRangeMenuOpen)}
              className={`flex items-center gap-2 px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border ${
                timeRange !== 'lifetime'
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Calendar className="w-3 h-3" />
              {timeRange === 'lifetime' ? 'Select Range' : TIME_RANGE_OPTIONS.find(o => o.id === timeRange)?.label || 'Custom'}
              <ChevronDown className={`w-3 h-3 transition-transform ${isTimeRangeMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTimeRangeMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 py-2 z-50 max-h-[300px] overflow-y-auto no-scrollbar">
                {TIME_RANGE_OPTIONS.map((option, idx) => (
                  option.divider ? (
                    <div key={`div-${idx}`} className="my-1 border-t border-slate-50 dark:border-slate-800" />
                  ) : (
                    <button
                      key={option.id}
                      onClick={() => {
                        setTimeRange(option.id as TimeRange);
                        setIsTimeRangeMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-colors ${
                        timeRange === option.id
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                ))}
              </div>
            )}
          </div>

          {timeRange === 'custom' && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm w-full sm:w-auto overflow-x-auto">
              <input 
                type="date" 
                value={customStart} 
                onChange={(e) => handleGlobalCustomDateChange('start', e.target.value)}
                className="text-[9px] bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-1 text-slate-600 dark:text-slate-300 outline-none"
              />
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">to</span>
              <input 
                type="date" 
                value={customEnd} 
                onChange={(e) => handleGlobalCustomDateChange('end', e.target.value)}
                className="text-[9px] bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-1 text-slate-600 dark:text-slate-300 outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {currentView === 'dashboard' ? (
        <>
          {/* MAIN STATS ROW */}
          <div className={`grid gap-6 ${userRole === 'super_admin' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            <div 
              onClick={() => { setFilterAdmissionStatus(null); setFilterPaymentStatus(null); setFilterGender(null); setFilterState(null); setFilterCity(null); setFilterDate(null); setFilterAgeRange(null); }}
              className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group transition-all cursor-pointer hover:border-indigo-500 hover:shadow-xl"
            >
              <div className="absolute top-0 right-0 w-32 md:w-48 h-32 md:h-48 bg-indigo-50 dark:bg-indigo-900/10 rounded-full -mr-16 md:-mr-24 -mt-16 md:-mt-24 group-hover:scale-110 transition-transform duration-700"></div>
              <h3 className="text-slate-400 dark:text-slate-500 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] mb-4 relative">Total Admissions</h3>
              <p className="text-6xl md:text-7xl font-black text-slate-900 dark:text-slate-100 relative tracking-tighter leading-none">{globalStats.total}</p>
              <div className="mt-8 flex items-center gap-3 relative">
                <div className="px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-full">
                  <p className="text-green-600 dark:text-green-400 text-[8px] md:text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> {isLoading ? "Syncing..." : "Live"}
                  </p>
                </div>
                <span className="text-[8px] md:text-[9px] font-black text-slate-300 uppercase tracking-widest">Real-time Feed</span>
              </div>
            </div>

            {userRole === 'super_admin' && (
              <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm transition-all group hover:border-emerald-500 hover:shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <h3 className="text-slate-400 dark:text-slate-500 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em]">Total Revenue</h3>
                  <button 
                    onClick={() => setShowRevenue(!showRevenue)}
                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-emerald-600"
                    title={showRevenue ? "Hide Revenue" : "Show Revenue"}
                  >
                    {showRevenue ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="mb-8 relative z-10">
                  <div className="relative">
                    <p className={`text-5xl md:text-6xl font-black text-slate-900 dark:text-slate-100 tracking-tighter leading-none mb-3 transition-all duration-300 ${!showRevenue ? 'blur-md select-none opacity-20' : ''}`}>
                      ₹{globalStats.revenue.toLocaleString()}
                    </p>
                    {!showRevenue && (
                      <div className="absolute inset-0 flex items-center justify-start">
                        <span className="text-xs font-black text-slate-300 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">Hidden</span>
                      </div>
                    )}
                  </div>
                  <p className={`text-[10px] md:text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.1em] leading-tight opacity-90 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg inline-block transition-all duration-300 ${!showRevenue ? 'blur-sm select-none opacity-10' : ''}`}>
                    {numberToWords(globalStats.revenue)} ONLY
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
                  <div 
                    onClick={() => setFilterPaymentMethod(filterPaymentMethod === 'cash' ? null : 'cash')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-2 ${filterPaymentMethod === 'cash' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/20'}`}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className={`w-3 h-3 ${filterPaymentMethod === 'cash' ? 'text-emerald-100' : 'text-emerald-600'}`} />
                      <p className={`text-[8px] font-black uppercase tracking-widest ${filterPaymentMethod === 'cash' ? 'text-emerald-100' : 'text-emerald-600 dark:text-emerald-400'}`}>Cash</p>
                    </div>
                    <p className={`text-lg font-black transition-all duration-300 ${!showRevenue ? 'blur-sm select-none opacity-20' : ''}`}>
                      ₹{globalStats.cashRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div 
                    onClick={() => setFilterPaymentMethod(filterPaymentMethod === 'account' ? null : 'account')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-2 ${filterPaymentMethod === 'account' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/20'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className={`w-3 h-3 ${filterPaymentMethod === 'account' ? 'text-indigo-100' : 'text-indigo-600'}`} />
                      <p className={`text-[8px] font-black uppercase tracking-widest ${filterPaymentMethod === 'account' ? 'text-indigo-100' : 'text-indigo-600 dark:text-indigo-400'}`}>Account</p>
                    </div>
                    <p className={`text-lg font-black transition-all duration-300 ${!showRevenue ? 'blur-sm select-none opacity-20' : ''}`}>
                      ₹{globalStats.accountRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div 
                    onClick={() => {
                      if (activeFilters.find(f => f.key === 'payment_status' && f.value === 'refund')) {
                        removeFilter('payment_status', 'refund');
                      } else {
                        addFilter('payment_status', 'refund');
                      }
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-2 ${activeFilters.find(f => f.key === 'payment_status' && f.value === 'refund') ? 'bg-rose-600 border-rose-500 text-white' : 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/20'}`}
                  >
                    <div className="flex items-center gap-2">
                      <RotateCcw className={`w-3 h-3 ${activeFilters.find(f => f.key === 'payment_status' && f.value === 'refund') ? 'text-rose-100' : 'text-rose-600'}`} />
                      <p className={`text-[8px] font-black uppercase tracking-widest ${activeFilters.find(f => f.key === 'payment_status' && f.value === 'refund') ? 'text-rose-100' : 'text-rose-600 dark:text-rose-400'}`}>Refund</p>
                    </div>
                    <p className={`text-lg font-black transition-all duration-300 ${!showRevenue ? 'blur-sm select-none opacity-20' : ''}`}>
                      ₹{globalStats.refundedAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STATUS CARDS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-8">Payment Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  onClick={() => setFilterPaymentStatus(filterPaymentStatus === 'fully_paid' ? null : 'fully_paid')}
                  className={`flex flex-col justify-between p-5 rounded-2xl border cursor-pointer transition-all ${filterPaymentStatus === 'fully_paid' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-2 h-2 rounded-full ${filterPaymentStatus === 'fully_paid' ? 'bg-white' : 'bg-indigo-600'}`}></div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${filterPaymentStatus === 'fully_paid' ? 'text-indigo-100' : 'text-slate-500'}`}>Fully Paid</span>
                  </div>
                  <span className="text-4xl font-black tracking-tighter">{globalStats.fullyPaid}</span>
                </div>
                <div 
                  onClick={() => setFilterPaymentStatus(filterPaymentStatus === 'partial' ? null : 'partial')}
                  className={`flex flex-col justify-between p-5 rounded-2xl border cursor-pointer transition-all ${filterPaymentStatus === 'partial' ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-200 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-2 h-2 rounded-full ${filterPaymentStatus === 'partial' ? 'bg-white' : 'bg-amber-600'}`}></div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${filterPaymentStatus === 'partial' ? 'text-amber-100' : 'text-slate-500'}`}>Partial</span>
                  </div>
                  <span className="text-4xl font-black tracking-tighter">{globalStats.partialPaid}</span>
                </div>
                <div 
                  onClick={() => setFilterPaymentStatus(filterPaymentStatus === 'unpaid' ? null : 'unpaid')}
                  className={`flex flex-col justify-between p-5 rounded-2xl border cursor-pointer transition-all ${filterPaymentStatus === 'unpaid' ? 'bg-slate-600 border-slate-500 text-white shadow-lg shadow-slate-200 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-2 h-2 rounded-full ${filterPaymentStatus === 'unpaid' ? 'bg-white' : 'bg-slate-400'}`}></div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${filterPaymentStatus === 'unpaid' ? 'text-slate-100' : 'text-slate-500'}`}>Unpaid</span>
                  </div>
                  <span className="text-4xl font-black tracking-tighter">{globalStats.unpaidCount}</span>
                </div>
                <div 
                  onClick={() => setFilterPaymentStatus(filterPaymentStatus === 'discount' ? null : 'discount')}
                  className={`flex flex-col justify-between p-5 rounded-2xl border cursor-pointer transition-all ${filterPaymentStatus === 'discount' ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-200 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-2 h-2 rounded-full ${filterPaymentStatus === 'discount' ? 'bg-white' : 'bg-blue-600'}`}></div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${filterPaymentStatus === 'discount' ? 'text-blue-100' : 'text-slate-500'}`}>Discount</span>
                  </div>
                  <span className="text-4xl font-black tracking-tighter">{globalStats.discountCount}</span>
                </div>
                <div 
                  onClick={() => setFilterPaymentStatus(filterPaymentStatus === 'free' ? null : 'free')}
                  className={`flex flex-col justify-between p-5 rounded-2xl border cursor-pointer transition-all ${filterPaymentStatus === 'free' ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-2 h-2 rounded-full ${filterPaymentStatus === 'free' ? 'bg-white' : 'bg-emerald-600'}`}></div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${filterPaymentStatus === 'free' ? 'text-emerald-100' : 'text-slate-500'}`}>Free</span>
                  </div>
                  <span className="text-4xl font-black tracking-tighter">{globalStats.freeCount}</span>
                </div>
                <div 
                  onClick={() => setFilterPaymentStatus(filterPaymentStatus === 'refund' ? null : 'refund')}
                  className={`flex flex-col justify-between p-5 rounded-2xl border cursor-pointer transition-all ${filterPaymentStatus === 'refund' ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-200 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-2 h-2 rounded-full ${filterPaymentStatus === 'refund' ? 'bg-white' : 'bg-rose-600'}`}></div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${filterPaymentStatus === 'refund' ? 'text-rose-100' : 'text-slate-500'}`}>Refunded</span>
                  </div>
                  <span className="text-4xl font-black tracking-tighter">{globalStats.refundCount}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-8">Admission Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  onClick={() => setFilterAdmissionStatus(filterAdmissionStatus === 'cancelled' ? null : 'cancelled')}
                  className={`flex flex-col justify-between p-5 rounded-2xl border cursor-pointer transition-all ${filterAdmissionStatus === 'cancelled' ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-200 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-2 h-2 rounded-full ${filterAdmissionStatus === 'cancelled' ? 'bg-white' : 'bg-red-500'}`}></div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${filterAdmissionStatus === 'cancelled' ? 'text-red-100' : 'text-slate-500'}`}>Cancelled</span>
                  </div>
                  <span className="text-4xl font-black tracking-tighter">{globalStats.cancelledCount}</span>
                </div>
                <div 
                  onClick={() => setFilterAdmissionStatus(filterAdmissionStatus === 'pending' ? null : 'pending')}
                  className={`flex flex-col justify-between p-5 rounded-2xl border cursor-pointer transition-all ${filterAdmissionStatus === 'pending' ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-200 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-2 h-2 rounded-full ${filterAdmissionStatus === 'pending' ? 'bg-white' : 'bg-amber-500'}`}></div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${filterAdmissionStatus === 'pending' ? 'text-amber-100' : 'text-slate-500'}`}>Pending</span>
                  </div>
                  <span className="text-4xl font-black tracking-tighter">{globalStats.pendingCount}</span>
                </div>
                <div 
                  onClick={() => setFilterAdmissionStatus(filterAdmissionStatus === 'stay only' ? null : 'stay only')}
                  className={`flex flex-col justify-between p-5 rounded-2xl border cursor-pointer transition-all ${filterAdmissionStatus === 'stay only' ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-200 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-2 h-2 rounded-full ${filterAdmissionStatus === 'stay only' ? 'bg-white' : 'bg-blue-500'}`}></div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${filterAdmissionStatus === 'stay only' ? 'text-blue-100' : 'text-slate-500'}`}>Stay Only</span>
                  </div>
                  <span className="text-4xl font-black tracking-tighter">{globalStats.stayOnlyCount}</span>
                </div>
                <div 
                  onClick={() => setFilterAdmissionStatus(filterAdmissionStatus === 'confirm' ? null : 'confirm')}
                  className={`flex flex-col justify-between p-5 rounded-2xl border cursor-pointer transition-all ${filterAdmissionStatus === 'confirm' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-2 h-2 rounded-full ${filterAdmissionStatus === 'confirm' ? 'bg-white' : 'bg-indigo-600'}`}></div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${filterAdmissionStatus === 'confirm' ? 'text-indigo-100' : 'text-slate-500'}`}>Confirmed</span>
                  </div>
                  <span className="text-4xl font-black tracking-tighter">{globalStats.total - globalStats.cancelledCount - globalStats.pendingCount - globalStats.stayOnlyCount}</span>
                </div>
              </div>
            </div>
          </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors flex flex-col lg:col-span-1">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest transition-colors">Gender Comparison</h3>
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg">
              <button 
                onClick={() => setGenderViewType('confirm')}
                className={`px-2 py-1 text-[8px] font-black uppercase rounded-md transition-all ${genderViewType === 'confirm' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              >
                Confirm
              </button>
              <button 
                onClick={() => setGenderViewType('total')}
                className={`px-2 py-1 text-[8px] font-black uppercase rounded-md transition-all ${genderViewType === 'total' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              >
                Total
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[150px] sm:min-h-[180px]">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart 
                data={genderPieData} 
                margin={{ left: 0, right: 0, top: 20, bottom: 0 }}
                style={{ outline: 'none' }}
              >
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }}
                  dy={5}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9', opacity: 0.4 }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[10, 10, 0, 0]} 
                  barSize={32}
                  style={{ outline: 'none' }}
                  onClick={(data) => {
                    const item = data?.payload || data;
                    if (item && item.name) {
                      const name = String(item.name);
                      setFilterGender(filterGender === name ? null : name);
                    }
                  }}
                >
                  {genderPieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name.toLowerCase() === 'male' ? '#4f46e5' : entry.name.toLowerCase() === 'female' ? '#ec4899' : '#94a3b8'} 
                      opacity={filterGender && filterGender !== entry.name ? 0.3 : 1}
                      style={{ outline: 'none' }}
                    />
                  ))}
                  <LabelList 
                    dataKey="value" 
                    position="top" 
                    style={{ fontSize: '10px', fontWeight: '900', fill: '#94a3b8' }} 
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {genderPieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.name.toLowerCase() === 'male' ? '#4f46e5' : entry.name.toLowerCase() === 'female' ? '#ec4899' : '#94a3b8' }}></div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{entry.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">{entry.percentage}%</span>
                  <span className="text-[10px] font-black text-slate-800 dark:text-slate-200">{entry.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors lg:col-span-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Admission Explorer
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <button 
                  onClick={() => {
                    setDrillLevel('year');
                    setDrillContext({});
                  }}
                  className={`text-[9px] font-black uppercase tracking-wider ${drillLevel === 'year' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  All Years
                </button>
                {drillContext.year && (
                  <>
                    <span className="text-slate-300 text-[8px]">/</span>
                    <button 
                      onClick={() => {
                        setDrillLevel('month');
                        setDrillContext({ year: drillContext.year });
                      }}
                      className={`text-[9px] font-black uppercase tracking-wider ${drillLevel === 'month' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {drillContext.year}
                    </button>
                  </>
                )}
                {drillContext.month && (
                  <>
                    <span className="text-slate-300 text-[8px]">/</span>
                    <button 
                      onClick={() => {
                        setDrillLevel('week');
                        setDrillContext({ year: drillContext.year, month: drillContext.month });
                      }}
                      className={`text-[9px] font-black uppercase tracking-wider ${drillLevel === 'week' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {format(drillContext.month, 'MMMM')}
                    </button>
                  </>
                )}
                {drillContext.week && (
                  <>
                    <span className="text-slate-300 text-[8px]">/</span>
                    <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600">
                      Week {format(drillContext.week, 'w')}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDrillLevel('custom')}
                className={`px-4 py-2 text-[9px] font-black uppercase rounded-xl transition-all ${
                  drillLevel === 'custom' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100'
                }`}
              >
                Custom Range
              </button>
              {drillLevel !== 'year' && drillLevel !== 'custom' && (
                <button
                  onClick={() => {
                    if (drillLevel === 'day') setDrillLevel('week');
                    else if (drillLevel === 'week') setDrillLevel('month');
                    else if (drillLevel === 'month') setDrillLevel('year');
                  }}
                  className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-slate-100 transition-all"
                >
                  <ArrowLeft size={14} />
                </button>
              )}
            </div>
          </div>

          <div 
            ref={chartContainerRef}
            className="h-[400px] w-full overflow-x-auto custom-scrollbar pb-2"
          >
            <div style={{ 
              minWidth: drillLevel === 'year' ? '100%' : Math.max(600, admChartData.length * (admChartData.length > 100 ? 15 : 25)), 
              height: '100%' 
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={admChartData} 
                  margin={{ top: 40, right: 20, left: 0, bottom: 20 }}
                  barSize={admChartData.length > 100 ? 6 : (admChartData.length > 50 ? 10 : 20)}
                  barGap={1}
                  style={{ outline: 'none' }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" strokeOpacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 9, fontWeight: 800, fill: '#94a3b8'}} 
                    dy={10}
                    interval={admChartData.length > 500 ? 30 : (admChartData.length > 200 ? 15 : (admChartData.length > 50 ? 7 : 0))}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 9, fontWeight: 800, fill: '#94a3b8'}} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9', opacity: 0.4 }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-800 animate-in zoom-in-95 duration-200">
                            <p className="text-[10px] font-black uppercase tracking-wider mb-2 text-slate-400">{label}</p>
                            <div className="space-y-1">
                              {payload.map((p: any) => (
                                <div key={p.name} className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.fill }}></div>
                                    <span className="text-[9px] font-bold text-slate-300">{p.name}</span>
                                  </div>
                                  <span className="text-[10px] font-black">{p.value}</span>
                                </div>
                              ))}
                              <div className="pt-1 mt-1 border-t border-slate-800 flex items-center justify-between gap-4">
                                <span className="text-[9px] font-bold text-slate-400">Total</span>
                                <span className="text-[10px] font-black text-indigo-400">{payload.reduce((acc: number, p: any) => acc + p.value, 0)}</span>
                              </div>
                            </div>
                            {drillLevel !== 'day' && drillLevel !== 'custom' && (
                              <p className="text-[8px] font-bold text-indigo-400 mt-2 italic">Click to drill down</p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle"
                    wrapperStyle={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '20px' }}
                  />
                  <Bar 
                    dataKey="confirmed" 
                    name="Confirmed"
                    fill="#4f46e5" 
                    stackId="a"
                    className="cursor-pointer"
                    style={{ outline: 'none' }}
                    onClick={(data) => handleDrillDown(data)}
                  />
                  <Bar 
                    dataKey="pending" 
                    name="Pending"
                    fill="#94a3b8" 
                    stackId="a"
                    className="cursor-pointer"
                    style={{ outline: 'none' }}
                    onClick={(data) => handleDrillDown(data)}
                  />
                  <Bar 
                    dataKey="cancelled" 
                    name="Cancelled"
                    fill="#ef4444" 
                    stackId="a"
                    radius={[2, 2, 0, 0]}
                    className="cursor-pointer"
                    style={{ outline: 'none' }}
                    onClick={(data) => handleDrillDown(data)}
                  >
                    {admChartData.length < 100 && (
                      <LabelList 
                        dataKey="total" 
                        position="top" 
                        style={{ fontSize: '9px', fontWeight: '900', fill: '#94a3b8' }} 
                        formatter={(val: any) => (Number(val) > 0 ? val : '')}
                      />
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {drillLevel === 'custom' && (
            <div className="mt-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-slate-400 uppercase ml-1">Start Date</span>
                <input 
                  type="date" 
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-slate-400 uppercase ml-1">End Date</span>
                <input 
                  type="date" 
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <button 
                onClick={() => {
                  setDrillLevel('year');
                  setDrillContext({});
                }}
                className="mt-4 px-3 py-1.5 text-[9px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-all"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* REGIONAL & AGE DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">State Distribution</h3>
            {filterState && (
              <button onClick={() => setFilterState(null)} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View All</button>
            )}
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
            {stateDistribution.map((item, idx) => (
              <div 
                key={item.name} 
                onClick={() => setFilterState(filterState === item.name ? null : item.name)}
                className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${filterState === item.name ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-2">
                    <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{item.count}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-700" 
                      style={{ width: `${(item.count / (stateDistribution[0]?.count || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">City Distribution</h3>
            {filterCity && (
              <button onClick={() => setFilterCity(null)} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View All</button>
            )}
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
            {cityDistribution.map((item, idx) => (
              <div 
                key={item.name} 
                onClick={() => setFilterCity(filterCity === item.name ? null : item.name)}
                className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${filterCity === item.name ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-2">
                    <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{item.count}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700" 
                      style={{ width: `${(item.count / (cityDistribution[0]?.count || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Age Distribution</h3>
            {filterAgeRange && (
              <button onClick={() => setFilterAgeRange(null)} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View All</button>
            )}
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
            {ageDistribution.map((item, idx) => (
              <div 
                key={item.name} 
                onClick={() => setFilterAgeRange(filterAgeRange === item.name ? null : item.name)}
                className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${filterAgeRange === item.name ? 'bg-violet-50 dark:bg-violet-900/30' : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-2">
                    <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                    <span className="text-violet-600 dark:text-violet-400">{item.count}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-violet-500 rounded-full transition-all duration-700" 
                      style={{ width: `${(item.count / (Math.max(...ageDistribution.map(a => a.count)) || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[500px] transition-colors">
          <div className="px-4 md:px-8 py-6 border-b border-slate-50 dark:border-slate-800/50 flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-800/20 transition-colors">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest transition-colors">Master Cloud Records</h3>
                  <div className="relative group w-full sm:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-3 w-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Search records..."
                      value={dashboardSearchQuery}
                      onChange={(e) => setDashboardSearchQuery(e.target.value)}
                      className="block w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm dark:text-slate-100 dark:placeholder-slate-600"
                    />
                  </div>
                  <button 
                    onClick={() => setIsMasterViewOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    Master View
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow-sm">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Page {currentPage} of {totalPages || 1}</span>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow-sm dark:shadow-none transition-colors">{sortedMasterData.length} Records</span>
                </div>
              </div>

              {/* Filter Bar (YouTube Style) */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative" ref={filterMenuRef}>
                  <button 
                    onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="4" x2="14" y2="4"/><line x1="10" y1="4" x2="3" y2="4"/><line x1="21" y1="12" x2="12" y2="12"/><line x1="8" y1="12" x2="3" y2="12"/><line x1="21" y1="20" x2="16" y2="20"/><line x1="12" y1="20" x2="3" y2="20"/><line x1="14" y1="2" x2="14" y2="6"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="16" y1="18" x2="16" y2="22"/></svg>
                    <span>Add Filter</span>
                    {activeFilters.length > 0 && (
                      <span className="w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                        {activeFilters.length}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {isFilterMenuOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="fixed inset-0 sm:absolute sm:inset-auto sm:left-0 sm:mt-2 w-full sm:w-64 h-full sm:h-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 sm:rounded-2xl shadow-2xl z-[100] overflow-hidden flex flex-col"
                      >
                        {/* Mobile Header */}
                        <div className="sm:hidden p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Filters</h3>
                          <button onClick={() => setIsFilterMenuOpen(false)} className="p-2 text-slate-400">
                            <X size={20} />
                          </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                          {!selectedFilterType ? (
                            <div className="py-2 sm:py-2 p-4 sm:p-0">
                              {FILTER_CONFIG.map(config => (
                                <button 
                                  key={config.id}
                                  onClick={() => setSelectedFilterType(config.id)}
                                  className="w-full text-left px-4 py-4 sm:py-2 text-[11px] sm:text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-colors uppercase tracking-widest flex justify-between items-center border-b sm:border-none border-slate-50 dark:border-slate-700 last:border-none"
                                >
                                  {config.label}
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="py-2 p-4 sm:p-0">
                              <button 
                                onClick={() => setSelectedFilterType(null)}
                                className="w-full text-left px-4 py-4 sm:py-2 text-[10px] sm:text-[9px] font-black text-indigo-600 border-b border-slate-100 dark:border-slate-700 mb-2 flex items-center gap-2"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                Back to Filters
                              </button>

                              <div className="px-4 py-2 space-y-2">
                                {selectedFilterType === 'age' && (
                                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 space-y-2">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Custom Range</p>
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="number" 
                                        placeholder="Min"
                                        value={customAgeMin}
                                        onChange={(e) => setCustomAgeMin(e.target.value)}
                                        className="w-full px-2 py-2 sm:py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] sm:text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                      />
                                      <span className="text-slate-300">-</span>
                                      <input 
                                        type="number" 
                                        placeholder="Max"
                                        value={customAgeMax}
                                        onChange={(e) => setCustomAgeMax(e.target.value)}
                                        className="w-full px-2 py-2 sm:py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] sm:text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                      />
                                      <button 
                                        onClick={() => {
                                          if (customAgeMin || customAgeMax) {
                                            addFilter('age', `${customAgeMin || 0}-${customAgeMax || 100}`);
                                            setCustomAgeMin('');
                                            setCustomAgeMax('');
                                            setIsFilterMenuOpen(false);
                                          }
                                        }}
                                        className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {selectedFilterType === 'payment_amount' && (
                                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 space-y-2">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Custom Range</p>
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="number" 
                                        placeholder="Min"
                                        value={customPaymentMin}
                                        onChange={(e) => setCustomPaymentMin(e.target.value)}
                                        className="w-full px-2 py-2 sm:py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] sm:text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                      />
                                      <span className="text-slate-300">-</span>
                                      <input 
                                        type="number" 
                                        placeholder="Max"
                                        value={customPaymentMax}
                                        onChange={(e) => setCustomPaymentMax(e.target.value)}
                                        className="w-full px-2 py-2 sm:py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] sm:text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                      />
                                      <button 
                                        onClick={() => {
                                          if (customPaymentMin || customPaymentMax) {
                                            addFilter('payment_amount', `${customPaymentMin || 0}-${customPaymentMax || 100000}`);
                                            setCustomPaymentMin('');
                                            setCustomPaymentMax('');
                                            setIsFilterMenuOpen(false);
                                          }
                                        }}
                                        className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {selectedFilterType === 'remaining_amount' && (
                                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 space-y-2">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Custom Range</p>
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="number" 
                                        placeholder="Min"
                                        value={customRemainingMin}
                                        onChange={(e) => setCustomRemainingMin(e.target.value)}
                                        className="w-full px-2 py-2 sm:py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] sm:text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                      />
                                      <span className="text-slate-300">-</span>
                                      <input 
                                        type="number" 
                                        placeholder="Max"
                                        value={customRemainingMax}
                                        onChange={(e) => setCustomRemainingMax(e.target.value)}
                                        className="w-full px-2 py-2 sm:py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] sm:text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                      />
                                      <button 
                                        onClick={() => {
                                          if (customRemainingMin || customRemainingMax) {
                                            addFilter('remaining_amount', `${customRemainingMin || 0}-${customRemainingMax || 100000}`);
                                            setCustomRemainingMin('');
                                            setCustomRemainingMax('');
                                            setIsFilterMenuOpen(false);
                                          }
                                        }}
                                        className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {selectedFilterType === 'date_range' && (
                                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 space-y-2">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Select Date Range</p>
                                    <div className="flex flex-col gap-2">
                                      <div className="flex items-center gap-2">
                                        <input 
                                          type="date" 
                                          value={customDateStart}
                                          onChange={(e) => setCustomDateStart(e.target.value)}
                                          className="w-full px-2 py-2 sm:py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] sm:text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                        <span className="text-slate-300">to</span>
                                        <input 
                                          type="date" 
                                          value={customDateEnd}
                                          onChange={(e) => setCustomDateEnd(e.target.value)}
                                          className="w-full px-2 py-2 sm:py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] sm:text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                      </div>
                                      <button 
                                        onClick={() => {
                                          if (customDateStart && customDateEnd) {
                                            const start = format(new Date(customDateStart), 'dd-MM-yyyy');
                                            const end = format(new Date(customDateEnd), 'dd-MM-yyyy');
                                            addFilter('date_range', `${start} to ${end}`);
                                            setCustomDateStart('');
                                            setCustomDateEnd('');
                                            setIsFilterMenuOpen(false);
                                          }
                                        }}
                                        className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors"
                                      >
                                        Apply Range
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {selectedFilterType === 'pre_marks' && (
                                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 space-y-2">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pre Workshop Marks Range</p>
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="number" 
                                        placeholder="Min"
                                        value={customPreMarksMin}
                                        onChange={(e) => setCustomPreMarksMin(e.target.value)}
                                        className="w-full px-2 py-2 sm:py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] sm:text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                      />
                                      <span className="text-slate-300">-</span>
                                      <input 
                                        type="number" 
                                        placeholder="Max"
                                        value={customPreMarksMax}
                                        onChange={(e) => setCustomPreMarksMax(e.target.value)}
                                        className="w-full px-2 py-2 sm:py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] sm:text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                      />
                                      <button 
                                        onClick={() => {
                                          if (customPreMarksMin || customPreMarksMax) {
                                            addFilter('pre_marks', `${customPreMarksMin || 0}-${customPreMarksMax || 100}`);
                                            setCustomPreMarksMin('');
                                            setCustomPreMarksMax('');
                                            setIsFilterMenuOpen(false);
                                          }
                                        }}
                                        className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {selectedFilterType === 'post_marks' && (
                                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 space-y-2">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Post Workshop Marks Range</p>
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="number" 
                                        placeholder="Min"
                                        value={customPostMarksMin}
                                        onChange={(e) => setCustomPostMarksMin(e.target.value)}
                                        className="w-full px-2 py-2 sm:py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] sm:text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                      />
                                      <span className="text-slate-300">-</span>
                                      <input 
                                        type="number" 
                                        placeholder="Max"
                                        value={customPostMarksMax}
                                        onChange={(e) => setCustomPostMarksMax(e.target.value)}
                                        className="w-full px-2 py-2 sm:py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] sm:text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                      />
                                      <button 
                                        onClick={() => {
                                          if (customPostMarksMin || customPostMarksMax) {
                                            addFilter('post_marks', `${customPostMarksMin || 0}-${customPostMarksMax || 100}`);
                                            setCustomPostMarksMin('');
                                            setCustomPostMarksMax('');
                                            setIsFilterMenuOpen(false);
                                          }
                                        }}
                                        className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {selectedFilterType !== 'age' && selectedFilterType !== 'payment_amount' && selectedFilterType !== 'date_range' && selectedFilterType !== 'pre_marks' && selectedFilterType !== 'post_marks' && (
                                  <div className="max-h-[60vh] sm:max-h-48 overflow-y-auto custom-scrollbar">
                                    {(FILTER_CONFIG.find(c => c.id === selectedFilterType)?.dynamic 
                                      ? (dynamicOptions as any)[selectedFilterType] 
                                      : FILTER_CONFIG.find(c => c.id === selectedFilterType)?.options
                                    )?.map((opt: string) => (
                                      <button 
                                        key={opt}
                                        onClick={() => {
                                          addFilter(selectedFilterType, opt);
                                          setIsFilterMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-4 sm:py-2 text-[11px] sm:text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 transition-colors uppercase tracking-tight border-b sm:border-none border-slate-50 dark:border-slate-700 last:border-none"
                                      >
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Mobile Footer */}
                        <div className="sm:hidden p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex gap-4">
                          <button 
                            onClick={clearFilters}
                            className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400"
                          >
                            Reset
                          </button>
                          <button 
                            onClick={() => setIsFilterMenuOpen(false)}
                            className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none"
                          >
                            Close
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {activeFilters.map((filter, idx) => (
                  <div 
                    key={`${filter.key}-${filter.value}-${idx}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-full text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest animate-in zoom-in duration-200"
                  >
                    {filter.label}
                    <button 
                      onClick={() => removeFilter(filter.key, filter.value)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}

                {activeFilters.length > 0 && (
                  <button 
                    onClick={clearFilters}
                    className="text-[9px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest ml-2 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
          </div>
          <div className="overflow-x-auto grow">
              {/* Desktop Table */}
              <table className="w-full text-left hidden md:table">
                  <thead>
                  <tr className="border-b border-slate-50 dark:border-slate-800/50">
                      <th 
                        onClick={() => requestSort('admission_id')}
                        className="px-4 md:px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          Admission ID
                          {sortConfig?.key === 'admission_id' && (
                            <span className="text-indigo-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => requestSort('payment1_date')}
                        className="px-4 md:px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          Date
                          {sortConfig?.key === 'payment1_date' && (
                            <span className="text-indigo-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => requestSort('name')}
                        className="px-4 md:px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          Student Name
                          {sortConfig?.key === 'name' && (
                            <span className="text-indigo-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => requestSort('state')}
                        className="px-4 md:px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors hidden sm:table-cell"
                      >
                        <div className="flex items-center gap-1">
                          State
                          {sortConfig?.key === 'state' && (
                            <span className="text-indigo-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => requestSort('status')}
                        className="px-4 md:px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          Admission Status
                          {sortConfig?.key === 'status' && (
                            <span className="text-indigo-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => requestSort('payment_status')}
                        className="px-4 md:px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          Payment Status
                          {sortConfig?.key === 'payment_status' && (
                            <span className="text-indigo-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => requestSort('notes')}
                        className="px-4 md:px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors hidden lg:table-cell"
                      >
                        <div className="flex items-center gap-1">
                          Notes
                          {sortConfig?.key === 'notes' && (
                            <span className="text-indigo-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-4 md:px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-wider text-right">Action</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {paginatedData.map((data, idx) => (
                      <tr key={data.admission_id || idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-4 md:px-8 py-4">
                          <button 
                            onClick={() => setViewingRecord(data)}
                            className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50 active:scale-95 transition-all outline-none"
                          >
                            {data.admission_id || 'N/A'}
                          </button>
                      </td>
                      <td className="px-4 md:px-8 py-4">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{formatDateClean(data.payment1_date)}</span>
                      </td>
                      <td className="px-4 md:px-8 py-4">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight transition-colors">{data.name}</span>
                      </td>
                      <td className="px-4 md:px-8 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-600 uppercase transition-colors hidden sm:table-cell">{data.state || '—'}</td>
                      <td className="px-4 md:px-8 py-4">
                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-md ${
                            data.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 
                            data.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                            'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                          }`}>
                            {data.status}
                          </span>
                      </td>
                      <td className="px-4 md:px-8 py-4">
                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-md ${
                            data.payment_status === 'full paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 
                            data.payment_status === 'partial' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                            data.payment_status === 'unpaid' ? 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400' :
                            'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
                          }`}>
                            {data.payment_status || 'unpaid'}
                          </span>
                      </td>
                      <td className="px-4 md:px-8 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-600 uppercase transition-colors hidden lg:table-cell max-w-[150px] truncate">
                        {data.notes || '—'}
                      </td>
                      <td className="px-4 md:px-8 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {onEdit && (
                              <button 
                                onClick={() => onEdit(data)}
                                className="p-2 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white transition-all active:scale-90 shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                              </button>
                            )}
                            <button onClick={() => setViewingStudentForm(data)} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-xl hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all active:scale-90 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 shadow-sm dark:shadow-none transition-colors" title="Student Form View">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                            </button>
                            <button onClick={() => setViewingRecord(data)} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white transition-all active:scale-90 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shadow-sm dark:shadow-none transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            {onDelete && (
                              <button 
                                onClick={() => {
                                  const firestoreId = records.find(r => r.data?.admission_id === data.admission_id)?.id;
                                  onDelete(firestoreId || '', data.admission_id);
                                  // Update local remoteData state
                                  setRemoteData(prev => prev.filter(r => r.admission_id !== data.admission_id));
                                }}
                                className="p-2 bg-red-50 dark:bg-red-900/20 text-red-400 dark:text-red-600 rounded-xl hover:bg-red-600 dark:hover:bg-red-500 hover:text-white transition-all active:scale-90 shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800"
                                title="Delete Record"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                              </button>
                            )}
                          </div>
                      </td>
                      </tr>
                  ))}
                  </tbody>
              </table>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 p-4">
                {paginatedData.map((data, idx) => (
                  <div 
                    key={data.admission_id || idx}
                    onClick={() => setViewingRecord(data)}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm active:scale-[0.98] transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded w-fit">
                          {data.admission_id || 'N/A'}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{data.name}</h4>
                      </div>
                      <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-md ${
                        data.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 
                        data.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                        'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                      }`}>
                        {data.status}
                      </span>
                      <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-md ${
                        data.payment_status === 'full paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 
                        data.payment_status === 'partial' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                        data.payment_status === 'unpaid' ? 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400' :
                        'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
                      }`}>
                        {data.payment_status || 'unpaid'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-800">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-500">
                          <MapPin size={12} />
                          <span className="text-[10px] font-bold uppercase">{data.state || 'Unknown'}</span>
                        </div>
                        {data.pre_workshop_marks && data.post_workshop_marks && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Improvement:</span>
                            <span className={`px-1.5 py-0.5 text-[8px] font-black rounded ${parseFloat(data.post_workshop_marks) - parseFloat(data.pre_workshop_marks) >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {parseFloat(data.post_workshop_marks) - parseFloat(data.pre_workshop_marks) >= 0 ? '+' : ''}
                              {parseFloat(data.post_workshop_marks) - parseFloat(data.pre_workshop_marks)}%
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setViewingStudentForm(data); }}
                          className="p-2 text-slate-400 hover:text-black"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                        </button>
                        {onEdit && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onEdit(data); }}
                            className="p-2 text-slate-400 hover:text-indigo-600"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        {onDelete && (
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              const firestoreId = records.find(r => r.data?.admission_id === data.admission_id)?.id;
                              onDelete(firestoreId || '', data.admission_id);
                              // Update local remoteData state
                              setRemoteData(prev => prev.filter(r => r.admission_id !== data.admission_id));
                            }}
                            className="p-2 text-red-400 hover:text-red-600"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          </button>
                        )}
                        <ChevronRight size={16} className="text-slate-300" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : currentView === 'states' ? (
        <AnalyticsView 
          title="States Analytics" 
          data={hierarchicalStats.states} 
          type="states" 
          onBack={() => setCurrentView('dashboard')} 
        />
      ) : currentView === 'cities' ? (
        <AnalyticsView 
          title="Cities Analytics" 
          data={hierarchicalStats.cities} 
          type="cities" 
          onBack={() => setCurrentView('dashboard')} 
        />
      ) : (
        <AnalyticsView 
          title="Admissions Analytics" 
          data={hierarchicalStats.admissions} 
          type="admissions" 
          onBack={() => setCurrentView('dashboard')} 
        />
      )}

      {/* DETAIL MODAL */}
      {viewingRecord && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-slate-900/80 dark:bg-black/90 backdrop-blur-md sm:p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl sm:rounded-[32px] rounded-t-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800 flex flex-col h-[95vh] sm:h-auto sm:max-h-[90vh]">
                {/* Header - Fixed */}
                <div className="p-4 md:p-6 border-b border-slate-50 dark:border-slate-800/50 flex justify-between items-center bg-white dark:bg-slate-900 transition-colors">
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
                <div className="overflow-y-auto grow custom-scrollbar bg-slate-50/30 dark:bg-slate-900/50">
                  <div ref={modalRef} className="bg-white dark:bg-slate-900 p-4 md:p-10">
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
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-8 mb-10">
                        <div>
                          <h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{viewingRecord.name}</h2>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-md tracking-widest uppercase">{viewingRecord.admission_id}</span>
                            <span className={`px-2 py-1 text-[10px] font-black rounded-md tracking-widest uppercase ${
                              viewingRecord.status === 'confirm' ? 'bg-emerald-100 text-emerald-700' : 
                              viewingRecord.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                              'bg-red-100 text-red-700'
                            }`}>
                              {viewingRecord.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-left md:text-right flex flex-col items-start md:items-end gap-4">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Registration Date</p>
                            <p className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-200">{formatDateClean(viewingRecord.payment1_date)}</p>
                          </div>
                          {/* QR Code Hidden from UI but kept for Download Functionality */}
                          <div className="absolute opacity-0 pointer-events-none -z-10 overflow-hidden" style={{ width: '1px', height: '1px' }}>
                            <div id="student-qr-code-container" className="bg-white p-6 rounded-2xl inline-flex flex-col items-center gap-3">
                              <p className="text-[14px] font-black text-slate-900 uppercase tracking-widest">{viewingRecord.admission_id}</p>
                              <QRCodeSVG 
                                value={generateQRData(viewingRecord)}
                                size={200}
                                level="H"
                                includeMargin={false}
                              />
                              <p className="text-[14px] font-black text-slate-900 uppercase tracking-tight text-center max-w-[200px]">{viewingRecord.name}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Grid Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-2 mb-10">
                        <DetailRow label="Gender" value={viewingRecord.gender} />
                        <DetailRow label="Age" value={viewingRecord.age} />
                        <DetailRow label="Qualification" value={viewingRecord.qualification} />
                        <DetailRow label="Medium" value={viewingRecord.medium} />
                        <DetailRow label="Contact Number" value={viewingRecord.contact_no} />
                        <DetailRow label="WhatsApp Number" value={viewingRecord.whatsapp_no} />
                        <DetailRow label="State / UT" value={viewingRecord.state} />
                        <DetailRow label="City" value={viewingRecord.city} />
                        <DetailRow label="Total Fees" value={`₹${viewingRecord.total_fees}`} />
                        <DetailRow label="Discount Applied" value={`₹${viewingRecord.discount}`} />
                        <DetailRow label="Free" value={`₹${viewingRecord.free}`} />
                        {viewingRecord.refund_date && (
                          <DetailRow label="Refund Date" value={formatDateClean(viewingRecord.refund_date)} />
                        )}
                        {viewingRecord.notes && (
                          <div className="sm:col-span-2 mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Notes</p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{viewingRecord.notes}</p>
                          </div>
                        )}
                        
                        <div className="sm:col-span-2 mt-6 p-6 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/20">
                          <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            Inaugural Day Status
                          </h4>
                          <div className="flex items-center gap-4">
                            <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                              viewingRecord.arrival_status === 'arrived' 
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                : viewingRecord.arrival_status === 'arrived_cancelled'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {viewingRecord.arrival_status === 'arrived' ? 'Arrived' : viewingRecord.arrival_status === 'arrived_cancelled' ? 'Arrived & Cancelled' : 'Not Arrived'}
                            </div>
                          </div>
                        </div>

                        {(viewingRecord.pre_workshop_marks || viewingRecord.post_workshop_marks) && (
                          <div className="sm:col-span-2 mt-6 p-6 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
                            <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              Workshop Performance
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 items-center">
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pre Workshop</p>
                                <p className="text-xl font-black text-slate-900 dark:text-white">{viewingRecord.pre_workshop_marks || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Post Workshop</p>
                                <p className="text-xl font-black text-slate-900 dark:text-white">{viewingRecord.post_workshop_marks || 'N/A'}</p>
                              </div>
                              {viewingRecord.pre_workshop_marks && viewingRecord.post_workshop_marks && (
                                <div className="col-span-2 sm:col-span-1 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                                  <p className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Improvement</p>
                                  <p className={`text-lg font-black ${parseFloat(viewingRecord.post_workshop_marks) - parseFloat(viewingRecord.pre_workshop_marks) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {parseFloat(viewingRecord.post_workshop_marks) - parseFloat(viewingRecord.pre_workshop_marks) >= 0 ? '+' : ''}
                                    {parseFloat(viewingRecord.post_workshop_marks) - parseFloat(viewingRecord.pre_workshop_marks)}%
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
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
                            const utr = (viewingRecord as any)[`payment${num}_utr`];
                            const rawMethod = (viewingRecord as any)[`payment${num}_method`];
                            
                            // Inference logic for detail view
                            const getMethod = (u: any, m: any) => {
                              if (m === 'cash' || m === 'account') return m;
                              const s = String(u || '').trim();
                              if (!s) return 'account';
                              if (/^\d{12}$/.test(s)) return 'account';
                              return 'cash';
                            };
                            
                            const method = getMethod(utr, rawMethod);
                            
                            if (!amt || amt === '0') return null;
                            return (
                              <div key={num} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Installment {num}</p>
                                    <span className={`px-1.5 py-0.5 text-[7px] font-black uppercase rounded ${method === 'cash' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>
                                      {method}
                                    </span>
                                  </div>
                                  <p className="text-sm font-black text-slate-900 dark:text-white">₹{amt}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[9px] font-bold text-slate-500">{formatDateClean((viewingRecord as any)[`payment${num}_date`] || '')}</p>
                                  <p className="text-[8px] font-mono text-indigo-500 font-bold">
                                    <span className="text-slate-400 mr-1">{method === 'cash' ? 'RECEIVED BY:' : 'UTR:'}</span>
                                    {utr}
                                  </p>
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
                      onClick={handleDownloadQR}
                      className="flex-1 flex items-center justify-center gap-3 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-95"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><rect x="7" y="7" width="3" height="3"/><rect x="14" y="7" width="3" height="3"/><rect x="7" y="14" width="3" height="3"/><path d="M14 14h3v3h-3z"/></svg>
                      Download QR
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

      {/* SCANNER RESULT MODAL (SIMPLE VIEW) */}
      {scannerResult && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Zap size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Scan Result</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quick Student Info</p>
                </div>
              </div>
              <button 
                onClick={() => setScannerResult(null)}
                className="p-2 text-slate-400 hover:text-red-500 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-1">
              <div className="flex justify-between items-center mb-6">
                <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-lg tracking-widest uppercase">{scannerResult.admission_id}</span>
                <span className={`px-3 py-1 text-[10px] font-black rounded-lg tracking-widest uppercase ${
                  scannerResult.status === 'confirm' ? 'bg-emerald-100 text-emerald-700' : 
                  scannerResult.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                  'bg-red-100 text-red-700'
                }`}>
                  {scannerResult.status}
                </span>
              </div>

              <div className="space-y-4">
                <div className="pb-4 border-b border-slate-50 dark:border-slate-800/50">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Student Name</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{scannerResult.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">State</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase">{scannerResult.state}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Status</p>
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase">{scannerResult.payment_status || 'UNPAID'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Gender</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase">{scannerResult.gender}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Age</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{scannerResult.age}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Contact</p>
                    <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">{scannerResult.contact_no}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">WhatsApp</p>
                    <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">{scannerResult.whatsapp_no}</p>
                  </div>
                </div>

                <div className="pt-4 mt-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Arrival Status</p>
                  <div className={`inline-block px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                    scannerResult.arrival_status === 'arrived' 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                      : scannerResult.arrival_status === 'arrived_cancelled'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {scannerResult.arrival_status === 'arrived' ? 'Arrived' : scannerResult.arrival_status === 'arrived_cancelled' ? 'Arrived & Cancelled' : 'Not Arrived'}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button 
                onClick={() => {
                  if (onEdit) onEdit(scannerResult);
                  setScannerResult(null);
                }}
                className="flex-1 flex items-center justify-center gap-3 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
              >
                <Edit2 size={16} strokeWidth={3} />
                Edit Record
              </button>
              <button 
                onClick={() => setScannerResult(null)}
                className="flex-1 py-4 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-slate-50 transition-all active:scale-95"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* STUDENT PRINT FORM MODAL */}
      {viewingStudentForm && (
        <div className="fixed inset-0 z-[115] bg-black/90 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl h-full sm:h-auto sm:max-h-[95vh] flex flex-col sm:rounded-3xl shadow-2xl overflow-hidden border border-white/10">
            {/* Modal Header - Always Visible */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 backdrop-blur-sm no-print">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Student Form Preview</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{viewingStudentForm.admission_id}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleStudentFormPrint}
                  className="px-4 py-2 bg-black text-white text-[10px] font-black uppercase rounded-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  Print
                </button>
                <button 
                  onClick={handleStudentFormDownload}
                  className="px-4 py-2 bg-slate-200 text-black text-[10px] font-black uppercase rounded-xl hover:bg-slate-300 transition-all active:scale-95 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  PNG
                </button>
                <button 
                  onClick={() => setViewingStudentForm(null)}
                  className="p-2 bg-slate-100 text-slate-400 hover:text-red-500 rounded-xl transition-all active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Scrollable Form Content */}
            <div className="overflow-y-auto grow p-4 sm:p-12 bg-slate-100/30 custom-scrollbar">
              <div 
                ref={studentFormRef} 
                className="bg-white text-black font-sans p-12 border-[4px] border-black shadow-2xl mx-auto w-[794px] min-h-[1123px] flex flex-col box-border"
                style={{ width: '794px', minHeight: '1123px' }}
              >
                {/* Form Header */}
                <div className="flex justify-between items-start border-b-[4px] border-black pb-8 mb-10">
                  <div className="flex flex-col gap-4">
                    <div className="h-12 flex items-center">
                      <img 
                        src="https://englishhouseacademy.in/wp-content/uploads/2022/03/187-X-43-px-EHA-LOGO-PNG.png" 
                        alt="EHA Logo" 
                        className="h-10 object-contain grayscale brightness-0"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">STUDENT ADMISSION</h1>
                      <p className="text-lg font-bold tracking-[0.4em] uppercase text-slate-500 mt-1">OFFICIAL RECORD</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col gap-6">
                    <div>
                      <p className="text-[12px] font-black uppercase text-black tracking-widest mb-1">Admission ID</p>
                      <p className="text-2xl font-black bg-black text-white px-4 py-1 rounded-lg inline-block">{viewingStudentForm.admission_id}</p>
                    </div>
                    <div>
                      <p className="text-[12px] font-black uppercase text-black tracking-widest mb-1">Registration Date</p>
                      <p className="text-xl font-black">{formatDateClean(viewingStudentForm.payment1_date)}</p>
                    </div>
                    <div className="mt-2 flex flex-col items-end gap-1">
                      <QRCodeSVG 
                        value={generateQRData(viewingStudentForm)}
                        size={100}
                        level="H"
                        includeMargin={false}
                        className="qr-code"
                      />
                      <p className="text-[8px] font-black uppercase text-black tracking-tight text-right">{viewingStudentForm.name}</p>
                    </div>
                  </div>
                </div>
                
                {/* Student Info Grid */}
                <div className="grid grid-cols-2 gap-y-8 gap-x-12 mb-12">
                  <div className="col-span-2 border-b-[3px] border-black pb-3">
                    <p className="text-[13px] font-black uppercase text-black tracking-[0.2em] mb-1">Student Full Name</p>
                    <p className="text-3xl font-black uppercase tracking-tight">{viewingStudentForm.name}</p>
                  </div>
                  
                  <div className="border-b-[2px] border-black pb-1">
                    <p className="text-[12px] font-black uppercase text-black tracking-widest mb-1">Gender</p>
                    <p className="text-xl font-black uppercase">{viewingStudentForm.gender}</p>
                  </div>
                  <div className="border-b-[2px] border-black pb-1">
                    <p className="text-[12px] font-black uppercase text-black tracking-widest mb-1">Age</p>
                    <p className="text-xl font-black uppercase">{viewingStudentForm.age}</p>
                  </div>
                  
                  <div className="border-b-[2px] border-black pb-1">
                    <p className="text-[12px] font-black uppercase text-black tracking-widest mb-1">Qualification</p>
                    <p className="text-xl font-black uppercase">{viewingStudentForm.qualification}</p>
                  </div>
                  <div className="border-b-[2px] border-black pb-1">
                    <p className="text-[12px] font-black uppercase text-black tracking-widest mb-1">Medium</p>
                    <p className="text-xl font-black uppercase">{viewingStudentForm.medium}</p>
                  </div>
                  
                  <div className="border-b-[2px] border-black pb-1">
                    <p className="text-[12px] font-black uppercase text-black tracking-widest mb-1">Contact Number</p>
                    <p className="text-xl font-black uppercase">{viewingStudentForm.contact_no}</p>
                  </div>
                  <div className="border-b-[2px] border-black pb-1">
                    <p className="text-[12px] font-black uppercase text-black tracking-widest mb-1">WhatsApp Number</p>
                    <p className="text-xl font-black uppercase">{viewingStudentForm.whatsapp_no}</p>
                  </div>
                  
                  <div className="border-b-[2px] border-black pb-1">
                    <p className="text-[12px] font-black uppercase text-black tracking-widest mb-1">State</p>
                    <p className="text-xl font-black uppercase">{viewingStudentForm.state}</p>
                  </div>
                  <div className="border-b-[2px] border-black pb-1">
                    <p className="text-[12px] font-black uppercase text-black tracking-widest mb-1">City</p>
                    <p className="text-xl font-black uppercase">{viewingStudentForm.city}</p>
                  </div>
                </div>
                
                {/* Fee Summary */}
                <div className="mb-12">
                  <h3 className="text-base font-black uppercase tracking-[0.3em] text-black mb-4 flex items-center gap-3">
                    FEE SUMMARY
                    <div className="flex-1 h-px bg-black"></div>
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="border-[3px] border-black p-4 flex flex-col justify-center">
                      <p className="text-[11px] font-black uppercase text-black mb-1">Total Fees</p>
                      <p className="text-xl font-black">₹{viewingStudentForm.total_fees}</p>
                    </div>
                    <div className="border-[3px] border-black p-4 flex flex-col justify-center">
                      <p className="text-[11px] font-black uppercase text-black mb-1">Discount</p>
                      <p className="text-xl font-black">₹{viewingStudentForm.discount}</p>
                    </div>
                    <div className="border-[3px] border-black p-4 flex flex-col justify-center">
                      <p className="text-[11px] font-black uppercase text-black mb-1">Free</p>
                      <p className="text-xl font-black">₹{viewingStudentForm.free || '0'}</p>
                    </div>
                    <div className="bg-black text-white p-4 flex flex-col justify-center">
                      <p className="text-[11px] font-black uppercase text-slate-300 mb-1">Balance</p>
                      <p className="text-2xl font-black">₹{viewingStudentForm.remaining_amount}</p>
                    </div>
                  </div>
                </div>
                
                {/* Notes */}
                {viewingStudentForm.notes && (
                  <div className="mb-12 border-[3px] border-black p-6">
                    <h3 className="text-base font-black uppercase tracking-[0.3em] text-black mb-4">NOTES</h3>
                    <p className="text-base font-bold text-black leading-relaxed whitespace-pre-wrap italic">"{viewingStudentForm.notes}"</p>
                  </div>
                )}

                {/* Inaugural Day Status */}
                <div className="mb-12">
                  <h3 className="text-base font-black uppercase tracking-[0.3em] text-black mb-4 flex items-center gap-3">
                    INAUGURAL DAY STATUS
                    <div className="flex-1 h-px bg-black"></div>
                  </h3>
                  <div className="border-[3px] border-black p-6">
                    <p className="text-2xl font-black uppercase tracking-widest">
                      {viewingStudentForm.arrival_status === 'arrived' ? 'ARRIVED' : viewingStudentForm.arrival_status === 'arrived_cancelled' ? 'ARRIVED & CANCELLED' : 'NOT ARRIVED'}
                    </p>
                  </div>
                </div>

                {/* Inaugural Day Status */}
                <div className="mb-12">
                  <h3 className="text-base font-black uppercase tracking-[0.3em] text-black mb-4 flex items-center gap-3">
                    INAUGURAL DAY STATUS
                    <div className="flex-1 h-px bg-black"></div>
                  </h3>
                  <div className="border-[3px] border-black p-6">
                    <p className="text-2xl font-black uppercase tracking-widest">
                      {viewingStudentForm.arrival_status === 'arrived' ? 'ARRIVED' : viewingStudentForm.arrival_status === 'arrived_cancelled' ? 'ARRIVED & CANCELLED' : 'NOT ARRIVED'}
                    </p>
                  </div>
                </div>
                
                {/* Workshop Performance */}
                {(viewingStudentForm.pre_workshop_marks || viewingStudentForm.post_workshop_marks) && (
                  <div className="mb-12">
                    <h3 className="text-base font-black uppercase tracking-[0.3em] text-black mb-4 flex items-center gap-3">
                      WORKSHOP PERFORMANCE
                      <div className="flex-1 h-px bg-black"></div>
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="border-[3px] border-black p-4 flex flex-col justify-center">
                        <p className="text-[11px] font-black uppercase text-black mb-1">Pre Workshop</p>
                        <p className="text-xl font-black">{viewingStudentForm.pre_workshop_marks || 'N/A'}</p>
                      </div>
                      <div className="border-[3px] border-black p-4 flex flex-col justify-center">
                        <p className="text-[11px] font-black uppercase text-black mb-1">Post Workshop</p>
                        <p className="text-xl font-black">{viewingStudentForm.post_workshop_marks || 'N/A'}</p>
                      </div>
                      <div className="bg-black text-white p-4 flex flex-col justify-center">
                        <p className="text-[11px] font-black uppercase text-slate-300 mb-1">Improvement</p>
                        <p className="text-2xl font-black">
                          {viewingStudentForm.pre_workshop_marks && viewingStudentForm.post_workshop_marks 
                            ? `${parseFloat(viewingStudentForm.post_workshop_marks) - parseFloat(viewingStudentForm.pre_workshop_marks) >= 0 ? '+' : ''}${parseFloat(viewingStudentForm.post_workshop_marks) - parseFloat(viewingStudentForm.pre_workshop_marks)}%`
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Installments */}
                <div className="grow">
                  <h3 className="text-base font-black uppercase tracking-[0.3em] text-black mb-4 flex items-center gap-3">
                    PAYMENT SCHEDULE
                    <div className="flex-1 h-px bg-black"></div>
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {[1, 2, 3, 4].map(num => {
                      const amt = (viewingStudentForm as any)[`payment${num}_amount`];
                      const date = (viewingStudentForm as any)[`payment${num}_date`];
                      const isPaid = amt && amt !== '0';
                      
                      return (
                        <div key={num} className={`flex border-[3px] border-black ${isPaid ? 'bg-slate-50' : ''}`}>
                          <div className="w-32 p-3 font-black text-[12px] uppercase flex items-center justify-center border-r-[3px] border-black bg-slate-100">
                            Installment {num}
                          </div>
                          <div className="flex-1 p-3 flex justify-between items-center px-8">
                            <span className="text-[11px] font-black uppercase text-black">{isPaid ? 'Amount Paid' : 'Status'}</span>
                            <span className={`text-xl font-black ${!isPaid ? 'text-slate-300' : ''}`}>{isPaid ? `₹${amt}` : 'PENDING'}</span>
                          </div>
                          <div className="w-56 p-3 flex justify-between items-center px-6 border-l-[3px] border-black">
                            <span className="text-[11px] font-black uppercase text-black">Date</span>
                            <span className={`text-base font-black ${!isPaid ? 'text-slate-300' : ''}`}>{isPaid ? formatDateClean(date) : '-- / -- / ----'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Footer Signatures */}
                <div className="mt-16 flex justify-between items-end">
                  <div className="text-center">
                    <div className="w-56 border-b-[3px] border-black mb-2"></div>
                    <p className="text-[12px] font-black uppercase tracking-widest">Student Signature</p>
                  </div>
                  <div className="text-center">
                    <div className="w-56 border-b-[3px] border-black mb-2"></div>
                    <p className="text-[12px] font-black uppercase tracking-widest">Authorized Stamp</p>
                  </div>
                </div>
                
                <div className="mt-12 pt-6 border-t border-slate-100 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-300">
                    This is a computer generated document. English House Academy &copy; 2026
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MASTER VIEW MODAL */}
      {isMasterViewOpen && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[95vh] sm:h-full sm:max-h-[90vh] rounded-t-[40px] sm:rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-white/20 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-800/20">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Master View</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Filtered Records: {sortedMasterData.length}</p>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative group flex-1 sm:flex-none">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-3 w-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Search in Master View..."
                      value={masterViewSearchQuery}
                      onChange={(e) => setMasterViewSearchQuery(e.target.value)}
                      className="block w-full sm:w-64 pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm dark:text-slate-100 dark:placeholder-slate-600"
                    />
                  </div>
                  <button 
                    onClick={() => setIsMasterViewOpen(false)}
                    className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm shrink-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
              </div>

              {/* Filter Chips in Master View */}
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {activeFilters.map((filter, idx) => (
                    <div 
                      key={`mv-${filter.key}-${filter.value}-${idx}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-full text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest"
                    >
                      {filter.label}
                      <button 
                        onClick={() => removeFilter(filter.key, filter.value)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={clearFilters}
                    className="text-[9px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest ml-2 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-4 md:p-8 bg-white dark:bg-slate-950" ref={masterViewRef}>
              {/* Desktop Table */}
              <table className="w-full border-collapse hidden md:table">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900">
                    <th className="border border-slate-200 dark:border-slate-800 p-3 text-[10px] font-black uppercase tracking-widest text-slate-500">S.No</th>
                    <th className="border border-slate-200 dark:border-slate-800 p-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Date</th>
                    <th className="border border-slate-200 dark:border-slate-800 p-3 text-[10px] font-black uppercase tracking-widest text-slate-500">ID</th>
                    <th className="border border-slate-200 dark:border-slate-800 p-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Name</th>
                    <th className="border border-slate-200 dark:border-slate-800 p-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Contact</th>
                    <th className="border border-slate-200 dark:border-slate-800 p-3 text-[10px] font-black uppercase tracking-widest text-slate-500">WhatsApp</th>
                    <th className="border border-slate-200 dark:border-slate-800 p-3 text-[10px] font-black uppercase tracking-widest text-slate-500">State</th>
                    <th className="border border-slate-200 dark:border-slate-800 p-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                    <th className="border border-slate-200 dark:border-slate-800 p-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Paid</th>
                    <th className="border border-slate-200 dark:border-slate-800 p-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Discount</th>
                    <th className="border border-slate-200 dark:border-slate-800 p-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Free</th>
                    <th className="border border-slate-200 dark:border-slate-800 p-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMasterData.map((data, idx) => {
                    let studentTotal = 0;
                    for (let i = 1; i <= 10; i++) {
                      studentTotal += parseFloat(String((data as any)[`payment${i}_amount`]).replace(/[^0-9.]/g, '')) || 0;
                    }
                    return (
                      <tr key={data.admission_id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="border border-slate-200 dark:border-slate-800 p-3 text-[10px] font-bold text-slate-700 dark:text-slate-300">{idx + 1}</td>
                        <td className="border border-slate-200 dark:border-slate-800 p-3 text-[10px] font-bold text-slate-700 dark:text-slate-300">{formatDateClean(data.payment1_date)}</td>
                        <td className="border border-slate-200 dark:border-slate-800 p-3 text-[10px] font-bold text-slate-700 dark:text-slate-300">{data.admission_id}</td>
                        <td className="border border-slate-200 dark:border-slate-800 p-3 text-[10px] font-black uppercase text-slate-900 dark:text-slate-100">{data.name}</td>
                        <td className="border border-slate-200 dark:border-slate-800 p-3 text-[10px] font-mono font-bold text-slate-500">{data.contact_no}</td>
                        <td className="border border-slate-200 dark:border-slate-800 p-3 text-[10px] font-mono font-bold text-slate-500">{data.whatsapp_no}</td>
                        <td className="border border-slate-200 dark:border-slate-800 p-3 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">{data.state}</td>
                        <td className="border border-slate-200 dark:border-slate-800 p-3 text-[10px] font-black uppercase">
                          <span className={
                            data.status === 'cancelled' ? 'text-red-500' : 
                            data.status === 'pending' ? 'text-amber-500' : 
                            'text-green-500'
                          }>
                            {data.status}
                          </span>
                        </td>
                        <td className="border border-slate-200 dark:border-slate-800 p-3 text-[10px] font-black text-right text-emerald-600 dark:text-emerald-400">₹{studentTotal.toLocaleString()}</td>
                        <td className="border border-slate-200 dark:border-slate-800 p-3 text-[10px] font-black text-right text-blue-600 dark:text-blue-400">₹{data.discount}</td>
                        <td className="border border-slate-200 dark:border-slate-800 p-3 text-[10px] font-black text-right text-emerald-600 dark:text-emerald-400">₹{data.free}</td>
                        <td className="border border-slate-200 dark:border-slate-800 p-3 text-[10px] font-black text-right text-slate-900 dark:text-white">₹{data.remaining_amount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mobile Card View for Master View */}
              <div className="md:hidden space-y-4">
                {sortedMasterData.map((data, idx) => {
                  let studentTotal = 0;
                  for (let i = 1; i <= 10; i++) {
                    studentTotal += parseFloat(String((data as any)[`payment${i}_amount`]).replace(/[^0-9.]/g, '')) || 0;
                  }
                  return (
                    <div 
                      key={data.admission_id || idx}
                      className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">S.No {idx + 1}</span>
                            <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">{formatDateClean(data.payment1_date)}</span>
                          </div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{data.name}</h4>
                          <span className="text-[9px] font-mono font-bold text-indigo-500">{data.admission_id}</span>
                        </div>
                        <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-md ${
                          data.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                          data.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {data.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Contact</p>
                          <p className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">{data.contact_no}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</p>
                          <p className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">{data.whatsapp_no}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Paid</p>
                          <p className="text-xs font-black text-emerald-600">₹{studentTotal.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Remaining</p>
                          <p className="text-xs font-black text-slate-900 dark:text-white">₹{data.remaining_amount}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleMasterExcelDownload}
                className="flex-1 flex items-center justify-center gap-3 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/></svg>
                Excel Export
              </button>
              <button 
                onClick={handleMasterPrint}
                className="flex-1 flex items-center justify-center gap-3 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Print List
              </button>
              <button 
                onClick={handleMasterDownload}
                className="flex-1 flex items-center justify-center gap-3 py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-black transition-all active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

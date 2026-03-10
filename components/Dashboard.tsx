
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { ProcessingRecord, RegistrationData, UserRole, AppConfig } from '../types';
import { fetchAllRegistrations } from '../services/sheetService';
import { domToPng } from 'modern-screenshot';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';
import { 
  format, subDays, subMonths, subYears, isAfter, parse, isValid, addDays,
  startOfDay, startOfWeek, startOfMonth, startOfYear, isBefore, endOfDay, isSameDay
} from 'date-fns';
import { Calendar, ChevronDown, X, MapPin, Edit2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDateClean, parseDate } from '../services/utils';

type TimeRange = 
  | 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'lifetime' | 'custom';

interface DashboardProps {
  records: ProcessingRecord[];
  userRole: UserRole | null;
  config: AppConfig;
  onEdit?: (record: RegistrationData) => void;
}

const DetailRow = ({ label, value, fullWidth = false }: { label: string, value: string, fullWidth?: boolean }) => (
  <div className={`flex flex-col py-3 border-b border-slate-50 dark:border-slate-800/50 last:border-0 ${fullWidth ? 'col-span-1 sm:col-span-2' : 'col-span-1'}`}>
    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-1">{label}</span>
    <span className="text-[13px] font-bold text-slate-800 dark:text-slate-100 leading-tight">{value || '—'}</span>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ records, userRole, config, onEdit }) => {
  const [remoteData, setRemoteData] = useState<RegistrationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<number>(Date.now());
  const [viewingRecord, setViewingRecord] = useState<RegistrationData | null>(null);
  const [isMasterViewOpen, setIsMasterViewOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const masterViewRef = useRef<HTMLDivElement>(null);

  const [isTimeRangeMenuOpen, setIsTimeRangeMenuOpen] = useState(false);
  const timeRangeMenuRef = useRef<HTMLDivElement>(null);
  const [genderViewType, setGenderViewType] = useState<'confirm' | 'total'>('confirm');

  const TIME_RANGE_OPTIONS = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' },
    { id: 'lifetime', label: 'Lifetime' },
    { divider: true },
    { id: 'custom', label: 'Custom Range' },
  ];
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState('');
  const [masterViewSearchQuery, setMasterViewSearchQuery] = useState('');

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
        total_fees: String(row['total_fees'] || row['total fees'] || '20000'),
        remaining_amount: String(row['remaining amount'] || row['remaining_amount'] || '0'),
        status: (() => {
          const s = (row['status'] || 'confirm').toLowerCase();
          return s === 'active' ? 'confirm' : s as 'confirm' | 'cancelled' | 'pending';
        })()
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
        setError("Sync Error: Could not fetch data from Google Sheets. Please ensure your Apps Script is deployed as a Web App with 'Anyone' access.");
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
    { id: 'status', label: 'Status', options: ['confirm', 'pending', 'cancelled'] },
    { id: 'gender', label: 'Gender', options: ['male', 'female', 'other'] },
    { id: 'age', label: 'Age', dynamic: true, custom: true },
    { id: 'payment_amount', label: 'Payment Amount', dynamic: true },
    { id: 'medium', label: 'Medium', options: ['english', 'hindi', 'urdu'] },
    { id: 'payment_method', label: 'Payment Method', options: ['cash', 'account'] },
    { id: 'state', label: 'State', dynamic: true },
    { id: 'city', label: 'City', dynamic: true },
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
    
    // Calculate total payments for each record to add to options
    const totalPaymentsSet = new Set<string>();
    allSyncedData.forEach(d => {
      let total = 0;
      for (let i = 1; i <= 10; i++) {
        total += parseFloat(String((d as any)[`payment${i}_amount`]).replace(/[^0-9.]/g, '')) || 0;
      }
      if (total > 0) totalPaymentsSet.add(String(total));
    });

    const finalPaymentOptions = Array.from(new Set([...standardPayments, ...Array.from(totalPaymentsSet)])).sort((a, b) => parseFloat(a) - parseFloat(b));

    return {
      state: Array.from(states).sort(),
      city: Array.from(cities).sort(),
      age: ageOptions,
      payment_amount: finalPaymentOptions
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
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [customAgeMin, setCustomAgeMin] = useState<string>('');
  const [customAgeMax, setCustomAgeMax] = useState<string>('');
  const [filterGender, setFilterGender] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<string | null>(null);
  const [filterCity, setFilterCity] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string | null>(null);
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<'cash' | 'account' | null>(null);
  const [filterAdmissionStatus, setFilterAdmissionStatus] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof RegistrationData; direction: 'asc' | 'desc' } | null>(null);

  const requestSort = (key: keyof RegistrationData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getFilteredData = (range: TimeRange, custom?: { start: string, end: string }) => {
    let baseFiltered = allSyncedData;

    if (range !== 'lifetime') {
      const now = new Date();
      baseFiltered = baseFiltered.filter(d => {
        const date = parseDate(d.payment1_date);
        if (!date) return false;
        
        switch (range) {
          case 'today': return isSameDay(date, now);
          case 'yesterday': return isSameDay(date, subDays(now, 1));
          case 'week': return isAfter(date, startOfWeek(now));
          case 'month': return isAfter(date, startOfMonth(now));
          case 'year': return isAfter(date, startOfYear(now));
          case 'custom':
            const start = custom?.start || customStart;
            const end = custom?.end || customEnd;
            if (!start || !end) return true;
            return isAfter(date, startOfDay(new Date(start))) && 
                   isBefore(date, endOfDay(new Date(end)));
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
          const targetAmt = parseFloat(value);
          let totalPaid = 0;
          for (let i = 1; i <= 10; i++) {
            totalPaid += parseFloat(String((d as any)[`payment${i}_amount`]).replace(/[^0-9.]/g, '')) || 0;
          }
          if (totalPaid !== targetAmt) return false;
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
        const discount = parseFloat(String(d.discount || '0')) || 0;
        const totalFees = 20000;
        const target = totalFees - discount;

        if (filterPaymentStatus === 'fully_paid') {
          if (studentTotal < target || studentTotal === 0) return false;
        } else if (filterPaymentStatus === 'partial') {
          if (studentTotal >= target || studentTotal === 0) return false;
        } else if (filterPaymentStatus === 'discount') {
          if (discount === 0) return false;
        } else if (filterPaymentStatus === 'free') {
          if (studentTotal > 0) return false;
        }
      }

      if (filterPaymentMethod) {
        let hasMethod = false;
        for (let i = 1; i <= 10; i++) {
          const amt = parseFloat(String((d as any)[`payment${i}_amount`]).replace(/[^0-9.]/g, '')) || 0;
          const method = (d as any)[`payment${i}_method`] || 'account';
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

  const filteredData = useMemo(() => getFilteredData(timeRange), [allSyncedData, timeRange, customStart, customEnd, filterGender, filterState, filterCity, filterDate, filterPaymentStatus, filterAdmissionStatus, dashboardSearchQuery, filterPaymentMethod, activeFilters]);

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

  const getChartData = (data: RegistrationData[], range: TimeRange) => {
    const dailyMap: Record<string, { admissions: number, revenue: number }> = {};
    const now = new Date();
    const minDate = subYears(now, 5); 
    const maxDate = addDays(now, 365); 
    
    data.forEach(d => {
      const date = parseDate(d.payment1_date);
      if (!date || isBefore(date, minDate) || isAfter(date, maxDate)) return;
      
      const key = format(date, 'yyyy-MM-dd');
      if (!dailyMap[key]) dailyMap[key] = { admissions: 0, revenue: 0 };
      
      dailyMap[key].admissions += 1;
      
      let studentTotal = 0;
      for (let i = 1; i <= 10; i++) {
        studentTotal += parseFloat(String((d as any)[`payment${i}_amount`]).replace(/[^0-9.]/g, '')) || 0;
      }
      dailyMap[key].revenue += studentTotal;
    });

    let startDate: Date;
    let endDate = now;

    switch (range) {
      case 'today': startDate = startOfDay(now); break;
      case 'yesterday': startDate = startOfDay(subDays(now, 1)); endDate = endOfDay(subDays(now, 1)); break;
      case 'week': startDate = startOfWeek(now); break;
      case 'month': startDate = startOfMonth(now); break;
      case 'year': startDate = startOfYear(now); break;
      case 'custom':
        startDate = customStart ? new Date(customStart) : subDays(now, 30);
        endDate = customEnd ? new Date(customEnd) : now;
        break;
      default:
        const dates = data.map(d => parseDate(d.payment1_date)).filter(Boolean) as Date[];
        const validDates = dates.filter(d => isAfter(d, minDate) && isBefore(d, maxDate));
        startDate = validDates.length > 0 ? new Date(Math.min(...validDates.map(d => d.getTime()))) : subDays(now, 30);
        if (isBefore(startDate, subYears(now, 2))) {
          startDate = subYears(now, 2);
        }
    }

    const result: any[] = [];
    let current = startOfDay(startDate);
    const last = startOfDay(endDate);

    while (current <= last) {
      const key = format(current, 'yyyy-MM-dd');
      const stats = dailyMap[key] || { admissions: 0, revenue: 0 };
      result.push({
        name: format(current, 'MMM dd'),
        fullDate: key,
        admissions: stats.admissions,
        revenue: stats.revenue
      });
      current = addDays(current, 1);
    }

    // 4. Group by month if too many points (increased threshold for day-wise spikes)
    if (result.length > 366 || (range === 'lifetime' && result.length > 90)) {
      const monthlyMap: Record<string, { admissions: number, revenue: number }> = {};
      result.forEach(r => {
        const monthKey = r.fullDate.substring(0, 7); 
        if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { admissions: 0, revenue: 0 };
        monthlyMap[monthKey].admissions += r.admissions;
        monthlyMap[monthKey].revenue += r.revenue;
      });
      return Object.keys(monthlyMap).sort().map(key => ({
        name: format(new Date(key + '-01'), 'MMM yyyy'),
        admissions: monthlyMap[key].admissions,
        revenue: monthlyMap[key].revenue
      }));
    }

    return result;
  };

  const admChartData = useMemo(() => getChartData(filteredData, timeRange), [filteredData, timeRange]);

  const getStats = (data: RegistrationData[]) => {
    const total = data.length;
    const genderMapConfirm: Record<string, number> = {};
    const genderMapTotal: Record<string, number> = {};
    let revenue = 0;
    let cashRevenue = 0;
    let accountRevenue = 0;
    let cancelledCount = 0;
    let pendingCount = 0;
    let fullyPaid = 0;
    let partialPaid = 0;
    let discountCount = 0;
    let freeCount = 0;

    data.forEach(d => {
      const status = (d.status || 'confirm').toLowerCase();
      const g = (d.gender || 'Other').trim().toLowerCase();
      
      // Always add to total map
      genderMapTotal[g] = (genderMapTotal[g] || 0) + 1;

      if (status === 'cancelled') {
        cancelledCount++;
        return;
      }
      if (status === 'pending') {
        pendingCount++;
        return;
      }
      
      // Only add to confirm map if not cancelled/pending
      genderMapConfirm[g] = (genderMapConfirm[g] || 0) + 1;
      
      let studentTotal = 0;
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

        studentTotal += amt;
        if (method === 'cash') {
          cashRevenue += amt;
        } else {
          accountRevenue += amt;
        }
      }
      revenue += studentTotal;

      const discount = parseFloat(String(d.discount || '0')) || 0;
      if (discount > 0) discountCount++;

      const totalFees = 20000;
      const target = totalFees - discount;

      if (studentTotal === 0) freeCount++;
      else if (studentTotal >= target) fullyPaid++;
      else if (studentTotal > 0) partialPaid++;
    });
    return { total, genderMapConfirm, genderMapTotal, revenue, cashRevenue, accountRevenue, cancelledCount, pendingCount, fullyPaid, partialPaid, discountCount, freeCount };
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
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredData]);

  const cityDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(d => {
      const city = d.city || 'Unknown';
      counts[city] = (counts[city] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredData]);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
  };

  const isFiltered = timeRange !== 'lifetime' || filterGender || filterState || filterCity || filterDate || filterPaymentStatus || filterAdmissionStatus || filterPaymentMethod || activeFilters.length > 0;

  return (
    <div className="space-y-8 pb-10 transition-colors">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/></svg>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">EHA Dashboard</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                System Operational
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

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div 
          onClick={() => { setFilterAdmissionStatus(null); setFilterPaymentStatus(null); setFilterGender(null); setFilterState(null); setFilterCity(null); setFilterDate(null); }}
          className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group transition-colors cursor-pointer hover:border-indigo-500"
        >
          <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-full -mr-12 md:-mr-16 -mt-12 md:-mt-16 group-hover:scale-110 transition-transform"></div>
          <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 relative transition-colors">Admissions</h3>
          <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 relative transition-colors">{globalStats.total}</p>
          <p className="mt-4 text-green-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 relative">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> {isLoading ? "Syncing..." : "Live Data"}
          </p>
        </div>

        {userRole === 'super_admin' && (
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 transition-colors">Total Revenue</h3>
            <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight transition-colors">₹{globalStats.revenue.toLocaleString()}</p>
            
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div 
                onClick={() => setFilterPaymentMethod(filterPaymentMethod === 'cash' ? null : 'cash')}
                className={`p-2 rounded-xl border cursor-pointer transition-all ${filterPaymentMethod === 'cash' ? 'bg-emerald-600 border-emerald-500' : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/20'}`}
              >
                <p className={`text-[8px] font-black uppercase tracking-widest mb-0.5 ${filterPaymentMethod === 'cash' ? 'text-emerald-100' : 'text-emerald-600 dark:text-emerald-400'}`}>Cash</p>
                <p className={`text-xs font-black ${filterPaymentMethod === 'cash' ? 'text-white' : 'text-emerald-700 dark:text-emerald-300'}`}>₹{globalStats.cashRevenue.toLocaleString()}</p>
              </div>
              <div 
                onClick={() => setFilterPaymentMethod(filterPaymentMethod === 'account' ? null : 'account')}
                className={`p-2 rounded-xl border cursor-pointer transition-all ${filterPaymentMethod === 'account' ? 'bg-indigo-600 border-indigo-500' : 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/20'}`}
              >
                <p className={`text-[8px] font-black uppercase tracking-widest mb-0.5 ${filterPaymentMethod === 'account' ? 'text-indigo-100' : 'text-indigo-600 dark:text-indigo-400'}`}>EHA Account</p>
                <p className={`text-xs font-black ${filterPaymentMethod === 'account' ? 'text-white' : 'text-indigo-700 dark:text-indigo-300'}`}>₹{globalStats.accountRevenue.toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between transition-colors">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Growth Index</span>
              <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 transition-colors">Payment Status</h3>
          <div className="space-y-3">
            <div 
              onClick={() => setFilterPaymentStatus(filterPaymentStatus === 'fully_paid' ? null : 'fully_paid')}
              className={`flex justify-between items-center cursor-pointer p-1.5 rounded-lg transition-all ${filterPaymentStatus === 'fully_paid' ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Fully Paid</span>
              <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">{globalStats.fullyPaid}</span>
            </div>
            <div 
              onClick={() => setFilterPaymentStatus(filterPaymentStatus === 'partial' ? null : 'partial')}
              className={`flex justify-between items-center cursor-pointer p-1.5 rounded-lg transition-all ${filterPaymentStatus === 'partial' ? 'bg-amber-50 dark:bg-amber-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Partial</span>
              <span className="text-[11px] font-black text-amber-600 dark:text-amber-400">{globalStats.partialPaid}</span>
            </div>
            <div 
              onClick={() => setFilterPaymentStatus(filterPaymentStatus === 'discount' ? null : 'discount')}
              className={`flex justify-between items-center cursor-pointer p-1.5 rounded-lg transition-all ${filterPaymentStatus === 'discount' ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Discount</span>
              <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">{globalStats.discountCount}</span>
            </div>
            <div 
              onClick={() => setFilterPaymentStatus(filterPaymentStatus === 'free' ? null : 'free')}
              className={`flex justify-between items-center cursor-pointer p-1.5 rounded-lg transition-all ${filterPaymentStatus === 'free' ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Free</span>
              <span className="text-[11px] font-black text-slate-400">{globalStats.freeCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 transition-colors">Admission Status</h3>
          <div className="space-y-3">
            <div 
              onClick={() => { setFilterAdmissionStatus(null); setFilterPaymentStatus(null); }}
              className="flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-all"
            >
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Total</span>
              <span className="text-[11px] font-black text-slate-900 dark:text-slate-100">{globalStats.total}</span>
            </div>
            <div 
              onClick={() => setFilterAdmissionStatus(filterAdmissionStatus === 'cancelled' ? null : 'cancelled')}
              className={`flex justify-between items-center cursor-pointer p-1.5 rounded-lg transition-all ${filterAdmissionStatus === 'cancelled' ? 'bg-red-50 dark:bg-red-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Cancelled</span>
              <span className="text-[11px] font-black text-red-500">{globalStats.cancelledCount}</span>
            </div>
            <div 
              onClick={() => setFilterAdmissionStatus(filterAdmissionStatus === 'pending' ? null : 'pending')}
              className={`flex justify-between items-center cursor-pointer p-1.5 rounded-lg transition-all ${filterAdmissionStatus === 'pending' ? 'bg-amber-50 dark:bg-amber-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Pending</span>
              <span className="text-[11px] font-black text-amber-500">{globalStats.pendingCount}</span>
            </div>
            <div 
              onClick={() => setFilterAdmissionStatus(filterAdmissionStatus === 'confirm' ? null : 'confirm')}
              className={`flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-800 cursor-pointer p-1.5 rounded-lg transition-all ${filterAdmissionStatus === 'confirm' ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Confirm</span>
              <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">{globalStats.total - globalStats.cancelledCount - globalStats.pendingCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors flex flex-col lg:col-span-1">
          <div className="flex justify-between items-center mb-4">
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
              <BarChart data={genderPieData} layout="vertical" margin={{ left: 0, right: 30, top: 10, bottom: 10 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={60}
                  tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[0, 10, 10, 0]} 
                  barSize={24}
                  onClick={(data) => {
                    if (data && data.name) {
                      const name = String(data.name);
                      setFilterGender(filterGender === name ? null : name);
                    }
                  }}
                >
                  {genderPieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name.toLowerCase() === 'male' ? '#4f46e5' : entry.name.toLowerCase() === 'female' ? '#ec4899' : '#94a3b8'} 
                      opacity={filterGender && filterGender !== entry.name ? 0.3 : 1}
                    />
                  ))}
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

        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors lg:col-span-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Admission Velocity</h3>
            <div className="flex flex-wrap items-center gap-1 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl">
              {TIME_RANGE_OPTIONS.filter(o => !o.divider).map((option) => (
                <button
                  key={option.id}
                  onClick={() => setTimeRange(option.id as TimeRange)}
                  className={`px-3 py-1.5 text-[8px] font-black uppercase rounded-lg transition-all ${
                    timeRange === option.id 
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={admChartData}>
                <defs>
                  <linearGradient id="colorAdm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" strokeOpacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fontWeight: 800, fill: '#94a3b8'}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fontWeight: 800, fill: '#94a3b8'}} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', 
                    fontSize: '10px', 
                    fontWeight: 'bold',
                    backgroundColor: '#1e293b',
                    color: '#f8fafc'
                  }}
                  itemStyle={{ color: '#818cf8' }}
                  cursor={{ stroke: '#4f46e5', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="admissions" 
                  stroke="#4f46e5" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorAdm)" 
                  animationDuration={1500}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {timeRange === 'custom' && (
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
            </div>
          )}
        </div>
      </div>

      {/* REGIONAL DISTRIBUTION - COMPACT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">State Distribution</h3>
            {filterState && (
              <button onClick={() => setFilterState(null)} className="text-[8px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Reset</button>
            )}
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
            {stateDistribution.map((item, idx) => (
              <div 
                key={item.name} 
                onClick={() => setFilterState(filterState === item.name ? null : item.name)}
                className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${filterState === item.name ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <div className="flex-1 mr-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-1">
                    <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{item.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                      style={{ width: `${(item.count / (stateDistribution[0]?.count || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">City Distribution</h3>
            {filterCity && (
              <button onClick={() => setFilterCity(null)} className="text-[8px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Reset</button>
            )}
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
            {cityDistribution.map((item, idx) => (
              <div 
                key={item.name} 
                onClick={() => setFilterCity(filterCity === item.name ? null : item.name)}
                className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${filterCity === item.name ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <div className="flex-1 mr-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-1">
                    <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{item.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                      style={{ width: `${(item.count / (cityDistribution[0]?.count || 1)) * 100}%` }}
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
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow-sm dark:shadow-none transition-colors">{sortedMasterData.length} Records</span>
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

                                {selectedFilterType !== 'age' && (
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
                        onClick={() => requestSort('city')}
                        className="px-4 md:px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors hidden sm:table-cell"
                      >
                        <div className="flex items-center gap-1">
                          City
                          {sortConfig?.key === 'city' && (
                            <span className="text-indigo-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => requestSort('status')}
                        className="px-4 md:px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          Status
                          {sortConfig?.key === 'status' && (
                            <span className="text-indigo-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-4 md:px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-wider text-right">Action</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {sortedMasterData.map((data, idx) => (
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
                      <td className="px-4 md:px-8 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-600 uppercase transition-colors hidden sm:table-cell">{data.city || '—'}</td>
                      <td className="px-4 md:px-8 py-4">
                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-md ${
                            data.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 
                            data.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                            'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                          }`}>
                            {data.status}
                          </span>
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
                            <button onClick={() => setViewingRecord(data)} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white transition-all active:scale-90 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shadow-sm dark:shadow-none transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                          </div>
                      </td>
                      </tr>
                  ))}
                  </tbody>
              </table>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 p-4">
                {sortedMasterData.map((data, idx) => (
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
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin size={12} />
                        <span className="text-[10px] font-bold uppercase">{data.city || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {onEdit && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onEdit(data); }}
                            className="p-2 text-slate-400 hover:text-indigo-600"
                          >
                            <Edit2 size={14} />
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
                        <div className="text-left md:text-right">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Registration Date</p>
                          <p className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-200">{formatDateClean(viewingRecord.payment1_date)}</p>
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
                      onClick={() => setViewingRecord(null)}
                      className="md:w-16 flex items-center justify-center py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl hover:bg-black transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
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

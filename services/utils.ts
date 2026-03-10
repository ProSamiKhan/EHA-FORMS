import { format, isValid, addDays } from 'date-fns';

export const parseDate = (s: string | any): Date | null => {
  if (!s) return null;
  if (s instanceof Date) return isValid(s) ? s : null;
  
  const str = String(s).trim();
  if (!str || str === '—') return null;

  // 1. Handle Excel/Google Sheets serial numbers
  // Excel base date is Dec 30, 1899. 25569 is the offset to Unix epoch (Jan 1, 1970)
  if (/^\d{5}(\.\d+)?$/.test(str)) {
    const serial = parseFloat(str);
    const date = new Date((serial - 25569) * 86400 * 1000);
    // Adjust for timezone if needed, but usually this is UTC-ish
    if (isValid(date)) return date;
  }

  // 2. Handle ISO strings or YYYY-MM-DD
  if (str.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(str)) {
    const d = new Date(str);
    if (isValid(d)) return d;
  }

  // 3. Handle DD-MM-YYYY or MM-DD-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const separator = str.includes('/') ? '/' : (str.includes('-') ? '-' : (str.includes('.') ? '.' : null));
  if (separator) {
    const parts = str.split(separator).map(p => p.trim());
    if (parts.length >= 2) {
      let day, month, year;
      
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          [year, month, day] = parts;
        } else if (parts[2].length === 4 || parts[2].length === 2) {
          // DD-MM-YYYY (Primary) or MM-DD-YYYY (Fallback)
          [day, month, year] = parts;
          
          // If month > 12, it's definitely DD-MM-YYYY (already handled by assignment)
          // If day > 12 and month <= 12, it's definitely DD-MM-YYYY
          // If both <= 12, we prioritize DD-MM-YYYY as per user request
          
          if (year.length === 2) {
            const y = parseInt(year);
            year = y < 50 ? `20${year}` : `19${year}`;
          }
        } else {
          // Unknown format, try fallback
          const d = new Date(str);
          return isValid(d) ? d : null;
        }
      } else if (parts.length === 2) {
        // DD-MM (assume current year)
        [day, month] = parts;
        year = new Date().getFullYear().toString();
      } else {
        return null;
      }

      let d = parseInt(day);
      let m = parseInt(month);
      let y = parseInt(year);

      if (isNaN(d) || isNaN(m) || isNaN(y)) return null;

      // User explicitly wants DD-MM-YYYY. 
      // If we have something like 01-05-2026 and the user says it should be Jan 5th,
      // then the input we received was actually MM-DD-YYYY (01-05).
      // But if the user says they WROTE 05-01-2026, then our parser should get d=05, m=01.
      
      // If m > 12, it's definitely DD-MM-YYYY
      if (m > 12 && d <= 12) {
        [d, m] = [m, d];
      }
      
      const date = new Date(y, m - 1, d);
      if (isValid(date) && date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) {
        return date;
      }
    }
  }

  // 4. Handle "DD MMM YYYY" or "MMM DD, YYYY"
  // Avoid using new Date() for ambiguous numeric strings like "05-01-2026"
  if (!/^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(str)) {
    const fallbackDate = new Date(str);
    if (isValid(fallbackDate)) return fallbackDate;
  }

  return null;
};

export const formatDateClean = (dateStr: any) => {
  if (!dateStr || dateStr === '—') return '—';
  const d = parseDate(dateStr);
  if (d && isValid(d)) {
    return format(d, 'dd-MM-yyyy');
  }
  return String(dateStr);
};

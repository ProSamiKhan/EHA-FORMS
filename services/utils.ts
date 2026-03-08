import { format, isValid } from 'date-fns';

export const formatDateClean = (dateStr: string) => {
  if (!dateStr) return '—';
  // If it looks like an ISO date or has T
  if (dateStr.includes('T')) {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return format(d, 'dd-MM-yyyy');
      }
    } catch (e) {}
  }
  // If it has slashes, convert to dashes
  if (dateStr.includes('/')) {
    return dateStr.replace(/\//g, '-');
  }
  return dateStr;
};

export const parseDate = (s: string): Date | null => {
  if (!s) return null;
  
  // Handle ISO string
  if (s.includes('T')) {
    const d = new Date(s);
    return isValid(d) ? d : null;
  }

  // Handle dd/mm/yyyy or dd-mm-yyyy
  const separator = s.includes('/') ? '/' : (s.includes('-') ? '-' : null);
  if (separator) {
    const parts = s.split(separator);
    if (parts.length === 3) {
      let day, month, year;
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        [year, month, day] = parts;
      } else {
        // DD-MM-YYYY
        [day, month, year] = parts;
        if (year.length === 2) year = `20${year}`;
      }
      
      const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      if (isValid(date)) return date;
    }
  }
  
  // Fallback for other formats
  const date = new Date(s);
  return isValid(date) ? date : null;
};

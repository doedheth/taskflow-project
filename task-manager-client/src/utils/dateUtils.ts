import { format, formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

/**
 * Parse UTC timestamp from database to local Date object
 * Database stores timestamps without timezone info but in UTC
 * This function properly converts them to local time
 */
export const parseUTCDate = (dateStr: string | undefined | null): Date | null => {
  if (!dateStr) return null;
  
  try {
    // Handle ISO format with or without T separator
    const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    // Append Z to treat as UTC if not already present
    const withTimezone = normalized.endsWith('Z') ? normalized : `${normalized}Z`;
    return new Date(withTimezone);
  } catch {
    return null;
  }
};

/**
 * Format datetime to local string (dd MMM yyyy HH:mm)
 */
export const formatDateTime = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '-';
  
  const date = parseUTCDate(dateStr);
  if (!date) return dateStr;
  
  try {
    return format(date, 'dd MMM yyyy HH:mm', { locale: localeId });
  } catch {
    return dateStr;
  }
};

/**
 * Format date only (dd MMM yyyy)
 */
export const formatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '-';
  
  const date = parseUTCDate(dateStr);
  if (!date) return dateStr;
  
  try {
    return format(date, 'dd MMM yyyy', { locale: localeId });
  } catch {
    return dateStr;
  }
};

/**
 * Format date short (dd MMM)
 */
export const formatDateShort = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '-';
  
  const date = parseUTCDate(dateStr);
  if (!date) return dateStr;
  
  try {
    return format(date, 'dd MMM', { locale: localeId });
  } catch {
    return dateStr;
  }
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '-';
  
  const date = parseUTCDate(dateStr);
  if (!date) return dateStr;
  
  try {
    return formatDistanceToNow(date, { addSuffix: true, locale: localeId });
  } catch {
    return dateStr;
  }
};

/**
 * Calculate duration between two timestamps in minutes
 */
export const calculateDurationMinutes = (
  startStr: string | undefined | null,
  endStr: string | undefined | null
): number | null => {
  if (!startStr || !endStr) return null;
  
  const start = parseUTCDate(startStr);
  const end = parseUTCDate(endStr);
  
  if (!start || !end) return null;
  
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
};

/**
 * Format duration in minutes to human readable (e.g., "2j 30m")
 */
export const formatDurationMinutes = (minutes: number | undefined | null): string => {
  if (minutes === undefined || minutes === null) return '-';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}j ${mins}m`;
  }
  return `${mins}m`;
};

/**
 * Format live duration from start time to now (HH:MM:SS)
 */
export const formatLiveDuration = (startStr: string | undefined | null): string => {
  if (!startStr) return '0:00';
  
  const start = parseUTCDate(startStr);
  if (!start) return '0:00';
  
  const now = new Date();
  const totalSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);
  
  if (totalSeconds < 0) return '0:00';
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};



/**
 * Date Utilities
 * Date formatting, calculations, and conversions
 */

/**
 * Format date for display
 */
export function formatDate(date: Date | string, format: 'short' | 'long' | 'relative' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (format === 'relative') {
    return formatRelativeDate(d);
  }

  if (format === 'long') {
    return new Intl.DateTimeFormat('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  }

  // short format
  return new Intl.DateTimeFormat('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/**
 * Format relative date (e.g., "2 days ago", "in 3 months")
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  const isPast = diffMs < 0;
  const abs = Math.abs;

  if (abs(diffSec) < 60) return 'just now';
  if (abs(diffMin) < 60) return isPast ? `${abs(diffMin)}m ago` : `in ${abs(diffMin)}m`;
  if (abs(diffHour) < 24) return isPast ? `${abs(diffHour)}h ago` : `in ${abs(diffHour)}h`;
  if (abs(diffDay) < 7) return isPast ? `${abs(diffDay)}d ago` : `in ${abs(diffDay)}d`;
  if (abs(diffWeek) < 4) return isPast ? `${abs(diffWeek)}w ago` : `in ${abs(diffWeek)}w`;
  if (abs(diffMonth) < 12) return isPast ? `${abs(diffMonth)}mo ago` : `in ${abs(diffMonth)}mo`;
  return isPast ? `${abs(diffYear)}y ago` : `in ${abs(diffYear)}y`;
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  const diffMs = d2.getTime() - d1.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculate months between two dates
 */
export function monthsBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  return (
    (d2.getFullYear() - d1.getFullYear()) * 12 +
    (d2.getMonth() - d1.getMonth())
  );
}

/**
 * Add days to date
 */
export function addDays(date: Date | string, days: number): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Add months to date
 */
export function addMonths(date: Date | string, months: number): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Get start of day
 */
export function startOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day
 */
export function endOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() < new Date().getTime();
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() > new Date().getTime();
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Get next occurrence of day of week (0 = Sunday, 6 = Saturday)
 */
export function getNextDayOfWeek(dayOfWeek: number, fromDate: Date = new Date()): Date {
  const result = new Date(fromDate);
  result.setDate(result.getDate() + ((7 + dayOfWeek - result.getDay()) % 7 || 7));
  return result;
}

/**
 * Get next occurrence of day of month
 */
export function getNextDayOfMonth(dayOfMonth: number, fromDate: Date = new Date()): Date {
  const result = new Date(fromDate);

  if (result.getDate() >= dayOfMonth) {
    // Move to next month
    result.setMonth(result.getMonth() + 1);
  }

  result.setDate(dayOfMonth);
  return result;
}

/**
 * Date utility functions for consistent date formatting across the application
 */

/**
 * Safely parse a date from various formats
 * @param date - The date to parse (string, Date, number or undefined)
 * @returns A Date object or undefined if invalid
 */
export function parseDate(date: Date | string | number | undefined): Date | undefined {
  if (!date) return undefined;
  
  try {
    const parsed = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
      
    // Check if date is valid
    return isNaN(parsed.getTime()) ? undefined : parsed;
  } catch (error) {
    console.error('Error parsing date:', error);
    return undefined;
  }
}

/**
 * Format a date to a readable string
 * @param date - Date to format (Date object or ISO string)
 * @param options - Intl.DateTimeFormatOptions for customizing the format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | number | undefined, options?: Intl.DateTimeFormatOptions): string {
  const parsed = parseDate(date);
  if (!parsed) return '';
  
  // Default options
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  // Use provided options or default options
  const formatOptions = options || defaultOptions;
  
  try {
    return new Intl.DateTimeFormat('en-US', formatOptions).format(parsed);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Format a date to show only the date portion (no time)
 * @param date - Date to format (Date object or ISO string)
 * @returns Formatted date string (e.g., "Jan 1, 2023")
 */
export function formatDateOnly(date: Date | string | number | undefined): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format a date for HTML date input (YYYY-MM-DD)
 * @param date - Date to format
 * @returns Formatted date string in YYYY-MM-DD format
 */
export function formatDateForInput(date: Date | string | number | undefined): string {
  const parsed = parseDate(date);
  if (!parsed) return '';
  
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Format a date to a relative time string (e.g., "2 hours ago", "yesterday")
 * @param date - Date to format (Date object or ISO string)
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string | number | undefined): string {
  const parsed = parseDate(date);
  if (!parsed) return '';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - parsed.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInSeconds < 172800) {
    return 'yesterday';
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else {
    return formatDate(parsed, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
} 
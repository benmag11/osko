// Cached formatters for performance (created once, reused)
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
})

/**
 * Format a date as DD/MM/YYYY
 * Deterministic across server and client for SSR compatibility
 */
export function formatDate(date: string | Date): string {
  return dateFormatter.format(new Date(date))
}

/**
 * Format a date and time as DD/MM/YYYY, HH:MM:SS
 * Deterministic across server and client for SSR compatibility
 */
export function formatDateTime(date: string | Date): string {
  return dateTimeFormatter.format(new Date(date))
}
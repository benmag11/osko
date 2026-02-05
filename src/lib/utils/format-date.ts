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

// ─────────────────────────────────────────────
// Irish locale (en-IE) formatters for user-facing display
// ─────────────────────────────────────────────

/**
 * Format a date as "Monday, 14 April" (weekday + day + month)
 */
export function formatDateLong(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/**
 * Format a date as "14 April" (day + month)
 */
export function formatDateShort(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'long',
  })
}

/**
 * Format a date's day of week as "Monday"
 */
export function formatDayOfWeek(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IE', { weekday: 'long' })
}

/**
 * Format a time as "14:30" (24-hour HH:MM)
 */
export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('en-IE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a time range as "14:30–15:30" given a start time and duration
 */
export function formatTimeRange(scheduledAt: string | Date, durationMinutes: number): string {
  const start = new Date(scheduledAt)
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000)
  const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
  return `${start.toLocaleTimeString('en-IE', opts)}\u2013${end.toLocaleTimeString('en-IE', opts)}`
}

/**
 * Get the date range string for a week, e.g. "14 Apr – 20 Apr"
 */
export function getWeekDateRange(weekOffset: number): string {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday + weekOffset * 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  return `${monday.toLocaleDateString('en-IE', opts)} \u2013 ${sunday.toLocaleDateString('en-IE', opts)}`
}
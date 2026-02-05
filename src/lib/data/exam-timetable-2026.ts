import type { Subject } from '@/lib/types/database'
import {
  EXAM_TIMETABLE_2026,
  DB_TO_TIMETABLE,
  SEPARATELY_ANNOUNCED,
  type ExamSlot,
  type ExamDay,
  type ExamInsights,
} from './exam-timetable-2026-data'

// Re-export types and data for consumers
export { EXAM_TIMETABLE_2026 }
export type { ExamSlot, ExamDay, ExamInsights }

// ─────────────────────────────────────────────
// Helper: map level string to short code
// ─────────────────────────────────────────────

function levelToCode(level: string): 'H' | 'O' | 'F' {
  if (level === 'Higher') return 'H'
  if (level === 'Ordinary') return 'O'
  return 'F'
}

function getTimetableNames(dbName: string): string[] {
  return DB_TO_TIMETABLE[dbName] ?? [dbName]
}

// ─────────────────────────────────────────────
// Filter timetable for a user's subjects
// ─────────────────────────────────────────────

export function getExamsForSubjects(
  userSubjects: { subject: Subject }[]
): { matched: ExamSlot[]; separatelyAnnounced: string[] } {
  const separatelyAnnounced: string[] = []
  const matched: ExamSlot[] = []

  for (const us of userSubjects) {
    const dbName = us.subject.name
    const levelCode = levelToCode(us.subject.level)

    if (SEPARATELY_ANNOUNCED.has(dbName)) {
      separatelyAnnounced.push(dbName)
      continue
    }

    const timetableNames = getTimetableNames(dbName)

    for (const slot of EXAM_TIMETABLE_2026) {
      const matchesSubject = slot.subjectKey === dbName ||
        timetableNames.includes(slot.label.split(' — ')[0])
      const matchesLevel = slot.levels.includes(levelCode)

      if (matchesSubject && matchesLevel && !matched.some(m => m.id === slot.id)) {
        matched.push(slot)
      }
    }
  }

  // Sort by date then time
  matched.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date)
    if (dateCompare !== 0) return dateCompare
    return a.startTime.localeCompare(b.startTime)
  })

  return {
    matched,
    separatelyAnnounced: [...new Set(separatelyAnnounced)],
  }
}

// ─────────────────────────────────────────────
// Group exams by day, including free days
// ─────────────────────────────────────────────

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function groupExamsByDay(exams: ExamSlot[]): ExamDay[] {
  if (exams.length === 0) return []

  // Get all unique exam dates across the full timetable period
  const allTimetableDates = [...new Set(EXAM_TIMETABLE_2026.map(s => s.date))].sort()
  const firstDate = allTimetableDates[0]
  const lastDate = allTimetableDates[allTimetableDates.length - 1]

  // Build set of user's exam dates
  const userExamDates = new Set(exams.map(e => e.date))

  // Build set of all timetable dates (only weekdays that have any exam)
  const timetableDateSet = new Set(allTimetableDates)

  const days: ExamDay[] = []
  const current = new Date(firstDate + 'T00:00:00')
  const end = new Date(lastDate + 'T00:00:00')

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]
    const dayOfWeek = current.getDay()

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    // Include weekends (as free days) and weekdays that have exams on the timetable
    if (isWeekend || timetableDateSet.has(dateStr)) {
      const dayExams = exams.filter(e => e.date === dateStr)
      days.push({
        date: dateStr,
        dayOfWeek: DAY_NAMES[dayOfWeek],
        dayOfMonth: current.getDate(),
        month: MONTH_NAMES[current.getMonth()],
        slots: dayExams,
        isFreeDay: !userExamDates.has(dateStr),
        isWeekend,
      })
    }

    current.setDate(current.getDate() + 1)
  }

  return days
}

// ─────────────────────────────────────────────
// Compute insights from filtered exams
// ─────────────────────────────────────────────

export function getExamInsights(exams: ExamSlot[], days: ExamDay[]): ExamInsights {
  if (exams.length === 0) {
    return {
      totalExams: 0,
      examDays: 0,
      freeDays: 0,
      busiestDay: null,
      firstExam: null,
      lastExam: null,
      morningExams: 0,
      afternoonExams: 0,
    }
  }

  const examDaysList = days.filter(d => !d.isFreeDay)
  const freeDaysList = days.filter(d => d.isFreeDay && !d.isWeekend)

  let busiestDay: ExamInsights['busiestDay'] = null
  for (const day of examDaysList) {
    if (!busiestDay || day.slots.length > busiestDay.count) {
      busiestDay = {
        date: day.date,
        label: `${day.dayOfWeek} ${day.dayOfMonth} ${day.month}`,
        count: day.slots.length,
      }
    }
  }

  const morningExams = exams.filter(e => {
    const hour = parseInt(e.startTime.split(':')[0], 10)
    return hour < 13
  }).length

  return {
    totalExams: exams.length,
    examDays: examDaysList.length,
    freeDays: freeDaysList.length,
    busiestDay,
    firstExam: exams[0],
    lastExam: exams[exams.length - 1],
    morningExams,
    afternoonExams: exams.length - morningExams,
  }
}

// ─────────────────────────────────────────────
// Calendar export helpers
// ─────────────────────────────────────────────

function parseTimeComponents(dateStr: string, timeStr: string): [number, number, number, number, number] {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute] = timeStr.split(':').map(Number)
  return [year, month, day, hour, minute]
}

export function generateGoogleCalendarUrl(slot: ExamSlot): string {
  const title = encodeURIComponent(`LC 2026: ${slot.label}`)
  const [y, mo, d, sh, sm] = parseTimeComponents(slot.date, slot.startTime)
  const [, , , eh, em] = parseTimeComponents(slot.date, slot.endTime)

  // Format: YYYYMMDDTHHMMSS — Google Calendar expects UTC or with timezone
  const pad = (n: number) => n.toString().padStart(2, '0')
  const startStr = `${y}${pad(mo)}${pad(d)}T${pad(sh)}${pad(sm)}00`
  const endStr = `${y}${pad(mo)}${pad(d)}T${pad(eh)}${pad(em)}00`

  const details = encodeURIComponent(`Leaving Certificate 2026 — ${slot.label}`)

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&ctz=Europe/Dublin`
}

export function generateIcsEvents(exams: ExamSlot[]): Parameters<typeof import('ics').createEvents>[0] {
  return exams.map(slot => {
    const [y, mo, d, sh, sm] = parseTimeComponents(slot.date, slot.startTime)
    const [, , , eh, em] = parseTimeComponents(slot.date, slot.endTime)

    // Duration in hours and minutes
    const startMinutes = sh * 60 + sm
    const endMinutes = eh * 60 + em
    const durationMinutes = endMinutes - startMinutes
    const durationHours = Math.floor(durationMinutes / 60)
    const durationMins = durationMinutes % 60

    return {
      uid: `lc2026-${slot.id}@uncooked.ie`,
      title: `LC 2026: ${slot.label}`,
      description: `Leaving Certificate 2026 — ${slot.label}`,
      start: [y, mo, d, sh, sm] as [number, number, number, number, number],
      duration: { hours: durationHours, minutes: durationMins },
      startOutputType: 'local' as const,
      calName: 'Leaving Cert 2026',
    }
  })
}

// ─────────────────────────────────────────────
// Duration formatting
// ─────────────────────────────────────────────

export function formatDuration(startTime: string, endTime: string): string {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const totalMinutes = (eh * 60 + em) - (sh * 60 + sm)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'pm' : 'am'
  const displayHour = h > 12 ? h - 12 : h
  return m === 0 ? `${displayHour}${period}` : `${displayHour}:${m.toString().padStart(2, '0')}${period}`
}

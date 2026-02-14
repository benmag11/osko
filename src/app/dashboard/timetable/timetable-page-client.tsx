'use client'

import { useMemo, useRef, useState, useEffect, useCallback, type RefObject } from 'react'
import type { UserSubjectWithSubject } from '@/lib/types/database'
import {
  getExamsForSubjects,
  groupExamsByDay,
  getExamInsights,
  generateGoogleCalendarUrl,
  formatDuration,
  formatTime,
  parseExamLabel,
  computeTimeSlotRows,
  getExamCardMinHeight,
  type ExamSlot,
  type ExamDay,
  type ExamInsights,
} from '@/lib/data/exam-timetable-2026'
import Link from 'next/link'
import {
  Settings,
  Calendar,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  Info,
} from 'lucide-react'
import { motion } from 'motion/react'

interface TimetablePageClientProps {
  userId: string
  userName: string
  initialSubjects: UserSubjectWithSubject[]
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export function TimetablePageClient({
  initialSubjects,
}: TimetablePageClientProps) {
  const { matched, separatelyAnnounced } = useMemo(
    () => getExamsForSubjects(initialSubjects),
    [initialSubjects]
  )

  const days = useMemo(() => groupExamsByDay(matched), [matched])

  const insights = useMemo(
    () => getExamInsights(matched, days),
    [matched, days]
  )

  const timeSlots = useMemo(() => computeTimeSlotRows(matched), [matched])

  const daysUntilExams = useMemo(() => {
    if (!insights.firstExam) return 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const examStart = new Date(insights.firstExam.date + 'T00:00:00')
    const diffMs = examStart.getTime() - today.getTime()
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
  }, [insights.firstExam])

  const lastExamId = insights.lastExam?.id ?? null

  // ── Empty state ──
  if (initialSubjects.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-0">
      <TimetableMasthead />

      {insights.totalExams > 0 && (
        <InsightsBar
          daysUntilExams={daysUntilExams}
          insights={insights}
        />
      )}

      {separatelyAnnounced.length > 0 && (
        <SeparatelyAnnouncedNotice subjects={separatelyAnnounced} />
      )}

      {/* Calendar container */}
      <div className="rounded-sm border border-stone-200 bg-white overflow-hidden shadow-sm">
        {/* Month header */}
        <div className="px-4 pt-3.5 pb-3 border-b border-stone-100">
          <h2 className="text-sm font-medium uppercase tracking-wider text-stone-400">
            June 2026
          </h2>
        </div>

        {/* Desktop: schedule grid */}
        <ScheduleGrid
          days={days}
          timeSlots={timeSlots}
          lastExamId={lastExamId}
        />

        {/* Mobile: stacked vertical */}
        <MobileTimetable
          days={days}
          lastExamId={lastExamId}
        />
      </div>

      <SettingsLink />
    </div>
  )
}

// ─────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="space-y-4">
      <TimetableMasthead />
      <div className="border-y border-stone-200 py-10 text-center">
        <p className="font-serif text-lg text-stone-600">
          You haven&apos;t added any subjects yet.
        </p>
        <p className="mt-2 text-sm text-stone-400">
          Go to Settings to add your subjects, then come back to see your
          personalised exam timetable.
        </p>
        <Link
          href="/dashboard/settings"
          className="group mt-5 inline-flex items-center gap-1.5 text-sm text-salmon-500 hover:text-salmon-600 transition-colors"
        >
          <Settings className="size-3.5" />
          <span className="group-hover:underline underline-offset-2">
            Add subjects
          </span>
        </Link>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Masthead — "Your Leaving Cert" + "June 2026"
// ─────────────────────────────────────────────

function TimetableMasthead() {
  return (
    <div className="mb-12 w-fit">
      <h1 className="text-6xl font-serif font-normal text-warm-text-secondary">
        Your Leaving Cert.
      </h1>
    </div>
  )
}

// ─────────────────────────────────────────────
// Insights bar — horizontal stats strip
// ─────────────────────────────────────────────

function InsightsBar({
  daysUntilExams,
  insights,
}: {
  daysUntilExams: number
  insights: ExamInsights
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
      className="border-y border-stone-200 py-4 mb-6"
    >
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3 sm:gap-x-8">
        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="flex items-baseline gap-2"
        >
          <span className="font-display text-4xl font-semibold tabular-nums text-salmon-500 leading-none">
            {daysUntilExams}
          </span>
          <span className="text-sm font-serif italic text-stone-400">
            days to go
          </span>
        </motion.div>

        {/* Vertical rule */}
        <div className="hidden sm:block w-px h-8 bg-stone-200 self-center" />

        {/* Exam days */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex items-baseline gap-2"
        >
          <span className="text-2xl font-display font-semibold tabular-nums text-warm-text-primary leading-none">
            {insights.examDays}
          </span>
          <span className="text-sm font-serif italic text-stone-400">
            exam days
          </span>
        </motion.div>

        {/* Free days */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="flex items-baseline gap-2"
        >
          <span className="text-2xl font-display font-semibold tabular-nums text-warm-text-primary leading-none">
            {insights.freeDays}
          </span>
          <span className="text-sm font-serif italic text-stone-400">
            free days
          </span>
        </motion.div>

      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// Separately announced notice
// ─────────────────────────────────────────────

function SeparatelyAnnouncedNotice({ subjects }: { subjects: string[] }) {
  return (
    <div className="flex items-start gap-2.5 border border-stone-200 border-dashed rounded-lg px-4 py-3 mb-6 bg-cream-100/50">
      <Info className="size-4 text-stone-400 mt-0.5 shrink-0" />
      <p className="text-sm text-stone-500">
        <span className="font-medium text-stone-600">
          {subjects.join(' & ')}
        </span>{' '}
        — exam dates announced separately by the SEC.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────
// Horizontal scroll hook
// ─────────────────────────────────────────────

function useHorizontalScroll(scrollRef: RefObject<HTMLDivElement | null>) {
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [scrollRef])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    const resizeObserver = new ResizeObserver(checkScroll)
    resizeObserver.observe(el)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      resizeObserver.disconnect()
    }
  }, [checkScroll, scrollRef])

  const scroll = useCallback(
    (direction: 'left' | 'right') => {
      const el = scrollRef.current
      if (!el) return
      const amount = direction === 'left' ? -280 : 280
      el.scrollBy({ left: amount, behavior: 'smooth' })
    },
    [scrollRef]
  )

  return { canScrollLeft, canScrollRight, scroll }
}

// ─────────────────────────────────────────────
// Desktop: Schedule Grid
// ─────────────────────────────────────────────

function ScheduleGrid({
  days,
  timeSlots,
  lastExamId,
}: {
  days: ExamDay[]
  timeSlots: string[]
  lastExamId: string | null
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { canScrollLeft, canScrollRight, scroll } =
    useHorizontalScroll(scrollRef)

  // Build a lookup: "date|startTime" → ExamSlot[]
  const examLookup = useMemo(() => {
    const map = new Map<string, ExamSlot[]>()
    for (const day of days) {
      for (const slot of day.slots) {
        const key = `${day.date}|${slot.startTime}`
        const existing = map.get(key) ?? []
        existing.push(slot)
        map.set(key, existing)
      }
    }
    return map
  }, [days])

  // Find the first free-day column after the last exam day for celebration placement
  const celebrationDayIndex = useMemo(() => {
    let lastExamDayIdx = -1
    for (let i = days.length - 1; i >= 0; i--) {
      if (!days[i].isFreeDay && days[i].slots.length > 0) {
        lastExamDayIdx = i
        break
      }
    }
    if (lastExamDayIdx === -1) return null
    // Find next free day after the last exam day
    for (let i = lastExamDayIdx + 1; i < days.length; i++) {
      if (days[i].isFreeDay) return i
    }
    return null // Last exam is on the final day
  }, [days])

  // Edge case: if last exam is the final day, add a trailing column for celebration
  const lastExamIsLastDay = useMemo(() => {
    for (let i = days.length - 1; i >= 0; i--) {
      if (!days[i].isFreeDay && days[i].slots.length > 0) {
        return i === days.length - 1
      }
    }
    return false
  }, [days])

  const gridTemplateColumns = `48px ${days
    .map(() => 'minmax(120px, 1fr)')
    .join(' ')}${lastExamIsLastDay ? ' minmax(100px, auto)' : ''}`

  const gridTemplateRows = `auto repeat(${timeSlots.length}, minmax(72px, auto))`

  return (
    <div className="hidden md:block relative">
      {/* Left fade */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none transition-opacity duration-200 ${
          canScrollLeft ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {/* Right fade */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none transition-opacity duration-200 ${
          canScrollRight ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Left arrow */}
      <button
        onClick={() => scroll('left')}
        className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center size-8 rounded-full bg-white border border-stone-200 shadow-sm text-stone-500 hover:text-salmon-500 hover:border-salmon-300 transition-all cursor-pointer ${
          canScrollLeft
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronLeft className="size-4" />
      </button>

      {/* Right arrow */}
      <button
        onClick={() => scroll('right')}
        className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center size-8 rounded-full bg-white border border-stone-200 shadow-sm text-stone-500 hover:text-salmon-500 hover:border-salmon-300 transition-all cursor-pointer ${
          canScrollRight
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronRight className="size-4" />
      </button>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="overflow-x-auto scroll-smooth scrollbar-thin"
      >
        <div
          className="grid"
          style={{ gridTemplateColumns, gridTemplateRows }}
        >
          {/* ── Row 0: Header row ── */}
          {/* Top-left corner (empty) */}
          <div className="border-b border-stone-200" />

          {/* Day headers */}
          {days.map((day, i) => (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.25,
                delay: Math.min(0.15 + i * 0.025, 0.6),
                ease: 'easeOut',
              }}
            >
              <DayHeader day={day} />
            </motion.div>
          ))}

          {/* Trailing celebration header (only when last exam is final day) */}
          {lastExamIsLastDay && <div className="border-b border-stone-200" />}

          {/* ── Rows 1..N: Time slot rows ── */}
          {timeSlots.map((time, rowIdx) => (
            <TimeSlotRow
              key={time}
              time={time}
              rowIdx={rowIdx}
              days={days}
              examLookup={examLookup}
              lastExamId={lastExamId}
              isLastRow={rowIdx === timeSlots.length - 1}
            />
          ))}

          {/* Spanning free-day columns with vertical "Free" text */}
          {days.map((day, i) => {
            if (!day.isFreeDay) return null
            const isCelebration = celebrationDayIndex === i
            return (
              <div
                key={`free-${day.date}`}
                className="relative"
                style={{
                  gridColumn: i + 2,
                  gridRow: `2 / span ${timeSlots.length}`,
                  backgroundImage:
                    'repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(168,162,158,0.08) 3px, rgba(168,162,158,0.08) 4px)',
                }}
              >
                {isCelebration ? (
                  <InlineCelebration />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="text-sm font-serif italic text-stone-300 select-none"
                      style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                      }}
                    >
                      Free
                    </span>
                  </div>
                )}
              </div>
            )
          })}

          {/* Trailing celebration column (only when last exam is final day) */}
          {lastExamIsLastDay && (
            <div
              className="relative"
              style={{
                gridColumn: days.length + 2,
                gridRow: `2 / span ${timeSlots.length}`,
              }}
            >
              <InlineCelebration />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Time slot row (renders a full grid row)
// ─────────────────────────────────────────────

function TimeSlotRow({
  time,
  rowIdx,
  days,
  examLookup,
  lastExamId,
  isLastRow,
}: {
  time: string
  rowIdx: number
  days: ExamDay[]
  examLookup: Map<string, ExamSlot[]>
  lastExamId: string | null
  isLastRow: boolean
}) {
  return (
    <>
      {/* Time label */}
      <TimeLabel time={time} />

      {/* Cells for each day (skip free days — they're handled by spanning cells) */}
      {days.map((day, colIdx) => {
        if (day.isFreeDay) return null

        const slots = examLookup.get(`${day.date}|${time}`) ?? []

        return (
          <motion.div
            key={day.date}
            className={`px-1.5 py-1.5 ${!isLastRow ? 'border-b border-stone-100' : ''}`}
            style={{ gridColumn: colIdx + 2 }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.25,
              delay: Math.min(0.2 + colIdx * 0.02 + rowIdx * 0.05, 0.8),
              ease: 'easeOut',
            }}
          >
            {slots.map((slot) => (
              <ExamCard
                key={slot.id}
                slot={slot}
                variant="desktop"
                isLastExam={slot.id === lastExamId}
              />
            ))}
          </motion.div>
        )
      })}
    </>
  )
}

// ─────────────────────────────────────────────
// Day header cell
// ─────────────────────────────────────────────

function DayHeader({ day }: { day: ExamDay }) {
  const hasExams = !day.isFreeDay

  return (
    <div
      className={`px-2 pt-3 pb-2 text-center ${
        hasExams
          ? 'border-b-2 border-salmon-400'
          : 'border-b border-dashed border-stone-200'
      }`}
    >
      <span className={`block text-[10px] uppercase tracking-wider font-medium leading-none ${
        hasExams ? 'text-stone-400' : 'text-stone-300'
      }`}>
        {day.dayOfWeek.slice(0, 3)}
      </span>
      <span
        className={`block mt-1 font-display leading-none ${
          hasExams
            ? 'text-2xl font-semibold text-warm-text-primary'
            : 'text-lg text-stone-300'
        }`}
      >
        {day.dayOfMonth}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────
// Time label (row header)
// ─────────────────────────────────────────────

function TimeLabel({ time }: { time: string }) {
  return (
    <div className="flex items-start justify-end pr-2 pt-2.5 border-r border-stone-200">
      <span className="text-[11px] font-medium tabular-nums text-stone-400 leading-none whitespace-nowrap">
        {formatTime(time)}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────
// Inline celebration (rendered in first free day after last exam)
// ─────────────────────────────────────────────

function InlineCelebration() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.75, ease: 'easeOut' }}
      className="absolute inset-0 flex flex-col items-center justify-center z-[1]"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{
          duration: 0.4,
          delay: 0.9,
          type: 'spring',
          stiffness: 200,
        }}
      >
        <PartyPopper className="size-5 text-salmon-500 mb-1.5" />
      </motion.div>
      <span className="font-display text-base font-semibold text-warm-text-primary leading-tight">
        Finished.
      </span>
      <span className="text-[10px] text-stone-400 mt-0.5">
        Enjoy the summer
      </span>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// ExamCard — unified for desktop + mobile
// ─────────────────────────────────────────────

function ExamCard({
  slot,
  variant,
  isLastExam,
}: {
  slot: ExamSlot
  variant: 'desktop' | 'mobile'
  isLastExam: boolean
}) {
  const googleUrl = generateGoogleCalendarUrl(slot)
  const duration = formatDuration(slot.startTime, slot.endTime)
  const { subject, descriptor } = parseExamLabel(slot.label)

  if (variant === 'mobile') {
    return (
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-serif text-base text-warm-text-primary leading-snug">
            {slot.label}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-sm text-stone-500 tabular-nums">
              {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
            </span>
            <span className="rounded-full bg-cream-200 px-2 py-0.5 text-[11px] font-medium text-stone-500 tabular-nums">
              {duration}
            </span>
          </div>
          {isLastExam && (
            <span className="mt-1 inline-block text-[10px] font-medium text-salmon-500 uppercase tracking-wider">
              Your last exam
            </span>
          )}
        </div>
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 mt-1 flex items-center gap-1 rounded-md px-2 py-1 text-stone-300 hover:text-salmon-500 transition-colors"
          title="Add to Google Calendar"
        >
          <Calendar className="size-4" />
        </a>
      </div>
    )
  }

  // Desktop variant
  const minHeight = getExamCardMinHeight(slot.startTime, slot.endTime)

  return (
    <div
      className="group flex flex-col rounded-md border border-stone-200 bg-white px-2.5 py-2 hover:border-salmon-300 hover:shadow-sm transition-all mb-1 last:mb-0"
      style={{ minHeight }}
    >
      {/* Subject */}
      <p className="font-serif text-[13px] text-warm-text-primary leading-snug">
        {subject}
      </p>
      {descriptor && (
        <p className="text-[11px] italic text-stone-400 leading-tight">
          {descriptor}
        </p>
      )}
      {/* Duration + calendar */}
      <div className="mt-1 flex items-center gap-1.5">
        <span className="rounded border border-stone-400 bg-white px-1.5 py-0.5 text-[10px] font-medium text-stone-500 tabular-nums">
          {duration}
        </span>
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
          title="Add to Google Calendar"
        >
          <Calendar className="size-3 text-stone-300 hover:text-salmon-500 transition-colors" />
        </a>
      </div>
      {/* Time range */}
      <p className="mt-auto text-[11px] text-stone-400 tabular-nums leading-tight">
        {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
      </p>
      {isLastExam && (
        <span className="mt-1 inline-block text-[10px] font-medium text-salmon-500 uppercase tracking-wider">
          Last exam
        </span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Mobile: Vertical timetable
// ─────────────────────────────────────────────

function MobileTimetable({
  days,
  lastExamId,
}: {
  days: ExamDay[]
  lastExamId: string | null
}) {
  // Find the date of the last exam for the celebration banner
  const lastExamDate = useMemo(() => {
    for (let i = days.length - 1; i >= 0; i--) {
      if (!days[i].isFreeDay && days[i].slots.length > 0) return days[i].date
    }
    return null
  }, [days])

  return (
    <div className="md:hidden">
      {days.map((day) => {
        const isLastExamDay = !day.isFreeDay && lastExamDate === day.date

        return (
          <div key={day.date}>
            <MobileDayBlock day={day} lastExamId={lastExamId} />
            {isLastExamDay && <MobileFinished />}
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────
// Mobile day block
// ─────────────────────────────────────────────

function MobileDayBlock({
  day,
  lastExamId,
}: {
  day: ExamDay
  lastExamId: string | null
}) {
  if (day.isFreeDay) {
    return (
      <div className="border-b border-stone-100 py-2.5 flex items-baseline gap-3">
        <span className="text-[10px] uppercase tracking-wider text-stone-300 font-medium w-7">
          {day.dayOfWeek.slice(0, 3)}
        </span>
        <span className="text-sm font-display text-stone-300">
          {day.dayOfMonth}
        </span>
        <span className="text-sm font-serif italic text-stone-300">
          — Free day
        </span>
      </div>
    )
  }

  // Group slots by start time for cleaner display
  const slotsByTime = new Map<string, ExamSlot[]>()
  for (const slot of day.slots) {
    const existing = slotsByTime.get(slot.startTime) ?? []
    existing.push(slot)
    slotsByTime.set(slot.startTime, existing)
  }
  const timeGroups = [...slotsByTime.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  )

  return (
    <div className="border-b border-stone-200 py-4">
      {/* Day header */}
      <div className="flex items-baseline gap-2.5 mb-3">
        <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
          {day.dayOfWeek.slice(0, 3)}
        </span>
        <span className="text-2xl font-display font-semibold text-warm-text-primary leading-none">
          {day.dayOfMonth}
        </span>
        <div className="flex-1 h-px bg-salmon-400/30 self-center ml-1" />
      </div>

      {/* Time-grouped exams */}
      <div className="pl-1 space-y-3">
        {timeGroups.map(([time, slots]) => (
          <div key={time}>
            <span className="block text-[11px] font-medium tabular-nums text-stone-400 mb-1.5">
              {formatTime(time)}
            </span>
            <div className="space-y-2">
              {slots.map((slot) => (
                <ExamCard
                  key={slot.id}
                  slot={slot}
                  variant="mobile"
                  isLastExam={slot.id === lastExamId}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Mobile "You're finished" celebration
// ─────────────────────────────────────────────

function MobileFinished() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="border-b border-salmon-200 bg-gradient-to-r from-cream-base to-transparent py-5 px-4"
    >
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.25,
            type: 'spring',
            stiffness: 200,
          }}
        >
          <PartyPopper className="size-5 text-salmon-500" />
        </motion.div>
        <div>
          <p className="font-display text-lg font-semibold text-warm-text-primary">
            You&apos;re finished!
          </p>
          <p className="text-sm text-warm-text-secondary">
            Enjoy the summer.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// Settings link footer
// ─────────────────────────────────────────────

function SettingsLink() {
  return (
    <div className="pt-6">
      <Link
        href="/dashboard/settings"
        className="group text-sm text-stone-400 hover:text-salmon-500 transition-colors inline-flex items-center gap-1.5"
      >
        <Settings className="size-3.5" />
        <span className="group-hover:underline underline-offset-2">
          Change my subjects
        </span>
      </Link>
    </div>
  )
}

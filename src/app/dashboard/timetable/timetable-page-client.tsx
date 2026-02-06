'use client'

import { useMemo } from 'react'
import type { UserSubjectWithSubject } from '@/lib/types/database'
import {
  getExamsForSubjects,
  groupExamsByDay,
  getExamInsights,
  generateGoogleCalendarUrl,
  generateIcsEvents,
  formatDuration,
  formatTime,
  type ExamSlot,
  type ExamDay,
  type ExamInsights,
} from '@/lib/data/exam-timetable-2026'
import { createEvents } from 'ics'
import Link from 'next/link'
import {
  Settings,
  Calendar,
  ExternalLink,
  Sun,
  Moon,
  FlagTriangleRight,
  PartyPopper,
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

  const daysUntilExams = useMemo(() => {
    if (!insights.firstExam) return 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const examStart = new Date(insights.firstExam.date + 'T00:00:00')
    const diffMs = examStart.getTime() - today.getTime()
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
  }, [insights.firstExam])

  const handleDownloadIcs = () => {
    const events = generateIcsEvents(matched)
    createEvents(events, (error, value) => {
      if (error || !value) return
      const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'leaving-cert-2026.ics'
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  const lastExamDate = insights.lastExam?.date ?? null

  // ── Empty state ──
  if (initialSubjects.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader />
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center">
          <p className="font-serif text-stone-600">
            You haven&apos;t added any subjects yet.
          </p>
          <p className="mt-2 text-sm text-stone-500">
            Go to Settings to add your subjects, then come back to see your
            personalised exam timetable.
          </p>
          <Link
            href="/dashboard/settings"
            className="group mt-4 inline-flex items-center gap-1.5 text-sm text-salmon-500 hover:text-salmon-600 transition-colors"
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

  return (
    <div className="space-y-6">
      <PageHeader />

      {/* ── At a glance (hero position) ── */}
      {insights.totalExams > 0 && (
        <AtAGlance daysUntilExams={daysUntilExams} insights={insights} />
      )}

      {/* ── Timetable container ── */}
      <div className="rounded-xl border border-stone-200 bg-cream-100 p-5 sm:p-7">
        {/* ── Month header ── */}
        <MonthHeader />

        {/* ── Day timeline ── */}
        <div className="relative md:pl-10 mt-8">
          {/* Vertical connecting line */}
          <div className="absolute left-[18px] top-8 bottom-3 w-px bg-gradient-to-b from-stone-300 via-stone-200 to-stone-200/0 hidden md:block" />

          <div className="space-y-2">
            {days.map((day) => {
              const isLastExamDay = !day.isFreeDay && lastExamDate === day.date
              return (
                <div key={day.date}>
                  <DayRow day={day} lastExamId={insights.lastExam?.id ?? null} />
                  {isLastExamDay && <YoureFinished />}
                </div>
              )
            })}
          </div>

          {/* ── Everyone finished ── */}
          <EveryoneFinished />
        </div>

      </div>

      {/* ── Footer link ── */}
      <Link
        href="/dashboard/settings"
        className="group text-sm text-salmon-500 hover:text-salmon-600 transition-colors inline-flex items-center gap-1.5"
      >
        <Settings className="size-3.5" />
        <span className="group-hover:underline underline-offset-2">
          Change my subjects
        </span>
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────
// Page header (title + subtitle only)
// ─────────────────────────────────────────────

function PageHeader() {
  return (
    <div className="mb-2">
      <h1 className="text-6xl font-serif font-normal text-warm-text-secondary">
        Your LC Timetable
      </h1>
    </div>
  )
}

// ─────────────────────────────────────────────
// Month header
// ─────────────────────────────────────────────

function MonthHeader() {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="font-display text-4xl font-semibold text-warm-text-primary tracking-tight">
          June
        </span>
        <span className="text-[11px] uppercase tracking-[0.2em] text-stone-400 font-medium">
          2026
        </span>
      </div>
      <div className="mt-2 space-y-px">
        <div className="h-px bg-stone-300" />
        <div className="h-px bg-stone-200" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// At a glance (hero position, rendered at top)
// ─────────────────────────────────────────────

function AtAGlance({
  daysUntilExams,
  insights,
}: {
  daysUntilExams: number
  insights: ExamInsights
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
      {/* Accent bar */}
      <div className="h-1 bg-gradient-to-r from-salmon-400 via-salmon-500 to-salmon-400" />
      <div className="p-4 sm:p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-medium">
          At a glance
        </p>
        <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
          {/* Hero countdown */}
          <div className="flex items-baseline gap-3">
            <span
              className="font-display text-5xl font-semibold tabular-nums text-salmon-500 leading-none"
              style={{ textShadow: '0 0 30px rgba(217,119,87,0.15)' }}
            >
              {daysUntilExams}
            </span>
            <span className="text-sm font-serif italic text-stone-400">
              days to go
            </span>
          </div>

          {/* Vertical separator (desktop only) */}
          <div className="hidden sm:block w-px h-10 bg-stone-200 self-center" />

          {/* Supporting stats */}
          <div className="flex items-end gap-6">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-display font-semibold tabular-nums text-warm-text-primary leading-none">
                {insights.examDays}
              </span>
              <span className="text-sm font-serif italic text-stone-400">
                exam days
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-display font-semibold tabular-nums text-warm-text-primary leading-none">
                {insights.freeDays}
              </span>
              <span className="text-sm font-serif italic text-stone-400">
                free days
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Day row
// ─────────────────────────────────────────────

function DayRow({ day, lastExamId }: { day: ExamDay; lastExamId: string | null }) {
  if (day.isFreeDay) {
    return (
      <div className="pt-2">
        {/* Date label */}
        <div className="relative flex items-baseline gap-2">
          {/* Timeline dot */}
          <div className="absolute left-[-22px] top-1/2 -translate-y-1/2 hidden md:block">
            <div className="size-[5px] rounded-full bg-stone-300 -translate-x-1/2" />
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-stone-300">
            {day.dayOfWeek.slice(0, 3)}
          </span>
          <span className="text-base font-display text-stone-300">{day.dayOfMonth}</span>
        </div>
        {/* Free day card */}
        <div className="rounded-lg border border-dashed border-stone-200 bg-white/30 px-4 py-2.5 mt-1">
          <span className="text-sm font-serif italic text-stone-300">
            Free day
          </span>
        </div>
      </div>
    )
  }

  // Split exams into morning (before 1pm) and afternoon (1pm and after)
  const morningSlots = day.slots.filter((s) => {
    const hour = parseInt(s.startTime.split(':')[0], 10)
    return hour < 13
  })
  const afternoonSlots = day.slots.filter((s) => {
    const hour = parseInt(s.startTime.split(':')[0], 10)
    return hour >= 13
  })

  return (
    <div className="pt-3">
      {/* Date label */}
      <div className="relative flex items-baseline gap-2.5">
        {/* Timeline dot — ring style for exam days */}
        <div className="absolute left-[-22px] top-1/2 -translate-y-1/2 hidden md:block">
          <div className="size-[7px] rounded-full bg-stone-500 ring-2 ring-stone-200 -translate-x-1/2" />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400 translate-y-[-1px]">
          {day.dayOfWeek.slice(0, 3)}
        </span>
        <span className="text-3xl font-display font-semibold text-warm-text-primary leading-none">
          {day.dayOfMonth}
        </span>
      </div>

      {/* Exam cards */}
      <div className="space-y-px mt-2">
        {morningSlots.length > 0 && (
          <SessionGroup label="Morning" icon={<Sun className="size-3" />} slots={morningSlots} lastExamId={lastExamId} />
        )}
        {afternoonSlots.length > 0 && (
          <SessionGroup label="Afternoon" icon={<Moon className="size-3" />} slots={afternoonSlots} lastExamId={lastExamId} />
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Session group (morning / afternoon)
// ─────────────────────────────────────────────

function SessionGroup({
  label,
  icon,
  slots,
  lastExamId,
}: {
  label: string
  icon: React.ReactNode
  slots: ExamSlot[]
  lastExamId: string | null
}) {
  return (
    <div>
      {/* Session label with extending line */}
      <div className="flex items-center gap-2 py-1.5">
        <span className="text-stone-300">{icon}</span>
        <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-stone-300">
          {label}
        </span>
        <div className="flex-1 h-px bg-stone-200/60" />
      </div>
      <div className="space-y-1.5 pb-2">
        {slots.map((slot) => (
          <ExamCard key={slot.id} slot={slot} isLastExam={slot.id === lastExamId} />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Exam card
// ─────────────────────────────────────────────

function ExamCard({ slot, isLastExam }: { slot: ExamSlot; isLastExam: boolean }) {
  const googleUrl = generateGoogleCalendarUrl(slot)
  const duration = formatDuration(slot.startTime, slot.endTime)

  return (
    <div className="group relative rounded-lg border border-stone-200 border-l-2 border-l-salmon-400/30 bg-white px-4 py-3 transition-all hover:shadow-sm hover:border-l-salmon-500/60">
      <div className="flex items-start justify-between gap-3">
        {/* Left: subject + time */}
        <div className="min-w-0 flex-1">
          <p className="font-serif text-base text-warm-text-primary leading-snug">
            {slot.label}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-sm text-stone-500 tabular-nums">
              {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
            </span>
            <span className="rounded-full bg-cream-200 px-2 py-0.5 text-[11px] font-medium text-stone-500 tabular-nums">
              {duration}
            </span>
          </div>
          {isLastExam && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-salmon-500/10 px-2.5 py-0.5 text-xs font-medium text-salmon-600">
                <FlagTriangleRight className="size-3" />
                Your last exam
              </span>
            </div>
          )}
        </div>

        {/* Right: Google Calendar link (visible on hover) */}
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 mt-0.5 flex items-center gap-1 rounded-md px-2 py-1 text-xs text-stone-300 transition-all hover:bg-cream-200 hover:text-salmon-500 opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Add to Google Calendar"
        >
          <Calendar className="size-3.5" />
          <ExternalLink className="size-2.5" />
        </a>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// You're finished (after student's last exam day)
// ─────────────────────────────────────────────

function YoureFinished() {
  return (
    <div className="pt-4">
      <div className="relative">
        {/* Timeline dot — salmon for milestone */}
        <div className="absolute left-[-22px] top-[24px] hidden md:block">
          <div className="size-2.5 rounded-full bg-salmon-500 ring-2 ring-salmon-300/40 -translate-x-1/2" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="overflow-hidden rounded-xl border border-salmon-400/20"
        >
          {/* Accent gradient bar */}
          <div className="h-1 bg-gradient-to-r from-salmon-400 via-salmon-500 to-salmon-400" />

          <div className="bg-gradient-to-br from-cream-base to-white px-5 py-5">
            <div className="flex items-start gap-3.5">
              {/* Celebratory icon */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.4, delay: 0.25, ease: 'easeOut' }}
                className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-salmon-500/10"
              >
                <PartyPopper className="size-5 text-salmon-500" />
              </motion.div>

              {/* Text content */}
              <div>
                <p className="font-display text-2xl font-semibold text-warm-text-primary">
                  You&apos;re finished!
                </p>
                <p className="mt-1 text-sm text-warm-text-secondary leading-relaxed">
                  That&apos;s your last exam done. You made it — enjoy the summer.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Everyone is finished (end of timetable)
// ─────────────────────────────────────────────

function EveryoneFinished() {
  return (
    <div className="pt-4">
      <div className="relative">
        <div className="absolute left-[-22px] top-[22px] hidden md:block">
          <div className="size-[5px] rounded-full bg-stone-300 -translate-x-1/2" />
        </div>
        <div className="rounded-lg border border-stone-200 bg-white px-5 py-4">
          <p className="font-display text-lg font-medium text-warm-text-primary">
            Everyone is finished!
          </p>
          <p className="mt-0.5 text-sm text-warm-text-muted">
            The Leaving Certificate 2026 is complete. Well done.
          </p>
        </div>
      </div>
    </div>
  )
}

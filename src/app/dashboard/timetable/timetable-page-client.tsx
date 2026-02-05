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
        <div className="rounded-lg border border-stone-200 bg-white p-8 text-center">
          <p className="text-stone-600">
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

      {/* ── Month header ── */}
      <MonthHeader />

      {/* ── Day timeline ── */}
      <div className="relative md:pl-7">
        {/* Vertical connecting line */}
        <div className="absolute left-3 -translate-x-1/2 top-6 bottom-3 w-px bg-stone-200 hidden md:block" />

        <div className="space-y-1">
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

      {/* ── Footer link ── */}
      <div className="pt-2">
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

      {/* ── At a glance ── */}
      {insights.totalExams > 0 && (
        <AtAGlance daysUntilExams={daysUntilExams} insights={insights} />
      )}
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
        Your Exam Timetable
      </h1>
      <p className="mt-1 text-sm text-stone-400">
        Customised based on your subjects
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────
// Month header
// ─────────────────────────────────────────────

function MonthHeader() {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-semibold text-warm-text-primary">
          June
        </span>
        <span className="text-xs uppercase tracking-widest text-stone-400">
          2026
        </span>
      </div>
      <div className="mt-1 h-px bg-stone-200" />
    </div>
  )
}

// ─────────────────────────────────────────────
// At a glance (standalone, rendered at bottom)
// ─────────────────────────────────────────────

function AtAGlance({
  daysUntilExams,
  insights,
}: {
  daysUntilExams: number
  insights: ExamInsights
}) {
  return (
    <div className="rounded-sm border border-stone-300 bg-white overflow-hidden">
      {/* Accent bar */}
      <div className="h-1 bg-stone-600" />
      <div className="p-5">
        <p className="text-[10px] uppercase tracking-widest text-stone-400">
          At a glance
        </p>
        <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          {/* Hero countdown */}
          <div className="flex flex-col">
            <span
              className="font-display text-5xl font-semibold tabular-nums text-salmon-500"
              style={{ textShadow: '0 0 20px rgba(217,119,87,0.2)' }}
            >
              {daysUntilExams}
            </span>
            <span className="text-xs uppercase tracking-wider text-stone-400">
              days to go
            </span>
          </div>

          {/* Vertical separator (desktop only) */}
          <div className="hidden sm:block w-px h-12 bg-stone-200" />

          {/* Supporting stats */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-2xl font-serif tabular-nums text-warm-text-primary">
                {insights.examDays}
              </span>
              <span className="text-xs uppercase tracking-wider text-stone-400">
                exam days
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-serif tabular-nums text-warm-text-primary">
                {insights.freeDays}
              </span>
              <span className="text-xs uppercase tracking-wider text-stone-400">
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
      <div>
        <div className="pt-3">
          {/* Date label */}
          <div className="relative flex items-baseline gap-2">
            {/* Timeline dot */}
            <div className="absolute left-[-19px] top-1/2 -translate-y-1/2 hidden md:block">
              <div className="size-1.5 rounded-full bg-stone-300" />
            </div>
            <span className="text-xs font-medium uppercase tracking-wider text-stone-300">
              {day.dayOfWeek.slice(0, 3)}
            </span>
            <span className="text-lg font-serif text-stone-300">{day.dayOfMonth}</span>
          </div>
        </div>
        {/* Free day card */}
        <div className="rounded-md border border-dashed border-stone-200 bg-white/40 px-4 py-3 mt-1">
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
    <div>
      <div className="pt-3">
        {/* Date label */}
        <div className="relative flex items-baseline gap-2">
          {/* Timeline dot */}
          <div className="absolute left-[-19px] top-1/2 -translate-y-1/2 hidden md:block">
            <div className="size-1.5 rounded-full bg-stone-500" />
          </div>
          <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
            {day.dayOfWeek.slice(0, 3)}
          </span>
          <span className="text-2xl font-serif text-warm-text-primary leading-none">
            {day.dayOfMonth}
          </span>
        </div>
      </div>

      {/* Exam cards */}
      <div className="space-y-px mt-1">
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
      {/* Session label */}
      <div className="flex items-center gap-1.5 px-1 py-1.5">
        <span className="text-stone-300">{icon}</span>
        <span className="text-[10px] font-medium uppercase tracking-widest text-stone-300">
          {label}
        </span>
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
    <div className="group relative rounded-md border border-stone-200 bg-white px-4 py-3 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        {/* Left: subject + time */}
        <div className="min-w-0 flex-1">
          <p className="font-serif text-base text-warm-text-primary leading-snug">
            {slot.label}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-sm text-stone-500 tabular-nums">
              {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
            </span>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500 tabular-nums">
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
          className="shrink-0 mt-0.5 flex items-center gap-1 rounded-md px-2 py-1 text-xs text-stone-300 transition-colors hover:bg-stone-50 hover:text-salmon-500 opacity-0 group-hover:opacity-100 focus:opacity-100"
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
    <div className="pt-3">
      <div className="relative">
        {/* Timeline dot — salmon for milestone */}
        <div className="absolute left-[-20px] top-[23px] hidden md:block">
          <div className="size-2 rounded-full bg-salmon-500" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="overflow-hidden rounded-md border border-salmon-400/25"
        >
          {/* Accent gradient bar */}
          <div className="h-1 bg-gradient-to-r from-salmon-400 via-salmon-500 to-salmon-400" />

          <div className="bg-gradient-to-br from-cream-base to-white px-5 py-4">
            <div className="flex items-start gap-3.5">
              {/* Celebratory icon */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.4, delay: 0.25, ease: 'easeOut' }}
                className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-salmon-500/10"
              >
                <PartyPopper className="size-[18px] text-salmon-500" />
              </motion.div>

              {/* Text content */}
              <div>
                <p className="font-display text-2xl font-semibold text-warm-text-primary">
                  You&apos;re finished!
                </p>
                <p className="mt-0.5 text-sm text-warm-text-secondary">
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
    <div className="pt-3">
      <div className="relative">
        <div className="absolute left-[-19px] top-[23px] hidden md:block">
          <div className="size-1.5 rounded-full bg-stone-300" />
        </div>
        <div className="rounded-md border border-stone-200 bg-white px-4 py-3">
          <p className="font-display text-lg font-medium text-warm-text-primary">
            Everyone is finished!
          </p>
          <p className="text-sm text-warm-text-muted">
            The Leaving Certificate 2026 is complete. Well done.
          </p>
        </div>
      </div>
    </div>
  )
}

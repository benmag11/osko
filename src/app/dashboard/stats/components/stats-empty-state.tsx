'use client'

import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export function StatsEmptyState() {
  return (
    <div className="mt-12 flex flex-col items-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
        <BookOpen className="h-6 w-6 text-warm-text-muted" />
      </div>
      <h2 className="mt-4 text-base font-medium text-warm-text-primary">
        No questions completed yet
      </h2>
      <p className="mt-1 max-w-sm text-sm text-warm-text-muted">
        Start studying to see your progress here. Mark questions as complete as you work through them.
      </p>
      <Link
        href="/dashboard/study"
        className="mt-6 inline-flex items-center rounded-lg bg-salmon-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-salmon-600"
      >
        Start Studying
      </Link>
    </div>
  )
}

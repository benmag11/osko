'use client'

import { useState } from 'react'
import { useCompletionStats } from '@/lib/hooks/use-completion-stats'
import { StatsHeader } from './stats-header'
import { TimePeriodSelector } from './time-period-selector'
import { SubjectSelector } from './subject-selector'
import { TopicBreakdown } from './topic-breakdown'
import { StatsEmptyState } from './stats-empty-state'
import type { TimePeriod } from '@/lib/types/stats'
import type { UserSubjectWithSubject } from '@/lib/types/database'

interface StatsPageClientProps {
  userId: string
  userSubjects: UserSubjectWithSubject[]
}

export function StatsPageClient({ userId, userSubjects }: StatsPageClientProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    userSubjects[0]?.subject_id ?? ''
  )

  const { data: stats, isLoading, isFetching } = useCompletionStats(userId, timePeriod)

  if (isLoading) {
    return <StatsLoadingSkeleton />
  }

  if (!stats || stats.total_completions === 0) {
    return (
      <div>
        <StatsHeader />
        <StatsEmptyState />
      </div>
    )
  }

  return (
    <div className={isFetching ? 'opacity-75 transition-opacity duration-200' : ''}>
      <StatsHeader />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SubjectSelector
          subjects={userSubjects}
          selectedSubjectId={selectedSubjectId}
          onSelect={setSelectedSubjectId}
        />
        <TimePeriodSelector
          value={timePeriod}
          onChange={setTimePeriod}
        />
      </div>

      <div className="mt-3">
        <TopicBreakdown
          subjectId={selectedSubjectId}
          topicStats={stats.by_topic.filter(t => t.subject_id === selectedSubjectId)}
          audioTopicStats={stats.by_audio_topic.filter(t => t.subject_id === selectedSubjectId)}
        />
      </div>
    </div>
  )
}

function StatsLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-12 w-fit">
        <div className="h-14 w-64 rounded bg-stone-200" />
      </div>
      <div className="flex gap-3">
        <div className="h-8 w-40 rounded-md bg-stone-200" />
        <div className="ml-auto h-8 w-48 rounded bg-stone-200" />
      </div>
      <div className="mt-3 space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-3 py-1.5">
            <div className="w-1/3 h-4 rounded bg-stone-200" />
            <div className="flex-1 h-3 rounded-full bg-stone-100" />
            <div className="w-10 h-4 rounded bg-stone-200" />
          </div>
        ))}
      </div>
    </div>
  )
}

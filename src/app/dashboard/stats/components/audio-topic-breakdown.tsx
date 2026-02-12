'use client'

import { TopicRow } from './topic-breakdown'
import type { TopicStats } from '@/lib/types/stats'

interface AudioTopicBreakdownProps {
  topicStats: TopicStats[]
}

export function AudioTopicBreakdown({ topicStats }: AudioTopicBreakdownProps) {
  if (topicStats.length === 0) {
    return null
  }

  const maxCompleted = Math.max(...topicStats.map(t => t.unique_completed))

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5">
      {/* Column headings */}
      <div className="flex items-center gap-3 mb-3">
        <span className="w-1/3 text-xs text-stone-400 uppercase tracking-wide">Topic</span>
        <span className="flex-1" />
        <span className="w-10 text-right text-xs text-stone-400 uppercase tracking-wide">Done</span>
      </div>

      {topicStats.map(topic => (
        <TopicRow
          key={topic.topic_id}
          name={topic.topic_name}
          completed={topic.unique_completed}
          maxCompleted={maxCompleted}
        />
      ))}
    </div>
  )
}

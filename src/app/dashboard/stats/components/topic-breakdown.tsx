'use client'

import { ChevronRight } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useGroupedTopics } from '@/lib/hooks/use-grouped-topics'
import type { TopicStats } from '@/lib/types/stats'

interface TopicBreakdownProps {
  subjectId: string
  topicStats: TopicStats[]
  audioTopicStats?: TopicStats[]
}

export function TopicBreakdown({ subjectId, topicStats, audioTopicStats }: TopicBreakdownProps) {
  const { groupedTopics, isLoading } = useGroupedTopics(subjectId)

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-8 rounded bg-stone-100" />
        ))}
      </div>
    )
  }

  if (!groupedTopics) {
    return (
      <p className="text-sm text-warm-text-muted">
        No topic data available.
      </p>
    )
  }

  const statsMap = new Map(topicStats.map(t => [t.topic_id, t]))

  const maxCompleted = topicStats.length > 0
    ? Math.max(...topicStats.map(t => t.unique_completed))
    : 0

  const { ungrouped, groups } = groupedTopics

  const audioMaxCompleted = audioTopicStats && audioTopicStats.length > 0
    ? Math.max(...audioTopicStats.map(t => t.unique_completed))
    : 0

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5">
      {/* Topics section label + column headings */}
      <div className="flex items-center gap-3 mb-1">
        <span className="w-1/3 text-xs text-stone-400 uppercase tracking-wide">Topics</span>
        <span className="flex-1" />
        <span className="w-10 text-right text-xs text-stone-400 uppercase tracking-wide">Done</span>
      </div>

      {/* Ungrouped topics */}
      {ungrouped.map(topic => {
        const stat = statsMap.get(topic.id)
        return (
          <TopicRow
            key={topic.id}
            name={topic.name}
            completed={stat?.unique_completed ?? 0}
            maxCompleted={maxCompleted}
          />
        )
      })}

      {/* Grouped topics */}
      {groups.map(({ group, topics }, index) => (
        <Collapsible
          key={group.id}
          defaultOpen
          className={`group ${index === 0 && ungrouped.length === 0 ? '' : 'mt-4'}`}
        >
          <CollapsibleTrigger className="flex items-center gap-1.5 mb-1 cursor-pointer">
            <ChevronRight className="h-3 w-3 text-stone-400 transition-transform duration-200 group-data-[state=open]:rotate-90" />
            <span className="text-xs text-stone-500">{group.name}</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {topics.map(topic => {
              const stat = statsMap.get(topic.id)
              return (
                <TopicRow
                  key={topic.id}
                  name={topic.name}
                  completed={stat?.unique_completed ?? 0}
                  maxCompleted={maxCompleted}
                />
              )
            })}
          </CollapsibleContent>
        </Collapsible>
      ))}

      {/* Audio Topics section — conditional */}
      {audioTopicStats && audioTopicStats.length > 0 && (
        <>
          <p className="text-xs text-stone-400 uppercase tracking-wide mt-5 mb-1">Audio Topics</p>
          {audioTopicStats.map(topic => (
            <TopicRow
              key={topic.topic_id}
              name={topic.topic_name}
              completed={topic.unique_completed}
              maxCompleted={audioMaxCompleted}
            />
          ))}
        </>
      )}
    </div>
  )
}

export function TopicRow({
  name,
  completed,
  maxCompleted,
}: {
  name: string
  completed: number
  maxCompleted: number
}) {
  const barWidth = maxCompleted > 0 ? (completed / maxCompleted) * 100 : 0

  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="w-1/3 text-sm text-warm-text-primary truncate">{name}</span>
      <div className="flex-1 h-5 rounded-md bg-stone-100">
        <div
          className="h-5 rounded-md bg-salmon-400 transition-all duration-500"
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <span className="w-10 text-right text-sm text-warm-text-muted">{completed}</span>
    </div>
  )
}

'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { useFilters } from '@/components/providers/filter-provider'
import type { Topic } from '@/lib/types/database'

interface TopicsPanelProps {
  topics: Topic[]
}

export function TopicsPanel({ topics }: TopicsPanelProps) {
  const { filters, toggleTopic, isPending } = useFilters()

  if (topics.length === 0) {
    return (
      <p className="text-sm text-warm-text-muted py-2">
        No topics available for this subject.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {topics.map((topic) => (
        <label
          key={topic.id}
          className={`flex cursor-pointer items-center gap-3 px-2 py-1.5 rounded-md hover:bg-cream-200/50 transition-colors ${
            isPending ? 'opacity-70' : ''
          }`}
        >
          <Checkbox
            checked={filters.topicIds?.includes(topic.id) ?? false}
            onCheckedChange={() => toggleTopic(topic.id)}
            disabled={isPending}
            className="h-4 w-4 data-[state=checked]:animate-scale-in"
          />
          <span className="text-sm font-sans text-warm-text-secondary">
            {topic.name}
          </span>
        </label>
      ))}
    </div>
  )
}

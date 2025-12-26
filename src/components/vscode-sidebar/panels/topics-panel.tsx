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
      <p className="text-sm text-stone-400 py-4 px-3 text-center">
        No topics available for this subject.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      {topics.map((topic) => (
        <label
          key={topic.id}
          className={`flex cursor-pointer items-center gap-3 px-3 py-2 rounded-md transition-colors duration-150 hover:bg-stone-50 ${
            isPending ? 'opacity-60' : ''
          }`}
        >
          <Checkbox
            checked={filters.topicIds?.includes(topic.id) ?? false}
            onCheckedChange={() => toggleTopic(topic.id)}
            disabled={isPending}
            className="h-4 w-4 border-stone-200 data-[state=checked]:bg-salmon-500 data-[state=checked]:border-salmon-500"
          />
          <span className="text-sm text-stone-600">
            {topic.name}
          </span>
        </label>
      ))}
    </div>
  )
}

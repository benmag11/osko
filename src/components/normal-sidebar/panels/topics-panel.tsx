'use client'

import * as React from 'react'
import { ChevronRight } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { useFilters } from '@/components/providers/filter-provider'
import { cn } from '@/lib/utils'
import type { Topic, TopicGroup, GroupedTopics } from '@/lib/types/database'

interface TopicsPanelProps {
  groupedTopics: GroupedTopics | null
  topics: Topic[]
}

export function TopicsPanel({ groupedTopics, topics }: TopicsPanelProps) {
  const { filters, toggleTopic, isPending } = useFilters()

  // Track which groups are expanded (default: all expanded)
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set())

  // Initialize expanded groups when groupedTopics first becomes available
  const hasInitialized = React.useRef(false)
  React.useEffect(() => {
    if (groupedTopics && !hasInitialized.current) {
      setExpandedGroups(new Set(groupedTopics.groups.map(g => g.group.id)))
      hasInitialized.current = true
    }
  }, [groupedTopics])

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  // Fallback to flat list if no grouped data available
  if (!groupedTopics) {
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
          <TopicCheckbox
            key={topic.id}
            topic={topic}
            checked={filters.topicIds?.includes(topic.id) ?? false}
            onToggle={() => toggleTopic(topic.id)}
            disabled={isPending}
          />
        ))}
      </div>
    )
  }

  const hasTopics = groupedTopics.ungrouped.length > 0 || groupedTopics.groups.length > 0

  if (!hasTopics) {
    return (
      <p className="text-sm text-stone-400 py-4 px-3 text-center">
        No topics available for this subject.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      {/* Ungrouped topics first */}
      {groupedTopics.ungrouped.map((topic) => (
        <TopicCheckbox
          key={topic.id}
          topic={topic}
          checked={filters.topicIds?.includes(topic.id) ?? false}
          onToggle={() => toggleTopic(topic.id)}
          disabled={isPending}
        />
      ))}

      {/* Grouped topics */}
      {groupedTopics.groups.map(({ group, topics: groupTopics }) => (
        <TopicGroupCollapsible
          key={group.id}
          group={group}
          topics={groupTopics}
          isExpanded={expandedGroups.has(group.id)}
          onToggleExpand={() => toggleGroup(group.id)}
          selectedTopicIds={filters.topicIds || []}
          onToggleTopic={toggleTopic}
          disabled={isPending}
        />
      ))}
    </div>
  )
}

// Individual topic checkbox component
interface TopicCheckboxProps {
  topic: Topic
  checked: boolean
  onToggle: () => void
  disabled: boolean
  indented?: boolean
}

function TopicCheckbox({
  topic,
  checked,
  onToggle,
  disabled,
  indented = false
}: TopicCheckboxProps) {
  return (
    <label
      className={cn(
        'group flex cursor-pointer items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors duration-150 hover:bg-stone-50/50',
        disabled && 'opacity-60',
        indented && 'pl-7'
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        disabled={disabled}
        className="h-4 w-4 border-stone-500 data-[state=checked]:bg-salmon-500 data-[state=checked]:border-salmon-500"
      />
      <span className="text-sm text-stone-700 transition-colors group-hover:text-stone-900">
        {topic.name}
      </span>
    </label>
  )
}

// Collapsible group component
interface TopicGroupCollapsibleProps {
  group: TopicGroup
  topics: Topic[]
  isExpanded: boolean
  onToggleExpand: () => void
  selectedTopicIds: string[]
  onToggleTopic: (topicId: string) => void
  disabled: boolean
}

function TopicGroupCollapsible({
  group,
  topics,
  isExpanded,
  onToggleExpand,
  selectedTopicIds,
  onToggleTopic,
  disabled
}: TopicGroupCollapsibleProps) {
  // Count how many topics in this group are selected
  const selectedCount = topics.filter(t => selectedTopicIds.includes(t.id)).length

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full cursor-pointer items-center gap-1.5 px-3 py-1 rounded-md transition-colors duration-150 hover:bg-stone-50/50',
            disabled && 'opacity-60'
          )}
        >
          <span className="text-xs text-stone-500">
            {group.name}
          </span>
          <ChevronRight
            className={cn(
              'h-3 w-3 shrink-0 text-stone-400 transition-transform duration-200',
              isExpanded && 'rotate-90'
            )}
          />
          {selectedCount > 0 && (
            <span className="ml-auto text-xs text-salmon-500 font-medium">
              {selectedCount}
            </span>
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-0.5 mt-0.5">
          {topics.map((topic) => (
            <TopicCheckbox
              key={topic.id}
              topic={topic}
              checked={selectedTopicIds.includes(topic.id)}
              onToggle={() => onToggleTopic(topic.id)}
              disabled={disabled}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

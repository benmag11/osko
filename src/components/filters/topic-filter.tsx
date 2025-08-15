'use client'

import { useMemo, useCallback } from 'react'
import { ListFilter } from 'lucide-react'
import { CollapsibleFilter } from './collapsible-filter'
import { useFilterUpdates } from '@/lib/hooks/use-filter-updates'
import type { Topic, Filters } from '@/lib/types/database'

interface TopicFilterProps {
  topics: Topic[]
  filters: Filters
}

export function TopicFilter({ topics, filters }: TopicFilterProps) {
  const { toggleTopic } = useFilterUpdates(filters)
  
  const filterItems = useMemo(() => 
    topics.map(topic => ({
      id: topic.id,
      label: topic.name
    })), [topics])

  const handleToggle = useCallback((id: string | number) => {
    toggleTopic(id as string)
  }, [toggleTopic])

  return (
    <CollapsibleFilter
      title="Study by topic"
      icon={ListFilter}
      items={filterItems}
      selectedIds={filters.topicIds}
      onToggle={handleToggle}
    />
  )
}
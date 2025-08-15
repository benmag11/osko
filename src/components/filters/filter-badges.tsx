'use client'

import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useFilterUpdates } from '@/lib/hooks/use-filter-updates'
import type { Topic, Filters } from '@/lib/types/database'

interface FilterBadgesProps {
  topics: Topic[]
  filters: Filters
}

export function FilterBadges({ topics, filters }: FilterBadgesProps) {
  const { toggleTopic, toggleYear, updateUrl, clearAllFilters } = useFilterUpdates(filters)
  
  const hasFilters = !!(
    filters.searchTerm ||
    filters.topicIds?.length ||
    filters.years?.length
  )

  if (!hasFilters) return null

  const getTopicName = (id: string) => 
    topics.find(t => t.id === id)?.name || ''

  return (
    <div className="space-y-4">
      <h2 className="text-[32px] font-bold text-exam-text-secondary">
        Current filters
      </h2>
      
      <div className="flex flex-wrap items-center gap-3">
        {filters.searchTerm && (
          <Badge 
            variant="outline"
            className="flex h-[34px] items-center gap-1.5 rounded-[10px] border-exam-border-secondary bg-white px-3"
          >
            <button
              onClick={() => updateUrl({ searchTerm: undefined })}
              className="flex items-center"
            >
              <X className="h-4 w-4 text-[#404040]" />
            </button>
            <span className="text-exam-text-muted">Keyword :</span>
            <span className="text-primary">&apos;{filters.searchTerm}&apos;</span>
          </Badge>
        )}

        {filters.topicIds?.map((topicId) => (
          <Badge 
            key={topicId}
            variant="outline"
            className="flex h-[34px] items-center gap-1.5 rounded-[10px] border-exam-border-secondary bg-white px-3"
          >
            <button
              onClick={() => toggleTopic(topicId)}
              className="flex items-center"
            >
              <X className="h-4 w-4 text-[#404040]" />
            </button>
            <span className="text-primary">{getTopicName(topicId)}</span>
          </Badge>
        ))}

        {filters.years?.map((year) => (
          <Badge 
            key={year}
            variant="outline"
            className="flex h-[34px] items-center gap-1.5 rounded-[10px] border-exam-border-secondary bg-white px-3"
          >
            <button
              onClick={() => toggleYear(year)}
              className="flex items-center"
            >
              <X className="h-4 w-4 text-[#404040]" />
            </button>
            <span className="text-primary">{year}</span>
          </Badge>
        ))}

        <Button
          onClick={clearAllFilters}
          className="flex h-8 items-center gap-2 rounded-md bg-[#727272] px-3 text-white hover:bg-[#727272]/90"
        >
          <X className="h-4 w-4" />
          Clear all
        </Button>
      </div>
    </div>
  )
}
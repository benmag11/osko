'use client'

import { FilterTag } from './filter-tag'
import { ClearFiltersButton } from './clear-filters-button'
import { useFilterUpdates } from '@/lib/hooks/use-filter-updates'
import type { Topic, Filters } from '@/lib/types/database'

interface AppliedFiltersDisplayProps {
  topics: Topic[]
  filters: Filters
}

export function AppliedFiltersDisplay({ topics, filters }: AppliedFiltersDisplayProps) {
  const { toggleTopic, toggleYear, removeSearchTerm, clearAllFilters } = useFilterUpdates(filters)
  
  const hasFilters = !!(
    filters.searchTerms?.length ||
    filters.topicIds?.length ||
    filters.years?.length
  )

  if (!hasFilters) return null

  const getTopicName = (id: string) => 
    topics.find(t => t.id === id)?.name || ''

  return (
    <div className="relative w-full rounded-[20px] bg-[#f5f4ed]">
      <div className="flex flex-col gap-[41px] p-[35px]">
        <h2 className="font-serif text-[40px] font-normal leading-[29.892px] text-[#2e2e2e]">
          Applied filters
        </h2>
        
        <div className="flex flex-wrap items-start gap-2">
          {filters.searchTerms?.map((term) => (
            <FilterTag
              key={term}
              label={`Keyword: '${term}'`}
              onRemove={() => removeSearchTerm(term)}
            />
          ))}

          {filters.topicIds?.map((topicId) => (
            <FilterTag
              key={topicId}
              label={getTopicName(topicId)}
              onRemove={() => toggleTopic(topicId)}
            />
          ))}

          {filters.years?.map((year) => (
            <FilterTag
              key={year}
              label={year.toString()}
              onRemove={() => toggleYear(year)}
            />
          ))}

          <ClearFiltersButton onClick={clearAllFilters} />
        </div>
      </div>
      
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute inset-0 rounded-[20px] border border-[#f0eee6]" 
      />
    </div>
  )
}
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

  const getTopicName = (id: string) => 
    topics.find(t => t.id === id)?.name || ''

  return (
    <div className="relative w-full rounded-[20px] bg-[#f5f4ed]">
      <div className="flex flex-col gap-[41px] p-[35px]">
        <h2 className="font-serif text-[40px] font-semibold leading-[29.892px] text-warm-text-primary">
          Applied filters
        </h2>
        
        <div className="flex min-h-[40px] flex-wrap items-start gap-2">
          {hasFilters ? (
            <>
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
            </>
          ) : (
            <div className="flex h-[40px] items-center">
              <p className="font-sans text-lg text-warm-text-muted">
                No filters applied... Select some topics to get started!
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute inset-0 rounded-[20px] border border-[#f0eee6]" 
      />
    </div>
  )
}
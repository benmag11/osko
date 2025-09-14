'use client'

import { AppliedFiltersDisplay } from '@/components/filters/applied-filters-display'
import { QuestionCard } from './question-card'
import { Separator } from '@/components/ui/separator'
import { useQuestionsQuery } from '@/lib/hooks/use-questions-query'
import { useZoom } from '@/components/providers/zoom-provider'
import { ZoomControls } from './zoom-controls'
import { useFilters } from '@/components/providers/filter-provider'
import type { Topic, PaginatedResponse } from '@/lib/types/database'

interface FilteredQuestionsViewProps {
  topics: Topic[]
  initialData: PaginatedResponse
}

export function FilteredQuestionsView({ topics, initialData }: FilteredQuestionsViewProps) {
  const { filters, urlFilters, isSyncing } = useFilters()

  const {
    questions,
    totalCount,
    isFetchingNextPage,
    loadMoreRef,
    isLoading,
    error
  } = useQuestionsQuery({
    filters: urlFilters, // Use URL filters for actual data fetching
    initialData,
  })

  const { zoomLevel, isEnabled, isLoading: isZoomLoading } = useZoom()

  return (
    <>
      <AppliedFiltersDisplay
        topics={topics}
        filters={filters} // Use optimistic filters for instant UI feedback
        totalCount={totalCount}
        isLoading={isLoading}
      />

      <ZoomControls />

      <div className="relative">
        {/* Loading overlay for filter changes */}
        {isSyncing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm animate-fade-in">
            <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-lg">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">Applying filters...</span>
            </div>
          </div>
        )}

        <div
          className="origin-top transition-transform duration-200 ease-out"
          style={{
            // Only apply transform on desktop and when not loading
            transform: isEnabled && !isZoomLoading ? `scale(${zoomLevel})` : undefined,
            transformOrigin: 'top center',
          }}
        >
          <div>
        {error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-xl text-salmon-600 font-serif">Error loading questions</p>
            <p className="mt-2 text-exam-text-muted">Please try refreshing the page</p>
          </div>
        ) : questions.length === 0 && !isFetchingNextPage ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-xl text-exam-text-primary">No questions found</p>
            <p className="mt-2 text-exam-text-muted">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {questions.map((question, index) => (
              <div key={question.id}>
                {index > 0 && (
                  <div className="py-20">
                    <Separator className="bg-exam-text-muted/30" />
                  </div>
                )}
                <QuestionCard question={question} />
              </div>
            ))}
            
            <div ref={loadMoreRef} className="h-20 mt-8">
              {isFetchingNextPage && (
                <div className="flex justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
            </div>
          </>
        )}
          </div>
        </div>
      </div>
    </>
  )
}
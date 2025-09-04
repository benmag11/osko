'use client'

import { AppliedFiltersDisplay } from '@/components/filters/applied-filters-display'
import { QuestionCard } from './question-card'
import { Separator } from '@/components/ui/separator'
import { useQuestionsQuery } from '@/lib/hooks/use-questions-query'
import type { Topic, Filters, PaginatedResponse } from '@/lib/types/database'

interface FilteredQuestionsViewProps {
  topics: Topic[]
  filters: Filters
  initialData: PaginatedResponse
}

export function FilteredQuestionsView({ topics, filters, initialData }: FilteredQuestionsViewProps) {
  const { 
    questions, 
    totalCount,
    isFetchingNextPage, 
    loadMoreRef,
    isLoading,
    error
  } = useQuestionsQuery({
    filters,
    initialData,
  })

  return (
    <>
      <AppliedFiltersDisplay 
        topics={topics} 
        filters={filters} 
        totalCount={totalCount}
        isLoading={isLoading}
      />
      
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
    </>
  )
}
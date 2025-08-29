'use client'

import { Separator } from '@/components/ui/separator'
import { QuestionCard } from './question-card'
import { useQuestionsQuery } from '@/lib/hooks/use-questions-query'
import type { Filters, PaginatedResponse } from '@/lib/types/database'

interface QuestionListProps {
  initialData: PaginatedResponse
  filters: Filters
}

export function QuestionList({ initialData, filters }: QuestionListProps) {
  const { 
    questions, 
    isFetchingNextPage, 
    loadMoreRef,
    error
  } = useQuestionsQuery({
    filters,
    initialData,
  })

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-xl text-salmon-600 font-serif">Error loading questions</p>
        <p className="mt-2 text-exam-text-muted">Please try refreshing the page</p>
      </div>
    )
  }

  if (questions.length === 0 && !isFetchingNextPage) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-xl text-exam-text-primary">No questions found</p>
        <p className="mt-2 text-exam-text-muted">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {questions.map((question, index) => (
        <div key={question.id}>
          {index > 0 && (
            <Separator className="mb-8 bg-exam-text-muted/30" />
          )}
          <QuestionCard question={question} />
        </div>
      ))}
      
      <div ref={loadMoreRef} className="h-20">
        {isFetchingNextPage && (
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  )
}
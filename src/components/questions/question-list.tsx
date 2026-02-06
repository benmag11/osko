'use client'

import { Separator } from '@/components/ui/separator'
import { QuestionCard } from './question-card'
import { EXAM_VIEW_BASE_MAX_WIDTH_PX } from './constants'
import { useQuestionsQuery } from '@/lib/hooks/use-questions-query'
import type { Filters, PaginatedResponse } from '@/lib/types/database'
import { useAuth } from '@/components/providers/auth-provider'
import { useTopics } from '@/lib/hooks/use-topics'

interface QuestionListProps {
  initialData: PaginatedResponse
  filters: Filters
}

export function QuestionList({ initialData, filters }: QuestionListProps) {
  const { user, profile } = useAuth()
  const { topics } = useTopics(filters.subjectId)
  const canReport = Boolean(user)
  const isAdmin = Boolean(profile?.is_admin)
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
    <div>
      {questions.map((question, index) => (
        <div key={question.id}>
          {index > 0 && (
            <div className="py-20">
              <Separator className="bg-exam-text-muted/30" />
            </div>
          )}
          <QuestionCard
            question={question}
            zoom={1}
            availableTopics={topics}
            canReport={canReport}
            isAdmin={isAdmin}
            displayWidth={EXAM_VIEW_BASE_MAX_WIDTH_PX}
            isPriority={index === 0}
            searchTerms={filters.searchTerms}
          />
        </div>
      ))}
      
      <div ref={loadMoreRef} className="h-20 mt-8">
        {isFetchingNextPage && (
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  )
}

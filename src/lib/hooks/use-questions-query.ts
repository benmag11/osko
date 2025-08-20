'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { useEffect, useMemo } from 'react'
import { searchQuestions } from '@/lib/supabase/queries'
import { queryKeys } from '@/lib/queries/query-keys'
import type { Question, Filters, PaginatedResponse } from '@/lib/types/database'

interface UseQuestionsQueryOptions {
  filters: Filters
  initialData?: PaginatedResponse
  enabled?: boolean
}

export function useQuestionsQuery({ 
  filters, 
  initialData,
  enabled = true 
}: UseQuestionsQueryOptions) {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: queryKeys.infinite(filters),
    queryFn: async ({ pageParam, signal }) => {
      return searchQuestions(filters, pageParam, signal)
    },
    initialPageParam: null as { year: number; question_number: number } | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    enabled,
    // Provide initial data if available (from SSR)
    initialData: initialData ? {
      pages: [initialData],
      pageParams: [null],
    } : undefined,
    // Keep previous data while fetching new data for smooth transitions
    placeholderData: (previousData) => previousData,
  })

  // Flatten all pages into a single array of questions
  const questions = useMemo(() => {
    if (!data?.pages) return []
    
    // Use a Map to ensure uniqueness by ID
    const uniqueQuestions = new Map<string, Question>()
    
    data.pages.forEach(page => {
      page.questions.forEach(question => {
        // This ensures we never have duplicate IDs
        uniqueQuestions.set(question.id, question)
      })
    })
    
    return Array.from(uniqueQuestions.values())
  }, [data?.pages])

  // Automatically fetch next page when scrolling
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  return {
    questions,
    error,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    loadMoreRef: ref,
    status,
    refetch,
  }
}
'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { useEffect, useMemo } from 'react'
import { searchQuestionsClient } from '@/lib/supabase/client-queries'
import { queryKeys } from '@/lib/queries/query-keys'
import type { Question, Filters, PaginatedResponse, QuestionCursor } from '@/lib/types/database'

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
      return searchQuestionsClient(filters, pageParam, signal)
    },
    initialPageParam: null as QuestionCursor | null,
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

  // Extract total count from first page
  const totalCount = useMemo(() => {
    // Return initial data's total count if no data yet
    if (!data?.pages?.[0]) return initialData?.total_count ?? undefined
    // Return the total count from the first page
    return data.pages[0].total_count ?? 0
  }, [data?.pages, initialData?.total_count])

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
    totalCount,
    error,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    loadMoreRef: ref,
    status,
    refetch,
  }
}
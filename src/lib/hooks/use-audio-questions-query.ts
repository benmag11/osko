'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { useEffect, useMemo } from 'react'
import { searchAudioQuestionsClient } from '@/lib/supabase/audio-client-queries'
import { audioQueryKeys } from '@/lib/queries/audio-query-keys'
import type { AudioQuestion, AudioFilters, AudioPaginatedResponse, QuestionCursor } from '@/lib/types/database'

interface UseAudioQuestionsQueryOptions {
  filters: AudioFilters
  initialData?: AudioPaginatedResponse
  enabled?: boolean
  pauseAutoFetch?: boolean
}

/**
 * Hook for fetching audio questions with infinite scroll pagination
 * Mirrors the normal questions hook but uses audio-specific queries
 */
export function useAudioQuestionsQuery({
  filters,
  initialData,
  enabled = true,
  pauseAutoFetch = false
}: UseAudioQuestionsQueryOptions) {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  const {
    data,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    status,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: audioQueryKeys.infinite(filters),
    queryFn: async ({ pageParam, signal }) => {
      return searchAudioQuestionsClient(filters, { cursor: pageParam, signal })
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
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: false,
  })

  // Extract total count from first page
  const totalCount = useMemo(() => {
    if (!data?.pages?.[0]) return initialData?.total_count ?? undefined
    return data.pages[0].total_count ?? 0
  }, [data?.pages, initialData?.total_count])

  // Flatten all pages into a single array of questions
  const questions = useMemo(() => {
    if (!data?.pages) return []

    // Use a Map to ensure uniqueness by ID
    const uniqueQuestions = new Map<string, AudioQuestion>()

    data.pages.forEach(page => {
      page.questions.forEach(question => {
        uniqueQuestions.set(question.id, question)
      })
    })

    return Array.from(uniqueQuestions.values())
  }, [data?.pages])

  // Automatically fetch next page when scrolling
  useEffect(() => {
    if (!pauseAutoFetch && inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [pauseAutoFetch, inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  return {
    questions,
    totalCount,
    error,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    loadMoreRef: ref,
    fetchNextPage,
    status,
    refetch,
  }
}

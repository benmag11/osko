'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getAudioNavigationListClient } from '@/lib/supabase/audio-client-queries'
import { audioQueryKeys } from '@/lib/queries/audio-query-keys'
import { formatQuestionTitle } from '@/lib/utils/question-format'
import type { AudioFilters, AudioNavigationListResponse } from '@/lib/types/database'

export interface AudioQuestionNavigationItem {
  id: string
  title: string
  position: number
}

/**
 * Hook for fetching the audio question navigation list
 * Returns minimal data needed for sidebar navigation
 */
export function useAudioNavigationList(filters: AudioFilters) {
  const queryResult = useQuery<AudioNavigationListResponse, Error>({
    queryKey: audioQueryKeys.navigation(filters),
    queryFn: ({ signal }) => getAudioNavigationListClient(filters, { signal }),
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
    gcTime: 1000 * 60 * 30,
  })

  const items = useMemo(() => {
    if (!queryResult.data?.items) return [] as AudioQuestionNavigationItem[]

    return queryResult.data.items.map((question, index) => ({
      id: question.id,
      title: formatQuestionTitle(question),
      position: index + 1,
    }))
  }, [queryResult.data?.items])

  const totalCount = queryResult.data?.total_count ?? 0

  const idToIndex = useMemo(() => {
    const map = new Map<string, number>()
    items.forEach((item, index) => {
      map.set(item.id, index)
    })
    return map
  }, [items])

  return {
    ...queryResult,
    items,
    totalCount,
    idToIndex,
  }
}

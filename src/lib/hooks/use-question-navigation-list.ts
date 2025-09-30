'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getNavigationListClient } from '@/lib/supabase/client-queries'
import { queryKeys } from '@/lib/queries/query-keys'
import { formatQuestionTitle } from '@/lib/utils/question-format'
import type { Filters, NavigationListResponse } from '@/lib/types/database'

export interface QuestionNavigationItem {
  id: string
  title: string
  position: number
}

export function useQuestionNavigationList(filters: Filters) {
  const queryResult = useQuery<NavigationListResponse, Error>({
    queryKey: queryKeys.navigation(filters),
    queryFn: ({ signal }) => getNavigationListClient(filters, { signal }),
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
    gcTime: 1000 * 60 * 30,
  })

  const items = useMemo(() => {
    if (!queryResult.data?.items) return [] as QuestionNavigationItem[]

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

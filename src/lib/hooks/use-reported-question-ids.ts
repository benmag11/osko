'use client'

import { useQuery } from '@tanstack/react-query'
import { useIsAdmin } from './use-is-admin'
import { getPendingReportedQuestionIds } from '@/lib/supabase/report-actions'
import { CACHE_TIMES } from '@/lib/config/cache'

const EMPTY_SET = new Set<string>()

export function useReportedQuestionIds() {
  const { isAdmin } = useIsAdmin()

  const { data } = useQuery({
    queryKey: ['admin', 'reported-question-ids'],
    queryFn: getPendingReportedQuestionIds,
    enabled: isAdmin,
    staleTime: CACHE_TIMES.DYNAMIC_DATA.staleTime,
    gcTime: CACHE_TIMES.DYNAMIC_DATA.gcTime,
  })

  return {
    reportedNormalIds: data ? new Set(data.normalIds) : EMPTY_SET,
    reportedAudioIds: data ? new Set(data.audioIds) : EMPTY_SET,
  }
}

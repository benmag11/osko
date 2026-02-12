'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queries/query-keys'
import { CACHE_TIMES } from '@/lib/config/cache'
import { fetchCompletionStats } from '@/lib/supabase/stats-queries'
import { TIME_PERIOD_OPTIONS } from '@/lib/types/stats'
import type { TimePeriod, CompletionStats } from '@/lib/types/stats'

export function useCompletionStats(userId: string, timePeriod: TimePeriod) {
  const daysAgo = TIME_PERIOD_OPTIONS.find(o => o.value === timePeriod)?.daysAgo ?? null

  return useQuery<CompletionStats>({
    queryKey: [...queryKeys.user.progress(userId), timePeriod],
    queryFn: () => fetchCompletionStats(userId, daysAgo),
    ...CACHE_TIMES.DYNAMIC_DATA,
    enabled: !!userId,
    placeholderData: (prev) => prev,
  })
}

'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queries/query-keys'
import { CACHE_TIMES } from '@/lib/config/cache'
import { fetchTopicFrequencyAnalysis } from '@/lib/supabase/analysis-queries'
import type { TopicFrequencyAnalysis } from '@/lib/types/database'

export function useTopicAnalysis(subjectId: string) {
  return useQuery<TopicFrequencyAnalysis>({
    queryKey: queryKeys.topicAnalysis(subjectId),
    queryFn: () => fetchTopicFrequencyAnalysis(subjectId),
    ...CACHE_TIMES.STATIC_DATA,
    enabled: !!subjectId,
    placeholderData: (prev) => prev,
  })
}

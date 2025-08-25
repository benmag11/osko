'use client'

import { useQuery } from '@tanstack/react-query'
import { getTopics } from '@/lib/supabase/queries'
import { CACHE_TIMES } from '@/lib/config/cache'

export function useTopics(subjectId: string) {
  const { data: topics, isLoading, error } = useQuery({
    queryKey: ['topics', subjectId],
    queryFn: () => getTopics(subjectId),
    ...CACHE_TIMES.TOPICS,
    enabled: !!subjectId
  })
  
  return { topics: topics || [], isLoading, error }
}
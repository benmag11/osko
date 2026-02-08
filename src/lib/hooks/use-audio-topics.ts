'use client'

import { useQuery } from '@tanstack/react-query'
import { getAudioTopics } from '@/lib/supabase/audio-queries'
import { CACHE_TIMES } from '@/lib/config/cache'

export function useAudioTopics(subjectId: string) {
  const { data: topics, isLoading, error } = useQuery({
    queryKey: ['audio-topics', subjectId],
    queryFn: () => getAudioTopics(subjectId),
    ...CACHE_TIMES.TOPICS,
    enabled: !!subjectId
  })

  return { topics: topics || [], isLoading, error }
}

'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { AudioTopic, GroupedTopics } from '@/lib/types/database'

/**
 * Fetches audio topics for a subject
 * Audio topics don't have groups (simpler structure than normal topics)
 */
async function fetchAudioTopics(subjectId: string): Promise<AudioTopic[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('audio_topics')
    .select('*')
    .eq('subject_id', subjectId)
    .order('name')

  if (error) {
    console.error('Error fetching audio topics:', error)
    return []
  }

  return data as AudioTopic[]
}

/**
 * Hook to fetch and format audio topics for the sidebar
 * Returns in the same GroupedTopics format as normal topics for compatibility
 */
export function useGroupedAudioTopics(subjectId: string) {
  const { data: topics = [], isLoading, error } = useQuery({
    queryKey: ['audio-topics', subjectId],
    queryFn: () => fetchAudioTopics(subjectId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Format as GroupedTopics (all ungrouped since audio topics don't have groups)
  const groupedTopics = useMemo<GroupedTopics>(() => {
    // Convert AudioTopic to Topic-like structure for compatibility
    const topicsAsTopics = topics.map(t => ({
      id: t.id,
      name: t.name,
      subject_id: t.subject_id,
      group_id: null,
      created_at: t.created_at,
    }))

    return {
      ungrouped: topicsAsTopics,
      groups: [],
    }
  }, [topics])

  return {
    groupedTopics,
    topics,
    isLoading,
    error,
  }
}

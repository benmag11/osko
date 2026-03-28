'use client'

import { createClient } from './client'
import { QueryError } from '@/lib/errors'
import type { TopicFrequencyAnalysis } from '@/lib/types/database'

export async function fetchTopicFrequencyAnalysis(
  subjectId: string
): Promise<TopicFrequencyAnalysis> {
  const supabase = createClient()

  const { data, error } = await supabase
    .rpc('get_topic_frequency_analysis', {
      p_subject_id: subjectId,
    })

  if (error) {
    console.error('Error fetching topic frequency analysis:', error)
    throw new QueryError(
      'Failed to fetch topic frequency analysis',
      'TOPIC_ANALYSIS_FETCH_ERROR',
      error
    )
  }

  return data as TopicFrequencyAnalysis
}

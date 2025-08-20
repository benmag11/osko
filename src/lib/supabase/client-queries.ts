'use client'

import { createClient } from './client'
import type { Filters, PaginatedResponse } from '@/lib/types/database'

/**
 * Client-side version of searchQuestions for use with React Query
 * Uses the browser Supabase client instead of server client
 */
export async function searchQuestionsClient(
  filters: Filters,
  cursor?: { year: number; question_number: number } | null,
  signal?: AbortSignal
): Promise<PaginatedResponse> {
  // Check if the signal is already aborted
  if (signal?.aborted) {
    throw new Error('Request was cancelled')
  }
  
  const supabase = createClient()
  
  // Create a promise that will race with the abort signal
  const abortPromise = new Promise<never>((_, reject) => {
    if (signal) {
      signal.addEventListener('abort', () => {
        reject(new Error('Request was cancelled'))
      })
    }
  })
  
  // Race between the RPC call and the abort signal
  const { data, error } = await Promise.race([
    supabase.rpc('search_questions_paginated', {
      p_subject_id: filters.subjectId,
      p_search_terms: filters.searchTerms || null,
      p_years: filters.years || null,
      p_topic_ids: filters.topicIds || null,
      p_exam_types: filters.examTypes || null,
      p_cursor: cursor || null,
      p_limit: 20
    }),
    abortPromise.then(() => ({ data: null, error: new Error('Request was cancelled') }))
  ])
  
  if (error) {
    console.error('Error searching questions:', error)
    throw error
  }
  
  if (!data) {
    throw new Error('No data returned from search')
  }
  
  return data as PaginatedResponse
}
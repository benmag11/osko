'use server'

import { createServerSupabaseClient } from './server'
import { QueryError } from '@/lib/errors'
import { buildAudioSearchQueryParams } from './audio-query-builders'
import type {
  Subject,
  AudioFilters,
  AudioPaginatedResponse,
  QuestionCursor,
  AudioTopic,
} from '@/lib/types/database'

// Error handling wrapper with retry logic
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delay = 1000
): Promise<T> {
  let lastError: Error = new Error('Unknown error occurred')

  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Don't retry on client errors (4xx)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status
        if (status >= 400 && status < 500) {
          throw error
        }
      }

      // Wait before retrying (except on last attempt)
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }

  throw lastError
}

/**
 * Get all subjects that have audio questions
 * Used for the Listening dashboard page
 */
export async function getSubjectsWithAudioQuestions(): Promise<Subject[]> {
  return withRetry(async () => {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .rpc('get_subjects_with_audio_questions')

    if (error) {
      console.error('Error fetching subjects with audio questions:', error)
      throw new QueryError(
        'Failed to fetch subjects with audio questions',
        'AUDIO_SUBJECTS_FETCH_ERROR',
        error
      )
    }

    return (data || []) as Subject[]
  }).catch(error => {
    console.error('Failed to fetch audio subjects after retries:', error)
    return []
  })
}

/**
 * Get available years for audio questions in a subject
 */
export async function getAudioAvailableYears(subjectId: string): Promise<number[]> {
  return withRetry(async () => {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .rpc('audio_get_available_years', {
        p_subject_id: subjectId
      })

    if (error) {
      console.error('Error fetching audio years:', error)
      throw new QueryError(
        'Failed to fetch available audio years',
        'AUDIO_YEARS_FETCH_ERROR',
        error
      )
    }

    return (data || []) as number[]
  }).catch(error => {
    console.error('Failed to fetch audio years after retries:', error)
    return []
  })
}

/**
 * Get audio topics for a subject
 */
export async function getAudioTopics(subjectId: string): Promise<AudioTopic[]> {
  return withRetry(async () => {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('audio_topics')
      .select('*')
      .eq('subject_id', subjectId)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching audio topics:', error)
      throw new QueryError(
        'Failed to fetch audio topics',
        'AUDIO_TOPICS_FETCH_ERROR',
        error
      )
    }

    return (data || []) as AudioTopic[]
  }).catch(error => {
    console.error('Failed to fetch audio topics after retries:', error)
    return []
  })
}

/**
 * Search audio questions with pagination
 * Server-side version for SSR/initial load
 */
export async function searchAudioQuestions(
  filters: AudioFilters,
  cursor?: QuestionCursor | null,
  signal?: AbortSignal
): Promise<AudioPaginatedResponse> {
  if (signal?.aborted) {
    throw new Error('Request was cancelled')
  }

  return withRetry(async () => {
    const supabase = await createServerSupabaseClient()

    if (signal?.aborted) {
      throw new Error('Request was cancelled')
    }

    const abortPromise = new Promise<never>((_, reject) => {
      if (signal) {
        signal.addEventListener('abort', () => {
          reject(new Error('Request was cancelled'))
        })
      }
    })

    const queryParams = buildAudioSearchQueryParams(filters, cursor, 20)

    const data = await Promise.race([
      supabase.rpc('audio_search_questions_paginated', queryParams),
      abortPromise
    ])

    if (data.error) {
      console.error('Error searching audio questions:', data.error)
      throw new QueryError(
        'Failed to search audio questions',
        'AUDIO_QUESTIONS_SEARCH_ERROR',
        data.error
      )
    }

    return data.data as AudioPaginatedResponse
  })
}

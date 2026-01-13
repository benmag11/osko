'use client'

import { createClient } from './client'
import { buildAudioSearchQueryParams, buildAudioNavigationQueryParams } from './audio-query-builders'
import { QueryError } from '@/lib/errors'
import type {
  AudioFilters,
  AudioPaginatedResponse,
  QuestionCursor,
  AudioNavigationListResponse,
  Subject,
  TranscriptItem,
} from '@/lib/types/database'

export interface AudioSearchClientOptions {
  cursor?: QuestionCursor | null
  signal?: AbortSignal
  limit?: number
}

// ============================================================================
// Shared Utilities
// ============================================================================

/**
 * Error handling wrapper with retry logic for client-side queries
 */
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

// ============================================================================
// Audio Question Search & Navigation Queries
// ============================================================================

/**
 * Client-side audio question search with pagination
 * Used by React Query for infinite scrolling
 */
export async function searchAudioQuestionsClient(
  filters: AudioFilters,
  { cursor = null, signal, limit }: AudioSearchClientOptions = {}
): Promise<AudioPaginatedResponse> {
  if (signal?.aborted) {
    throw new Error('Request was cancelled')
  }

  return withRetry(async () => {
    const supabase = createClient()

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

    const queryParams = buildAudioSearchQueryParams(filters, cursor, limit ?? 20)

    const { data, error } = await Promise.race([
      supabase.rpc('audio_search_questions_paginated', queryParams),
      abortPromise
    ])

    if (error) {
      console.error('Error searching audio questions:', error)
      throw new QueryError(
        'Failed to search audio questions',
        'AUDIO_QUESTIONS_SEARCH_ERROR',
        error
      )
    }

    if (!data) {
      throw new QueryError(
        'No data returned from audio search',
        'NO_DATA_ERROR',
        null
      )
    }

    return data as AudioPaginatedResponse
  })
}

/**
 * Optimized audio navigation list fetcher
 * Returns minimal fields required for navigation titles
 */
export async function getAudioNavigationListClient(
  filters: AudioFilters,
  { signal }: { signal?: AbortSignal } = {}
): Promise<AudioNavigationListResponse> {
  if (signal?.aborted) {
    throw new Error('Request was cancelled')
  }

  return withRetry(async () => {
    const supabase = createClient()

    if (signal?.aborted) {
      throw new Error('Request was cancelled')
    }

    const abortPromise = new Promise<never>((_, reject) => {
      if (signal) {
        const handler = () => reject(new Error('Request was cancelled'))
        signal.addEventListener('abort', handler, { once: true })
      }
    })

    const queryParams = buildAudioNavigationQueryParams(filters)

    const { data, error } = await Promise.race([
      supabase.rpc('audio_get_question_navigation_list', queryParams),
      abortPromise,
    ])

    if (error) {
      console.error('Error fetching audio navigation list:', error)
      throw new QueryError(
        'Failed to fetch audio navigation list',
        'AUDIO_NAVIGATION_LIST_ERROR',
        error,
      )
    }

    if (!data) {
      throw new QueryError(
        'No data returned from audio navigation list',
        'NO_DATA_ERROR',
        null,
      )
    }

    return data as AudioNavigationListResponse
  })
}

// ============================================================================
// Audio Subject Queries
// ============================================================================

/**
 * Fetch subjects that have audio questions (client-side)
 */
export async function getSubjectsWithAudioQuestionsClient(): Promise<Subject[]> {
  return withRetry(async () => {
    const supabase = createClient()

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

// ============================================================================
// Transcript Queries
// ============================================================================

/**
 * Fetch and parse transcript JSON from storage URL
 * Cached via React Query for performance
 */
export async function fetchTranscript(mapJsonUrl: string): Promise<TranscriptItem[]> {
  if (!mapJsonUrl) {
    return []
  }

  return withRetry(async () => {
    const response = await fetch(mapJsonUrl)

    if (!response.ok) {
      throw new QueryError(
        'Failed to fetch transcript',
        'TRANSCRIPT_FETCH_ERROR',
        new Error(`HTTP ${response.status}`)
      )
    }

    const data = await response.json()
    return data as TranscriptItem[]
  }).catch(error => {
    console.error('Failed to fetch transcript after retries:', error)
    return []
  })
}

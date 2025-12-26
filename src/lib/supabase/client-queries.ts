'use client'

import { createClient } from './client'
import { buildSearchQueryParams, buildNavigationQueryParams } from './query-builders'
import { QueryError } from '@/lib/errors'
import type {
  Filters,
  PaginatedResponse,
  QuestionCursor,
  NavigationListResponse,
  UserSubjectWithSubject,
  Subject,
} from '@/lib/types/database'

export interface SearchQuestionsClientOptions {
  cursor?: QuestionCursor | null
  signal?: AbortSignal
  limit?: number
}

// ============================================================================
// Shared Utilities
// ============================================================================

/**
 * Error handling wrapper with retry logic for client-side queries
 * Retries failed requests with exponential backoff, but skips retry for 4xx client errors
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
// Question Search & Navigation Queries
// ============================================================================

/**
 * Client-side version of searchQuestions for use with React Query
 * Uses the browser Supabase client instead of server client
 * Supports abort signals for request cancellation
 */
export async function searchQuestionsClient(
  filters: Filters,
  { cursor = null, signal, limit }: SearchQuestionsClientOptions = {}
): Promise<PaginatedResponse> {
  // Check if the signal is already aborted
  if (signal?.aborted) {
    throw new Error('Request was cancelled')
  }
  
  return withRetry(async () => {
    const supabase = createClient()
    
    // Check abort signal before making request
    if (signal?.aborted) {
      throw new Error('Request was cancelled')
    }
    
    // Create a promise that will race with the abort signal
    const abortPromise = new Promise<never>((_, reject) => {
      if (signal) {
        signal.addEventListener('abort', () => {
          reject(new Error('Request was cancelled'))
        })
      }
    })
    
    // Build query parameters using shared builder
    const queryParams = buildSearchQueryParams(filters, cursor, limit ?? 20)
    
    // Race between the RPC call and the abort signal
    const { data, error } = await Promise.race([
      supabase.rpc('search_questions_paginated', queryParams),
      abortPromise
    ])
    
    if (error) {
      console.error('Error searching questions:', error)
      throw new QueryError(
        'Failed to search questions',
        'QUESTIONS_SEARCH_ERROR',
        error
      )
    }
    
    if (!data) {
      throw new QueryError(
        'No data returned from search',
        'NO_DATA_ERROR',
        null
      )
    }
    
    return data as PaginatedResponse
  })
}

/**
 * Optimized navigation list fetcher using get_question_navigation_list RPC
 * Returns minimal fields required for navigation titles in a single request
 */
export async function getNavigationListClient(
  filters: Filters,
  { signal }: { signal?: AbortSignal } = {}
): Promise<NavigationListResponse> {
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

    const queryParams = buildNavigationQueryParams(filters)

    const { data, error } = await Promise.race([
      supabase.rpc('get_question_navigation_list', queryParams),
      abortPromise,
    ])

    if (error) {
      console.error('Error fetching question navigation list:', error)
      throw new QueryError(
        'Failed to fetch question navigation list',
        'QUESTION_NAVIGATION_LIST_ERROR',
        error,
      )
    }

    if (!data) {
      throw new QueryError(
        'No data returned from question navigation list',
        'NO_DATA_ERROR',
        null,
      )
    }

    return data as NavigationListResponse
  })
}

// ============================================================================
// User & Subject Queries
// ============================================================================

/**
 * Fetch all subjects available in the system
 * Returns subjects filtered to Higher and Ordinary levels, sorted by name and level
 */
export async function getAllSubjectsClient(): Promise<Subject[]> {
  return withRetry(async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .in('level', ['Higher', 'Ordinary'])
      .order('name')
      .order('level')

    if (error) {
      console.error('Error fetching all subjects:', error)
      throw new QueryError(
        'Failed to fetch subjects',
        'SUBJECTS_FETCH_ERROR',
        error
      )
    }

    return (data || []) as Subject[]
  }).catch(error => {
    console.error('Failed to fetch subjects after retries:', error)
    return []
  })
}

/**
 * Fetch all subjects selected by a specific user
 * Returns user subjects with full subject details, sorted by subject name and level
 * @param userId - The UUID of the user
 */
export async function getUserSubjectsClient(userId: string): Promise<UserSubjectWithSubject[]> {
  // Validate user ID format (UUID)
  if (!userId || !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    console.error('Invalid user ID provided:', userId)
    return []
  }

  return withRetry(async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .rpc('get_user_subjects_sorted', { p_user_id: userId })

    if (error) {
      console.error('Error fetching user subjects:', error)
      throw new QueryError(
        'Failed to fetch user subjects',
        'USER_SUBJECTS_FETCH_ERROR',
        error
      )
    }

    // Transform the RPC response to match UserSubjectWithSubject interface with type safety
    type RPCResponse = {
      id: string
      user_id: string
      subject_id: string
      created_at: string | null
      subject: Subject
    }
    return (data || []).map((item: RPCResponse) => ({
      id: item.id,
      user_id: item.user_id,
      subject_id: item.subject_id,
      created_at: item.created_at,
      subject: item.subject
    }))
  }).catch(error => {
    console.error('Failed to fetch user subjects after retries:', error)
    return []
  })
}

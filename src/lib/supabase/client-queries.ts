'use client'

import { createClient } from './client'
import { buildSearchQueryParams } from './query-builders'
import { QueryError } from '@/lib/errors'
import type { Filters, PaginatedResponse, QuestionCursor } from '@/lib/types/database'

// Error handling wrapper with retry logic (same as server queries)
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
 * Client-side version of searchQuestions for use with React Query
 * Uses the browser Supabase client instead of server client
 */
export async function searchQuestionsClient(
  filters: Filters,
  cursor?: QuestionCursor | null,
  signal?: AbortSignal
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
    const queryParams = buildSearchQueryParams(filters, cursor, 20)
    
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
'use server'

import { createServerSupabaseClient } from './server'
import { QueryError } from '@/lib/errors'
import type { 
  Subject, 
  Topic, 
  Filters, 
  PaginatedResponse 
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

export async function getSubjects(): Promise<Subject[]> {
  return withRetry(async () => {
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name', { ascending: true })
      .order('level', { ascending: true })
      
    if (error) {
      console.error('Error fetching subjects:', error)
      throw new QueryError(
        'Failed to fetch subjects',
        'SUBJECTS_FETCH_ERROR',
        error
      )
    }
    
    return data as Subject[]
  }).catch(error => {
    // Return empty array as fallback for non-critical errors
    console.error('Failed to fetch subjects after retries:', error)
    return []
  })
}


export async function getSubjectBySlug(slug: string): Promise<Subject | null> {
  return withRetry(async () => {
    const supabase = await createServerSupabaseClient()
    
    const parts = slug.split('-')
    const level = parts[parts.length - 1]
    const name = parts.slice(0, -1).join(' ')
    
    const levelMap: Record<string, string> = {
      'higher': 'Higher',
      'ordinary': 'Ordinary',
      'foundation': 'Foundation'
    }
    
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .ilike('name', name)
      .eq('level', levelMap[level] || level)
      .single()
      
    if (error) {
      // Return null for not found errors
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error fetching subject:', error)
      throw new QueryError(
        'Failed to fetch subject',
        'SUBJECT_FETCH_ERROR',
        error
      )
    }
    
    return data as Subject
  }).catch(error => {
    console.error('Failed to fetch subject after retries:', error)
    return null
  })
}

export async function getTopics(subjectId: string): Promise<Topic[]> {
  return withRetry(async () => {
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('subject_id', subjectId)
      .order('name', { ascending: true })
      
    if (error) {
      console.error('Error fetching topics:', error)
      throw new QueryError(
        'Failed to fetch topics',
        'TOPICS_FETCH_ERROR',
        error
      )
    }
    
    return data as Topic[]
  }).catch(error => {
    // Return empty array as fallback
    console.error('Failed to fetch topics after retries:', error)
    return []
  })
}

// Cache for available years to reduce database calls
const yearsCache = new Map<string, { data: number[]; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Lock to prevent concurrent cache updates
const cacheLocks = new Map<string, Promise<number[]>>()

export async function getAvailableYears(subjectId: string): Promise<number[]> {
  // Check if there's already a fetch in progress for this subject
  const existingFetch = cacheLocks.get(subjectId)
  if (existingFetch) {
    return existingFetch
  }
  
  // Check cache first
  const cached = yearsCache.get(subjectId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  
  // Create new fetch promise and store it to prevent concurrent fetches
  const fetchPromise = withRetry(async () => {
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .rpc('get_available_years', {
        p_subject_id: subjectId
      })
      
    if (error) {
      console.error('Error fetching years:', error)
      throw new QueryError(
        'Failed to fetch available years',
        'YEARS_FETCH_ERROR',
        error
      )
    }
    
    const years = data as number[]
    
    // Update cache
    yearsCache.set(subjectId, {
      data: years,
      timestamp: Date.now()
    })
    
    return years
  }).catch(error => {
    // Try to return cached data even if expired
    const cached = yearsCache.get(subjectId)
    if (cached) {
      console.warn('Using stale cached years due to error:', error)
      return cached.data
    }
    
    console.error('Failed to fetch years after retries:', error)
    return []
  }).finally(() => {
    // Clean up the lock after fetch completes
    cacheLocks.delete(subjectId)
  })
  
  // Store the fetch promise to prevent concurrent fetches
  cacheLocks.set(subjectId, fetchPromise)
  
  return fetchPromise
}


export async function searchQuestions(
  filters: Filters,
  cursor?: { year: number; question_number: number } | null,
  signal?: AbortSignal
): Promise<PaginatedResponse> {
  // For React Query, we don't need request deduplication as it handles that
  // Check if the signal is already aborted
  if (signal?.aborted) {
    throw new Error('Request was cancelled')
  }
  
  return withRetry(async () => {
    const supabase = await createServerSupabaseClient()
    
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
    
    // Race between the RPC call and the abort signal
    const data = await Promise.race([
      supabase.rpc('search_questions_paginated', {
        p_subject_id: filters.subjectId,
        p_search_terms: filters.searchTerms || null,
        p_years: filters.years || null,
        p_topic_ids: filters.topicIds || null,
        p_exam_types: filters.examTypes || null,
        p_cursor: cursor || null,
        p_limit: 20
      }),
      abortPromise
    ])
    
    if (data.error) {
      console.error('Error searching questions:', data.error)
      throw new QueryError(
        'Failed to search questions',
        'QUESTIONS_SEARCH_ERROR',
        data.error
      )
    }
    
    return data.data as PaginatedResponse
  })
}
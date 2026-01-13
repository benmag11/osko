'use server'

import { createServerSupabaseClient } from './server'
import { QueryError } from '@/lib/errors'
import { buildSearchQueryParams } from './query-builders'
import type {
  Subject,
  Topic,
  TopicGroup,
  Filters,
  PaginatedResponse,
  UserSubjectWithSubject,
  QuestionCursor
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
      .from('normal_topics')
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

export async function getTopicGroups(subjectId: string): Promise<TopicGroup[]> {
  return withRetry(async () => {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('normal_topic_groups')
      .select('*')
      .eq('subject_id', subjectId)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching topic groups:', error)
      throw new QueryError(
        'Failed to fetch topic groups',
        'TOPIC_GROUPS_FETCH_ERROR',
        error
      )
    }

    return data as TopicGroup[]
  }).catch(error => {
    // Return empty array as fallback
    console.error('Failed to fetch topic groups after retries:', error)
    return []
  })
}

export async function getAvailableYears(subjectId: string): Promise<number[]> {
  return withRetry(async () => {
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .rpc('normal_get_available_years', {
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
    
    return data as number[]
  }).catch(error => {
    console.error('Failed to fetch years after retries:', error)
    return []
  })
}

export async function getAvailableQuestionNumbers(subjectId: string): Promise<number[]> {
  return withRetry(async () => {
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .rpc('normal_get_available_question_numbers', {
        p_subject_id: subjectId
      })
      
    if (error) {
      console.error('Error fetching question numbers:', error)
      throw new QueryError(
        'Failed to fetch available question numbers',
        'QUESTION_NUMBERS_FETCH_ERROR',
        error
      )
    }
    
    return data as number[]
  }).catch(error => {
    console.error('Failed to fetch question numbers after retries:', error)
    return []
  })
}


export async function searchQuestions(
  filters: Filters,
  cursor?: QuestionCursor | null,
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
    
    // Build query parameters using shared builder
    const queryParams = buildSearchQueryParams(filters, cursor, 20)
    
    // Race between the RPC call and the abort signal
    const data = await Promise.race([
      supabase.rpc('normal_search_questions_paginated', queryParams),
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

// Subject-related queries with proper error handling and retry logic

export async function getAllSubjects(): Promise<Subject[]> {
  return withRetry(async () => {
    const supabase = await createServerSupabaseClient()
    
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
    
    return data as Subject[]
  }).catch(error => {
    // Return empty array as fallback for non-critical errors
    console.error('Failed to fetch subjects after retries:', error)
    return []
  })
}

export async function getUserSubjects(userId: string): Promise<UserSubjectWithSubject[]> {
  // Validate user ID format (UUID)
  if (!userId || !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    console.error('Invalid user ID provided:', userId)
    return []
  }
  
  return withRetry(async () => {
    const supabase = await createServerSupabaseClient()
    
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

export async function saveUserSubjects(
  userId: string, 
  subjectIds: string[]
): Promise<{ success: boolean; error?: string }> {
  // Input validation
  if (!userId || !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return { success: false, error: 'Invalid user ID' }
  }
  
  return withRetry(async () => {
    const supabase = await createServerSupabaseClient()
    
    // Use atomic RPC function for transactional update
    const { data, error } = await supabase
      .rpc('update_user_subjects', {
        p_user_id: userId,
        p_subject_ids: subjectIds
      })
    
    if (error) {
      console.error('Error updating user subjects:', error)
      throw new QueryError(
        'Failed to update subjects',
        'SUBJECTS_UPDATE_ERROR',
        error
      )
    }
    
    // Verify the response matches expected format
    if (!data || typeof data.success !== 'boolean') {
      throw new QueryError(
        'Invalid response from update_user_subjects',
        'SUBJECTS_UPDATE_INVALID_RESPONSE',
        new Error('Unexpected response format')
      )
    }
    
    return { success: data.success }
  }, 1).catch(error => {
    // For save operations, only retry once
    console.error('Failed to save user subjects after retry:', error)
    return { 
      success: false, 
      error: error.message || 'Failed to save subjects. Please try again.' 
    }
  })
}
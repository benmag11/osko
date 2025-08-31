'use client'

import { createClient } from './client'
import { QueryError } from '@/lib/errors'
import type { UserSubjectWithSubject, Subject } from '@/lib/types/database'

// Client-side error handling wrapper with retry logic
async function withRetryClient<T>(
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

// Client-side version of getUserSubjects for use in hooks
export async function getUserSubjectsClient(userId: string): Promise<UserSubjectWithSubject[]> {
  // Validate user ID format (UUID)
  if (!userId || !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    console.error('Invalid user ID provided:', userId)
    return []
  }
  
  return withRetryClient(async () => {
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
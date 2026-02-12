'use client'

import { createClient } from './client'
import { QueryError } from '@/lib/errors'
import type { CompletionStats } from '@/lib/types/stats'

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

      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status
        if (status >= 400 && status < 500) {
          throw error
        }
      }

      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }

  throw lastError
}

export async function fetchCompletionStats(
  userId: string,
  daysAgo: number | null = null
): Promise<CompletionStats> {
  return withRetry(async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .rpc('get_user_completion_stats', {
        p_user_id: userId,
        p_days_ago: daysAgo,
      })

    if (error) {
      console.error('Error fetching completion stats:', error)
      throw new QueryError(
        'Failed to fetch completion stats',
        'COMPLETION_STATS_FETCH_ERROR',
        error
      )
    }

    return data as CompletionStats
  })
}

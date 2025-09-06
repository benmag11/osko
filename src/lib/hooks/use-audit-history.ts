'use client'

import { useQuery } from '@tanstack/react-query'
import { getQuestionAuditHistory } from '@/lib/supabase/admin-actions'
import { CACHE_TIMES } from '@/lib/config/cache'
import type { QuestionAuditLog } from '@/lib/types/database'

interface UseAuditHistoryReturn {
  history: QuestionAuditLog[]
  isLoading: boolean
  error: Error | null
}

/**
 * Custom hook to fetch and cache question audit history
 * Uses React Query for automatic caching and invalidation
 */
export function useAuditHistory(questionId: string): UseAuditHistoryReturn {
  const { data: history, isLoading, error } = useQuery({
    queryKey: ['audit-history', questionId],
    queryFn: () => getQuestionAuditHistory(questionId),
    ...CACHE_TIMES.DYNAMIC_DATA, // Audit logs change frequently
    enabled: !!questionId,
    staleTime: 30 * 1000, // Consider stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  })
  
  return { 
    history: history || [],
    isLoading,
    error: error as Error | null
  }
}
'use client'

import { useQuery } from '@tanstack/react-query'
import { getQuestionAuditHistory, getAudioQuestionAuditHistory } from '@/lib/supabase/admin-actions'
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
export function useAuditHistory(
  questionId: string,
  questionType: 'normal' | 'audio' = 'normal'
): UseAuditHistoryReturn {
  const { data: history, isLoading, error } = useQuery<QuestionAuditLog[]>({
    queryKey: ['audit-history', questionType, questionId],
    queryFn: async () => {
      if (questionType === 'audio') {
        // AudioQuestionAuditLog is structurally compatible for display purposes
        return getAudioQuestionAuditHistory(questionId) as Promise<QuestionAuditLog[]>
      }
      return getQuestionAuditHistory(questionId)
    },
    ...CACHE_TIMES.DYNAMIC_DATA,
    enabled: !!questionId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  return {
    history: history || [],
    isLoading,
    error: error as Error | null
  }
}
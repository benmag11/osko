'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queries/query-keys'
import { CACHE_TIMES } from '@/lib/config/cache'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'

type QuestionType = 'normal' | 'audio'
type CompletionCounts = Map<string, number>

interface UseQuestionCompletionsReturn {
  completionCounts: CompletionCounts
  addCompletion: (questionId: string, questionType?: QuestionType) => void
  undoCompletion: (questionId: string, questionType?: QuestionType) => void
  isLoading: boolean
}

/**
 * Fetches all completion counts for the current user (both normal and audio)
 * and provides optimistic add/undo mutations. One query for all questions
 * avoids N+1 problems on infinite scroll pages.
 *
 * UUID uniqueness across normal_questions and audio_questions means a single
 * Map can hold both without collision.
 */
export function useQuestionCompletions(): UseQuestionCompletionsReturn {
  const { user } = useAuth()
  const userId = user?.id
  const queryClient = useQueryClient()
  const queryKey = userId ? queryKeys.user.completions(userId) : ['completions-anonymous']

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<CompletionCounts> => {
      if (!userId) return new Map()

      const supabase = createClient()
      const [normalResult, audioResult] = await Promise.all([
        supabase
          .from('user_question_completions')
          .select('question_id')
          .eq('user_id', userId),
        supabase
          .from('user_audio_question_completions')
          .select('audio_question_id')
          .eq('user_id', userId),
      ])

      if (normalResult.error) throw normalResult.error
      if (audioResult.error) throw audioResult.error

      const counts = new Map<string, number>()
      for (const row of normalResult.data) {
        counts.set(row.question_id, (counts.get(row.question_id) ?? 0) + 1)
      }
      for (const row of audioResult.data) {
        counts.set(row.audio_question_id, (counts.get(row.audio_question_id) ?? 0) + 1)
      }
      return counts
    },
    enabled: !!userId,
    ...CACHE_TIMES.USER_DATA,
  })

  const addMutation = useMutation({
    mutationFn: async ({ questionId, questionType }: { questionId: string; questionType: QuestionType }) => {
      if (!userId) throw new Error('Not authenticated')
      const supabase = createClient()
      if (questionType === 'audio') {
        const { error } = await supabase.rpc('insert_audio_question_completion', {
          p_user_id: userId,
          p_audio_question_id: questionId,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.rpc('insert_question_completion', {
          p_user_id: userId,
          p_question_id: questionId,
        })
        if (error) throw error
      }
    },
    onMutate: async ({ questionId }: { questionId: string }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<CompletionCounts>(queryKey)
      queryClient.setQueryData<CompletionCounts>(queryKey, (old) => {
        const next = new Map(old ?? [])
        next.set(questionId, (next.get(questionId) ?? 0) + 1)
        return next
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const undoMutation = useMutation({
    mutationFn: async ({ questionId, questionType }: { questionId: string; questionType: QuestionType }) => {
      const supabase = createClient()
      if (questionType === 'audio') {
        const { error } = await supabase.rpc('delete_latest_audio_question_completion', {
          p_audio_question_id: questionId,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.rpc('delete_latest_question_completion', {
          p_question_id: questionId,
        })
        if (error) throw error
      }
    },
    onMutate: async ({ questionId }: { questionId: string }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<CompletionCounts>(queryKey)
      queryClient.setQueryData<CompletionCounts>(queryKey, (old) => {
        const next = new Map(old ?? [])
        const current = next.get(questionId) ?? 0
        if (current <= 1) {
          next.delete(questionId)
        } else {
          next.set(questionId, current - 1)
        }
        return next
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return {
    completionCounts: data ?? new Map(),
    addCompletion: (questionId: string, questionType: QuestionType = 'normal') =>
      addMutation.mutate({ questionId, questionType }),
    undoCompletion: (questionId: string, questionType: QuestionType = 'normal') =>
      undoMutation.mutate({ questionId, questionType }),
    isLoading,
  }
}

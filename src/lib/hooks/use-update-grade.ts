'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/queries/query-keys'
import type { Subject, UserSubjectWithSubject, Grade } from '@/lib/types/database'
import { generateSlug } from '@/lib/utils/slug'

interface UpdateGradeParams {
  userId: string
  subjectId: string
  grade: Grade
}

interface UpdateGradeResult {
  success: boolean
  error?: string
}

/**
 * Hook for updating a user's subject grade with optimistic updates
 * Provides instant UI feedback while persisting to the database
 */
export function useUpdateGrade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, subjectId, grade }: UpdateGradeParams): Promise<UpdateGradeResult> => {
      const supabase = createClient()

      const { data, error } = await supabase
        .rpc('update_user_subject_grade', {
          p_user_id: userId,
          p_subject_id: subjectId,
          p_grade: grade,
        })

      if (error) {
        console.error('Error updating grade:', error)
        return { success: false, error: error.message }
      }

      // The RPC returns a JSONB object with success and optional error
      const result = data as { success: boolean; error?: string }
      return result
    },

    onMutate: async ({ userId, subjectId, grade }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.user.subjects(userId) })

      // Snapshot the previous value
      const previousSubjects = queryClient.getQueryData<(Subject & { slug: string })[]>(
        queryKeys.user.subjects(userId)
      )

      // Also snapshot the raw user subjects data (UserSubjectWithSubject[])
      // This is used by the points calculator page
      const previousUserSubjectsRaw = queryClient.getQueryData<UserSubjectWithSubject[]>(
        [...queryKeys.user.subjects(userId), 'raw']
      )

      // Optimistically update the subjects query
      // Note: The useUserSubjects hook transforms data to Subject with slug
      // We need to find and update the grade on the underlying data
      if (previousSubjects) {
        queryClient.setQueryData(
          queryKeys.user.subjects(userId),
          previousSubjects
        )
      }

      // Optimistically update the raw data used by points calculator
      if (previousUserSubjectsRaw) {
        queryClient.setQueryData<UserSubjectWithSubject[]>(
          [...queryKeys.user.subjects(userId), 'raw'],
          previousUserSubjectsRaw.map(us =>
            us.subject_id === subjectId
              ? { ...us, grade }
              : us
          )
        )
      }

      // Return context with the previous value
      return { previousSubjects, previousUserSubjectsRaw }
    },

    onError: (error, { userId }, context) => {
      // Rollback on error
      if (context?.previousSubjects) {
        queryClient.setQueryData(
          queryKeys.user.subjects(userId),
          context.previousSubjects
        )
      }
      if (context?.previousUserSubjectsRaw) {
        queryClient.setQueryData(
          [...queryKeys.user.subjects(userId), 'raw'],
          context.previousUserSubjectsRaw
        )
      }
      console.error('Failed to update grade:', error)
    },

    onSettled: (data, error, { userId }) => {
      // Always refetch after error or success
      if (error || (data && !data.success)) {
        queryClient.invalidateQueries({ queryKey: queryKeys.user.subjects(userId) })
      }
    },
  })
}

/**
 * Hook specifically for the points calculator that returns raw UserSubjectWithSubject data
 * This allows us to track grades alongside subjects
 */
export function useUserSubjectsWithGrades(
  userId: string | undefined,
  initialData?: UserSubjectWithSubject[]
) {
  const queryClient = useQueryClient()

  // If we have initial data from server, set it in the cache
  if (userId && initialData) {
    const existingData = queryClient.getQueryData<UserSubjectWithSubject[]>(
      [...queryKeys.user.subjects(userId), 'raw']
    )
    if (!existingData) {
      queryClient.setQueryData(
        [...queryKeys.user.subjects(userId), 'raw'],
        initialData
      )
    }
  }

  return queryClient.getQueryData<UserSubjectWithSubject[]>(
    userId ? [...queryKeys.user.subjects(userId), 'raw'] : ['empty']
  ) || initialData || []
}

'use client'

import { useQuery } from '@tanstack/react-query'
import { getUserSubjectsClient } from '@/lib/supabase/queries-client'
import { generateSlug } from '@/lib/utils/slug'
import type { Subject } from '@/lib/types/database'
import { CACHE_TIMES } from '@/lib/config/cache'
import { queryKeys } from '@/lib/queries/query-keys'

interface SubjectWithSlug extends Subject {
  slug: string
}

interface UseUserSubjectsReturn {
  subjects: SubjectWithSlug[]
  isLoading: boolean
  error: Error | null
}

/**
 * Custom hook to fetch and cache user's enrolled subjects
 * Uses user-scoped cache keys for security
 * Session validation is handled by middleware and the query function
 */
export function useUserSubjects(userId: string | undefined): UseUserSubjectsReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: userId ? queryKeys.user.subjects(userId) : ['user-subjects-anonymous'],
    queryFn: async () => {
      if (!userId) {
        return []
      }
      
      // Get user subjects with built-in retry and error handling
      const userSubjects = await getUserSubjectsClient(userId)
      
      // Transform to include slugs for navigation
      return userSubjects.map(userSubject => ({
        ...userSubject.subject,
        slug: generateSlug(userSubject.subject)
      }))
    },
    enabled: !!userId,
    ...CACHE_TIMES.USER_DATA,
    retry: 1, // Override default retry for user data (query function already has retry)
  })
  
  return {
    subjects: data ?? [],
    isLoading,
    error: error as Error | null,
  }
}
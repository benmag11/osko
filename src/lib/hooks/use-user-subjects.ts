'use client'

import { useQuery } from '@tanstack/react-query'
import { getUserSubjectsClient } from '@/lib/services/subjects-client'
import { generateSlug } from '@/lib/utils/slug'
import type { Subject } from '@/lib/types/database'
import { CACHE_TIMES } from '@/lib/config/cache'
import { queryKeys } from '@/lib/queries/query-keys'
import { createClient } from '@/lib/supabase/client'

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
 */
export function useUserSubjects(userId: string | undefined): UseUserSubjectsReturn {
  const supabase = createClient()
  
  const { data, isLoading, error } = useQuery({
    queryKey: userId ? queryKeys.user.subjects(userId) : ['user-subjects-anonymous'],
    queryFn: async () => {
      if (!userId) {
        return []
      }
      
      // Validate session before fetching
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session || session.user.id !== userId) {
        console.warn('Session validation failed in useUserSubjects')
        return []
      }
      
      // Check if session is expired
      if (session.expires_at && session.expires_at * 1000 < Date.now()) {
        console.warn('Session expired in useUserSubjects')
        return []
      }
      
      const userSubjects = await getUserSubjectsClient(userId)
      
      // Transform to include slugs for navigation
      return userSubjects.map(userSubject => ({
        ...userSubject.subject,
        slug: generateSlug(userSubject.subject)
      }))
    },
    enabled: !!userId,
    ...CACHE_TIMES.USER_DATA,
    retry: 1, // Override default retry for user data
  })
  
  return {
    subjects: data ?? [],
    isLoading,
    error: error as Error | null,
  }
}
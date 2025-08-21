'use client'

import { useQuery } from '@tanstack/react-query'
import { getUserSubjectsClient } from '@/lib/services/subjects-client'
import { generateSlug } from '@/lib/utils/slug'
import type { Subject } from '@/lib/types/database'

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
 * Transforms subjects to include slugs for navigation
 */
export function useUserSubjects(userId: string | undefined): UseUserSubjectsReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user-subjects', userId],
    queryFn: async () => {
      if (!userId) {
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  })
  
  return {
    subjects: data ?? [],
    isLoading,
    error: error as Error | null,
  }
}
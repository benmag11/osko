'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { CACHE_TIMES } from '@/lib/config/cache'

interface UserProfile {
  user_id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

interface UseUserProfileReturn {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  error: Error | null
}

/**
 * Custom hook to fetch and cache user data and profile
 * Prevents duplicate requests across components
 */
export function useUserProfile(): UseUserProfileReturn {
  const supabase = createClient()
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      // Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        throw userError
      }
      
      if (!user) {
        return { user: null, profile: null }
      }
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Failed to fetch user profile:', profileError)
        // Return user even if profile fetch fails
        return { user, profile: null }
      }
      
      return { user, profile }
    },
    ...CACHE_TIMES.USER_DATA,
    retry: 1, // Override default retry for auth queries
  })
  
  return {
    user: data?.user ?? null,
    profile: data?.profile ?? null,
    isLoading,
    error: error as Error | null,
  }
}

/**
 * Hook to get just the current user
 * Uses the same cache as useUserProfile
 */
export function useUser() {
  const { user, isLoading, error } = useUserProfile()
  return { user, isLoading, error }
}
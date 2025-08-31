'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { CACHE_TIMES } from '@/lib/config/cache'
import { queryKeys } from '@/lib/queries/query-keys'
import { useState, useEffect } from 'react'

interface UserProfile {
  user_id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  onboarding_completed: boolean
  is_admin: boolean
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
 * Uses user-scoped cache keys to prevent data leakage
 */
export function useUserProfile(): UseUserProfileReturn {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  
  // Get initial user ID
  useEffect(() => {
    const getInitialUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
    }
    getInitialUser()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
    })
    
    return () => subscription.unsubscribe()
  }, [supabase])
  
  const { data, isLoading, error } = useQuery({
    queryKey: userId ? queryKeys.user.profile(userId) : ['user-profile-anonymous'],
    queryFn: async () => {
      // Validate session before fetching
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        return { user: null, profile: null }
      }
      
      // Check if session is expired
      if (session.expires_at && session.expires_at * 1000 < Date.now()) {
        console.warn('Session expired, returning null')
        return { user: null, profile: null }
      }
      
      const user = session.user
      
      // Get user profile with the validated user ID
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
    enabled: !!userId, // Only run query if we have a user ID
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch on network reconnect
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
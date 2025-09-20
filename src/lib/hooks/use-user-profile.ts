'use client'

import { useAuth } from '@/components/providers/auth-provider'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/lib/types/database'

interface UseUserProfileReturn {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  error: Error | null
  refetchProfile: () => Promise<UserProfile | null>
}

export function useUserProfile(): UseUserProfileReturn {
  const {
    user,
    profile,
    profileError,
    isLoading,
    isProfileLoading,
    refetchProfile,
  } = useAuth()

  return {
    user,
    profile,
    isLoading: isLoading || isProfileLoading,
    error: profileError,
    refetchProfile,
  }
}

export function useUser() {
  const { user, isLoading, profileError } = useAuth()
  return { user, isLoading, error: profileError }
}

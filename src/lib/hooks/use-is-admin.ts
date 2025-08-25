'use client'

import { useUserProfile } from './use-user-profile'

export function useIsAdmin() {
  const { profile, isLoading } = useUserProfile()
  
  return {
    isAdmin: profile?.is_admin ?? false,
    isLoading,
  }
}
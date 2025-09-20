'use client'

import { useAuth } from '@/components/providers/auth-provider'

export function useIsAdmin() {
  const { profile, isProfileLoading } = useAuth()

  return {
    isAdmin: profile?.is_admin ?? false,
    isLoading: isProfileLoading,
  }
}

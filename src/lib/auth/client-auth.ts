'use client'

import { createClient } from '@/lib/supabase/client'
import { clearAllCache } from '@/lib/cache/cache-utils'
import { QueryClient } from '@tanstack/react-query'

/**
 * Client-side auth utilities that handle cache clearing
 * and other client-specific auth operations
 */

/**
 * Performs a secure sign-out with complete cache clearing
 * This should be used instead of directly calling the server action
 */
export async function clientSignOut(queryClient: QueryClient) {
  try {
    // 1. Clear all React Query cache first
    clearAllCache(queryClient)
    
    // 2. Clear any client-side Supabase session
    const supabase = createClient()
    await supabase.auth.signOut()
    
    // 3. Force reload to clear any remaining in-memory state
    // and trigger server-side sign-out via middleware
    window.location.href = '/'
    
  } catch (error) {
    console.error('Error during sign-out:', error)
    // Even if there's an error, still try to redirect
    window.location.href = '/'
  }
}

/**
 * Checks if the current session is valid
 * Can be used to validate cache entries
 */
export async function isSessionValid(): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return false
    }
    
    // Check if session is expired
    const expiresAt = session.expires_at
    if (expiresAt && expiresAt * 1000 < Date.now()) {
      return false
    }
    
    return true
  } catch {
    return false
  }
}

/**
 * Gets the current user ID for cache keying
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
  } catch {
    return null
  }
}
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


'use server'

import { createServerSupabaseClient } from './server'
import { cache } from 'react'

/**
 * Cached admin verification function
 * Uses React's cache to ensure we only check once per request
 */
export const getCachedAdminStatus = cache(async (userId: string): Promise<boolean> => {
  const supabase = await createServerSupabaseClient()
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', userId)
    .single()
  
  return profile?.is_admin ?? false
})

/**
 * Ensures the current user is an admin
 * Throws Error if not authenticated or not an admin
 * 
 * @returns The authenticated user's ID
 * @throws {Error} If user is not authenticated or not an admin
 */
export async function ensureAdmin(): Promise<string> {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Not authenticated')
  }
  
  // Use cached function to avoid multiple DB queries in the same request
  const isAdmin = await getCachedAdminStatus(user.id)
  
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }
  
  return user.id
}

/**
 * Optional: Get admin status without throwing
 * Useful for conditional logic
 */
export async function getAdminStatus(): Promise<{ isAdmin: boolean; userId: string | null }> {
  try {
    const userId = await ensureAdmin()
    return { isAdmin: true, userId }
  } catch {
    return { isAdmin: false, userId: null }
  }
}

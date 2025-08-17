'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signInWithGoogle() {
  const supabase = await createServerSupabaseClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    }
  })
  
  if (error) {
    console.error('Google OAuth error:', error)
    return { error: error.message }
  }
  
  if (data?.url) {
    redirect(data.url)
  }
  
  return { error: 'Failed to initiate Google OAuth flow' }
}
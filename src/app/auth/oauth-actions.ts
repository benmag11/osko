'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Provider } from '@supabase/supabase-js'

export async function signInWithOAuth(provider: Provider) {
  const supabase = await createServerSupabaseClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: provider === 'google' ? {
        access_type: 'offline',
        prompt: 'consent',
      } : undefined,
    }
  })
  
  if (error) {
    console.error(`OAuth error for ${provider}:`, error)
    return { error: error.message }
  }
  
  if (data?.url) {
    redirect(data.url)
  }
  
  return { error: 'Failed to initiate OAuth flow' }
}

export async function signInWithGoogle() {
  return signInWithOAuth('google')
}

export async function signInWithApple() {
  return signInWithOAuth('apple')
}
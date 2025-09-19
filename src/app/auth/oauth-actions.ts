'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const FALLBACK_SITE_URL = 'http://localhost:3000'

function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  if (siteUrl) {
    return siteUrl.replace(/\/$/, '')
  }

  const vercelUrl = process.env.VERCEL_URL?.trim()

  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, '')}`
  }

  return FALLBACK_SITE_URL
}

export async function signInWithGoogle() {
  const supabase = await createServerSupabaseClient()
  const siteUrl = getSiteUrl()
  const callbackUrl = new URL('/auth/callback', siteUrl).toString()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
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

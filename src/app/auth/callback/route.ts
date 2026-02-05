import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const DEFAULT_REDIRECT_PATH = '/dashboard/study'

function resolveBaseUrl(request: Request, requestUrl: URL) {
  const rawForwardedHost = request.headers.get('x-forwarded-host')
  const rawForwardedProto = request.headers.get('x-forwarded-proto')
  const forwardedHost = rawForwardedHost?.split(',')[0]?.trim()
  const forwardedProto = rawForwardedProto?.split(',')[0]?.trim()
  const isDevelopment = process.env.NODE_ENV === 'development'

  if (!isDevelopment && forwardedHost) {
    const protocol = forwardedProto ?? requestUrl.protocol.replace(':', '')
    return `${protocol}://${forwardedHost}`
  }

  return requestUrl.origin
}

function sanitizeNextPath(nextParam: string | null) {
  if (!nextParam) {
    return DEFAULT_REDIRECT_PATH
  }

  const trimmed = nextParam.trim()

  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return DEFAULT_REDIRECT_PATH
  }

  return trimmed
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  const baseUrl = resolveBaseUrl(request, requestUrl)
  const next = sanitizeNextPath(requestUrl.searchParams.get('next'))

  const redirectWithBase = (path: string) => NextResponse.redirect(new URL(path, baseUrl))
  const redirectWithError = (message: string) =>
    redirectWithBase(`/auth/signin?error=${encodeURIComponent(message)}`)
  
  // Handle OAuth errors (e.g., user cancelled the flow)
  if (error) {
    console.error('OAuth callback error:', error, error_description)
    return redirectWithError(error_description || error)
  }
  
  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error: exchangeError, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      return redirectWithError('Authentication failed. Please try again.')
    }
    
    if (data?.user) {
      // Password recovery flow — skip onboarding check
      if (next === '/auth/reset-password') {
        return redirectWithBase(next)
      }

      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', data.user.id)
        .single()
      
      // If no profile exists, create one
      if (!profile) {
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: data.user.id,
            onboarding_completed: false
          })
        
        if (createError) {
          console.error('Error creating user profile:', createError)
        }
        
        return redirectWithBase('/onboarding')
      }
      
      // If onboarding not completed, redirect to onboarding
      if (!profile.onboarding_completed) {
        return redirectWithBase('/onboarding')
      }
      
      // Successful authentication and onboarding completed
      return redirectWithBase(next)
    }
  }
  
  // No code or error in the URL, redirect to sign in
  return redirectWithBase('/auth/signin')
}

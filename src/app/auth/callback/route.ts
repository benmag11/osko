import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/types/database'

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

  // Collect cookies that Supabase wants to set during code exchange,
  // so we can forward them onto the redirect response.
  const cookiesToForward: { name: string; value: string; options: Record<string, unknown> }[] = []
  const cookieStore = await cookies()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookiesToForward.push({ name, value, options: options as Record<string, unknown> })
            // Also set on the implicit store so subsequent reads
            // (e.g. profile query) see the fresh session
            try {
              cookieStore.set(name, value, options)
            } catch {
              // May fail if headers already sent — cookies will still be
              // forwarded via the redirect response below
            }
          })
        },
      },
    }
  )

  /** Create a redirect response and attach all captured cookies */
  const redirectWithCookies = (path: string) => {
    const response = NextResponse.redirect(new URL(path, baseUrl))
    cookiesToForward.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })
    return response
  }

  const redirectWithError = (message: string) =>
    redirectWithCookies(`/auth/signin?error=${encodeURIComponent(message)}`)

  // Handle OAuth errors (e.g., user cancelled the flow)
  if (error) {
    console.error('OAuth callback error:', error, error_description)
    return redirectWithError(error_description || error)
  }

  if (code) {
    const { error: exchangeError, data } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      return redirectWithError('Authentication failed. Please try again.')
    }

    if (data?.user) {
      // Password recovery flow — skip onboarding check
      if (next === '/auth/reset-password') {
        return redirectWithCookies(next)
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

        return redirectWithCookies('/onboarding')
      }

      // If onboarding not completed, redirect to onboarding
      if (!profile.onboarding_completed) {
        return redirectWithCookies('/onboarding')
      }

      // Successful authentication and onboarding completed
      return redirectWithCookies(next)
    }
  }

  // No code or error in the URL, redirect to sign in
  return redirectWithCookies('/auth/signin')
}

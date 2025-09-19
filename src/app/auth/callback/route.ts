import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const isDevelopment = process.env.NODE_ENV === 'development'
  const baseUrl = isDevelopment || !forwardedHost
    ? requestUrl.origin
    : `${forwardedProto}://${forwardedHost}`

  let next = requestUrl.searchParams.get('next') || '/dashboard/study'

  if (!next.startsWith('/')) {
    next = '/dashboard/study'
  }
  
  // Handle OAuth errors (e.g., user cancelled the flow)
  if (error) {
    console.error('OAuth callback error:', error, error_description)
    return NextResponse.redirect(
      `${baseUrl}/auth/signin?error=${encodeURIComponent(error_description || error)}`
    )
  }
  
  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error: exchangeError, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      return NextResponse.redirect(
        `${baseUrl}/auth/signin?error=${encodeURIComponent('Authentication failed. Please try again.')}`
      )
    }
    
    if (data?.user) {
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
        
        return NextResponse.redirect(`${baseUrl}/onboarding`)
      }
      
      // If onboarding not completed, redirect to onboarding
      if (!profile.onboarding_completed) {
        return NextResponse.redirect(`${baseUrl}/onboarding`)
      }
      
      // Successful authentication and onboarding completed
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }
  
  // No code or error in the URL, redirect to sign in
  return NextResponse.redirect(`${baseUrl}/auth/signin`)
}

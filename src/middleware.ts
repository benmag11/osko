import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  
  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isOnboardingPage = request.nextUrl.pathname.startsWith('/onboarding')
  const isProtectedPage = request.nextUrl.pathname.startsWith('/subject/') ||
                         request.nextUrl.pathname.startsWith('/dashboard')
  
  // Redirect unauthenticated users trying to access protected pages
  if (!user && (isProtectedPage || isOnboardingPage)) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
  
  // For authenticated users
  if (user) {
    // Fetch profile once and cache it for this request
    let profile: { onboarding_completed: boolean } | null = null
    let profileFetched = false
    
    const getProfile = async () => {
      if (!profileFetched) {
        const { data } = await supabase
          .from('user_profiles')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .single()
        profile = data
        profileFetched = true
      }
      return profile
    }
    
    // Redirect away from auth pages (except callback)
    if (isAuthPage && !request.nextUrl.pathname.includes('/callback')) {
      // Check onboarding status before redirecting
      const userProfile = await getProfile()
      
      if (!userProfile || !userProfile.onboarding_completed) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
      return NextResponse.redirect(new URL('/dashboard/study', request.url))
    }
    
    // Check onboarding status for protected pages
    if (isProtectedPage && !isOnboardingPage) {
      const userProfile = await getProfile()
      
      // Redirect to onboarding if not completed
      if (!userProfile || !userProfile.onboarding_completed) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    }
    
    // Redirect away from onboarding if already completed
    if (isOnboardingPage) {
      const userProfile = await getProfile()
      
      if (userProfile && userProfile.onboarding_completed) {
        return NextResponse.redirect(new URL('/dashboard/study', request.url))
      }
    }
  }
  
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
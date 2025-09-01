# Route Protection & Middleware Documentation

## Overview
The route protection and middleware system provides comprehensive authentication and authorization for the application, managing user sessions, protecting routes, enforcing onboarding completion, and handling authentication state transitions. It integrates Supabase Auth with Next.js middleware to create a secure, seamless user experience.

## Architecture
The system uses a multi-layered architecture combining Next.js middleware, Supabase authentication, React context providers, and cache management. The middleware intercepts all requests at the edge, validates authentication state, checks onboarding status, and performs intelligent routing. This architecture ensures security at the request level while maintaining performance through strategic caching and session management.

## File Structure
```
src/
├── middleware.ts                          # Core middleware for route protection
├── app/
│   ├── auth/
│   │   ├── actions.ts                    # Server actions for authentication
│   │   ├── oauth-actions.ts              # OAuth provider integrations
│   │   ├── callback/route.ts             # OAuth callback handler
│   │   ├── signin/page.tsx               # Sign-in page
│   │   ├── signup/page.tsx               # Sign-up page
│   │   └── verify/page.tsx               # Email verification page
│   ├── onboarding/
│   │   ├── actions.ts                    # Onboarding server actions
│   │   ├── page.tsx                      # Onboarding page
│   │   └── onboarding-client.tsx         # Client-side onboarding logic
│   ├── dashboard/                        # Protected dashboard routes
│   │   ├── settings/                     # Settings page with authentication
│   │   │   ├── page.tsx                  # Settings server component
│   │   │   ├── actions.ts                # Settings server actions
│   │   │   └── settings-client.tsx       # Settings client component
│   │   └── study/                        # Study dashboard
│   └── subject/[slug]/                   # Protected subject routes
├── components/
│   └── providers/
│       ├── auth-provider.tsx             # Authentication context provider
│       └── providers.tsx                 # Root providers with session management
├── lib/
│   ├── auth/
│   │   └── client-auth.ts               # Client-side auth utilities
│   ├── cache/
│   │   └── cache-utils.ts               # Cache management for auth changes
│   └── supabase/
│       ├── server.ts                     # Server-side Supabase client
│       └── client.ts                     # Client-side Supabase client
```

## Core Components

### Middleware (middleware.ts)
The central component that intercepts all HTTP requests and enforces authentication rules:

```typescript
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  
  // Create Supabase client with cookie management
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Update both request and response cookies
          cookiesToSet.forEach(({ name, value }) => 
            request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )
```

Route classification and protection logic:
```typescript
const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
const isOnboardingPage = request.nextUrl.pathname.startsWith('/onboarding')
const isProtectedPage = request.nextUrl.pathname.startsWith('/subject/') ||
                       request.nextUrl.pathname.startsWith('/dashboard')

// Redirect unauthenticated users trying to access protected pages
if (!user && (isProtectedPage || isOnboardingPage)) {
  return NextResponse.redirect(new URL('/auth/signin', request.url))
}
```

### Auth Provider (auth-provider.tsx)
Manages client-side authentication state and session lifecycle:

```typescript
export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null)
  const [session, setSession] = useState<Session | null>(initialSession)
  const [previousUserId, setPreviousUserId] = useState<string | null>(
    initialSession?.user?.id ?? null
  )
  
  const handleAuthChange = useCallback(
    async (event: AuthChangeEvent, newSession: Session | null) => {
      const newUserId = newSession?.user?.id ?? null
      const userChanged = previousUserId !== null && previousUserId !== newUserId
      
      switch (event) {
        case 'SIGNED_OUT':
          clearAllCache(queryClient)
          setUser(null)
          setSession(null)
          setPreviousUserId(null)
          router.push('/')
          break
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          if (userChanged) {
            clearAllCache(queryClient)
          }
          setUser(newSession?.user ?? null)
          setSession(newSession)
          setPreviousUserId(newUserId)
          break
        case 'USER_UPDATED':
          await invalidateUserCache(queryClient)
          setUser(newSession?.user ?? null)
          setSession(newSession)
          break
      }
    },
    [queryClient, router, previousUserId]
  )
```

### OAuth Callback Handler (callback/route.ts)
Processes OAuth authentication callbacks and manages user profile creation:

```typescript
export async function GET(request: Request) {
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (data?.user) {
      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', data.user.id)
        .single()
      
      // Create profile if it doesn't exist
      if (!profile) {
        await supabase.from('user_profiles').insert({
          user_id: data.user.id,
          onboarding_completed: false
        })
        return NextResponse.redirect(`${origin}/onboarding`)
      }
      
      // Route based on onboarding status
      if (!profile.onboarding_completed) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }
}
```

## Data Flow

### Authentication Flow
1. **Initial Request**: User accesses the application
2. **Middleware Interception**: Every request passes through middleware.ts
3. **Session Validation**: Middleware validates the Supabase session via cookies
4. **Route Decision**: Based on auth state and route type, middleware decides:
   - Allow access (authenticated + authorized)
   - Redirect to sign-in (unauthenticated accessing protected)
   - Redirect to onboarding (authenticated but incomplete profile)
   - Redirect to dashboard (authenticated accessing auth pages)

### Session Management Flow
1. **Server-Side Initialization**: Root layout fetches initial session
2. **Provider Setup**: Session passed to AuthProvider via props
3. **Client Hydration**: AuthProvider initializes with server session
4. **State Synchronization**: onAuthStateChange listener maintains sync
5. **Cache Management**: User-specific QueryClient prevents data leakage
6. **Session Expiry Check**: Periodic validation every 60 seconds
7. **User Change Detection**: Automatic cache clearing when user switches

### Onboarding Flow
1. **Profile Check**: Middleware checks user_profiles.onboarding_completed
2. **Forced Onboarding**: Incomplete profiles redirected to /onboarding
3. **Data Collection**: Name and subject selection
4. **Profile Update**: Server action updates profile and marks complete
5. **Dashboard Access**: User gains access to protected routes

## Key Functions and Hooks

### useAuth Hook
Provides authentication context throughout the application:
```typescript
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

### clientSignOut Function
Handles secure client-side sign-out with cache clearing:
```typescript
export async function clientSignOut(queryClient: QueryClient) {
  // 1. Clear all React Query cache first
  clearAllCache(queryClient)
  
  // 2. Clear client-side Supabase session
  const supabase = createClient()
  await supabase.auth.signOut()
  
  // 3. Force reload to clear in-memory state
  window.location.href = '/'
}
```

### saveOnboardingData Server Action
Completes user onboarding with transaction-like behavior:
```typescript
export async function saveOnboardingData(data: OnboardingFormData) {
  // Create or update user profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: user.id,
      name: data.name.trim(),
      onboarding_completed: true,
      updated_at: new Date().toISOString()
    })
  
  // Save user subjects
  const result = await saveUserSubjects(user.id, data.subjectIds)
  
  if (!result.success) {
    // Rollback profile update if subjects fail
    await supabase
      .from('user_profiles')
      .update({ onboarding_completed: false })
      .eq('user_id', user.id)
  }
}
```

## Integration Points

### Supabase Authentication
- **Server Client**: Created per-request with cookie management
- **Browser Client**: Singleton instance with automatic token refresh
- **Session Storage**: Secure httpOnly cookies managed by Supabase
- **OAuth Providers**: Google authentication with PKCE flow

### Next.js Integration
- **Middleware**: Edge runtime interception of all requests
- **Server Actions**: Type-safe authentication operations
- **Route Handlers**: OAuth callback processing
- **Server Components**: Initial session fetching

### Cache Management Integration
- **User Isolation**: Separate QueryClient per user session
- **Cache Clearing**: Complete cache purge on sign-out
- **Session Validation**: Periodic expiry checks with cache invalidation
- **User Switch Detection**: Automatic cache clear when user changes

## Configuration

### Middleware Configuration
```typescript
export const config = {
  matcher: [
    // Match all routes except static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
NEXT_PUBLIC_SITE_URL=<production-url>
VERCEL_URL=<vercel-deployment-url>
```

### Protected Routes
- `/dashboard/*` - User dashboard and settings
  - `/dashboard/study` - Main study dashboard
  - `/dashboard/settings` - User settings page
  - `/dashboard/statistics` - User statistics
- `/subject/*` - Subject-specific exam content
- `/onboarding` - Profile completion flow

### Public Routes
- `/` - Landing page
- `/auth/signin` - Sign-in page
- `/auth/signup` - Sign-up page
- `/auth/verify` - Email verification
- `/auth/callback` - OAuth callback

## Type Definitions

### Authentication Types
```typescript
interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}

interface OnboardingFormData {
  name: string
  subjectIds: string[]
}

type ServerActionResult = 
  | { success: true; redirectUrl: string }
  | { success: false; error: string; code?: string }
```

### Middleware Request Context
```typescript
interface MiddlewareContext {
  user: User | null
  isAuthPage: boolean
  isOnboardingPage: boolean
  isProtectedPage: boolean
  profile: { onboarding_completed: boolean } | null
}
```

## Settings Page Protection

### Server-Side Authentication (settings/page.tsx)
The settings page implements server-side authentication checks before rendering:

```typescript
export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="flex-1 bg-cream-50">
        <div className="px-8 py-8">
          <div className="mx-auto max-w-4xl">
            <p className="text-center text-warm-text-muted">
              Please sign in to view your settings
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  // Fetch user data and render settings
  const [allSubjects, userSubjectsData] = await Promise.all([
    getAllSubjects(),
    getUserSubjects(user.id)
  ])
```

### Settings Actions Authentication (settings/actions.ts)
Every settings action includes authentication verification:

```typescript
export async function updateUserName(name: string) {
  const supabase = await createServerSupabaseClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { error: 'You must be logged in to update your name' }
  }
  
  // Proceed with authenticated operation
  const { error } = await supabase
    .from('user_profiles')
    .update({ 
      name: name.trim(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
}
```

### Protected Settings Operations
All settings operations require authentication:
- **Name Updates**: `updateUserName()` - Verifies user before updating profile
- **Email Changes**: `requestEmailChange()` - Requires password verification
- **Password Updates**: `updatePassword()` - Validates current password first
- **Subject Management**: `updateUserSubjects()` - Ensures user owns the subjects
- **OTP Verification**: `verifyEmailChangeOtp()` - Confirms user identity

## Implementation Details

### Cookie Management
The middleware handles Supabase auth cookies with careful synchronization:
```typescript
cookies: {
  getAll() {
    return request.cookies.getAll()
  },
  setAll(cookiesToSet) {
    // Update request cookies for downstream processing
    cookiesToSet.forEach(({ name, value }) => 
      request.cookies.set(name, value))
    
    // Create new response with updated cookies
    supabaseResponse = NextResponse.next({ request })
    
    // Set cookies on response for client
    cookiesToSet.forEach(({ name, value, options }) =>
      supabaseResponse.cookies.set(name, value, options))
  }
}
```

### Profile Caching Strategy
The middleware implements intelligent profile caching to minimize database queries:
```typescript
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
```

### Session Expiry Monitoring
The AuthProvider implements periodic session validation:
```typescript
useEffect(() => {
  const checkSessionExpiry = () => {
    if (session?.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000)
      const now = new Date()
      
      if (now >= expiresAt) {
        clearAllCache(queryClient)
        setUser(null)
        setSession(null)
        router.push('/auth/signin')
      }
    }
  }
  
  const interval = setInterval(checkSessionExpiry, 60000)
  return () => clearInterval(interval)
}, [session, queryClient, router])
```

### User Context Isolation
The providers system ensures each user has isolated cache with enhanced cleanup:
```typescript
function getQueryClient(userId?: string) {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient(userId)
  }
  
  // Browser: create or get client for this user
  const clientKey = userId || 'anonymous'
  
  if (!queryClientMap.has(clientKey)) {
    // Clean up old clients when creating new one
    if (queryClientMap.size > 0 && clientKey !== 'anonymous') {
      for (const [key, client] of queryClientMap.entries()) {
        if (key !== clientKey) {
          client.clear()
          client.unmount()
          queryClientMap.delete(key)
        }
      }
    }
    queryClientMap.set(clientKey, makeQueryClient(userId))
  }
  
  return queryClientMap.get(clientKey)!
}
```

### Cache Management Utilities
The system provides comprehensive cache management functions:
```typescript
// Complete cache clearing on sign-out
export function clearAllCache(queryClient: QueryClient) {
  queryClient.cancelQueries()
  queryClient.clear()
  queryClient.setDefaultOptions({
    queries: { staleTime: 0, gcTime: 0 }
  })
}

// Selective cache invalidation for user data
export async function invalidateUserCache(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: ['user'] })
  await queryClient.invalidateQueries({ queryKey: ['user-profile-anonymous'] })
  queryClient.removeQueries({ queryKey: ['user'] })
  queryClient.removeQueries({ queryKey: ['user-profile-anonymous'] })
}
```

## Dependencies

### External Dependencies
- `@supabase/ssr`: Server-side rendering support for Supabase
- `@supabase/supabase-js`: Supabase JavaScript client
- `@tanstack/react-query`: Data fetching and caching
- `next/navigation`: Next.js navigation utilities

### Internal Dependencies
- Cache management utilities for session changes
- User profile and subject queries
- Form validation utilities
- URL filter management

## API Reference

### Middleware API
- `middleware(request: NextRequest)`: Main middleware function
- Returns: `NextResponse` with appropriate redirects or pass-through

### Authentication Actions
- `signUp(formData: FormData)`: Register new user
- `signIn(formData: FormData)`: Authenticate existing user
- `signOut()`: Server-side sign-out
- `verifyOtp(email: string, token: string)`: Verify email OTP
- `resendOtp(email: string)`: Resend OTP for email verification
- `signInWithGoogle()`: Initiate Google OAuth flow

### Onboarding Actions
- `saveOnboardingData(data: OnboardingFormData)`: Complete onboarding
- `checkOnboardingStatus()`: Check if onboarding is complete
- `getUserProfile()`: Fetch user profile with subjects

### Settings Actions
- `updateUserName(name: string)`: Update user's display name
- `updateUserSubjects(subjectIds: string[])`: Update user's selected subjects
- `requestEmailChange(newEmail: string, password: string)`: Initiate email change
- `verifyEmailChangeOtp(newEmail: string, token: string)`: Verify email change OTP
- `resendEmailChangeOtp(newEmail: string)`: Resend email change OTP
- `updatePassword(currentPassword: string, newPassword: string, confirmPassword: string)`: Update password
- `verifyPasswordForEmailChange(password: string)`: Verify password for email changes

### Client Utilities
- `clientSignOut(queryClient: QueryClient)`: Client-side sign-out with cache clearing
- `isSessionValid()`: Validate current session
- `getCurrentUserId()`: Get authenticated user ID

## Other Notes

### Security Considerations
- All authentication state is validated server-side in middleware
- Cookies are httpOnly and secure in production
- OAuth flows use PKCE for additional security
- Session tokens are never exposed to client-side JavaScript
- Cache is completely cleared on authentication changes to prevent data leakage
- Settings actions include double authentication verification
- Password changes require current password verification
- Email changes require both password and OTP verification
- User-specific QueryClient instances prevent cross-user data access

### Performance Optimizations
- Profile data is cached per-request in middleware to reduce database queries
- Parallel data fetching in OAuth callback for faster onboarding checks
- User-specific QueryClient instances prevent cross-user cache pollution
- Middleware runs at the edge for minimal latency
- Server-side authentication checks prevent unnecessary client renders
- Optimized cache invalidation patterns for selective updates
- Automatic cleanup of old QueryClient instances to prevent memory leaks

### Error Handling
- OAuth errors redirect to sign-in with error messages
- Failed profile creation triggers automatic retry
- Network errors in auth state changes force sign-out
- Transaction-like rollback for failed onboarding operations

### Edge Cases
- Users with existing emails (from OAuth) are detected and handled
- Missing profiles are automatically created during OAuth callback
- Expired sessions trigger automatic cache clearing and redirect
- Multiple tab session management through auth state listeners
- Browser back button after sign-out is handled by middleware
# Authentication System Documentation

## Overview
The authentication system provides secure user authentication using Supabase Auth with support for email/password and OAuth (Google) authentication methods. It includes OTP email verification, session management, middleware protection, and comprehensive cache management to prevent data leakage between user sessions. The system ensures proper user onboarding flow and maintains security through Row Level Security (RLS) policies at the database level.

## Architecture

The authentication system follows a multi-layered architecture pattern:

1. **Database Layer**: Supabase Auth tables with RLS policies
2. **Server Layer**: Next.js server actions and middleware for route protection
3. **Client Layer**: React components with form handling and session management
4. **Cache Layer**: Per-user QueryClient isolation to prevent data leakage
5. **Provider Layer**: AuthProvider for centralized session state management

The architecture ensures that authentication state is consistently managed across server and client boundaries, with proper session validation at each layer. The system uses cookie-based session management with automatic token refresh handled by Supabase.

## File Structure

### Core Authentication Files
- `/src/middleware.ts` - Route protection and authentication enforcement
- `/src/app/auth/actions.ts` - Server actions for auth operations
- `/src/app/auth/oauth-actions.ts` - OAuth-specific server actions
- `/src/app/auth/callback/route.ts` - OAuth callback handler

### Authentication Pages
- `/src/app/auth/signin/page.tsx` - Sign-in page
- `/src/app/auth/signup/page.tsx` - Sign-up page
- `/src/app/auth/verify/page.tsx` - OTP verification page

### Authentication Components
- `/src/components/auth/login-form.tsx` - Login form component
- `/src/components/auth/signup-form.tsx` - Sign-up form component
- `/src/components/auth/oauth-buttons.tsx` - OAuth provider buttons
- `/src/components/auth/otp-verification-form.tsx` - OTP verification form

### Providers and State Management
- `/src/components/providers/auth-provider.tsx` - Authentication context provider
- `/src/components/providers/providers.tsx` - Root providers with QueryClient isolation
- `/src/lib/auth/client-auth.ts` - Client-side auth utilities

### Supabase Configuration
- `/src/lib/supabase/client.ts` - Browser Supabase client
- `/src/lib/supabase/server.ts` - Server Supabase client

### Supporting Utilities
- `/src/lib/utils/form-validation.ts` - Form data validation
- `/src/lib/cache/cache-utils.ts` - Cache management utilities
- `/src/lib/hooks/use-user-profile.ts` - User profile hook
- `/src/lib/hooks/use-is-admin.ts` - Admin role detection hook

## Core Components

### Middleware Protection (`middleware.ts`)

The middleware runs on every request and handles route protection:

```typescript
export async function middleware(request: NextRequest) {
  // Create Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          // Update cookies in response
        },
      },
    }
  )
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  // Protection logic:
  // 1. Redirect unauthenticated users from protected routes to /auth/signin
  // 2. Redirect authenticated users from auth pages to dashboard
  // 3. Check onboarding status and redirect accordingly
  // 4. Handle profile fetching with caching for performance
}
```

Key features:
- Protects `/subject/*` and `/dashboard/*` routes
- Enforces onboarding completion before accessing protected pages
- Caches profile lookups within request lifecycle
- Handles auth page redirects for authenticated users

### Server Actions (`actions.ts`)

Server-side authentication operations with proper validation:

```typescript
export async function signUp(formData: FormData) {
  // 1. Extract and validate form data
  const validated = extractAuthFormData(formData)
  
  // 2. Create user with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  
  // 3. Check for existing accounts
  if (data?.user?.identities?.length === 0) {
    return { error: 'An account with this email already exists' }
  }
  
  // 4. Redirect to OTP verification
  redirect(`/auth/verify?email=${encodeURIComponent(email)}`)
}
```

Available actions:
- `signUp`: Creates new user account with email/password
- `signIn`: Authenticates existing user
- `signOut`: Terminates user session
- `verifyOtp`: Verifies email OTP code
- `resendOtp`: Resends verification code
- `getUser`: Retrieves current authenticated user

### OAuth Integration (`oauth-actions.ts`)

Google OAuth implementation:

```typescript
export async function signInWithGoogle() {
  const supabase = await createServerSupabaseClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
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
  
  if (data?.url) {
    redirect(data.url)
  }
}
```

OAuth flow:
1. User clicks Google sign-in button
2. Redirected to Google for authentication
3. Callback to `/auth/callback` route
4. Profile creation if new user
5. Onboarding check and redirect

### AuthProvider Component

Centralized authentication state management:

```typescript
export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null)
  const [session, setSession] = useState<Session | null>(initialSession)
  
  // Handle auth state changes
  const handleAuthChange = useCallback(
    async (event: AuthChangeEvent, newSession: Session | null) => {
      switch (event) {
        case 'SIGNED_OUT':
          clearAllCache(queryClient)
          setUser(null)
          setSession(null)
          router.push('/')
          break
          
        case 'SIGNED_IN':
          if (userChanged) {
            clearAllCache(queryClient)
          }
          setUser(newSession?.user ?? null)
          setSession(newSession)
          break
      }
    },
    [queryClient, router, previousUserId]
  )
  
  // Session expiry monitoring
  useEffect(() => {
    const checkSessionExpiry = () => {
      if (session?.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000)
        if (new Date() >= expiresAt) {
          clearAllCache(queryClient)
          router.push('/auth/signin')
        }
      }
    }
    const interval = setInterval(checkSessionExpiry, 60000)
  }, [session])
}
```

Features:
- Tracks user authentication state
- Handles auth state changes (sign in/out, token refresh)
- Monitors session expiry
- Manages cache clearing on auth changes
- Provides `signOut` function with proper cleanup

## Data Flow

### Sign-Up Flow

1. **User submits sign-up form** (`signup-form.tsx`)
   ```typescript
   async function handleSubmit(formData: FormData) {
     const result = await signUp(formData)
     if (result?.error) {
       setError(result.error)
     }
   }
   ```

2. **Server action validates and creates account** (`actions.ts`)
   - Validates email format and password requirements
   - Creates user in Supabase Auth
   - Sends OTP verification email

3. **Redirect to verification page** (`verify/page.tsx`)
   - Passes email as query parameter
   - Displays OTP input form

4. **User enters OTP code** (`otp-verification-form.tsx`)
   - Auto-submits when 6 digits entered
   - Shows resend button with cooldown

5. **Verification completes** (`actions.ts:verifyOtp`)
   - Verifies OTP with Supabase
   - Checks onboarding status
   - Creates user profile if needed
   - Redirects to onboarding or dashboard

### Sign-In Flow

1. **User submits login form** with email/password or clicks OAuth button
2. **Server action authenticates** via Supabase Auth
3. **Session created** with secure cookies
4. **Middleware checks profile** for onboarding status
5. **Redirect to appropriate page** (onboarding or dashboard)

### OAuth Flow

1. **User clicks Google button** (`oauth-buttons.tsx`)
2. **Server action initiates OAuth** (`oauth-actions.ts`)
3. **User authenticates with Google**
4. **Callback handler processes** (`callback/route.ts`)
   - Exchanges code for session
   - Creates/updates user profile
   - Checks onboarding status
5. **Redirect based on profile state**

## Key Functions and Hooks

### useUserProfile Hook

Fetches and caches user profile data:

```typescript
export function useUserProfile(): UseUserProfileReturn {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  
  const { data, isLoading, error } = useQuery({
    queryKey: userId ? queryKeys.user.profile(userId) : ['user-profile-anonymous'],
    queryFn: async () => {
      // Validate session
      const { data: { session } } = await supabase.auth.getSession()
      
      // Check expiry
      if (session.expires_at && session.expires_at * 1000 < Date.now()) {
        return { user: null, profile: null }
      }
      
      // Fetch profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      return { user, profile }
    },
    ...CACHE_TIMES.USER_DATA,
    enabled: !!userId,
  })
}
```

### Form Validation Utilities

Type-safe form data extraction:

```typescript
export function extractAuthFormData(formData: FormData): AuthFormData {
  const email = formData.get('email')
  const password = formData.get('password')
  
  if (!email || typeof email !== 'string') {
    throw new Error('Email is required and must be a string')
  }
  
  if (!email.includes('@')) {
    throw new Error('Please provide a valid email address')
  }
  
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long')
  }
  
  return { email: email.trim(), password }
}
```

### Cache Management

Per-user cache isolation:

```typescript
function makeQueryClient(userId?: string) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: userId ? CACHE_TIMES.USER_DATA.staleTime : 0,
        gcTime: userId ? CACHE_TIMES.USER_DATA.gcTime : 0,
      },
    },
  })
  
  // Tag client with user ID for debugging
  if (userId) {
    Object.defineProperty(client, '__userId', {
      value: userId,
      writable: false,
    })
  }
  
  return client
}
```

## Integration Points

### Database Integration

The authentication system integrates with PostgreSQL/Supabase:

**Tables:**
- `auth.users` - Core authentication data (managed by Supabase)
- `public.user_profiles` - Extended user profile data
- `public.user_subjects` - User's selected subjects

**RLS Policies on user_profiles:**
```sql
-- Users can view own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update own profile  
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Session Initialization

Sessions are initialized server-side in the root layout:

```typescript
// app/layout.tsx
export default async function RootLayout({ children }) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  return (
    <Providers initialSession={session}>
      {children}
    </Providers>
  )
}
```

### Protected Routes

Routes are protected via middleware configuration:

```typescript
const isProtectedPage = 
  request.nextUrl.pathname.startsWith('/subject/') ||
  request.nextUrl.pathname.startsWith('/dashboard')

if (!user && isProtectedPage) {
  return NextResponse.redirect(new URL('/auth/signin', request.url))
}
```

## Configuration

### Environment Variables

Required environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
NEXT_PUBLIC_SITE_URL=https://yourdomain.com # For OAuth callbacks
```

### Cache Configuration

Cache times are configured in `/lib/config/cache.ts`:

```typescript
export const CACHE_TIMES = {
  USER_DATA: {
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime: 10 * 60 * 1000,      // 10 minutes
  },
}
```

### OAuth Provider Setup

Google OAuth configuration in Supabase dashboard:
- Callback URL: `{SITE_URL}/auth/callback`
- Scopes: email, profile
- Access type: offline (for refresh tokens)

## Type Definitions

### Core Authentication Types

```typescript
// From @supabase/supabase-js
interface User {
  id: string
  email?: string
  created_at: string
  // ... other Supabase user fields
}

interface Session {
  user: User
  access_token: string
  refresh_token?: string
  expires_at?: number
  expires_in: number
}

// Custom types
interface UserProfile {
  user_id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  onboarding_completed: boolean
  is_admin: boolean
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}
```

## Implementation Details

### OTP Verification Component

The OTP verification form handles 6-digit code entry with auto-submission:

```typescript
const handleOtpComplete = useCallback(async (value: string) => {
  if (value.length === 6) {
    setIsVerifying(true)
    const result = await verifyOtp(email, value)
    if (result?.error) {
      setError(result.error)
      setOtp('') // Clear on error
    } else {
      setIsSuccess(true)
    }
  }
}, [email])
```

Features:
- Auto-submits when 6 digits entered
- 60-second cooldown on resend
- Visual feedback for errors
- Success state before redirect

### OAuth Button Components

Separate components for sign-in and sign-up with Google:

```typescript
export function GoogleSignInButton() {
  const [isPending, setIsPending] = useState(false)
  
  async function handleGoogleSignIn() {
    setIsPending(true)
    try {
      const result = await signInWithGoogle()
      if (result?.error) {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to sign in with Google')
    }
  }
  
  return (
    <form action={handleGoogleSignIn}>
      <OAuthButton pending={isPending}>
        <GoogleIcon />
        Sign in with Google
      </OAuthButton>
    </form>
  )
}
```

### Session Expiry Monitoring

The AuthProvider monitors session expiry every minute:

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

### Cache Isolation Strategy

Each user gets their own QueryClient instance to prevent data leakage:

```typescript
const queryClientMap = new Map<string, QueryClient>()

function getQueryClient(userId?: string) {
  const clientKey = userId || 'anonymous'
  
  if (!queryClientMap.has(clientKey)) {
    // Clean up old clients when creating new one
    for (const [key, client] of queryClientMap.entries()) {
      if (key !== clientKey) {
        client.clear()
        client.unmount()
        queryClientMap.delete(key)
      }
    }
    
    queryClientMap.set(clientKey, makeQueryClient(userId))
  }
  
  return queryClientMap.get(clientKey)!
}
```

## Security Measures

### Password Requirements
- Minimum 6 characters (enforced in validation)
- Stored as bcrypt hashes by Supabase

### Session Security
- HTTP-only secure cookies
- Automatic token refresh
- Session expiry monitoring
- CSRF protection via Supabase

### Data Isolation
- Per-user QueryClient instances
- User-scoped cache keys
- RLS policies at database level
- Cache clearing on sign-out

### Route Protection
- Middleware-level enforcement
- Server-side session validation
- Onboarding status checks
- Admin route protection

## Dependencies

### External Dependencies
- `@supabase/ssr`: ^0.5.2 - Server-side rendering support
- `@supabase/supabase-js`: ^2.45.8 - Supabase client
- `@tanstack/react-query`: ^5.59.20 - Data fetching and caching

### Internal Dependencies
- Database types from `@/lib/types/database`
- Cache configuration from `@/lib/config/cache`
- UI components from `@/components/ui/*`

## API Reference

### Server Actions

```typescript
// Sign up a new user
signUp(formData: FormData): Promise<{ error?: string } | void>

// Sign in existing user
signIn(formData: FormData): Promise<{ error?: string } | void>

// Sign out current user
signOut(): Promise<void>

// Get current user
getUser(): Promise<User | null>

// Verify OTP code
verifyOtp(email: string, token: string): Promise<{ error?: string } | void>

// Resend OTP code
resendOtp(email: string): Promise<{ success: boolean } | { error: string }>

// OAuth sign-in
signInWithGoogle(): Promise<{ error?: string } | void>
```

### Hooks

```typescript
// Get authentication context
useAuth(): AuthContextType

// Get user profile
useUserProfile(): {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  error: Error | null
}

// Check admin status
useIsAdmin(): {
  isAdmin: boolean
  isLoading: boolean
}
```

### Utility Functions

```typescript
// Create server Supabase client
createServerSupabaseClient(): SupabaseClient

// Create browser Supabase client
createClient(): SupabaseClient

// Clear all cache
clearAllCache(queryClient: QueryClient): void

// Invalidate user cache
invalidateUserCache(queryClient: QueryClient): Promise<void>

// Extract auth form data
extractAuthFormData(formData: FormData): AuthFormData
```

## Other Notes

### Onboarding Flow Integration
The authentication system is tightly integrated with the onboarding flow. After successful authentication (whether through email/password or OAuth), users are automatically redirected to `/onboarding` if their profile's `onboarding_completed` field is false. This ensures all users complete required setup before accessing the main application.

### Profile Creation Timing
User profiles are created at different times depending on the authentication method:
- **Email/Password**: Profile created after OTP verification
- **OAuth**: Profile created immediately in the callback handler
- Both methods check for existing profiles to prevent duplicates

### Error Handling Patterns
The system uses consistent error handling across all authentication operations:
- Server actions return `{ error: string }` objects
- Components display errors in designated error divs
- OAuth errors are passed via URL parameters
- Form validation errors are thrown and caught at the action level

### Mobile Responsiveness
All authentication forms and pages are designed mobile-first with responsive layouts. The OTP input component is optimized for mobile keyboards with numeric input type.

### Future Considerations
The current implementation supports email/password and Google OAuth. The architecture is designed to easily accommodate additional OAuth providers (GitHub, Microsoft, etc.) by adding new provider-specific actions following the same pattern as `signInWithGoogle()`.
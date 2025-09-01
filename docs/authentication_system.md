# Authentication System Documentation

## Overview
The authentication system provides secure user authentication and session management using Supabase Auth with SSR support. It implements email/password and OAuth (Google) authentication flows with OTP-based email verification, password and email change capabilities, automatic session refresh, onboarding flow integration, and complete cache isolation between user sessions.

## Architecture
The authentication architecture follows a multi-layered approach with clear separation between server and client responsibilities:

- **Server-Side Authentication**: Middleware-based route protection with session validation
- **Client-Side State Management**: AuthProvider context with session synchronization
- **Cache Isolation**: Per-user QueryClient instances preventing data leakage
- **Session Management**: Automatic token refresh and expiry handling
- **Onboarding Integration**: Seamless flow from authentication to profile completion
- **Account Management**: Secure email and password change flows with OTP verification

### Design Patterns
- **SSR-First Approach**: Initial session fetched server-side for optimal hydration
- **Middleware Pattern**: Centralized route protection and authentication checks
- **Provider Pattern**: React context for client-side auth state management
- **Cache Isolation Pattern**: User-scoped query clients for security
- **Server Actions**: Type-safe form handling with Next.js server actions
- **Multi-Step Verification**: Secure account changes through password verification and OTP confirmation

## File Structure
```
src/
  middleware.ts                      # Route protection and auth checks
  app/
    auth/
      actions.ts                     # Server actions for auth operations
      oauth-actions.ts               # OAuth-specific server actions
      callback/route.ts              # OAuth callback handler
      signin/page.tsx                # Sign-in page
      signup/page.tsx                # Sign-up page
      verify/page.tsx                # Email verification page
    dashboard/
      settings/
        actions.ts                   # Account management server actions
        components/
          email-section.tsx          # Email display and change trigger
          password-section.tsx       # Password change dialog component
          change-email-dialog.tsx    # Multi-step email change flow
    onboarding/
      actions.ts                     # Onboarding server actions
      page.tsx                       # Onboarding flow page
  components/
    auth/
      login-form.tsx                 # Login form component
      signup-form.tsx                # Sign-up form component
      oauth-buttons.tsx              # OAuth sign-in buttons
      otp-verification-form.tsx      # OTP verification component
    providers/
      auth-provider.tsx              # Client auth context provider
      providers.tsx                  # Root providers with QueryClient
  lib/
    auth/
      client-auth.ts                 # Client-side auth utilities
    supabase/
      server.ts                      # Server Supabase client
      client.ts                      # Browser Supabase client
    cache/
      cache-utils.ts                 # Cache management utilities
    hooks/
      use-user-profile.ts            # User profile hook
      use-is-admin.ts                # Admin check hook
    utils/
      form-validation.ts             # Form validation utilities
```

## Core Components

### Middleware Protection (`middleware.ts`)
The middleware runs on every request and handles route protection, session validation, and onboarding flow:

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
          // Update both request and response cookies
          cookiesToSet.forEach(({ name, value }) => 
            request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        }
      }
    }
  )
  
  // Get user session
  const { data: { user } } = await supabase.auth.getUser()
  
  // Route categorization
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isOnboardingPage = request.nextUrl.pathname.startsWith('/onboarding')
  const isProtectedPage = request.nextUrl.pathname.startsWith('/subject/') ||
                         request.nextUrl.pathname.startsWith('/dashboard')
  
  // Protection logic with onboarding check
  if (!user && (isProtectedPage || isOnboardingPage)) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
  
  if (user) {
    // Check onboarding status for authenticated users
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .single()
    
    if (!profile?.onboarding_completed && !isOnboardingPage) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }
}
```

### Server-Side Supabase Client (`lib/supabase/server.ts`)
Server-side client with cookie management for SSR:

```typescript
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Server Component cookie handling
          }
        }
      }
    }
  )
}
```

### AuthProvider Component (`components/providers/auth-provider.tsx`)
Client-side authentication state management with session monitoring:

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
          clearAllCache(queryClient)  // Complete cache clear
          setUser(null)
          setSession(null)
          router.push('/')
          break
          
        case 'SIGNED_IN':
          if (userChanged) {
            clearAllCache(queryClient)  // Security: clear cache on user change
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
    const interval = setInterval(checkSessionExpiry, 60000)  // Check every minute
    return () => clearInterval(interval)
  }, [session])
}
```

### ChangeEmailDialog Component (`dashboard/settings/components/change-email-dialog.tsx`)
Multi-step email change flow with password verification and OTP confirmation:

```typescript
export function ChangeEmailDialog({ open, onOpenChange, currentEmail }) {
  const [step, setStep] = useState<'password' | 'email' | 'verification'>('password')
  
  // Step 1: Password verification
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    const result = await verifyPasswordForEmailChange(password)
    if (!result.error) {
      setStep('email')
    }
  }
  
  // Step 2: Request email change (sends OTP)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    const result = await requestEmailChange(newEmail, password)
    if (!result.error) {
      setStep('verification')
      setResendCooldown(60)
    }
  }
  
  // Step 3: Verify OTP for email change
  const handleOtpVerification = async (otpValue: string) => {
    const result = await verifyEmailChangeOtp(newEmail, otpValue)
    if (!result.error) {
      // Refresh session and invalidate cache
      await supabase.auth.refreshSession()
      await invalidateUserCache(queryClient)
      handleClose()
    }
  }
}
```

### PasswordSection Component (`dashboard/settings/components/password-section.tsx`)
Password change dialog with current password verification:

```typescript
export function PasswordSection() {
  const handleSubmit = async (e: React.FormEvent) => {
    const result = await updatePassword(
      currentPassword,
      newPassword,
      confirmPassword
    )
    
    if (!result.error) {
      setSuccess(true)
      // Auto-close after showing success
      setTimeout(() => handleOpenChange(false), 2000)
    }
  }
}
```

## Data Flow

### Authentication Flow
1. **Initial Load**: Server fetches session in `layout.tsx` and passes to providers
2. **Client Hydration**: AuthProvider initializes with server session
3. **Auth State Changes**: Supabase auth listener updates context
4. **Cache Management**: User changes trigger complete cache clear
5. **Session Monitoring**: Periodic checks for session expiry

### Sign-Up Flow
```
User Input → Server Action (signUp) → Supabase Auth → Email Verification
    ↓                                      ↓
Form Validation                    Redirect to /auth/verify
    ↓                                      ↓
Email/Password Extraction           6-digit OTP Input → verifyOtp
                                           ↓
                                    Profile Check → Onboarding/Dashboard
```

### OAuth Flow
```
OAuth Button Click → signInWithGoogle → Supabase OAuth
         ↓                                    ↓
   Set Redirect URL                   Provider Authorization
         ↓                                    ↓
   /auth/callback                     Code Exchange
         ↓                                    ↓
   Profile Creation/Check              Onboarding/Dashboard
```

### Email Change Flow
```
Change Email Button → Password Verification Dialog
         ↓
Password Input → verifyPasswordForEmailChange
         ↓
New Email Input → requestEmailChange → OTP sent
         ↓
6-digit OTP Verification → verifyEmailChangeOtp
         ↓
Session Refresh → Cache Invalidation → UI Update
```

### Password Change Flow
```
Change Password Button → Password Dialog
         ↓
Current Password Verification → signInWithPassword
         ↓
New Password Input & Confirmation
         ↓
updatePassword → Supabase Auth Update
         ↓
Success Message → Auto-close Dialog
```

## Key Functions and Hooks

### Server Actions (`app/auth/actions.ts`)

#### `signUp(formData: FormData)`
Handles new user registration with email verification:
```typescript
export async function signUp(formData: FormData) {
  const { email, password } = extractAuthFormData(formData)
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase.auth.signUp({ email, password })
  
  if (data?.user?.identities?.length === 0) {
    return { error: 'An account with this email already exists' }
  }
  
  redirect(`/auth/verify?email=${encodeURIComponent(email)}`)
}
```

#### `verifyOtp(email: string, token: string)`
Verifies email with 6-digit OTP and checks onboarding status:
```typescript
export async function verifyOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email, token, type: 'email'
  })
  
  if (data?.user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('user_id', data.user.id)
      .single()
    
    if (!profile?.onboarding_completed) {
      redirect('/onboarding')
    }
  }
  redirect('/dashboard/study')
}
```

### Account Management Actions (`app/dashboard/settings/actions.ts`)

#### `verifyPasswordForEmailChange(password: string)`
Verifies user password before allowing email change:
```typescript
export async function verifyPasswordForEmailChange(password: string) {
  const { data: { user } } = await supabase.auth.getUser()
  
  // Verify password by attempting sign in
  const { error } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password,
  })
  
  return error ? { error: 'Incorrect password' } : { success: true }
}
```

#### `requestEmailChange(newEmail: string, password: string)`
Initiates email change and sends OTP to new address:
```typescript
export async function requestEmailChange(newEmail: string, password: string) {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(newEmail)) {
    return { error: 'Please enter a valid email address' }
  }
  
  // Verify password first
  const { error: passwordError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password,
  })
  
  if (passwordError) {
    return { error: 'Incorrect password' }
  }
  
  // Request email change - sends 6-digit OTP
  const { error } = await supabase.auth.updateUser({
    email: newEmail,
  })
  
  return error ? 
    { error: 'Failed to send verification code' } : 
    { success: true, message: 'Verification code sent' }
}
```

#### `verifyEmailChangeOtp(newEmail: string, token: string)`
Completes email change with OTP verification:
```typescript
export async function verifyEmailChangeOtp(newEmail: string, token: string) {
  const { error } = await supabase.auth.verifyOtp({
    email: newEmail,
    token,
    type: 'email_change',
  })
  
  if (error) {
    if (error.message.includes('expired')) {
      return { error: 'Verification code has expired' }
    }
    if (error.message.includes('invalid')) {
      return { error: 'Invalid verification code' }
    }
    return { error: 'Failed to verify code' }
  }
  
  return { 
    success: true,
    message: 'Email successfully changed',
    requiresCacheInvalidation: true
  }
}
```

#### `updatePassword(currentPassword: string, newPassword: string, confirmPassword: string)`
Updates user password with validation:
```typescript
export async function updatePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
) {
  // Validation
  if (newPassword !== confirmPassword) {
    return { error: 'New passwords do not match' }
  }
  
  if (newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters long' }
  }
  
  // Verify current password
  const { error: passwordError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  })
  
  if (passwordError) {
    return { error: 'Current password is incorrect' }
  }
  
  // Update password
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  
  return error ? 
    { error: 'Failed to update password' } : 
    { success: true, message: 'Password updated successfully' }
}
```

### Custom Hooks

#### `useUserProfile()` (`lib/hooks/use-user-profile.ts`)
Fetches and caches user profile with session validation:
```typescript
export function useUserProfile() {
  const { data, isLoading, error } = useQuery({
    queryKey: userId ? queryKeys.user.profile(userId) : ['user-profile-anonymous'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      // Session validation
      if (session?.expires_at && session.expires_at * 1000 < Date.now()) {
        return { user: null, profile: null }
      }
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      return { user: session.user, profile }
    },
    ...CACHE_TIMES.USER_DATA,
    enabled: !!userId
  })
}
```

#### `useIsAdmin()` (`lib/hooks/use-is-admin.ts`)
Checks admin status from user profile:
```typescript
export function useIsAdmin() {
  const { profile, isLoading } = useUserProfile()
  return {
    isAdmin: profile?.is_admin ?? false,
    isLoading
  }
}
```

## Integration Points

### Layout Integration (`app/layout.tsx`)
Root layout fetches initial session for SSR:
```typescript
export default async function RootLayout({ children }) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  return (
    <html>
      <body>
        <Providers initialSession={session}>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

### Provider Integration (`components/providers/providers.tsx`)
Query client isolation per user session:
```typescript
function getQueryClient(userId?: string) {
  const clientKey = userId || 'anonymous'
  
  if (!queryClientMap.has(clientKey)) {
    // Clean up other user clients when creating new one
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

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
NEXT_PUBLIC_SITE_URL=https://yourdomain.com  # For OAuth redirects
```

### Middleware Configuration
```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
}
```

### Cache Configuration (`lib/config/cache.ts`)
```typescript
export const CACHE_TIMES = {
  USER_DATA: {
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime: 10 * 60 * 1000,      // 10 minutes
  }
}
```

## Type Definitions

### User Profile Types (`lib/types/database.ts`)
```typescript
export interface UserProfile {
  id: string
  user_id: string
  name: string
  onboarding_completed: boolean | null
  is_admin: boolean
  created_at: string | null
  updated_at: string | null
}

export interface UserSubject {
  id: string
  user_id: string
  subject_id: string
  created_at: string | null
}
```

### Auth Context Type (`components/providers/auth-provider.tsx`)
```typescript
interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}
```

## Implementation Details

### OAuth Callback Handler (`app/auth/callback/route.ts`)
Handles OAuth provider callbacks with profile creation:
```typescript
export async function GET(request: Request) {
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (data?.user) {
      // Check/create user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', data.user.id)
        .single()
      
      if (!profile) {
        // Create profile for new OAuth users
        await supabase.from('user_profiles').insert({
          user_id: data.user.id,
          onboarding_completed: false
        })
        return NextResponse.redirect(`${origin}/onboarding`)
      }
      
      // Redirect based on onboarding status
      if (!profile.onboarding_completed) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }
      
      return NextResponse.redirect(`${origin}/dashboard/study`)
    }
  }
}
```

### OTP Verification Component (`components/auth/otp-verification-form.tsx`)
6-digit OTP verification with auto-submit and resend functionality:
```typescript
export function OTPVerificationForm() {
  const [otp, setOtp] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  
  // Auto-submit when 6 digits are entered
  const handleOtpComplete = useCallback(async (value: string) => {
    if (value.length === 6) {
      const result = await verifyOtp(email, value)
      if (result?.error) {
        setError(result.error)
        setOtp('')  // Clear on error
      } else {
        setIsSuccess(true)
      }
    }
  }, [email])
  
  // Resend with 60-second cooldown
  const handleResend = async () => {
    const result = await resendOtp(email)
    if (!result?.error) {
      setResendCooldown(60)
      setOtp('')
    }
  }
  
  // InputOTP component for digit entry
  return (
    <InputOTP
      maxLength={6}
      value={otp}
      onChange={handleOtpChange}
      disabled={isVerifying}
    >
      <InputOTPGroup>
        {[0, 1, 2, 3, 4, 5].map(index => (
          <InputOTPSlot 
            key={index} 
            index={index} 
            className={cn(error && "border-destructive")} 
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  )
}
```

### Cache Utilities (`lib/cache/cache-utils.ts`)
Security-focused cache management:
```typescript
export function clearAllCache(queryClient: QueryClient) {
  queryClient.cancelQueries()  // Cancel in-flight queries
  queryClient.clear()           // Clear entire cache
  queryClient.setDefaultOptions({
    queries: { staleTime: 0, gcTime: 0 }
  })
}

export function getUserScopedKey(userId: string, baseKey: string[]) {
  return ['user', userId, ...baseKey]  // User-scoped cache keys
}
```

### Form Validation (`lib/utils/form-validation.ts`)
Type-safe form data extraction:
```typescript
export function extractAuthFormData(formData: FormData): AuthFormData {
  const email = formData.get('email')
  const password = formData.get('password')
  
  if (!email?.includes('@')) {
    throw new Error('Please provide a valid email address')
  }
  
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long')
  }
  
  return { email: email.trim(), password }
}
```

## Dependencies

### External Dependencies
- `@supabase/ssr`: Server-side rendering support for Supabase
- `@supabase/supabase-js`: Supabase JavaScript client
- `@tanstack/react-query`: Data fetching and caching
- `next/navigation`: Next.js navigation utilities

### Internal Dependencies
- Database types from `lib/types/database.ts`
- Cache configuration from `lib/config/cache.ts`
- Query keys from `lib/queries/query-keys.ts`
- UI components from `components/ui/*`

## API Reference

### Authentication Server Actions
- `signUp(formData: FormData)`: Register new user with email/password
- `signIn(formData: FormData)`: Sign in existing user
- `signOut()`: Sign out current user
- `verifyOtp(email: string, token: string)`: Verify 6-digit email OTP
- `resendOtp(email: string)`: Resend verification email with new OTP
- `signInWithGoogle()`: Initiate Google OAuth flow

### Account Management Server Actions
- `verifyPasswordForEmailChange(password: string)`: Verify password before email change
- `requestEmailChange(newEmail: string, password: string)`: Initiate email change with OTP
- `verifyEmailChangeOtp(newEmail: string, token: string)`: Complete email change with OTP
- `resendEmailChangeOtp(newEmail: string)`: Resend OTP for email change
- `updatePassword(currentPassword: string, newPassword: string, confirmPassword: string)`: Change user password
- `updateUserName(name: string)`: Update user profile name

### Client Utilities
- `clientSignOut(queryClient: QueryClient)`: Client-side sign out with cache clear
- `isSessionValid()`: Check if current session is valid
- `getCurrentUserId()`: Get current user ID for cache keying

### Hooks
- `useAuth()`: Access auth context (user, session, signOut)
- `useUserProfile()`: Get user profile with caching
- `useIsAdmin()`: Check admin status

## Database Schema

### Row Level Security (RLS) Policies

#### user_profiles table
- `Users can view own profile`: SELECT where `auth.uid() = user_id`
- `Users can insert own profile`: INSERT where `auth.uid() = user_id`
- `Users can update own profile`: UPDATE where `auth.uid() = user_id`

#### user_subjects table
- `Users can manage own subjects`: ALL where `auth.uid() = user_id`
- `Users can view own subjects`: SELECT where `auth.uid() = user_id`

### Triggers
- `set_updated_at` on user_profiles: Updates `updated_at` timestamp on row changes

### Auth Functions (Supabase Built-in)
- `auth.uid()`: Returns current user's UUID
- `auth.email()`: Returns current user's email
- `auth.role()`: Returns current user's role
- `auth.jwt()`: Returns current JWT token

## Other Notes

### Security Considerations
- **Session Isolation**: Each user gets a separate QueryClient instance to prevent cache leakage between sessions
- **Cookie Security**: Supabase handles secure cookie management with httpOnly and sameSite attributes
- **CSRF Protection**: Built into Supabase Auth with secure token handling
- **RLS Enforcement**: All database access enforces row-level security policies
- **Session Expiry**: Automatic monitoring and cleanup of expired sessions

### Performance Optimizations
- **SSR Session**: Initial session fetched server-side for immediate availability
- **Cache Strategy**: User data cached for 5 minutes, static data for 30 minutes
- **Selective Invalidation**: Only user-specific caches cleared on auth changes
- **Lazy Profile Loading**: Profile only fetched when needed, not on every auth check

### Error Handling
- **Graceful Degradation**: Auth errors don't crash the app, return error objects
- **Retry Logic**: Queries retry once on failure with exponential backoff
- **Session Recovery**: Automatic token refresh on expiry
- **Validation Errors**: Form validation happens before API calls to reduce errors

### Onboarding Integration
The authentication system seamlessly integrates with the onboarding flow:
1. New users are automatically redirected to `/onboarding` after verification
2. Middleware checks `onboarding_completed` flag in user_profiles
3. Incomplete onboarding prevents access to protected routes
4. OAuth users get profiles created automatically with `onboarding_completed: false`

### OTP Verification System
The authentication system uses 6-digit OTP codes for email verification:
1. **Sign-up verification**: New users receive a 6-digit code to verify their email
2. **Email change verification**: Two-step OTP verification (password + OTP to new email)
3. **Auto-submit**: OTP forms automatically submit when 6 digits are entered
4. **Resend cooldown**: 60-second cooldown between OTP resend attempts
5. **Error handling**: OTP fields clear on error for security

### Account Security Features
- **Password verification**: Required before email changes to prevent unauthorized modifications
- **Multi-step email change**: Password verification → New email input → OTP verification
- **Session refresh**: Automatic session refresh after email changes
- **Cache invalidation**: User cache cleared after account changes to ensure UI consistency
- **Password strength**: Minimum 6 characters required for passwords
- **Email validation**: Regex validation for email format before submission

### UI/UX Enhancements
- **Dialog-based flows**: Account changes handled in modal dialogs for better UX
- **Progress indicators**: Clear visual feedback for multi-step processes
- **Success messages**: Confirmation messages with auto-close functionality
- **Error recovery**: Forms retain state on error for easy correction
- **Visual password toggle**: Show/hide password buttons for all password fields

### Known Quirks
- The middleware runs on every request, including static assets (filtered by matcher)
- OAuth callback must handle both new and existing users differently
- Profile creation can fail for OAuth users if database is down (handled gracefully)
- Cache clearing on sign-out is aggressive to ensure complete data isolation
- Session expiry check runs every minute which may impact performance on low-end devices
- OTP verification uses `type: 'email'` for sign-up and `type: 'email_change'` for email changes
- Email change requires password even if user is already authenticated (security measure)
- Resend OTP creates a new code, invalidating the previous one
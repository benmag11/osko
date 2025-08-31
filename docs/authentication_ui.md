# Authentication UI Documentation

## Overview
The authentication UI provides a complete user authentication system with email/password and OAuth (Google) sign-in capabilities. It features OTP email verification, form validation, error handling, and seamless integration with Supabase Auth. The system ensures secure user sessions, automatic profile creation, and proper redirection based on authentication and onboarding status.

## Architecture
The authentication system follows a client-server architecture with Next.js App Router, leveraging Server Actions for form handling and Supabase for backend authentication. The design pattern uses:
- **Server Actions** for secure form submissions without exposing API endpoints
- **Progressive Enhancement** with form submissions working even without JavaScript
- **Optimistic UI** patterns with loading states and immediate feedback
- **Session-based authentication** with secure cookie management
- **Middleware-based route protection** for automatic redirection
- **Cache-aware authentication** with per-user query client isolation

## File Structure
```
src/
├── app/auth/                          # Authentication pages and actions
│   ├── signin/page.tsx                # Sign-in page component
│   ├── signup/page.tsx                # Sign-up page component  
│   ├── verify/page.tsx                # OTP verification page
│   ├── callback/route.ts              # OAuth callback handler
│   ├── actions.ts                     # Server actions for auth operations
│   └── oauth-actions.ts               # OAuth-specific server actions
├── components/auth/                   # Authentication UI components
│   ├── login-form.tsx                 # Login form with validation
│   ├── signup-form.tsx                # Sign-up form with validation
│   ├── oauth-buttons.tsx              # OAuth provider buttons
│   └── otp-verification-form.tsx     # OTP input and verification
├── components/providers/              
│   ├── auth-provider.tsx              # AuthContext provider for session management
│   └── providers.tsx                  # Root providers with per-user QueryClient
├── lib/auth/
│   └── client-auth.ts                 # Client-side auth utilities
├── lib/utils/
│   └── form-validation.ts             # Form data extraction and validation
├── lib/supabase/
│   ├── client.ts                      # Browser Supabase client
│   └── server.ts                      # Server Supabase client
└── middleware.ts                      # Auth middleware for route protection
```

## Core Components

### LoginForm Component
The main sign-in interface that handles both email/password and OAuth authentication.

```tsx
// components/auth/login-form.tsx
export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [error, setError] = useState<string | null>(null)
  
  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await signIn(formData)
    if (result?.error) {
      setError(result.error)
    }
  }
  
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Login with your Google account</CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleSignInButton />
          <form action={handleSubmit}>
            <Input name="email" type="email" required />
            <Input name="password" type="password" required />
            {error && <div className="text-salmon-600">{error}</div>}
            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

### OTP Verification Form
Handles 6-digit OTP verification with auto-submit, resend functionality, and countdown timer.

```tsx
// components/auth/otp-verification-form.tsx
export function OTPVerificationForm() {
  const [otp, setOtp] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  
  // Auto-submit when 6 digits are entered
  const handleOtpComplete = useCallback(async (value: string) => {
    if (value.length === 6) {
      await handleVerify(value)
    }
  }, [email])
  
  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])
  
  return (
    <InputOTP
      maxLength={6}
      value={otp}
      onChange={handleOtpChange}
      disabled={isVerifying}
    >
      <InputOTPGroup>
        {[0,1,2,3,4,5].map(i => (
          <InputOTPSlot 
            key={i} 
            index={i} 
            className={cn(error && "border-destructive")} 
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  )
}
```

### OAuth Buttons
Reusable OAuth authentication buttons with loading states and error handling.

```tsx
// components/auth/oauth-buttons.tsx
export function GoogleSignInButton() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  async function handleGoogleSignIn() {
    setIsPending(true)
    setError(null)
    
    try {
      const result = await signInWithGoogle()
      if (result?.error) {
        setError(result.error)
        setIsPending(false)
      }
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.')
      setIsPending(false)
    }
  }
  
  return (
    <form action={handleGoogleSignIn} className="w-full">
      <Button variant="outline" disabled={isPending}>
        <GoogleIcon />
        {isPending ? 'Redirecting...' : 'Sign in with Google'}
      </Button>
      {error && <p className="text-salmon-600">{error}</p>}
    </form>
  )
}
```

## Data Flow

### Authentication Flow Sequence
1. **User Submission** → Form data collected via native HTML form
2. **Server Action** → Form data validated and processed server-side
3. **Supabase Auth** → Authentication request sent to Supabase
4. **Session Creation** → Session cookies set via SSR
5. **Profile Check** → User profile existence and onboarding status verified
6. **Redirection** → User redirected based on authentication state

### OAuth Flow
```
User clicks OAuth → Server Action initiated → Redirect to provider
→ Provider authentication → Callback to /auth/callback
→ Code exchange for session → Profile creation/check
→ Redirect to dashboard or onboarding
```

### Session Management Flow
```tsx
// components/providers/auth-provider.tsx
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
      case 'TOKEN_REFRESHED':
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
```

## Key Functions and Hooks

### Server Actions

#### signUp Action
Handles user registration with email/password, including validation and OTP sending.

```typescript
// app/auth/actions.ts
export async function signUp(formData: FormData) {
  // Extract and validate form data
  const validated = extractAuthFormData(formData)
  
  // Create user with Supabase
  const { data, error } = await supabase.auth.signUp({
    email: validated.email,
    password: validated.password,
  })
  
  // Check for existing account
  if (data?.user?.identities?.length === 0) {
    return { error: 'An account with this email already exists' }
  }
  
  // Redirect to verification
  redirect(`/auth/verify?email=${encodeURIComponent(email)}`)
}
```

#### verifyOtp Action
Verifies OTP tokens and handles post-verification routing.

```typescript
// app/auth/actions.ts
export async function verifyOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })
  
  // Check onboarding status
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

### Client Hooks

#### useAuth Hook
Provides authentication context throughout the application.

```typescript
// components/providers/auth-provider.tsx
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Returns:
interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}
```

## Integration Points

### Middleware Integration
The authentication system integrates with Next.js middleware for route protection:

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { data: { user } } = await supabase.auth.getUser()
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isProtectedPage = request.nextUrl.pathname.startsWith('/subject/') ||
                          request.nextUrl.pathname.startsWith('/dashboard')
  
  // Redirect unauthenticated users
  if (!user && isProtectedPage) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
  
  // Redirect authenticated users away from auth pages
  if (user && isAuthPage) {
    const userProfile = await getProfile()
    if (!userProfile?.onboarding_completed) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard/study', request.url))
  }
}
```

### Database Integration
Authentication creates and manages user profiles automatically:

```sql
-- user_profiles table structure
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  onboarding_completed boolean DEFAULT false,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Cache Management Integration
Authentication state changes trigger cache clearing for security:

```typescript
// lib/auth/client-auth.ts
export async function clientSignOut(queryClient: QueryClient) {
  // Clear all React Query cache first
  clearAllCache(queryClient)
  
  // Clear client-side Supabase session
  const supabase = createClient()
  await supabase.auth.signOut()
  
  // Force reload to clear in-memory state
  window.location.href = '/'
}
```

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
NEXT_PUBLIC_SITE_URL=https://yourdomain.com  # For OAuth callbacks
```

### Supabase Auth Settings
- **Email Auth**: Enabled with OTP verification
- **OAuth Providers**: Google OAuth configured
- **Session Duration**: Default 1 week
- **JWT Expiry**: 3600 seconds (1 hour)
- **Redirect URLs**: Configured for `/auth/callback`

## Type Definitions

### Authentication Types
```typescript
// Form validation types
interface AuthFormData {
  email: string
  password: string
}

// Auth context types
interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}

// Server action response types
type AuthActionResult = 
  | { error: string }
  | { success: true }
  | void  // For redirects
```

## Implementation Details

### Form Validation Strategy
The validation occurs at multiple levels for security and UX:

1. **HTML5 Validation**: Native `required` and `type="email"` attributes
2. **Server-Side Validation**: `extractAuthFormData` function validates:
   - Email format (contains @)
   - Password length (minimum 6 characters)
   - Field presence and type checking
3. **Supabase Validation**: Additional backend validation

```typescript
// lib/utils/form-validation.ts
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

### Error Handling Patterns
Errors are handled gracefully at each level:

1. **Form Level**: Local state for immediate feedback
2. **Action Level**: Return error objects instead of throwing
3. **UI Level**: Styled error messages with consistent design
4. **Network Level**: Try-catch blocks for resilience

### Security Measures
1. **CSRF Protection**: Built into Supabase Auth
2. **Session Isolation**: Per-user QueryClient instances
3. **Secure Cookies**: httpOnly, secure, sameSite settings
4. **Input Sanitization**: Server-side validation and trimming
5. **Rate Limiting**: OTP resend cooldown (60 seconds)
6. **RLS Policies**: Database-level access control

## Dependencies

### External Dependencies
- `@supabase/ssr`: ^0.5.2 - SSR-compatible Supabase client
- `@supabase/supabase-js`: ^2.47.10 - Core Supabase client
- `@tanstack/react-query`: ^5.62.8 - Server state management
- `next`: 15.1.0 - Framework with App Router

### Internal Dependencies
- `/components/ui/*`: shadcn/ui components (Card, Button, Input)
- `/lib/utils`: Utility functions (cn, form-validation)
- `/lib/supabase/*`: Supabase client configurations
- `/lib/cache/*`: Cache management utilities

## API Reference

### Server Actions API

#### `signUp(formData: FormData)`
Creates a new user account and sends OTP verification email.
- **Parameters**: FormData with `email` and `password` fields
- **Returns**: `{ error: string }` or redirects to `/auth/verify`

#### `signIn(formData: FormData)`
Authenticates existing user with email/password.
- **Parameters**: FormData with `email` and `password` fields
- **Returns**: `{ error: string }` or redirects to `/dashboard/study`

#### `verifyOtp(email: string, token: string)`
Verifies OTP token for email confirmation.
- **Parameters**: `email` string, `token` 6-digit string
- **Returns**: `{ error: string }` or redirects based on onboarding status

#### `resendOtp(email: string)`
Resends OTP verification email.
- **Parameters**: `email` string
- **Returns**: `{ error: string }` or `{ success: true }`

#### `signInWithGoogle()`
Initiates OAuth flow with Google provider.
- **Returns**: `{ error: string }` or redirects to Google OAuth

### Client Utilities API

#### `useAuth()`
React hook for accessing authentication context.
- **Returns**: `{ user, session, isLoading, signOut }`

#### `clientSignOut(queryClient: QueryClient)`
Performs secure client-side sign out with cache clearing.
- **Parameters**: QueryClient instance
- **Effect**: Clears cache and redirects to home

#### `isSessionValid()`
Validates current session status.
- **Returns**: Promise<boolean>

## Other Notes

### Progressive Enhancement
The authentication forms work without JavaScript enabled, using native HTML form submission and Server Actions. This ensures accessibility and reliability even in constrained environments.

### Mobile Responsiveness
All authentication UI components are mobile-first with responsive breakpoints:
- Mobile: Full-width forms with stacked layout
- Desktop: Centered cards with max-width constraints
- Touch-friendly: Large tap targets for buttons and inputs

### Accessibility Features
- Semantic HTML with proper ARIA labels
- Focus management for keyboard navigation
- Error messages associated with form fields
- Loading states announced to screen readers
- High contrast colors for readability

### Performance Optimizations
- Server Actions eliminate API endpoint overhead
- Optimistic UI updates for immediate feedback
- Lazy loading of OAuth provider scripts
- Image optimization for logo assets
- Code splitting at route boundaries

### Future Extensibility
The architecture supports adding:
- Additional OAuth providers (minimal code changes)
- Multi-factor authentication (MFA)
- Magic link authentication
- Passwordless authentication
- Social login providers
- Enterprise SSO integration
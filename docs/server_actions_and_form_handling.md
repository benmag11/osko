# Server Actions & Form Handling Documentation

## Overview
The application uses Next.js 15 Server Actions for secure form handling and mutations, implementing a comprehensive pattern for authentication, onboarding, and admin operations. Server Actions provide type-safe, server-side form processing with built-in CSRF protection, optimistic updates, and progressive enhancement.

## Architecture
The server actions architecture follows a layered approach with clear separation of concerns:
- **Server Actions Layer**: Direct form handlers marked with `'use server'` directive
- **Validation Layer**: Type-safe FormData extraction and validation utilities
- **Database Layer**: Supabase queries with retry logic and error handling
- **Client Components**: Progressive enhancement with React hooks for UX
- **Middleware Layer**: Route-level authentication and onboarding state management

The design prioritizes security, type safety, and user experience through proper error handling, loading states, and graceful degradation.

## File Structure
```
src/
├── app/
│   ├── auth/
│   │   ├── actions.ts              # Core auth server actions
│   │   ├── oauth-actions.ts        # OAuth-specific server actions
│   │   └── callback/route.ts       # OAuth callback handler
│   └── onboarding/
│       ├── actions.ts               # Onboarding server actions
│       ├── onboarding-client.tsx    # Client-side orchestration
│       └── page.tsx                 # Server component entry
├── components/
│   ├── auth/
│   │   ├── login-form.tsx          # Login form component
│   │   ├── signup-form.tsx         # Signup form component
│   │   ├── otp-verification-form.tsx # OTP verification
│   │   └── oauth-buttons.tsx       # OAuth button components
│   └── onboarding/
│       ├── name-step.tsx           # Name collection step
│       └── subject-selection-step.tsx # Subject selection
├── lib/
│   ├── supabase/
│   │   ├── queries.ts              # Database queries with retry
│   │   ├── admin-actions.ts        # Admin-specific actions
│   │   └── server.ts               # Server Supabase client
│   ├── utils/
│   │   ├── form-validation.ts      # Form validation utilities
│   │   └── format-name.ts          # Name formatting helpers
│   └── errors.ts                   # Custom error classes
└── middleware.ts                    # Auth & onboarding middleware
```

## Core Components

### Authentication Actions (`/app/auth/actions.ts`)
The main authentication server actions handle signup, signin, signout, and OTP verification with comprehensive error handling:

```typescript
'use server'

export async function signUp(formData: FormData) {
  let email: string
  let password: string
  
  try {
    const validated = extractAuthFormData(formData)
    email = validated.email
    password = validated.password
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Invalid form data' }
  }
  
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  
  if (error) {
    return { error: error.message }
  }
  
  if (data?.user?.identities?.length === 0) {
    return { error: 'An account with this email already exists' }
  }
  
  // Redirect to verification page with email as query parameter
  redirect(`/auth/verify?email=${encodeURIComponent(email)}`)
}
```

### OAuth Actions (`/app/auth/oauth-actions.ts`)
Handles OAuth authentication flows with proper redirect URL configuration:

```typescript
export async function signInWithGoogle() {
  const supabase = await createServerSupabaseClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  
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
  
  return { error: 'Failed to initiate Google OAuth flow' }
}
```

### Onboarding Actions (`/app/onboarding/actions.ts`)
Complex multi-step onboarding with transaction-like behavior and detailed error codes:

```typescript
export interface OnboardingFormData {
  name: string
  subjectIds: string[]
}

export type ServerActionResult = 
  | { success: true; redirectUrl: string }
  | { success: false; error: string; code?: 'AUTH_ERROR' | 'PROFILE_ERROR' | 'SUBJECTS_ERROR' | 'UNKNOWN_ERROR' }

export async function saveOnboardingData(
  data: OnboardingFormData
): Promise<ServerActionResult> {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { 
      success: false,
      error: 'You must be logged in to complete onboarding.',
      code: 'AUTH_ERROR'
    }
  }

  // Validate input data
  if (!data.name || data.name.trim().length < 1) {
    return {
      success: false,
      error: 'Please enter your name to continue.',
      code: 'PROFILE_ERROR'
    }
  }

  // Start a transaction by performing operations sequentially
  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: user.id,
      name: data.name.trim(),
      onboarding_completed: true,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)

  if (profileError) {
    return { 
      success: false,
      error: 'Failed to save your profile.',
      code: 'PROFILE_ERROR'
    }
  }

  // Save user subjects using the service function
  const result = await saveUserSubjects(user.id, data.subjectIds)
  
  if (!result.success) {
    // Roll back profile update if subjects fail
    await supabase
      .from('user_profiles')
      .update({ onboarding_completed: false })
      .eq('user_id', user.id)
    
    return { 
      success: false,
      error: result.error || 'Failed to save your subjects.',
      code: 'SUBJECTS_ERROR'
    }
  }

  // Revalidate cache
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/study')
  
  return { success: true, redirectUrl: '/dashboard/study' }
}
```

## Data Flow

### Authentication Flow
1. **Form Submission**: User submits credentials via form with `action` prop
2. **Client Validation**: Basic client-side validation for UX
3. **Server Action**: Form data sent to server action
4. **Validation**: `extractAuthFormData` validates and sanitizes input
5. **Database Operation**: Supabase Auth API call with error handling
6. **Response Handling**: 
   - Success: Redirect to appropriate page
   - Error: Return error object for display
7. **Client Update**: Error state displayed or navigation occurs

### Onboarding Flow
1. **Multi-Step Form**: Client component manages step state
2. **Name Collection**: First step validates and stores name locally
3. **Subject Selection**: Complex UI for selecting subjects with levels
4. **Server Submission**: Combined data sent to server action
5. **Transaction Processing**:
   - Create/update user profile
   - Clear existing subjects
   - Insert new subject selections
   - Rollback on failure
6. **Cache Revalidation**: Clear Next.js cache for fresh data
7. **Navigation**: Return redirect URL instead of using `redirect()` to avoid NEXT_REDIRECT errors

## Key Functions and Hooks

### Form Validation (`/lib/utils/form-validation.ts`)
Type-safe FormData extraction with comprehensive validation:

```typescript
export function extractAuthFormData(formData: FormData): AuthFormData {
  const email = formData.get('email')
  const password = formData.get('password')
  
  // Validate email field
  if (!email || typeof email !== 'string') {
    throw new Error('Email is required and must be a string')
  }
  
  if (!email.includes('@')) {
    throw new Error('Please provide a valid email address')
  }
  
  // Validate password field
  if (!password || typeof password !== 'string') {
    throw new Error('Password is required and must be a string')
  }
  
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long')
  }
  
  return {
    email: email.trim(),
    password
  }
}
```

### useFormStatus Hook Integration
Progressive enhancement with loading states:

```typescript
function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Signing in...' : 'Login'}
    </Button>
  )
}
```

### useTransition for Complex Operations
Better UX for multi-step server actions:

```typescript
const [isPending, startTransition] = useTransition()

const handleSubjectsSubmit = (subjectIds: string[]) => {
  startTransition(async () => {
    const result = await saveOnboardingData(updatedFormData)
    
    if (result.success) {
      router.push(result.redirectUrl)
    } else {
      setError(result.error)
      setErrorCode(result.code || null)
      
      // Auto-redirect on auth errors
      if (result.code === 'AUTH_ERROR') {
        setTimeout(() => {
          router.push('/auth/signin')
        }, 3000)
      }
    }
  })
}
```

## Integration Points

### Middleware Integration (`/middleware.ts`)
Route protection and onboarding state enforcement:

```typescript
export async function middleware(request: NextRequest) {
  const { data: { user } } = await supabase.auth.getUser()
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isOnboardingPage = request.nextUrl.pathname.startsWith('/onboarding')
  const isProtectedPage = request.nextUrl.pathname.startsWith('/subject/') ||
                         request.nextUrl.pathname.startsWith('/dashboard')
  
  // Redirect unauthenticated users
  if (!user && (isProtectedPage || isOnboardingPage)) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
  
  // Check onboarding status for authenticated users
  if (user && isProtectedPage && !isOnboardingPage) {
    const userProfile = await getProfile()
    
    if (!userProfile || !userProfile.onboarding_completed) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }
}
```

### Database Query Integration
Server actions integrate with the query layer for database operations:

```typescript
// With retry logic and error handling
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delay = 1000
): Promise<T> {
  let lastError: Error = new Error('Unknown error occurred')
  
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on client errors (4xx)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status
        if (status >= 400 && status < 500) {
          throw error
        }
      }
      
      // Wait before retrying
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }
  
  throw lastError
}
```

### OAuth Callback Handler (`/app/auth/callback/route.ts`)
Handles OAuth redirects with onboarding checks:

```typescript
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  
  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/signin?error=${encodeURIComponent(error_description || error)}`
    )
  }
  
  if (code) {
    const { error: exchangeError, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (data?.user) {
      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', data.user.id)
        .single()
      
      // Create profile if doesn't exist
      if (!profile) {
        await supabase
          .from('user_profiles')
          .insert({
            user_id: data.user.id,
            onboarding_completed: false
          })
        
        return NextResponse.redirect(`${origin}/onboarding`)
      }
      
      // Redirect based on onboarding status
      if (!profile.onboarding_completed) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }
}
```

## Configuration

### Environment Variables
Required for server actions to function:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
NEXT_PUBLIC_SITE_URL=https://example.com  # For OAuth redirects
VERCEL_URL=[auto-set by Vercel]          # Fallback for OAuth
```

### Database Schema
Server actions depend on these core tables:
- `user_profiles`: User profile data with onboarding status
- `user_subjects`: Many-to-many relationship for user subject selections
- `subjects`: Available subjects with levels
- `question_audit_log`: Audit trail for admin actions

### RPC Functions
Complex queries use PostgreSQL functions:
- `search_questions_paginated`: Advanced search with filters
- `get_user_subjects_sorted`: Sorted user subjects with joins
- `get_available_years`: Available years for filtering
- `get_available_question_numbers`: Available question numbers

## Type Definitions

### Server Action Result Types
```typescript
// Generic server action result
export type ServerActionResult = 
  | { success: true; redirectUrl: string }
  | { success: false; error: string; code?: string }

// Form data interfaces
export interface OnboardingFormData {
  name: string
  subjectIds: string[]
}

export interface AuthFormData {
  email: string
  password: string
}

// Update payload for admin actions
export interface QuestionUpdatePayload {
  year?: number
  paper_number?: number | null
  question_number?: number
  question_parts?: string[]
  exam_type?: 'normal' | 'deferred' | 'supplemental'
  topic_ids?: string[]
}
```

## Implementation Details

### Error Handling Patterns
Server actions implement multiple layers of error handling:

1. **Input Validation**: Catch invalid FormData early
2. **Type Guards**: Ensure data types before processing
3. **Database Errors**: Handle Supabase-specific errors
4. **Network Errors**: Retry logic for transient failures
5. **User Feedback**: Structured error responses with codes

### Security Considerations
- **CSRF Protection**: Built into Next.js Server Actions
- **Input Sanitization**: All inputs validated and sanitized
- **Admin Verification**: Role checks before privileged operations
- **Rate Limiting**: Handled by Supabase Auth
- **Session Management**: Server-side session validation

### Performance Optimizations
- **Retry Logic**: Exponential backoff for failed requests
- **Cache Revalidation**: Selective path revalidation
- **Abort Signals**: Request cancellation support
- **Connection Pooling**: Managed by Supabase client
- **Optimistic Updates**: Client-side state updates

### Transaction Management
Complex operations use pseudo-transactions:
```typescript
// 1. Start operation
const { error: step1Error } = await firstOperation()
if (step1Error) return handleError()

// 2. Continue with dependent operation
const { error: step2Error } = await secondOperation()
if (step2Error) {
  // 3. Rollback first operation
  await rollbackFirstOperation()
  return handleError()
}

// 4. Success - revalidate cache
revalidatePath('/affected/path')
```

## Dependencies

### External Libraries
- `@supabase/ssr`: Server-side Supabase client
- `@supabase/supabase-js`: Supabase JavaScript client
- `next/navigation`: Navigation and redirect utilities
- `react-dom`: Form status hooks

### Internal Dependencies
- `/lib/supabase/server`: Server Supabase client factory
- `/lib/supabase/queries`: Database query functions
- `/lib/utils/form-validation`: Form validation utilities
- `/lib/errors`: Custom error classes
- `/lib/types/database`: TypeScript type definitions

## API Reference

### Authentication Actions
```typescript
signUp(formData: FormData): Promise<{ error?: string } | void>
signIn(formData: FormData): Promise<{ error?: string } | void>
signOut(): Promise<void>
verifyOtp(email: string, token: string): Promise<{ error?: string } | void>
resendOtp(email: string): Promise<{ success?: boolean; error?: string }>
signInWithGoogle(): Promise<{ error?: string } | void>
```

### Onboarding Actions
```typescript
saveOnboardingData(data: OnboardingFormData): Promise<ServerActionResult>
checkOnboardingStatus(): Promise<{ completed: boolean; error?: string }>
getUserProfile(): Promise<{ profile?: UserProfile; subjects?: UserSubject[]; error?: string }>
```

### Admin Actions
```typescript
updateQuestionMetadata(questionId: string, updates: QuestionUpdatePayload): Promise<{ success: boolean; error?: string }>
getQuestionAuditLog(questionId: string): Promise<QuestionAuditLog[]>
verifyAdmin(): Promise<boolean>
```

## Other Notes

### NEXT_REDIRECT Error Handling
Next.js 15 throws a special `NEXT_REDIRECT` error when using `redirect()`. This is expected behavior and should be re-thrown:
```typescript
try {
  redirect('/dashboard')
} catch (redirectError) {
  // redirect() throws a NEXT_REDIRECT error which is expected
  throw redirectError
}
```

### Form Action Binding
Forms can bind server actions directly without JavaScript:
```html
<form action={serverAction}>
  <!-- Form fields -->
</form>
```

### Progressive Enhancement
Server actions work without JavaScript enabled, providing baseline functionality. Client-side hooks enhance the experience with loading states and optimistic updates.

### Debugging Server Actions
- Check Network tab for `POST` requests to server actions
- Server action errors appear in server logs, not browser console
- Use `console.error` in server actions for debugging
- Return structured errors for client-side display

### Migration from API Routes
Server actions replace traditional API routes for mutations, providing:
- Better type safety with TypeScript
- Automatic CSRF protection
- Simpler data fetching patterns
- Progressive enhancement support
- Built-in loading states with hooks
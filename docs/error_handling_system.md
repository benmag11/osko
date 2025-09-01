# Error Handling System Documentation

## Overview
The Error Handling System provides a comprehensive, multi-layered approach to error management across the application. It implements retry mechanisms with exponential backoff, custom error classes for type-safe error handling, React error boundaries for UI resilience, and graceful degradation patterns to ensure the application remains functional even when errors occur.

## Architecture
The error handling architecture follows a defense-in-depth approach with multiple layers:
- **Custom Error Classes**: Type-safe error representation with contextual information
- **Retry Mechanisms**: Automatic retry with exponential backoff for transient failures
- **Error Boundaries**: React-level error catching to prevent UI crashes
- **Graceful Degradation**: Fallback values and states when operations fail
- **Form Validation**: Client-side validation with clear error messaging
- **Middleware Protection**: Route-level error handling and redirects

## File Structure
```
src/
├── lib/
│   ├── errors.ts                    # QueryError class definition
│   ├── supabase/
│   │   ├── queries.ts               # Server-side retry wrapper & RPC calls
│   │   ├── client-queries.ts        # Client-side retry wrapper
│   │   └── queries-client.ts        # Client query error handling
│   ├── config/
│   │   └── cache.ts                 # React Query retry configuration
│   └── utils/
│       └── form-validation.ts       # Form validation utilities
├── app/
│   ├── error.tsx                    # Page-level error boundary
│   ├── global-error.tsx             # Application-level error boundary
│   ├── auth/
│   │   └── actions.ts               # Auth server action error handling
│   └── dashboard/
│       └── settings/
│           ├── actions.ts           # Settings server actions with validation
│           └── components/          # Form components with error states
├── components/
│   ├── providers/
│   │   └── providers.tsx            # Query client error configuration
│   ├── questions/
│   │   └── question-list.tsx        # UI error display patterns
│   ├── admin/
│   │   └── question-edit-modal.tsx  # Toast notifications for mutations
│   └── ui/
│       └── sonner.tsx               # Toast notification component
└── middleware.ts                     # Route protection and error redirects
```

## Core Components

### QueryError Class
The custom error class provides structured error information with error codes and additional details:

```typescript
// lib/errors.ts
export class QueryError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'QueryError'
  }
}
```

**Purpose**: Provides consistent error structure across the application with:
- Human-readable error messages
- Machine-readable error codes for programmatic handling
- Optional details object for debugging information
- Proper prototype chain for instanceof checks

### Retry Mechanism Implementation
The retry wrapper implements exponential backoff with configurable retries:

```typescript
// lib/supabase/queries.ts
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
      
      // Wait before retrying (except on last attempt)
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }
  
  throw lastError
}
```

**Key Features**:
- Exponential backoff: delay increases with each retry (delay * (i + 1))
- Smart retry logic: skips retrying for client errors (4xx status codes)
- Configurable retry count and initial delay
- Preserves the last error for debugging

## Data Flow

### Query Error Flow
1. **Query Initiation**: User action triggers a data fetch
2. **Retry Wrapper**: Query wrapped in withRetry function
3. **Error Detection**: Catches database or network errors
4. **Retry Decision**: Determines if error is retryable (non-4xx)
5. **Exponential Backoff**: Waits with increasing delay
6. **Final Resolution**: Returns data or throws QueryError
7. **UI Handling**: Error caught by React Query and displayed

### Server Action Error Flow

#### Authentication Actions
```typescript
// app/auth/actions.ts
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
  
  // Redirect handling with proper error catching
  try {
    redirect(`/auth/verify?email=${encodeURIComponent(email)}`)
  } catch (redirectError) {
    // redirect() throws a NEXT_REDIRECT error which is expected
    throw redirectError
  }
}
```

#### Settings Update Actions
```typescript
// app/dashboard/settings/actions.ts
export async function updateUserName(name: string) {
  // Input validation
  if (!name || name.trim().length === 0) {
    return { error: 'Name cannot be empty' }
  }

  if (name.length > 100) {
    return { error: 'Name must be less than 100 characters' }
  }

  const supabase = await createServerSupabaseClient()
  
  // Authentication check
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { error: 'You must be logged in to update your name' }
  }

  // Database update with error handling
  const { error } = await supabase
    .from('user_profiles')
    .update({ 
      name: name.trim(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)

  if (error) {
    console.error('Failed to update name:', error)
    return { error: 'Failed to update name. Please try again.' }
  }

  revalidatePath('/dashboard/settings')
  return { 
    success: true,
    data: { name: name.trim() }
  }
}
```

## Key Functions and Hooks

### Database Query Functions

#### Standard Query Pattern
```typescript
// lib/supabase/queries.ts
export async function getSubjects(): Promise<Subject[]> {
  return withRetry(async () => {
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name', { ascending: true })
      
    if (error) {
      console.error('Error fetching subjects:', error)
      throw new QueryError(
        'Failed to fetch subjects',
        'SUBJECTS_FETCH_ERROR',
        error
      )
    }
    
    return data as Subject[]
  }).catch(error => {
    // Return empty array as fallback for non-critical errors
    console.error('Failed to fetch subjects after retries:', error)
    return []
  })
}
```

#### Transactional RPC Pattern
```typescript
// lib/supabase/queries.ts
export async function saveUserSubjects(
  userId: string, 
  subjectIds: string[]
): Promise<{ success: boolean; error?: string }> {
  // Input validation
  if (!userId || !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return { success: false, error: 'Invalid user ID' }
  }
  
  return withRetry(async () => {
    const supabase = await createServerSupabaseClient()
    
    // Use atomic RPC function for transactional update
    const { data, error } = await supabase
      .rpc('update_user_subjects', {
        p_user_id: userId,
        p_subject_ids: subjectIds
      })
    
    if (error) {
      console.error('Error updating user subjects:', error)
      throw new QueryError(
        'Failed to update subjects',
        'SUBJECTS_UPDATE_ERROR',
        error
      )
    }
    
    // Verify the response matches expected format
    if (!data || typeof data.success !== 'boolean') {
      throw new QueryError(
        'Invalid response from update_user_subjects',
        'SUBJECTS_UPDATE_INVALID_RESPONSE',
        new Error('Unexpected response format')
      )
    }
    
    return { success: data.success }
  }, 1).catch(error => {
    // For save operations, only retry once
    console.error('Failed to save user subjects after retry:', error)
    return { 
      success: false, 
      error: error.message || 'Failed to save subjects. Please try again.' 
    }
  })
}
```

### Abort Signal Handling
Request cancellation support for better UX:

```typescript
// lib/supabase/client-queries.ts
export async function searchQuestionsClient(
  filters: Filters,
  cursor?: QuestionCursor | null,
  signal?: AbortSignal
): Promise<PaginatedResponse> {
  // Check if the signal is already aborted
  if (signal?.aborted) {
    throw new Error('Request was cancelled')
  }
  
  return withRetry(async () => {
    // Create a promise that will race with the abort signal
    const abortPromise = new Promise<never>((_, reject) => {
      if (signal) {
        signal.addEventListener('abort', () => {
          reject(new Error('Request was cancelled'))
        })
      }
    })
    
    // Race between the RPC call and the abort signal
    const data = await Promise.race([
      supabase.rpc('search_questions_paginated', queryParams),
      abortPromise
    ])
    
    // Error handling...
  })
}
```

## Integration Points

### React Query Configuration
Global error retry configuration for all queries:

```typescript
// lib/config/cache.ts
export const QUERY_CONFIG: QueryClientConfig = {
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 0, // Mutations should not retry automatically
    },
  },
}
```

### Error Boundaries
Application-level error boundary for catastrophic failures:

```typescript
// app/global-error.tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{/* inline styles for reliability */}}>
          <h2>Application Error</h2>
          <p>A critical error occurred. Please refresh the page.</p>
          <button onClick={() => reset()}>
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
```

**Design Decisions**:
- Uses inline styles to ensure rendering even if CSS fails
- Minimal dependencies to reduce failure points
- Provides user-friendly recovery action

### Page-Level Error Boundary
More specific error handling with styled components:

```typescript
// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h2 className="mb-4 text-2xl font-bold">Something went wrong!</h2>
        <p className="mb-6 text-muted-foreground">
          We encountered an unexpected error. Please try again.
        </p>
        <Button onClick={() => reset()} className="mx-auto">
          Try again
        </Button>
      </div>
    </div>
  )
}
```

## Configuration

### Error Code Constants
Standardized error codes used throughout the application:

```typescript
// Error codes used in QueryError
const ERROR_CODES = {
  SUBJECTS_FETCH_ERROR: 'Failed to fetch subjects',
  SUBJECT_FETCH_ERROR: 'Failed to fetch subject',
  TOPICS_FETCH_ERROR: 'Failed to fetch topics',
  YEARS_FETCH_ERROR: 'Failed to fetch available years',
  QUESTION_NUMBERS_FETCH_ERROR: 'Failed to fetch question numbers',
  QUESTIONS_SEARCH_ERROR: 'Failed to search questions',
  USER_SUBJECTS_FETCH_ERROR: 'Failed to fetch user subjects',
  SUBJECTS_CLEAR_ERROR: 'Failed to clear existing subjects',
  SUBJECTS_SAVE_ERROR: 'Failed to save subjects',
  NO_DATA_ERROR: 'No data returned from search'
} as const
```

### Retry Configuration
Different retry strategies for different operation types:

```typescript
// Default retry configuration (queries.ts)
const DEFAULT_RETRIES = 2
const DEFAULT_DELAY = 1000

// Reduced retries for save operations
saveUserSubjects(...).catch(error => {
  // For save operations, only retry once
  return withRetry(fn, 1)
})

// React Query configuration
retry: 1, // Override default retry for auth queries
retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000)
```

## Type Definitions

### Error Response Types
```typescript
// Server action error response
interface ActionResponse {
  error?: string
  success?: boolean
  data?: any
  message?: string
  requiresCacheInvalidation?: boolean
}

// Query error with details
interface QueryErrorDetails {
  message: string
  code: string
  details?: unknown
}

// Supabase error structure
interface SupabaseError {
  message: string
  status?: number
  code?: string
}

// RPC function response
interface RPCResponse {
  success: boolean
  count?: number
  error?: string
}
```

## Implementation Details

### Form Validation and Error Handling

#### Input Validation Utilities
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

#### Multi-Step Form Error Handling
```typescript
// components/change-email-dialog.tsx
export function ChangeEmailDialog({ open, onOpenChange, currentEmail }: Props) {
  const [step, setStep] = useState<Step>('password')
  const [error, setError] = useState<string | null>(null)
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const result = await verifyPasswordForEmailChange(password)
    
    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setStep('email')
      setError(null)
      setIsLoading(false)
    }
  }
  
  const handleOtpVerification = async (otpValue?: string) => {
    const codeToVerify = otpValue || otp
    if (codeToVerify.length !== 6) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await verifyEmailChangeOtp(newEmail, codeToVerify)
      if (result.error) {
        setError(result.error)
        setOtp('') // Clear invalid OTP
      } else {
        // Success handling with session refresh
        const supabase = createClient()
        await supabase.auth.refreshSession()
        await invalidateUserCache(queryClient)
        setEmailChangeSuccess(true)
      }
    } catch {
      setError('An error occurred. Please try again.')
      setOtp('')
    } finally {
      setIsLoading(false)
    }
  }
}
```

#### Password Change Validation
```typescript
// app/dashboard/settings/actions.ts
export async function updatePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
) {
  // Comprehensive validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'All password fields are required' }
  }

  if (newPassword !== confirmPassword) {
    return { error: 'New passwords do not match' }
  }

  if (newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters long' }
  }

  if (currentPassword === newPassword) {
    return { error: 'New password must be different from current password' }
  }

  // Verify current password before update
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

  if (error) {
    console.error('Failed to update password:', error)
    return { error: 'Failed to update password. Please try again.' }
  }

  return { 
    success: true,
    message: 'Password updated successfully'
  }
}
```

### UI Error Display Patterns

#### Component-Level Error Display
```typescript
// components/questions/question-list.tsx
export function QuestionList({ initialData, filters }: QuestionListProps) {
  const { questions, isFetchingNextPage, loadMoreRef, error } = useQuestionsQuery({
    filters,
    initialData,
  })

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-xl text-salmon-600 font-serif">Error loading questions</p>
        <p className="mt-2 text-exam-text-muted">Please try refreshing the page</p>
      </div>
    )
  }
  
  // Component rendering...
}
```

#### Inline Form Error Display
```typescript
// components/settings/name-section.tsx
export function NameSection({ initialName }: NameSectionProps) {
  const [error, setError] = useState<string | null>(null)
  
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    setError(null)

    const result = await updateUserName(name)
    
    if (result.error) {
      setError(result.error)
      setIsSaving(false)
    } else {
      // Success handling with cache invalidation
      if (user?.id) {
        try {
          await queryClient.invalidateQueries({ 
            queryKey: queryKeys.user.profile(user.id) 
          })
        } catch (invalidateError) {
          // Log error but don't fail the save operation
          console.error('Failed to invalidate cache:', invalidateError)
        }
      }
      setIsSaving(false)
    }
  }, [name, queryClient, user?.id])
  
  return (
    <>
      {/* Form fields */}
      {error && (
        <p id="name-error" role="alert" className="mt-2 text-sm text-salmon-600 font-sans animate-in fade-in duration-200">
          {error}
        </p>
      )}
    </>
  )
}
```

#### Toast Notifications for Mutations
```typescript
// components/admin/question-edit-modal.tsx
const updateMutation = useMutation({
  mutationFn: async (data: UpdateData) => {
    // Mutation logic
  },
  onSuccess: () => {
    toast.success('Question updated successfully')
    queryClient.invalidateQueries({ queryKey: ['questions'] })
    router.refresh()
  },
  onError: (error) => {
    toast.error(error.message)
  }
})
```

### Middleware Error Handling
Route-level protection and error redirects:

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { data: { user } } = await supabase.auth.getUser()
  
  const isProtectedPage = request.nextUrl.pathname.startsWith('/subject/') ||
                         request.nextUrl.pathname.startsWith('/dashboard')
  
  // Redirect unauthenticated users trying to access protected pages
  if (!user && isProtectedPage) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
  
  // Profile fetch with error handling
  if (user) {
    const { data } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .single()
    
    if (!data || !data.onboarding_completed) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }
}
```

### Graceful Degradation Patterns
Fallback strategies when operations fail:

```typescript
// Return empty arrays for non-critical list operations
.catch(error => {
  console.error('Failed to fetch subjects after retries:', error)
  return []  // Graceful degradation
})

// Return null for single item fetches
.catch(error => {
  console.error('Failed to fetch subject after retries:', error)
  return null  // Indicate not found
})

// Continue operation despite profile fetch failure
if (profileError) {
  console.error('Failed to fetch user profile:', profileError)
  // Continue to dashboard even if profile fetch fails
}
```

## Dependencies
- **@tanstack/react-query**: Provides retry mechanisms and error handling for async operations
- **@supabase/supabase-js**: Database client with built-in error structures
- **next/navigation**: Next.js routing with redirect error handling
- **sonner**: Toast notifications for user-facing error messages
- **React 19**: Error boundaries and useFormStatus for form error states

## API Reference

### withRetry Function
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,  // Function to retry
  retries?: number,      // Number of retry attempts (default: 2)
  delay?: number         // Initial delay in ms (default: 1000)
): Promise<T>
```

### QueryError Constructor
```typescript
new QueryError(
  message: string,       // Human-readable error message
  code: string,         // Machine-readable error code
  details?: unknown     // Additional error context
)
```

### Error Response Patterns
```typescript
// Server action pattern
return { error: error.message }
return { success: false, error: 'Error message' }

// Query pattern with fallback
return withRetry(queryFn).catch(error => fallbackValue)

// UI error display
if (error) return <ErrorComponent />
```

## Other Notes

### Database Transaction Error Handling
RPC functions provide automatic transaction rollback on errors:
```sql
-- PL/pgSQL function with automatic transaction handling
CREATE FUNCTION update_user_subjects(p_user_id uuid, p_subject_ids uuid[])
RETURNS jsonb AS $$
BEGIN
  -- Transaction boundary is automatic in PL/pgSQL functions
  DELETE FROM user_subjects WHERE user_id = p_user_id;
  
  IF p_subject_ids IS NOT NULL AND array_length(p_subject_ids, 1) > 0 THEN
    INSERT INTO user_subjects (user_id, subject_id)
    SELECT p_user_id, unnest(p_subject_ids);
  END IF;
  
  RETURN jsonb_build_object('success', true, 'count', COALESCE(array_length(p_subject_ids, 1), 0));
  
EXCEPTION
  WHEN OTHERS THEN
    -- Transaction automatically rolls back on any error
    RAISE;  -- Re-raise the error for proper error handling
END;
$$
```

### NEXT_REDIRECT Error Handling
Next.js redirect() function throws a special error that must be re-thrown:
```typescript
try {
  redirect('/dashboard')
} catch (redirectError) {
  // redirect() throws a NEXT_REDIRECT error which is expected
  throw redirectError
}
```

### Session Expiry Handling
The system checks for expired sessions before making requests:
```typescript
if (session.expires_at && session.expires_at * 1000 < Date.now()) {
  console.warn('Session expired, returning null')
  return { user: null, profile: null }
}
```

### Cache Invalidation Error Handling
Cache invalidation errors are logged but don't fail the operation:
```typescript
try {
  await queryClient.invalidateQueries({ 
    queryKey: queryKeys.user.profile(user.id) 
  })
} catch (invalidateError) {
  // Log error but don't fail the save operation
  console.error('Failed to invalidate cache:', invalidateError)
}
```

### OTP Verification Error Patterns
Specific error handling for OTP operations:
```typescript
if (error.message.includes('expired')) {
  return { error: 'Verification code has expired. Please request a new one.' }
}
if (error.message.includes('invalid')) {
  return { error: 'Invalid verification code. Please try again.' }
}
```

### Error Logging Strategy
- Console.error for debugging in development
- Structured error codes for production monitoring
- Error details preserved for debugging while sanitizing user-facing messages
- Transaction errors automatically rolled back at database level

### Performance Considerations
- Retry delays use exponential backoff to prevent server overload
- Abort signals prevent unnecessary network requests
- Query cache prevents redundant error states
- Graceful degradation maintains UI responsiveness
- Reduced retry count (1) for mutation operations

### Security Considerations
- User input validation before processing
- Error messages sanitized to prevent information leakage
- 4xx errors not retried to prevent abuse
- Session validation at multiple layers
- Password verification before sensitive operations
- UUID validation for user IDs
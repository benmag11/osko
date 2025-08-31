# Loading States & UX Documentation

## Overview
The application implements a loading state system built on TanStack Query v5, React Suspense, and custom skeleton components. The architecture prioritizes user experience through optimistic updates, intelligent caching strategies, and graceful error handling, ensuring smooth transitions and minimal perceived latency.

## Architecture
The loading state architecture follows a multi-layered approach combining server-side data fetching, client-side state management, and progressive enhancement patterns. The system uses TanStack Query for server state management with carefully tuned cache configurations, React's built-in loading primitives (Suspense, useTransition), and custom skeleton components for visual feedback. Error boundaries at multiple levels ensure graceful degradation and user-friendly error messages.

## File Structure
```
src/
  components/
    ui/
      skeleton.tsx                 # Base skeleton component with animation
    providers/
      auth-provider.tsx           # Auth loading states management
      providers.tsx               # Query client configuration with cache isolation
    questions/
      question-list.tsx           # Infinite scroll loading implementation
    layout/
      subject-dropdown.tsx        # Dropdown with skeleton loading states
    auth/
      oauth-buttons.tsx           # OAuth authentication loading states
    admin/
      question-edit-modal.tsx     # Mutation loading states example
    onboarding/
      subject-selection-step.tsx  # Form submission loading states
  
  app/
    error.tsx                     # Page-level error boundary
    global-error.tsx              # Global error boundary
    auth/verify/page.tsx          # Suspense implementation example
    dashboard/study/
      page.tsx                    # Server-side loading with parallel fetching
      study-page-client.tsx       # Client component receiving pre-loaded data
  
  lib/
    config/
      cache.ts                    # Cache timing configurations
    errors.ts                     # Custom error class for query errors
    hooks/
      use-questions-query.ts      # Infinite query with loading states
      use-filter-updates.ts       # URL state updates with transitions
      use-user-subjects.ts        # Standard query loading pattern
    supabase/
      queries.ts                  # Server queries with retry logic
      client-queries.ts           # Client queries with abort signals
```

## Core Components

### Skeleton Component
The base skeleton component provides a reusable loading placeholder with pulse animation:

```tsx
// src/components/ui/skeleton.tsx
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-stone-200 animate-pulse rounded-md", className)}
      {...props}
    />
  )
}
```

### Subject Dropdown Loading State
Complex loading implementation with skeleton placeholders for list items:

```tsx
// src/components/layout/subject-dropdown.tsx
{isLoading ? (
  <div className="px-3 py-1 space-y-1.5">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-2.5 py-1">
        <Skeleton className="h-6 w-6 rounded-md" />
        <div className="space-y-0.5 flex-1">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    ))}
  </div>
) : subjects.length === 0 ? (
  <div className="px-3 py-4 text-sm text-warm-text-muted text-center font-sans">
    No subjects enrolled
  </div>
) : (
  // Actual content rendering
)}
```

### Infinite Scroll Loading
Question list implements infinite scrolling with intersection observer:

```tsx
// src/components/questions/question-list.tsx
<div ref={loadMoreRef} className="h-20 mt-8">
  {isFetchingNextPage && (
    <div className="flex justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )}
</div>
```

## Data Flow

### Query State Management
The application uses TanStack Query for server state with specialized configurations:

```tsx
// src/lib/hooks/use-questions-query.ts
const {
  data,
  error,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  status,
  isLoading,
  refetch,
} = useInfiniteQuery({
  queryKey: queryKeys.infinite(filters),
  queryFn: async ({ pageParam, signal }) => {
    return searchQuestionsClient(filters, pageParam, signal)
  },
  initialPageParam: null as QuestionCursor | null,
  getNextPageParam: (lastPage) => lastPage.next_cursor,
  enabled,
  initialData: initialData ? {
    pages: [initialData],
    pageParams: [null],
  } : undefined,
  placeholderData: (previousData) => previousData, // Keep previous data while fetching
})
```

### Authentication Loading States
The AuthProvider manages loading states during authentication flow:

```tsx
// src/components/providers/auth-provider.tsx
const [isLoading, setIsLoading] = useState(!initialSession)

// Initialize auth state
const initializeAuth = async () => {
  try {
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    
    if (currentSession) {
      setUser(currentSession.user)
      setSession(currentSession)
      setPreviousUserId(currentSession.user.id)
    }
  } catch (error) {
    console.error('Error getting initial session:', error)
  } finally {
    setIsLoading(false)
  }
}
```

## Key Functions and Hooks

### useFilterUpdates Hook
Manages URL state updates with loading transitions:

```tsx
// src/lib/hooks/use-filter-updates.ts
export function useFilterUpdates(filters: Filters) {
  const [isPending, startTransition] = useTransition()

  const updateUrl = useCallback((updates: Partial<Filters>) => {
    const newParams = updateSearchParams(searchParams, updates)
    
    startTransition(() => {
      const query = newParams.toString()
      router.push(query ? `${pathname}?${query}` : pathname)
    })
  }, [pathname, router, searchParams])

  return {
    updateUrl,
    isPending,
    // other methods
  }
}
```

### withRetry Wrapper
Implements exponential backoff retry logic for server queries:

```tsx
// src/lib/supabase/queries.ts
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
      
      // Wait before retrying with exponential backoff
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }
  
  throw lastError
}
```

## Integration Points

### Suspense Boundaries
React Suspense provides declarative loading states:

```tsx
// src/app/auth/verify/page.tsx
<Suspense fallback={
  <div className="flex items-center justify-center">
    <div className="text-muted-foreground">Loading...</div>
  </div>
}>
  <VerificationContent />
</Suspense>
```

### Mutation Loading States
Form submissions and data mutations show loading feedback:

```tsx
// src/components/admin/question-edit-modal.tsx
const updateMutation = useMutation({
  mutationFn: async () => {
    // mutation logic
  },
  onSuccess: () => {
    toast.success('Question updated successfully')
    queryClient.invalidateQueries({ queryKey: ['questions'] })
    router.refresh()
    onOpenChange(false)
  },
  onError: (error) => {
    toast.error(error.message)
  }
})

// In UI:
<Button 
  onClick={() => updateMutation.mutate()}
  disabled={updateMutation.isPending}
>
  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
</Button>
```

### OAuth Loading States
Authentication flows provide clear feedback during redirects:

```tsx
// src/components/auth/oauth-buttons.tsx
function OAuthButton({ children, pending, disabled }) {
  return (
    <Button 
      type="submit" 
      variant="outline" 
      className="w-full" 
      disabled={disabled || pending}
    >
      {pending ? 'Redirecting...' : children}
    </Button>
  )
}
```

## Configuration

### Cache Timing Configuration
Differentiated cache strategies based on data volatility:

```tsx
// src/lib/config/cache.ts
export const CACHE_TIMES = {
  // Static reference data that rarely changes
  STATIC_DATA: {
    staleTime: 30 * 60 * 1000,  // 30 minutes
    gcTime: 60 * 60 * 1000,      // 1 hour
  },
  // User-specific data
  USER_DATA: {
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime: 10 * 60 * 1000,      // 10 minutes
  },
  // Frequently changing data
  DYNAMIC_DATA: {
    staleTime: 60 * 1000,        // 1 minute
    gcTime: 5 * 60 * 1000,       // 5 minutes
  },
  // Topics data (semi-static)
  TOPICS: {
    staleTime: 10 * 60 * 1000,   // 10 minutes
    gcTime: 30 * 60 * 1000,      // 30 minutes
  },
  // Questions data
  QUESTIONS: {
    staleTime: 1 * 60 * 1000,    // 1 minute
    gcTime: 10 * 60 * 1000,      // 10 minutes
  },
}
```

### Query Client Configuration
Global query settings with retry and refetch strategies:

```tsx
// src/lib/config/cache.ts
export const QUERY_CONFIG: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: CACHE_TIMES.DYNAMIC_DATA.staleTime,
      gcTime: CACHE_TIMES.DYNAMIC_DATA.gcTime,
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

## Type Definitions

### Loading State Types
Core types for managing loading states:

```tsx
// From various files
interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}

interface UseQuestionsQueryReturn {
  questions: Question[]
  error: Error | null
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  loadMoreRef: RefObject<HTMLDivElement>
  status: QueryStatus
  refetch: () => void
}

interface SubjectDropdownProps {
  subjects: SubjectWithSlug[]
  currentSubject: Subject
  isLoading: boolean
  isMobile?: boolean
}
```

## Implementation Details

### Query Client Isolation
User-specific query clients prevent cache leakage between sessions:

```tsx
// src/components/providers/providers.tsx
function makeQueryClient(userId?: string) {
  const client = new QueryClient({
    ...QUERY_CONFIG,
    defaultOptions: {
      ...QUERY_CONFIG.defaultOptions,
      queries: {
        ...QUERY_CONFIG.defaultOptions?.queries,
        // Disable caching for anonymous users
        staleTime: userId ? QUERY_CONFIG.defaultOptions?.queries?.staleTime : 0,
        gcTime: userId ? QUERY_CONFIG.defaultOptions?.queries?.gcTime : 0,
      },
    },
  })
  
  // Tag the client with user ID for debugging
  if (userId) {
    Object.defineProperty(client, '__userId', {
      value: userId,
      writable: false,
      enumerable: false,
      configurable: true
    })
  }
  
  return client
}
```

### Error Boundary Implementation
Page-level error handling with retry capability:

```tsx
// src/app/error.tsx
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
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

### Global Error Boundary
Root-level error handling with minimal dependencies:

```tsx
// src/app/global-error.tsx
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          minHeight: '100vh',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
              Application Error
            </h2>
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>
              A critical error occurred. Please refresh the page.
            </p>
            <button onClick={() => reset()} style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}>
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
```

### Spinner Animation Pattern
Consistent spinner implementation across the application:

```tsx
// Common spinner pattern used throughout
<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
```

### Skeleton Loading Pattern
Structured skeleton layouts matching actual content:

```tsx
// Pattern for list item skeletons
{[1, 2, 3].map((i) => (
  <div key={i} className="flex items-center gap-2.5 py-1">
    <Skeleton className="h-6 w-6 rounded-md" />
    <div className="space-y-0.5 flex-1">
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
))}
```

## Dependencies

### External Dependencies
- **@tanstack/react-query**: v5 - Server state management with caching
- **react-intersection-observer**: Infinite scroll implementation
- **@supabase/supabase-js**: Database client with built-in retry logic
- **sonner**: Toast notifications for mutation feedback

### Internal Dependencies
- **lib/config/cache**: Centralized cache timing configurations
- **lib/errors**: Custom error classes for better error handling
- **lib/queries/query-keys**: Query key factories for cache management
- **lib/utils**: Utility functions including `cn` for className merging

## API Reference

### useQuestionsQuery Hook
```tsx
interface UseQuestionsQueryOptions {
  filters: Filters
  initialData?: PaginatedResponse
  enabled?: boolean
}

function useQuestionsQuery(options: UseQuestionsQueryOptions): {
  questions: Question[]
  error: Error | null
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  loadMoreRef: RefObject<HTMLDivElement>
  status: QueryStatus
  refetch: () => void
}
```

### withRetry Function
```tsx
async function withRetry<T>(
  fn: () => Promise<T>,
  retries?: number,  // Default: 2
  delay?: number      // Default: 1000ms
): Promise<T>
```

### Skeleton Component
```tsx
function Skeleton({ 
  className, 
  ...props 
}: React.ComponentProps<"div">): JSX.Element
```

## Other Notes

### Performance Optimizations
- **Placeholder Data**: Queries maintain previous data while fetching new results to prevent layout shifts
- **Intersection Observer**: Infinite scroll triggers loading before user reaches the end of the list (100px margin)
- **Optimistic Updates**: Mutations update UI immediately while server operations complete
- **Cache Isolation**: Per-user query clients prevent data leakage between authenticated sessions

### Error Handling Strategies
- **Retry Logic**: Automatic retry with exponential backoff for transient failures
- **4xx Errors**: Client errors (400-499) bypass retry logic and display immediately
- **Error Boundaries**: Multi-level error boundaries ensure graceful degradation
- **User Feedback**: Clear error messages with actionable retry options

### Loading State Best Practices
- **Skeleton Matching**: Loading skeletons match the structure of actual content to minimize layout shift
- **Progressive Enhancement**: Server-side rendering provides initial content before client hydration
- **Loading Indicators**: Consistent visual feedback using spinners for actions and skeletons for content
- **Transition States**: useTransition for non-blocking UI updates during navigation

### Accessibility Considerations
- **ARIA Labels**: Loading spinners include appropriate ARIA labels for screen readers
- **Focus Management**: Error boundaries maintain focus context after retry
- **Loading Announcements**: Critical loading states announced to assistive technologies
- **Keyboard Navigation**: Loading states don't interrupt keyboard navigation flow
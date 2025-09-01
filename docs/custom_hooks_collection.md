# Custom Hooks Collection Documentation

## Overview
The application implements a comprehensive collection of custom React hooks that manage state, data fetching, user authentication, and UI behavior. These hooks follow React best practices and provide clean abstractions for complex functionality, integrating with Supabase for backend operations and TanStack Query for client-side caching.

## Architecture
The hooks architecture follows several key design patterns:
- **Separation of Concerns**: Each hook has a single, well-defined responsibility
- **Type Safety**: Full TypeScript support with proper type inference
- **Error Resilience**: Built-in retry logic and error handling
- **Performance Optimization**: Strategic caching and memoization
- **SSR Compatibility**: Careful handling of browser-only APIs
- **Security**: User-scoped caching to prevent data leakage between sessions

## File Structure
```
src/lib/hooks/
├── use-filter-updates.ts      # URL state management for question filters
├── use-is-admin.ts           # Admin role detection
├── use-mobile.ts             # Responsive design detection
├── use-questions-query.ts    # Infinite scroll question fetching
├── use-safe-timeout.ts       # Memory-safe timeout management
├── use-topics.ts             # Subject topics data fetching
├── use-user-profile.ts       # User profile and authentication state
└── use-user-subjects.ts      # User's enrolled subjects management

src/components/providers/
└── auth-provider.tsx         # Contains useAuth hook for authentication context
```

## Core Components

### useFilterUpdates Hook
Location: `/src/lib/hooks/use-filter-updates.ts`

This hook manages filter state synchronization with URL parameters, enabling shareable filtered views and browser history navigation.

```typescript
export function useFilterUpdates(filters: Filters) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Core URL update function wrapped in transition
  const updateUrl = useCallback((updates: Partial<Filters>) => {
    const newParams = updateSearchParams(searchParams, updates)
    
    startTransition(() => {
      const query = newParams.toString()
      router.push(query ? `${pathname}?${query}` : pathname)
    })
  }, [pathname, router, searchParams])

  return {
    updateUrl,
    addSearchTerm,
    removeSearchTerm,
    toggleTopic,
    toggleYear,
    toggleQuestionNumber,
    clearAllFilters,
    isPending,
  }
}
```

**Key Features:**
- Manages URL state for search terms, topics, years, question numbers, and exam types
- Uses React 18's `useTransition` for non-blocking UI updates
- Provides granular update methods for each filter type
- Supports toggling behavior for multi-select filters

### useIsMobile Hook
Location: `/src/lib/hooks/use-mobile.ts`

Detects mobile viewport with proper SSR handling and responsive updates.

```typescript
const MOBILE_BREAKPOINT = 1024

export function useIsMobile() {
  // Start with undefined to indicate we haven't checked yet
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkMobile = () => {
      return window.innerWidth < MOBILE_BREAKPOINT
    }
    
    setIsMobile(checkMobile())
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }
    
    mql.addEventListener("change", handleChange)
    
    return () => {
      mql.removeEventListener("change", handleChange)
    }
  }, [])

  return isMobile
}
```

**Key Features:**
- Returns `undefined` during SSR and initial hydration
- Uses MediaQueryList API for efficient viewport monitoring
- Breakpoint at 1024px aligns with Tailwind's `lg` breakpoint
- Automatic cleanup of event listeners

### useIsAdmin Hook
Location: `/src/lib/hooks/use-is-admin.ts`

Simple abstraction over user profile to check admin privileges.

```typescript
export function useIsAdmin() {
  const { profile, isLoading } = useUserProfile()
  
  return {
    isAdmin: profile?.is_admin ?? false,
    isLoading,
  }
}
```

**Key Features:**
- Leverages existing user profile cache
- Safe null handling with nullish coalescing
- Returns loading state for UI feedback

### useQuestionsQuery Hook
Location: `/src/lib/hooks/use-questions-query.ts`

Manages infinite scroll pagination for question lists with automatic deduplication.

```typescript
export function useQuestionsQuery({ 
  filters, 
  initialData,
  enabled = true 
}: UseQuestionsQueryOptions) {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

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
    placeholderData: (previousData) => previousData,
  })

  // Flatten and deduplicate questions
  const questions = useMemo(() => {
    if (!data?.pages) return []
    
    const uniqueQuestions = new Map<string, Question>()
    
    data.pages.forEach(page => {
      page.questions.forEach(question => {
        uniqueQuestions.set(question.id, question)
      })
    })
    
    return Array.from(uniqueQuestions.values())
  }, [data?.pages])

  // Auto-fetch on scroll
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  return {
    questions,
    error,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    loadMoreRef: ref,
    status,
    refetch,
  }
}
```

**Key Features:**
- Cursor-based pagination with Supabase RPC function
- Automatic deduplication using Map
- Intersection Observer for scroll-triggered loading
- Abort signal support for request cancellation
- SSR support via initialData parameter

### useSafeTimeout Hook
Location: `/src/lib/hooks/use-safe-timeout.ts`

Manages timeouts with automatic cleanup to prevent memory leaks.

```typescript
export function useSafeTimeout() {
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set())

  const setSafeTimeout = useCallback((callback: () => void, delay: number): NodeJS.Timeout => {
    const timeoutId = setTimeout(() => {
      timeoutsRef.current.delete(timeoutId)
      callback()
    }, delay)
    
    timeoutsRef.current.add(timeoutId)
    return timeoutId
  }, [])

  const clearSafeTimeout = useCallback((timeoutId: NodeJS.Timeout) => {
    clearTimeout(timeoutId)
    timeoutsRef.current.delete(timeoutId)
  }, [])

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current.clear()
  }, [])

  // Cleanup all timeouts on unmount
  useEffect(() => {
    const timeouts = timeoutsRef.current
    return () => {
      timeouts.forEach(clearTimeout)
      timeouts.clear()
    }
  }, [])

  return { setSafeTimeout, clearSafeTimeout, clearAllTimeouts }
}
```

**Key Features:**
- Tracks all active timeouts in a Set
- Automatic cleanup on component unmount
- Manual clear methods for specific or all timeouts
- Self-cleaning after timeout execution

### useTopics Hook
Location: `/src/lib/hooks/use-topics.ts`

Fetches and caches subject topics with optimized cache configuration.

```typescript
export function useTopics(subjectId: string) {
  const { data: topics, isLoading, error } = useQuery({
    queryKey: ['topics', subjectId],
    queryFn: () => getTopics(subjectId),
    ...CACHE_TIMES.TOPICS,
    enabled: !!subjectId
  })
  
  return { topics: topics || [], isLoading, error }
}
```

**Key Features:**
- 10-minute stale time for semi-static data
- 30-minute garbage collection time
- Conditional fetching based on subjectId presence
- Safe fallback to empty array

### useUserProfile Hook
Location: `/src/lib/hooks/use-user-profile.ts`

Manages user authentication state and profile data with session validation.

```typescript
export function useUserProfile(): UseUserProfileReturn {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  
  // Get initial user ID and listen for auth changes
  useEffect(() => {
    const getInitialUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
    }
    getInitialUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
    })
    
    return () => subscription.unsubscribe()
  }, [supabase])
  
  const { data, isLoading, error } = useQuery({
    queryKey: userId ? queryKeys.user.profile(userId) : ['user-profile-anonymous'],
    queryFn: async () => {
      // Validate session before fetching
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        return { user: null, profile: null }
      }
      
      // Check if session is expired
      if (session.expires_at && session.expires_at * 1000 < Date.now()) {
        console.warn('Session expired, returning null')
        return { user: null, profile: null }
      }
      
      const user = session.user
      
      // Get user profile with the validated user ID
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Failed to fetch user profile:', profileError)
        return { user, profile: null }
      }
      
      return { user, profile }
    },
    ...CACHE_TIMES.USER_DATA,
    retry: 1,
    enabled: !!userId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
  
  return {
    user: data?.user ?? null,
    profile: data?.profile ?? null,
    isLoading,
    error: error as Error | null,
  }
}
```

**Key Features:**
- Real-time auth state synchronization
- Session expiry validation
- User-scoped cache keys for security
- Graceful error handling with fallbacks
- 5-minute cache with 10-minute garbage collection
- Automatic refetch on mount, window focus, and network reconnect

### useUser Hook
Location: `/src/lib/hooks/use-user-profile.ts`

Simplified hook to get just the current user without profile data.

```typescript
export function useUser() {
  const { user, isLoading, error } = useUserProfile()
  return { user, isLoading, error }
}
```

**Key Features:**
- Leverages the same cache as `useUserProfile`
- Lightweight alternative when profile data isn't needed
- Maintains consistency with main user profile hook

### useUserSubjects Hook
Location: `/src/lib/hooks/use-user-subjects.ts`

Fetches user's enrolled subjects with slug generation for navigation.

```typescript
export function useUserSubjects(userId: string | undefined): UseUserSubjectsReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: userId ? queryKeys.user.subjects(userId) : ['user-subjects-anonymous'],
    queryFn: async () => {
      if (!userId) {
        return []
      }
      
      // Get user subjects with built-in retry and error handling
      const userSubjects = await getUserSubjectsClient(userId)
      
      // Transform to include slugs for navigation
      return userSubjects.map(userSubject => ({
        ...userSubject.subject,
        slug: generateSlug(userSubject.subject)
      }))
    },
    enabled: !!userId,
    ...CACHE_TIMES.USER_DATA,
    retry: 1,
  })
  
  return {
    subjects: data ?? [],
    isLoading,
    error: error as Error | null,
  }
}
```

**Key Features:**
- Uses Supabase RPC function `get_user_subjects_sorted`
- Automatic slug generation for URL routing
- User-scoped caching
- UUID validation for security

### useAuth Hook
Location: `/src/components/providers/auth-provider.tsx`

Context-based authentication management with cache invalidation.

```typescript
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

The AuthProvider component manages:
- Auth state changes (sign in/out, token refresh)
- Cache clearing on user changes
- Session expiry monitoring
- Secure sign out with full cache clear

## Data Flow

### Filter State Management
1. User interacts with filter UI components
2. Component calls `useFilterUpdates` method (e.g., `toggleTopic`)
3. Hook updates URL parameters via `updateSearchParams` utility
4. URL change triggers re-render with new filters
5. `useQuestionsQuery` fetches data with new filters
6. Results displayed with infinite scroll

### Authentication Flow
1. `AuthProvider` initializes with server-side session
2. Listens for auth state changes via Supabase
3. On user change, clears all cache for security
4. `useUserProfile` fetches profile data with user-scoped key
5. Profile data cached for 5 minutes
6. Session expiry checked every minute

### Data Fetching Pipeline
1. Hook calls Supabase client query function
2. Query function implements retry logic (2 retries, exponential backoff)
3. Abort signal support for cancellation
4. TanStack Query caches result with configured times
5. Cache invalidation on auth changes or manual refetch

## Key Functions and Hooks

### URL State Serialization
The `updateSearchParams` utility serializes filters to URL parameters:
- Arrays joined with commas (e.g., `topics=id1,id2`)
- Numbers preserved as strings
- Empty arrays removed from URL
- Maintains clean, shareable URLs

### Cache Key Generation
Query keys follow a hierarchical structure:
```typescript
// Public data
['questions', 'list', filters, 'infinite']
['topics', subjectId]

// User-scoped data
['user', userId, 'profile']
['user', userId, 'subjects']
```

### Error Handling
All hooks implement consistent error handling:
- `QueryError` class for structured errors
- Retry logic with exponential backoff
- No retry on 4xx client errors
- Graceful fallbacks on failure

## Integration Points

### With Supabase
- Direct client creation via `createClient()`
- RPC function calls: `search_questions_paginated`, `get_user_subjects_sorted`
- Row-level security enforced at database
- Real-time auth state synchronization

### With TanStack Query
- Query client per user for cache isolation
- Configured cache times based on data volatility
- Infinite queries for pagination
- Optimistic updates with `placeholderData`

### With Next.js
- URL state via `useRouter`, `usePathname`, `useSearchParams`
- SSR support with initial data hydration
- React 18 transitions for non-blocking updates
- Middleware-based route protection

## Configuration

### Cache Times (from `/src/lib/config/cache.ts`)
```typescript
STATIC_DATA: {
  staleTime: 30 * 60 * 1000,  // 30 minutes
  gcTime: 60 * 60 * 1000,      // 1 hour
}
USER_DATA: {
  staleTime: 5 * 60 * 1000,   // 5 minutes
  gcTime: 10 * 60 * 1000,      // 10 minutes
}
DYNAMIC_DATA: {
  staleTime: 60 * 1000,        // 1 minute
  gcTime: 5 * 60 * 1000,       // 5 minutes
}
TOPICS: {
  staleTime: 10 * 60 * 1000,   // 10 minutes
  gcTime: 30 * 60 * 1000,      // 30 minutes
}
QUESTIONS: {
  staleTime: 1 * 60 * 1000,    // 1 minute
  gcTime: 10 * 60 * 1000,      // 10 minutes
}
```

### Global Query Configuration
```typescript
QUERY_CONFIG: {
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

### Mobile Breakpoint
- Set at 1024px (Tailwind's `lg` breakpoint)
- Aligns with sidebar collapse behavior
- MediaQuery listener for responsive updates

### Retry Configuration
- Default: 2 retries with exponential backoff
- No retry on 4xx errors
- Delay calculation: `delay * (attemptNumber + 1)`

## Type Definitions

### Core Filter Types
```typescript
interface Filters {
  subjectId: string
  searchTerms?: string[]
  topicIds?: string[]
  years?: number[]
  examTypes?: string[]
  questionNumbers?: number[]
}

interface PaginatedResponse {
  questions: Question[]
  next_cursor: QuestionCursor | null
  total_count?: number
}

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
```

## Implementation Details

### Deduplication in useQuestionsQuery
The hook uses a Map to ensure unique questions:
```typescript
const uniqueQuestions = new Map<string, Question>()
data.pages.forEach(page => {
  page.questions.forEach(question => {
    uniqueQuestions.set(question.id, question)
  })
})
```
This prevents duplicate rendering when pagination boundaries overlap.

### Session Expiry Monitoring
AuthProvider checks session validity every minute:
```typescript
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
```

### Mobile Detection SSR Handling
The hook returns `undefined` during SSR to prevent hydration mismatches:
```typescript
// Component usage
const isMobile = useIsMobile()

// During SSR: isMobile === undefined
// After hydration: isMobile === true/false

// Safe usage pattern
if (isMobile === true) {
  // Mobile-specific logic
} else if (isMobile === false) {
  // Desktop-specific logic
} else {
  // Loading/SSR state
}
```

## Cache Management Utilities

### Cache Utility Functions
Location: `/src/lib/cache/cache-utils.ts`

Provides centralized cache management functions for React Query, ensuring proper cache isolation and cleanup.

```typescript
// Invalidate all user-specific cached data
export async function invalidateUserCache(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: ['user'] })
  await queryClient.invalidateQueries({ queryKey: ['user-profile-anonymous'] })
  queryClient.removeQueries({ queryKey: ['user'] })
  queryClient.removeQueries({ queryKey: ['user-profile-anonymous'] })
}

// Complete cache clear on sign-out
export function clearAllCache(queryClient: QueryClient) {
  queryClient.cancelQueries()
  queryClient.clear()
  queryClient.setDefaultOptions({
    queries: {
      staleTime: 0,
      gcTime: 0,
    },
  })
}

// Selective cache invalidation by pattern
export async function invalidateCacheByPattern(
  queryClient: QueryClient,
  pattern: string | string[]
) {
  const patterns = Array.isArray(pattern) ? pattern : [pattern]
  for (const p of patterns) {
    await queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey as string[]
        return key.some(k => typeof k === 'string' && k.includes(p))
      },
    })
  }
}

// Get cache statistics for monitoring
export function getCacheStats(queryClient: QueryClient) {
  const cache = queryClient.getQueryCache()
  const queries = cache.getAll()
  
  return {
    totalQueries: queries.length,
    staleQueries: queries.filter(q => q.isStale()).length,
    activeQueries: queries.filter(q => q.isActive()).length,
    inactiveQueries: queries.filter(q => !q.isActive()).length,
    fetchingQueries: queries.filter(q => q.state.fetchStatus === 'fetching').length,
  }
}
```

**Key Features:**
- User-scoped cache invalidation for security
- Complete cache clearing on sign-out
- Pattern-based selective invalidation
- Cache statistics for monitoring and debugging
- Query cancellation to prevent race conditions

### Cache Usage in Settings

The settings functionality demonstrates sophisticated cache management:

1. **Name Updates** (`/src/app/dashboard/settings/components/name-section.tsx`):
   - Invalidates user profile cache after successful name update
   - Updates sidebar and other components automatically
   - Uses `queryKeys.user.profile(userId)` for targeted invalidation

2. **Subject Updates** (`/src/app/dashboard/settings/actions.ts`):
   - Server-side revalidation using `revalidatePath`
   - Invalidates multiple paths: `/dashboard/settings`, `/dashboard`, `/dashboard/study`
   - Ensures consistency across all views showing user subjects

3. **Auth State Changes** (`/src/components/providers/auth-provider.tsx`):
   - Different cache strategies based on auth event type:
     - `SIGNED_OUT`: Complete cache clear via `clearAllCache`
     - `SIGNED_IN`/`TOKEN_REFRESHED`: Clear all if user changed
     - `USER_UPDATED`: Selective invalidation via `invalidateUserCache`
   - Prevents data leakage between user sessions

## Dependencies

### External Dependencies
- `@tanstack/react-query`: v5 for data fetching and caching
- `@supabase/supabase-js`: Database and auth client
- `react-intersection-observer`: Infinite scroll detection
- `next/navigation`: URL state management

### Internal Dependencies
- `/lib/supabase/client`: Supabase client creation
- `/lib/supabase/queries`: Server-side query functions
- `/lib/supabase/client-queries`: Client-side query functions
- `/lib/utils/url-filters`: URL parameter serialization
- `/lib/utils/slug`: Slug generation for subjects
- `/lib/types/database`: TypeScript type definitions
- `/lib/config/cache`: Cache configuration constants
- `/lib/queries/query-keys`: Query key factory functions
- `/lib/errors`: Custom error classes
- `/lib/cache/cache-utils`: Cache management utilities

## API Reference

### useFilterUpdates
```typescript
function useFilterUpdates(filters: Filters): {
  updateUrl: (updates: Partial<Filters>) => void
  addSearchTerm: (term: string) => void
  removeSearchTerm: (term: string) => void
  toggleTopic: (topicId: string) => void
  toggleYear: (year: number) => void
  toggleQuestionNumber: (questionNumber: number) => void
  clearAllFilters: () => void
  isPending: boolean
}
```

### useIsMobile
```typescript
function useIsMobile(): boolean | undefined
```

### useIsAdmin
```typescript
function useIsAdmin(): {
  isAdmin: boolean
  isLoading: boolean
}
```

### useQuestionsQuery
```typescript
function useQuestionsQuery(options: {
  filters: Filters
  initialData?: PaginatedResponse
  enabled?: boolean
}): {
  questions: Question[]
  error: Error | null
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean | undefined
  loadMoreRef: (node?: Element | null) => void
  status: QueryStatus
  refetch: () => void
}
```

### useSafeTimeout
```typescript
function useSafeTimeout(): {
  setSafeTimeout: (callback: () => void, delay: number) => NodeJS.Timeout
  clearSafeTimeout: (timeoutId: NodeJS.Timeout) => void
  clearAllTimeouts: () => void
}
```

### useTopics
```typescript
function useTopics(subjectId: string): {
  topics: Topic[]
  isLoading: boolean
  error: Error | null
}
```

### useUserProfile
```typescript
function useUserProfile(): {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  error: Error | null
}
```

### useUser
```typescript
function useUser(): {
  user: User | null
  isLoading: boolean
  error: Error | null
}
```

### useUserSubjects
```typescript
function useUserSubjects(userId: string | undefined): {
  subjects: SubjectWithSlug[]
  isLoading: boolean
  error: Error | null
}
```

### useAuth
```typescript
function useAuth(): {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}
```

### Cache Utility Functions

#### invalidateUserCache
```typescript
function invalidateUserCache(queryClient: QueryClient): Promise<void>
```
Invalidates all user-specific cached data and removes queries from cache.

#### clearAllCache
```typescript
function clearAllCache(queryClient: QueryClient): void
```
Completely clears all cached data, cancels queries, and resets default options.

#### invalidateCacheByPattern
```typescript
function invalidateCacheByPattern(
  queryClient: QueryClient,
  pattern: string | string[]
): Promise<void>
```
Invalidates cache entries matching specific patterns.

#### getCacheStats
```typescript
function getCacheStats(queryClient: QueryClient): {
  totalQueries: number
  staleQueries: number
  activeQueries: number
  inactiveQueries: number
  fetchingQueries: number
}
```
Returns statistics about the current cache state for monitoring.

#### resetQueryClient
```typescript
function resetQueryClient(queryClient: QueryClient): void
```
Resets the query client to initial state by canceling queries, clearing cache, and unmounting.

#### getUserScopedKey
```typescript
function getUserScopedKey(userId: string, baseKey: string[]): string[]
```
Creates user-scoped cache keys to ensure cache isolation between different users.

## Other Notes

### Performance Considerations
- Hooks use memoization to prevent unnecessary recalculations
- Query keys are carefully structured for optimal cache hits
- Infinite scroll uses intersection observer instead of scroll events
- URL updates wrapped in React transitions for non-blocking UI

### Security Best Practices
- User-scoped cache keys prevent data leakage between sessions
- UUID validation before database queries
- Session expiry checks prevent stale authentication
- Complete cache clearing on user changes

### Common Usage Patterns
```typescript
// Filter management in a component
const { toggleTopic, isPending } = useFilterUpdates(filters)

// Mobile-responsive rendering
const isMobile = useIsMobile()
const sidebarOpen = isMobile === true ? mobileOpen : desktopOpen

// Admin-only features
const { isAdmin, isLoading } = useIsAdmin()
if (isAdmin) {
  // Show admin controls
}

// Infinite scroll implementation
const { questions, loadMoreRef, hasNextPage } = useQuestionsQuery({ filters })
// Attach loadMoreRef to a sentinel element
```

### Error Recovery
All hooks implement graceful error recovery:
- Return empty arrays/null on fetch failure
- Maintain previous data during refetch
- Log errors for debugging
- User-friendly error boundaries in UI

### Testing Considerations
When testing components using these hooks:
- Mock Supabase client for predictable responses
- Provide initial data for SSR testing
- Test undefined state for mobile detection
- Verify cache key generation for isolation
- Test error states and retry behavior
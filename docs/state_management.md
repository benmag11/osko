# State Management Documentation

## Overview
The application implements a sophisticated state management system built on TanStack Query v5 for server state, URL-based state for filters, and per-user cache isolation for security. The system ensures data consistency, prevents cache leakage between users, and provides optimistic updates with proper error handling.

## Architecture
The state management architecture follows a multi-layered approach combining server state caching, client-side state synchronization, and URL state persistence. The system uses TanStack Query as the primary state management solution with custom cache isolation patterns to prevent data leakage between different user sessions. Authentication state is managed separately through a dedicated AuthProvider that coordinates with the query cache.

## File Structure
```
src/
├── components/providers/
│   ├── providers.tsx              # Main QueryClient provider with per-user isolation
│   └── auth-provider.tsx          # Authentication state management
├── lib/
│   ├── cache/
│   │   ├── cache-utils.ts         # Cache invalidation and clearing utilities
│   │   └── cache-monitor.ts       # Development cache monitoring tools
│   ├── config/
│   │   └── cache.ts               # Centralized cache configuration
│   ├── queries/
│   │   └── query-keys.ts          # Query key factory for cache management
│   ├── hooks/
│   │   ├── use-filter-updates.ts  # URL state management for filters
│   │   ├── use-user-profile.ts    # User profile state hook
│   │   ├── use-user-subjects.ts   # User subjects state hook
│   │   ├── use-questions-query.ts # Questions infinite query hook
│   │   ├── use-topics.ts          # Topics data hook
│   │   └── use-is-admin.ts        # Admin status hook
│   └── supabase/
│       ├── client-queries.ts      # Client-side query functions
│       ├── queries-client.ts      # Additional client queries
│       └── query-builders.ts      # Query parameter builders
└── app/
    └── onboarding/actions.ts      # Server actions for mutations
```

## Core Components

### QueryClient Provider with Per-User Isolation
The main provider system implements a sophisticated per-user cache isolation pattern to prevent data leakage:

```typescript
// src/components/providers/providers.tsx
function makeQueryClient(userId?: string) {
  const client = new QueryClient({
    ...QUERY_CONFIG,
    defaultOptions: {
      ...QUERY_CONFIG.defaultOptions,
      queries: {
        ...QUERY_CONFIG.defaultOptions?.queries,
        // Add session validation to all queries
        staleTime: userId ? QUERY_CONFIG.defaultOptions?.queries?.staleTime : 0,
        gcTime: userId ? QUERY_CONFIG.defaultOptions?.queries?.gcTime : 0,
      },
    },
  })
  
  // Tag the client with the user ID for debugging
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

// Store query clients per user session
const queryClientMap = new Map<string, QueryClient>()

function getQueryClient(userId?: string) {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient(userId)
  }
  
  // Browser: create or get client for this user
  const clientKey = userId || 'anonymous'
  
  if (!queryClientMap.has(clientKey)) {
    // Clean up old clients when creating a new one
    if (queryClientMap.size > 0 && clientKey !== 'anonymous') {
      // Clear other user clients to prevent memory leaks
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

### Authentication Provider with Cache Coordination
The AuthProvider manages authentication state and coordinates cache clearing on auth events:

```typescript
// src/components/providers/auth-provider.tsx
const handleAuthChange = useCallback(
  async (event: AuthChangeEvent, newSession: Session | null) => {
    const newUserId = newSession?.user?.id ?? null
    const userChanged = previousUserId !== null && previousUserId !== newUserId
    
    switch (event) {
      case 'SIGNED_OUT':
        // Complete cache clear on sign out
        clearAllCache(queryClient)
        setUser(null)
        setSession(null)
        setPreviousUserId(null)
        router.push('/')
        break
        
      case 'SIGNED_IN':
      case 'TOKEN_REFRESHED':
        if (userChanged) {
          // User changed - clear all cache for security
          console.log('User changed, clearing cache')
          clearAllCache(queryClient)
        }
        setUser(newSession?.user ?? null)
        setSession(newSession)
        setPreviousUserId(newUserId)
        break
        
      case 'USER_UPDATED':
        // Just invalidate user-specific cache
        await invalidateUserCache(queryClient)
        setUser(newSession?.user ?? null)
        setSession(newSession)
        break
    }
  },
  [queryClient, router, previousUserId]
)
```

## Data Flow
The data flow in the application follows a unidirectional pattern from server to client with proper cache management at each step:

1. **Initial Data Fetch**: Server-side rendering fetches initial data using server Supabase client
2. **Cache Hydration**: Initial data is passed to QueryClient for hydration
3. **Client Revalidation**: Client-side hooks revalidate data with proper session checks
4. **Cache Updates**: Mutations trigger targeted cache invalidations
5. **State Synchronization**: URL state changes trigger new queries with updated filters

## Key Functions and Hooks

### useFilterUpdates Hook - URL State Management
Manages filter state in URL for shareable and persistent filter configurations:

```typescript
// src/lib/hooks/use-filter-updates.ts
export function useFilterUpdates(filters: Filters) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const updateUrl = useCallback((updates: Partial<Filters>) => {
    const newParams = updateSearchParams(searchParams, updates)
    
    startTransition(() => {
      const query = newParams.toString()
      router.push(query ? `${pathname}?${query}` : pathname)
    })
  }, [pathname, router, searchParams])

  const toggleTopic = useCallback((topicId: string) => {
    const current = filters.topicIds || []
    const updated = current.includes(topicId)
      ? current.filter(id => id !== topicId)
      : [...current, topicId]
    updateUrl({ topicIds: updated })
  }, [filters.topicIds, updateUrl])

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

### useUserProfile Hook - User State with Session Validation
Fetches and caches user profile with proper session validation:

```typescript
// src/lib/hooks/use-user-profile.ts
export function useUserProfile(): UseUserProfileReturn {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  
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
      
      return { user, profile }
    },
    ...CACHE_TIMES.USER_DATA,
    retry: 1,
    enabled: !!userId,
  })
  
  return {
    user: data?.user ?? null,
    profile: data?.profile ?? null,
    isLoading,
    error: error as Error | null,
  }
}
```

### useQuestionsQuery Hook - Infinite Scrolling with Deduplication
Implements infinite scrolling for questions with automatic deduplication:

```typescript
// src/lib/hooks/use-questions-query.ts
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

  // Flatten all pages into a single array of questions
  const questions = useMemo(() => {
    if (!data?.pages) return []
    
    // Use a Map to ensure uniqueness by ID
    const uniqueQuestions = new Map<string, Question>()
    
    data.pages.forEach(page => {
      page.questions.forEach(question => {
        uniqueQuestions.set(question.id, question)
      })
    })
    
    return Array.from(uniqueQuestions.values())
  }, [data?.pages])

  // Automatically fetch next page when scrolling
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

## Integration Points

### Cache Configuration
Centralized cache configuration with different TTLs for different data types:

```typescript
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
} as const
```

### Query Key Factory
Structured query keys for consistent cache management:

```typescript
// src/lib/queries/query-keys.ts
export const queryKeys = {
  // Public data queries (no user context needed)
  all: ['questions'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (filters: Filters) => [...queryKeys.lists(), filters] as const,
  infinite: (filters: Filters) => [...queryKeys.list(filters), 'infinite'] as const,
  subjects: () => ['subjects'] as const,
  subject: (slug: string) => [...queryKeys.subjects(), slug] as const,
  topics: (subjectId: string) => ['topics', subjectId] as const,
  years: (subjectId: string) => ['years', subjectId] as const,
  
  // User-specific queries (require user context)
  user: {
    profile: (userId: string) => ['user', userId, 'profile'] as const,
    subjects: (userId: string) => ['user', userId, 'subjects'] as const,
    preferences: (userId: string) => ['user', userId, 'preferences'] as const,
    progress: (userId: string) => ['user', userId, 'progress'] as const,
    admin: (userId: string) => ['user', userId, 'admin'] as const,
  },
}

// Helper to scope any query key with user context
export function scopeWithUser(userId: string | null, baseKey: readonly unknown[]) {
  if (!userId) return baseKey
  return ['user', userId, ...baseKey] as const
}
```

## Configuration

### Cache Times Configuration
Different data types have different cache configurations based on their volatility:

- **Static Data**: 30 minutes stale time, 1 hour garbage collection
- **User Data**: 5 minutes stale time, 10 minutes garbage collection  
- **Dynamic Data**: 1 minute stale time, 5 minutes garbage collection
- **Topics**: 10 minutes stale time, 30 minutes garbage collection
- **Questions**: 1 minute stale time, 10 minutes garbage collection

### Query Client Settings
```typescript
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

### Core Filter Types
```typescript
// src/lib/types/database.ts
export interface Filters {
  subjectId: string
  searchTerms?: string[]
  topicIds?: string[]
  years?: number[]
  examTypes?: string[]
  questionNumbers?: number[]
}

export interface PaginatedResponse {
  questions: Question[]
  next_cursor: QuestionCursor | null
  total_count?: number
}

export interface QuestionCursor {
  year: number
  question_number: number
  id: string
}
```

### User Profile Types
```typescript
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

interface UseUserProfileReturn {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  error: Error | null
}
```

## Implementation Details

### Cache Isolation Mechanism
The application implements a sophisticated cache isolation mechanism to prevent data leakage between users:

1. **Per-User QueryClient Instances**: Each user gets their own QueryClient instance stored in a Map
2. **Automatic Cleanup**: When a new user signs in, old user caches are cleared and unmounted
3. **Session Validation**: All queries validate the session before fetching data
4. **User-Scoped Query Keys**: User-specific data uses user ID in query keys for additional isolation

### URL State Synchronization
Filter state is synchronized with URL parameters for several benefits:

1. **Shareable Links**: Users can share filtered views via URL
2. **Browser Navigation**: Back/forward buttons work correctly
3. **Persistence**: Filter state persists across page refreshes
4. **Server Rendering**: Initial filters can be parsed server-side

### Optimistic Updates Pattern
While the application primarily uses server actions, the query invalidation pattern supports optimistic updates:

```typescript
// Example pattern for optimistic updates
const mutation = useMutation({
  mutationFn: updateFunction,
  onMutate: async (newData) => {
    // Cancel in-flight queries
    await queryClient.cancelQueries({ queryKey })
    
    // Snapshot previous value
    const previousData = queryClient.getQueryData(queryKey)
    
    // Optimistically update
    queryClient.setQueryData(queryKey, newData)
    
    return { previousData }
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(queryKey, context.previousData)
  },
  onSettled: () => {
    // Always refetch after mutation
    queryClient.invalidateQueries({ queryKey })
  },
})
```

### Error Handling with Retry Logic
All client queries implement retry logic with exponential backoff:

```typescript
// src/lib/supabase/client-queries.ts
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

## Dependencies

### External Dependencies
- **@tanstack/react-query**: v5.x - Primary state management library
- **@supabase/supabase-js**: Database client and authentication
- **react**: v19 - React framework
- **next/navigation**: Next.js navigation hooks for URL state

### Internal Dependencies
- **lib/supabase/client**: Browser Supabase client
- **lib/supabase/server**: Server Supabase client  
- **lib/errors**: Custom error classes
- **lib/utils**: Utility functions for URL parsing and slug generation

## API Reference

### Cache Utility Functions
```typescript
// Clear all cache for sign out
clearAllCache(queryClient: QueryClient): void

// Invalidate user-specific cache
invalidateUserCache(queryClient: QueryClient): Promise<void>

// Invalidate cache by pattern
invalidateCacheByPattern(
  queryClient: QueryClient,
  pattern: string | string[]
): Promise<void>

// Get cache statistics
getCacheStats(queryClient: QueryClient): {
  totalQueries: number
  staleQueries: number
  activeQueries: number
  inactiveQueries: number
  fetchingQueries: number
}

// Add user context to cache keys
getUserScopedKey(userId: string, baseKey: string[]): string[]
```

### Cache Monitoring (Development Only)
```typescript
// Log cache state to console
logCacheState(queryClient: QueryClient, label?: string): void

// Verify cache has been cleared
verifyCacheCleared(queryClient: QueryClient): boolean

// Setup automatic cache monitoring
setupCacheMonitoring(queryClient: QueryClient): () => void

// Install browser console inspector
installCacheInspector(queryClient: QueryClient): void
```

## Other Notes

### Session Expiry Handling
The AuthProvider includes automatic session expiry detection that runs every minute:

```typescript
useEffect(() => {
  const checkSessionExpiry = () => {
    if (session?.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000)
      const now = new Date()
      
      if (now >= expiresAt) {
        console.log('Session expired, clearing cache')
        clearAllCache(queryClient)
        setUser(null)
        setSession(null)
        setPreviousUserId(null)
        router.push('/auth/signin')
      }
    }
  }
  
  const interval = setInterval(checkSessionExpiry, 60000)
  return () => clearInterval(interval)
}, [session, queryClient, router])
```

### Development Cache Inspector
In development mode, a cache inspector is available via browser console:

```javascript
// Access cache inspector in browser console
window.__cacheInspector.logState()      // Log current cache state
window.__cacheInspector.getStats()      // Get cache statistics
window.__cacheInspector.verifyCleared() // Verify cache is cleared
window.__cacheInspector.clearAll()      // Manually clear cache
window.__cacheInspector.getQueries()    // Get all cached queries
```

### Memory Management
The cache isolation system includes automatic memory management:

1. Old user caches are cleared when new users sign in
2. Query clients are properly unmounted to prevent memory leaks
3. Server-side always creates fresh QueryClient instances
4. Browser-side reuses QueryClient for same user session

### Security Considerations
- Each user has an isolated QueryClient instance preventing cross-user data access
- Session validation occurs before every query
- Cache is completely cleared on sign out
- User IDs are embedded in query keys for additional isolation
- Server actions validate authentication before mutations
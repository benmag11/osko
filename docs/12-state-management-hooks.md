# State Management & Custom Hooks Documentation

## Overview
This application implements a sophisticated state management system built on TanStack Query (React Query) v5 for server state, URL state for filters, and React Context for authentication. The architecture emphasizes security through user-scoped cache isolation, performance through intelligent caching strategies, and developer experience through custom hooks that encapsulate complex logic.

## Architecture

The state management system follows a multi-layered approach:

1. **Server State**: Managed by TanStack Query with user-scoped cache isolation
2. **URL State**: Filter parameters persisted in URL for shareable views
3. **Authentication State**: React Context with Supabase integration
4. **Local State**: Component-level state for UI interactions

The key architectural decision is the complete isolation of cache per user session to prevent data leakage between users. Each user gets their own QueryClient instance, and all cache keys are scoped with user IDs.

## File Structure

```
src/
  components/
    providers/
      providers.tsx          # Main provider wrapper with QueryClient management
      auth-provider.tsx      # Authentication context and session management
      zoom-provider.tsx      # Zoom context and state management
  lib/
    hooks/
      use-audit-history.ts   # Audit log fetching for questions
      use-filter-updates.ts  # URL state management for filters
      use-is-admin.ts        # Admin role detection
      use-mobile.ts          # Mobile device detection
      use-questions-query.ts # Infinite scrolling questions
      use-safe-timeout.ts    # Memory-safe timeout management
      use-session-storage.ts # Generic sessionStorage with type safety
      use-topics.ts          # Subject topics fetching
      use-user-profile.ts    # User profile and authentication
      use-user-subjects.ts   # User's enrolled subjects
    queries/
      query-keys.ts          # Centralized query key factory
    config/
      cache.ts               # Cache timing configuration
    cache/
      cache-utils.ts         # Cache invalidation utilities
    utils/
      url-filters.ts         # URL parameter serialization
```

## Core Components

### Providers Component

The main provider orchestrates QueryClient lifecycle and user session isolation:

```typescript
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
  
  // Tag client with user ID for debugging
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

The provider maintains a Map of QueryClients per user and handles cleanup when users change:

```typescript
const queryClientMap = new Map<string, QueryClient>()

function getQueryClient(userId?: string) {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient(userId)
  }
  
  const clientKey = userId || 'anonymous'
  
  if (!queryClientMap.has(clientKey)) {
    // Clean up old clients when creating a new one
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

### AuthProvider Component

Manages authentication state and handles session lifecycle:

```typescript
// src/components/providers/auth-provider.tsx
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
    }
  },
  [queryClient, router, previousUserId]
)
```

## Data Flow

### Query Lifecycle
1. Component uses custom hook (e.g., `useUserProfile`)
2. Hook calls TanStack Query with user-scoped key
3. Query function fetches from Supabase with retry logic
4. Result cached with configured TTL
5. Cache invalidated on auth changes or manual triggers

### Filter State Flow
1. User interacts with filter UI
2. `useFilterUpdates` hook updates URL parameters
3. URL change triggers query re-fetch
4. New data rendered with loading states

## Key Functions and Hooks

### useFilterUpdates Hook

Manages URL state for filters with type-safe updates:

```typescript
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
    toggleTopic,
    toggleYear,
    clearAllFilters,
    isPending,
  }
}
```

### useQuestionsQuery Hook

Implements infinite scrolling with intersection observer:

```typescript
export function useQuestionsQuery({ filters, initialData, enabled = true }) {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
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

  // Automatically fetch next page when scrolling
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  return { questions, totalCount, loadMoreRef: ref }
}
```

### useUserProfile Hook

Fetches and caches user profile with session validation:

```typescript
export function useUserProfile() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  
  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user?.id ?? null)
      }
    )
    return () => subscription.unsubscribe()
  }, [supabase])
  
  const { data, isLoading, error } = useQuery({
    queryKey: userId ? queryKeys.user.profile(userId) : ['user-profile-anonymous'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session || session.expires_at * 1000 < Date.now()) {
        return { user: null, profile: null }
      }
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
      
      return { user: session.user, profile }
    },
    ...CACHE_TIMES.USER_DATA,
    enabled: !!userId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
  
  return { user: data?.user ?? null, profile: data?.profile ?? null, isLoading }
}
```

### useSafeTimeout Hook

Prevents memory leaks with automatic cleanup:

```typescript
export function useSafeTimeout() {
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set())

  const setSafeTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      timeoutsRef.current.delete(timeoutId)
      callback()
    }, delay)
    
    timeoutsRef.current.add(timeoutId)
    return timeoutId
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

### useIsMobile Hook

Responsive design detection with SSR support:

```typescript
export function useIsMobile() {
  // undefined indicates loading state for SSR
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const checkMobile = () => window.innerWidth < 1024
    setIsMobile(checkMobile())

    const mql = window.matchMedia(`(max-width: 1023px)`)
    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)

    mql.addEventListener("change", handleChange)
    return () => mql.removeEventListener("change", handleChange)
  }, [])

  return isMobile // undefined during SSR, boolean after hydration
}
```

### useSessionStorage Hook

Generic hook for sessionStorage with type safety and error handling:

```typescript
export function useSessionStorage<T>({
  key,
  defaultValue,
  validator,
}: UseSessionStorageOptions<T>): [T, (value: T) => void, boolean] {
  const [storedValue, setStoredValue] = useState<T>(defaultValue)
  const [isLoading, setIsLoading] = useState(true)
  const [isAvailable, setIsAvailable] = useState(false)

  // Check storage availability and load initial value
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    try {
      // Test storage availability
      const testKey = '__test__'
      window.sessionStorage.setItem(testKey, 'test')
      window.sessionStorage.removeItem(testKey)
      setIsAvailable(true)

      // Load existing value with validation
      const item = window.sessionStorage.getItem(key)
      if (item !== null) {
        const parsed = JSON.parse(item)
        if (!validator || validator(parsed)) {
          setStoredValue(parsed)
        } else {
          window.sessionStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.warn(`SessionStorage not available for key "${key}":`, error)
      setIsAvailable(false)
    } finally {
      setIsLoading(false)
    }
  }, [key, defaultValue, validator])

  const setValue = useCallback((value: T) => {
    setStoredValue(value)
    if (typeof window !== 'undefined' && isAvailable) {
      try {
        window.sessionStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.warn(`Failed to save to sessionStorage:`, error)
      }
    }
  }, [key, isAvailable])

  return [storedValue, setValue, isLoading]
}
```

### useZoom Hook

Context-based zoom functionality for desktop users:

```typescript
export function useZoom() {
  const context = useContext(ZoomContext)
  if (!context) {
    throw new Error('useZoom must be used within ZoomProvider')
  }
  return context
}

// The ZoomProvider manages zoom state with sessionStorage persistence
export function ZoomProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  const isEnabled = isMobile === false // Desktop only

  const [zoomLevel, setStoredZoom, isLoading] = useSessionStorage<ZoomLevel>({
    key: 'exam-viewer-zoom',
    defaultValue: 1.0,
    validator: isValidZoomLevel,
  })

  const increaseZoom = useCallback(() => {
    if (!isEnabled) return
    const currentIndex = ZOOM_LEVELS.indexOf(zoomLevel)
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      setZoomLevel(ZOOM_LEVELS[currentIndex + 1])
    }
  }, [isEnabled, zoomLevel, setZoomLevel])

  const decreaseZoom = useCallback(() => {
    if (!isEnabled) return
    const currentIndex = ZOOM_LEVELS.indexOf(zoomLevel)
    if (currentIndex > 0) {
      setZoomLevel(ZOOM_LEVELS[currentIndex - 1])
    }
  }, [isEnabled, zoomLevel, setZoomLevel])

  // Keyboard shortcuts (Cmd/Ctrl + +/-, 0 to reset)
  useEffect(() => {
    if (!isEnabled || isLoading) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      switch (e.key) {
        case '=':
        case '+':
          e.preventDefault()
          increaseZoom()
          break
        case '-':
          e.preventDefault()
          decreaseZoom()
          break
        case '0':
          e.preventDefault()
          resetZoom()
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEnabled, isLoading, increaseZoom, decreaseZoom, resetZoom])

  return { zoomLevel, increaseZoom, decreaseZoom, resetZoom, isEnabled, isLoading }
}
```

### useAuditHistory Hook

Fetches question audit logs for admin features:

```typescript
export function useAuditHistory(questionId: string): UseAuditHistoryReturn {
  const { data: history, isLoading, error } = useQuery({
    queryKey: ['audit-history', questionId],
    queryFn: () => getQuestionAuditHistory(questionId),
    ...CACHE_TIMES.DYNAMIC_DATA,
    enabled: !!questionId,
    staleTime: 30 * 1000,  // Consider stale after 30 seconds
    gcTime: 5 * 60 * 1000,  // Keep in cache for 5 minutes
  })

  return {
    history: history || [],
    isLoading,
    error: error as Error | null
  }
}
```

## Integration Points

### TanStack Query Integration

The application uses TanStack Query v5 with custom configuration:

```typescript
// src/lib/config/cache.ts
export const CACHE_TIMES = {
  STATIC_DATA: {
    staleTime: 30 * 60 * 1000,  // 30 minutes
    gcTime: 60 * 60 * 1000,      // 1 hour
  },
  USER_DATA: {
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime: 10 * 60 * 1000,      // 10 minutes
  },
  DYNAMIC_DATA: {
    staleTime: 60 * 1000,        // 1 minute
    gcTime: 5 * 60 * 1000,       // 5 minutes
  },
}

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
      retry: 0, // No automatic retry for mutations
    },
  },
}
```

### Query Key Factory

Centralized query keys prevent cache collisions:

```typescript
// src/lib/queries/query-keys.ts
export const queryKeys = {
  // Public data queries
  all: ['questions'] as const,
  infinite: (filters: Filters) => [...queryKeys.list(filters), 'infinite'] as const,
  topics: (subjectId: string) => ['topics', subjectId] as const,
  
  // User-specific queries (require user context)
  user: {
    profile: (userId: string) => ['user', userId, 'profile'] as const,
    subjects: (userId: string) => ['user', userId, 'subjects'] as const,
    admin: (userId: string) => ['user', userId, 'admin'] as const,
  },
}
```

## Configuration

### Cache Configuration

Different data types have different cache strategies:

- **Static Data**: Topics, subjects (30min stale, 1hr garbage collection)
- **User Data**: Profile, subjects (5min stale, 10min GC)
- **Dynamic Data**: Questions, audit logs (1min stale, 5min GC)

### URL Filter Configuration

Filters are serialized to URL parameters for persistence:

```typescript
// src/lib/utils/url-filters.ts
const FILTER_PARAM_MAP = {
  searchTerms: 'q',
  topicIds: 'topics',
  years: 'years',
  examTypes: 'types',
  questionNumbers: 'questions',
} as const
```

## Type Definitions

### Core State Types

```typescript
interface Filters {
  subjectId: string
  searchTerms?: string[]
  years?: number[]
  topicIds?: string[]
  examTypes?: string[]
  questionNumbers?: number[]
}

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}

interface UseUserProfileReturn {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  error: Error | null
}

interface UseSessionStorageOptions<T> {
  key: string
  defaultValue: T
  validator?: (value: unknown) => value is T
}

interface ZoomContextValue {
  zoomLevel: number
  setZoomLevel: (level: number) => void
  increaseZoom: () => void
  decreaseZoom: () => void
  resetZoom: () => void
  isEnabled: boolean
  isLoading: boolean
}

interface UseAuditHistoryReturn {
  history: QuestionAuditLog[]
  isLoading: boolean
  error: Error | null
}
```

## Implementation Details

### Cache Isolation Strategy

The application implements a sophisticated cache isolation strategy to prevent data leakage:

1. **Per-User QueryClient**: Each user gets their own QueryClient instance
2. **User-Scoped Keys**: All user data queries include the user ID in the key
3. **Session Validation**: Queries validate session before fetching
4. **Cleanup on Auth Change**: Cache cleared when user changes

### Retry Logic

All queries implement exponential backoff retry:

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delay = 1000
): Promise<T> {
  let lastError: Error
  
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on client errors (4xx)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status
        if (status >= 400 && status < 500) throw error
      }
      
      // Exponential backoff
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }
  
  throw lastError
}
```

### URL State Synchronization

The filter system maintains bidirectional sync between URL and application state:

1. URL changes trigger query re-fetches
2. Filter interactions update URL immediately
3. Browser back/forward navigation works correctly
4. Shareable URLs preserve filter state

## Dependencies

### External Dependencies
- `@tanstack/react-query`: v5 - Server state management
- `@supabase/supabase-js`: Authentication and database
- `react-intersection-observer`: Infinite scroll detection
- `next/navigation`: URL state management

### Internal Dependencies
- Supabase clients (`client.ts`, `server.ts`)
- Query builders (`query-builders.ts`)
- Error handling (`errors.ts`)
- Type definitions (`database.ts`)

## API Reference

### Custom Hooks API

#### useFilterUpdates
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

#### useQuestionsQuery
```typescript
function useQuestionsQuery(options: {
  filters: Filters
  initialData?: PaginatedResponse
  enabled?: boolean
}): {
  questions: Question[]
  totalCount: number | undefined
  error: Error | null
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean | undefined
  loadMoreRef: RefCallback<HTMLElement>
  status: QueryStatus
  refetch: () => void
}
```

#### useUserProfile
```typescript
function useUserProfile(): {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  error: Error | null
}
```

#### useAuth
```typescript
function useAuth(): {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}
```

#### useSessionStorage
```typescript
function useSessionStorage<T>(options: {
  key: string
  defaultValue: T
  validator?: (value: unknown) => value is T
}): [T, (value: T) => void, boolean]
```

#### useZoom
```typescript
function useZoom(): {
  zoomLevel: number
  setZoomLevel: (level: number) => void
  increaseZoom: () => void
  decreaseZoom: () => void
  resetZoom: () => void
  isEnabled: boolean
  isLoading: boolean
}
```

#### useAuditHistory
```typescript
function useAuditHistory(questionId: string): {
  history: QuestionAuditLog[]
  isLoading: boolean
  error: Error | null
}
```

## Other Notes

### Performance Considerations

1. **Placeholders**: Queries use `placeholderData` to keep previous data during refetch
2. **Deduplication**: Unique question Map prevents duplicates in infinite scroll
3. **Abort Signals**: Queries support cancellation via AbortController
4. **Transition API**: Filter updates use React 18 transitions for non-blocking UI

### Security Measures

1. **Session Expiry Check**: Regular intervals check for expired sessions
2. **Cache Clearing**: Complete cache wipe on sign-out
3. **User Isolation**: No cache sharing between different users
4. **UUID Validation**: User IDs validated before queries

### Hook Composition Patterns

Hooks compose for complex features:

```typescript
// useIsAdmin composes useUserProfile
export function useIsAdmin() {
  const { profile, isLoading } = useUserProfile()
  return {
    isAdmin: profile?.is_admin ?? false,
    isLoading,
  }
}

// useUser extracts subset of useUserProfile
export function useUser() {
  const { user, isLoading, error } = useUserProfile()
  return { user, isLoading, error }
}
```

### Edge Cases Handled

1. **SSR/Hydration**: Mobile hook returns undefined during SSR
2. **Race Conditions**: Abort signals prevent stale requests
3. **Memory Leaks**: Safe timeout hook cleans up on unmount
4. **Anonymous Users**: Separate cache keys for non-authenticated state
5. **Session Refresh**: TOKEN_REFRESHED event preserves cache when appropriate
6. **Storage Availability**: SessionStorage hook gracefully falls back to memory
7. **Invalid Storage Data**: Automatic cleanup when validator fails

### Hook Usage Patterns

#### SessionStorage Hook Usage
The `useSessionStorage` hook provides persistent state across page refreshes within a session:

```typescript
// Basic usage
const [theme, setTheme, isLoading] = useSessionStorage({
  key: 'user-theme',
  defaultValue: 'light'
})

// With type validation
const isValidZoomLevel = (value: unknown): value is number => {
  return typeof value === 'number' && value >= 0.5 && value <= 1.0
}

const [zoom, setZoom, isLoading] = useSessionStorage({
  key: 'zoom-level',
  defaultValue: 1.0,
  validator: isValidZoomLevel
})
```

#### Zoom Provider Pattern
The zoom feature demonstrates context-based state management with persistence:

```typescript
// In app layout
<ZoomProvider>
  <YourApp />
</ZoomProvider>

// In components
function QuestionViewer() {
  const { zoomLevel, isEnabled } = useZoom()

  if (!isEnabled) return null // Mobile view

  return (
    <div style={{ transform: `scale(${zoomLevel})` }}>
      {/* Content */}
    </div>
  )
}
```

#### Audit History Integration
Admin features use audit history for change tracking:

```typescript
function QuestionEditor({ questionId }: { questionId: string }) {
  const { history, isLoading } = useAuditHistory(questionId)

  return (
    <div>
      <h3>Change History</h3>
      {history.map(entry => (
        <div key={entry.id}>
          <time>{entry.created_at}</time>
          <p>{entry.action}: {JSON.stringify(entry.changes)}</p>
        </div>
      ))}
    </div>
  )
}
```

### Storage Strategy

The application uses a layered storage approach:

1. **Memory (React State)**: Immediate UI state
2. **SessionStorage**: Per-session preferences (zoom level)
3. **URL Parameters**: Shareable state (filters)
4. **React Query Cache**: Server data with TTL
5. **Supabase Database**: Persistent user data

Each storage layer has specific use cases:
- **SessionStorage**: User preferences that should persist during a session but reset on new sessions
- **URL State**: Shareable configurations like filter settings
- **Query Cache**: Frequently accessed server data with automatic invalidation
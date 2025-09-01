# Cache Management System Documentation

## Overview
The cache management system in this application implements a sophisticated, multi-layered caching strategy using TanStack Query (React Query) v5. It provides user-isolated cache instances, automatic invalidation on auth state changes, configurable cache times based on data volatility, granular cache invalidation for user updates, and development monitoring tools for debugging cache behavior.

## Architecture
The cache management system follows a user-isolation pattern where each authenticated user gets their own QueryClient instance to prevent data leakage between sessions. The architecture consists of:

1. **Per-user QueryClient instances** - Isolated cache stores for each user session
2. **Centralized cache configuration** - Consistent cache timing across the application
3. **Cache invalidation utilities** - Tools for selective and complete cache clearing
4. **Development monitoring** - Real-time cache inspection and debugging tools
5. **Query key factories** - Structured approach to cache key generation
6. **Granular invalidation patterns** - Targeted cache updates for specific user data changes

## File Structure
```
src/lib/cache/
├── cache-utils.ts       # Core cache invalidation and management utilities
└── cache-monitor.ts     # Development-only monitoring and debugging tools

src/lib/config/
└── cache.ts            # Centralized cache configuration and timing constants

src/lib/queries/
└── query-keys.ts       # Query key factory for consistent cache key generation

src/components/providers/
├── providers.tsx       # QueryClient provider with user isolation
└── auth-provider.tsx   # Auth state management with cache clearing
```

## Core Components

### Cache Configuration (`/lib/config/cache.ts`)
Defines cache timing strategies based on data volatility:

```typescript
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

Global query configuration with retry logic:
```typescript
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

### Cache Utilities (`/lib/cache/cache-utils.ts`)
Provides essential cache management functions:

```typescript
// Invalidates all user-specific cached data
export async function invalidateUserCache(queryClient: QueryClient) {
  // Invalidate all queries that start with ['user']
  // This will match ['user', userId, 'profile'], ['user', userId, 'subjects'], etc.
  await queryClient.invalidateQueries({ queryKey: ['user'] })
  
  // Also invalidate the anonymous user profile query if it exists
  await queryClient.invalidateQueries({ queryKey: ['user-profile-anonymous'] })
  
  // Remove the invalidated queries from cache to force fresh data
  queryClient.removeQueries({ queryKey: ['user'] })
  queryClient.removeQueries({ queryKey: ['user-profile-anonymous'] })
}

// Completely clears all cached data
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
```

Pattern-based cache invalidation:
```typescript
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
```

### Cache Monitoring (`/lib/cache/cache-monitor.ts`)
Development-only tools for cache inspection:

```typescript
// Logs current cache state to console
export function logCacheState(queryClient: QueryClient, label?: string) {
  const stats = getCacheStats(queryClient)
  const cache = queryClient.getQueryCache()
  const queries = cache.getAll()
  
  console.group(`🔍 Cache State${label ? `: ${label}` : ''}`)
  console.log('Statistics:', stats)
  
  queries.forEach(query => {
    console.log({
      key: query.queryKey,
      status: query.state.status,
      dataUpdatedAt: new Date(query.state.dataUpdatedAt).toISOString(),
      isStale: query.isStale(),
      data: query.state.data ? '✓ Has data' : '✗ No data'
    })
  })
}
```

Browser console inspector:
```typescript
export function installCacheInspector(queryClient: QueryClient) {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return
  
  window.__cacheInspector = {
    logState: () => logCacheState(queryClient),
    getStats: () => getCacheStats(queryClient),
    verifyCleared: () => verifyCacheCleared(queryClient),
    clearAll: () => {
      queryClient.clear()
      console.log('✓ Cache cleared manually')
    },
    getQueries: () => queryClient.getQueryCache().getAll(),
  }
}
```

## Data Flow

### Cache Isolation Flow
1. User authenticates → New QueryClient created with user ID
2. QueryClient tagged with user ID for debugging
3. Previous user's QueryClient cleared and unmounted
4. All queries scoped with user ID in cache keys
5. On sign-out → Complete cache clear

### Query Lifecycle
1. Query initiated with user-scoped key
2. Check cache for existing data
3. If stale or missing → Fetch from Supabase
4. Apply retry logic on failure (exponential backoff)
5. Store in user-isolated cache with configured TTL
6. Auto-invalidate based on stale time

## Key Functions and Hooks

### Query Key Factory (`/lib/queries/query-keys.ts`)
Structured approach to cache key generation:

```typescript
export const queryKeys = {
  // Public data queries (no user context needed)
  all: ['questions'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (filters: Filters) => [...queryKeys.lists(), filters] as const,
  infinite: (filters: Filters) => [...queryKeys.list(filters), 'infinite'] as const,
  
  // User-specific queries (require user context)
  user: {
    profile: (userId: string) => ['user', userId, 'profile'] as const,
    subjects: (userId: string) => ['user', userId, 'subjects'] as const,
    preferences: (userId: string) => ['user', userId, 'preferences'] as const,
    progress: (userId: string) => ['user', userId, 'progress'] as const,
    admin: (userId: string) => ['user', userId, 'admin'] as const,
  },
}
```

### User Profile Hook with Sidebar Updates
The user profile hook is used by the sidebar's NavUser component to display the current user's name and email. When a user updates their name in settings, the cache is invalidated to ensure the sidebar reflects the change immediately:

```typescript
export function useUserProfile() {
  const { data, isLoading, error } = useQuery({
    queryKey: userId ? queryKeys.user.profile(userId) : ['user-profile-anonymous'],
    queryFn: async () => {
      // Validate session before fetching
      const { data: { session } } = await supabase.auth.getSession()
      
      // Check if session is expired
      if (session.expires_at && session.expires_at * 1000 < Date.now()) {
        return { user: null, profile: null }
      }
      
      // Fetch user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      return { user, profile }
    },
    ...CACHE_TIMES.USER_DATA, // Apply user data cache configuration
    retry: 1,
    enabled: !!userId,
  })
}
```

### Name Update with Cache Invalidation (`/app/dashboard/settings/components/name-section.tsx`)
```typescript
const handleSave = useCallback(async () => {
  const result = await updateUserName(name)
  
  if (result.error) {
    setError(result.error)
  } else {
    // Update local state
    originalName.current = name
    
    // Invalidate user profile cache to update sidebar and other components
    if (user?.id) {
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.user.profile(user.id) 
      })
    }
  }
}, [name, queryClient, user?.id])
```

This pattern ensures that when a user changes their name:
1. The name is updated in the database via server action
2. The user profile cache is invalidated with the specific user ID
3. The sidebar's NavUser component automatically re-fetches and displays the new name
4. All other components using the user profile hook get the updated data

### Topics Hook with Static Caching (`/lib/hooks/use-topics.ts`)
```typescript
export function useTopics(subjectId: string) {
  const { data: topics, isLoading, error } = useQuery({
    queryKey: ['topics', subjectId],
    queryFn: () => getTopics(subjectId),
    ...CACHE_TIMES.TOPICS, // Semi-static data caching
    enabled: !!subjectId
  })
  
  return { topics: topics || [], isLoading, error }
}
```

## Integration Points

### Email Change with Complete Cache Invalidation
When a user successfully changes their email, the entire user cache is invalidated to ensure consistency:

```typescript
// From change-email-dialog.tsx
const handleOtpVerification = async (otpValue?: string) => {
  const result = await verifyEmailChangeOtp(newEmail, codeToVerify)
  
  if (result.error) {
    setError(result.error)
  } else {
    // Refresh the session to get the updated email
    const supabase = createClient()
    await supabase.auth.refreshSession()
    
    // Invalidate cache to update email display throughout the app
    await invalidateUserCache(queryClient)
    
    setEmailChangeSuccess(true)
  }
}
```

This uses the `invalidateUserCache` utility which:
1. Invalidates all queries starting with ['user'] key
2. Removes the queries from cache to force fresh data
3. Ensures email updates are reflected in sidebar and all other components

### Authentication Provider Integration
The auth provider manages cache lifecycle during auth state changes:

```typescript
const handleAuthChange = async (event: AuthChangeEvent, newSession: Session | null) => {
  switch (event) {
    case 'SIGNED_OUT':
      clearAllCache(queryClient) // Complete cache clear
      break
      
    case 'SIGNED_IN':
      if (userChanged) {
        clearAllCache(queryClient) // Clear if different user
      }
      break
      
    case 'USER_UPDATED':
      await invalidateUserCache(queryClient) // Selective invalidation
      break
  }
}
```

### Provider Component with User Isolation
```typescript
// Store query clients per user session
const queryClientMap = new Map<string, QueryClient>()

function getQueryClient(userId?: string) {
  if (typeof window === 'undefined') {
    return makeQueryClient(userId) // Server: always new client
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

### Subject Updates with Transactional Database Operations
User subject updates utilize a PostgreSQL function for atomic operations:

```sql
-- Database function: update_user_subjects
CREATE FUNCTION update_user_subjects(p_user_id uuid, p_subject_ids uuid[])
BEGIN
  -- Transaction boundary is automatic in PL/pgSQL functions
  DELETE FROM user_subjects WHERE user_id = p_user_id;
  
  IF p_subject_ids IS NOT NULL AND array_length(p_subject_ids, 1) > 0 THEN
    INSERT INTO user_subjects (user_id, subject_id)
    SELECT p_user_id, unnest(p_subject_ids);
  END IF;
  
  -- Transaction automatically rolls back on any error
END;
```

The client-side implementation:
```typescript
// From settings/actions.ts
export async function updateUserSubjects(subjectIds: string[]) {
  const result = await saveUserSubjects(user.id, subjectIds)
  
  if (!result.success) {
    return { error: result.error }
  }
  
  // Revalidate multiple paths for consistency
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/study')
  
  return { success: true }
}
```

This ensures:
1. Atomic database updates via transaction
2. No partial state if operation fails
3. Server-side cache revalidation for affected routes
4. Consistent data across all dashboard pages

### Mutation with Cache Invalidation
Example from question edit modal:

```typescript
const updateMutation = useMutation({
  mutationFn: async () => {
    const result = await updateQuestionMetadata(question.id, updates)
    if (!result.success) {
      throw new Error(result.error || 'Update failed')
    }
    return result
  },
  onSuccess: () => {
    toast.success('Question updated successfully')
    queryClient.invalidateQueries({ queryKey: ['questions'] }) // Invalidate related queries
    router.refresh() // Trigger server-side revalidation
    onOpenChange(false)
  },
  onError: (error) => {
    toast.error(error.message)
  }
})
```

## Configuration

### Cache Timing Strategy
- **Static Data**: 30min stale time, 1hr garbage collection
- **User Data**: 5min stale time, 10min garbage collection  
- **Dynamic Data**: 1min stale time, 5min garbage collection
- **Topics**: 10min stale time, 30min garbage collection
- **Questions**: 1min stale time, 10min garbage collection

### Retry Configuration
- Queries: 1 retry with exponential backoff (max 5 seconds)
- Mutations: No automatic retry
- Abort signal support for request cancellation

## Type Definitions

### Cache Statistics Type
```typescript
interface CacheStats {
  totalQueries: number
  staleQueries: number
  activeQueries: number
  inactiveQueries: number
  fetchingQueries: number
}
```

### Query Error Class
```typescript
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

## Implementation Details

### User Isolation Mechanism
Each user session creates a unique QueryClient instance stored in a Map with the user ID as the key. This ensures complete cache isolation between users:

```typescript
const queryClientMap = new Map<string, QueryClient>()
// Key: userId or 'anonymous'
// Value: QueryClient instance
```

When users change:
1. Previous user's QueryClient is cleared and unmounted
2. New QueryClient created for the new user
3. All queries automatically scoped with new user ID
4. No possibility of cache leakage between sessions

### Cache Key Scoping
All user-specific data uses scoped keys:
```typescript
['user', userId, 'profile'] // User profile
['user', userId, 'subjects'] // User's subjects
['user', userId, 'preferences'] // User preferences
```

Public data uses non-scoped keys:
```typescript
['questions', 'list', filters] // Question lists
['topics', subjectId] // Subject topics
['subjects'] // All subjects
```

### Development Monitoring
In development, the cache inspector provides:
- Real-time cache state logging
- Query statistics monitoring
- Manual cache clearing via browser console
- Automatic cache event logging
- Periodic cache size reporting (every 30 seconds)

Access via browser console:
```javascript
window.__cacheInspector.logState() // View current cache
window.__cacheInspector.getStats() // Get statistics
window.__cacheInspector.clearAll() // Clear cache manually
window.__cacheInspector.verifyCleared() // Check if properly cleared
```

## Dependencies
- **@tanstack/react-query**: v5.x for cache management
- **@supabase/supabase-js**: Database client with auth integration
- **React**: v19 for component lifecycle
- **Next.js**: v15 for server-side considerations

## API Reference

### Cache Utilities API

#### `clearAllCache(queryClient: QueryClient): void`
Completely clears all cached data and resets defaults.

#### `invalidateUserCache(queryClient: QueryClient): Promise<void>`
Invalidates and removes all user-specific cache entries.

#### `invalidateCacheByPattern(queryClient: QueryClient, pattern: string | string[]): Promise<void>`
Invalidates cache entries matching the provided pattern(s).

#### `resetQueryClient(queryClient: QueryClient): void`
Cancels queries, clears cache, and unmounts the client.

#### `getCacheStats(queryClient: QueryClient): CacheStats`
Returns current cache statistics for monitoring.

#### `getUserScopedKey(userId: string, baseKey: string[]): string[]`
Creates a user-scoped cache key from a base key.

### Cache Monitor API

#### `logCacheState(queryClient: QueryClient, label?: string): void`
Logs detailed cache state to console (development only).

#### `verifyCacheCleared(queryClient: QueryClient): boolean`
Verifies no user-specific queries remain in cache.

#### `setupCacheMonitoring(queryClient: QueryClient): () => void`
Sets up automatic cache monitoring with cleanup function.

#### `installCacheInspector(queryClient: QueryClient): void`
Installs browser console debugging tools (development only).

## Other notes

### Cache Invalidation Strategies
The system uses four invalidation strategies:
1. **Complete Clear**: On sign-out or user change
2. **Selective Invalidation**: On specific user data updates (e.g., name changes)
3. **Pattern-based Invalidation**: For related query groups
4. **Path Revalidation**: Server-side cache refresh for Next.js pages

### Memory Management
- QueryClient instances are unmounted when users change
- Old cache entries removed based on gcTime configuration
- Map cleanup prevents memory leaks from accumulating clients

### Security Considerations
- Complete cache isolation between user sessions
- Session validation before cache operations
- Expired session detection and cache clearing
- No cross-user data leakage possible

### Performance Optimizations
- Placeholder data during refetch for smooth transitions
- Infinite query with cursor-based pagination
- Request cancellation via AbortSignal
- Deduplication of duplicate queries
- Granular cache invalidation to minimize refetches
- Transaction-based database updates to prevent partial state

### Edge Cases Handled
- Anonymous user sessions with separate cache
- Session expiration during active use
- Rapid user switching
- Background tab data staleness
- Network reconnection scenarios
- Failed cache invalidation with graceful error handling
- Concurrent updates to user profile data
- Transaction rollback on subject update failures
import { QueryClient } from '@tanstack/react-query'
import type { DefaultOptions } from '@tanstack/react-query'
import { QUERY_CONFIG } from '@/lib/config/cache'

type AnyDefaultOptions = DefaultOptions<unknown, unknown, unknown, unknown>

function cloneDefaultOptions(options?: AnyDefaultOptions): AnyDefaultOptions | undefined {
  if (!options) {
    return undefined
  }

  return {
    ...options,
    queries: options.queries ? { ...options.queries } : undefined,
    mutations: options.mutations ? { ...options.mutations } : undefined,
  }
}

const originalDefaults = new WeakMap<QueryClient, AnyDefaultOptions | undefined>()

/**
 * Cache invalidation utilities for managing React Query cache
 * Ensures proper cache clearing on auth state changes
 */

/**
 * Invalidates all user-specific cached data
 * Should be called when user signs out or auth state changes
 */
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

/**
 * Completely clears all cached data
 * Should be called on sign-out to prevent data leakage
 */
export function clearAllCache(queryClient: QueryClient) {
  if (!originalDefaults.has(queryClient)) {
    originalDefaults.set(queryClient, cloneDefaultOptions(queryClient.getDefaultOptions()))
  }

  // Cancel all in-flight queries
  queryClient.cancelQueries()
  
  // Clear the entire cache
  queryClient.clear()
  
  const defaults = originalDefaults.get(queryClient) ?? cloneDefaultOptions(QUERY_CONFIG.defaultOptions as AnyDefaultOptions)

  if (defaults) {
    queryClient.setDefaultOptions(cloneDefaultOptions(defaults)!)
  }
}

/**
 * Invalidates cache by pattern
 * Useful for selective cache invalidation
 */
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

/**
 * Resets the query client to initial state
 * Creates a clean environment for new user sessions
 */
export function resetQueryClient(queryClient: QueryClient) {
  // Cancel all queries
  queryClient.cancelQueries()
  
  // Clear all cache
  queryClient.clear()
  
  // Unmount and cleanup
  queryClient.unmount()
}

/**
 * Gets cache statistics for monitoring
 */
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

/**
 * Adds user context to cache keys
 * Ensures cache isolation between different users
 */
export function getUserScopedKey(userId: string, baseKey: string[]) {
  return ['user', userId, ...baseKey]
}

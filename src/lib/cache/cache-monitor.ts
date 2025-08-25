'use client'

import { QueryClient, type Query } from '@tanstack/react-query'
import { getCacheStats } from './cache-utils'

/**
 * Cache monitoring utilities for debugging and verification
 * Use these in development to ensure cache is properly cleared
 */

/**
 * Logs current cache state to console
 * Useful for debugging cache issues
 */
export function logCacheState(queryClient: QueryClient, label?: string) {
  if (typeof window === 'undefined') return
  
  const stats = getCacheStats(queryClient)
  const cache = queryClient.getQueryCache()
  const queries = cache.getAll()
  
  console.group(`🔍 Cache State${label ? `: ${label}` : ''}`)
  console.log('Statistics:', stats)
  
  if (queries.length > 0) {
    console.group('Active Queries:')
    queries.forEach(query => {
      const key = query.queryKey
      const state = query.state
      console.log({
        key,
        status: state.status,
        dataUpdatedAt: new Date(state.dataUpdatedAt).toISOString(),
        isStale: query.isStale(),
        data: state.data ? '✓ Has data' : '✗ No data'
      })
    })
    console.groupEnd()
  } else {
    console.log('✓ Cache is empty')
  }
  
  console.groupEnd()
}

/**
 * Verifies that cache has been properly cleared
 * Returns true if cache is clean, false otherwise
 */
export function verifyCacheCleared(queryClient: QueryClient): boolean {
  const cache = queryClient.getQueryCache()
  const queries = cache.getAll()
  
  // Check for any user-specific queries
  const userQueries = queries.filter(q => {
    const key = q.queryKey as string[]
    return key.some(k => 
      typeof k === 'string' && 
      (k.includes('user') || k.includes('profile') || k.includes('subjects'))
    )
  })
  
  if (userQueries.length > 0) {
    console.warn('⚠️ User-specific queries still in cache:', userQueries.map(q => q.queryKey))
    return false
  }
  
  return true
}

/**
 * Sets up cache monitoring in development
 * Logs cache state on important events
 */
export function setupCacheMonitoring(queryClient: QueryClient) {
  if (process.env.NODE_ENV !== 'development') return
  
  // Log initial state
  logCacheState(queryClient, 'Initial')
  
  // Monitor cache events
  const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'added') {
      console.log('➕ Query added:', event.query.queryKey)
    } else if (event.type === 'removed') {
      console.log('➖ Query removed:', event.query.queryKey)
    }
  })
  
  // Log cache state periodically in development
  const interval = setInterval(() => {
    const stats = getCacheStats(queryClient)
    if (stats.totalQueries > 0) {
      console.log(`📊 Cache: ${stats.totalQueries} queries, ${stats.activeQueries} active, ${stats.staleQueries} stale`)
    }
  }, 30000) // Every 30 seconds
  
  // Cleanup function
  return () => {
    unsubscribe()
    clearInterval(interval)
  }
}

/**
 * Adds a development-only cache inspector to window
 * Access via window.__cacheInspector in browser console
 */
export function installCacheInspector(queryClient: QueryClient) {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return
  
  // Extend window object for development debugging
  interface WindowWithCacheInspector extends Window {
    __cacheInspector?: {
      logState: () => void
      getStats: () => ReturnType<typeof getCacheStats>
      verifyCleared: () => boolean
      clearAll: () => void
      getQueries: () => Query[]
    }
  }
  
  const extendedWindow = window as WindowWithCacheInspector
  extendedWindow.__cacheInspector = {
    logState: () => logCacheState(queryClient),
    getStats: () => getCacheStats(queryClient),
    verifyCleared: () => verifyCacheCleared(queryClient),
    clearAll: () => {
      queryClient.clear()
      console.log('✓ Cache cleared manually')
    },
    getQueries: () => queryClient.getQueryCache().getAll(),
  }
  
  console.log('💡 Cache inspector installed. Access via window.__cacheInspector')
}
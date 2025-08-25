import type { QueryClientConfig } from '@tanstack/react-query'

/**
 * Centralized cache configuration for React Query
 * Ensures consistency across all data fetching operations
 */

// Cache time configurations based on data volatility
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
} as const

// Global query configuration
export const QUERY_CONFIG: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Default to dynamic data settings (most conservative)
      staleTime: CACHE_TIMES.DYNAMIC_DATA.staleTime,
      gcTime: CACHE_TIMES.DYNAMIC_DATA.gcTime,
      
      // Retry configuration - reduced from 3 to 1 for better UX
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      
      // Behavior settings
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 0, // Mutations should not retry automatically
    },
  },
}

// Helper function to get cache config for specific data types
export function getCacheConfig(dataType: 'static' | 'user' | 'dynamic') {
  switch (dataType) {
    case 'static':
      return CACHE_TIMES.STATIC_DATA
    case 'user':
      return CACHE_TIMES.USER_DATA
    case 'dynamic':
    default:
      return CACHE_TIMES.DYNAMIC_DATA
  }
}
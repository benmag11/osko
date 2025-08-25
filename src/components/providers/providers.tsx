'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'
import { QUERY_CONFIG } from '@/lib/config/cache'
import { AuthProvider } from './auth-provider'
import { Session } from '@supabase/supabase-js'

/**
 * Creates a new QueryClient instance with secure defaults
 * Each user session gets its own client to prevent cache leakage
 */
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
    // Use a symbol to avoid type issues while still tagging for debugging
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

interface ProvidersProps {
  children: React.ReactNode
  initialSession?: Session | null
}

export function Providers({ children, initialSession }: ProvidersProps) {
  const userId = initialSession?.user?.id
  const [queryClient] = useState(() => getQueryClient(userId))
  const previousUserIdRef = useRef(userId)
  
  // Clean up query client when user changes
  useEffect(() => {
    if (previousUserIdRef.current !== userId) {
      // User changed, clear the old client
      if (previousUserIdRef.current) {
        const oldClient = queryClientMap.get(previousUserIdRef.current)
        if (oldClient) {
          oldClient.clear()
          oldClient.unmount()
          queryClientMap.delete(previousUserIdRef.current)
        }
      }
      previousUserIdRef.current = userId
    }
  }, [userId])
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clear all clients on unmount
      for (const client of queryClientMap.values()) {
        client.clear()
        client.unmount()
      }
      queryClientMap.clear()
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialSession={initialSession}>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  )
}
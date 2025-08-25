'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { clearAllCache, invalidateUserCache } from '@/lib/cache/cache-utils'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
  initialSession?: Session | null
}

export function AuthProvider({ children, initialSession = null }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null)
  const [session, setSession] = useState<Session | null>(initialSession)
  const [isLoading, setIsLoading] = useState(!initialSession)
  const [previousUserId, setPreviousUserId] = useState<string | null>(
    initialSession?.user?.id ?? null
  )
  
  const queryClient = useQueryClient()
  const router = useRouter()
  const supabase = createClient()
  
  const handleAuthChange = useCallback(
    async (event: AuthChangeEvent, newSession: Session | null) => {
      console.log('Auth state changed:', event, newSession?.user?.id)
      
      const newUserId = newSession?.user?.id ?? null
      const userChanged = previousUserId !== null && previousUserId !== newUserId
      
      // Handle different auth events
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
          
        case 'PASSWORD_RECOVERY':
        case 'MFA_CHALLENGE_VERIFIED':
          setUser(newSession?.user ?? null)
          setSession(newSession)
          setPreviousUserId(newUserId)
          break
      }
    },
    [queryClient, router, previousUserId]
  )
  
  // Set up auth state listener
  useEffect(() => {
    // Get initial session
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
    
    if (!initialSession) {
      initializeAuth()
    }
    
    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthChange)
    
    // Cleanup subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, handleAuthChange, initialSession])
  
  // Check for session expiry periodically
  useEffect(() => {
    const checkSessionExpiry = () => {
      if (session?.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000)
        const now = new Date()
        
        // If session expired, clear cache and redirect
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
    
    // Check every minute
    const interval = setInterval(checkSessionExpiry, 60000)
    
    return () => clearInterval(interval)
  }, [session, queryClient, router])
  
  // Secure sign out function
  const signOut = async () => {
    try {
      // Clear cache first
      clearAllCache(queryClient)
      
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Update state
      setUser(null)
      setSession(null)
      setPreviousUserId(null)
      
      // Redirect to home
      router.push('/')
    } catch (error) {
      console.error('Error during sign out:', error)
      // Even on error, clear local state and redirect
      clearAllCache(queryClient)
      setUser(null)
      setSession(null)
      setPreviousUserId(null)
      router.push('/')
    }
  }
  
  const value = {
    user,
    session,
    isLoading,
    signOut,
  }
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
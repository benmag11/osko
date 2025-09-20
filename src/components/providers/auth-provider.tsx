'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { clearAllCache, invalidateUserCache } from '@/lib/cache/cache-utils'
import { useRouter } from 'next/navigation'
import type { UserProfile } from '@/lib/types/database'
import { queryKeys } from '@/lib/queries/query-keys'

/**
 * Auth context keeps Supabase auth session and the lightweight `user_profiles` row.
 * Note: the profile table only includes name/admin/onboarding metadata; email comes from `session.user`.
 */
interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  profileError: Error | null
  isLoading: boolean
  isProfileLoading: boolean
  refetchProfile: () => Promise<UserProfile | null>
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
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileError, setProfileError] = useState<Error | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(false)
  const [previousUserId, setPreviousUserId] = useState<string | null>(
    initialSession?.user?.id ?? null
  )

  const queryClient = useQueryClient()
  const router = useRouter()
  const supabase = createClient()
  const profileAbortController = useRef<AbortController | null>(null)
  const inFlightProfileRequest = useRef<Promise<UserProfile | null> | null>(null)

  const hydrateProfileFromCache = useCallback((userId: string) => {
    const cachedEntry = queryClient.getQueryData<{ user: User; profile: UserProfile | null }>(
      queryKeys.user.profile(userId)
    )

    if (!cachedEntry) {
      return false
    }

    setProfile(cachedEntry.profile ?? null)
    setProfileError(null)
    setIsProfileLoading(false)
    return true
  }, [queryClient])

  const fetchProfile = useCallback(async (
    userId: string,
    options?: { force?: boolean }
  ): Promise<UserProfile | null> => {
    if (!userId) {
      setProfile(null)
      setProfileError(null)
      setIsProfileLoading(false)
      return null
    }

    if (!options?.force && inFlightProfileRequest.current) {
      return inFlightProfileRequest.current
    }

    profileAbortController.current?.abort()
    const controller = new AbortController()
    profileAbortController.current = controller

    const requestPromise = (async () => {
      try {
        setIsProfileLoading(true)
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, user_id, name, is_admin, onboarding_completed, created_at, updated_at')
          .eq('user_id', userId)
          .abortSignal(controller.signal)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            setProfile(null)
            setProfileError(null)
            return null
          }
          const formattedError = new Error(error.message)
          setProfile(null)
          setProfileError(formattedError)
          return null
        }

        setProfile(data ?? null)
        setProfileError(null)
        return data ?? null
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return null
        }
        const formattedError = error instanceof Error ? error : new Error('Failed to load profile')
        setProfile(null)
        setProfileError(formattedError)
        return null
      } finally {
        if (inFlightProfileRequest.current === requestPromise) {
          inFlightProfileRequest.current = null
        }
        if (profileAbortController.current === controller) {
          profileAbortController.current = null
        }
        setIsProfileLoading(false)
      }
    })()

    inFlightProfileRequest.current = requestPromise
    return requestPromise
  }, [supabase])

  const handleAuthChange = useCallback(
    async (event: AuthChangeEvent, newSession: Session | null) => {
      const newUserId = newSession?.user?.id ?? null
      const userChanged = previousUserId !== null && previousUserId !== newUserId
      
      // Handle different auth events
      switch (event) {
        case 'SIGNED_OUT':
          // Complete cache clear on sign out
          clearAllCache(queryClient)
          profileAbortController.current?.abort()
          inFlightProfileRequest.current = null
          setIsProfileLoading(false)
          setUser(null)
          setSession(null)
          setPreviousUserId(null)
          setProfile(null)
          setProfileError(null)
          router.push('/')
          break
          
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          if (userChanged) {
            // User changed - clear all cache for security
            clearAllCache(queryClient)
          }
          setUser(newSession?.user ?? null)
          setSession(newSession)
          setPreviousUserId(newUserId)
          if (newUserId && !hydrateProfileFromCache(newUserId)) {
            void fetchProfile(newUserId, { force: true })
          }
          break
          
        case 'USER_UPDATED':
          // Just invalidate user-specific cache
          await invalidateUserCache(queryClient)
          setUser(newSession?.user ?? null)
          setSession(newSession)
          if (newUserId && !hydrateProfileFromCache(newUserId)) {
            void fetchProfile(newUserId, { force: true })
          }
          break
          
        case 'PASSWORD_RECOVERY':
        case 'MFA_CHALLENGE_VERIFIED':
          setUser(newSession?.user ?? null)
          setSession(newSession)
          setPreviousUserId(newUserId)
          if (newUserId && !hydrateProfileFromCache(newUserId)) {
            void fetchProfile(newUserId, { force: true })
          }
          break
      }
    },
    [fetchProfile, hydrateProfileFromCache, previousUserId, queryClient, router]
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
          void fetchProfile(currentSession.user.id)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!initialSession) {
      initializeAuth()
    } else if (initialSession.user) {
      if (!hydrateProfileFromCache(initialSession.user.id)) {
        void fetchProfile(initialSession.user.id)
      }
      setIsLoading(false)
    }

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthChange)
    
    // Cleanup subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfile, hydrateProfileFromCache, supabase, handleAuthChange, initialSession])

  useEffect(() => {
    return () => {
      profileAbortController.current?.abort()
    }
  }, [])

  // Check for session expiry periodically
  useEffect(() => {
    const checkSessionExpiry = () => {
      if (session?.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000)
        const now = new Date()
        
        // If session expired, clear cache and redirect
        if (now >= expiresAt) {
          clearAllCache(queryClient)
          profileAbortController.current?.abort()
          inFlightProfileRequest.current = null
          setIsProfileLoading(false)
          setUser(null)
          setSession(null)
          setPreviousUserId(null)
          setProfile(null)
          setProfileError(null)
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
      profileAbortController.current?.abort()
      inFlightProfileRequest.current = null
      setIsProfileLoading(false)

      // Sign out from Supabase
      await supabase.auth.signOut()

      // Update state
      setUser(null)
      setSession(null)
      setPreviousUserId(null)
      setProfile(null)
      setProfileError(null)

      // Redirect to home
      router.push('/')
    } catch (error) {
      console.error('Error during sign out:', error)
      // Even on error, clear local state and redirect
      clearAllCache(queryClient)
      profileAbortController.current?.abort()
      inFlightProfileRequest.current = null
      setIsProfileLoading(false)
      setUser(null)
      setSession(null)
      setPreviousUserId(null)
      setProfile(null)
      setProfileError(null)
      router.push('/')
    }
  }

  const currentUserId = user?.id ?? null

  const refetchProfile = useCallback(async () => {
    if (!currentUserId) {
      setProfile(null)
      return null
    }
    return fetchProfile(currentUserId, { force: true })
  }, [currentUserId, fetchProfile])

  const value = {
    user,
    session,
    profile,
    profileError,
    isLoading,
    isProfileLoading,
    refetchProfile,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

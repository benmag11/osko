import { cache } from 'react'
import { createServerSupabaseClient } from './server'
import { getUserSubjects, getAllSubjects } from './queries'
import { getCachedAdminStatus } from './admin-context'
import type { Session } from '@supabase/supabase-js'
import type { Subject, UserProfile, UserSubjectWithSubject } from '@/lib/types/database'

export interface DashboardBootstrapPayload {
  session: Session | null
  profile: UserProfile | null
  userSubjects: UserSubjectWithSubject[]
  allSubjects: Subject[]
  isAdmin: boolean
}

export const getDashboardBootstrap = cache(async (): Promise<DashboardBootstrapPayload> => {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return {
      session: null,
      profile: null,
      userSubjects: [],
      allSubjects: [],
      isAdmin: false,
    }
  }

  const userId = session.user.id

  const [profileResult, userSubjects, allSubjects, isAdmin] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('id, user_id, name, is_admin, onboarding_completed, created_at, updated_at, stripe_customer_id, subscription_status, subscription_id, subscription_current_period_end, subscription_cancel_at_period_end, free_grind_credits')
      .eq('user_id', userId)
      .single(),
    getUserSubjects(userId),
    getAllSubjects(),
    getCachedAdminStatus(userId),
  ])

  const { data: profileData, error: profileError } = profileResult

  let profile: UserProfile | null = null
  if (!profileError || profileError.code === 'PGRST116') {
    profile = profileData ?? null
  } else {
    console.error('Failed to load dashboard profile', profileError)
  }

  return {
    session,
    profile,
    userSubjects,
    allSubjects,
    isAdmin,
  }
})

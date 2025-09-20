'use client'

import { createClient } from './client'
import { getUserSubjectsClient, getAllSubjectsClient } from './queries-client'
import { queryKeys } from '@/lib/queries/query-keys'
import type { QueryClient } from '@tanstack/react-query'
import type { UserProfile, Subject } from '@/lib/types/database'
import { generateSlug } from '@/lib/utils/slug'

export async function prefetchDashboardData(
  queryClient: QueryClient
): Promise<void> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return
  }

  const userId = session.user.id

  type ProfileQueryEntry = { user: typeof session.user; profile: UserProfile | null }

  let profileEntry = queryClient.getQueryData<ProfileQueryEntry>(queryKeys.user.profile(userId))

  if (!profileEntry) {
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, user_id, name, is_admin, onboarding_completed, created_at, updated_at')
      .eq('user_id', userId)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Failed to prefetch user profile on client', profileError)
    }

    profileEntry = {
      user: session.user,
      profile: profileData ?? null,
    }

    queryClient.setQueryData(queryKeys.user.profile(userId), profileEntry)
  }

  const cachedSubjects = queryClient.getQueryData(queryKeys.user.subjects(userId))

  if (!cachedSubjects) {
    const userSubjects = await getUserSubjectsClient(userId)
    const subjectsWithSlug = userSubjects.map(({ subject }) => ({
      ...subject,
      slug: generateSlug(subject),
    }))
    queryClient.setQueryData(queryKeys.user.subjects(userId), subjectsWithSlug)
  }

  let allSubjects = queryClient.getQueryData<Subject[]>(queryKeys.subjects())

  if (!allSubjects) {
    allSubjects = await getAllSubjectsClient()
    queryClient.setQueryData(queryKeys.subjects(), allSubjects)
  }

  queryClient.setQueryData(queryKeys.user.admin(userId), profileEntry.profile?.is_admin ?? false)
}

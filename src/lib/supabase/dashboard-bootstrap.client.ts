'use client'

import { createClient } from './client'
import { getUserSubjectsClient, getAllSubjectsClient } from './queries-client'
import { queryKeys } from '@/lib/queries/query-keys'
import type { QueryClient } from '@tanstack/react-query'
import type { DashboardBootstrapPayload } from './dashboard-bootstrap'
import type { UserProfile, UserSubjectWithSubject, Subject } from '@/lib/types/database'
import { generateSlug } from '@/lib/utils/slug'

export async function prefetchDashboardData(
  queryClient: QueryClient
): Promise<DashboardBootstrapPayload | null> {
  const supabase = createClient()
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

  type SubjectWithSlug = Subject & { slug: string }

  let userSubjects = queryClient.getQueryData<
    UserSubjectWithSubject[] | SubjectWithSlug[]
  >(
    queryKeys.user.subjects(userId)
  )

  if (!userSubjects) {
    userSubjects = await getUserSubjectsClient(userId)
  }

  const subjectsWithSlug = (userSubjects ?? []).map((entry) => {
    if ('subject' in entry) {
      const subject = (entry as UserSubjectWithSubject).subject
      return {
        ...subject,
        slug: generateSlug(subject),
      }
    }

    const subject = entry as SubjectWithSlug
    return subject.slug ? subject : { ...subject, slug: generateSlug(subject) }
  })

  queryClient.setQueryData(queryKeys.user.subjects(userId), subjectsWithSlug)

  let allSubjects = queryClient.getQueryData<Subject[]>(queryKeys.subjects())

  if (!allSubjects) {
    allSubjects = await getAllSubjectsClient()
    queryClient.setQueryData(queryKeys.subjects(), allSubjects)
  }

  queryClient.setQueryData(queryKeys.user.admin(userId), profileEntry.profile?.is_admin ?? false)

  return {
    session,
    profile: profileEntry.profile,
    userSubjects: userSubjects ?? [],
    allSubjects: allSubjects ?? [],
    isAdmin: profileEntry.profile?.is_admin ?? false,
  }
}

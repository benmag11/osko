import { SettingsClient } from './settings-client'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { getDashboardBootstrap } from '@/lib/supabase/dashboard-bootstrap'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { QUERY_CONFIG } from '@/lib/config/cache'
import { queryKeys } from '@/lib/queries/query-keys'
import { generateSlug } from '@/lib/utils/slug'

export default async function SettingsPage() {
  const bootstrap = await getDashboardBootstrap()

  if (!bootstrap.session?.user) {
    return (
      <DashboardPage>
        <p className="text-center text-warm-text-muted">
          Please sign in to view your settings
        </p>
      </DashboardPage>
    )
  }
  const userId = bootstrap.session.user.id
  const queryClient = new QueryClient({
    defaultOptions: QUERY_CONFIG.defaultOptions,
  })

  const subjectsWithSlug = bootstrap.userSubjects.map((userSubject) => ({
    ...userSubject.subject,
    slug: generateSlug(userSubject.subject),
  }))

  queryClient.setQueryData(queryKeys.user.subjects(userId), subjectsWithSlug)
  queryClient.setQueryData(queryKeys.subjects(), bootstrap.allSubjects)

  const dehydratedState = dehydrate(queryClient)

  return (
    <DashboardPage>
      <HydrationBoundary state={dehydratedState}>
        <SettingsClient 
          userEmail={bootstrap.session.user.email || ''}
          userName={bootstrap.profile?.name || ''}
          allSubjects={bootstrap.allSubjects}
          userSubjects={bootstrap.userSubjects.map(us => us.subject)}
        />
      </HydrationBoundary>
    </DashboardPage>
  )
}

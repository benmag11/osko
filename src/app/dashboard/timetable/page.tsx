import { TimetablePageClient } from './timetable-page-client'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { getDashboardBootstrap } from '@/lib/supabase/dashboard-bootstrap'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { QUERY_CONFIG } from '@/lib/config/cache'
import { queryKeys } from '@/lib/queries/query-keys'
import { formatName } from '@/lib/utils/format-name'

export default async function TimetablePage() {
  const bootstrap = await getDashboardBootstrap()

  if (!bootstrap.session?.user) {
    return (
      <DashboardPage>
        <p className="text-center text-warm-text-muted">
          Please sign in to view your exam timetable
        </p>
      </DashboardPage>
    )
  }

  const userId = bootstrap.session.user.id
  const userName = formatName(bootstrap.profile?.name || 'Student').split(/\s+/)[0]

  const queryClient = new QueryClient({
    defaultOptions: QUERY_CONFIG.defaultOptions,
  })

  queryClient.setQueryData(
    queryKeys.user.subjects(userId),
    bootstrap.userSubjects.map(us => ({
      ...us.subject,
      slug: '',
    }))
  )

  const dehydratedState = dehydrate(queryClient)

  return (
    <DashboardPage>
      <HydrationBoundary state={dehydratedState}>
        <TimetablePageClient
          userId={userId}
          userName={userName}
          initialSubjects={bootstrap.userSubjects}
        />
      </HydrationBoundary>
    </DashboardPage>
  )
}

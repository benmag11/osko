import { StatsPageClient } from './components/stats-page-client'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { getDashboardBootstrap } from '@/lib/supabase/dashboard-bootstrap'
import { getCompletionStats } from '@/lib/supabase/queries'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { QUERY_CONFIG } from '@/lib/config/cache'
import { queryKeys } from '@/lib/queries/query-keys'

export default async function StatsPage() {
  const bootstrap = await getDashboardBootstrap()

  if (!bootstrap.session?.user) {
    return (
      <DashboardPage maxWidth="max-w-4xl">
        <p className="text-center text-warm-text-muted">
          Please sign in to view your stats
        </p>
      </DashboardPage>
    )
  }

  const userId = bootstrap.session.user.id
  const queryClient = new QueryClient({
    defaultOptions: QUERY_CONFIG.defaultOptions,
  })

  // Prefetch all-time stats on the server
  await queryClient.prefetchQuery({
    queryKey: [...queryKeys.user.progress(userId), 'all'],
    queryFn: () => getCompletionStats(userId, null),
  })

  // Seed user subjects into cache for the dropdown
  queryClient.setQueryData(
    queryKeys.user.subjects(userId),
    bootstrap.userSubjects
  )

  const dehydratedState = dehydrate(queryClient)

  return (
    <DashboardPage maxWidth="max-w-4xl">
      <HydrationBoundary state={dehydratedState}>
        <StatsPageClient
          userId={userId}
          userSubjects={bootstrap.userSubjects}
        />
      </HydrationBoundary>
    </DashboardPage>
  )
}

import { PointsCalculatorClient } from './points-calculator-client'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { getDashboardBootstrap } from '@/lib/supabase/dashboard-bootstrap'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { QUERY_CONFIG } from '@/lib/config/cache'
import { queryKeys } from '@/lib/queries/query-keys'

export default async function PointsPage() {
  const bootstrap = await getDashboardBootstrap()

  if (!bootstrap.session?.user) {
    return (
      <DashboardPage>
        <p className="text-center text-warm-text-muted">
          Please sign in to calculate your points
        </p>
      </DashboardPage>
    )
  }

  const userId = bootstrap.session.user.id
  const queryClient = new QueryClient({
    defaultOptions: QUERY_CONFIG.defaultOptions,
  })

  // Store raw user subjects with grades for the points calculator
  queryClient.setQueryData(
    [...queryKeys.user.subjects(userId), 'raw'],
    bootstrap.userSubjects
  )

  const dehydratedState = dehydrate(queryClient)

  return (
    <DashboardPage>
      <HydrationBoundary state={dehydratedState}>
        <PointsCalculatorClient
          userId={userId}
          initialSubjects={bootstrap.userSubjects}
        />
      </HydrationBoundary>
    </DashboardPage>
  )
}

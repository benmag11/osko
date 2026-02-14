import { getReports, getReportStatistics } from '@/lib/supabase/report-actions'
import { ReportsClient } from './reports-client'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { getDashboardBootstrap } from '@/lib/supabase/dashboard-bootstrap'
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { QUERY_CONFIG } from '@/lib/config/cache'
import type { QuestionReport, ReportStatistics } from '@/lib/types/database'

export default async function ReportsPage() {
  const bootstrap = await getDashboardBootstrap()

  const queryClient = new QueryClient({
    defaultOptions: QUERY_CONFIG.defaultOptions,
  })

  if (bootstrap.isAdmin) {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['reports', 'all'],
        queryFn: () => getReports(),
      }),
      queryClient.prefetchQuery({
        queryKey: ['report-statistics'],
        queryFn: getReportStatistics,
      }),
    ])
  }

  const dehydratedState = dehydrate(queryClient)
  const reports = queryClient.getQueryData<QuestionReport[]>(['reports', 'all']) || []
  const statistics = queryClient.getQueryData<ReportStatistics | null>(['report-statistics']) || null

  return (
    <DashboardPage maxWidth="max-w-6xl">
      <HydrationBoundary state={dehydratedState}>
        <ReportsClient 
          initialReports={reports}
          initialStatistics={statistics}
        />
      </HydrationBoundary>
    </DashboardPage>
  )
}

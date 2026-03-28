import { AnalysisPageClient } from './components/analysis-page-client'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { getDashboardBootstrap } from '@/lib/supabase/dashboard-bootstrap'
import { getTopicFrequencyAnalysis } from '@/lib/supabase/queries'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { QUERY_CONFIG } from '@/lib/config/cache'
import { queryKeys } from '@/lib/queries/query-keys'

export default async function AnalysisPage() {
  const bootstrap = await getDashboardBootstrap()

  if (!bootstrap.session?.user) {
    return (
      <DashboardPage maxWidth="max-w-4xl">
        <p className="text-center text-warm-text-muted">
          Please sign in to view topic analysis
        </p>
      </DashboardPage>
    )
  }

  const userId = bootstrap.session.user.id
  const queryClient = new QueryClient({
    defaultOptions: QUERY_CONFIG.defaultOptions,
  })

  // Prefetch analysis for the user's first subject
  const firstSubjectId = bootstrap.userSubjects[0]?.subject_id
  if (firstSubjectId) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.topicAnalysis(firstSubjectId),
      queryFn: () => getTopicFrequencyAnalysis(firstSubjectId),
    })
  }

  // Seed user subjects into cache
  queryClient.setQueryData(
    queryKeys.user.subjects(userId),
    bootstrap.userSubjects
  )

  const dehydratedState = dehydrate(queryClient)

  return (
    <DashboardPage maxWidth="max-w-4xl">
      <HydrationBoundary state={dehydratedState}>
        <AnalysisPageClient
          userSubjects={bootstrap.userSubjects}
        />
      </HydrationBoundary>
    </DashboardPage>
  )
}

import { notFound } from 'next/navigation'
import { 
  getSubjectBySlug, 
  getTopics, 
  getAvailableYears,
  searchQuestions 
} from '@/lib/supabase/queries'
import { parseSearchParams } from '@/lib/utils/url-filters'
import { ExamSidebar } from '@/components/layout/exam-sidebar'
import { 
  SidebarProvider, 
  SidebarInset 
} from '@/components/ui/sidebar'
import { FloatingSidebarTrigger } from '@/components/layout/floating-sidebar-trigger'
import { MobileNavbar } from '@/components/layout/mobile-navbar'
import { FilterBadges } from '@/components/filters/filter-badges'
import { QuestionList } from '@/components/questions/question-list'
import { Separator } from '@/components/ui/separator'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function SubjectPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const subject = await getSubjectBySlug(resolvedParams.slug)
  
  if (!subject) {
    notFound()
  }

  // Parse filters early as it doesn't depend on other data
  const filters = parseSearchParams(resolvedSearchParams, subject.id)

  // Fetch all data in parallel for optimal performance
  const [topicsResult, yearsResult, questionsResult] = await Promise.allSettled([
    getTopics(subject.id),
    getAvailableYears(subject.id),
    searchQuestions(filters)
  ])

  // Extract data with proper error handling
  const topics = topicsResult.status === 'fulfilled' ? topicsResult.value : []
  const years = yearsResult.status === 'fulfilled' ? yearsResult.value : []
  const initialData = questionsResult.status === 'fulfilled' 
    ? questionsResult.value 
    : { questions: [], hasMore: false, next_cursor: null }

  // Log errors for monitoring but don't break the page
  if (topicsResult.status === 'rejected') {
    console.error('Failed to fetch topics:', topicsResult.reason)
  }
  if (yearsResult.status === 'rejected') {
    console.error('Failed to fetch available years:', yearsResult.reason)
  }
  if (questionsResult.status === 'rejected') {
    console.error('Failed to fetch initial questions:', questionsResult.reason)
  }

  return (
    <SidebarProvider defaultOpen>
      <MobileNavbar />
      <ExamSidebar subject={subject} topics={topics} years={years} filters={filters} />
      <FloatingSidebarTrigger />
      <SidebarInset>
        <main className="min-h-screen bg-exam-background pt-14 lg:pt-0">
          <div className="px-8 py-8">
            <div className="mx-auto max-w-4xl space-y-8">
              <h1 className="text-[40px] font-bold text-exam-neutral-dark">
                {subject.name} - {subject.level} Level
              </h1>

              <FilterBadges topics={topics} filters={filters} />
              
              {(filters.searchTerms || filters.topicIds?.length || filters.years?.length) && (
                <Separator className="bg-exam-text-muted/30" />
              )}

              <QuestionList 
                initialData={initialData}
                filters={filters}
              />
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
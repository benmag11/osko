import { notFound } from 'next/navigation'
import {
  getSubjectBySlug,
  getTopics,
  getAvailableYears,
  getAvailableQuestionNumbers,
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
import { FilteredQuestionsView } from '@/components/questions/filtered-questions-view'
import { FilterProvider } from '@/components/providers/filter-provider'

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
  const [topicsResult, yearsResult, questionNumbersResult, questionsResult] = await Promise.allSettled([
    getTopics(subject.id),
    getAvailableYears(subject.id),
    getAvailableQuestionNumbers(subject.id),
    searchQuestions(filters)
  ])

  // Extract data with proper error handling
  const topics = topicsResult.status === 'fulfilled' ? topicsResult.value : []
  const years = yearsResult.status === 'fulfilled' ? yearsResult.value : []
  const questionNumbers = questionNumbersResult.status === 'fulfilled' ? questionNumbersResult.value : []
  const initialData = questionsResult.status === 'fulfilled' 
    ? questionsResult.value 
    : { questions: [], hasMore: false, next_cursor: null, total_count: 0 }

  // Log errors for monitoring but don't break the page
  if (topicsResult.status === 'rejected') {
    console.error('Failed to fetch topics:', topicsResult.reason)
  }
  if (yearsResult.status === 'rejected') {
    console.error('Failed to fetch available years:', yearsResult.reason)
  }
  if (questionNumbersResult.status === 'rejected') {
    console.error('Failed to fetch available question numbers:', questionNumbersResult.reason)
  }
  if (questionsResult.status === 'rejected') {
    console.error('Failed to fetch initial questions:', questionsResult.reason)
  }

  return (
    <FilterProvider initialFilters={filters}>
      <SidebarProvider defaultOpen>
        <MobileNavbar />
        <ExamSidebar subject={subject} topics={topics} years={years} questionNumbers={questionNumbers} />
        <FloatingSidebarTrigger />
        <SidebarInset>
          <main className="min-h-screen bg-cream-50 pt-14 lg:pt-0">
            <div className="px-8 py-8">
              <div className="mx-auto max-w-4xl space-y-8">
                <FilteredQuestionsView
                  topics={topics}
                  initialData={initialData}
                />
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </FilterProvider>
  )
}
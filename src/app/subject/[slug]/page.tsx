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

  // Fetch topics and years with individual error handling
  let topics: Awaited<ReturnType<typeof getTopics>> = []
  let years: Awaited<ReturnType<typeof getAvailableYears>> = []
  
  try {
    topics = await getTopics(subject.id)
  } catch (error) {
    console.error('Failed to fetch topics:', error)
    topics = [] // Fallback to empty array
  }
  
  try {
    years = await getAvailableYears(subject.id)
  } catch (error) {
    console.error('Failed to fetch available years:', error)
    years = [] // Fallback to empty array
  }

  const filters = parseSearchParams(resolvedSearchParams, subject.id)
  const initialData = await searchQuestions(filters)

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
              
              {(filters.searchTerm || filters.topicIds?.length || filters.years?.length) && (
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
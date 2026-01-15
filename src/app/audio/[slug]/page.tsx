import { notFound } from 'next/navigation'
import {
  getSubjectBySlug,
} from '@/lib/supabase/queries'
import {
  getAudioTopics,
  getAudioAvailableYears,
  searchAudioQuestions,
} from '@/lib/supabase/audio-queries'
import { parseSearchParams } from '@/lib/utils/url-filters'
import { AudioSidebarProvider, AudioSidebar, AudioSidebarAwareMain } from '@/components/sidebar'
import { AudioMobileNavbar } from '@/components/layout/audio-mobile-navbar'
import { FilteredAudioView } from '@/components/audio/filtered-audio-view'
import { FilterProvider } from '@/components/providers/filter-provider'
import { AudioNavigationProvider } from '@/components/providers/audio-navigation-provider'
import type { AudioFilters } from '@/lib/types/database'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * Audio viewer page
 *
 * Similar to the subject page but:
 * - Uses AudioSidebar instead of NormalSidebar
 * - Shows audio questions with transcript buttons
 * - No question number filtering
 */
export default async function AudioSubjectPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const subject = await getSubjectBySlug(resolvedParams.slug)

  if (!subject) {
    notFound()
  }

  // Parse filters early (note: audio filters don't include questionNumbers)
  const baseFilters = parseSearchParams(resolvedSearchParams, subject.id)
  const filters: AudioFilters = {
    subjectId: baseFilters.subjectId,
    searchTerms: baseFilters.searchTerms,
    years: baseFilters.years,
    topicIds: baseFilters.topicIds,
    examTypes: baseFilters.examTypes,
    // No questionNumbers for audio
  }

  // Fetch all data in parallel for optimal performance
  const [topicsResult, yearsResult, questionsResult] = await Promise.allSettled([
    getAudioTopics(subject.id),
    getAudioAvailableYears(subject.id),
    searchAudioQuestions(filters)
  ])

  // Extract data with proper error handling
  const topics = topicsResult.status === 'fulfilled' ? topicsResult.value : []
  const years = yearsResult.status === 'fulfilled' ? yearsResult.value : []
  const initialData = questionsResult.status === 'fulfilled'
    ? questionsResult.value
    : { questions: [], hasMore: false, next_cursor: null, total_count: 0 }

  // Log errors for monitoring but don't break the page
  if (topicsResult.status === 'rejected') {
    console.error('Failed to fetch audio topics:', topicsResult.reason)
  }
  if (yearsResult.status === 'rejected') {
    console.error('Failed to fetch audio available years:', yearsResult.reason)
  }
  if (questionsResult.status === 'rejected') {
    console.error('Failed to fetch initial audio questions:', questionsResult.reason)
  }

  return (
    <FilterProvider initialFilters={filters}>
      <AudioNavigationProvider>
        <AudioSidebarProvider defaultPanel="topics">
          <AudioMobileNavbar />
          <AudioSidebar
            subject={subject}
            topics={topics}
            years={years}
          />
          <AudioSidebarAwareMain>
            <div className="px-8 py-8">
              <div className="mx-auto w-full">
                <FilteredAudioView
                  topics={topics}
                  initialData={initialData}
                />
              </div>
            </div>
          </AudioSidebarAwareMain>
        </AudioSidebarProvider>
      </AudioNavigationProvider>
    </FilterProvider>
  )
}

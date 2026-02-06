import { notFound } from 'next/navigation'
import Link from 'next/link'
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
  let subject
  try {
    subject = await getSubjectBySlug(resolvedParams.slug)
  } catch {
    notFound()
  }

  if (!subject) {
    notFound()
  }

  /* ──── TEMPORARY: Irish listening under construction ────
     Remove this entire block once Irish audio is ready */
  if (subject.name === 'Irish') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-bg px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-6xl">🔧</div>
          <h1 className="text-3xl font-serif text-warm-text-secondary">
            Under Construction
          </h1>
          <p className="text-warm-text-muted text-lg leading-relaxed">
            We&apos;re fixing up the Irish listening section. It&apos;ll be back up tomorrow!
          </p>
          <p className="text-warm-text-muted">
            In the meantime, why not try out one of the other language subjects?
          </p>
          <Link
            href="/dashboard/listening"
            className="inline-block mt-4 px-6 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
          >
            Back to Listening
          </Link>
        </div>
      </div>
    )
  }
  /* ──── END TEMPORARY ──── */

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

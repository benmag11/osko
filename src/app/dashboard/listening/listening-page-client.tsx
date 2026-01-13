'use client'

import { DashboardPage } from '@/components/layout/dashboard-page'
import { SubjectCardGrid, type SubjectWithSlug } from '@/components/shared/subject-card-grid'

interface ListeningPageClientProps {
  userName: string
  subjects: SubjectWithSlug[]
}

export function ListeningPageClient({ userName, subjects }: ListeningPageClientProps) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const hasSubjects = subjects.length > 0

  return (
    <DashboardPage maxWidth="max-w-6xl">
      <div className="mb-12">
        <h1 className="text-6xl font-serif font-normal text-warm-text-secondary mb-2">
          {getGreeting()}, master {userName}.
        </h1>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-sans font-normal text-warm-text-muted">
          What are you listening to today?
        </h2>

        {hasSubjects ? (
          <SubjectCardGrid subjects={subjects} baseUrl="/audio" />
        ) : (
          <div className="text-center py-12 bg-stone-50 rounded-lg border border-stone-200">
            <p className="text-warm-text-muted">
              No audio content is available for your selected subjects yet.
            </p>
            <p className="text-sm text-warm-text-muted mt-2">
              Audio questions will appear here when they become available.
            </p>
          </div>
        )}
      </div>
    </DashboardPage>
  )
}

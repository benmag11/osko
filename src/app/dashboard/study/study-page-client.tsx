'use client'

import { useState } from 'react'
import { Star, ExternalLink } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { SubjectCardGrid, type SubjectWithSlug } from '@/components/shared/subject-card-grid'

interface StudyPageClientProps {
  userName: string
  subjects: SubjectWithSlug[]
}

export function StudyPageClient({ userName, subjects }: StudyPageClientProps) {
  const [editingFavourites, setEditingFavourites] = useState(false)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <DashboardPage maxWidth="max-w-6xl">
      <div className="bg-white border border-stone-200 rounded-md px-5 py-4 mb-8">
        <h3 className="text-base font-serif font-semibold text-warm-text-primary mb-1.5">
          Hi guys, go visit pointsgame.ie
        </h3>
        <div className="text-sm text-warm-text-secondary leading-relaxed space-y-1.5 mb-3">
          <p>
            Me and my friend have made a course teaching you how to actually
            study, like what methods to use, how to avoid procrastination, how
            to study maths and I have loads more tools over there.
          </p>
          <p>
            Go check it out. Thanks, best of luck in the exams, they
            ain&apos;t too far away anymore.
          </p>
        </div>
        <a
          href="https://pointsgame.ie"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-salmon-500 hover:text-salmon-600 transition-colors"
        >
          Visit pointsgame.ie
          <ExternalLink className="size-3.5" />
        </a>
      </div>

      <div className="mb-12">
        <h1 className="text-6xl font-serif font-normal text-warm-text-secondary mb-2">
          {getGreeting()}, master {userName}.
        </h1>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-sans font-normal text-warm-text-muted">
          What are you studying today?
        </h2>

        <SubjectCardGrid subjects={subjects} baseUrl="/subject" showFavourites editingFavourites={editingFavourites} />

        <button
          onClick={() => setEditingFavourites(!editingFavourites)}
          className="group mt-2 text-sm text-stone-400 hover:text-salmon-500 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Star className={`size-3.5 ${editingFavourites ? 'fill-current' : ''}`} />
          <span className="group-hover:underline underline-offset-2">
            {editingFavourites ? 'Finished' : 'Select favourites'}
          </span>
        </button>
      </div>
    </DashboardPage>
  )
}

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
      <a
        href="https://pointsgame.ie"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between gap-3 border border-salmon-300/50 border-l-[3px] border-l-salmon-400 bg-cream-200/60 rounded-sm px-4 py-2.5 mb-8 transition-colors hover:bg-cream-200"
      >
        <p className="text-sm text-warm-text-secondary leading-snug">
          <span className="font-serif font-semibold text-warm-text-primary">pointsgame.ie</span>
          <span className="mx-1.5 text-stone-300">|</span>
          A study course me and my friend made — methods, motivation, maths &amp; more.
        </p>
        <ExternalLink className="size-3.5 shrink-0 text-warm-text-muted group-hover:text-salmon-500 transition-colors" />
      </a>

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

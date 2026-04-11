'use client'

import { useState, useEffect } from 'react'
import { Star, ExternalLink } from 'lucide-react'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { SubjectCardGrid, type SubjectWithSlug } from '@/components/shared/subject-card-grid'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const PROMO_DISMISSED_KEY = 'pointsgame-promo-dismissed'

interface StudyPageClientProps {
  userName: string
  subjects: SubjectWithSlug[]
}

export function StudyPageClient({ userName, subjects }: StudyPageClientProps) {
  const [editingFavourites, setEditingFavourites] = useState(false)
  const [promoOpen, setPromoOpen] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(PROMO_DISMISSED_KEY) !== 'true') {
        setPromoOpen(true)
      }
    } catch {
      // localStorage unavailable
    }
  }, [])

  const handlePromoDismiss = () => {
    setPromoOpen(false)
    try {
      localStorage.setItem(PROMO_DISMISSED_KEY, 'true')
    } catch {
      // localStorage unavailable
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <DashboardPage maxWidth="max-w-6xl">
      <Dialog open={promoOpen} onOpenChange={(open) => { if (!open) handlePromoDismiss() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Hi guys, go visit pointsgame.ie
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm text-warm-text-secondary leading-relaxed">
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

          <DialogFooter>
            <Button variant="outline" onClick={handlePromoDismiss}>
              Dismiss
            </Button>
            <Button variant="primary" size="lg" asChild>
              <a
                href="https://pointsgame.ie"
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit pointsgame.ie
                <ExternalLink className="ml-1.5 size-4" />
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { getSubjectIcon } from '@/lib/utils/subject-icons'
import { isLcvpSubject } from '@/lib/utils/points-calculator'
import { createClient } from '@/lib/supabase/client'
import { useUserProfile } from '@/lib/hooks/use-user-profile'
import { queryKeys } from '@/lib/queries/query-keys'

export interface SubjectWithSlug {
  id: string
  name: string
  level: string
  slug: string
  isFavourite?: boolean
}

interface SubjectCardGridProps {
  subjects: SubjectWithSlug[]
  /** Base URL for subject links (e.g., '/subject' or '/audio') */
  baseUrl: string
  /** Enable favourite state tracking and favourite-first sorting (default: false) */
  showFavourites?: boolean
  /** Show star buttons for editing favourites (default: false) */
  editingFavourites?: boolean
}

/**
 * Reusable grid of subject cards for Study and Listening pages
 * Supports optional favourite toggling with optimistic local state
 */
export function SubjectCardGrid({ subjects, baseUrl, showFavourites = false, editingFavourites = false }: SubjectCardGridProps) {
  const { user } = useUserProfile()
  const queryClient = useQueryClient()

  // Local state for instant optimistic updates (reorder without waiting for DB)
  const [favourites, setFavourites] = useState<Record<string, boolean>>(() =>
    showFavourites
      ? Object.fromEntries(subjects.map(s => [s.id, s.isFavourite ?? false]))
      : {}
  )

  // Sync local state when props change (e.g. after navigation or cache update)
  useEffect(() => {
    if (showFavourites) {
      setFavourites(Object.fromEntries(subjects.map(s => [s.id, s.isFavourite ?? false])))
    }
  }, [subjects, showFavourites])

  // Sort: favourites first (when enabled), then alphabetical by name, then by level
  const sortedSubjects = useMemo(() =>
    [...subjects].sort((a, b) => {
      if (showFavourites) {
        const aFav = favourites[a.id] ?? false
        const bFav = favourites[b.id] ?? false
        if (aFav !== bFav) return aFav ? -1 : 1
      }
      return a.name.localeCompare(b.name) || a.level.localeCompare(b.level)
    }),
    [subjects, favourites, showFavourites]
  )

  const toggleFavourite = useCallback(async (subjectId: string) => {
    const newValue = !favourites[subjectId]

    // Optimistic local update — instant visual reorder
    setFavourites(prev => ({ ...prev, [subjectId]: newValue }))

    // Background DB update via direct Supabase client (RLS allows it)
    const supabase = createClient()
    const { error } = await supabase
      .from('user_subjects')
      .update({ is_favourite: newValue })
      .eq('subject_id', subjectId)
      .eq('user_id', user?.id ?? '')

    if (error) {
      // Revert on failure
      console.error('Failed to toggle favourite:', error)
      setFavourites(prev => ({ ...prev, [subjectId]: !newValue }))
      return
    }

    // Invalidate React Query cache so sidebar stays in sync
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.subjects(user.id) })
    }
  }, [favourites, user?.id, queryClient])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedSubjects.map((subject) => {
        const Icon = getSubjectIcon(subject.name)
        const isFav = showFavourites ? (favourites[subject.id] ?? false) : false

        return (
          <Link
            key={subject.id}
            href={`${baseUrl}/${subject.slug}`}
            className="block group/card"
          >
            <Card
              className="p-4 bg-cream-100 border-2 border-stone-300 group-hover/card:border-stone-500 group-hover/card:bg-white transition-colors cursor-pointer"
            >
              <div className="flex items-start space-x-3">
                <div className="p-2.5 bg-exam-background rounded-lg">
                  <Icon className="h-7 w-7 text-exam-neutral group-hover/card:text-stone-600 transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-exam-text-primary">
                    {subject.name}
                  </h3>
                  <p className="text-sm text-exam-text-muted">
                    {isLcvpSubject(subject.name) ? 'Common Level' : `${subject.level} Level`}
                  </p>
                </div>
                {(editingFavourites || isFav) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleFavourite(subject.id)
                    }}
                    className="p-1.5 self-start cursor-pointer"
                    aria-label={isFav ? `Remove ${subject.name} from favourites` : `Add ${subject.name} to favourites`}
                  >
                    <Star
                      className={`h-4 w-4 transition-colors duration-200 ${
                        isFav
                          ? 'text-amber-400 fill-amber-400 hover:text-amber-500 hover:fill-amber-500'
                          : 'text-stone-300 hover:text-amber-400'
                      }`}
                    />
                  </button>
                )}
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

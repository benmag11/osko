'use client'

import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { getSubjectIcon } from '@/lib/utils/subject-icons'

export interface SubjectWithSlug {
  id: string
  name: string
  level: string
  slug: string
}

interface SubjectCardGridProps {
  subjects: SubjectWithSlug[]
  /** Base URL for subject links (e.g., '/subject' or '/audio') */
  baseUrl: string
}

/**
 * Reusable grid of subject cards for Study and Listening pages
 */
export function SubjectCardGrid({ subjects, baseUrl }: SubjectCardGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {subjects.map((subject) => {
        const Icon = getSubjectIcon(subject.name)

        return (
          <Link
            key={subject.id}
            href={`${baseUrl}/${subject.slug}`}
            className="block group"
          >
            <Card
              className="p-4 bg-cream-100 border-2 border-stone-300 group-hover:border-stone-500 group-hover:bg-white transition-colors cursor-pointer"
            >
              <div className="flex items-start space-x-3">
                <div className="p-2.5 bg-exam-background rounded-lg">
                  <Icon className="h-7 w-7 text-exam-neutral group-hover:text-stone-600 transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-exam-text-primary">
                    {subject.name}
                  </h3>
                  <p className="text-sm text-exam-text-muted">
                    {subject.level} Level
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

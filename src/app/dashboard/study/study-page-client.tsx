'use client'

import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { getSubjectIcon } from '@/lib/utils/subject-icons'

interface SubjectWithSlug {
  id: string
  name: string
  level: string
  slug: string
}

interface StudyPageClientProps {
  userName: string
  subjects: SubjectWithSlug[]
}

export function StudyPageClient({ userName, subjects }: StudyPageClientProps) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="flex-1 bg-cream-50">
      <div className="px-8 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12">
            <h1 className="text-4xl font-serif font-bold text-warm-text-primary mb-2">
              {getGreeting()}, {userName}
            </h1>
            <p className="text-lg font-sans text-warm-text-secondary">
              What are you studying today?
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-serif font-semibold text-warm-text-primary">
              Your subjects
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => {
                const Icon = getSubjectIcon(subject.name)
                
                return (
                  <Link 
                    key={subject.id}
                    href={`/subject/${subject.slug}`}
                    className="block"
                  >
                    <Card 
                      className="p-6 bg-cream-100 border-stone-200 hover:border-stone-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-exam-background rounded-lg">
                          <Icon className="h-6 w-6 text-exam-neutral" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-exam-text-primary">
                            {subject.name}
                          </h3>
                          <p className="text-sm text-exam-text-muted mt-1">
                            {subject.level} Level
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
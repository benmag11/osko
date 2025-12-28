'use client'

import { useRouter } from 'next/navigation'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { getSubjectIcon } from '@/lib/utils/subject-icons'
import { useUserSubjects } from '@/lib/hooks/use-user-subjects'
import { useUserProfile } from '@/lib/hooks/use-user-profile'
import { cn } from '@/lib/utils'
import type { Subject } from '@/lib/types/database'

interface SubjectsPanelProps {
  currentSubject: Subject
}

export function SubjectsPanel({ currentSubject }: SubjectsPanelProps) {
  const router = useRouter()
  const { user } = useUserProfile()
  const { subjects, isLoading } = useUserSubjects(user?.id)

  // Sort subjects alphabetically by name
  const sortedSubjects = [...subjects].sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  const handleSubjectClick = (slug: string) => {
    router.push(`/subject/${slug}`)
  }

  return (
    <ScrollArea className="h-full">
      {isLoading ? (
        // Loading skeletons
        <div className="px-3 py-1 space-y-0.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2.5 py-2 px-2">
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-4 w-32 flex-1" />
            </div>
          ))}
        </div>
      ) : sortedSubjects.length === 0 ? (
        // Empty state
        <div className="px-4 py-8 text-sm text-stone-400 text-center">
          No subjects enrolled
        </div>
      ) : (
        // Subject list
        <div className="px-1 py-0.5">
          {sortedSubjects.map((subject) => {
            const Icon = getSubjectIcon(subject.name)
            const isActive = currentSubject.id === subject.id
            const isHigher = subject.level === 'Higher'

            return (
              <button
                key={subject.id}
                onClick={() => handleSubjectClick(subject.slug)}
                className={cn(
                  'flex items-center gap-2.5 w-full px-3 py-2 rounded-md transition-colors text-left cursor-pointer',
                  isActive ? 'bg-stone-50' : 'hover:bg-stone-100'
                )}
              >
                {/* Subject icon */}
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-md shrink-0 transition-colors border-[1.5px]',
                    isActive
                      ? 'bg-gradient-to-br from-salmon-500 to-salmon-600 border-salmon-600'
                      : 'bg-white border-stone-300'
                  )}
                >
                  <Icon className={cn(
                    "h-4 w-4",
                    isActive ? "text-white" : "text-stone-600"
                  )} />
                </div>

                {/* Subject name and level - single line */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span
                    className={cn(
                      'text-sm truncate',
                      isActive ? 'font-semibold text-stone-800' : 'font-medium text-stone-600'
                    )}
                  >
                    {subject.name}
                  </span>
                  <span
                    className={cn(
                      'text-sm shrink-0',
                      isHigher ? 'text-salmon-500' : 'text-sky-500'
                    )}
                  >
                    ({isHigher ? 'H' : 'O'})
                  </span>
                  {isActive && (
                    <div className="h-1.5 w-1.5 rounded-full bg-salmon-500 animate-pulse shrink-0" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </ScrollArea>
  )
}

'use client'

import { Home } from 'lucide-react'
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

  const handleDashboardClick = () => {
    router.push('/dashboard/study')
  }

  const handleSubjectClick = (slug: string) => {
    router.push(`/subject/${slug}`)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Back to Dashboard */}
      <button
        onClick={handleDashboardClick}
        className="flex items-center gap-2.5 px-3 py-2.5 mx-1 rounded-md transition-colors hover:bg-stone-50"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-stone-100">
          <Home className="h-3.5 w-3.5 text-stone-500" />
        </div>
        <span className="text-sm font-medium text-stone-700">Back to dashboard</span>
      </button>

      {/* Divider */}
      <div className="mx-3 my-2 h-px bg-stone-100" />

      {/* My Subjects Label */}
      <div className="px-4 py-1.5">
        <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
          My Subjects
        </span>
      </div>

      {/* Subjects List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="px-3 py-1 space-y-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2.5 py-2 px-2">
                <Skeleton className="h-7 w-7 rounded-md" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <div className="px-4 py-8 text-sm text-stone-400 text-center">
            No subjects enrolled
          </div>
        ) : (
          <div className="px-1 py-0.5">
            {subjects.map((subject) => {
              const Icon = getSubjectIcon(subject.name)
              const isActive = currentSubject.id === subject.id

              return (
                <button
                  key={subject.id}
                  onClick={() => handleSubjectClick(subject.slug)}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-3 py-2 mx-0 rounded-md transition-colors text-left',
                    isActive
                      ? 'bg-stone-50'
                      : 'hover:bg-stone-50/50'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-md transition-colors shrink-0',
                      isActive
                        ? 'bg-gradient-to-br from-salmon-500 to-salmon-600 text-white'
                        : 'bg-stone-100 text-stone-500'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'text-sm truncate leading-tight',
                          isActive ? 'font-semibold text-stone-800' : 'font-medium text-stone-600'
                        )}
                      >
                        {subject.name}
                      </span>
                      {isActive && (
                        <div className="h-1.5 w-1.5 rounded-full bg-salmon-500 animate-pulse shrink-0" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-xs leading-tight',
                        isActive ? 'text-salmon-600' : 'text-stone-400'
                      )}
                    >
                      {subject.level} Level
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

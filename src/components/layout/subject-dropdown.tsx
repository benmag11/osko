'use client'

import { Home } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { getSubjectIcon } from '@/lib/utils/subject-icons'
import { cn } from '@/lib/utils'
import { isLcvpSubject } from '@/lib/utils/points-calculator'
import type { Subject } from '@/lib/types/database'

interface SubjectWithSlug extends Subject {
  slug: string
}

interface SubjectDropdownProps {
  subjects: SubjectWithSlug[]
  currentSubject: Subject
  isLoading: boolean
  isMobile?: boolean
}

export function SubjectDropdown({ 
  subjects, 
  currentSubject, 
  isLoading,
  isMobile = false 
}: SubjectDropdownProps) {
  const router = useRouter()
  
  const handleDashboardClick = () => {
    router.push('/dashboard/study')
  }
  
  const handleSubjectClick = (slug: string) => {
    router.push(`/subject/${slug}`)
  }
  
  return (
    <DropdownMenuContent
      className="w-[--radix-dropdown-menu-trigger-width] min-w-[240px] max-w-[320px] rounded-lg"
      align="start"
      side={isMobile ? "bottom" : "right"}
      sideOffset={4}
    >
      {/* Back to Dashboard */}
      <DropdownMenuItem
        onClick={handleDashboardClick}
        className="gap-2.5 px-3 cursor-pointer"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-stone-100">
          <Home className="h-3.5 w-3.5 text-warm-text-muted" />
        </div>
        <span className="text-sm font-medium font-sans text-warm-text-primary">Back to dashboard</span>
      </DropdownMenuItem>
      
      <DropdownMenuSeparator className="my-1.5" />
      
      {/* My Subjects Section */}
      <DropdownMenuLabel className="px-3 py-1 text-xs font-sans font-semibold text-warm-text-muted uppercase tracking-wider">
        My Subjects
      </DropdownMenuLabel>
      
      <ScrollArea className="max-h-[320px]">
        {isLoading ? (
          <div className="px-3 py-1 space-y-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2.5 py-1">
                <Skeleton className="h-6 w-6 rounded-md" />
                <div className="space-y-0.5 flex-1">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <div className="px-3 py-4 text-sm text-warm-text-muted text-center font-sans">
            No subjects enrolled
          </div>
        ) : (
          <div className="py-0.5">
            {subjects.map((subject) => {
              const Icon = getSubjectIcon(subject.name)
              const isActive = currentSubject.id === subject.id
              
              return (
                <DropdownMenuItem
                  key={subject.id}
                  onClick={() => handleSubjectClick(subject.slug)}
                  className={cn(
                    "gap-2.5 px-3 cursor-pointer",
                    isActive &&
                      "bg-gradient-to-r from-cream-100 to-cream-200 text-warm-text-primary"
                  )}
                >
                  <div className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-md transition-colors",
                    isActive ?
                      "bg-gradient-to-br from-salmon-500 to-salmon-600" :
                      "bg-cream-200"
                  )}>
                    <Icon className={cn(
                      "h-3.5 w-3.5",
                      isActive ? "text-cream-50" : "text-warm-text-secondary"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "text-sm font-medium truncate leading-tight",
                        isActive ? "text-warm-text-primary font-semibold" : "text-warm-text-secondary"
                      )}>
                        {subject.name}
                      </span>
                      {isActive && (
                        <div className="h-1.5 w-1.5 rounded-full bg-salmon-500 animate-pulse" />
                      )}
                    </div>
                    <span className={cn(
                      "text-xs leading-tight",
                      isActive ? "text-salmon-600" : "text-warm-text-muted"
                    )}>
                      {isLcvpSubject(subject.name) ? 'Common Level' : `${subject.level} Level`}
                    </span>
                  </div>
                </DropdownMenuItem>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </DropdownMenuContent>
  )
}
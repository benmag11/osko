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
        className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100">
          <Home className="h-3.5 w-3.5 text-gray-600" />
        </div>
        <span className="text-sm font-medium text-gray-900">Back to dashboard</span>
      </DropdownMenuItem>
      
      <DropdownMenuSeparator className="my-1.5" />
      
      {/* My Subjects Section */}
      <DropdownMenuLabel className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
          <div className="px-3 py-4 text-sm text-gray-500 text-center">
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
                    "flex items-center gap-2.5 px-3 py-1.5 cursor-pointer transition-all",
                    isActive ? 
                      "bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-900" : 
                      "hover:bg-gray-50"
                  )}
                >
                  <div className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-md transition-colors",
                    isActive ? 
                      "bg-gradient-to-br from-blue-500 to-blue-600 text-white" : 
                      "bg-gray-100"
                  )}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "text-sm font-medium truncate leading-tight",
                        isActive ? "text-blue-900" : "text-gray-900"
                      )}>
                        {subject.name}
                      </span>
                      {isActive && (
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                      )}
                    </div>
                    <span className={cn(
                      "text-xs leading-tight",
                      isActive ? "text-blue-700" : "text-gray-500"
                    )}>
                      {subject.level} Level
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
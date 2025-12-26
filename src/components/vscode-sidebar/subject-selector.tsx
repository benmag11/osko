'use client'

import { ChevronsUpDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SubjectDropdown } from '@/components/layout/subject-dropdown'
import { useUserSubjects } from '@/lib/hooks/use-user-subjects'
import { useUserProfile } from '@/lib/hooks/use-user-profile'
import { getSubjectIcon } from '@/lib/utils/subject-icons'
import { useVSCodeSidebar } from './sidebar-context'
import type { Subject } from '@/lib/types/database'

interface SubjectSelectorProps {
  subject: Subject
}

export function SubjectSelector({ subject }: SubjectSelectorProps) {
  const { isMobile } = useVSCodeSidebar()
  const { user } = useUserProfile()
  const { subjects, isLoading } = useUserSubjects(user?.id)

  const SubjectIcon = getSubjectIcon(subject.name)

  return (
    <div className="p-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-cream-200/70 data-[state=open]:bg-cream-200/70"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-salmon-500 text-cream-50">
              <SubjectIcon className="h-4 w-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
              <span className="truncate font-serif font-semibold text-warm-text-primary">
                {subject.name}
              </span>
              <span className="truncate text-xs font-sans text-warm-text-muted">
                {subject.level} Level
              </span>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-warm-text-muted" />
          </button>
        </DropdownMenuTrigger>
        <SubjectDropdown
          subjects={subjects}
          currentSubject={subject}
          isLoading={isLoading}
          isMobile={isMobile}
        />
      </DropdownMenu>
    </div>
  )
}

'use client'

import { ChevronDown, Star } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { getSubjectIcon } from '@/lib/utils/subject-icons'
import type { UserSubjectWithSubject } from '@/lib/types/database'

interface SubjectSelectorProps {
  subjects: UserSubjectWithSubject[]
  selectedSubjectId: string
  onSelect: (subjectId: string) => void
}

export function SubjectSelector({
  subjects,
  selectedSubjectId,
  onSelect,
}: SubjectSelectorProps) {
  const selectedSubject = subjects.find(us => us.subject_id === selectedSubjectId)
  const SelectedIcon = selectedSubject
    ? getSubjectIcon(selectedSubject.subject.name)
    : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-warm-text-primary hover:border-stone-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-salmon-500 focus-visible:ring-offset-2">
        {SelectedIcon && <SelectedIcon className="h-4 w-4 text-warm-text-muted" />}
        {selectedSubject?.subject.name ?? 'Select Subject'}
        <ChevronDown className="h-4 w-4 text-warm-text-muted" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="bg-white border-stone-300 max-w-[280px]"
      >
        {subjects.map(us => {
          const Icon = getSubjectIcon(us.subject.name)
          return (
            <DropdownMenuItem
              key={us.subject_id}
              onClick={() => onSelect(us.subject_id)}
              className={`gap-3 py-2 focus:bg-stone-100 ${selectedSubjectId === us.subject_id ? 'bg-salmon-50' : ''}`}
            >
              <Icon className="h-4 w-4 shrink-0 text-warm-text-muted" />
              <span className="flex-1 truncate">
                {us.subject.name}
              </span>
              {us.is_favourite && (
                <Star className="h-2.5 w-2.5 shrink-0 text-amber-400 fill-amber-400" />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

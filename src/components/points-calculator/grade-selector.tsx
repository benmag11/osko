'use client'

import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isAtGradeBoundary } from '@/lib/utils/points-calculator'
import type { Grade } from '@/lib/types/database'

interface GradeSelectorProps {
  grade: Grade
  onGradeChange: (direction: 'up' | 'down') => void
  disabled?: boolean
}

export function GradeSelector({
  grade,
  onGradeChange,
  disabled = false,
}: GradeSelectorProps) {
  const canGoUp = !isAtGradeBoundary(grade, 'up')
  const canGoDown = !isAtGradeBoundary(grade, 'down')

  return (
    <div className="flex items-center gap-1">
      {/* Up arrow - improve grade */}
      <button
        type="button"
        onClick={() => onGradeChange('up')}
        disabled={disabled || !canGoUp}
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded transition-colors',
          canGoUp && !disabled
            ? 'text-stone-600 hover:bg-stone-100 hover:text-stone-800'
            : 'text-stone-300 cursor-not-allowed'
        )}
        aria-label="Improve grade"
      >
        <ChevronUp className="h-4 w-4" />
      </button>

      {/* Grade display */}
      <span className="w-8 text-center font-medium text-stone-900">
        {grade}
      </span>

      {/* Down arrow - decrease grade */}
      <button
        type="button"
        onClick={() => onGradeChange('down')}
        disabled={disabled || !canGoDown}
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded transition-colors',
          canGoDown && !disabled
            ? 'text-stone-600 hover:bg-stone-100 hover:text-stone-800'
            : 'text-stone-300 cursor-not-allowed'
        )}
        aria-label="Decrease grade"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  )
}

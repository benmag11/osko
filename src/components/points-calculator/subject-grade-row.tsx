'use client'

import { GradeSelector } from './grade-selector'
import { cn } from '@/lib/utils'
import type { Grade } from '@/lib/types/database'

interface SubjectGradeRowProps {
  subjectName: string
  level: 'Higher' | 'Ordinary' | 'Foundation'
  grade: Grade
  basePoints: number
  mathsBonus: number
  isInBest6: boolean
  onGradeChange: (direction: 'up' | 'down') => void
  isExperimenting?: boolean
  onLevelToggle?: () => void
}

export function SubjectGradeRow({
  subjectName,
  level,
  grade,
  basePoints,
  mathsBonus,
  isInBest6,
  onGradeChange,
  isExperimenting = false,
  onLevelToggle,
}: SubjectGradeRowProps) {
  const totalPoints = basePoints + mathsBonus
  const levelAbbrev = level === 'Higher' ? 'H' : level === 'Ordinary' ? 'O' : 'F'

  return (
    <div
      className={cn(
        'flex items-center justify-between pl-5 pr-3 py-2 transition-colors border-l-[3px]',
        isInBest6
          ? 'bg-white border-l-stone-600'
          : 'bg-stone-200/60 border-l-transparent'
      )}
    >
      {/* Subject info */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Level indicator */}
        {isExperimenting && level !== 'Foundation' ? (
          <button
            onClick={onLevelToggle}
            className={cn(
              'text-sm font-semibold px-1.5 py-0.5 rounded transition-all',
              'hover:bg-stone-200 active:scale-95 cursor-pointer',
              'underline decoration-double decoration-stone-600 underline-offset-2 hover:decoration-stone-700',
              level === 'Higher' ? 'text-salmon-500' : 'text-sky-500'
            )}
            title={`Switch to ${level === 'Higher' ? 'Ordinary' : 'Higher'}`}
          >
            {levelAbbrev}
          </button>
        ) : (
          <span
            className={cn(
              'text-sm font-semibold',
              level === 'Higher'
                ? 'text-salmon-500'
                : 'text-sky-500'
            )}
          >
            {levelAbbrev}
          </span>
        )}

        {/* Subject name */}
        <span
          className={cn(
            'truncate font-medium',
            isInBest6 ? 'text-stone-900' : 'text-stone-600'
          )}
        >
          {subjectName}
        </span>
      </div>

      {/* Grade selector and points */}
      <div className="flex items-center gap-3">
        <GradeSelector grade={grade} onGradeChange={onGradeChange} />

        {/* Points display */}
        <div className="flex items-baseline gap-1 min-w-[70px] justify-end">
          <span
            className={cn(
              'text-base font-semibold tabular-nums',
              isInBest6 ? 'text-stone-900' : 'text-stone-500'
            )}
          >
            {totalPoints}
          </span>
          {mathsBonus > 0 && (
            <span className="text-xs font-medium text-green-600">
              +{mathsBonus}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

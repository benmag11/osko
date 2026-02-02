'use client'

import { useMemo } from 'react'
import type { Grade } from '@/lib/types/database'

const GRADE_ORDER: Grade[] = [
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8',
  'O1', 'O2', 'O3', 'O4', 'O5', 'O6', 'O7', 'O8',
]

interface PointsSummaryProps {
  best6Total: number
  showBest6: boolean
  grades: Grade[]
}

export function PointsSummary({
  best6Total,
  showBest6,
  grades,
}: PointsSummaryProps) {
  const gradeCounts = useMemo(() => {
    const counts = new Map<Grade, number>()
    for (const grade of grades) {
      counts.set(grade, (counts.get(grade) ?? 0) + 1)
    }
    return GRADE_ORDER
      .filter(g => (counts.get(g) ?? 0) > 0)
      .map(g => ({ grade: g, count: counts.get(g)! }))
  }, [grades])

  return (
    <div className="rounded-sm border border-stone-400 bg-white overflow-hidden">
      {/* Accent bar */}
      <div className="h-1 bg-stone-600" />
      <div className="p-4">
        <p className="text-sm font-medium text-stone-700">
          {showBest6 ? 'CAO Points (Best 6)' : 'Total Points'}
        </p>
        <p
          className="mt-1 text-4xl font-bold text-salmon-500 tabular-nums"
          style={{ textShadow: '0 0 20px rgba(217,119,87,0.2)' }}
        >
          {best6Total}
        </p>

        {gradeCounts.length > 0 && (
          <div className="mt-3 pt-3 border-t border-stone-400">
            <p className="text-sm font-medium text-stone-700">Grade Counts</p>
            <div className="mt-1.5 flex flex-col gap-0.5">
              {gradeCounts.map(({ grade, count }) => (
                <span key={grade} className="text-sm text-stone-600">
                  {grade}: <span className="font-semibold text-stone-900">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

interface PointsSummaryProps {
  totalSubjects: number
  allSubjectsTotal: number
  best6Total: number
}

export function PointsSummary({
  totalSubjects,
  allSubjectsTotal,
  best6Total,
}: PointsSummaryProps) {
  const showBest6 = totalSubjects > 6

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
          {showBest6 ? best6Total : allSubjectsTotal}
        </p>

        {showBest6 && (
          <div className="mt-3 pt-3 border-t border-stone-400">
            <p className="text-sm text-stone-700">
              All {totalSubjects} subjects
            </p>
            <p className="mt-0.5 text-lg font-medium text-stone-800 tabular-nums">
              {allSubjectsTotal}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

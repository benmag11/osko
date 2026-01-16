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
    <div className="rounded-sm border border-[#EEEDE5] bg-white overflow-hidden">
      {/* Accent bar */}
      <div className="h-1 bg-stone-400" />
      <div className="p-4">
        <p className="text-sm font-medium text-stone-500">
          {showBest6 ? 'CAO Points (Best 6)' : 'Total Points'}
        </p>
        <p className="mt-1 text-4xl font-bold text-stone-900 tabular-nums">
          {showBest6 ? best6Total : allSubjectsTotal}
        </p>

        {showBest6 && (
          <div className="mt-3 pt-3 border-t border-stone-200">
            <p className="text-sm text-stone-500">
              All {totalSubjects} subjects
            </p>
            <p className="mt-0.5 text-lg font-medium text-stone-600 tabular-nums">
              {allSubjectsTotal}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { useFilters } from '@/components/providers/filter-provider'

interface YearsPanelProps {
  years: number[]
}

/**
 * Years panel for filtering by exam year
 * Used by both normal and audio sidebars
 */
export function YearsPanel({ years }: YearsPanelProps) {
  const { filters, toggleYear, isPending } = useFilters()

  if (years.length === 0) {
    return (
      <p className="text-sm text-stone-400 py-4 px-3 text-center">
        No years available for this subject.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 px-2">
      {years.map((year) => (
        <label
          key={year}
          className={`group flex cursor-pointer items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors duration-150 hover:bg-stone-50/50 ${
            isPending ? 'opacity-60' : ''
          }`}
        >
          <Checkbox
            checked={filters.years?.includes(year) ?? false}
            onCheckedChange={() => toggleYear(year)}
            disabled={isPending}
            className="h-4 w-4 border-stone-500 data-[state=checked]:bg-salmon-500 data-[state=checked]:border-salmon-500"
          />
          <span className="text-sm text-stone-700 transition-colors group-hover:text-stone-900">
            {year}
          </span>
        </label>
      ))}
    </div>
  )
}

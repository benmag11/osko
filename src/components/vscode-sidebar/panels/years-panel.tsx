'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { useFilters } from '@/components/providers/filter-provider'

interface YearsPanelProps {
  years: number[]
}

export function YearsPanel({ years }: YearsPanelProps) {
  const { filters, toggleYear, isPending } = useFilters()

  if (years.length === 0) {
    return (
      <p className="text-sm text-warm-text-muted py-2">
        No years available for this subject.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
      {years.map((year) => (
        <label
          key={year}
          className={`flex cursor-pointer items-center gap-2 px-2 py-1.5 rounded-md hover:bg-cream-200/50 transition-colors ${
            isPending ? 'opacity-70' : ''
          }`}
        >
          <Checkbox
            checked={filters.years?.includes(year) ?? false}
            onCheckedChange={() => toggleYear(year)}
            disabled={isPending}
            className="h-4 w-4 data-[state=checked]:animate-scale-in"
          />
          <span className="text-sm font-sans text-warm-text-secondary">
            {year}
          </span>
        </label>
      ))}
    </div>
  )
}

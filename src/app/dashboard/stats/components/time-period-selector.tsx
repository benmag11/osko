'use client'

import { cn } from '@/lib/utils'
import { TIME_PERIOD_OPTIONS } from '@/lib/types/stats'
import type { TimePeriod } from '@/lib/types/stats'

interface TimePeriodSelectorProps {
  value: TimePeriod
  onChange: (value: TimePeriod) => void
}

export function TimePeriodSelector({ value, onChange }: TimePeriodSelectorProps) {
  return (
    <div className="flex gap-4">
      {TIME_PERIOD_OPTIONS.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'pb-1 text-sm font-medium transition-colors',
            value === option.value
              ? 'text-salmon-500 border-b-2 border-salmon-500'
              : 'text-warm-text-muted hover:text-warm-text-primary'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

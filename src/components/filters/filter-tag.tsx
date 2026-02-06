'use client'

import { SquareX } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterTagProps {
  label: string
  onRemove: () => void
  size?: 'default' | 'sm'
}

export function FilterTag({ label, onRemove, size = 'default' }: FilterTagProps) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className={cn(
        'cursor-pointer group inline-flex items-center justify-center rounded-md border border-stone-300 bg-cream-50 font-sans font-normal text-warm-text-secondary transition-colors hover:border-stone-400 hover:bg-cream-100 hover:text-warm-text-primary',
        size === 'default' && 'gap-3 px-4 py-2 text-base',
        size === 'sm' && 'gap-1.5 px-2 py-1 text-xs'
      )}
      aria-label={`Remove ${label} filter`}
    >
      <SquareX
        className={cn(
          'text-warm-text-secondary transition-colors group-hover:text-salmon-500',
          size === 'default' && 'h-5 w-5',
          size === 'sm' && 'h-3.5 w-3.5'
        )}
      />
      {label}
    </button>
  )
}
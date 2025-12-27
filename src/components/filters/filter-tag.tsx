'use client'

import { SquareX } from 'lucide-react'

interface FilterTagProps {
  label: string
  onRemove: () => void
}

export function FilterTag({ label, onRemove }: FilterTagProps) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="cursor-pointer group inline-flex items-center justify-center gap-3 rounded-md border border-stone-300 bg-cream-50 px-4 py-2 text-base font-sans font-normal text-warm-text-secondary transition-colors hover:border-stone-400 hover:bg-cream-100 hover:text-warm-text-primary"
      aria-label={`Remove ${label} filter`}
    >
      <SquareX className="h-5 w-5 text-warm-text-secondary transition-colors group-hover:text-salmon-500" />
      {label}
    </button>
  )
}
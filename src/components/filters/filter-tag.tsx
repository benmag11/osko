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
      className="inline-flex items-center justify-center gap-2.5 rounded-md border border-[#d0d0d0] bg-[#fffefb] px-5 py-2 text-base font-normal text-[#404040] transition-colors hover:border-orange-500 hover:bg-orange-50"
      aria-label={`Remove ${label} filter`}
    >
      <SquareX className="h-5 w-5 text-[#404040]" />
      {label}
    </button>
  )
}
'use client'

import { SquareX } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FilterPillProps {
  label: string
  onRemove: () => void
}

export function FilterPill({ label, onRemove }: FilterPillProps) {
  return (
    <Button
      variant="ghost"
      onClick={onRemove}
      className="group gap-2.5 border border-filter-pill-border bg-[#fffefb] px-5 py-2 text-base font-normal text-[#404040] shadow-none transition-colors hover:border-orange-500 hover:bg-orange-50 hover:text-[#404040]"
      aria-label={`Remove ${label} filter`}
    >
      <SquareX className="h-5 w-5 text-[#404040]" />
      {label}
    </Button>
  )
}
'use client'

import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExpandHintProps {
  isVisible: boolean
}

export function ExpandHint({ isVisible }: ExpandHintProps) {
  return (
    <div
      className={cn(
        'absolute right-0 top-0 bottom-0 w-1 pointer-events-none',
        'flex items-center justify-center',
        'transition-all duration-200'
      )}
    >
      {/* Vertical glow line */}
      <div
        className={cn(
          'absolute inset-y-0 right-0 w-0.5',
          'bg-gradient-to-b from-transparent via-salmon-400/60 to-transparent',
          'transition-opacity duration-200',
          isVisible ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Floating chevron button */}
      <div
        className={cn(
          'absolute right-0 top-1/3 translate-x-1/2',
          'flex h-6 w-6 items-center justify-center rounded-full',
          'bg-white border border-stone-200 shadow-sm',
          'transition-all duration-200',
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        )}
      >
        <ChevronRight className="h-3.5 w-3.5 text-stone-600" />
      </div>
    </div>
  )
}

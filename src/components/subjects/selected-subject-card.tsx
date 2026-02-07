'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SelectedSubjectCardProps {
  subject: string
  level: 'Higher' | 'Ordinary'
  onRemove: () => void
  isLcvp?: boolean
}

export function SelectedSubjectCard({ subject, level, onRemove, isLcvp = false }: SelectedSubjectCardProps) {
  const levelIndicatorColor = level === 'Higher' ? 'bg-salmon-500' : 'bg-sky-500'

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-white hover:bg-cream-50 border border-stone-400 transition-colors">
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <p className="text-sm font-medium truncate text-warm-text-primary">{subject}</p>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLcvp ? 'bg-stone-400' : levelIndicatorColor}`} />
          <p className="text-xs text-warm-text-muted font-medium">{isLcvp ? 'Common' : level}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-7 w-7 p-0 text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SelectedSubjectCardProps {
  subject: string
  level: 'Higher' | 'Ordinary'
  onRemove: () => void
}

export function SelectedSubjectCard({ subject, level, onRemove }: SelectedSubjectCardProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[#f5f5f5] hover:bg-[#eeeeee] transition-colors group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{subject}</p>
        <p className="text-xs text-[#757575]">{level}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
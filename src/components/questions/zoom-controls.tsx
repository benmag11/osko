'use client'

import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ZoomControlsProps {
  zoom: number
  canZoomIn: boolean
  canZoomOut: boolean
  onZoomIn: () => void
  onZoomOut: () => void
}

export function ZoomControls({
  zoom,
  canZoomIn,
  canZoomOut,
  onZoomIn,
  onZoomOut,
}: ZoomControlsProps) {
  const percentLabel = `${Math.round(zoom * 100)}%`

  return (
    <div className="hidden lg:flex fixed top-24 right-10 z-40 flex-col items-center gap-3 rounded-2xl border border-stone-200 bg-white/95 p-3 shadow-md backdrop-blur">
      <span className="text-sm font-medium text-exam-text-primary">{percentLabel}</span>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Zoom in"
          onClick={onZoomIn}
          disabled={!canZoomIn}
          className="h-9 w-9"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Zoom out"
          onClick={onZoomOut}
          disabled={!canZoomOut}
          className="h-9 w-9"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

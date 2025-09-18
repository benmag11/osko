'use client'

import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ZoomControlsProps {
  canZoomIn: boolean
  canZoomOut: boolean
  onZoomIn: () => void
  onZoomOut: () => void
}

export function ZoomControls({
  canZoomIn,
  canZoomOut,
  onZoomIn,
  onZoomOut,
}: ZoomControlsProps) {
  return (
    <div className="hidden lg:flex fixed top-8 right-6 z-40 flex-col items-center gap-2 rounded border border-stone-200 bg-white/95 p-2 backdrop-blur">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Zoom in"
        onClick={onZoomIn}
        disabled={!canZoomIn}
        className="h-8 w-8"
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
        className="h-8 w-8"
      >
        <Minus className="h-4 w-4" />
      </Button>
    </div>
  )
}

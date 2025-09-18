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
    <>
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
    </>
  )
}

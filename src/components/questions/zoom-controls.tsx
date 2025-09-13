'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { useZoom } from '@/components/providers/zoom-provider'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export function ZoomControls() {
  const isMobile = useIsMobile()
  const { zoomLevel, increaseZoom, decreaseZoom, isLoading } = useZoom()
  const [isVisible, setIsVisible] = useState(false)

  // Don't render on mobile at all
  if (isMobile === true || isMobile === undefined || isLoading) {
    return null
  }

  const canZoomIn = zoomLevel < 1.0
  const canZoomOut = zoomLevel > 0.5

  return (
    <div
      className="fixed top-16 right-4 z-40"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {/* Hover trigger area - extends left to catch mouse from edge */}
      <div className="absolute -left-24 top-0 w-28 h-24" />

      {/* Controls container */}
      <div className={cn(
        "flex flex-col items-center gap-2 bg-cream-50 rounded-lg p-2 shadow-lg",
        "transition-opacity duration-200",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                onClick={increaseZoom}
                disabled={!canZoomIn}
                className="h-8 w-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Zoom in</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                onClick={decreaseZoom}
                disabled={!canZoomOut}
                className="h-8 w-8"
              >
                <Minus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Zoom out</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
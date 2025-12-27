'use client'

import { useRef, useState } from 'react'
import type { FocusEvent } from 'react'
import { ZoomIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ZoomControls } from '../zoom-controls'

interface QuestionNavigationPanelProps {
  canZoomIn: boolean
  canZoomOut: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  isScrolled: boolean
}

export function QuestionNavigationPanel({
  canZoomIn,
  canZoomOut,
  onZoomIn,
  onZoomOut,
  isScrolled,
}: QuestionNavigationPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isTriggerHover, setIsTriggerHover] = useState(false)
  const [isPanelHover, setIsPanelHover] = useState(false)
  const [isFocusWithin, setIsFocusWithin] = useState(false)

  const isOpen = isTriggerHover || isPanelHover || isFocusWithin

  const handleBlurCapture = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null
    if (!containerRef.current?.contains(next)) {
      setIsFocusWithin(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className="hidden lg:block"
      onFocusCapture={() => setIsFocusWithin(true)}
      onBlurCapture={handleBlurCapture}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Open zoom controls"
        className={cn(
          'fixed right-6 top-8 z-40 h-10 w-10 transition-all duration-300',
          isScrolled ? 'opacity-70 hover:opacity-100' : 'opacity-100',
          isOpen && 'opacity-100',
        )}
        onFocus={() => setIsFocusWithin(true)}
        onBlur={(event) => {
          if (!containerRef.current?.contains(event.relatedTarget as Node | null)) {
            setIsFocusWithin(false)
          }
        }}
        onMouseEnter={() => setIsTriggerHover(true)}
        onMouseLeave={() => setIsTriggerHover(false)}
      >
        <ZoomIn className={cn(
          "h-5 w-5 transition-colors duration-300",
          isOpen ? "text-salmon-500" : "text-stone-600"
        )} />
      </Button>

      {/* Invisible bridge to prevent panel from closing when mouse travels through gap */}
      <div
        className={cn(
          'fixed right-6 top-[4.5rem] z-40 h-3 w-36',
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        )}
        onMouseEnter={() => setIsPanelHover(true)}
        onMouseLeave={() => setIsPanelHover(false)}
        aria-hidden="true"
      />

      <div
        className={cn(
          'pointer-events-none fixed right-6 top-20 z-40 w-36 transition-all duration-300 ease-out',
          isOpen
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'translate-y-2 opacity-0'
        )}
        onMouseEnter={() => setIsPanelHover(true)}
        onMouseLeave={() => setIsPanelHover(false)}
      >
        <div className="rounded-xl border border-stone-300 bg-white p-3 shadow-[0_15px_30px_-12px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-warm-text-secondary">Zoom</span>
            <ZoomControls
              canZoomIn={canZoomIn}
              canZoomOut={canZoomOut}
              onZoomIn={onZoomIn}
              onZoomOut={onZoomOut}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

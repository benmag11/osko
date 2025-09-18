'use client'

import { useState, useEffect } from 'react'
import { ZoomControls } from './zoom-controls'
import { cn } from '@/lib/utils'

interface ScrollAwareZoomControlsProps {
  canZoomIn: boolean
  canZoomOut: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  scrollTargetRef: React.RefObject<HTMLDivElement | null>
  isScrolled: boolean
}

/**
 * Wrapper component that adds scroll-aware visibility and hover interactions to ZoomControls
 * Features:
 * - Fades out when user scrolls past the target element
 * - Reappears on hover with an expanded hit area for better UX
 * - Smooth CSS transitions for all state changes
 */
export function ScrollAwareZoomControls({
  canZoomIn,
  canZoomOut,
  onZoomIn,
  onZoomOut,
  isScrolled
}: ScrollAwareZoomControlsProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [shouldShow, setShouldShow] = useState(true)
  const [isInteracting, setIsInteracting] = useState(false)

  // Determine visibility based on scroll and hover states
  useEffect(() => {
    // Show controls when:
    // 1. Not scrolled past threshold
    // 2. User is hovering over the control area
    // 3. User is actively interacting with controls
    setShouldShow(!isScrolled || isHovered || isInteracting)
  }, [isScrolled, isHovered, isInteracting])

  return (
    <>
      {/* Invisible hover region for reappearing controls */}
      <div
        className={cn(
          "fixed top-4 right-4 z-40 h-[120px] w-[120px]",
          "pointer-events-none transition-all duration-300",
          isScrolled && !isHovered && "pointer-events-auto"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-hidden="true"
      />

      {/* Actual zoom controls with visibility transitions */}
      <div
        className={cn(
          "hidden lg:flex fixed top-8 right-6 z-40 flex-col items-center gap-2",
          "rounded border border-stone-200 bg-white/95 p-2 backdrop-blur",
          "transition-all duration-300 ease-in-out",
          shouldShow
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none"
        )}
        onMouseEnter={() => {
          setIsHovered(true)
          setIsInteracting(true)
        }}
        onMouseLeave={() => {
          setIsHovered(false)
          setIsInteracting(false)
        }}
      >
        <ZoomControls
          canZoomIn={canZoomIn}
          canZoomOut={canZoomOut}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
        />
      </div>
    </>
  )
}
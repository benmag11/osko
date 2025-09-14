'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

interface UseScrollPositionOptions {
  threshold?: number
  enabled?: boolean
}

interface ScrollPosition {
  isAtTop: boolean
  scrollY: number
}

/**
 * Performance-optimized scroll position detection hook
 * Uses requestAnimationFrame for smooth 60fps tracking
 * @param options - Configuration options
 * @returns Current scroll position state
 */
export function useScrollPosition(
  options: UseScrollPositionOptions = {}
): ScrollPosition {
  const { threshold = 10, enabled = true } = options

  const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({
    isAtTop: true,
    scrollY: 0,
  })

  // Use refs to avoid recreating functions on every render
  const rafIdRef = useRef<number | null>(null)
  const lastScrollYRef = useRef(0)

  const updateScrollPosition = useCallback(() => {
    const currentScrollY = window.scrollY

    // Only update state if the value actually changed
    if (currentScrollY !== lastScrollYRef.current) {
      lastScrollYRef.current = currentScrollY

      setScrollPosition({
        isAtTop: currentScrollY < threshold,
        scrollY: currentScrollY,
      })
    }

    rafIdRef.current = null
  }, [threshold])

  const handleScroll = useCallback(() => {
    // Cancel any pending animation frame to avoid duplicates
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
    }

    // Schedule update on next animation frame for smooth performance
    rafIdRef.current = requestAnimationFrame(updateScrollPosition)
  }, [updateScrollPosition])

  useEffect(() => {
    if (!enabled) return

    // Set initial position
    updateScrollPosition()

    // Add passive scroll listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll)

      // Cancel any pending animation frame
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [enabled, handleScroll, updateScrollPosition])

  return scrollPosition
}
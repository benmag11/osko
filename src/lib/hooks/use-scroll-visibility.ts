import { useEffect, useRef, useState, useCallback } from 'react'

interface UseScrollVisibilityOptions {
  /**
   * Threshold for triggering visibility change (0-1)
   * 0 = trigger as soon as element starts leaving viewport
   * 1 = trigger only when element completely leaves viewport
   */
  threshold?: number
  /**
   * Root margin for intersection observer
   * Positive values trigger earlier, negative values trigger later
   */
  rootMargin?: string
  /**
   * Initial visibility state
   */
  initialVisible?: boolean
  /**
   * Debounce delay in milliseconds to prevent rapid state changes
   */
  debounceMs?: number
}

interface UseScrollVisibilityReturn {
  isVisible: boolean
  targetRef: React.RefObject<HTMLDivElement | null>
  setIsVisible: (visible: boolean) => void
}

/**
 * Hook for detecting when an element scrolls out of view
 * Uses IntersectionObserver for performance optimization
 */
export function useScrollVisibility({
  threshold = 0,
  rootMargin = '0px',
  initialVisible = true,
  debounceMs = 100
}: UseScrollVisibilityOptions = {}): UseScrollVisibilityReturn {
  const [isVisible, setIsVisible] = useState(initialVisible)
  const targetRef = useRef<HTMLDivElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastVisibilityRef = useRef(initialVisible)

  const updateVisibility = useCallback((visible: boolean) => {
    if (lastVisibilityRef.current === visible) return

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setIsVisible(visible)
      lastVisibilityRef.current = visible
    }, debounceMs)
  }, [debounceMs])

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // When element is intersecting, controls should be visible
          // When element is not intersecting (scrolled past), controls should hide
          updateVisibility(entry.isIntersecting)
        })
      },
      {
        threshold,
        rootMargin
      }
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [threshold, rootMargin, updateVisibility])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  return {
    isVisible,
    targetRef,
    setIsVisible
  }
}
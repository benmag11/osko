'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useQuestionNavigation } from '@/components/providers/question-navigation-provider'

/**
 * The target position (0-indexed) for the active item in the visible list.
 * A value of 3 means the active item appears as the 4th visible item from the top,
 * keeping 3 items visible above it for context.
 */
const TARGET_VISIBLE_POSITION = 3

export function JumpToQuestionPanel() {
  const {
    items,
    isLoading,
    error,
    refetch,
    activeQuestionId,
    activeIndex,
    isNavigating,
    setIsReturning,
    handleQuestionSelect,
  } = useQuestionNavigation()

  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const returningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasInitializedRef = useRef(false)

  // Track if user manually scrolled the sidebar causing the active item to leave view
  const userScrolledAwayRef = useRef(false)

  // Track if we're currently in a programmatic scroll (to ignore scroll events)
  const isProgrammaticScrollRef = useRef(false)

  // Track the scroll container element for event listener
  const scrollContainerRef = useRef<HTMLElement | null>(null)

  // Timeout for detecting when programmatic scroll ends
  const scrollEndTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Reset item refs when dataset length changes
  useEffect(() => {
    itemRefs.current.length = items.length
  }, [items.length])

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      if (returningTimeoutRef.current) {
        clearTimeout(returningTimeoutRef.current)
      }
      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current)
      }
    }
  }, [])

  // Helper to check if the active button is visible in the scroll container
  const isActiveButtonVisible = useCallback(() => {
    if (activeIndex == null) return true
    const button = itemRefs.current[activeIndex]
    const scrollContainer = scrollContainerRef.current
    if (!button || !scrollContainer) return true

    const containerRect = scrollContainer.getBoundingClientRect()
    const buttonRect = button.getBoundingClientRect()

    return (
      buttonRect.top >= containerRect.top &&
      buttonRect.bottom <= containerRect.bottom
    )
  }, [activeIndex])

  /**
   * Calculates the scroll position needed to place the active item at the target position.
   * For items 0 through TARGET_VISIBLE_POSITION-1, returns 0 (scroll to top).
   * For other items, calculates the position that places the active item at the target slot.
   */
  const calculateTargetScrollPosition = useCallback(
    (index: number): number | null => {
      const scrollContainer = scrollContainerRef.current
      if (!scrollContainer) return null

      // Items at positions 0, 1, 2 can't be at position 4 - scroll to top
      if (index < TARGET_VISIBLE_POSITION) {
        return 0
      }

      // Get the button that should be at the TOP of the visible area
      // (this is the item TARGET_VISIBLE_POSITION positions before the active one)
      const anchorIndex = index - TARGET_VISIBLE_POSITION
      const anchorButton = itemRefs.current[anchorIndex]

      if (!anchorButton) return null

      // Calculate anchor button's position relative to scroll container
      const containerRect = scrollContainer.getBoundingClientRect()
      const buttonRect = anchorButton.getBoundingClientRect()

      // Current scroll position
      const currentScrollTop = scrollContainer.scrollTop

      // Button's position relative to the container's top (accounting for current scroll)
      const buttonTopRelativeToContainer =
        buttonRect.top - containerRect.top + currentScrollTop

      return Math.max(0, buttonTopRelativeToContainer)
    },
    []
  )

  /**
   * Scrolls the container to place the active item at the target position.
   * Returns true if scroll was initiated, false otherwise.
   */
  const scrollToActivePosition = useCallback(
    (index: number, options: { behavior: ScrollBehavior }): boolean => {
      const scrollContainer = scrollContainerRef.current
      if (!scrollContainer) return false

      const targetScrollTop = calculateTargetScrollPosition(index)
      if (targetScrollTop === null) return false

      scrollContainer.scrollTo({
        top: targetScrollTop,
        behavior: options.behavior,
      })

      return true
    },
    [calculateTargetScrollPosition]
  )

  // Listen for user scrolls on the sidebar container
  // When user scrolls and the active button leaves view, set the flag
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const handleScroll = () => {
      // Ignore programmatic scrolls (from scrollIntoView calls)
      if (isProgrammaticScrollRef.current) return

      // User is manually scrolling - check if active item left the view
      if (!isActiveButtonVisible()) {
        userScrolledAwayRef.current = true
      }
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [isActiveButtonVisible])

  // Auto-scroll to keep active item visible, with "returning" detection
  // Only shows "returning to position" when user manually scrolled the sidebar
  // to hide the active item, then the active item changes
  useEffect(() => {
    if (activeIndex == null) return
    const button = itemRefs.current[activeIndex]
    if (!button) return

    // Find and cache the scroll container
    const scrollContainer = button.closest('[data-scroll-container]') as HTMLElement | null
    scrollContainerRef.current = scrollContainer

    // On initial mount: scroll silently without showing "returning"
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true

      // Mark as programmatic scroll to prevent user scroll detection during initial scroll
      isProgrammaticScrollRef.current = true

      // Scroll to position active item at the target slot (4th position)
      scrollToActivePosition(activeIndex, { behavior: 'smooth' })

      // Clear programmatic flag after scroll animation settles
      scrollEndTimeoutRef.current = setTimeout(() => {
        isProgrammaticScrollRef.current = false
      }, 600)

      return
    }

    // Determine if we should show "returning to position"
    // Only show if: user had scrolled away from active item AND not currently jumping to a question
    const shouldShowReturning = userScrolledAwayRef.current && !isNavigating

    if (shouldShowReturning) {
      // Clear any existing timeout
      if (returningTimeoutRef.current) {
        clearTimeout(returningTimeoutRef.current)
      }
      setIsReturning(true)
    }

    // Mark as programmatic scroll to ignore this scroll in the user scroll listener
    isProgrammaticScrollRef.current = true

    // Scroll to position active item at the target slot (4th position)
    scrollToActivePosition(activeIndex, { behavior: 'smooth' })

    // After scroll animation completes: reset flags and hide indicator
    if (scrollEndTimeoutRef.current) {
      clearTimeout(scrollEndTimeoutRef.current)
    }
    scrollEndTimeoutRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false
      userScrolledAwayRef.current = false // Reset: active item is now visible

      if (shouldShowReturning) {
        setIsReturning(false)
      }
    }, 500)
  }, [activeIndex, isNavigating, setIsReturning, scrollToActivePosition])

  const hasItems = items.length > 0
  const showLoadingState = isLoading && !hasItems
  const showEmptyState = !isLoading && !error && items.length === 0

  return (
    <div className="flex flex-col">
      {/* Loading state */}
      {showLoadingState && (
        <div className="flex items-center gap-2 px-3 py-6 text-sm text-stone-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading questions...
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex flex-col gap-3 px-3 py-4">
          <p className="text-sm text-salmon-600">Couldn&apos;t load questions.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="self-start">
            Try again
          </Button>
        </div>
      )}

      {/* Empty state */}
      {showEmptyState && (
        <div className="px-3 py-6 text-sm text-stone-400 text-center">
          No questions match the current filters.
        </div>
      )}

      {/* Question list */}
      {hasItems && !showLoadingState && !error && (
        <div className="relative flex flex-col gap-0.5 px-1 py-1">
          {/* Vertical connecting line - centered through dots at 19px (4px container padding + 10px button padding + 5px half dot) */}
          <div
            className="absolute left-[19px] top-3 bottom-3 w-px bg-stone-200"
            aria-hidden="true"
          />
          {items.map((item, index) => {
            const isActive = item.id === activeQuestionId
            return (
              <button
                key={item.id}
                ref={(element) => {
                  itemRefs.current[index] = element
                }}
                type="button"
                onClick={() => handleQuestionSelect(item)}
                className={cn(
                  'relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors duration-150',
                  'border border-transparent cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-salmon-400/60 focus-visible:ring-offset-1',
                  isActive
                    ? 'bg-salmon-500/10 text-salmon-600'
                    : 'text-stone-600 hover:text-stone-900 hover:border-salmon-500'
                )}
              >
                {/* Circle indicator - z-10 to sit above line */}
                <span
                  className={cn(
                    'relative z-10 flex h-2.5 w-2.5 shrink-0 rounded-full transition-colors duration-150',
                    isActive
                      ? 'bg-salmon-500'
                      : 'border border-stone-300 bg-white'
                  )}
                  aria-hidden="true"
                />
                {/* Question title */}
                <span className="flex-1 truncate leading-5">{item.title}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

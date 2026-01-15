'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAudioNavigation } from '@/components/providers/audio-navigation-provider'

/**
 * The target position (0-indexed) for the active item in the visible list.
 * A value of 3 means the active item appears as the 4th visible item from the top.
 */
const TARGET_VISIBLE_POSITION = 3

/**
 * Jump to question panel for audio sidebar
 * Uses the audio navigation provider to navigate between audio questions
 */
export function AudioJumpToQuestionPanel() {
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
  } = useAudioNavigation()

  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const returningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasInitializedRef = useRef(false)
  const userScrolledAwayRef = useRef(false)
  const isProgrammaticScrollRef = useRef(false)
  const scrollContainerRef = useRef<HTMLElement | null>(null)
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

    return buttonRect.top >= containerRect.top && buttonRect.bottom <= containerRect.bottom
  }, [activeIndex])

  const calculateTargetScrollPosition = useCallback((index: number): number | null => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return null

    if (index < TARGET_VISIBLE_POSITION) {
      return 0
    }

    const anchorIndex = index - TARGET_VISIBLE_POSITION
    const anchorButton = itemRefs.current[anchorIndex]

    if (!anchorButton) return null

    const containerRect = scrollContainer.getBoundingClientRect()
    const buttonRect = anchorButton.getBoundingClientRect()
    const currentScrollTop = scrollContainer.scrollTop
    const buttonTopRelativeToContainer = buttonRect.top - containerRect.top + currentScrollTop

    return Math.max(0, buttonTopRelativeToContainer)
  }, [])

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
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) return

      if (!isActiveButtonVisible()) {
        userScrolledAwayRef.current = true
      }
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [isActiveButtonVisible])

  // Auto-scroll to keep active item visible
  useEffect(() => {
    if (activeIndex == null) return
    const button = itemRefs.current[activeIndex]
    if (!button) return

    const scrollContainer = button.closest('[data-scroll-container]') as HTMLElement | null
    scrollContainerRef.current = scrollContainer

    // On initial mount: scroll silently without showing "returning"
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true
      isProgrammaticScrollRef.current = true
      scrollToActivePosition(activeIndex, { behavior: 'smooth' })

      scrollEndTimeoutRef.current = setTimeout(() => {
        isProgrammaticScrollRef.current = false
      }, 600)

      return
    }

    const shouldShowReturning = userScrolledAwayRef.current && !isNavigating

    if (shouldShowReturning) {
      if (returningTimeoutRef.current) {
        clearTimeout(returningTimeoutRef.current)
      }
      setIsReturning(true)
    }

    isProgrammaticScrollRef.current = true
    scrollToActivePosition(activeIndex, { behavior: 'smooth' })

    if (scrollEndTimeoutRef.current) {
      clearTimeout(scrollEndTimeoutRef.current)
    }
    scrollEndTimeoutRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false
      userScrolledAwayRef.current = false

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
          {/* Vertical connecting line */}
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
                {/* Circle indicator */}
                <span
                  className={cn(
                    'relative z-10 flex h-2.5 w-2.5 shrink-0 rounded-full transition-colors duration-150',
                    isActive ? 'bg-salmon-500' : 'border border-stone-300 bg-white'
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

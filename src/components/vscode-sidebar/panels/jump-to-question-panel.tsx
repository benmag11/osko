'use client'

import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useQuestionNavigation } from '@/components/providers/question-navigation-provider'

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

  // Reset item refs when dataset length changes
  useEffect(() => {
    itemRefs.current.length = items.length
  }, [items.length])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (returningTimeoutRef.current) {
        clearTimeout(returningTimeoutRef.current)
      }
    }
  }, [])

  // Auto-scroll to keep active item visible, with "returning" detection
  useEffect(() => {
    if (activeIndex == null) return
    const button = itemRefs.current[activeIndex]
    if (!button) return

    // Find the scroll container
    const scrollContainer = button.closest('[data-scroll-container]') as HTMLElement | null

    // Always scroll to the active item
    button.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'smooth',
    })

    // Skip "returning" indicator on initial mount
    // This prevents showing "Returning to position" when first opening the panel
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true
      return
    }

    // Only proceed with "returning" check if scroll container exists
    if (!scrollContainer) return

    // Check if button is already visible in the scroll container
    const containerRect = scrollContainer.getBoundingClientRect()
    const buttonRect = button.getBoundingClientRect()
    const isVisible = buttonRect.top >= containerRect.top && buttonRect.bottom <= containerRect.bottom

    // Only show "returning" if we need to scroll AND not currently navigating (jumping)
    if (!isVisible && !isNavigating) {
      // Clear any existing timeout
      if (returningTimeoutRef.current) {
        clearTimeout(returningTimeoutRef.current)
      }

      setIsReturning(true)

      // Clear after scroll animation completes (~500ms)
      returningTimeoutRef.current = setTimeout(() => {
        setIsReturning(false)
      }, 500)
    }
  }, [activeIndex, isNavigating, setIsReturning])

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
            className="absolute left-[1.125rem] top-3 bottom-3 w-px bg-stone-200"
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

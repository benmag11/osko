'use client'

import { useEffect, useRef, useState } from 'react'
import type { FocusEvent } from 'react'
import { ChevronsDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { QuestionNavigationItem } from '@/lib/hooks/use-question-navigation-list'
import { ZoomControls } from '../zoom-controls'

interface QuestionNavigationPanelProps {
  canZoomIn: boolean
  canZoomOut: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  items: QuestionNavigationItem[]
  activeQuestionId: string | null
  activeIndex: number | null
  isScrolled: boolean
  isLoading: boolean
  isFetching: boolean
  isNavigating: boolean
  totalCount: number
  error: Error | null
  onRetry: () => void
  onSelectQuestion: (item: QuestionNavigationItem) => void | Promise<void>
}

const PANEL_MAX_HEIGHT = 'min(70vh, 600px)'

export function QuestionNavigationPanel({
  canZoomIn,
  canZoomOut,
  onZoomIn,
  onZoomOut,
  items,
  activeQuestionId,
  activeIndex,
  isScrolled,
  isLoading,
  isFetching,
  isNavigating,
  totalCount,
  error,
  onRetry,
  onSelectQuestion,
}: QuestionNavigationPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [isTriggerHover, setIsTriggerHover] = useState(false)
  const [isPanelHover, setIsPanelHover] = useState(false)
  const [isFocusWithin, setIsFocusWithin] = useState(false)

  const hasItems = items.length > 0
  const showLoadingState = isLoading && !hasItems
  const showEmptyState = !isLoading && !error && items.length === 0
  const isOpen = isTriggerHover || isPanelHover || isFocusWithin
  const displayCount = totalCount > 0 ? totalCount : items.length
  const formattedTotalCount = displayCount > 0 ? displayCount.toLocaleString() : null

  // Reset item refs when dataset length changes
  useEffect(() => {
    itemRefs.current.length = items.length
  }, [items.length])

  // Auto-scroll the navigation list to keep the active item in view
  useEffect(() => {
    if (activeIndex == null) return
    const button = itemRefs.current[activeIndex]
    if (!button) return

    const options: ScrollIntoViewOptions = {
      block: 'nearest',
      inline: 'nearest',
      behavior: 'smooth',
    }

    button.scrollIntoView(options)
  }, [activeIndex])

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
        aria-label="Open question navigation"
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
        <ChevronsDown className={cn(
          "h-6 w-6 transition-colors duration-300",
          isOpen ? "text-salmon-500" : "text-stone-600"
        )} />
      </Button>

      {/* Invisible bridge to prevent panel from closing when mouse travels through gap */}
      <div
        className={cn(
          'fixed right-6 top-[4.5rem] z-40 h-3 w-[min(320px,28vw)] max-w-sm',
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        )}
        onMouseEnter={() => setIsPanelHover(true)}
        onMouseLeave={() => setIsPanelHover(false)}
        aria-hidden="true"
      />

      <div
        className={cn(
          'pointer-events-none fixed right-6 top-20 z-40 w-[min(320px,28vw)] max-w-sm transition-all duration-300 ease-out',
          isOpen
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'translate-y-2 opacity-0'
        )}
        onMouseEnter={() => setIsPanelHover(true)}
        onMouseLeave={() => setIsPanelHover(false)}
      >
        <div
          className="flex flex-col gap-3 rounded-2xl border border-stone-300 bg-white p-4 shadow-[0_15px_30px_-12px_rgba(0,0,0,0.25)] overflow-hidden"
          style={{ height: PANEL_MAX_HEIGHT, touchAction: 'pan-y' }}
        >
          <div
            className="flex flex-col gap-3 flex-shrink-0"
            onWheel={(e) => {
              // Prevent wheel events on non-scrollable area from reaching the window
              e.preventDefault()
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-warm-text-secondary">Zoom</span>
              <div className="flex items-center gap-2">
                <ZoomControls
                  canZoomIn={canZoomIn}
                  canZoomOut={canZoomOut}
                  onZoomIn={onZoomIn}
                  onZoomOut={onZoomOut}
                />
              </div>
            </div>
            <Separator className="bg-stone-200" />
          </div>

          <div className="flex flex-1 flex-col overflow-hidden min-h-0">
            <div
              className="mb-2 flex items-center justify-between flex-shrink-0"
              onWheel={(e) => {
                // Prevent wheel events on header from reaching the window
                e.preventDefault()
              }}
            >
              <span className="text-sm font-medium text-warm-text-secondary">Jump to question</span>

              {isNavigating ? (
                <span className="flex items-center gap-1 text-xs text-salmon-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Jumping…
                </span>
              ) : isFetching && !showLoadingState ? (
                <span className="flex items-center gap-1 text-xs text-stone-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Updating…
                </span>
              ) : formattedTotalCount ? (
                <span className="flex items-center text-xs text-salmon-500">
                  {formattedTotalCount} questions
                </span>
              ) : null}
            </div>

            {showLoadingState && (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-stone-200 bg-stone-50/60 px-3 py-6 text-sm text-warm-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading question titles…
              </div>
            )}

            {error && (
              <div className="flex flex-col gap-3 rounded-lg border border-salmon-400/60 bg-salmon-300/15 px-3 py-4 text-sm text-salmon-600">
                <p>We couldn&apos;t load the question list.</p>
                <Button variant="outline" size="sm" onClick={onRetry} className="self-start">
                  Try again
                </Button>
              </div>
            )}

            {showEmptyState && (
              <div className="rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-6 text-sm text-warm-text-muted">
                No questions match the current filters.
              </div>
            )}

            {hasItems && !showLoadingState && !error && (
              <ScrollArea className="flex-1 min-h-0 relative">
                <div className="flex flex-col gap-1 pr-2">
                  {items.map((item, index) => {
                    const isActive = item.id === activeQuestionId
                    return (
                      <button
                        key={item.id}
                        ref={(element) => {
                          itemRefs.current[index] = element
                        }}
                        type="button"
                        onClick={() => onSelectQuestion(item)}
                        className={cn(
                          'flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-salmon-400/60',
                          isActive
                            ? 'bg-salmon-500/15 text-salmon-600 shadow-[inset_0_0_0_1px_rgba(217,119,87,0.4)]'
                            : 'text-warm-text-secondary hover:bg-stone-100/80'
                        )}
                      >
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-stone-100 text-[11px] font-medium text-stone-500">
                          {item.position}
                        </span>
                        <span className="flex-1 leading-5">{item.title}</span>
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { AppliedFiltersDisplay } from '@/components/filters/applied-filters-display'
import { QuestionCard } from './question-card'
import { ZoomControls } from './zoom-controls'
import { Separator } from '@/components/ui/separator'
import { useQuestionsQuery } from '@/lib/hooks/use-questions-query'
import { useFilters } from '@/components/providers/filter-provider'
import type { Topic, PaginatedResponse } from '@/lib/types/database'

const MAX_ZOOM = 1
const MIN_ZOOM = 0.5
const ZOOM_STEP = 0.1
const BASE_MAX_WIDTH_PX = 896 // Tailwind's max-w-4xl -> 56rem @ 16px
const BASE_SECTION_GAP_REM = 2
const BASE_INTER_CARD_GAP_REM = 5
const BASE_LOAD_MORE_MARGIN_REM = 2

type ViewportAnchor =
  | { type: 'question'; id: string; ratio: number }
  | { type: 'container'; ratio: number }

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

interface FilteredQuestionsViewProps {
  topics: Topic[]
  initialData: PaginatedResponse
}

export function FilteredQuestionsView({ topics, initialData }: FilteredQuestionsViewProps) {
  const { filters } = useFilters()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pendingAnchorRef = useRef<ViewportAnchor | null>(null)
  const [zoom, setZoom] = useState(MAX_ZOOM)

  const {
    questions,
    totalCount,
    isFetchingNextPage,
    loadMoreRef,
    isLoading,
    error
  } = useQuestionsQuery({
    filters,
    initialData,
  })

  const captureAnchor = useCallback((): ViewportAnchor | null => {
    if (typeof window === 'undefined') return null
    const container = containerRef.current
    if (!container) return null

    const viewportCenter = window.scrollY + window.innerHeight / 2
    const questionNodes = Array.from(container.querySelectorAll<HTMLElement>('[data-question-id]'))

    let closestNode: HTMLElement | null = null
    let smallestDistance = Number.POSITIVE_INFINITY

    for (const node of questionNodes) {
      const rect = node.getBoundingClientRect()
      const absoluteTop = rect.top + window.scrollY
      const absoluteBottom = absoluteTop + rect.height

      if (viewportCenter >= absoluteTop && viewportCenter <= absoluteBottom) {
        const ratio = rect.height === 0 ? 0.5 : clamp((viewportCenter - absoluteTop) / rect.height, 0, 1)
        const id = node.dataset.questionId
        if (id) {
          return { type: 'question', id, ratio }
        }
      }

      const nodeCenter = absoluteTop + rect.height / 2
      const distance = Math.abs(viewportCenter - nodeCenter)
      if (distance < smallestDistance && node.dataset.questionId) {
        smallestDistance = distance
        closestNode = node
      }
    }

    if (closestNode && closestNode.dataset.questionId) {
      const rect = closestNode.getBoundingClientRect()
      const absoluteTop = rect.top + window.scrollY
      const ratio = rect.height === 0 ? 0.5 : clamp((viewportCenter - absoluteTop) / rect.height, 0, 1)
      return { type: 'question', id: closestNode.dataset.questionId, ratio }
    }

    const containerRect = container.getBoundingClientRect()
    const containerTop = containerRect.top + window.scrollY
    const containerHeight = containerRect.height || 1
    const containerRatio = clamp((viewportCenter - containerTop) / containerHeight, 0, 1)

    return { type: 'container', ratio: containerRatio }
  }, [])

  const restoreAnchor = useCallback((anchor: ViewportAnchor | null) => {
    if (!anchor || typeof window === 'undefined') return
    const container = containerRef.current
    if (!container) return

    const clampScrollTarget = (value: number) => {
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      return clamp(value, 0, maxScroll)
    }

    if (anchor.type === 'question') {
      const questionNode = Array.from(container.querySelectorAll<HTMLElement>('[data-question-id]')).find(
        (node) => node.dataset.questionId === anchor.id
      )

      if (questionNode) {
        const rect = questionNode.getBoundingClientRect()
        const absoluteTop = rect.top + window.scrollY
        const targetTop = clampScrollTarget(absoluteTop + rect.height * clamp(anchor.ratio, 0, 1) - window.innerHeight / 2)
        window.scrollTo({ top: targetTop })
        return
      }
    }

    const containerRect = container.getBoundingClientRect()
    const absoluteTop = containerRect.top + window.scrollY
    const targetTop = clampScrollTarget(absoluteTop + containerRect.height * clamp(anchor.ratio, 0, 1) - window.innerHeight / 2)
    window.scrollTo({ top: targetTop })
  }, [])

  useLayoutEffect(() => {
    if (!pendingAnchorRef.current) return
    restoreAnchor(pendingAnchorRef.current)
    pendingAnchorRef.current = null
  }, [restoreAnchor, zoom, questions])

  const adjustZoom = useCallback((direction: 1 | -1) => {
    setZoom((current) => {
      const next = clamp(current + direction * ZOOM_STEP, MIN_ZOOM, MAX_ZOOM)
      if (next === current) {
        return current
      }
      pendingAnchorRef.current = captureAnchor()
      return Math.round(next * 100) / 100
    })
  }, [captureAnchor])

  const canZoomIn = zoom < MAX_ZOOM - 0.0001
  const canZoomOut = zoom > MIN_ZOOM + 0.0001
  const maxWidth = `${(BASE_MAX_WIDTH_PX * zoom).toFixed(2)}px`
  const filterWidth = `${BASE_MAX_WIDTH_PX}px`
  const sectionGap = `${(BASE_SECTION_GAP_REM * zoom).toFixed(3)}rem`
  const interCardPadding = `${(BASE_INTER_CARD_GAP_REM * zoom).toFixed(3)}rem`
  const loadMoreMarginTop = `${(BASE_LOAD_MORE_MARGIN_REM * zoom).toFixed(3)}rem`

  return (
    <>
      <ZoomControls
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
        onZoomIn={() => adjustZoom(1)}
        onZoomOut={() => adjustZoom(-1)}
      />

      <div className="mx-auto flex w-full flex-col items-center gap-8" style={{ gap: sectionGap }}>
        <div className="w-full" style={{ maxWidth: filterWidth }}>
          <AppliedFiltersDisplay
            topics={topics}
            filters={filters}
            totalCount={totalCount}
            isLoading={isLoading}
          />
        </div>

        <div
          ref={containerRef}
          className="relative w-full"
          style={{ maxWidth: maxWidth }}
        >
          {error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-xl text-salmon-600 font-serif">Error loading questions</p>
              <p className="mt-2 text-exam-text-muted">Please try refreshing the page</p>
            </div>
          ) : questions.length === 0 && !isFetchingNextPage ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-xl text-exam-text-primary">No questions found</p>
              <p className="mt-2 text-exam-text-muted">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              {questions.map((question, index) => (
                <div key={question.id}>
                  {index > 0 && (
                    <div style={{ paddingTop: interCardPadding, paddingBottom: interCardPadding }}>
                      <Separator className="bg-exam-text-muted/30" />
                    </div>
                  )}
                  <QuestionCard question={question} zoom={zoom} />
                </div>
              ))}

              <div ref={loadMoreRef} className="h-20" style={{ marginTop: loadMoreMarginTop }}>
                {isFetchingNextPage && (
                  <div className="flex justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

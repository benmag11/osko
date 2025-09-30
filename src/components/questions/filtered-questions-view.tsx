'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { AppliedFiltersDisplay } from '@/components/filters/applied-filters-display'
import { QuestionCard } from './question-card'
import { Separator } from '@/components/ui/separator'
import { useQuestionsQuery } from '@/lib/hooks/use-questions-query'
import { useScrollVisibility } from '@/lib/hooks/use-scroll-visibility'
import { useFilters } from '@/components/providers/filter-provider'
import { useQuestionNavigationList } from '@/lib/hooks/use-question-navigation-list'
import type { QuestionNavigationItem } from '@/lib/hooks/use-question-navigation-list'
import { QuestionNavigationPanel } from './navigation/navigation-panel'
import type { Topic, PaginatedResponse } from '@/lib/types/database'
import '../questions/styles/zoom.css'

const MAX_ZOOM = 1
const MIN_ZOOM = 0.5
const ZOOM_STEP = 0.1
const BASE_MAX_WIDTH_PX = 896 // Tailwind's max-w-4xl -> 56rem @ 16px

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
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const programmaticScrollRef = useRef(false)
  const hasNextPageRef = useRef(false)
  const navigationSequenceRef = useRef(0)
  const activeNavigationTokenRef = useRef<number | null>(null)

  // Scroll visibility for zoom controls
  const { isVisible: controlsVisible, targetRef: filtersRef } = useScrollVisibility({
    threshold: 0,
    rootMargin: '-50px 0px 0px 0px', // Trigger when filters section is 50px from leaving viewport
    initialVisible: true,
    debounceMs: 50
  })

  const {
    questions,
    totalCount,
    isFetchingNextPage,
    loadMoreRef,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
  } = useQuestionsQuery({
    filters,
    initialData,
  })

  const {
    items: navigationItems,
    totalCount: navigationTotalCount,
    isLoading: isNavigationLoading,
    isFetching: isNavigationFetching,
    error: navigationError,
    refetch: refetchNavigation,
    idToIndex: navigationIndexMap,
  } = useQuestionNavigationList(filters)

  useEffect(() => {
    hasNextPageRef.current = Boolean(hasNextPage)
  }, [hasNextPage])

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

  const updateActiveQuestion = useCallback(() => {
    if (programmaticScrollRef.current) {
      return
    }

    const anchor = captureAnchor()
    if (anchor?.type === 'question') {
      setActiveQuestionId(anchor.id)
    }
  }, [captureAnchor])

  useEffect(() => {
    if (typeof window === 'undefined') return

    let rafId: number | null = null

    const handleScroll = () => {
      if (programmaticScrollRef.current) {
        return
      }

      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }

      rafId = window.requestAnimationFrame(() => {
        updateActiveQuestion()
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    updateActiveQuestion()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [updateActiveQuestion])

  useEffect(() => {
    updateActiveQuestion()
  }, [questions, updateActiveQuestion])

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

  const findQuestionNode = useCallback((questionId: string) => {
    if (!containerRef.current) return null
    return containerRef.current.querySelector<HTMLElement>(`[data-question-id='${questionId}']`)
  }, [])

  const ensureQuestionInDom = useCallback(async (questionId: string) => {
    let element = findQuestionNode(questionId)
    if (element) {
      return element
    }

    const MAX_FETCH_ATTEMPTS = 40
    let attempts = 0

    while (!element && hasNextPageRef.current && attempts < MAX_FETCH_ATTEMPTS) {
      await fetchNextPage()
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)))
      await new Promise((resolve) => setTimeout(resolve, 0))
      element = findQuestionNode(questionId)
      attempts += 1
    }

    return element ?? null
  }, [fetchNextPage, findQuestionNode])

  const handleQuestionSelect = useCallback(async (item: QuestionNavigationItem) => {
    setIsNavigating(true)

    const navigationToken = navigationSequenceRef.current + 1
    navigationSequenceRef.current = navigationToken
    activeNavigationTokenRef.current = navigationToken

    const settleScroll = async (
      initialElement: HTMLElement,
      offset: number,
    ) => {
      if (typeof window === 'undefined') {
        return
      }

      await new Promise<void>((resolve) => {
        const settleFramesRequired = 6
        const velocityThreshold = 0.5
        const maxDurationMs = 3000
        let animationFrameId: number | null = null
        let stableFrameCount = 0
        let lastScrollY = window.scrollY
        const startTime = performance.now()

        const cancel = () => {
          if (animationFrameId !== null) {
            window.cancelAnimationFrame(animationFrameId)
            animationFrameId = null
          }
        }

        const step = () => {
          if (activeNavigationTokenRef.current !== navigationToken) {
            cancel()
            resolve()
            return
          }

          const elapsed = performance.now() - startTime
          const candidateElement = findQuestionNode(item.id) ?? initialElement

          if (candidateElement) {
            const rect = candidateElement.getBoundingClientRect()
            const absoluteTop = rect.top + window.scrollY
            const targetTop = Math.max(absoluteTop - offset, 0)
            const distanceToTarget = Math.abs(window.scrollY - targetTop)
            const velocity = Math.abs(window.scrollY - lastScrollY)

            if (distanceToTarget <= 2 || velocity <= velocityThreshold) {
              stableFrameCount += 1
            } else {
              stableFrameCount = 0
            }
          }

          if (stableFrameCount >= settleFramesRequired || elapsed >= maxDurationMs) {
            cancel()
            resolve()
            return
          }

          lastScrollY = window.scrollY
          animationFrameId = window.requestAnimationFrame(step)
        }

        animationFrameId = window.requestAnimationFrame(step)
      })
    }

    try {
      const element = await ensureQuestionInDom(item.id)

      if (!element) {
        console.warn(`Question ${item.id} not found in DOM after fetching additional pages.`)
        return
      }

      if (typeof window === 'undefined') {
        setActiveQuestionId(item.id)
        return
      }

      programmaticScrollRef.current = true

      const offset = Math.max(window.innerHeight * 0.2, 120)
      const rect = element.getBoundingClientRect()
      const absoluteTop = rect.top + window.scrollY
      const targetTop = Math.max(absoluteTop - offset, 0)

      setActiveQuestionId(item.id)
      window.scrollTo({ top: targetTop, behavior: 'smooth' })

      await settleScroll(element, offset)

      if (activeNavigationTokenRef.current === navigationToken) {
        programmaticScrollRef.current = false
        updateActiveQuestion()
      }
    } finally {
      if (activeNavigationTokenRef.current === navigationToken) {
        activeNavigationTokenRef.current = null
        setIsNavigating(false)
      }
    }
  }, [ensureQuestionInDom, findQuestionNode, updateActiveQuestion])

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
  const activeIndex = activeQuestionId ? navigationIndexMap.get(activeQuestionId) ?? null : null

  return (
    <>
      <QuestionNavigationPanel
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
        onZoomIn={() => adjustZoom(1)}
        onZoomOut={() => adjustZoom(-1)}
        items={navigationItems}
        activeQuestionId={activeQuestionId}
        activeIndex={activeIndex}
        isScrolled={!controlsVisible}
        isLoading={isNavigationLoading}
        isFetching={isNavigationFetching}
        isNavigating={isNavigating}
        totalCount={navigationTotalCount}
        error={navigationError}
        onRetry={() => refetchNavigation()}
        onSelectQuestion={handleQuestionSelect}
      />

      <div
        className="exam-zoom-root mx-auto flex w-full flex-col items-center"
        style={{ '--exam-zoom': zoom } as CSSProperties}
      >
        <div ref={filtersRef} className="w-full" style={{ maxWidth: filterWidth }}>
          <AppliedFiltersDisplay
            topics={topics}
            filters={filters}
            totalCount={totalCount}
            isLoading={isLoading}
          />
        </div>

        <div
          ref={containerRef}
          className="exam-zoom-container relative w-full"
          style={{ maxWidth: maxWidth, '--exam-zoom': zoom } as CSSProperties}
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
                    <div className="exam-zoom-separator">
                      <Separator className="bg-exam-text-muted/30" />
                    </div>
                  )}
                  <QuestionCard question={question} zoom={zoom} />
                </div>
              ))}

              <div ref={loadMoreRef} className="h-20 exam-zoom-load-more">
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

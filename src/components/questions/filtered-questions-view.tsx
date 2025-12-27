'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { AppliedFiltersDisplay } from '@/components/filters/applied-filters-display'
import { QuestionCard } from './question-card'
import { Separator } from '@/components/ui/separator'
import { useQuestionsQuery } from '@/lib/hooks/use-questions-query'
import { useFilters } from '@/components/providers/filter-provider'
import { useQuestionNavigation } from '@/components/providers/question-navigation-provider'
import type { QuestionNavigationItem } from '@/lib/hooks/use-question-navigation-list'
import type { Topic, PaginatedResponse } from '@/lib/types/database'
import { useAuth } from '@/components/providers/auth-provider'
import { EXAM_VIEW_BASE_MAX_WIDTH_PX } from './constants'
import '../questions/styles/zoom.css'

const BASE_MAX_WIDTH_PX = EXAM_VIEW_BASE_MAX_WIDTH_PX // Tailwind's max-w-4xl -> 56rem @ 16px

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
  const { user, profile } = useAuth()
  const {
    setActiveQuestionId,
    setIsNavigating,
    setNavigationTarget,
    registerNavigationHandler,
    zoom,
    registerZoomHandler,
  } = useQuestionNavigation()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pendingAnchorRef = useRef<ViewportAnchor | null>(null)
  const programmaticScrollRef = useRef(false)
  const programmaticNavigationOwnerRef = useRef<number | null>(null)
  const hasNextPageRef = useRef(false)
  const navigationSequenceRef = useRef(0)
  const activeNavigationTokenRef = useRef<number | null>(null)
  const [autoFetchPauseCount, setAutoFetchPauseCount] = useState(0)
  const pauseAutoFetch = autoFetchPauseCount > 0

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
    pauseAutoFetch,
  })

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
  }, [captureAnchor, setActiveQuestionId])

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
    const navigationToken = navigationSequenceRef.current + 1
    navigationSequenceRef.current = navigationToken
    activeNavigationTokenRef.current = navigationToken

    const isTokenActive = () => activeNavigationTokenRef.current === navigationToken

    setIsNavigating(true)
    setNavigationTarget({ id: item.id, title: item.title })
    setAutoFetchPauseCount((count) => count + 1)
    programmaticScrollRef.current = true
    programmaticNavigationOwnerRef.current = navigationToken
    setActiveQuestionId(item.id)

    try {
      const element = await ensureQuestionInDom(item.id)

      if (!element) {
        console.warn(`Question ${item.id} not found in DOM after fetching additional pages.`)
        return
      }

      if (!isTokenActive()) {
        return
      }

      if (typeof window === 'undefined') {
        return
      }

      const waitForElementStability = async (): Promise<HTMLElement> => {
        if (typeof window === 'undefined') {
          return element
        }

        let latestElement = element

        await new Promise<void>((resolve) => {
          const stableFramesRequired = 8
          const movementThreshold = 0.5
          const maxDurationMs = 2000
          let stableFrameCount = 0
          let animationFrameId: number | null = null
          let lastRect = latestElement.getBoundingClientRect()
          const startTime = performance.now()

          const finish = () => {
            if (animationFrameId !== null) {
              window.cancelAnimationFrame(animationFrameId)
              animationFrameId = null
            }
            resolve()
          }

          const step = () => {
            if (!isTokenActive()) {
              finish()
              return
            }

            const candidate = findQuestionNode(item.id) ?? latestElement
            if (candidate !== latestElement) {
              latestElement = candidate
              lastRect = latestElement.getBoundingClientRect()
              stableFrameCount = 0
            }

            const rect = latestElement.getBoundingClientRect()
            const deltaTop = Math.abs(rect.top - lastRect.top)
            const deltaHeight = Math.abs(rect.height - lastRect.height)

            if (deltaTop <= movementThreshold && deltaHeight <= movementThreshold && rect.height > 0) {
              stableFrameCount += 1
            } else {
              stableFrameCount = 0
            }

            lastRect = rect

            if (stableFrameCount >= stableFramesRequired || performance.now() - startTime >= maxDurationMs) {
              finish()
              return
            }

            animationFrameId = window.requestAnimationFrame(step)
          }

          animationFrameId = window.requestAnimationFrame(step)
        })

        return latestElement
      }

      const stableElement = await waitForElementStability()

      if (!isTokenActive()) {
        return
      }

      const performScroll = async (targetElement: HTMLElement) => {
        if (typeof window === 'undefined') {
          return
        }

        const offset = Math.max(window.innerHeight * 0.2, 120)

        await new Promise<void>((resolve) => {
          const maxDurationMs = 1600
          const settleThreshold = 1.5
          let animationFrameId: number | null = null
          const startTime = performance.now()
          let currentElement = targetElement

          const finish = () => {
            if (animationFrameId !== null) {
              window.cancelAnimationFrame(animationFrameId)
              animationFrameId = null
            }
            resolve()
          }

          const step = () => {
            if (!isTokenActive()) {
              finish()
              return
            }

            const candidate = findQuestionNode(item.id) ?? currentElement
            if (candidate !== currentElement) {
              currentElement = candidate
            }

            const rect = currentElement.getBoundingClientRect()
            const absoluteTop = rect.top + window.scrollY
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
            const targetTop = clamp(absoluteTop - offset, 0, maxScroll)
            const currentTop = window.scrollY
            const distance = targetTop - currentTop

            if (Math.abs(distance) <= settleThreshold || performance.now() - startTime >= maxDurationMs) {
              window.scrollTo({ top: targetTop })
              finish()
              return
            }

            const nextTop = currentTop + distance * 0.28
            window.scrollTo({ top: nextTop })
            animationFrameId = window.requestAnimationFrame(step)
          }

          animationFrameId = window.requestAnimationFrame(step)
        })
      }

      await performScroll(stableElement)

      if (isTokenActive() && programmaticNavigationOwnerRef.current === navigationToken) {
        programmaticScrollRef.current = false
        programmaticNavigationOwnerRef.current = null
        setActiveQuestionId(item.id)
      }
    } finally {
      if (programmaticNavigationOwnerRef.current === navigationToken) {
        programmaticScrollRef.current = false
        programmaticNavigationOwnerRef.current = null
      }

      if (activeNavigationTokenRef.current === navigationToken) {
        activeNavigationTokenRef.current = null
        setIsNavigating(false)
        setNavigationTarget(null)
      }

      setAutoFetchPauseCount((count) => Math.max(0, count - 1))
    }
  }, [ensureQuestionInDom, findQuestionNode, setActiveQuestionId, setIsNavigating, setNavigationTarget])

  // Register navigation handler with context so sidebar can trigger navigation
  useEffect(() => {
    registerNavigationHandler(handleQuestionSelect)
  }, [registerNavigationHandler, handleQuestionSelect])

  useLayoutEffect(() => {
    if (!pendingAnchorRef.current) return
    restoreAnchor(pendingAnchorRef.current)
    pendingAnchorRef.current = null
  }, [restoreAnchor, zoom, questions])

  // Register zoom handler to capture anchor before zoom changes
  useEffect(() => {
    registerZoomHandler(() => {
      pendingAnchorRef.current = captureAnchor()
    })
  }, [registerZoomHandler, captureAnchor])

  const maxWidth = `${(BASE_MAX_WIDTH_PX * zoom).toFixed(2)}px`
  const filterWidth = `${BASE_MAX_WIDTH_PX}px`
  const canReport = Boolean(user)
  const isAdmin = Boolean(profile?.is_admin)

  return (
    <div
      className="exam-zoom-root mx-auto flex w-full flex-col items-center"
      style={{ '--exam-zoom': zoom } as CSSProperties}
    >
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
                  <QuestionCard
                    question={question}
                    zoom={zoom}
                    availableTopics={topics}
                    canReport={canReport}
                    isAdmin={isAdmin}
                    displayWidth={BASE_MAX_WIDTH_PX * zoom}
                    isPriority={index === 0}
                  />
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
  )
}

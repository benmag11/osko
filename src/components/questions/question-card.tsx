'use client'

import { useState, useCallback, memo, useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { TrackedImage } from './tracked-image'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Edit2, Flag } from 'lucide-react'
import { QuestionEditModal } from '@/components/admin/question-edit-modal'
import { QuestionReportDialog } from '@/components/questions/question-report-dialog'
import type { Question, Topic } from '@/lib/types/database'
import { cn } from '@/lib/utils'
import { formatQuestionTitle } from '@/lib/utils/question-format'
import { useInView } from 'react-intersection-observer'
import { EXAM_VIEW_BASE_MAX_WIDTH_PX } from './constants'
import { getTransformedImageUrl } from '@/lib/supabase/image-loader'
import { SearchHighlightOverlay } from './search-highlight-overlay'
import styles from './styles/question-card.module.css'

interface QuestionCardProps {
  question: Question
  zoom?: number
  availableTopics?: Topic[]
  canReport?: boolean
  isAdmin?: boolean
  displayWidth?: number
  isPriority?: boolean
  searchTerms?: string[]
}

export const QuestionCard = memo(function QuestionCard({
  question,
  zoom,
  availableTopics,
  canReport = false,
  isAdmin = false,
  displayWidth,
  isPriority = false,
  searchTerms,
}: QuestionCardProps) {
  const [showMarkingScheme, setShowMarkingScheme] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const topics = availableTopics ?? []

  // Check if URLs are valid
  const hasValidQuestionImage = question.question_image_url &&
    question.question_image_url !== 'placeholder' &&
    (question.question_image_url.startsWith('http') ||
     question.question_image_url.startsWith('/'))

  const hasValidMarkingScheme = question.marking_scheme_image_url &&
    question.marking_scheme_image_url !== 'placeholder' &&
    (question.marking_scheme_image_url.startsWith('http') ||
     question.marking_scheme_image_url.startsWith('/'))

  // Use real dimensions from database with sensible fallbacks
  const questionImageWidth = question.question_image_width ?? 2480
  const questionImageHeight = question.question_image_height ?? 1500
  const markingSchemeWidth = question.marking_scheme_image_width ?? 2480

  const toggleMarkingScheme = useCallback(() => {
    setShowMarkingScheme(prev => !prev)
  }, [])
  const title = formatQuestionTitle(question)
  const rawDisplayWidth = displayWidth ?? (EXAM_VIEW_BASE_MAX_WIDTH_PX * (zoom ?? 1))
  const maxDisplayWidth = Math.max(1, Math.round(rawDisplayWidth))
  const questionImageSizes = `(max-width: 640px) 100vw, ${maxDisplayWidth}px`

  // Two-tier visibility system: visible (force-fetch) and far (background prefetch)
  const { ref: visibleRef, inView: isVisible } = useInView({
    threshold: 0,
    rootMargin: '200px',
  })
  const { ref: farRef, inView: isFar } = useInView({
    threshold: 0,
    rootMargin: '1200px',
  })

  // Combine refs for the card element
  const cardRef = useCallback(
    (node: HTMLDivElement | null) => {
      visibleRef(node)
      farRef(node)
    },
    [visibleRef, farRef]
  )

  // Track if we've already force-fetched this image
  const hasForceFetchedRef = useRef(false)
  const prefetchLinkRef = useRef<HTMLLinkElement | null>(null)

  // Store the pre-computed marking scheme URL (same URL for prefetch AND display = cache hit)
  const [markingSchemeUrl, setMarkingSchemeUrl] = useState<string | null>(null)

  // Calculate optimal image width based on display size and device pixel ratio
  const getOptimalWidth = useCallback(() => {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    return Math.min(markingSchemeWidth, Math.round(maxDisplayWidth * Math.min(dpr, 2)))
  }, [markingSchemeWidth, maxDisplayWidth])

  // Compute the marking scheme URL once (used for both prefetch and display)
  useEffect(() => {
    if (hasValidMarkingScheme && !markingSchemeUrl) {
      const url = question.marking_scheme_image_url!
      setMarkingSchemeUrl(getTransformedImageUrl(url, getOptimalWidth(), 75))
    }
  }, [hasValidMarkingScheme, markingSchemeUrl, question.marking_scheme_image_url, getOptimalWidth])

  // Force-fetch marking scheme when card becomes visible (guarantees immediate load)
  useEffect(() => {
    if (!isVisible || !markingSchemeUrl || showMarkingScheme || hasForceFetchedRef.current) {
      return
    }

    // new Image() forces the browser to fetch immediately (not a hint, a command)
    const img = new window.Image()
    img.src = markingSchemeUrl
    hasForceFetchedRef.current = true
  }, [isVisible, markingSchemeUrl, showMarkingScheme])

  // Background prefetch for far cards (low priority hint for cards not yet visible)
  useEffect(() => {
    if (!isFar || isVisible || !markingSchemeUrl || prefetchLinkRef.current) {
      return
    }

    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.as = 'image'
    link.href = markingSchemeUrl
    link.setAttribute('fetchpriority', 'low')

    document.head.appendChild(link)
    prefetchLinkRef.current = link

    return () => {
      if (prefetchLinkRef.current === link) {
        link.remove()
        prefetchLinkRef.current = null
      }
    }
  }, [isFar, isVisible, markingSchemeUrl])

  // Hover handler: force-fetch if not already done (backup for edge cases)
  const handleToggleMouseEnter = useCallback(() => {
    if (!markingSchemeUrl || showMarkingScheme || hasForceFetchedRef.current) return

    const img = new window.Image()
    img.src = markingSchemeUrl
    hasForceFetchedRef.current = true
  }, [markingSchemeUrl, showMarkingScheme])

  return (
    <div
      ref={cardRef}
      className={cn('flex flex-col', styles.card)}
      data-question-id={question.id}
      style={{ '--exam-zoom': zoom ?? 1 } as CSSProperties}
    >
      <div className={cn('flex items-center justify-between', styles.header)}>
        <h3 className={cn('font-serif font-semibold text-warm-text-primary', styles.title)}>
          {title}
        </h3>
        <div className={cn('flex items-center', styles.actions)}>
          {isAdmin && (
            <Button
              onClick={() => setShowEditModal(true)}
              size="sm"
              variant="outline"
              className={cn('gap-2 hover:bg-transparent hover:[&>svg]:text-stone-800', styles.adminButton)}
            >
              <Edit2 className={cn('h-4 w-4', styles.icon)} />
              Edit Metadata
            </Button>
          )}
          {canReport && (
            <Button
              onClick={() => setShowReportDialog(true)}
              size="sm"
              variant="outline"
              className={cn('p-2 hover:bg-transparent hover:[&>svg]:text-stone-800', styles.iconButton)}
              title="Report an issue with this question"
            >
              <Flag className={cn('h-4 w-4', styles.icon)} />
            </Button>
          )}
        </div>
      </div>
      
      <div className="overflow-hidden rounded-xl shadow-[0_0_7px_rgba(0,0,0,0.17)]">
        <div className="relative w-full bg-cream-50">
          {hasValidQuestionImage ? (
            <>
              <TrackedImage
                src={question.question_image_url!}
                alt={`Question ${question.question_number ?? 'image'}`}
                width={questionImageWidth}
                height={questionImageHeight}
                className="w-full h-auto"
                priority={isPriority}
                fetchPriority={isPriority ? 'high' : 'auto'}
                sizes={questionImageSizes}
                imageType="question"
                questionId={question.id}
              />
              {searchTerms && searchTerms.length > 0 && (
                <SearchHighlightOverlay
                  wordCoordinates={question.word_coordinates}
                  searchTerms={searchTerms}
                  naturalWidth={questionImageWidth}
                  naturalHeight={questionImageHeight}
                />
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-48 bg-stone-100">
              <p className="text-warm-text-muted">Question image not available</p>
            </div>
          )}
        </div>
        
        <div className="bg-[#F5F4ED] rounded-b-xl border-t border-stone-300">
          <div
            className={cn('flex justify-center', styles.markingToggleContainer)}
            onMouseEnter={handleToggleMouseEnter}
          >
            {hasValidMarkingScheme ? (
              <Button
                onClick={toggleMarkingScheme}
                variant="outline"
                className={cn(
                  'border-stone-400 bg-cream-50 text-stone-700 hover:bg-stone-100 hover:border-stone-500 hover:text-stone-800 font-sans',
                  styles.markingToggleButton
                )}
              >
                {showMarkingScheme ? (
                  <>
                    <ChevronUp className={cn('h-4 w-4', styles.icon)} />
                    Hide marking scheme
                  </>
                ) : (
                  <>
                    <ChevronDown className={cn('h-4 w-4', styles.icon)} />
                    Show marking scheme
                  </>
                )}
              </Button>
            ) : (
              <p className="text-sm font-sans text-warm-text-muted">No marking scheme available</p>
            )}
          </div>

          {showMarkingScheme && markingSchemeUrl && (
            <div className="px-4 pb-4">
              {/* Native <img> with exact same URL as prefetch = guaranteed cache hit = instant */}
              <img
                src={markingSchemeUrl}
                alt={`Marking scheme for question ${question.question_number ?? ''}`}
                className="w-full h-auto rounded-lg"
                loading="eager"
              />
            </div>
          )}
        </div>
      </div>
      
      {isAdmin && showEditModal && (
        <QuestionEditModal
          question={question}
          topics={topics}
          open={showEditModal}
          onOpenChange={setShowEditModal}
        />
      )}

      {canReport && showReportDialog && (
        <QuestionReportDialog
          question={question}
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
        />
      )}
    </div>
  )
})

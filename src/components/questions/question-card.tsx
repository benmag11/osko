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
import styles from './styles/question-card.module.css'

interface QuestionCardProps {
  question: Question
  zoom?: number
  availableTopics?: Topic[]
  canReport?: boolean
  isAdmin?: boolean
  displayWidth?: number
  isPriority?: boolean
}

export const QuestionCard = memo(function QuestionCard({
  question,
  zoom,
  availableTopics,
  canReport = false,
  isAdmin = false,
  displayWidth,
  isPriority = false,
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
  const markingSchemeHeight = question.marking_scheme_image_height ?? 1500
  
  const toggleMarkingScheme = useCallback(() => {
    setShowMarkingScheme(prev => !prev)
  }, [])
  const title = formatQuestionTitle(question)
  const rawDisplayWidth = displayWidth ?? (EXAM_VIEW_BASE_MAX_WIDTH_PX * (zoom ?? 1))
  const maxDisplayWidth = Math.max(1, Math.round(rawDisplayWidth))
  const questionImageSizes = `(max-width: 640px) 100vw, ${maxDisplayWidth}px`
  const markingSchemeSizes = `(max-width: 640px) 100vw, ${Math.max(1, maxDisplayWidth - 32)}px`
  const { ref: cardRef, inView } = useInView({
    threshold: 0,
    rootMargin: '600px', // Increased for earlier prefetching during scroll
    triggerOnce: false,
  })
  const markingSchemePrefetchRef = useRef<HTMLLinkElement | null>(null)

  useEffect(() => {
    if (!inView) {
      return
    }

    const url = question.marking_scheme_image_url
    if (!url || url === 'placeholder' || (!url.startsWith('http') && !url.startsWith('/'))) {
      return
    }

    if (markingSchemePrefetchRef.current) {
      return
    }

    // Use transformed URL for prefetch - request at reasonable size for display
    // This ensures we prefetch the optimized version, not the full-size original
    const prefetchWidth = Math.min(markingSchemeWidth, 1024)
    const transformedUrl = getTransformedImageUrl(url, prefetchWidth, 75)

    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.as = 'image'
    link.href = transformedUrl
    link.setAttribute('fetchpriority', 'low')

    document.head.appendChild(link)
    markingSchemePrefetchRef.current = link

    return () => {
      if (markingSchemePrefetchRef.current === link) {
        link.remove()
        markingSchemePrefetchRef.current = null
      }
    }
  }, [inView, question.marking_scheme_image_url, markingSchemeWidth])

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
      
      <div className="overflow-hidden rounded-xl shadow-[0_0_7px_rgba(0,0,0,0.15)]">
        <div className="relative w-full bg-cream-50">
          {hasValidQuestionImage ? (
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
          ) : (
            <div className="flex items-center justify-center h-48 bg-stone-100">
              <p className="text-warm-text-muted">Question image not available</p>
            </div>
          )}
        </div>
        
        <div className="bg-[#F5F4ED] rounded-b-xl border-t border-stone-300">
          <div className={cn('flex justify-center', styles.markingToggleContainer)}>
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
          
          {showMarkingScheme && hasValidMarkingScheme && (
            <div className="px-4 pb-4">
              <TrackedImage
                src={question.marking_scheme_image_url!}
                alt={`Marking scheme for question ${question.question_number ?? ''}`}
                width={markingSchemeWidth}
                height={markingSchemeHeight}
                className="w-full h-auto rounded-lg"
                sizes={markingSchemeSizes}
                imageType="marking_scheme"
                questionId={question.id}
                wasPrefetched={inView}
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

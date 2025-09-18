'use client'

import { useState, useCallback, memo } from 'react'
import type { CSSProperties } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Edit2, Flag } from 'lucide-react'
import { useIsAdmin } from '@/lib/hooks/use-is-admin'
import { useTopics } from '@/lib/hooks/use-topics'
import { useAuth } from '@/components/providers/auth-provider'
import { QuestionEditModal } from '@/components/admin/question-edit-modal'
import { QuestionReportDialog } from '@/components/questions/question-report-dialog'
import type { Question } from '@/lib/types/database'
import { cn } from '@/lib/utils'
import styles from './styles/question-card.module.css'

interface QuestionCardProps {
  question: Question
  zoom?: number
}

export const QuestionCard = memo(function QuestionCard({ question, zoom }: QuestionCardProps) {
  const [showMarkingScheme, setShowMarkingScheme] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const { isAdmin } = useIsAdmin()
  const { user } = useAuth()
  const { topics } = useTopics(question.subject_id)
  
  // Check if URLs are valid
  const hasValidQuestionImage = question.question_image_url && 
    question.question_image_url !== 'placeholder' &&
    (question.question_image_url.startsWith('http') || 
     question.question_image_url.startsWith('/'))
     
  const hasValidMarkingScheme = question.marking_scheme_image_url && 
    question.marking_scheme_image_url !== 'placeholder' &&
    (question.marking_scheme_image_url.startsWith('http') || 
     question.marking_scheme_image_url.startsWith('/'))
  
  const toggleMarkingScheme = useCallback(() => {
    setShowMarkingScheme(prev => !prev)
  }, [])
  
  // Format question parts with parentheses
  const formattedParts = question.question_parts.length > 0
    ? question.question_parts.map(part => `(${part})`).join(', ')
    : ''
  
  // Build title with format: [year] - Paper [paper_number] - [Deferred] - Question [question_number] - [subparts]
  let title = `${question.year}`
  
  // Add paper number if it exists
  if (question.paper_number) {
    title += ` - Paper ${question.paper_number}`
  }
  
  // Add "Deferred" as a separate segment if exam_type is deferred
  if (question.exam_type === 'deferred') {
    title += ' - Deferred'
  }
  
  // Add question number if it exists (null means no question number)
  if (question.question_number !== null) {
    title += ` - Question ${question.question_number}`
  }
  
  // Add formatted parts if they exist
  if (formattedParts) {
    title += ` - ${formattedParts}`
  }

  // Add additional info if it exists
  if (question.additional_info) {
    title += ` - ${question.additional_info}`
  }

  return (
    <div
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
              className={cn('gap-2', styles.adminButton)}
            >
              <Edit2 className={cn('h-4 w-4', styles.icon)} />
              Edit Metadata
            </Button>
          )}
          {user && (
            <Button
              onClick={() => setShowReportDialog(true)}
              size="sm"
              variant="outline"
              className={cn('p-2', styles.iconButton)}
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
            <Image
              src={question.question_image_url!}
              alt={`Question ${question.question_number ?? 'image'}`}
              width={1073}
              height={800}
              className="w-full h-auto"
              priority={false}
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
              <Image
                src={question.marking_scheme_image_url!}
                alt={`Marking scheme for question ${question.question_number ?? ''}`}
                width={1073}
                height={800}
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}
        </div>
      </div>
      
      {isAdmin && (
        <QuestionEditModal
          question={question}
          topics={topics || []}
          open={showEditModal}
          onOpenChange={setShowEditModal}
        />
      )}
      
      {user && (
        <QuestionReportDialog
          question={question}
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
        />
      )}
    </div>
  )
})

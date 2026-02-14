'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Flag, SquareCheckBig } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { showReportSuccess, showError } from '@/lib/toast'
import { createReport } from '@/lib/supabase/report-actions'
import type { BaseReportableQuestion } from '@/lib/types/database'
import { formatQuestionTitle } from '@/lib/utils/question-format'

interface QuestionReportDialogProps {
  question: BaseReportableQuestion
  questionType: 'normal' | 'audio'
  open: boolean
  onOpenChange: (open: boolean) => void
}

const reportTypeOptions = [
  {
    value: 'metadata' as const,
    label: 'Question information (Year, question number, subparts)',
    placeholder: 'Any other details about why it is wrong, or what it should be, would be hugely appreciated!',
    showTextarea: true,
    textareaRequired: false,
  },
  {
    value: 'incorrect_topic' as const,
    label: 'Incorrect topic',
    placeholder: 'If you could share what you think the topic should be, or if you think the breakdown of topics for the subject could be improved, or any other details, then that would be amazing!',
    showTextarea: true,
    textareaRequired: false,
  },
  {
    value: 'missing_images' as const,
    label: 'Missing images',
    placeholder: '',
    showTextarea: false,
    textareaRequired: false,
  },
  {
    value: 'other' as const,
    label: 'Other',
    placeholder: 'The more detail the better — it goes a long way to making the website more useful for everyone.',
    showTextarea: true,
    textareaRequired: true,
  }
]

export function QuestionReportDialog({
  question,
  questionType,
  open,
  onOpenChange
}: QuestionReportDialogProps) {
  const [selectedType, setSelectedType] = useState<'metadata' | 'incorrect_topic' | 'missing_images' | 'other' | null>(null)
  const [description, setDescription] = useState('')
  const queryClient = useQueryClient()

  const questionTitle = formatQuestionTitle(question)

  // Get assigned topics for this question
  const assignedTopics = question.topics || []

  const selectedOption = selectedType
    ? reportTypeOptions.find(o => o.value === selectedType)
    : null

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedType) {
        throw new Error('Please select a report type')
      }
      if (selectedOption?.textareaRequired && !description.trim()) {
        throw new Error('Description is required for this report type')
      }
      if (description.trim().length > 500) {
        throw new Error('Description is too long (maximum 500 characters)')
      }

      const result = await createReport({
        question_id: question.id,
        question_type: questionType,
        report_type: selectedType,
        description: description.trim() || undefined
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit report')
      }

      return result
    },
    onSuccess: () => {
      showReportSuccess(questionTitle)
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      setSelectedType(null)
      setDescription('')
      onOpenChange(false)
    },
    onError: (error) => {
      showError(error.message)
    }
  })

  const handleReset = () => {
    setSelectedType(null)
    setDescription('')
  }

  const canSubmit =
    selectedType !== null &&
    !submitMutation.isPending &&
    !(selectedOption?.textareaRequired && !description.trim())

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleReset()
      onOpenChange(isOpen)
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-coral-500" />
            Report question
          </DialogTitle>
          <div className="mt-3 rounded-lg bg-cream-100 p-3">
            <p className="text-sm font-medium text-warm-text-primary">{questionTitle}</p>
          </div>
          <DialogDescription className="mt-3">
            I need you to report incorrect questions so that I can fix them and make this website better!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Show assigned topics as filter-tag-style chips */}
          {assignedTopics.length > 0 && (
            <div className="rounded-lg border border-stone-200 bg-cream-50 p-3">
              <p className="text-sm font-medium text-warm-text-primary mb-2">
                Currently assigned topics:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {assignedTopics.map(topic => (
                  <span
                    key={topic.id}
                    className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-cream-50 px-2 py-1 text-xs text-warm-text-secondary"
                  >
                    <SquareCheckBig className="h-3.5 w-3.5 text-green-600" />
                    {topic.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Report type selection */}
          <div className="space-y-3">
            {reportTypeOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-start space-x-3 p-3 rounded-lg border border-stone-200 hover:bg-cream-50 cursor-pointer transition-colors"
                onClick={() => setSelectedType(option.value)}
              >
                <Checkbox
                  id={option.value}
                  checked={selectedType === option.value}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedType(option.value)
                    } else {
                      setSelectedType(null)
                      setDescription('')
                    }
                  }}
                />
                <Label
                  htmlFor={option.value}
                  className="cursor-pointer flex-1 font-normal"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>

          {/* Conditional textarea */}
          {selectedOption?.showTextarea && (
            <div className="space-y-2 animate-in slide-in-from-top-1">
              <Label className="text-sm text-warm-text-muted">
                Additional details{' '}
                <span className="text-warm-text-muted/60">
                  ({selectedOption.textareaRequired ? 'Required' : 'Optional'})
                </span>
              </Label>
              <Textarea
                placeholder={selectedOption.placeholder}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                className="min-h-[100px] resize-none"
              />
              <p className="text-xs text-warm-text-muted text-right">
                {description.length}/500 characters
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={!canSubmit}
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Flag } from 'lucide-react'
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
import { toast } from 'sonner'
import { createReport } from '@/lib/supabase/report-actions'
import type { Question } from '@/lib/types/database'

interface QuestionReportDialogProps {
  question: Question
  open: boolean
  onOpenChange: (open: boolean) => void
}

const reportTypeOptions = [
  {
    value: 'metadata' as const,
    label: 'Question information (Year, question number, subparts)',
    placeholder: 'Any other details about why it is wrong, or what it should be, would be hugely appreciated!'
  },
  {
    value: 'incorrect_topic' as const,
    label: 'Incorrect topic',
    placeholder: 'If you could share what you think the topic should be, or if you think the breakdown of topics for the subject could be improved, or any other details, then that would be amazing!'
  },
  {
    value: 'other' as const,
    label: 'Other',
    placeholder: 'Spill your heart out! The more detail the better, it goes a long way to make this website more useful for everyone.'
  }
]

export function QuestionReportDialog({
  question,
  open,
  onOpenChange
}: QuestionReportDialogProps) {
  const [selectedType, setSelectedType] = useState<'metadata' | 'incorrect_topic' | 'other' | null>(null)
  const [description, setDescription] = useState('')
  const queryClient = useQueryClient()

  // Build question title for display
  const questionTitle = `${question.year}${
    question.paper_number ? ` - Paper ${question.paper_number}` : ''
  }${question.exam_type === 'deferred' ? ' - Deferred' : ''} - Question ${
    question.question_number
  }${
    question.question_parts.length > 0 
      ? ` - ${question.question_parts.map(p => `(${p})`).join(', ')}`
      : ''
  }`

  // Get assigned topics for this question
  const assignedTopics = question.topics || []

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedType) {
        throw new Error('Please select a report type')
      }
      if (!description.trim() || description.trim().length < 10) {
        throw new Error('Please provide a description (minimum 10 characters)')
      }
      if (description.length > 500) {
        throw new Error('Description is too long (maximum 500 characters)')
      }

      const result = await createReport({
        question_id: question.id,
        report_type: selectedType,
        description: description.trim()
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit report')
      }

      return result
    },
    onSuccess: () => {
      toast.success('Report submitted successfully. Thank you for helping improve OSKO!')
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      setSelectedType(null)
      setDescription('')
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  const handleReset = () => {
    setSelectedType(null)
    setDescription('')
  }

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
          {/* Show assigned topics if they exist */}
          {assignedTopics.length > 0 && (
            <div className="rounded-lg border border-stone-200 bg-cream-50 p-3">
              <p className="text-sm font-medium text-warm-text-primary mb-2">
                Currently assigned topics:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {assignedTopics.map(topic => (
                  <li key={topic.id} className="text-sm text-warm-text-muted">
                    {topic.name}
                  </li>
                ))}
              </ul>
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

          {/* Description input */}
          {selectedType && (
            <div className="space-y-2 animate-in slide-in-from-top-1">
              <Textarea
                placeholder={reportTypeOptions.find(o => o.value === selectedType)?.placeholder}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
            disabled={!selectedType || !description.trim() || description.trim().length < 10 || submitMutation.isPending}
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
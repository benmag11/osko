'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { useFilters } from '@/components/providers/filter-provider'

interface QuestionsPanelProps {
  questionNumbers: number[]
}

export function QuestionsPanel({ questionNumbers }: QuestionsPanelProps) {
  const { filters, toggleQuestionNumber, isPending } = useFilters()

  if (questionNumbers.length === 0) {
    return (
      <p className="text-sm text-warm-text-muted py-2">
        No question numbers available for this subject.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {questionNumbers.map((questionNumber) => (
        <label
          key={questionNumber}
          className={`flex cursor-pointer items-center gap-3 px-2 py-1.5 rounded-md hover:bg-cream-200/50 transition-colors ${
            isPending ? 'opacity-70' : ''
          }`}
        >
          <Checkbox
            checked={filters.questionNumbers?.includes(questionNumber) ?? false}
            onCheckedChange={() => toggleQuestionNumber(questionNumber)}
            disabled={isPending}
            className="h-4 w-4 data-[state=checked]:animate-scale-in"
          />
          <span className="text-sm font-sans text-warm-text-secondary">
            Question {questionNumber}
          </span>
        </label>
      ))}
    </div>
  )
}

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
      <p className="text-sm text-stone-400 py-4 px-3 text-center">
        No question numbers available for this subject.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      {questionNumbers.map((questionNumber) => (
        <label
          key={questionNumber}
          className={`group flex cursor-pointer items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors duration-150 hover:bg-stone-50 ${
            isPending ? 'opacity-60' : ''
          }`}
        >
          <Checkbox
            checked={filters.questionNumbers?.includes(questionNumber) ?? false}
            onCheckedChange={() => toggleQuestionNumber(questionNumber)}
            disabled={isPending}
            className="h-4 w-4 border-stone-700 data-[state=checked]:bg-salmon-500 data-[state=checked]:border-salmon-500"
          />
          <span className="text-sm text-stone-800 transition-colors group-hover:text-stone-900">
            Question {questionNumber}
          </span>
        </label>
      ))}
    </div>
  )
}

import type { Question } from '@/lib/types/database'

export type QuestionTitleLike = Pick<
  Question,
  'year' |
    'paper_number' |
    'question_number' |
    'question_parts' |
    'exam_type' |
    'additional_info'
>

// Looser type that also accepts audio questions with nullable question_parts
export interface QuestionTitleInput {
  year: number
  paper_number: number | null
  question_number: number | null
  question_parts: string[] | null
  exam_type: 'normal' | 'deferred' | 'supplemental'
  additional_info: string | null
}

/**
 * Build the display title used for question cards and navigation entries.
 * Mirrors the formatting logic previously embedded in QuestionCard.
 */
export function formatQuestionTitle(question: QuestionTitleLike | QuestionTitleInput): string {
  const parts = question.question_parts ?? []
  const formattedParts = parts.length > 0
    ? parts.map((part) => `(${part})`).join(', ')
    : ''

  let title = `${question.year}`

  if (question.paper_number) {
    title += ` - Paper ${question.paper_number}`
  }

  if (question.exam_type === 'deferred') {
    title += ' - Deferred'
  }

  if (question.question_number !== null) {
    title += ` - Question ${question.question_number}`
  }

  if (formattedParts) {
    title += ` - ${formattedParts}`
  }

  if (question.additional_info) {
    title += ` - ${question.additional_info}`
  }

  return title
}

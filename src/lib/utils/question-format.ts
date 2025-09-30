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

/**
 * Build the display title used for question cards and navigation entries.
 * Mirrors the formatting logic previously embedded in QuestionCard.
 */
export function formatQuestionTitle(question: QuestionTitleLike): string {
  const formattedParts = question.question_parts.length > 0
    ? question.question_parts.map((part) => `(${part})`).join(', ')
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

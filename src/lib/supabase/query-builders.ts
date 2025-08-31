import type { Filters, QuestionCursor } from '@/lib/types/database'

/**
 * Shared query parameter builder for search_questions_paginated RPC function
 * Ensures consistent parameter structure between server and client queries
 */
export function buildSearchQueryParams(
  filters: Filters,
  cursor?: QuestionCursor | null,
  limit = 20
) {
  return {
    p_subject_id: filters.subjectId,
    p_search_terms: filters.searchTerms || null,
    p_years: filters.years || null,
    p_topic_ids: filters.topicIds || null,
    p_exam_types: filters.examTypes || null,
    p_question_numbers: filters.questionNumbers || null,
    p_cursor: cursor || null,
    p_limit: limit
  }
}

/**
 * Type-safe wrapper for the search_questions_paginated RPC function parameters
 * This ensures TypeScript catches any parameter mismatches
 */
export type SearchQueryParams = ReturnType<typeof buildSearchQueryParams>
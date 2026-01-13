import type { AudioFilters, QuestionCursor } from '@/lib/types/database'

/**
 * Query parameter builder for audio_search_questions_paginated RPC function
 * Similar to normal questions but without questionNumbers
 */
export function buildAudioSearchQueryParams(
  filters: AudioFilters,
  cursor?: QuestionCursor | null,
  limit = 20
) {
  return {
    p_subject_id: filters.subjectId,
    p_search_terms: filters.searchTerms || null,
    p_years: filters.years || null,
    p_topic_ids: filters.topicIds || null,
    p_exam_types: filters.examTypes || null,
    p_cursor: cursor || null,
    p_limit: limit
  }
}

/**
 * Type-safe wrapper for the audio_search_questions_paginated RPC function parameters
 */
export type AudioSearchQueryParams = ReturnType<typeof buildAudioSearchQueryParams>

/**
 * Query parameter builder for the audio_get_question_navigation_list RPC function
 * Mirrors the filter structure without cursor/limit
 */
export function buildAudioNavigationQueryParams(filters: AudioFilters) {
  return {
    p_subject_id: filters.subjectId,
    p_search_terms: filters.searchTerms || null,
    p_years: filters.years || null,
    p_topic_ids: filters.topicIds || null,
    p_exam_types: filters.examTypes || null,
  }
}

/**
 * Type-safe wrapper for the audio_get_question_navigation_list RPC function parameters
 */
export type AudioNavigationQueryParams = ReturnType<typeof buildAudioNavigationQueryParams>

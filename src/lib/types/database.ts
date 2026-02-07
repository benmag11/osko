export interface Database {
  public: {
    Tables: {
      subjects: {
        Row: Subject
        Insert: Omit<Subject, 'id' | 'created_at'>
        Update: Partial<Omit<Subject, 'id'>>
      }
      normal_topics: {
        Row: Topic
        Insert: Omit<Topic, 'id' | 'created_at'>
        Update: Partial<Omit<Topic, 'id'>>
      }
      normal_topic_groups: {
        Row: TopicGroup
        Insert: Omit<TopicGroup, 'id' | 'created_at'>
        Update: Partial<Omit<TopicGroup, 'id'>>
      }
      normal_questions: {
        Row: Question
        Insert: Omit<Question, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Question, 'id'>>
      }
      normal_question_topics: {
        Row: QuestionTopic
        Insert: QuestionTopic
        Update: Partial<QuestionTopic>
      }
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'user_id'>>
      }
      user_subjects: {
        Row: UserSubject
        Insert: Omit<UserSubject, 'id' | 'created_at'>
        Update: Partial<Omit<UserSubject, 'id' | 'user_id'>>
      }
      // Grinds tables
      grinds: {
        Row: Grind
        Insert: Omit<Grind, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Grind, 'id'>>
      }
      grind_registrations: {
        Row: GrindRegistration
        Insert: Omit<GrindRegistration, 'id' | 'created_at'>
        Update: Partial<Omit<GrindRegistration, 'id'>>
      }
      // Audio tables
      audio_topics: {
        Row: AudioTopic
        Insert: Omit<AudioTopic, 'id' | 'created_at'>
        Update: Partial<Omit<AudioTopic, 'id'>>
      }
      audio_questions: {
        Row: AudioQuestion
        Insert: Omit<AudioQuestion, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AudioQuestion, 'id'>>
      }
      audio_question_topics: {
        Row: AudioQuestionTopic
        Insert: AudioQuestionTopic
        Update: Partial<AudioQuestionTopic>
      }
    }
    Functions: {
      normal_search_questions_paginated: {
        Args: {
          p_subject_id: string
          p_search_terms?: string[] | null
          p_years?: number[] | null
          p_topic_ids?: string[] | null
          p_exam_types?: string[] | null
          p_question_numbers?: number[] | null
          p_cursor?: QuestionCursor | null
          p_limit?: number
        }
        Returns: PaginatedResponse
      }
      normal_get_question_navigation_list: {
        Args: {
          p_subject_id: string
          p_search_terms?: string[] | null
          p_years?: number[] | null
          p_topic_ids?: string[] | null
          p_exam_types?: string[] | null
          p_question_numbers?: number[] | null
        }
        Returns: NavigationListResponse
      }
      normal_get_available_years: {
        Args: {
          p_subject_id: string
        }
        Returns: number[]
      }
      get_user_subjects_sorted: {
        Args: {
          p_user_id: string
        }
        Returns: Array<{
          id: string
          user_id: string
          subject_id: string
          created_at: string | null
          grade: string | null
          is_favourite: boolean
          subject: Subject
        }>
      }
      update_user_subject_grade: {
        Args: {
          p_user_id: string
          p_subject_id: string
          p_grade: string | null
        }
        Returns: {
          success: boolean
          error?: string
        }
      }
      normal_get_available_question_numbers: {
        Args: {
          p_subject_id: string
        }
        Returns: number[]
      }
      update_user_subjects: {
        Args: {
          p_user_id: string
          p_subject_ids: string[]
        }
        Returns: {
          success: boolean
          count: number
        }
      }
      // Audio question functions
      audio_search_questions_paginated: {
        Args: {
          p_subject_id: string
          p_search_terms?: string[] | null
          p_years?: number[] | null
          p_topic_ids?: string[] | null
          p_exam_types?: string[] | null
          p_cursor?: QuestionCursor | null
          p_limit?: number
        }
        Returns: AudioPaginatedResponse
      }
      audio_get_question_navigation_list: {
        Args: {
          p_subject_id: string
          p_search_terms?: string[] | null
          p_years?: number[] | null
          p_topic_ids?: string[] | null
          p_exam_types?: string[] | null
        }
        Returns: AudioNavigationListResponse
      }
      audio_get_available_years: {
        Args: {
          p_subject_id: string
        }
        Returns: number[]
      }
      get_subjects_with_audio_questions: {
        Args: Record<string, never>
        Returns: Subject[]
      }
      // Grinds functions
      register_for_grind_with_credit: {
        Args: {
          p_user_id: string
          p_grind_id: string
        }
        Returns: boolean
      }
      unregister_from_grind_with_credit_restore: {
        Args: {
          p_user_id: string
          p_grind_id: string
        }
        Returns: boolean
      }
      get_grinds_for_week: {
        Args: {
          week_offset?: number
        }
        Returns: GrindWithStatus[]
      }
    }
  }
}

export interface Subject {
  id: string
  name: string
  level: 'Higher' | 'Ordinary' | 'Foundation'
  created_at: string
}

export interface TopicGroup {
  id: string
  name: string
  subject_id: string
  created_at: string
}

export interface Topic {
  id: string
  name: string
  subject_id: string
  group_id: string | null
  created_at: string
}

export interface GroupedTopics {
  ungrouped: Topic[]
  groups: Array<{
    group: TopicGroup
    topics: Topic[]
  }>
}

// Type for word coordinate information (matches OCR pipeline output)
export interface WordBbox {
  x: number
  y: number
  w: number
  h: number
}

export interface WordCoordinate {
  text: string
  bbox: WordBbox
  confidence: number
}

export interface WordCoordinatesData {
  words: WordCoordinate[]
}

export interface Question {
  id: string
  subject_id: string
  year: number
  paper_number: number | null
  question_number: number | null
  question_parts: string[]
  exam_type: 'normal' | 'deferred' | 'supplemental'
  question_image_url: string | null
  marking_scheme_image_url: string | null
  question_image_width: number | null
  question_image_height: number | null
  marking_scheme_image_width: number | null
  marking_scheme_image_height: number | null
  full_text: string | null
  additional_info: string | null
  word_coordinates: WordCoordinatesData | null
  created_at: string
  updated_at: string
  topics?: Array<{
    id: string
    name: string
  }>
  subject?: Subject
}

export interface QuestionNavigationFields {
  id: string
  year: number
  paper_number: number | null
  question_number: number | null
  question_parts: string[]
  exam_type: 'normal' | 'deferred' | 'supplemental'
  additional_info: string | null
}

/**
 * Shared fields between Question and AudioQuestion for components
 * that accept either type (e.g., QuestionReportDialog).
 * Uses the loosest nullability to accommodate both.
 */
export interface BaseReportableQuestion {
  id: string
  subject_id: string
  year: number
  paper_number: number | null
  question_number: number | null
  question_parts: string[] | null
  exam_type: 'normal' | 'deferred' | 'supplemental'
  additional_info: string | null
  topics?: Array<{ id: string; name: string }>
}

export interface QuestionTopic {
  question_id: string
  topic_id: string
  created_at: string
}

export interface Filters {
  subjectId: string
  searchTerms?: string[]
  years?: number[]
  topicIds?: string[]
  examTypes?: string[]
  questionNumbers?: number[]
}

export interface QuestionCursor {
  sort_key: string  // Primary field for cursor comparison
  year: number
  paper_number: number | null
  exam_type: 'normal' | 'deferred' | 'supplemental'
  question_number: number | null
  question_parts: string[]
  additional_info: string | null  // Included in sort key for alphabetical ordering
}

export interface PaginatedResponse {
  questions: Question[]
  next_cursor: QuestionCursor | null
  total_count: number
}

export interface NavigationListResponse {
  items: QuestionNavigationFields[]
  total_count: number
}

export interface UserProfile {
  id: string
  user_id: string
  name: string
  onboarding_completed: boolean | null
  is_admin: boolean
  created_at: string | null
  updated_at: string | null
  // Subscription fields
  stripe_customer_id: string | null
  subscription_status: 'none' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing'
  subscription_id: string | null
  subscription_current_period_end: string | null
  subscription_cancel_at_period_end: boolean
  free_grind_credits: number
}

// CAO Points Grade Types
export type HigherGrade = 'H1' | 'H2' | 'H3' | 'H4' | 'H5' | 'H6' | 'H7' | 'H8'
export type OrdinaryGrade = 'O1' | 'O2' | 'O3' | 'O4' | 'O5' | 'O6' | 'O7' | 'O8'
export type LcvpGrade = 'Distinction' | 'Merit' | 'Pass'
export type Grade = HigherGrade | OrdinaryGrade | LcvpGrade

export interface UserSubject {
  id: string
  user_id: string
  subject_id: string
  grade: string | null
  is_favourite: boolean
  created_at: string | null
}

export interface UserSubjectWithSubject extends UserSubject {
  subject: Subject
}

// Type for audit log changes based on the action type
export type AuditLogChanges = 
  | { before: Partial<Question>; after: QuestionUpdatePayload } // for 'update' action
  | { deletedData: Question } // for 'delete' action  
  | { topicId: string; topicName: string } // for 'topic_add' or 'topic_remove' actions

export interface QuestionAuditLog {
  id: string
  question_id: string
  user_id: string | null
  action: 'update' | 'delete' | 'topic_add' | 'topic_remove'
  changes: AuditLogChanges
  created_at: string
}

export interface QuestionUpdatePayload {
  year?: number
  paper_number?: number | null
  question_number?: number | null
  question_parts?: string[]
  exam_type?: 'normal' | 'deferred' | 'supplemental'
  additional_info?: string | null
  topic_ids?: string[]
}

export interface QuestionReport {
  id: string
  question_id: string
  user_id: string
  report_type: 'metadata' | 'incorrect_topic' | 'other'
  description: string
  status: 'pending' | 'resolved' | 'dismissed'
  resolved_by: string | null
  resolved_at: string | null
  admin_notes: string | null
  created_at: string
  // Joined data
  question?: Question
}

export interface ReportStatistics {
  total_reports: number
  pending_reports: number
  resolved_reports: number
  reports_by_type: {
    metadata: number
    incorrect_topic: number
    other: number
  }
}

export interface CreateReportPayload {
  question_id: string
  report_type: 'metadata' | 'incorrect_topic' | 'other'
  description: string
}

export interface UpdateReportPayload {
  status?: 'pending' | 'resolved' | 'dismissed'
  admin_notes?: string
}

// =============================================================================
// Audio Question Types
// =============================================================================

/**
 * Transcript word with timing information for audio synchronization
 */
export interface TranscriptWord {
  text: string
  start: number  // Start time in seconds
  end: number    // End time in seconds
}

/**
 * Header section in transcript (e.g., "Fógra 1")
 */
export interface TranscriptHeader {
  type: 'header_one' | 'header_two'
  text: string
}

/**
 * Sentence with words, translation, and optional speaker
 */
export interface TranscriptSentence {
  type: 'sentence'
  words: TranscriptWord[]
  translation: string
  speaker?: string  // Optional speaker name for conversations (e.g., "Pádraig", "Eithne")
}

/**
 * Union type for transcript items (headers or sentences)
 */
export type TranscriptItem = TranscriptHeader | TranscriptSentence

/**
 * Audio topic (separate from normal topics)
 */
export interface AudioTopic {
  id: string
  name: string
  subject_id: string
  created_at: string
}

/**
 * Junction table linking audio questions to audio topics
 */
export interface AudioQuestionTopic {
  audio_question_id: string
  audio_topic_id: string
  created_at: string
}

/**
 * Audio question with audio and transcript URLs
 */
export interface AudioQuestion {
  id: string
  subject_id: string
  year: number
  paper_number: number | null
  question_number: number | null
  question_parts: string[] | null
  exam_type: 'normal' | 'deferred' | 'supplemental'
  additional_info: string | null
  question_image_url: string | null
  question_image_width: number | null
  question_image_height: number | null
  marking_scheme_image_url: string | null
  marking_scheme_image_width: number | null
  marking_scheme_image_height: number | null
  audio_url: string | null
  map_json_url: string | null
  full_text: string | null
  created_at: string
  updated_at: string
  topics?: Array<{
    id: string
    name: string
  }>
}

/**
 * Minimal fields for audio question navigation (sidebar list)
 */
export interface AudioQuestionNavigationFields {
  id: string
  year: number
  paper_number: number | null
  question_number: number | null
  question_parts: string[] | null
  exam_type: 'normal' | 'deferred' | 'supplemental'
  additional_info: string | null
}

/**
 * Filters for audio questions (no questionNumbers)
 */
export interface AudioFilters {
  subjectId: string
  searchTerms?: string[]
  years?: number[]
  topicIds?: string[]
  examTypes?: string[]
}

/**
 * Paginated response for audio questions
 */
export interface AudioPaginatedResponse {
  questions: AudioQuestion[]
  next_cursor: QuestionCursor | null
  total_count: number
}

/**
 * Navigation list response for audio questions
 */
export interface AudioNavigationListResponse {
  items: AudioQuestionNavigationFields[]
  total_count: number
}

/**
 * Payload for updating audio question metadata
 */
export interface AudioQuestionUpdatePayload {
  year?: number
  paper_number?: number | null
  question_number?: number | null
  question_parts?: string[]
  exam_type?: 'normal' | 'deferred' | 'supplemental'
  additional_info?: string | null
  topic_ids?: string[]
}

// =============================================================================
// Subscription State
// =============================================================================

export type SubscriptionState =
  | 'loading'
  | 'active'
  | 'canceling'
  | 'trialing'
  | 'past_due'
  | 'expired'
  | 'free_credits'
  | 'no_access'

// =============================================================================
// Grinds Types
// =============================================================================

export interface Grind {
  id: string
  title: string
  description: string | null
  scheduled_at: string
  duration_minutes: number
  meeting_url: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface GrindRegistration {
  id: string
  grind_id: string
  user_id: string
  confirmation_email_sent_at: string | null
  reminder_email_sent_at: string | null
  used_free_grind: boolean
  created_at: string
}

export interface GrindWithStatus {
  id: string
  title: string
  description: string | null
  scheduled_at: string
  duration_minutes: number
  meeting_url: string | null
  created_at: string
  registration_count: number
  is_registered: boolean
}

/**
 * Type for audio audit log changes based on the action type
 */
export type AudioAuditLogChanges =
  | { before: Partial<AudioQuestion>; after: AudioQuestionUpdatePayload } // for 'update' action
  | { deletedData: AudioQuestion } // for 'delete' action
  | { topicId: string; topicName: string } // for 'topic_add' or 'topic_remove' actions

/**
 * Audit log entry for audio question changes
 */
export interface AudioQuestionAuditLog {
  id: string
  question_id: string
  user_id: string | null
  action: 'update' | 'delete' | 'topic_add' | 'topic_remove'
  changes: AudioAuditLogChanges
  created_at: string
}

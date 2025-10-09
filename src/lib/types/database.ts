export interface Database {
  public: {
    Tables: {
      subjects: {
        Row: Subject
        Insert: Omit<Subject, 'id' | 'created_at'>
        Update: Partial<Omit<Subject, 'id'>>
      }
      topics: {
        Row: Topic
        Insert: Omit<Topic, 'id' | 'created_at'>
        Update: Partial<Omit<Topic, 'id'>>
      }
      questions: {
        Row: Question
        Insert: Omit<Question, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Question, 'id'>>
      }
      question_topics: {
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
    }
    Functions: {
      search_questions_paginated: {
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
      get_question_navigation_list: {
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
      get_available_years: {
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
          subject: Subject
        }>
      }
      get_available_question_numbers: {
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
    }
  }
}

export interface Subject {
  id: string
  name: string
  level: 'Higher' | 'Ordinary' | 'Foundation'
  created_at: string
}

export interface Topic {
  id: string
  name: string
  subject_id: string
  created_at: string
}

// Type for word coordinate information
export interface WordCoordinate {
  text: string
  x: number
  y: number
  width: number
  height: number
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
  word_coordinates: WordCoordinate[] | null
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
}

export interface UserSubject {
  id: string
  user_id: string
  subject_id: string
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

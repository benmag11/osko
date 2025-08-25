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
          p_cursor?: { year: number; question_number: number } | null
          p_limit?: number
        }
        Returns: PaginatedResponse
      }
      get_available_years: {
        Args: {
          p_subject_id: string
        }
        Returns: number[]
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
  question_number: number
  question_parts: string[]
  exam_type: 'normal' | 'deferred' | 'supplemental'
  question_image_url: string
  marking_scheme_image_url: string
  full_text: string | null
  word_coordinates: WordCoordinate[] | null
  created_at: string
  updated_at: string
  topics?: Array<{
    id: string
    name: string
  }>
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
}

export interface PaginatedResponse {
  questions: Question[]
  next_cursor: {
    year: number
    question_number: number
  } | null
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
  question_number?: number
  question_parts?: string[]
  exam_type?: 'normal' | 'deferred' | 'supplemental'
  topic_ids?: string[]
}
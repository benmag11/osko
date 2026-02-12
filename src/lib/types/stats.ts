// Types matching the get_user_completion_stats RPC JSONB return shape

export interface SubjectStats {
  subject_id: string
  subject_name: string
  subject_level: string
  unique_completed: number
  total_completions: number
  total_available: number
  audio_unique_completed?: number
  audio_total_completions?: number
  audio_total_available?: number
}

export interface TopicStats {
  topic_id: string
  topic_name: string
  subject_id: string
  total_completions: number
  unique_completed: number
}

export interface YearStats {
  year: number
  total_completions: number
  unique_completed: number
}

export interface RecentActivity {
  completion_id: string
  completed_at: string
  question_id: string
  year: number
  paper_number: number
  question_number: number
  question_parts: string | null
  exam_type: string
  additional_info: string | null
  subject_name: string
  subject_level: string
  question_type?: 'normal' | 'audio'
}

export interface DailyActivity {
  date: string
  count: number
}

export interface CompletionStats {
  total_completions: number
  unique_questions: number
  by_subject: SubjectStats[]
  by_topic: TopicStats[]
  by_audio_topic: TopicStats[]
  by_year: YearStats[]
  recent_activity: RecentActivity[]
  daily_activity: DailyActivity[]
}

// Time period filter
export type TimePeriod = 'all' | 'year' | 'month' | 'week'

export const TIME_PERIOD_OPTIONS: { label: string; value: TimePeriod; daysAgo: number | null }[] = [
  { label: 'All Time', value: 'all', daysAgo: null },
  { label: 'This Year', value: 'year', daysAgo: 365 },
  { label: 'This Month', value: 'month', daysAgo: 30 },
  { label: 'This Week', value: 'week', daysAgo: 7 },
]

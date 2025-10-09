// TypeScript interfaces for image dimensions backfill script

export interface ImageDimensions {
  width: number
  height: number
}

export interface QuestionRow {
  id: string
  question_image_url: string | null
  marking_scheme_image_url: string | null
  question_image_width: number | null
  question_image_height: number | null
  marking_scheme_image_width: number | null
  marking_scheme_image_height: number | null
}

export interface ProcessedDimensions {
  questionId: string
  questionImageWidth: number | null
  questionImageHeight: number | null
  markingSchemeImageWidth: number | null
  markingSchemeImageHeight: number | null
}

export interface BatchUpdateRow {
  id: string
  question_image_width: number | null
  question_image_height: number | null
  marking_scheme_image_width: number | null
  marking_scheme_image_height: number | null
}

export interface Checkpoint {
  lastProcessedOffset: number
  totalProcessed: number
  startedAt: string
  lastUpdate: string
  errors: ErrorRecord[]
}

export interface ErrorRecord {
  questionId: string
  url: string
  error: string
  timestamp: string
}

export interface ScriptConfig {
  BATCH_SIZE: number
  CONCURRENCY_LIMIT: number
  IMAGE_TIMEOUT_MS: number
  MAX_RETRIES: number
  RETRY_BASE_DELAY_MS: number
  INTER_BATCH_DELAY_MS: number
  CHECKPOINT_FILE: string
  ERROR_LOG_FILE: string
}

export interface ScriptOptions {
  dryRun: boolean
  limit: number | null
  retryFailed: boolean
  force: boolean
}

export interface BackfillStats {
  totalQuestions: number
  successfulQuestions: number
  failedQuestions: number
  totalImagesProcessed: number
  duration: number
  averageSpeed: number
  errors: {
    notFound: number
    timeout: number
    invalid: number
    other: number
  }
}

'use server'

import { createServerSupabaseClient } from './server'
import { ensureAdmin } from './admin-context'
import type {
  CreateReportPayload,
  UpdateReportPayload,
  QuestionReport,
  ReportStatistics
} from '@/lib/types/database'
import { formatQuestionTitle } from '@/lib/utils/question-format'
import { sendReportAcknowledgementEmail } from '@/lib/email/report-emails'

export async function createReport(
  payload: CreateReportPayload
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()

  try {
    // Server-side validation
    const validReportTypes = ['metadata', 'incorrect_topic', 'other'] as const
    if (!validReportTypes.includes(payload.report_type)) {
      return { success: false, error: 'Invalid report type' }
    }
    if (payload.description && payload.description.trim().length > 500) {
      return { success: false, error: 'Description must be 500 characters or less' }
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'You must be logged in to report a question' }
    }

    // Determine which typed FK column to use
    const isAudio = payload.question_type === 'audio'
    const fkColumn = isAudio ? 'audio_question_id' : 'normal_question_id'

    // Check for existing report of same type by this user using the typed FK
    const { data: existingReport } = await supabase
      .from('question_reports')
      .select('id')
      .eq(fkColumn, payload.question_id)
      .eq('user_id', user.id)
      .eq('report_type', payload.report_type)
      .single()

    if (existingReport) {
      return {
        success: false,
        error: 'You have already reported this issue for this question'
      }
    }

    // Create the report with the correct typed FK column
    const { error: insertError } = await supabase
      .from('question_reports')
      .insert({
        question_type: payload.question_type,
        [fkColumn]: payload.question_id,
        user_id: user.id,
        report_type: payload.report_type,
        description: payload.description?.trim() || null
      })

    if (insertError) {
      console.error('Failed to create report:', insertError)
      return { success: false, error: 'Failed to submit report' }
    }

    // Fire-and-forget: send acknowledgement email
    try {
      const questionTable = isAudio ? 'audio_questions' : 'normal_questions'
      const { data: question } = await supabase
        .from(questionTable)
        .select('year, paper_number, question_number, question_parts, exam_type, additional_info')
        .eq('id', payload.question_id)
        .single()

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('id', user.id)
        .single()

      if (question && user.email) {
        const questionTitle = formatQuestionTitle(question)
        const userName = profile?.display_name || user.email.split('@')[0]

        sendReportAcknowledgementEmail({
          userName,
          userEmail: user.email,
          questionTitle,
        }).catch((err) => {
          console.error('Failed to send report acknowledgement email:', err)
        })
      }
    } catch (emailErr) {
      console.error('Error preparing report acknowledgement email:', emailErr)
    }

    return { success: true }
  } catch (error) {
    console.error('Error creating report:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit report'
    }
  }
}

export async function updateReportStatus(
  reportId: string,
  updates: UpdateReportPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify admin status using centralized helper
    const userId = await ensureAdmin()
    
    const supabase = await createServerSupabaseClient()
    
    // Update the report
    const updateData: Record<string, unknown> = {}
    
    // Add status if provided
    if (updates.status !== undefined) {
      updateData.status = updates.status
    }
    
    // Add admin notes if provided
    if (updates.admin_notes !== undefined) {
      updateData.admin_notes = updates.admin_notes
    }
    
    // If resolving/dismissing, add resolver info; if re-opening, clear it
    if (updates.status === 'resolved' || updates.status === 'dismissed') {
      updateData.resolved_by = userId
      updateData.resolved_at = new Date().toISOString()
    } else if (updates.status === 'pending') {
      updateData.resolved_by = null
      updateData.resolved_at = null
    }
    
    const { error: updateError } = await supabase
      .from('question_reports')
      .update(updateData)
      .eq('id', reportId)
    
    if (updateError) {
      console.error('Failed to update report:', updateError)
      return { success: false, error: 'Failed to update report' }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error updating report:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update report' 
    }
  }
}

export async function getReports(
  status?: 'pending' | 'resolved' | 'dismissed'
): Promise<QuestionReport[]> {
  // Verify admin status using centralized helper
  try {
    await ensureAdmin()
  } catch {
    return []
  }

  const supabase = await createServerSupabaseClient()

  // Two LEFT JOINs: one for normal questions, one for audio questions.
  // Only one will return data per row based on question_type.
  let query = supabase
    .from('question_reports')
    .select(`
      *,
      normal_question:normal_questions!question_reports_normal_question_id_fkey(
        id,
        year,
        paper_number,
        question_number,
        question_parts,
        exam_type,
        additional_info,
        subject_id,
        subject:subjects(id, name, level),
        topics:normal_question_topics(
          topic:normal_topics(id, name)
        )
      ),
      audio_question:audio_questions!question_reports_audio_question_id_fkey(
        id,
        year,
        paper_number,
        question_number,
        question_parts,
        exam_type,
        additional_info,
        subject_id,
        subject:subjects(id, name, level),
        topics:audio_question_topics(
          topic:audio_topics(id, name)
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to fetch reports:', error)
    return []
  }

  // Normalize: merge whichever join returned data into a unified `question` field
  const transformedData = data?.map((report) => {
    const raw = report.normal_question ?? report.audio_question
    if (raw?.topics) {
      raw.topics = raw.topics.map(
        (t: { topic: { id: string; name: string } }) => t.topic
      )
    }
    return {
      ...report,
      question: raw ?? undefined,
      // Clean up the split join fields from the response
      normal_question: undefined,
      audio_question: undefined,
    } as QuestionReport
  })

  return transformedData || []
}

export async function getReportStatistics(): Promise<ReportStatistics | null> {
  // Verify admin status using centralized helper
  try {
    await ensureAdmin()
  } catch {
    return null
  }
  
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .rpc('get_report_statistics')
    .single()
  
  if (error) {
    console.error('Failed to fetch report statistics:', error)
    return null
  }
  
  return data as ReportStatistics
}


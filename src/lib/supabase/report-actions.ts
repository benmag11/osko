'use server'

import { createServerSupabaseClient } from './server'
import { ensureAdmin } from './admin-context'
import type { 
  CreateReportPayload, 
  UpdateReportPayload,
  QuestionReport,
  ReportStatistics 
} from '@/lib/types/database'

export async function createReport(
  payload: CreateReportPayload
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: 'You must be logged in to report a question' }
    }
    
    // Check for existing report of same type by this user
    const { data: existingReport } = await supabase
      .from('question_reports')
      .select('id')
      .eq('question_id', payload.question_id)
      .eq('user_id', user.id)
      .eq('report_type', payload.report_type)
      .single()
    
    if (existingReport) {
      return { 
        success: false, 
        error: 'You have already reported this issue for this question' 
      }
    }
    
    // Create the report
    const { error: insertError } = await supabase
      .from('question_reports')
      .insert({
        question_id: payload.question_id,
        user_id: user.id,
        report_type: payload.report_type,
        description: payload.description
      })
    
    if (insertError) {
      console.error('Failed to create report:', insertError)
      return { success: false, error: 'Failed to submit report' }
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
    
    // If resolving, add resolver info
    if (updates.status === 'resolved' || updates.status === 'dismissed') {
      updateData.resolved_by = userId
      updateData.resolved_at = new Date().toISOString()
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
  
  // Build query
  let query = supabase
    .from('question_reports')
    .select(`
      *,
      question:normal_questions!inner(
        id,
        year,
        paper_number,
        question_number,
        question_parts,
        exam_type,
        subject_id,
        subject:subjects(id, name, level),
        topics:normal_question_topics(
          topic:normal_topics(id, name)
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
  
  // Transform the topics data structure
  const transformedData = data?.map(report => {
    if (report.question?.topics) {
      report.question.topics = report.question.topics.map((t: { topic: { id: string; name: string } }) => t.topic)
    }
    return report
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


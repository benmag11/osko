'use server'

import { createServerSupabaseClient } from './server'
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
  const supabase = await createServerSupabaseClient()
  
  try {
    // Verify admin status
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()
    
    if (!profile?.is_admin) {
      return { success: false, error: 'Unauthorized' }
    }
    
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
      updateData.resolved_by = user.id
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
  status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
): Promise<QuestionReport[]> {
  const supabase = await createServerSupabaseClient()
  
  // Verify admin status
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()
  
  if (!profile?.is_admin) return []
  
  // Build query
  let query = supabase
    .from('question_reports')
    .select(`
      *,
      question:questions!inner(
        id,
        year,
        paper_number,
        question_number,
        question_parts,
        exam_type,
        subject_id,
        subject:subjects(id, name, level),
        topics:question_topics(
          topic:topics(id, name)
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
  const supabase = await createServerSupabaseClient()
  
  // Verify admin status
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()
  
  if (!profile?.is_admin) return null
  
  const { data, error } = await supabase
    .rpc('get_report_statistics')
    .single()
  
  if (error) {
    console.error('Failed to fetch report statistics:', error)
    return null
  }
  
  return data as ReportStatistics
}

export async function getReportAuditLog(
  reportId: string
): Promise<{ changes: {
  before: Record<string, unknown>
  after: Record<string, unknown>
} } | null> {
  const supabase = await createServerSupabaseClient()
  
  // Verify admin status
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()
  
  if (!profile?.is_admin) return null
  
  const { data, error } = await supabase
    .from('question_audit_log')
    .select('changes')
    .eq('report_id', reportId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (error) {
    console.error('Failed to fetch audit log for report:', error)
    return null
  }
  
  return data
}
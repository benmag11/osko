'use server'

import { createServerSupabaseClient } from './server'
import { ensureAdmin } from './admin-context'
import type { QuestionUpdatePayload, QuestionAuditLog } from '@/lib/types/database'

export async function updateQuestionMetadata(
  questionId: string,
  updates: QuestionUpdatePayload
): Promise<{ success: boolean; error?: string; auditLogId?: string }> {
  try {
    await ensureAdmin()
  } catch {
    return { success: false, error: 'Unauthorized' }
  }
  
  const supabase = await createServerSupabaseClient()
  
  try {
    // Get current question data for audit log
    const { data: currentQuestion } = await supabase
      .from('questions')
      .select('*, question_topics(topic_id)')
      .eq('id', questionId)
      .single()
    
    // Update question metadata
    interface QuestionUpdate {
      year?: number
      paper_number?: number | null
      question_number?: number | null
      question_parts?: string[]
      exam_type?: 'normal' | 'deferred' | 'supplemental'
      additional_info?: string | null
      updated_at: string
    }

    const updateData: QuestionUpdate = {
      updated_at: new Date().toISOString()
    }

    if (updates.year !== undefined) updateData.year = updates.year
    if (updates.paper_number !== undefined) updateData.paper_number = updates.paper_number
    if (updates.question_number !== undefined) updateData.question_number = updates.question_number
    if (updates.question_parts !== undefined) updateData.question_parts = updates.question_parts
    if (updates.exam_type !== undefined) updateData.exam_type = updates.exam_type
    if (updates.additional_info !== undefined) updateData.additional_info = updates.additional_info
    
    const { error: updateError } = await supabase
      .from('questions')
      .update(updateData)
      .eq('id', questionId)
    
    if (updateError) throw updateError
    
    // Handle topic updates if provided
    if (updates.topic_ids !== undefined) {
      // Remove all existing topics
      await supabase
        .from('question_topics')
        .delete()
        .eq('question_id', questionId)
      
      // Add new topics
      if (updates.topic_ids.length > 0) {
        const { error: insertError } = await supabase
          .from('question_topics')
          .insert(
            updates.topic_ids.map(topicId => ({
              question_id: questionId,
              topic_id: topicId
            }))
          )
        
        if (insertError) throw insertError
      }
    }
    
    // Create audit log entry
    const { data: { user } } = await supabase.auth.getUser()
    const { data: auditLog } = await supabase
      .from('question_audit_log')
      .insert({
        question_id: questionId,
        user_id: user?.id,
        action: 'update',
        changes: {
          before: currentQuestion,
          after: updates
        }
      })
      .select('id')
      .single()
    
    return { success: true, auditLogId: auditLog?.id }
  } catch (error) {
    console.error('Failed to update question:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Update failed' 
    }
  }
}

export async function getQuestionAuditHistory(
  questionId: string
): Promise<QuestionAuditLog[]> {
  try {
    await ensureAdmin()
  } catch {
    return []
  }
  
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('question_audit_log')
    .select('*')
    .eq('question_id', questionId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Failed to fetch audit history:', error)
    return []
  }
  
  return data || []
}
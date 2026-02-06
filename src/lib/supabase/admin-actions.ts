'use server'

import { createServerSupabaseClient } from './server'
import { ensureAdmin } from './admin-context'
import type { QuestionUpdatePayload, QuestionAuditLog, AudioQuestionUpdatePayload, AudioQuestionAuditLog, Topic, AudioTopic } from '@/lib/types/database'

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
      .from('normal_questions')
      .select('*, normal_question_topics(topic_id)')
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
      .from('normal_questions')
      .update(updateData)
      .eq('id', questionId)
    
    if (updateError) throw updateError
    
    // Handle topic updates if provided
    if (updates.topic_ids !== undefined) {
      // Remove all existing topics
      await supabase
        .from('normal_question_topics')
        .delete()
        .eq('question_id', questionId)

      // Add new topics
      if (updates.topic_ids.length > 0) {
        const { error: insertError } = await supabase
          .from('normal_question_topics')
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

// =============================================================================
// Topic Creation Actions
// =============================================================================

export async function createTopic(
  name: string,
  subjectId: string
): Promise<{ success: boolean; topic?: Topic; error?: string }> {
  try {
    await ensureAdmin()
  } catch {
    return { success: false, error: 'Unauthorized' }
  }

  const supabase = await createServerSupabaseClient()

  try {
    // Check for duplicate name within this subject (case-insensitive)
    // Escape ILIKE wildcards to prevent false matches (e.g. "Topic_1" matching "TopicA1")
    const escapedName = name.trim().replace(/%/g, '\\%').replace(/_/g, '\\_')
    const { data: existing } = await supabase
      .from('normal_topics')
      .select('id')
      .eq('subject_id', subjectId)
      .ilike('name', escapedName)
      .limit(1)

    if (existing && existing.length > 0) {
      return { success: false, error: 'A topic with this name already exists' }
    }

    const { data: topic, error } = await supabase
      .from('normal_topics')
      .insert({ name: name.trim(), subject_id: subjectId, group_id: null })
      .select()
      .single()

    if (error) throw error

    return { success: true, topic: topic as Topic }
  } catch (error) {
    console.error('Failed to create topic:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create topic'
    }
  }
}

export async function createAudioTopic(
  name: string,
  subjectId: string
): Promise<{ success: boolean; topic?: AudioTopic; error?: string }> {
  try {
    await ensureAdmin()
  } catch {
    return { success: false, error: 'Unauthorized' }
  }

  const supabase = await createServerSupabaseClient()

  try {
    // Check for duplicate name within this subject (case-insensitive)
    // Escape ILIKE wildcards to prevent false matches (e.g. "Topic_1" matching "TopicA1")
    const escapedName = name.trim().replace(/%/g, '\\%').replace(/_/g, '\\_')
    const { data: existing } = await supabase
      .from('audio_topics')
      .select('id')
      .eq('subject_id', subjectId)
      .ilike('name', escapedName)
      .limit(1)

    if (existing && existing.length > 0) {
      return { success: false, error: 'A topic with this name already exists' }
    }

    const { data: topic, error } = await supabase
      .from('audio_topics')
      .insert({ name: name.trim(), subject_id: subjectId })
      .select()
      .single()

    if (error) throw error

    return { success: true, topic: topic as AudioTopic }
  } catch (error) {
    console.error('Failed to create audio topic:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create topic'
    }
  }
}

// =============================================================================
// Audio Question Admin Actions
// =============================================================================

export async function updateAudioQuestionMetadata(
  questionId: string,
  updates: AudioQuestionUpdatePayload
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
      .from('audio_questions')
      .select('*, audio_question_topics(audio_topic_id)')
      .eq('id', questionId)
      .single()

    // Update question metadata
    interface AudioQuestionUpdate {
      year?: number
      paper_number?: number | null
      question_number?: number | null
      question_parts?: string[]
      exam_type?: 'normal' | 'deferred' | 'supplemental'
      additional_info?: string | null
      updated_at: string
    }

    const updateData: AudioQuestionUpdate = {
      updated_at: new Date().toISOString()
    }

    if (updates.year !== undefined) updateData.year = updates.year
    if (updates.paper_number !== undefined) updateData.paper_number = updates.paper_number
    if (updates.question_number !== undefined) updateData.question_number = updates.question_number
    if (updates.question_parts !== undefined) updateData.question_parts = updates.question_parts
    if (updates.exam_type !== undefined) updateData.exam_type = updates.exam_type
    if (updates.additional_info !== undefined) updateData.additional_info = updates.additional_info

    const { error: updateError } = await supabase
      .from('audio_questions')
      .update(updateData)
      .eq('id', questionId)

    if (updateError) throw updateError

    // Handle topic updates if provided
    if (updates.topic_ids !== undefined) {
      // Remove all existing topics
      await supabase
        .from('audio_question_topics')
        .delete()
        .eq('audio_question_id', questionId)

      // Add new topics
      if (updates.topic_ids.length > 0) {
        const { error: insertError } = await supabase
          .from('audio_question_topics')
          .insert(
            updates.topic_ids.map(topicId => ({
              audio_question_id: questionId,
              audio_topic_id: topicId
            }))
          )

        if (insertError) throw insertError
      }
    }

    // Create audit log entry
    const { data: { user } } = await supabase.auth.getUser()
    const { data: auditLog } = await supabase
      .from('audio_question_audit_log')
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
    console.error('Failed to update audio question:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Update failed'
    }
  }
}

export async function getAudioQuestionAuditHistory(
  questionId: string
): Promise<AudioQuestionAuditLog[]> {
  try {
    await ensureAdmin()
  } catch {
    return []
  }

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('audio_question_audit_log')
    .select('*')
    .eq('question_id', questionId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch audio audit history:', error)
    return []
  }

  return data || []
}
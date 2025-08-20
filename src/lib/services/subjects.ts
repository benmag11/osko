import { createClient } from '@/lib/supabase/server'
import type { Subject, UserSubjectWithSubject } from '@/lib/types/database'

export async function getAllSubjects(): Promise<Subject[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .in('level', ['Higher', 'Ordinary'])
    .order('name')
    .order('level')

  if (error) {
    console.error('Error fetching subjects:', error)
    return []
  }

  return data || []
}

export async function getSubjectById(id: string): Promise<Subject | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching subject by id:', error)
    return null
  }

  return data
}

export async function getUserSubjects(userId: string): Promise<UserSubjectWithSubject[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('user_subjects')
    .select(`
      *,
      subject:subjects(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching user subjects:', error)
    return []
  }

  return data || []
}

export async function saveUserSubjects(
  userId: string, 
  subjectIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  try {
    // Start a transaction by clearing existing subjects first
    const { error: deleteError } = await supabase
      .from('user_subjects')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error clearing user subjects:', deleteError)
      return { success: false, error: 'Failed to clear existing subjects' }
    }

    // If no subjects to add, we're done
    if (subjectIds.length === 0) {
      return { success: true }
    }

    // Prepare the insert data
    const userSubjects = subjectIds.map(subjectId => ({
      user_id: userId,
      subject_id: subjectId
    }))

    // Insert new subjects
    const { error: insertError } = await supabase
      .from('user_subjects')
      .insert(userSubjects)

    if (insertError) {
      console.error('Error saving user subjects:', insertError)
      return { success: false, error: 'Failed to save subjects' }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error saving user subjects:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function getSubjectsByIds(ids: string[]): Promise<Subject[]> {
  if (ids.length === 0) return []
  
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .in('id', ids)
    .order('name')
    .order('level')

  if (error) {
    console.error('Error fetching subjects by ids:', error)
    return []
  }

  return data || []
}
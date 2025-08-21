'use client'

import { createClient } from '@/lib/supabase/client'
import type { UserSubjectWithSubject } from '@/lib/types/database'

export async function getUserSubjectsClient(userId: string): Promise<UserSubjectWithSubject[]> {
  const supabase = createClient()
  
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
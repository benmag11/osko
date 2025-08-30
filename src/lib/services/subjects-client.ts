'use client'

import { createClient } from '@/lib/supabase/client'
import type { UserSubjectWithSubject } from '@/lib/types/database'

export async function getUserSubjectsClient(userId: string): Promise<UserSubjectWithSubject[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .rpc('get_user_subjects_sorted', { p_user_id: userId })

  if (error) {
    console.error('Error fetching user subjects:', error)
    return []
  }

  // Transform the RPC response to match UserSubjectWithSubject interface
  return (data || []).map(item => ({
    id: item.id,
    user_id: item.user_id,
    subject_id: item.subject_id,
    created_at: item.created_at,
    subject: item.subject
  }))
}
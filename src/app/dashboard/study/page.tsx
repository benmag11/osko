import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StudyPageClient } from './study-page-client'
import { redirect } from 'next/navigation'

export default async function StudyPage() {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  const [profileData, subjectsData] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('name')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('user_subjects')
      .select('id, subject_name, level')
      .eq('user_id', user.id)
      .order('subject_name')
  ])

  const userName = profileData.data?.name || 'Student'
  const subjects = (subjectsData.data || []).map(subject => ({
    id: subject.id,
    name: subject.subject_name,
    level: subject.level
  }))

  return <StudyPageClient userName={userName} subjects={subjects} />
}
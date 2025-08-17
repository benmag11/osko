import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StudyPageClient } from './study-page-client'
import { redirect } from 'next/navigation'
import { formatName } from '@/lib/utils/format-name'
import { getSubjectsByUserSelection } from '@/lib/supabase/queries'
import { generateSlug } from '@/lib/utils/slug'

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

  const userName = formatName(profileData.data?.name || 'Student')
  
  // Fetch actual subjects from subjects table and generate slugs
  const subjectsWithSlugs = await Promise.all(
    (subjectsData.data || []).map(async (userSubject) => {
      const subject = await getSubjectsByUserSelection(
        userSubject.subject_name,
        userSubject.level
      )
      
      if (subject) {
        return {
          id: subject.id,
          name: subject.name,
          level: subject.level,
          slug: generateSlug(subject)
        }
      }
      
      // Fallback if subject not found in subjects table
      return {
        id: userSubject.id,
        name: userSubject.subject_name,
        level: userSubject.level,
        slug: null
      }
    })
  )

  return <StudyPageClient userName={userName} subjects={subjectsWithSlugs} />
}
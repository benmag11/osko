import { createClient } from '@/lib/supabase/server'
import { getUserSubjects } from '@/lib/services/subjects'
import { StudyPageClient } from './study-page-client'
import { redirect } from 'next/navigation'
import { formatName } from '@/lib/utils/format-name'
import { generateSlug } from '@/lib/utils/slug'

export default async function StudyPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  // Fetch user profile for name
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('name')
    .eq('user_id', user.id)
    .single()

  const userName = formatName(profile?.name || 'Student')
  
  // Fetch user subjects with full subject details using JOIN
  const userSubjects = await getUserSubjects(user.id)
  
  // Transform to include slugs
  const subjectsWithSlugs = userSubjects.map(userSubject => ({
    id: userSubject.subject.id,
    name: userSubject.subject.name,
    level: userSubject.subject.level,
    slug: generateSlug(userSubject.subject)
  }))

  return <StudyPageClient userName={userName} subjects={subjectsWithSlugs} />
}
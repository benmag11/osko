import { createClient } from '@/lib/supabase/server'
import { getUserSubjects } from '@/lib/supabase/queries'
import { StudyPageClient } from './study-page-client'
import { redirect } from 'next/navigation'
import { formatName } from '@/lib/utils/format-name'
import { generateSlug } from '@/lib/utils/slug'

// Dashboard requires runtime cookie access for Supabase auth
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function StudyPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  try {
    // Fetch user profile and subjects in parallel for better performance
    const [profileResult, userSubjects] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('name')
        .eq('user_id', user.id)
        .single(),
      getUserSubjects(user.id)
    ])

    const userName = formatName(profileResult.data?.name || 'Student')
    
    // Transform to include slugs
    const subjectsWithSlugs = userSubjects.map(userSubject => ({
      id: userSubject.subject.id,
      name: userSubject.subject.name,
      level: userSubject.subject.level,
      slug: generateSlug(userSubject.subject)
    }))

    return <StudyPageClient userName={userName} subjects={subjectsWithSlugs} />
  } catch (error) {
    console.error('Error loading dashboard:', error)
    // Fallback to empty state if there's an error
    return <StudyPageClient userName="Student" subjects={[]} />
  }
}

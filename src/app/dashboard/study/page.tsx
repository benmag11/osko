import { StudyPageClient } from './study-page-client'
import { redirect } from 'next/navigation'
import { formatName } from '@/lib/utils/format-name'
import { generateSlug } from '@/lib/utils/slug'
import { getDashboardBootstrap } from '@/lib/supabase/dashboard-bootstrap'

export default async function StudyPage() {
  const bootstrap = await getDashboardBootstrap()

  if (!bootstrap.session?.user) {
    redirect('/auth/signin')
  }

  const userName = formatName(bootstrap.profile?.name || 'Student')
  const subjectsWithSlugs = bootstrap.userSubjects.map((userSubject) => ({
    id: userSubject.subject.id,
    name: userSubject.subject.name,
    level: userSubject.subject.level,
    slug: generateSlug(userSubject.subject),
    isFavourite: userSubject.is_favourite ?? false,
  }))

  return <StudyPageClient userName={userName} subjects={subjectsWithSlugs} />
}

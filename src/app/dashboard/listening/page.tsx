import { ListeningPageClient } from './listening-page-client'
import { redirect } from 'next/navigation'
import { formatName } from '@/lib/utils/format-name'
import { generateSlug } from '@/lib/utils/slug'
import { getDashboardBootstrap } from '@/lib/supabase/dashboard-bootstrap'
import { getSubjectsWithAudioQuestions } from '@/lib/supabase/audio-queries'

export default async function ListeningPage() {
  const bootstrap = await getDashboardBootstrap()

  if (!bootstrap.session?.user) {
    redirect('/auth/signin')
  }

  // Get subjects that have audio questions
  const audioSubjects = await getSubjectsWithAudioQuestions()

  // Filter to only show subjects the user has selected AND that have audio content
  const userSubjectIds = new Set(bootstrap.userSubjects.map(us => us.subject.id))
  const filteredSubjects = audioSubjects.filter(subject => userSubjectIds.has(subject.id))

  const userName = formatName(bootstrap.profile?.name || 'Student')
  const subjectsWithSlugs = filteredSubjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
    level: subject.level,
    slug: generateSlug(subject),
  }))

  return <ListeningPageClient userName={userName} subjects={subjectsWithSlugs} />
}

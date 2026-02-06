import { TimetablePageClient } from './timetable-page-client'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { getDashboardBootstrap } from '@/lib/supabase/dashboard-bootstrap'
import { formatName } from '@/lib/utils/format-name'

export default async function TimetablePage() {
  const bootstrap = await getDashboardBootstrap()

  if (!bootstrap.session?.user) {
    return (
      <DashboardPage maxWidth="max-w-6xl">
        <p className="text-center text-warm-text-muted">
          Please sign in to view your exam timetable
        </p>
      </DashboardPage>
    )
  }

  const userId = bootstrap.session.user.id
  const userName = formatName(bootstrap.profile?.name || 'Student').split(/\s+/)[0]

  return (
    <DashboardPage maxWidth="max-w-6xl">
      <TimetablePageClient
        userId={userId}
        userName={userName}
        initialSubjects={bootstrap.userSubjects}
      />
    </DashboardPage>
  )
}

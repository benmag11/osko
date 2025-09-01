import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAllSubjects, getUserSubjects } from '@/lib/supabase/queries'
import { SettingsClient } from './settings-client'
import { DashboardPage } from '@/components/layout/dashboard-page'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <DashboardPage>
        <p className="text-center text-warm-text-muted">
          Please sign in to view your settings
        </p>
      </DashboardPage>
    )
  }
  
  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('name')
    .eq('user_id', user.id)
    .single()
  
  // Fetch all available subjects and user's current subjects
  const [allSubjects, userSubjectsData] = await Promise.all([
    getAllSubjects(),
    getUserSubjects(user.id)
  ])
  
  // Extract just the subject data from user subjects
  const userSubjects = userSubjectsData.map(us => us.subject)
  
  return (
    <DashboardPage>
      <SettingsClient 
        userEmail={user.email || ''}
        userName={profile?.name || ''}
        allSubjects={allSubjects}
        userSubjects={userSubjects}
      />
    </DashboardPage>
  )
}
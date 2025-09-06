import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getReports, getReportStatistics } from '@/lib/supabase/report-actions'
import { ReportsClient } from './reports-client'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { redirect } from 'next/navigation'

export default async function ReportsPage() {
  const supabase = await createServerSupabaseClient()
  
  // Get current user and verify admin
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/signin')
  }
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()
  
  if (!profile?.is_admin) {
    redirect('/dashboard/study')
  }
  
  // Fetch initial data
  const [reports, statistics] = await Promise.all([
    getReports(),
    getReportStatistics()
  ])
  
  return (
    <DashboardPage>
      <ReportsClient 
        initialReports={reports}
        initialStatistics={statistics}
      />
    </DashboardPage>
  )
}
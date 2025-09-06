import { getReports, getReportStatistics } from '@/lib/supabase/report-actions'
import { ReportsClient } from './reports-client'
import { DashboardPage } from '@/components/layout/dashboard-page'

export default async function ReportsPage() {
  // Admin verification is now handled by the admin layout wrapper
  // No need for duplicate checks here
  
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
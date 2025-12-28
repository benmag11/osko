import {
  DashboardSidebarProvider,
  DashboardSidebar,
  SidebarAwareMain,
  MobileNavbar,
} from '@/components/dashboard-sidebar'
import { getDashboardBootstrap } from '@/lib/supabase/dashboard-bootstrap'
import { DashboardDataProvider } from '@/components/providers/dashboard-data-provider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const bootstrap = await getDashboardBootstrap()

  return (
    <DashboardSidebarProvider>
      {/* DashboardDataProvider resolves bootstrap once and primes client-side caches */}
      <DashboardDataProvider bootstrap={bootstrap}>
        <MobileNavbar />
        <DashboardSidebar />
        <SidebarAwareMain>
          {children}
        </SidebarAwareMain>
      </DashboardDataProvider>
    </DashboardSidebarProvider>
  )
}

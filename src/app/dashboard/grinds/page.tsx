import { redirect } from 'next/navigation'
import { getDashboardBootstrap } from '@/lib/supabase/dashboard-bootstrap'
import { GrindsPageClient } from './grinds-page-client'

export default async function GrindsPage() {
  const bootstrap = await getDashboardBootstrap()

  if (!bootstrap.session?.user) {
    redirect('/auth/signin')
  }

  return <GrindsPageClient />
}

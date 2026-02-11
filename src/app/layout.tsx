import type { Metadata } from 'next'
import { Source_Serif_4, Source_Sans_3, Crimson_Pro } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/providers'
import { Toaster } from '@/components/ui/sonner'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GoogleAnalytics } from '@/components/analytics/google-analytics'
import { QueryClient, dehydrate } from '@tanstack/react-query'
import { QUERY_CONFIG } from '@/lib/config/cache'
import { queryKeys } from '@/lib/queries/query-keys'
import { getUserSubjects } from '@/lib/supabase/queries'
import { generateSlug } from '@/lib/utils/slug'

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
})

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Uncooked',
  description: 'Browse and study past exam papers',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get initial session server-side for proper hydration
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  const queryClient = new QueryClient({
    defaultOptions: QUERY_CONFIG.defaultOptions,
  })

  if (session?.user?.id) {
    const userId = session.user.id

    const [profileResult, subjectsResult] = await Promise.allSettled([
      supabase
        .from('user_profiles')
        .select('id, user_id, name, is_admin, onboarding_completed, created_at, updated_at, stripe_customer_id, subscription_status, subscription_id, subscription_current_period_end, subscription_cancel_at_period_end, free_grind_credits')
        .eq('user_id', userId)
        .single(),
      getUserSubjects(userId),
    ])

    const profileData = profileResult.status === 'fulfilled' ? profileResult.value.data : null
    const profileError = profileResult.status === 'fulfilled' ? profileResult.value.error : profileResult.reason
    const userSubjects = subjectsResult.status === 'fulfilled' ? subjectsResult.value : []

    if (!profileError || profileError.code === 'PGRST116') {
      queryClient.setQueryData(queryKeys.user.profile(userId), {
        user: session.user,
        profile: profileData ?? null,
      })
    } else {
      console.error('Failed to prefetch user profile', profileError)
    }

    const subjectsWithSlug = userSubjects.map((userSubject) => ({
      ...userSubject.subject,
      slug: generateSlug(userSubject.subject),
    }))

    queryClient.setQueryData(queryKeys.user.subjects(userId), subjectsWithSlug)
  }

  const dehydratedState = dehydrate(queryClient)
  
  return (
    <html lang="en" className={`${sourceSerif.variable} ${sourceSans.variable} ${crimsonPro.variable}`}>
      <body className="font-sans">
        <Providers initialSession={session} initialQueryState={dehydratedState}>
          {children}
        </Providers>
        <Toaster />
        <GoogleAnalytics />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}

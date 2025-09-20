import type { Metadata } from 'next'
import { Source_Serif_4, Source_Sans_3 } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/providers'
import { Toaster } from 'sonner'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
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

export const metadata: Metadata = {
  title: 'Exam Paper Viewer - addy',
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

    const [{ data: profileData, error: profileError }, userSubjects] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('id, user_id, name, is_admin, onboarding_completed, created_at, updated_at')
        .eq('user_id', userId)
        .single(),
      getUserSubjects(userId),
    ])

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
    <html lang="en" className={`${sourceSerif.variable} ${sourceSans.variable}`}>
      <body className="font-sans">
        <Providers initialSession={session} initialQueryState={dehydratedState}>
          {children}
        </Providers>
        <Toaster position="top-center" richColors />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers/providers'
import { Toaster } from 'sonner'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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
  
  return (
    <html lang="en">
      <body>
        <Providers initialSession={session}>
          {children}
        </Providers>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}

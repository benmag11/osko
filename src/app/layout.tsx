import type { Metadata } from 'next'
import { Source_Serif_4, Source_Sans_3 } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/providers'
import { Toaster } from 'sonner'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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
  
  return (
    <html lang="en" className={`${sourceSerif.variable} ${sourceSans.variable}`}>
      <body className="font-sans">
        <Providers initialSession={session}>
          {children}
        </Providers>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}

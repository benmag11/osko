import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers/providers'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Exam Paper Viewer - addy',
  description: 'Browse and study past exam papers',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}

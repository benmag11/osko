import { getAllSubjects } from '@/lib/supabase/queries'
import { OnboardingClient } from './onboarding-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Complete Your Profile - Onboarding',
  description: 'Set up your profile and select your subjects to get started',
}

// This page reads auth cookies via the Supabase server client, so force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OnboardingPage() {
  // Fetch all subjects from the database
  let subjects: Awaited<ReturnType<typeof getAllSubjects>>
  try {
    subjects = await getAllSubjects()
  } catch {
    subjects = []
  }

  // Handle case where no subjects are available
  if (!subjects || subjects.length === 0) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-semibold text-warm-text-primary mb-2">Setup Required</h1>
          <p className="text-warm-text-muted font-sans mb-4">
            We&apos;re setting up your learning environment. Please refresh the page to continue.
          </p>
          <a 
            href="/onboarding"
            className="inline-block px-4 py-2 bg-salmon-500 text-cream-50 rounded-lg hover:bg-salmon-600 transition-colors font-sans"
          >
            Refresh Page
          </a>
        </div>
      </div>
    )
  }

  return <OnboardingClient subjects={subjects} />
}

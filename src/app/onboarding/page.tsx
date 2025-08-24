import { getAllSubjects } from '@/lib/services/subjects'
import { OnboardingClient } from './onboarding-client'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Complete Your Profile - Onboarding',
  description: 'Set up your profile and select your subjects to get started',
}

export default async function OnboardingPage() {
  // Fetch all subjects from the database
  const subjects = await getAllSubjects()

  // Handle case where no subjects are available
  if (!subjects || subjects.length === 0) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Setup Required</h1>
          <p className="text-[#757575] mb-4">
            We&apos;re setting up your learning environment. Please refresh the page to continue.
          </p>
          <a 
            href="/onboarding"
            className="inline-block px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Refresh Page
          </a>
        </div>
      </div>
    )
  }

  return <OnboardingClient subjects={subjects} />
}
import { getAllSubjects } from '@/lib/services/subjects'
import { OnboardingClient } from './onboarding-client'

export default async function OnboardingPage() {
  // Fetch all subjects from the database
  const subjects = await getAllSubjects()

  return <OnboardingClient subjects={subjects} />
}
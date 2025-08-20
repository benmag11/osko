'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { NameStep } from '@/components/onboarding/name-step'
import { SubjectSelectionStep } from '@/components/onboarding/subject-selection-step'
import { ProgressIndicator } from '@/components/onboarding/progress-indicator'
import { saveOnboardingData } from './actions'
import type { Subject } from '@/lib/types/database'

export interface OnboardingFormData {
  name: string
  subjectIds: string[]
}

interface OnboardingClientProps {
  subjects: Subject[]
}

export function OnboardingClient({ subjects }: OnboardingClientProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<OnboardingFormData>({
    name: '',
    subjectIds: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNameSubmit = (name: string) => {
    setFormData(prev => ({ ...prev, name }))
    setCurrentStep(2)
  }

  const handleSubjectsSubmit = async (subjectIds: string[]) => {
    setIsSubmitting(true)
    try {
      const updatedData = { ...formData, subjectIds }
      const result = await saveOnboardingData(updatedData)
      
      if (result.error) {
        console.error('Error saving onboarding data:', result.error)
        setIsSubmitting(false)
        return
      }

      // Redirect to dashboard page after successful onboarding
      router.push('/dashboard/study')
    } catch (error) {
      console.error('Error during onboarding:', error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* Fixed header with progress indicator */}
      <div className="w-full px-4 pt-8 pb-4">
        <div className="max-w-4xl mx-auto">
          <ProgressIndicator currentStep={currentStep} totalSteps={2} />
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center px-4 pb-8">
        <div className="w-full max-w-4xl flex-1 flex flex-col">
          {currentStep === 1 && (
            <div className="animate-in fade-in duration-300 flex-1 flex flex-col">
              <NameStep 
                onNext={handleNameSubmit}
                initialName={formData.name}
              />
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="animate-in fade-in duration-300">
              <SubjectSelectionStep
                subjects={subjects}
                onNext={handleSubjectsSubmit}
                onBack={() => setCurrentStep(1)}
                initialSubjectIds={formData.subjectIds}
                isSubmitting={isSubmitting}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { NameStep } from '@/components/onboarding/name-step'
import { SubjectSelectionStep } from '@/components/onboarding/subject-selection-step'
import { ProgressIndicator } from '@/components/onboarding/progress-indicator'
import { saveOnboardingData, type OnboardingFormData } from './actions'
import type { Subject } from '@/lib/types/database'

interface OnboardingClientProps {
  subjects: Subject[]
}

type ErrorCode = 'AUTH_ERROR' | 'PROFILE_ERROR' | 'SUBJECTS_ERROR' | 'UNKNOWN_ERROR'

export function OnboardingClient({ subjects }: OnboardingClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<OnboardingFormData>({
    name: '',
    subjectIds: []
  })
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null)

  const handleNameSubmit = (name: string) => {
    // Clear any previous errors when moving forward
    setError(null)
    setErrorCode(null)
    setFormData(prev => ({ ...prev, name }))
    setCurrentStep(2)
  }

  const handleSubjectsSubmit = (subjectIds: string[]) => {
    // Clear previous errors
    setError(null)
    setErrorCode(null)
    
    // Update form data
    const updatedFormData = { ...formData, subjectIds }
    setFormData(updatedFormData)
    
    // Use startTransition for better UX with server actions
    startTransition(async () => {
      const result = await saveOnboardingData(updatedFormData)
      
      if (result.success) {
        // Navigate to the dashboard
        router.push(result.redirectUrl)
      } else {
        // Handle error
        setError(result.error)
        setErrorCode(result.code || null)
        
        // If auth error, redirect to login after a delay
        if (result.code === 'AUTH_ERROR') {
          setTimeout(() => {
            router.push('/auth/signin')
          }, 3000)
        }
      }
    })
  }

  const handleBack = () => {
    // Clear errors when going back
    setError(null)
    setErrorCode(null)
    setCurrentStep(1)
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
              {error && (
                <div className={`mb-4 p-4 rounded-lg border ${
                  errorCode === 'AUTH_ERROR' 
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-medium">{error}</p>
                      {errorCode === 'AUTH_ERROR' && (
                        <p className="text-sm mt-1 opacity-90">Redirecting to sign in...</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <SubjectSelectionStep
                subjects={subjects}
                onNext={handleSubjectsSubmit}
                onBack={handleBack}
                initialSubjectIds={formData.subjectIds}
                isSubmitting={isPending}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SubjectSelector } from '@/components/subjects/subject-selector'
import type { Subject } from '@/lib/types/database'

interface SubjectSelectionStepProps {
  subjects: Subject[]
  onNext: (subjectIds: string[]) => void
  onBack: () => void
  initialSubjectIds?: string[]
  isSubmitting?: boolean
}

export function SubjectSelectionStep({ 
  subjects,
  onNext, 
  onBack, 
  initialSubjectIds = [],
  isSubmitting = false
}: SubjectSelectionStepProps) {
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(initialSubjectIds)

  const handleSubmit = () => {
    onNext(selectedSubjectIds)
  }

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold mb-2">Select your subjects</h1>
        <p className="text-[#757575]">Choose the subjects you&apos;re studying and their levels</p>
      </div>

      <SubjectSelector
        subjects={subjects}
        initialSelectedIds={selectedSubjectIds}
        onSelectionChange={setSelectedSubjectIds}
        isDisabled={isSubmitting}
        showSelectedPanel={true}
        actions={
          <>
            <Button
              onClick={handleSubmit}
              disabled={selectedSubjectIds.length === 0 || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Saving...' : 'Continue'}
            </Button>
            <Button
              variant="outline"
              onClick={onBack}
              disabled={isSubmitting}
              className="w-full"
            >
              Back
            </Button>
          </>
        }
      />
    </div>
  )
}
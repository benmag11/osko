'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { SubjectCard } from './subject-card'
import { SelectedSubjectCard } from './selected-subject-card'
import type { OnboardingData } from '@/app/onboarding/page'

const SUBJECTS = [
  'Accounting', 'Agricultural Science', 'Applied Maths', 'Art', 
  'Biology', 'Business', 'Chemistry', 'Classical Studies',
  'Computer Science', 'Construction Studies', 'Design & Communication Graphics',
  'Economics', 'Engineering', 'English', 'French', 'Geography',
  'German', 'History', 'Home Economics', 'Irish', 'Italian',
  'Japanese', 'LCVP', 'Mathematics', 'Music', 'Phys-Chem',
  'Physical Education', 'Physics', 'Politics and Society',
  'Religious Education', 'Spanish', 'Technology'
].sort()

interface SubjectSelectionStepProps {
  onNext: (subjects: OnboardingData['subjects']) => void
  onBack: () => void
  initialSubjects?: OnboardingData['subjects']
  isSubmitting?: boolean
}

export function SubjectSelectionStep({ 
  onNext, 
  onBack, 
  initialSubjects = [],
  isSubmitting = false
}: SubjectSelectionStepProps) {
  const [selectedSubjects, setSelectedSubjects] = useState<Map<string, 'Higher' | 'Ordinary'>>(
    new Map(initialSubjects.map(s => [s.name, s.level]))
  )
  const [searchTerm, setSearchTerm] = useState('')

  // Filter subjects based on search term
  const filteredSubjects = useMemo(() => {
    if (!searchTerm) return SUBJECTS
    return SUBJECTS.filter(subject => 
      subject.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm])

  const handleSubjectLevelSelect = (subject: string, level: 'Higher' | 'Ordinary') => {
    const newSelected = new Map(selectedSubjects)
    
    // If clicking the same level that's already selected, deselect
    if (newSelected.get(subject) === level) {
      newSelected.delete(subject)
    } else {
      // Otherwise, set or update the level
      newSelected.set(subject, level)
    }
    
    setSelectedSubjects(newSelected)
  }

  const removeSubject = (subject: string) => {
    const newSelected = new Map(selectedSubjects)
    newSelected.delete(subject)
    setSelectedSubjects(newSelected)
  }

  const handleSubmit = () => {
    const subjects = Array.from(selectedSubjects.entries()).map(([name, level]) => ({
      name,
      level
    }))
    onNext(subjects)
  }

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold mb-2">Select your subjects</h1>
        <p className="text-[#757575]">Choose the subjects you&apos;re studying and their levels</p>
      </div>

      {/* Use flex column on mobile, grid on desktop */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
        {/* Selected Subjects - First on mobile, second on desktop */}
        <div className="order-1 lg:order-2 lg:col-span-1">
          <Card className="lg:sticky lg:top-4 border-[#e5e5e5]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Selected Subjects ({selectedSubjects.size})
              </CardTitle>
              <CardDescription className="text-sm">
                Your chosen subjects and levels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* ScrollArea only on desktop, natural flow on mobile */}
              <div className="lg:h-[350px] lg:overflow-y-auto lg:pr-4">
                {selectedSubjects.size === 0 ? (
                  <p className="text-sm text-[#9e9e9e] text-center py-8">
                    No subjects selected yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {Array.from(selectedSubjects.entries()).map(([subject, level]) => (
                      <SelectedSubjectCard
                        key={subject}
                        subject={subject}
                        level={level}
                        onRemove={() => removeSubject(subject)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-3 border-t">
                <Button
                  onClick={handleSubmit}
                  disabled={selectedSubjects.size === 0 || isSubmitting}
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subject Selection Grid - Second on mobile, first on desktop */}
        <div className="order-2 lg:order-1 lg:col-span-2 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9e9e9e]" />
            <Input
              type="text"
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Subject Cards Grid - ScrollArea only on desktop */}
          <div className="lg:h-[560px] lg:overflow-y-auto lg:pr-4">
            <div className="grid grid-cols-2 gap-3">
              {filteredSubjects.map((subject) => (
                <SubjectCard
                  key={subject}
                  subject={subject}
                  selectedLevel={selectedSubjects.get(subject) || null}
                  onSelectLevel={(level) => handleSubjectLevelSelect(subject, level)}
                />
              ))}
            </div>
            {filteredSubjects.length === 0 && (
              <p className="text-center text-[#9e9e9e] mt-8">
                No subjects found matching &quot;{searchTerm}&quot;
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
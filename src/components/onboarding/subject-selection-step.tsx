'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { SubjectCard } from './subject-card'
import { SelectedSubjectCard } from './selected-subject-card'
import type { Subject } from '@/lib/types/database'

interface SubjectSelectionStepProps {
  subjects: Subject[]
  onNext: (subjectIds: string[]) => void
  onBack: () => void
  initialSubjectIds?: string[]
  isSubmitting?: boolean
}

interface GroupedSubject {
  name: string
  higher?: Subject
  ordinary?: Subject
}

export function SubjectSelectionStep({ 
  subjects,
  onNext, 
  onBack, 
  initialSubjectIds = [],
  isSubmitting = false
}: SubjectSelectionStepProps) {
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(
    new Set(initialSubjectIds)
  )
  const [searchTerm, setSearchTerm] = useState('')

  // Group subjects by name for display
  const groupedSubjects = useMemo(() => {
    const grouped = new Map<string, GroupedSubject>()
    
    subjects.forEach(subject => {
      const existing = grouped.get(subject.name) || { name: subject.name }
      
      if (subject.level === 'Higher') {
        existing.higher = subject
      } else if (subject.level === 'Ordinary') {
        existing.ordinary = subject
      }
      
      grouped.set(subject.name, existing)
    })
    
    return Array.from(grouped.values()) // Already sorted from database
  }, [subjects])

  // Filter subjects based on search term
  const filteredSubjects = useMemo(() => {
    if (!searchTerm) return groupedSubjects
    return groupedSubjects.filter(subject => 
      subject.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm, groupedSubjects])

  // Get selected subjects with their details
  const selectedSubjectsWithDetails = useMemo(() => {
    return subjects.filter(s => selectedSubjectIds.has(s.id))
    // Subjects are already sorted from database
  }, [subjects, selectedSubjectIds])

  const handleSubjectToggle = (subject: Subject) => {
    const newSelected = new Set(selectedSubjectIds)
    
    if (newSelected.has(subject.id)) {
      newSelected.delete(subject.id)
    } else {
      // Remove any other level of the same subject
      const otherLevelSubject = subjects.find(
        s => s.name === subject.name && s.id !== subject.id
      )
      if (otherLevelSubject) {
        newSelected.delete(otherLevelSubject.id)
      }
      newSelected.add(subject.id)
    }
    
    setSelectedSubjectIds(newSelected)
  }

  const removeSubject = (subjectId: string) => {
    const newSelected = new Set(selectedSubjectIds)
    newSelected.delete(subjectId)
    setSelectedSubjectIds(newSelected)
  }

  const handleSubmit = () => {
    onNext(Array.from(selectedSubjectIds))
  }

  // Get the selected level for a subject group
  const getSelectedLevel = (group: GroupedSubject): 'Higher' | 'Ordinary' | null => {
    if (group.higher && selectedSubjectIds.has(group.higher.id)) return 'Higher'
    if (group.ordinary && selectedSubjectIds.has(group.ordinary.id)) return 'Ordinary'
    return null
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
                Selected Subjects ({selectedSubjectsWithDetails.length})
              </CardTitle>
              <CardDescription className="text-sm">
                Your chosen subjects and levels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* ScrollArea only on desktop, natural flow on mobile */}
              <div className="lg:h-[350px] lg:overflow-y-auto lg:pr-4">
                {selectedSubjectsWithDetails.length === 0 ? (
                  <p className="text-sm text-[#9e9e9e] text-center py-8">
                    No subjects selected yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedSubjectsWithDetails.map((subject) => (
                      <SelectedSubjectCard
                        key={subject.id}
                        subject={subject.name}
                        level={subject.level === 'Higher' || subject.level === 'Ordinary' 
                          ? subject.level 
                          : 'Ordinary'} // Safe fallback
                        onRemove={() => removeSubject(subject.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-3 border-t">
                <Button
                  onClick={handleSubmit}
                  disabled={selectedSubjectsWithDetails.length === 0 || isSubmitting}
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
              {filteredSubjects.map((group) => (
                <SubjectCard
                  key={group.name}
                  subjectName={group.name}
                  higherSubject={group.higher}
                  ordinarySubject={group.ordinary}
                  selectedLevel={getSelectedLevel(group)}
                  onSelectSubject={handleSubjectToggle}
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
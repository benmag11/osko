'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SubjectCard } from './subject-card'
import { SelectedSubjectCard } from './selected-subject-card'
import type { Subject } from '@/lib/types/database'

interface SubjectSelectorProps {
  subjects: Subject[]
  initialSelectedIds?: string[]
  onSelectionChange?: (subjectIds: string[]) => void
  isDisabled?: boolean
  showSelectedPanel?: boolean
  className?: string
  actions?: React.ReactNode
}

interface GroupedSubject {
  name: string
  higher?: Subject
  ordinary?: Subject
}

export function SubjectSelector({ 
  subjects,
  initialSelectedIds = [],
  onSelectionChange,
  isDisabled = false,
  showSelectedPanel = true,
  className,
  actions
}: SubjectSelectorProps) {
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(
    new Set(initialSelectedIds)
  )
  const [searchTerm, setSearchTerm] = useState('')
  
  // Input ref for focus management
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Optimized clear handler to prevent unnecessary re-renders
  const clearSearch = useCallback(() => {
    setSearchTerm('')
    inputRef.current?.focus()
  }, [])

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

  const handleSubjectToggle = useCallback((subject: Subject) => {
    if (isDisabled) return
    
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
    onSelectionChange?.(Array.from(newSelected))
  }, [selectedSubjectIds, subjects, isDisabled, onSelectionChange])

  const removeSubject = useCallback((subjectId: string) => {
    if (isDisabled) return
    
    const newSelected = new Set(selectedSubjectIds)
    newSelected.delete(subjectId)
    setSelectedSubjectIds(newSelected)
    onSelectionChange?.(Array.from(newSelected))
  }, [selectedSubjectIds, isDisabled, onSelectionChange])

  // Get the selected level for a subject group
  const getSelectedLevel = useCallback((group: GroupedSubject): 'Higher' | 'Ordinary' | null => {
    if (group.higher && selectedSubjectIds.has(group.higher.id)) return 'Higher'
    if (group.ordinary && selectedSubjectIds.has(group.ordinary.id)) return 'Ordinary'
    return null
  }, [selectedSubjectIds])

  return (
    <div className={cn("w-full", className)}>
      {/* Use flex column on mobile, grid on desktop */}
      <div className={cn(
        "flex flex-col gap-6",
        showSelectedPanel && "lg:grid lg:grid-cols-3"
      )}>
        {/* Selected Subjects Panel - First on mobile, second on desktop */}
        {showSelectedPanel && (
          <div className="order-1 lg:order-2 lg:col-span-1">
            <Card className={cn(
              "lg:sticky lg:top-4 border-stone-400",
              actions && "lg:h-[616px]" // Match onboarding card height when actions present
            )}>
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
                <div className="lg:h-[378px] lg:overflow-y-auto lg:pr-4">
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
                
                {actions && (
                  <div className="space-y-2 pt-3 border-t">
                    {actions}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Subject Selection Grid - Second on mobile, first on desktop */}
        <div className={cn(
          "space-y-4",
          showSelectedPanel ? "order-2 lg:order-1 lg:col-span-2" : "w-full"
        )}>
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-400 z-10" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isDisabled}
              className={cn(
                "pl-10",
                searchTerm && "pr-10"
              )}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                disabled={isDisabled}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-400 hover:text-stone-600 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Subject Cards Grid - 2 columns as requested */}
          <div className="lg:h-[560px] lg:overflow-y-auto lg:pr-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
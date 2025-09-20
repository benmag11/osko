'use client'

import { useState, useCallback, useMemo, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { SubjectSelector } from '@/components/subjects/subject-selector'
import { updateUserSubjects } from '../actions'
import { ChevronDown, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Subject } from '@/lib/types/database'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queries/query-keys'
import { useUserProfile } from '@/lib/hooks/use-user-profile'
import { generateSlug } from '@/lib/utils/slug'

interface SubjectSectionProps {
  allSubjects: Subject[]
  userSubjects: Subject[]
}

export function SubjectSection({ allSubjects, userSubjects }: SubjectSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(
    userSubjects.map(s => s.id)
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const queryClient = useQueryClient()
  const { user, refetchProfile } = useUserProfile()
  
  // Store original subjects for cancel functionality
  const originalSubjectIds = useMemo(() => userSubjects.map(s => s.id), [userSubjects])
  
  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    const originalSet = new Set(originalSubjectIds)
    const currentSet = new Set(selectedSubjectIds)
    
    if (originalSet.size !== currentSet.size) return true
    
    for (const id of originalSet) {
      if (!currentSet.has(id)) return true
    }
    
    return false
  }, [originalSubjectIds, selectedSubjectIds])

  // Get display info for current subjects
  const currentSubjectsDisplay = useMemo(() => {
    return allSubjects
      .filter(s => selectedSubjectIds.includes(s.id))
      .map(s => ({
        name: s.name,
        level: s.level as 'Higher' | 'Ordinary'
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [allSubjects, selectedSubjectIds])

  const handleExpand = useCallback(() => {
    setIsExpanded(true)
    setError(null)
  }, [])

  const handleCancel = useCallback(() => {
    setSelectedSubjectIds(originalSubjectIds)
    setIsExpanded(false)
    setError(null)
  }, [originalSubjectIds])

  const handleSelectionChange = useCallback((subjectIds: string[]) => {
    setSelectedSubjectIds(subjectIds)
    setError(null)
  }, [])

  const handleSave = useCallback(() => {
    if (!hasChanges) {
      setIsExpanded(false)
      return
    }

    startTransition(async () => {
      const result = await updateUserSubjects(selectedSubjectIds)

      if (result.error) {
        setError(result.error)
        return
      }

      const updatedSubjects = allSubjects
        .filter(subject => selectedSubjectIds.includes(subject.id))

      if (user?.id) {
        queryClient.setQueryData(
          queryKeys.user.subjects(user.id),
          updatedSubjects.map(subject => ({
            ...subject,
            slug: generateSlug(subject),
          }))
        )
      }

      await refetchProfile()
      setIsExpanded(false)
      setError(null)
    })
  }, [
    allSubjects,
    hasChanges,
    queryClient,
    refetchProfile,
    selectedSubjectIds,
    user?.id,
  ])

  return (
    <div className="px-6 py-5">
      <div className="space-y-4">
        {/* Header with expand/collapse button */}
        <div className="flex items-center justify-between">
          <div>
            {!isExpanded && (
              <p className="text-sm text-warm-text-muted">
                {currentSubjectsDisplay.length === 0 
                  ? 'No subjects selected'
                  : `${currentSubjectsDisplay.length} subject${currentSubjectsDisplay.length === 1 ? '' : 's'} selected`
                }
              </p>
            )}
          </div>
          
          {!isExpanded && (
            <Button
              onClick={handleExpand}
              variant="outline"
              size="sm"
              className="h-8"
            >
              Edit
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Collapsed view - show current subjects */}
        {!isExpanded && currentSubjectsDisplay.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {currentSubjectsDisplay.map((subject) => (
              <div
                key={`${subject.name}-${subject.level}`}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm",
                  "bg-white border border-stone-300"
                )}
              >
                <span className="font-medium">{subject.name}</span>
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    subject.level === 'Higher' ? 'bg-salmon-500' : 'bg-sky-500'
                  )}
                />
                <span className="text-xs text-warm-text-muted">{subject.level}</span>
              </div>
            ))}
          </div>
        )}

        {/* Expanded view - show full selector */}
        {isExpanded && (
          <div className="space-y-4">
            {error && (
              <p role="alert" className="text-sm text-salmon-600 font-sans animate-in fade-in duration-200">
                {error}
              </p>
            )}
            
            <SubjectSelector
              subjects={allSubjects}
              initialSelectedIds={selectedSubjectIds}
              onSelectionChange={handleSelectionChange}
              isDisabled={isPending}
              showSelectedPanel={true}
              actions={
                <>
                  <Button
                    onClick={handleSave}
                    disabled={isPending || !hasChanges}
                    className="w-full"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Save
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    disabled={isPending}
                    variant="outline"
                    className="w-full"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </>
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}

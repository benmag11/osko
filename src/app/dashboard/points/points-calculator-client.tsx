'use client'

import { useState, useMemo } from 'react'
import { SubjectGradeRow } from '@/components/points-calculator/subject-grade-row'
import { PointsSummary } from '@/components/points-calculator/points-summary'
import { useUpdateGrade } from '@/lib/hooks/use-update-grade'
import { calculatePoints, getNextGrade, getEffectiveGrade, convertGradeLevel } from '@/lib/utils/points-calculator'
import type { UserSubjectWithSubject, Grade } from '@/lib/types/database'
import { toast } from 'sonner'
import Link from 'next/link'
import { Settings } from 'lucide-react'

interface PointsCalculatorClientProps {
  userId: string
  initialSubjects: UserSubjectWithSubject[]
}

export function PointsCalculatorClient({
  userId,
  initialSubjects,
}: PointsCalculatorClientProps) {
  // Local state for optimistic updates
  const [subjects, setSubjects] = useState<UserSubjectWithSubject[]>(initialSubjects)

  // Experimentation mode state
  const [isExperimenting, setIsExperimenting] = useState(false)
  const [experimentalLevels, setExperimentalLevels] = useState<Map<string, 'Higher' | 'Ordinary'>>(new Map())

  const updateGradeMutation = useUpdateGrade()

  // Calculate points whenever subjects change
  const pointsResult = useMemo(() => calculatePoints(subjects), [subjects])

  const handleGradeChange = (subjectId: string, direction: 'up' | 'down') => {
    const subject = subjects.find(s => s.subject_id === subjectId)
    if (!subject) return

    const currentGrade = getEffectiveGrade(subject.grade, subject.subject.level)
    const newGrade = getNextGrade(currentGrade, direction)

    // Optimistically update local state
    setSubjects(prev =>
      prev.map(s =>
        s.subject_id === subjectId ? { ...s, grade: newGrade } : s
      )
    )

    // Persist to database
    updateGradeMutation.mutate(
      { userId, subjectId, grade: newGrade },
      {
        onError: (error) => {
          // Rollback on error
          setSubjects(prev =>
            prev.map(s =>
              s.subject_id === subjectId ? { ...s, grade: subject.grade } : s
            )
          )
          toast.error('Failed to save grade')
        },
      }
    )
  }

  const handleLevelToggle = (subjectId: string, currentLevel: 'Higher' | 'Ordinary' | 'Foundation') => {
    if (currentLevel === 'Foundation') return // Can't toggle Foundation

    const newLevel = currentLevel === 'Higher' ? 'Ordinary' : 'Higher'

    setExperimentalLevels(prev => {
      const next = new Map(prev)
      next.set(subjectId, newLevel)
      return next
    })

    // Also convert the grade to match the new level
    const subject = subjects.find(s => s.subject_id === subjectId)
    if (subject) {
      const currentGrade = getEffectiveGrade(subject.grade, currentLevel) as Grade
      const newGrade = convertGradeLevel(currentGrade, newLevel)

      // Update local state only (not persisted to database)
      setSubjects(prev =>
        prev.map(s =>
          s.subject_id === subjectId
            ? { ...s, grade: newGrade, subject: { ...s.subject, level: newLevel } }
            : s
        )
      )
    }
  }

  if (subjects.length === 0) {
    return (
      <div className="space-y-4">
        <div className="mb-8 w-fit">
          <h1 className="text-6xl font-serif font-normal text-warm-text-secondary">
            Points Calculator
          </h1>
          <p className="mt-4 pl-4 text-lg font-serif italic text-stone-500 border-l-2 border-stone-300">
            — Calculate your CAO points
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-8 text-center">
          <p className="text-stone-600">
            You haven&apos;t added any subjects yet.
          </p>
          <p className="mt-2 text-sm text-stone-500">
            Go to Settings to add your subjects, then come back to calculate your points.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-8 w-fit">
        <h1 className="text-6xl font-serif font-normal text-warm-text-secondary">
          Points Calculator
        </h1>
          <p className="mt-4 pl-4 text-lg font-serif italic text-stone-500 border-l-2 border-stone-300">
          — Are you cooked?
        </p>
      </div>

      {/* Main content - side by side on desktop */}
      <div className="flex flex-col lg:flex-row lg:gap-6 gap-4">
        {/* Subject grades list - left side */}
        <div className="flex-1">
          <div className="rounded-sm border border-stone-400 bg-white overflow-hidden">
            {/* Experimentation banner */}
            {isExperimenting && (
              <div className="px-3 py-2 bg-stone-300 border-b border-dashed border-stone-500 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-stone-800 text-sm font-medium">Level experimentation</span>
                </div>
                <span className="text-xs text-stone-700 italic">
                  ...your original subjects will be restored on page refresh.
                </span>
              </div>
            )}
            <div className="divide-y divide-stone-400">
              {subjects.map(userSubject => {
                const breakdown = pointsResult.breakdown.find(
                  b => b.subjectId === userSubject.subject_id
                )
                const isInBest6 = pointsResult.best6Subjects.some(
                  b => b.subjectId === userSubject.subject_id
                )
                const effectiveLevel = isExperimenting
                  ? (experimentalLevels.get(userSubject.subject_id) ?? userSubject.subject.level)
                  : userSubject.subject.level

                return (
                  <SubjectGradeRow
                    key={userSubject.id}
                    subjectName={userSubject.subject.name}
                    level={effectiveLevel}
                    grade={getEffectiveGrade(userSubject.grade, effectiveLevel)}
                    basePoints={breakdown?.basePoints ?? 0}
                    mathsBonus={breakdown?.mathsBonus ?? 0}
                    isInBest6={isInBest6}
                    onGradeChange={(direction) => handleGradeChange(userSubject.subject_id, direction)}
                    isExperimenting={isExperimenting}
                    onLevelToggle={() => handleLevelToggle(userSubject.subject_id, effectiveLevel)}
                  />
                )
              })}
            </div>
          </div>
          {/* Experimentation toggle button */}
          <button
            onClick={() => {
              setIsExperimenting(!isExperimenting)
              if (isExperimenting) {
                // Clear experimental levels and reset to initial subjects on disable
                setExperimentalLevels(new Map())
                setSubjects(initialSubjects)
              }
            }}
            className="group mt-3 text-sm text-stone-700 hover:text-stone-900 cursor-pointer transition-colors flex items-center gap-1.5"
          >
            {isExperimenting ? (
              <>
                <span>×</span>
                <span className="group-hover:underline underline-offset-2">Exit experimentation</span>
              </>
            ) : (
              <>
                <span>↔</span>
                <span className="group-hover:underline underline-offset-2">Experiment with my level choices (Higher or Ordinary)</span>
              </>
            )}
          </button>
          <Link
            href="/dashboard/settings"
            className="group mt-2 text-sm text-salmon-500 hover:text-salmon-600 transition-colors flex items-center gap-1.5"
          >
            <Settings className="size-3.5" />
            <span className="group-hover:underline underline-offset-2">Change my subjects</span>
          </Link>
        </div>

        {/* Points summary - right side */}
        <div className="lg:w-56 lg:shrink-0">
          <PointsSummary
            best6Total={pointsResult.best6Total}
            showBest6={subjects.length > 6}
            grades={pointsResult.breakdown.map(b => b.grade)}
          />
        </div>
      </div>
    </div>
  )
}

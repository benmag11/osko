'use client'

import { useState, useMemo } from 'react'
import { useTopicAnalysis } from '@/lib/hooks/use-topic-analysis'
import { computePredictions, groupByLikelihood, CATEGORY_ORDER } from '@/lib/utils/topic-predictions'
import { SubjectSelector } from '@/app/dashboard/stats/components/subject-selector'
import { AnalysisHeader } from './analysis-header'
import { LikelihoodTierGroup } from './likelihood-tier-group'
import { AnalysisFooter } from './analysis-footer'
import { AnalysisEmptyState } from './analysis-empty-state'
import type { UserSubjectWithSubject } from '@/lib/types/database'

interface AnalysisPageClientProps {
  userSubjects: UserSubjectWithSubject[]
}

export function AnalysisPageClient({ userSubjects }: AnalysisPageClientProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    userSubjects[0]?.subject_id ?? ''
  )

  const { data: analysis, isLoading, isFetching } = useTopicAnalysis(selectedSubjectId)

  const predictions = useMemo(
    () => (analysis ? computePredictions(analysis) : []),
    [analysis]
  )

  const grouped = useMemo(
    () => groupByLikelihood(predictions),
    [predictions]
  )

  if (userSubjects.length === 0) {
    return <AnalysisEmptyState />
  }

  if (isLoading) {
    return <AnalysisLoadingSkeleton />
  }

  return (
    <div className={isFetching ? 'opacity-75 transition-opacity duration-200' : ''}>
      <AnalysisHeader />

      <div className="mb-6">
        <SubjectSelector
          subjects={userSubjects}
          selectedSubjectId={selectedSubjectId}
          onSelect={setSelectedSubjectId}
        />
      </div>

      {analysis && predictions.length > 0 && (
        <>
          <div className="rounded-lg border border-stone-200 bg-white p-5">
            {CATEGORY_ORDER.map((category, tierIndex) => (
              <LikelihoodTierGroup
                key={category}
                category={category}
                predictions={grouped[category]}
                allYears={analysis.all_years}
                tierIndex={tierIndex}
              />
            ))}
          </div>

          {analysis.min_year != null && analysis.max_year != null && (
            <AnalysisFooter
              totalYears={analysis.total_years}
              minYear={analysis.min_year}
              maxYear={analysis.max_year}
            />
          )}
        </>
      )}

      {analysis && predictions.length === 0 && (
        <div className="border-y border-stone-200 py-10 text-center">
          <p className="font-serif text-lg text-stone-600">
            No topic data available for this subject yet.
          </p>
        </div>
      )}
    </div>
  )
}

function AnalysisLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-12 w-fit">
        <div className="h-14 w-72 rounded bg-stone-200" />
      </div>
      <div className="mb-6">
        <div className="h-10 w-48 rounded-md bg-stone-200" />
      </div>
      <div className="rounded-lg border border-stone-200 bg-white p-5">
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2.5">
              <div className="w-1/4 h-4 rounded bg-stone-200" />
              <div className="flex-1 h-3 rounded bg-stone-100" />
              <div className="w-24 h-4 rounded bg-stone-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

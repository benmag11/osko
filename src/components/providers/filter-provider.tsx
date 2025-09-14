'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useOptimisticFilters } from '@/lib/hooks/use-optimistic-filters'
import type { Filters } from '@/lib/types/database'

interface FilterContextValue {
  filters: Filters
  urlFilters: Filters
  toggleTopic: (topicId: string) => void
  toggleYear: (year: number) => void
  toggleQuestionNumber: (questionNumber: number) => void
  addSearchTerm: (term: string) => void
  removeSearchTerm: (term: string) => void
  clearAllFilters: () => void
}

const FilterContext = createContext<FilterContextValue | null>(null)

export function useFilters() {
  const context = useContext(FilterContext)
  if (!context) {
    throw new Error('useFilters must be used within FilterProvider')
  }
  return context
}

interface FilterProviderProps {
  children: ReactNode
  initialFilters: Filters
}

export function FilterProvider({ children, initialFilters }: FilterProviderProps) {
  const filterState = useOptimisticFilters(initialFilters, {
    syncDelay: 300,
    replaceHistory: true,
  })

  return (
    <FilterContext.Provider value={filterState}>
      {children}
    </FilterContext.Provider>
  )
}
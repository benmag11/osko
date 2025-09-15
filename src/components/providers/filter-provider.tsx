'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useUrlFilters } from '@/lib/hooks/use-url-filters'
import type { Filters } from '@/lib/types/database'

interface FilterContextValue {
  filters: Filters
  toggleTopic: (topicId: string) => void
  toggleYear: (year: number) => void
  toggleQuestionNumber: (questionNumber: number) => void
  addSearchTerm: (term: string) => void
  removeSearchTerm: (term: string) => void
  clearAllFilters: () => void
  isPending: boolean
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
  const filterState = useUrlFilters(initialFilters)

  return (
    <FilterContext.Provider value={filterState}>
      {children}
    </FilterContext.Provider>
  )
}
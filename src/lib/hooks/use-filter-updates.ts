'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { updateSearchParams } from '@/lib/utils/url-filters'
import type { Filters } from '@/lib/types/database'

export function useFilterUpdates(filters: Filters) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const updateUrl = useCallback((updates: Partial<Filters>) => {
    const newParams = updateSearchParams(searchParams, updates)
    
    startTransition(() => {
      const query = newParams.toString()
      router.push(query ? `${pathname}?${query}` : pathname)
    })
  }, [pathname, router, searchParams])

  const addSearchTerm = useCallback((term: string) => {
    const current = filters.searchTerms || []
    if (!current.includes(term)) {
      updateUrl({ searchTerms: [...current, term] })
    }
  }, [filters.searchTerms, updateUrl])

  const removeSearchTerm = useCallback((term: string) => {
    const current = filters.searchTerms || []
    const updated = current.filter(t => t !== term)
    updateUrl({ searchTerms: updated.length > 0 ? updated : undefined })
  }, [filters.searchTerms, updateUrl])

  const toggleTopic = useCallback((topicId: string) => {
    const current = filters.topicIds || []
    const updated = current.includes(topicId)
      ? current.filter(id => id !== topicId)
      : [...current, topicId]
    updateUrl({ topicIds: updated })
  }, [filters.topicIds, updateUrl])

  const toggleYear = useCallback((year: number) => {
    const current = filters.years || []
    const updated = current.includes(year)
      ? current.filter(y => y !== year)
      : [...current, year]
    updateUrl({ years: updated })
  }, [filters.years, updateUrl])

  const toggleQuestionNumber = useCallback((questionNumber: number) => {
    const current = filters.questionNumbers || []
    const updated = current.includes(questionNumber)
      ? current.filter(q => q !== questionNumber)
      : [...current, questionNumber]
    updateUrl({ questionNumbers: updated })
  }, [filters.questionNumbers, updateUrl])

  const clearAllFilters = useCallback(() => {
    router.push(pathname)
  }, [pathname, router])

  return {
    updateUrl,
    addSearchTerm,
    removeSearchTerm,
    toggleTopic,
    toggleYear,
    toggleQuestionNumber,
    clearAllFilters,
    isPending,
  }
}
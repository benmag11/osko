'use client'

import { useCallback, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { updateSearchParams } from '@/lib/utils/url-filters'
import type { Filters } from '@/lib/types/database'

/**
 * Hook for managing filters directly in URL state
 * This eliminates the dual-state problem and prevents flickering
 */
export function useUrlFilters(initialFilters: Filters) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Helper to update URL immediately
  const updateUrl = useCallback((newFilters: Filters) => {
    const newParams = updateSearchParams(searchParams, newFilters)
    const query = newParams.toString()
    const url = query ? `${pathname}?${query}` : pathname

    // Use replace to avoid history spam
    // Wrap in startTransition for non-blocking updates
    startTransition(() => {
      router.replace(url, { scroll: false })
    })
  }, [searchParams, pathname, router])

  // Toggle functions that update URL immediately
  const toggleTopic = useCallback((topicId: string) => {
    const current = initialFilters.topicIds || []
    const updated = current.includes(topicId)
      ? current.filter(id => id !== topicId)
      : [...current, topicId]

    updateUrl({ ...initialFilters, topicIds: updated })
  }, [initialFilters, updateUrl])

  const toggleYear = useCallback((year: number) => {
    const current = initialFilters.years || []
    const updated = current.includes(year)
      ? current.filter(y => y !== year)
      : [...current, year]

    updateUrl({ ...initialFilters, years: updated })
  }, [initialFilters, updateUrl])

  const toggleQuestionNumber = useCallback((questionNumber: number) => {
    const current = initialFilters.questionNumbers || []
    const updated = current.includes(questionNumber)
      ? current.filter(q => q !== questionNumber)
      : [...current, questionNumber]

    updateUrl({ ...initialFilters, questionNumbers: updated })
  }, [initialFilters, updateUrl])

  const addSearchTerm = useCallback((term: string) => {
    const current = initialFilters.searchTerms || []
    if (current.includes(term)) return

    updateUrl({ ...initialFilters, searchTerms: [...current, term] })
  }, [initialFilters, updateUrl])

  const removeSearchTerm = useCallback((term: string) => {
    const current = initialFilters.searchTerms || []
    const updated = current.filter(t => t !== term)

    updateUrl({
      ...initialFilters,
      searchTerms: updated.length > 0 ? updated : undefined
    })
  }, [initialFilters, updateUrl])

  const clearAllFilters = useCallback(() => {
    router.replace(pathname, { scroll: false })
  }, [pathname, router])

  return {
    // Single source of truth - URL state
    filters: initialFilters,
    // Update functions
    toggleTopic,
    toggleYear,
    toggleQuestionNumber,
    addSearchTerm,
    removeSearchTerm,
    clearAllFilters,
    // Loading state for UI feedback
    isPending,
  }
}
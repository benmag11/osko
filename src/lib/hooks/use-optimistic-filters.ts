'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { updateSearchParams } from '@/lib/utils/url-filters'
import type { Filters } from '@/lib/types/database'

interface OptimisticFiltersOptions {
  syncDelay?: number // Default 300ms
  replaceHistory?: boolean // Use replace instead of push
}

export function useOptimisticFilters(
  initialFilters: Filters,
  options: OptimisticFiltersOptions = {}
) {
  const { syncDelay = 300, replaceHistory = true } = options
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Local optimistic state - this updates instantly
  const [optimisticFilters, setOptimisticFilters] = useState<Filters>(initialFilters)

  // Track if we're currently applying a URL update to avoid loops
  const isApplyingUrlUpdate = useRef(false)

  // Sync optimistic state when URL changes (browser back/forward, direct URL edit)
  useEffect(() => {
    if (!isApplyingUrlUpdate.current) {
      setOptimisticFilters(initialFilters)
    }
  }, [initialFilters])

  // Debounced URL sync function
  const syncToUrl = useDebouncedCallback(
    (filters: Filters) => {
      isApplyingUrlUpdate.current = true

      const newParams = updateSearchParams(searchParams, filters)
      const query = newParams.toString()
      const url = query ? `${pathname}?${query}` : pathname

      // Use replace to avoid history spam when rapidly clicking filters
      if (replaceHistory) {
        router.replace(url, { scroll: false })
      } else {
        router.push(url, { scroll: false })
      }

      // Reset flag after navigation completes
      requestAnimationFrame(() => {
        isApplyingUrlUpdate.current = false
      })
    },
    syncDelay,
    { leading: false, trailing: true }
  )

  // Optimistic update functions - these update local state immediately
  const updateFilters = useCallback((updates: Partial<Filters>) => {
    setOptimisticFilters(prev => {
      const newFilters = { ...prev, ...updates }
      syncToUrl(newFilters)
      return newFilters
    })
  }, [syncToUrl])

  const toggleTopic = useCallback((topicId: string) => {
    setOptimisticFilters(prev => {
      const current = prev.topicIds || []
      const updated = current.includes(topicId)
        ? current.filter(id => id !== topicId)
        : [...current, topicId]

      const newFilters = { ...prev, topicIds: updated }
      syncToUrl(newFilters)
      return newFilters
    })
  }, [syncToUrl])

  const toggleYear = useCallback((year: number) => {
    setOptimisticFilters(prev => {
      const current = prev.years || []
      const updated = current.includes(year)
        ? current.filter(y => y !== year)
        : [...current, year]

      const newFilters = { ...prev, years: updated }
      syncToUrl(newFilters)
      return newFilters
    })
  }, [syncToUrl])

  const toggleQuestionNumber = useCallback((questionNumber: number) => {
    setOptimisticFilters(prev => {
      const current = prev.questionNumbers || []
      const updated = current.includes(questionNumber)
        ? current.filter(q => q !== questionNumber)
        : [...current, questionNumber]

      const newFilters = { ...prev, questionNumbers: updated }
      syncToUrl(newFilters)
      return newFilters
    })
  }, [syncToUrl])

  const addSearchTerm = useCallback((term: string) => {
    setOptimisticFilters(prev => {
      const current = prev.searchTerms || []
      if (current.includes(term)) return prev

      const newFilters = { ...prev, searchTerms: [...current, term] }
      syncToUrl(newFilters)
      return newFilters
    })
  }, [syncToUrl])

  const removeSearchTerm = useCallback((term: string) => {
    setOptimisticFilters(prev => {
      const current = prev.searchTerms || []
      const updated = current.filter(t => t !== term)

      const newFilters = {
        ...prev,
        searchTerms: updated.length > 0 ? updated : undefined
      }
      syncToUrl(newFilters)
      return newFilters
    })
  }, [syncToUrl])

  const clearAllFilters = useCallback(() => {
    const clearedFilters = { subjectId: optimisticFilters.subjectId }
    setOptimisticFilters(clearedFilters)
    router.replace(pathname, { scroll: false })
  }, [optimisticFilters.subjectId, pathname, router])

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    // Optimistic state for immediate UI updates
    filters: optimisticFilters,
    // URL state for data fetching (original filters)
    urlFilters: initialFilters,
    // Update functions
    updateFilters,
    toggleTopic,
    toggleYear,
    toggleQuestionNumber,
    addSearchTerm,
    removeSearchTerm,
    clearAllFilters,
  }), [
    optimisticFilters,
    initialFilters,
    updateFilters,
    toggleTopic,
    toggleYear,
    toggleQuestionNumber,
    addSearchTerm,
    removeSearchTerm,
    clearAllFilters,
  ])
}
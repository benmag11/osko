'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { useDebouncedCallback } from 'use-debounce'
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

  const debouncedSearchUpdate = useDebouncedCallback(
    (searchTerm: string) => {
      updateUrl({ searchTerm: searchTerm || undefined })
    },
    300
  )

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

  const clearAllFilters = useCallback(() => {
    router.push(pathname)
  }, [pathname, router])

  return {
    updateUrl,
    debouncedSearchUpdate,
    toggleTopic,
    toggleYear,
    clearAllFilters,
    isPending,
  }
}
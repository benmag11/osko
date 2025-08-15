'use client'

import { useMemo, useCallback } from 'react'
import { CalendarSearch } from 'lucide-react'
import { CollapsibleFilter } from './collapsible-filter'
import { useFilterUpdates } from '@/lib/hooks/use-filter-updates'
import type { Filters } from '@/lib/types/database'

interface YearFilterProps {
  years: number[]
  filters: Filters
}

export function YearFilter({ years, filters }: YearFilterProps) {
  const { toggleYear } = useFilterUpdates(filters)
  
  const filterItems = useMemo(() => 
    years.map(year => ({
      id: year,
      label: year.toString()
    })), [years])

  const handleToggle = useCallback((id: string | number) => {
    toggleYear(id as number)
  }, [toggleYear])

  return (
    <CollapsibleFilter
      title="Study by year"
      icon={CalendarSearch}
      items={filterItems}
      selectedIds={filters.years}
      onToggle={handleToggle}
    />
  )
}
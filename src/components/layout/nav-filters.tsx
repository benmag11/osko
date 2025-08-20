"use client"

import { SearchFilter } from "@/components/filters/search-filter"
import { TopicFilter } from "@/components/filters/topic-filter"
import { YearFilter } from "@/components/filters/year-filter"
import type { Topic, Filters } from "@/lib/types/database"

interface NavFiltersProps {
  topics: Topic[]
  years: number[]
  filters: Filters
}

export function NavFilters({ topics, years, filters }: NavFiltersProps) {
  return (
    <>
      <SearchFilter filters={filters} />
      <TopicFilter topics={topics} filters={filters} />
      <YearFilter years={years} filters={filters} />
    </>
  )
}
"use client"

import { SearchFilter } from "@/components/filters/search-filter"
import { TopicFilter } from "@/components/filters/topic-filter"
import { YearFilter } from "@/components/filters/year-filter"
import { SidebarGroup } from "@/components/ui/sidebar"
import type { Topic, Filters } from "@/lib/types/database"

interface NavFiltersProps {
  topics: Topic[]
  years: number[]
  filters: Filters
}

export function NavFilters({ topics, years, filters }: NavFiltersProps) {
  return (
    <SidebarGroup className="flex-1 overflow-auto">
      <div className="space-y-4">
        <SearchFilter filters={filters} />
        <TopicFilter topics={topics} filters={filters} />
        <YearFilter years={years} filters={filters} />
      </div>
    </SidebarGroup>
  )
}
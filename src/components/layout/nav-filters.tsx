"use client"

import { SearchFilter } from "@/components/filters/search-filter"
import { TopicFilterAccordion } from "@/components/filters/topic-filter-accordion"
import { YearFilterAccordion } from "@/components/filters/year-filter-accordion"
import { Accordion } from "@/components/ui/accordion"
import { SidebarGroup } from "@/components/ui/sidebar"
import type { Topic, Filters } from "@/lib/types/database"

interface NavFiltersProps {
  topics: Topic[]
  years: number[]
  filters: Filters
}

export function NavFilters({ topics, years, filters }: NavFiltersProps) {
  return (
    <SidebarGroup className="space-y-0">
      <div className="space-y-3">
        <SearchFilter filters={filters} />
        <Accordion type="single" collapsible defaultValue="topics" className="w-full space-y-3">
          <TopicFilterAccordion topics={topics} filters={filters} />
          <YearFilterAccordion years={years} filters={filters} />
        </Accordion>
      </div>
    </SidebarGroup>
  )
}
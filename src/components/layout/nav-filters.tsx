"use client"

import { SearchFilter } from "@/components/filters/search-filter"
import { TopicFilterAccordion } from "@/components/filters/topic-filter-accordion"
import { YearFilterAccordion } from "@/components/filters/year-filter-accordion"
import { Accordion } from "@/components/ui/accordion"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
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
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <Accordion type="single" collapsible defaultValue="topics" className="w-full">
              <TopicFilterAccordion topics={topics} filters={filters} />
              <YearFilterAccordion years={years} filters={filters} />
            </Accordion>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  )
}
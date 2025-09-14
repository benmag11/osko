"use client"

import { SearchFilter } from "@/components/filters/search-filter"
import { TopicFilterAccordion } from "@/components/filters/topic-filter-accordion"
import { YearFilterAccordion } from "@/components/filters/year-filter-accordion"
import { QuestionFilterAccordion } from "@/components/filters/question-filter-accordion"
import { Accordion } from "@/components/ui/accordion"
import { SidebarGroup } from "@/components/ui/sidebar"
import type { Topic } from "@/lib/types/database"

interface NavFiltersProps {
  topics: Topic[]
  years: number[]
  questionNumbers: number[]
}

export function NavFilters({ topics, years, questionNumbers }: NavFiltersProps) {
  return (
    <SidebarGroup className="space-y-0">
      <div className="space-y-3">
        <SearchFilter />
        <Accordion type="single" collapsible className="w-full space-y-3">
          <TopicFilterAccordion topics={topics} />
          <YearFilterAccordion years={years} />
          <QuestionFilterAccordion questionNumbers={questionNumbers} />
        </Accordion>
      </div>
    </SidebarGroup>
  )
}
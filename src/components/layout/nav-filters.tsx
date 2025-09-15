"use client"

import { useState, useRef, useEffect } from 'react'
import { SearchFilter } from "@/components/filters/search-filter"
import { TopicFilterAccordion } from "@/components/filters/topic-filter-accordion"
import { YearFilterAccordion } from "@/components/filters/year-filter-accordion"
import { QuestionFilterAccordion } from "@/components/filters/question-filter-accordion"
import { Accordion } from "@/components/ui/accordion"
import { SidebarGroup, useSidebar } from "@/components/ui/sidebar"
import type { Topic } from "@/lib/types/database"

interface NavFiltersProps {
  topics: Topic[]
  years: number[]
  questionNumbers: number[]
}

export function NavFilters({ topics, years, questionNumbers }: NavFiltersProps) {
  const [openItem, setOpenItem] = useState<string | undefined>()
  const pendingAccordion = useRef<string | null>(null)
  const { state } = useSidebar()

  // When sidebar opens and we have a pending accordion, open it
  useEffect(() => {
    if (state === 'expanded' && pendingAccordion.current) {
      setOpenItem(pendingAccordion.current)
      pendingAccordion.current = null
    }
  }, [state])

  return (
    <SidebarGroup className="space-y-0">
      <div className="space-y-3">
        <SearchFilter />
        <Accordion
          type="single"
          collapsible
          className="w-full space-y-3"
          value={openItem}
          onValueChange={setOpenItem}
        >
          <TopicFilterAccordion topics={topics} pendingAccordionRef={pendingAccordion} />
          <YearFilterAccordion years={years} pendingAccordionRef={pendingAccordion} />
          <QuestionFilterAccordion questionNumbers={questionNumbers} pendingAccordionRef={pendingAccordion} />
        </Accordion>
      </div>
    </SidebarGroup>
  )
}
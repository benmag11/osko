'use client'

import { ChevronRight, ListFilter } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { useFilterUpdates } from '@/lib/hooks/use-filter-updates'
import type { Topic, Filters } from '@/lib/types/database'

interface TopicFilterAccordionProps {
  topics: Topic[]
  filters: Filters
}

export function TopicFilterAccordion({ topics, filters }: TopicFilterAccordionProps) {
  const { toggleTopic } = useFilterUpdates(filters)

  return (
    <AccordionItem value="topics" className="border-0">
      <AccordionTrigger className="p-0 hover:no-underline [&>svg]:hidden data-[state=open]:pb-0 [&[data-state=open]_[data-chevron]]:rotate-90">
        <SidebarMenuButton 
          tooltip="Study by topic" 
          className="w-full font-medium text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          asChild
        >
          <div className="flex items-center">
            <ListFilter />
            <span className="text-base">Study by topic</span>
            <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200" data-chevron />
          </div>
        </SidebarMenuButton>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-0">
        <SidebarMenuSub>
          {topics.map((topic) => (
            <SidebarMenuSubItem key={topic.id}>
              <label className="flex cursor-pointer items-center gap-3 px-2 py-1.5">
                <Checkbox
                  checked={filters.topicIds?.includes(topic.id) ?? false}
                  onCheckedChange={() => toggleTopic(topic.id)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-sans text-warm-text-secondary">
                  {topic.name}
                </span>
              </label>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </AccordionContent>
    </AccordionItem>
  )
}
'use client'

import { ChevronRight, ListFilter } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { useFilterUpdates } from '@/lib/hooks/use-filter-updates'
import type { Topic, Filters } from '@/lib/types/database'

interface TopicFilterProps {
  topics: Topic[]
  filters: Filters
}

export function TopicFilter({ topics, filters }: TopicFilterProps) {
  const { toggleTopic } = useFilterUpdates(filters)

  return (
    <SidebarGroup>
      <SidebarMenu>
        <Collapsible
          asChild
          defaultOpen={true}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip="Study by topic" className="font-medium text-sidebar-foreground/90">
                <ListFilter />
                <span className="text-base">Study by topic</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  )
}
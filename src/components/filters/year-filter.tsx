'use client'

import { ChevronRight, CalendarSearch } from 'lucide-react'
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
import type { Filters } from '@/lib/types/database'

interface YearFilterProps {
  years: number[]
  filters: Filters
}

export function YearFilter({ years, filters }: YearFilterProps) {
  const { toggleYear } = useFilterUpdates(filters)

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
              <SidebarMenuButton tooltip="Study by year" className="font-medium text-sidebar-foreground/90">
                <CalendarSearch />
                <span className="text-base">Study by year</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {years.map((year) => (
                  <SidebarMenuSubItem key={year}>
                    <label className="flex cursor-pointer items-center gap-3 px-2 py-1.5">
                      <Checkbox
                        checked={filters.years?.includes(year) ?? false}
                        onCheckedChange={() => toggleYear(year)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm font-sans text-warm-text-secondary">
                        {year}
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
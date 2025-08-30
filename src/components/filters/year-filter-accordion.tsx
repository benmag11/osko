'use client'

import { ChevronRight, CalendarSearch } from 'lucide-react'
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
  useSidebar,
} from '@/components/ui/sidebar'
import { useFilterUpdates } from '@/lib/hooks/use-filter-updates'
import type { Filters } from '@/lib/types/database'

interface YearFilterAccordionProps {
  years: number[]
  filters: Filters
}

export function YearFilterAccordion({ years, filters }: YearFilterAccordionProps) {
  const { toggleYear } = useFilterUpdates(filters)
  const { state, setOpen } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const handleAccordionClick = (e: React.MouseEvent) => {
    if (isCollapsed) {
      e.preventDefault()
      e.stopPropagation()
      setOpen(true)
      setTimeout(() => {
        const trigger = e.currentTarget as HTMLElement
        trigger?.click()
      }, 200)
    }
  }

  return (
    <AccordionItem value="years" className="border-0">
      <AccordionTrigger 
        className="p-0 hover:no-underline [&>svg]:hidden data-[state=open]:pb-0 [&[data-state=open]_[data-chevron]]:rotate-90"
        onClick={handleAccordionClick}
      >
        <SidebarMenuButton 
          tooltip="Study by year" 
          className="w-full font-medium text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          asChild
        >
          <div className="flex items-center">
            <CalendarSearch />
            <span className="text-base">Study by year</span>
            <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200" data-chevron />
          </div>
        </SidebarMenuButton>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-0">
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
      </AccordionContent>
    </AccordionItem>
  )
}
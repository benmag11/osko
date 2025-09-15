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
  useSidebar,
} from '@/components/ui/sidebar'
import { useFilters } from '@/components/providers/filter-provider'

interface YearFilterAccordionProps {
  years: number[]
}

export function YearFilterAccordion({ years }: YearFilterAccordionProps) {
  const { filters, toggleYear, isPending } = useFilters()
  const { state, setOpen } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const handleAccordionClick = (e: React.MouseEvent) => {
    if (isCollapsed) {
      e.preventDefault()
      e.stopPropagation()
      setOpen(true)
      // Trigger accordion immediately on next tick
      setTimeout(() => {
        const trigger = e.currentTarget as HTMLElement
        trigger?.click()
      }, 0)
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
        <div className="mx-3.5 px-2.5 py-0.5 group-data-[collapsible=icon]:hidden">
          <div className="grid grid-cols-1 min-[350px]:grid-cols-2 gap-x-3 gap-y-1.5">
            {years.map((year) => (
              <label
                key={year}
                className={`flex cursor-pointer items-center gap-2 px-1 py-1.5 rounded-md hover:bg-sidebar-accent/50 transition-colors ${
                  isPending ? 'opacity-70' : ''
                }`}
              >
                <Checkbox
                  checked={filters.years?.includes(year) ?? false}
                  onCheckedChange={() => toggleYear(year)}
                  disabled={isPending}
                  className="h-4 w-4 data-[state=checked]:animate-scale-in"
                />
                <span className="text-sm font-sans text-warm-text-secondary">
                  {year}
                </span>
              </label>
            ))}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
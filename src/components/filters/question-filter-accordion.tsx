'use client'

import { ChevronRight, ArrowDown01 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AccordionContent,
  AccordionItem,
} from '@/components/ui/accordion'
import { CollapsibleAccordionTrigger } from '@/components/ui/collapsible-accordion-trigger'
import {
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { useFilters } from '@/components/providers/filter-provider'

interface QuestionFilterAccordionProps {
  questionNumbers: number[]
  pendingAccordionRef: React.MutableRefObject<string | null>
}

export function QuestionFilterAccordion({ questionNumbers, pendingAccordionRef }: QuestionFilterAccordionProps) {
  const { filters, toggleQuestionNumber, isPending } = useFilters()

  return (
    <AccordionItem value="questions" className="border-0">
      <CollapsibleAccordionTrigger
        value="questions"
        pendingAccordionRef={pendingAccordionRef}
        className="p-0 hover:no-underline [&>svg]:hidden data-[state=open]:pb-0 [&[data-state=open]_[data-chevron]]:rotate-90"
      >
        <SidebarMenuButton
          tooltip="Study by question"
          className="w-full font-medium text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          asChild
        >
          <div className="flex items-center">
            <ArrowDown01 />
            <span className="text-base">Study by question</span>
            <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200" data-chevron />
          </div>
        </SidebarMenuButton>
      </CollapsibleAccordionTrigger>
      <AccordionContent className="pt-2 pb-0">
        <SidebarMenuSub>
          {questionNumbers.map((questionNumber) => (
            <SidebarMenuSubItem key={questionNumber}>
              <label className={`flex cursor-pointer items-center gap-3 px-2 py-1.5 ${
                isPending ? 'opacity-70' : ''
              }`}>
                <Checkbox
                  checked={filters.questionNumbers?.includes(questionNumber) ?? false}
                  onCheckedChange={() => toggleQuestionNumber(questionNumber)}
                  disabled={isPending}
                  className="h-4 w-4 data-[state=checked]:animate-scale-in"
                />
                <span className="text-sm font-sans text-warm-text-secondary">
                  Question {questionNumber}
                </span>
              </label>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </AccordionContent>
    </AccordionItem>
  )
}
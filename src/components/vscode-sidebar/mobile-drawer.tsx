'use client'

import { Search, ListFilter, CalendarSearch, ArrowDown01, LogOut } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { SubjectSelector } from './subject-selector'
import { useFilters } from '@/components/providers/filter-provider'
import { useAuth } from '@/components/providers/auth-provider'
import { formatName, formatInitials } from '@/lib/utils/format-name'
import { clientSignOut } from '@/lib/auth/client-auth'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Subject, Topic } from '@/lib/types/database'

interface MobileDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: Subject
  topics: Topic[]
  years: number[]
  questionNumbers: number[]
}

export function MobileDrawer({
  open,
  onOpenChange,
  subject,
  topics,
  years,
  questionNumbers,
}: MobileDrawerProps) {
  const { filters, addSearchTerm, toggleTopic, toggleYear, toggleQuestionNumber, isPending } = useFilters()
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const [searchValue, setSearchValue] = useState('')

  const handleAddKeyword = () => {
    if (searchValue.trim()) {
      addSearchTerm(searchValue.trim())
      setSearchValue('')
    }
  }

  const handleSignOut = async () => {
    await clientSignOut(queryClient)
  }

  const name = profile?.name || user?.user_metadata?.full_name || 'User'
  const displayName = formatName(name)
  const initials = formatInitials(name)
  const email = user?.email || ''

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 w-[300px]">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>

        {/* Subject Selector at top */}
        <div className="border-b border-stone-200">
          <SubjectSelector subject={subject} />
        </div>

        {/* Filters */}
        <ScrollArea className="flex-1 h-[calc(100vh-140px)]">
          <Accordion type="single" collapsible className="px-2 py-2">
            {/* Search by Keyword */}
            <AccordionItem value="search" className="border-b-0">
              <AccordionTrigger className="py-3 px-2 hover:no-underline hover:bg-cream-200/50 rounded-md">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <span className="text-sm font-medium">Search by keyword</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-3">
                <div className="flex gap-2">
                  <Input
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                    placeholder="Try typing 'prove'"
                    className="h-8 text-sm flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-stone-300 bg-transparent transition-colors hover:border-salmon-500"
                    aria-label="Add search keyword"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Study by Topic */}
            <AccordionItem value="topics" className="border-b-0">
              <AccordionTrigger className="py-3 px-2 hover:no-underline hover:bg-cream-200/50 rounded-md">
                <div className="flex items-center gap-2">
                  <ListFilter className="h-4 w-4" />
                  <span className="text-sm font-medium">Study by topic</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-3">
                <div className="flex flex-col gap-1">
                  {topics.map((topic) => (
                    <label
                      key={topic.id}
                      className={`flex cursor-pointer items-center gap-3 px-2 py-1.5 rounded-md hover:bg-cream-200/50 transition-colors ${
                        isPending ? 'opacity-70' : ''
                      }`}
                    >
                      <Checkbox
                        checked={filters.topicIds?.includes(topic.id) ?? false}
                        onCheckedChange={() => toggleTopic(topic.id)}
                        disabled={isPending}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-warm-text-secondary">
                        {topic.name}
                      </span>
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Study by Year */}
            <AccordionItem value="years" className="border-b-0">
              <AccordionTrigger className="py-3 px-2 hover:no-underline hover:bg-cream-200/50 rounded-md">
                <div className="flex items-center gap-2">
                  <CalendarSearch className="h-4 w-4" />
                  <span className="text-sm font-medium">Study by year</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-3">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {years.map((year) => (
                    <label
                      key={year}
                      className={`flex cursor-pointer items-center gap-2 px-2 py-1.5 rounded-md hover:bg-cream-200/50 transition-colors ${
                        isPending ? 'opacity-70' : ''
                      }`}
                    >
                      <Checkbox
                        checked={filters.years?.includes(year) ?? false}
                        onCheckedChange={() => toggleYear(year)}
                        disabled={isPending}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-warm-text-secondary">
                        {year}
                      </span>
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Study by Question */}
            <AccordionItem value="questions" className="border-b-0">
              <AccordionTrigger className="py-3 px-2 hover:no-underline hover:bg-cream-200/50 rounded-md">
                <div className="flex items-center gap-2">
                  <ArrowDown01 className="h-4 w-4" />
                  <span className="text-sm font-medium">Study by question</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-3">
                <div className="flex flex-col gap-1">
                  {questionNumbers.map((questionNumber) => (
                    <label
                      key={questionNumber}
                      className={`flex cursor-pointer items-center gap-3 px-2 py-1.5 rounded-md hover:bg-cream-200/50 transition-colors ${
                        isPending ? 'opacity-70' : ''
                      }`}
                    >
                      <Checkbox
                        checked={filters.questionNumbers?.includes(questionNumber) ?? false}
                        onCheckedChange={() => toggleQuestionNumber(questionNumber)}
                        disabled={isPending}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-warm-text-secondary">
                        Question {questionNumber}
                      </span>
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>

        {/* User section at bottom */}
        {user && (
          <div className="border-t border-stone-200 p-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-cream-200 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4 text-warm-text-muted" />
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

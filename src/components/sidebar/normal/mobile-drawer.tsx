'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, ListFilter, CalendarSearch, ArrowDown01, Plus, ChevronsUpDown } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { MobileDrawer } from '../core/mobile-drawer'
import { SubjectDropdown } from '@/components/layout/subject-dropdown'
import { FilterTag } from '@/components/filters/filter-tag'
import { useFilters } from '@/components/providers/filter-provider'
import { useUserSubjects } from '@/lib/hooks/use-user-subjects'
import { useUserProfile } from '@/lib/hooks/use-user-profile'
import { getSubjectIcon } from '@/lib/utils/subject-icons'
import type { Subject, Topic } from '@/lib/types/database'

interface NormalMobileDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: Subject
  topics: Topic[]
  years: number[]
  questionNumbers: number[]
}

/**
 * Mobile drawer for normal sidebar
 * Shows subject selector and filter accordions
 */
export function NormalMobileDrawer({
  open,
  onOpenChange,
  subject,
  topics,
  years,
  questionNumbers,
}: NormalMobileDrawerProps) {
  const { filters, addSearchTerm, removeSearchTerm, toggleTopic, toggleYear, toggleQuestionNumber, isPending } =
    useFilters()
  const { user } = useUserProfile()
  const { subjects, isLoading } = useUserSubjects(user?.id)
  const [searchValue, setSearchValue] = useState('')

  const handleAddKeyword = () => {
    if (searchValue.trim()) {
      addSearchTerm(searchValue.trim())
      setSearchValue('')
    }
  }

  const SubjectIcon = getSubjectIcon(subject.name)

  // Subject selector header content
  const headerContent = (
    <div className="p-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-cream-200/70 data-[state=open]:bg-cream-200/70">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-salmon-500 text-cream-50">
              <SubjectIcon className="h-4 w-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
              <span className="truncate font-serif font-semibold text-warm-text-primary">
                {subject.name}
              </span>
              <span className="truncate text-xs font-sans text-warm-text-muted">
                {subject.level} Level
              </span>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-warm-text-muted" />
          </button>
        </DropdownMenuTrigger>
        <SubjectDropdown
          subjects={subjects}
          currentSubject={subject}
          isLoading={isLoading}
          isMobile={true}
        />
      </DropdownMenu>
    </div>
  )

  return (
    <MobileDrawer
      open={open}
      onOpenChange={onOpenChange}
      headerContent={headerContent}
      title="Navigation"
    >
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
            <div className="flex flex-col gap-2">
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
              <AnimatePresence initial={false}>
                {(filters.searchTerms?.length ?? 0) > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col gap-1.5 overflow-hidden"
                  >
                    <p className="text-xs text-stone-400">
                      Including questions containing:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {filters.searchTerms?.map((term) => (
                        <motion.div
                          key={term}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          layout
                        >
                          <FilterTag
                            label={term}
                            onRemove={() => removeSearchTerm(term)}
                            size="sm"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
                  className={`group flex cursor-pointer items-center gap-3 px-2 py-1 rounded-md hover:bg-cream-200/50 transition-colors ${
                    isPending ? 'opacity-70' : ''
                  }`}
                >
                  <Checkbox
                    checked={filters.topicIds?.includes(topic.id) ?? false}
                    onCheckedChange={() => toggleTopic(topic.id)}
                    disabled={isPending}
                    className="h-4 w-4 border-stone-400"
                  />
                  <span className="text-sm text-stone-600 transition-colors group-hover:text-stone-900">
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
                  className={`group flex cursor-pointer items-center gap-2 px-2 py-1 rounded-md hover:bg-cream-200/50 transition-colors ${
                    isPending ? 'opacity-70' : ''
                  }`}
                >
                  <Checkbox
                    checked={filters.years?.includes(year) ?? false}
                    onCheckedChange={() => toggleYear(year)}
                    disabled={isPending}
                    className="h-4 w-4 border-stone-400"
                  />
                  <span className="text-sm text-stone-600 transition-colors group-hover:text-stone-900">
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
                  className={`group flex cursor-pointer items-center gap-3 px-2 py-1 rounded-md hover:bg-cream-200/50 transition-colors ${
                    isPending ? 'opacity-70' : ''
                  }`}
                >
                  <Checkbox
                    checked={filters.questionNumbers?.includes(questionNumber) ?? false}
                    onCheckedChange={() => toggleQuestionNumber(questionNumber)}
                    disabled={isPending}
                    className="h-4 w-4 border-stone-400"
                  />
                  <span className="text-sm text-stone-600 transition-colors group-hover:text-stone-900">
                    Question {questionNumber}
                  </span>
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </MobileDrawer>
  )
}

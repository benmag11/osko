'use client'

import { Search, ListFilter, CalendarSearch, LogOut, Headphones } from 'lucide-react'
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
import { useFilters } from '@/components/providers/filter-provider'
import { useAuth } from '@/components/providers/auth-provider'
import { formatName, formatInitials } from '@/lib/utils/format-name'
import { clientSignOut } from '@/lib/auth/client-auth'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSubjectIcon } from '@/lib/utils/subject-icons'
import type { Subject, AudioTopic } from '@/lib/types/database'

interface AudioMobileDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: Subject
  topics: AudioTopic[]
  years: number[]
}

/**
 * Mobile drawer for audio sidebar
 * Excludes question numbers filter (audio questions don't filter by question number)
 */
export function AudioMobileDrawer({
  open,
  onOpenChange,
  subject,
  topics,
  years,
}: AudioMobileDrawerProps) {
  const { filters, addSearchTerm, toggleTopic, toggleYear, isPending } = useFilters()
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

  const Icon = getSubjectIcon(subject.name)
  const isHigher = subject.level === 'Higher'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 w-[300px]">
        <SheetHeader className="sr-only">
          <SheetTitle>Audio Navigation</SheetTitle>
        </SheetHeader>

        {/* Subject info at top */}
        <div className="border-b border-stone-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-md shrink-0 border-[1.5px]',
                'bg-gradient-to-br from-salmon-500 to-salmon-600 border-salmon-600'
              )}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-semibold text-stone-800 truncate">
                {subject.name}
              </span>
              <span
                className={cn(
                  'text-sm shrink-0',
                  isHigher ? 'text-salmon-500' : 'text-sky-500'
                )}
              >
                ({isHigher ? 'H' : 'O'})
              </span>
              <Headphones className="h-4 w-4 text-salmon-500 shrink-0" />
            </div>
          </div>
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
                    placeholder="Search transcripts..."
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

            {/* Filter by Topic */}
            <AccordionItem value="topics" className="border-b-0">
              <AccordionTrigger className="py-3 px-2 hover:no-underline hover:bg-cream-200/50 rounded-md">
                <div className="flex items-center gap-2">
                  <ListFilter className="h-4 w-4" />
                  <span className="text-sm font-medium">Filter by topic</span>
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

            {/* Filter by Year */}
            <AccordionItem value="years" className="border-b-0">
              <AccordionTrigger className="py-3 px-2 hover:no-underline hover:bg-cream-200/50 rounded-md">
                <div className="flex items-center gap-2">
                  <CalendarSearch className="h-4 w-4" />
                  <span className="text-sm font-medium">Filter by year</span>
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

            {/* No "Study by Question" section - audio questions don't have question number filtering */}
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

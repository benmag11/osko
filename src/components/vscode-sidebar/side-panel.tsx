'use client'

import * as React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useVSCodeSidebar, type PanelId } from './sidebar-context'
import { SearchPanel } from './panels/search-panel'
import { TopicsPanel } from './panels/topics-panel'
import { YearsPanel } from './panels/years-panel'
import { QuestionsPanel } from './panels/questions-panel'
import type { Topic } from '@/lib/types/database'

const PANEL_TITLES: Record<PanelId, string> = {
  search: 'Search by Keyword',
  topics: 'Study by Topic',
  years: 'Study by Year',
  questions: 'Study by Question',
}

interface SidePanelProps {
  topics: Topic[]
  years: number[]
  questionNumbers: number[]
}

export function SidePanel({ topics, years, questionNumbers }: SidePanelProps) {
  const { activePanel } = useVSCodeSidebar()

  return (
    <div className="flex w-[280px] flex-col bg-cream-100">
      {/* Panel Header */}
      <div className="flex h-10 shrink-0 items-center border-b border-stone-200 px-4">
        <span className="font-serif text-sm font-semibold text-warm-text-primary uppercase tracking-wide">
          {PANEL_TITLES[activePanel]}
        </span>
      </div>

      {/* Panel Content */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {activePanel === 'search' && <SearchPanel />}
          {activePanel === 'topics' && <TopicsPanel topics={topics} />}
          {activePanel === 'years' && <YearsPanel years={years} />}
          {activePanel === 'questions' && <QuestionsPanel questionNumbers={questionNumbers} />}
        </div>
      </ScrollArea>
    </div>
  )
}

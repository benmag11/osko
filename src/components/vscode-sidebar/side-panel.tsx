'use client'

import * as React from 'react'
import { useVSCodeSidebar, type PanelId } from './sidebar-context'
import { SearchPanel } from './panels/search-panel'
import { TopicsPanel } from './panels/topics-panel'
import { YearsPanel } from './panels/years-panel'
import { QuestionsPanel } from './panels/questions-panel'
import { JumpToQuestionPanel } from './panels/jump-to-question-panel'
import { SubjectsPanel } from './panels/subjects-panel'
import type { Topic, Subject } from '@/lib/types/database'

const PANEL_TITLES: Record<PanelId, string> = {
  search: 'Search by Keyword',
  topics: 'Study by Topic',
  years: 'Study by Year',
  questions: 'Study by Question',
  jump: 'Jump to Question',
  subjects: 'Change Subject',
}

interface SidePanelProps {
  subject: Subject
  topics: Topic[]
  years: number[]
  questionNumbers: number[]
}

export function SidePanel({ subject, topics, years, questionNumbers }: SidePanelProps) {
  const { activePanel } = useVSCodeSidebar()

  return (
    <div className="flex w-[280px] flex-col bg-white">
      {/* Panel Header */}
      <div className="flex h-10 shrink-0 items-center px-4">
        <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
          {PANEL_TITLES[activePanel]}
        </span>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-auto">
        {activePanel === 'search' && (
          <div className="px-3 pb-3">
            <SearchPanel />
          </div>
        )}
        {activePanel === 'topics' && (
          <div className="px-1 pb-3">
            <TopicsPanel topics={topics} />
          </div>
        )}
        {activePanel === 'years' && (
          <div className="px-1 pb-3">
            <YearsPanel years={years} />
          </div>
        )}
        {activePanel === 'questions' && (
          <div className="px-1 pb-3">
            <QuestionsPanel questionNumbers={questionNumbers} />
          </div>
        )}
        {activePanel === 'jump' && (
          <JumpToQuestionPanel />
        )}
        {activePanel === 'subjects' && (
          <SubjectsPanel currentSubject={subject} />
        )}
      </div>
    </div>
  )
}

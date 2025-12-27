'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { useVSCodeSidebar, type PanelId } from './sidebar-context'
import { useQuestionNavigation } from '@/components/providers/question-navigation-provider'
import { SearchPanel } from './panels/search-panel'
import { TopicsPanel } from './panels/topics-panel'
import { YearsPanel } from './panels/years-panel'
import { QuestionsPanel } from './panels/questions-panel'
import { JumpToQuestionPanel } from './panels/jump-to-question-panel'
import { SubjectsPanel } from './panels/subjects-panel'
import { SettingsPanel } from './panels/settings-panel'
import type { Topic, Subject } from '@/lib/types/database'

const PANEL_TITLES: Record<PanelId, string> = {
  search: 'Search by Keyword',
  topics: 'Study by Topic',
  years: 'Study by Year',
  questions: 'Study by Question',
  jump: 'Jump to Question',
  subjects: 'Change Subject',
  settings: 'Settings',
}

interface SidePanelProps {
  subject: Subject
  topics: Topic[]
  years: number[]
  questionNumbers: number[]
}

export function SidePanel({ subject, topics, years, questionNumbers }: SidePanelProps) {
  const { activePanel } = useVSCodeSidebar()
  const isJumpPanel = activePanel === 'jump'

  return (
    <div className="flex w-[280px] flex-col bg-white overflow-hidden">
      {/* Panel Header */}
      <div className="flex h-10 shrink-0 items-center px-4">
        <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
          {PANEL_TITLES[activePanel]}
        </span>
      </div>

      {/* Status row for jump panel */}
      {isJumpPanel && (
        <div className="flex shrink-0 items-center px-4 pb-2 border-b border-stone-100">
          <JumpPanelStatusIndicator />
        </div>
      )}

      {/* Panel Content */}
      <div className="flex-1 overflow-auto" data-scroll-container>
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
          <div className="pb-3">
            <JumpToQuestionPanel />
          </div>
        )}
        {activePanel === 'subjects' && (
          <SubjectsPanel currentSubject={subject} />
        )}
        {activePanel === 'settings' && (
          <div className="px-3 pb-3">
            <SettingsPanel />
          </div>
        )}
      </div>
    </div>
  )
}

// Separate component to isolate re-renders from navigation context changes
function JumpPanelStatusIndicator() {
  const {
    totalCount,
    isLoading,
    isFetching,
    isNavigating,
    isReturning,
    navigationTarget,
    items,
  } = useQuestionNavigation()

  const formattedCount = totalCount > 0 ? totalCount.toLocaleString() : null
  const showLoadingState = isLoading && items.length === 0

  // Truncate title for display (max ~20 chars)
  const truncateTitle = (title: string, maxLength = 20) => {
    if (title.length <= maxLength) return title
    return title.slice(0, maxLength) + '…'
  }

  // "Jumping to [title]" state
  if (isNavigating && navigationTarget) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-salmon-500 min-w-0">
        <Loader2 className="h-3 w-3 animate-spin shrink-0" />
        <span className="truncate">Jumping to {truncateTitle(navigationTarget.title)}</span>
      </span>
    )
  }

  // "Returning to position" state
  if (isReturning) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-salmon-500 min-w-0">
        <Loader2 className="h-3 w-3 animate-spin shrink-0" />
        <span className="truncate">Returning to position</span>
      </span>
    )
  }

  // "Updating..." state (fetching in background)
  if (isFetching && !showLoadingState) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-stone-400 min-w-0">
        <Loader2 className="h-3 w-3 animate-spin shrink-0" />
        Updating...
      </span>
    )
  }

  // Default: "[count] total questions"
  if (formattedCount) {
    return (
      <span className="text-xs text-salmon-500">
        {formattedCount} total questions
      </span>
    )
  }

  // Empty/loading state
  return (
    <span className="text-xs text-stone-400">
      No questions
    </span>
  )
}

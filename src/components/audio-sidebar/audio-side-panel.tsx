'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { useAudioSidebar, type AudioPanelId } from './sidebar-context'
import { useAudioNavigation } from '@/components/providers/audio-navigation-provider'
import { SearchPanel } from '@/components/normal-sidebar/panels/search-panel'
import { TopicsPanel } from '@/components/normal-sidebar/panels/topics-panel'
import { YearsPanel } from '@/components/normal-sidebar/panels/years-panel'
import { AudioJumpToQuestionPanel } from './panels/audio-jump-to-question-panel'
import { AudioSubjectsPanel } from './panels/audio-subjects-panel'
import { AudioSettingsPanel } from './panels/audio-settings-panel'
import { useGroupedAudioTopics } from '@/lib/hooks/use-grouped-audio-topics'
import type { AudioTopic, Subject, Topic } from '@/lib/types/database'

const PANEL_TITLES: Record<AudioPanelId, string> = {
  search: 'Search by Keyword',
  topics: 'Study by Topic',
  years: 'Study by Year',
  jump: 'Jump to Question',
  subjects: 'Change Subject',
  settings: 'Settings',
}

interface AudioSidePanelProps {
  subject: Subject
  topics: AudioTopic[]
  years: number[]
}

export function AudioSidePanel({ subject, topics, years }: AudioSidePanelProps) {
  const { activePanel } = useAudioSidebar()
  const isJumpPanel = activePanel === 'jump'

  // Fetch grouped topics for collapsible sidebar
  const { groupedTopics } = useGroupedAudioTopics(subject.id)

  // Convert AudioTopic[] to Topic[] for TopicsPanel compatibility
  // Audio topics don't have groups, so group_id is always null
  const topicsForPanel: Topic[] = topics.map(t => ({
    id: t.id,
    name: t.name,
    subject_id: t.subject_id,
    group_id: null,
    created_at: t.created_at,
  }))

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
          <AudioJumpPanelStatusIndicator />
        </div>
      )}

      {/* Panel Content - NO 'questions' panel */}
      <div className="flex-1 overflow-auto" data-scroll-container>
        {activePanel === 'search' && (
          <div className="px-3 pb-3">
            <SearchPanel />
          </div>
        )}
        {activePanel === 'topics' && (
          <div className="px-1 pb-3">
            <TopicsPanel groupedTopics={groupedTopics} topics={topicsForPanel} />
          </div>
        )}
        {activePanel === 'years' && (
          <div className="px-1 pb-3">
            <YearsPanel years={years} />
          </div>
        )}
        {activePanel === 'jump' && (
          <div className="pb-3">
            <AudioJumpToQuestionPanel />
          </div>
        )}
        {activePanel === 'subjects' && (
          <AudioSubjectsPanel currentSubject={subject} />
        )}
        {activePanel === 'settings' && (
          <div className="px-3 pb-3">
            <AudioSettingsPanel />
          </div>
        )}
      </div>
    </div>
  )
}

// Separate component to isolate re-renders from navigation context changes
function AudioJumpPanelStatusIndicator() {
  const {
    totalCount,
    isLoading,
    isFetching,
    isNavigating,
    isReturning,
    navigationTarget,
    items,
  } = useAudioNavigation()

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

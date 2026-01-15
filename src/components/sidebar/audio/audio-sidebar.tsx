'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createSidebarContext } from '../core/sidebar-context'
import { SidebarHeader } from '../core/sidebar-header'
import { ActivityBar } from '../core/activity-bar'
import { SidePanel } from '../core/side-panel'
import { UserMenu } from '../core/user-menu'
import { JumpPanelStatus } from '../core/jump-panel-status'
import { audioSidebarConfig, type AudioPanelId } from './config'
import { AudioMobileDrawer } from './mobile-drawer'

// Shared panels
import { SearchPanel } from '../panels/search-panel'
import { TopicsPanel } from '../panels/topics-panel'
import { YearsPanel } from '../panels/years-panel'

// Audio-specific panels
import { AudioSubjectsPanel } from './panels/subjects-panel'
import { AudioJumpToQuestionPanel } from './panels/jump-to-question-panel'
import { AudioSettingsPanel } from './panels/settings-panel'

import { useAudioNavigation } from '@/components/providers/audio-navigation-provider'
import { useGroupedAudioTopics } from '@/lib/hooks/use-grouped-audio-topics'
import type { Subject, AudioTopic, Topic } from '@/lib/types/database'

// Create context with audio config
const { SidebarProvider, useSidebar } = createSidebarContext(audioSidebarConfig)

// Re-export for use in pages
export { SidebarProvider as AudioSidebarProvider }
export { useSidebar as useAudioSidebar }
export type { AudioPanelId }

interface AudioSidebarProps {
  subject: Subject
  topics: AudioTopic[]
  years: number[]
}

/**
 * Audio sidebar for viewing listening/audio questions
 * Uses the shared sidebar infrastructure with audio-specific configuration
 *
 * Key differences from NormalSidebar:
 * - No question numbers filtering (audio questions don't have this)
 * - Links to /dashboard/listening instead of /dashboard/study
 * - Uses audio-specific panels (AudioSubjectsPanel)
 */
export function AudioSidebar({ subject, topics, years }: AudioSidebarProps) {
  const sidebar = useSidebar()
  const navigation = useAudioNavigation()
  const { groupedTopics } = useGroupedAudioTopics(subject.id)

  // Convert AudioTopic[] to Topic[] for TopicsPanel compatibility
  // Audio topics don't have groups, so group_id is always null
  const topicsForPanel: Topic[] = topics.map((t) => ({
    id: t.id,
    name: t.name,
    subject_id: t.subject_id,
    group_id: null,
    created_at: t.created_at,
  }))

  // Mobile: Render Sheet-based drawer
  if (sidebar.isMobile === true) {
    return (
      <AudioMobileDrawer
        open={sidebar.openMobile}
        onOpenChange={sidebar.setOpenMobile}
        subject={subject}
        topics={topics}
        years={years}
      />
    )
  }

  // During SSR/hydration, render nothing to prevent mismatch
  if (sidebar.isMobile === undefined) {
    return null
  }

  // Render function for panel content - NO 'questions' panel
  const renderPanel = (panelId: AudioPanelId) => {
    switch (panelId) {
      case 'search':
        return (
          <div className="px-3 pb-3">
            <SearchPanel />
          </div>
        )
      case 'topics':
        return (
          <div className="px-1 pb-3">
            <TopicsPanel groupedTopics={groupedTopics} topics={topicsForPanel} />
          </div>
        )
      case 'years':
        return (
          <div className="px-1 pb-3">
            <YearsPanel years={years} />
          </div>
        )
      case 'jump':
        return (
          <div className="pb-3">
            <AudioJumpToQuestionPanel />
          </div>
        )
      case 'subjects':
        return <AudioSubjectsPanel currentSubject={subject} />
      case 'settings':
        return (
          <div className="px-3 pb-3">
            <AudioSettingsPanel />
          </div>
        )
      default:
        return null
    }
  }

  // Desktop: Render sidebar with activity bar and side panel
  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden lg:flex flex-col bg-white border-r border-stone-200',
          'transition-[width] duration-200 ease-out',
          sidebar.isCollapsed ? 'w-12' : 'w-[328px]'
        )}
      >
        {/* Header with Logo and Toggle */}
        <SidebarHeader config={audioSidebarConfig} sidebar={sidebar} />

        {/* Main Content: Activity Bar + Side Panel */}
        <div className="flex flex-1 min-h-0">
          {/* Activity Bar - always visible */}
          <ActivityBar
            config={audioSidebarConfig}
            sidebar={sidebar}
            userMenu={<UserMenu isMobile={sidebar.isMobile} isCollapsed={sidebar.isCollapsed} />}
          />

          {/* Side Panel - hidden when collapsed */}
          {!sidebar.isCollapsed && (
            <SidePanel
              config={audioSidebarConfig}
              sidebar={sidebar}
              renderPanel={renderPanel}
              jumpStatusIndicator={<JumpPanelStatus navigation={navigation} />}
            />
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}

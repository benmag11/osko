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
import { normalSidebarConfig, type NormalPanelId } from './config'
import { NormalMobileDrawer } from './mobile-drawer'

// Shared panels
import { SearchPanel } from '../panels/search-panel'
import { TopicsPanel } from '../panels/topics-panel'
import { YearsPanel } from '../panels/years-panel'

// Normal-specific panels
import { QuestionsPanel } from './panels/questions-panel'
import { SubjectsPanel } from './panels/subjects-panel'
import { JumpToQuestionPanel } from './panels/jump-to-question-panel'
import { SettingsPanel } from './panels/settings-panel'

import { useQuestionNavigation } from '@/components/providers/question-navigation-provider'
import { useGroupedTopics } from '@/lib/hooks/use-grouped-topics'
import type { Subject, Topic } from '@/lib/types/database'

// Create context with normal config
const { SidebarProvider, useSidebar } = createSidebarContext(normalSidebarConfig)

// Re-export for use in pages
export { SidebarProvider as NormalSidebarProvider }
export { useSidebar as useNormalSidebar }
export type { NormalPanelId }

interface NormalSidebarProps {
  subject: Subject
  topics: Topic[]
  years: number[]
  questionNumbers: number[]
}

/**
 * Normal sidebar for viewing exam questions
 * Uses the shared sidebar infrastructure with normal-specific configuration
 */
export function NormalSidebar({ subject, topics, years, questionNumbers }: NormalSidebarProps) {
  const sidebar = useSidebar()
  const navigation = useQuestionNavigation()
  const { groupedTopics } = useGroupedTopics(subject.id)

  // Mobile: Render Sheet-based drawer
  if (sidebar.isMobile === true) {
    return (
      <NormalMobileDrawer
        open={sidebar.openMobile}
        onOpenChange={sidebar.setOpenMobile}
        subject={subject}
        topics={topics}
        years={years}
        questionNumbers={questionNumbers}
      />
    )
  }

  // During SSR/hydration, render nothing to prevent mismatch
  if (sidebar.isMobile === undefined) {
    return null
  }

  // Render function for panel content
  const renderPanel = (panelId: NormalPanelId) => {
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
            <TopicsPanel groupedTopics={groupedTopics} topics={topics} />
          </div>
        )
      case 'years':
        return (
          <div className="px-1 pb-3">
            <YearsPanel years={years} />
          </div>
        )
      case 'questions':
        return (
          <div className="px-1 pb-3">
            <QuestionsPanel questionNumbers={questionNumbers} subjectName={subject.name} />
          </div>
        )
      case 'jump':
        return (
          <div className="pb-3">
            <JumpToQuestionPanel />
          </div>
        )
      case 'subjects':
        return <SubjectsPanel currentSubject={subject} />
      case 'settings':
        return (
          <div className="px-3 pb-3">
            <SettingsPanel />
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
        <SidebarHeader config={normalSidebarConfig} sidebar={sidebar} />

        {/* Main Content: Activity Bar + Side Panel */}
        <div className="flex flex-1 min-h-0">
          {/* Activity Bar - always visible */}
          <ActivityBar
            config={normalSidebarConfig}
            sidebar={sidebar}
            userMenu={<UserMenu isMobile={sidebar.isMobile} isCollapsed={sidebar.isCollapsed} />}
          />

          {/* Side Panel - hidden when collapsed */}
          {!sidebar.isCollapsed && (
            <SidePanel
              config={normalSidebarConfig}
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

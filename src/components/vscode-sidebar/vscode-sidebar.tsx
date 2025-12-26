'use client'

import * as React from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useVSCodeSidebar } from './sidebar-context'
import { SubjectSelector } from './subject-selector'
import { ActivityBar } from './activity-bar'
import { SidePanel } from './side-panel'
import { MobileDrawer } from './mobile-drawer'
import type { Subject, Topic } from '@/lib/types/database'

interface VSCodeSidebarProps {
  subject: Subject
  topics: Topic[]
  years: number[]
  questionNumbers: number[]
}

export function VSCodeSidebar({
  subject,
  topics,
  years,
  questionNumbers,
}: VSCodeSidebarProps) {
  const { isMobile, openMobile, setOpenMobile } = useVSCodeSidebar()

  // Mobile: Render Sheet-based drawer
  if (isMobile === true) {
    return (
      <MobileDrawer
        open={openMobile}
        onOpenChange={setOpenMobile}
        subject={subject}
        topics={topics}
        years={years}
        questionNumbers={questionNumbers}
      />
    )
  }

  // During SSR/hydration, render nothing to prevent mismatch
  if (isMobile === undefined) {
    return null
  }

  // Desktop: Render VS Code style sidebar
  return (
    <TooltipProvider delayDuration={0}>
      <aside className="fixed inset-y-0 left-0 z-30 hidden lg:flex flex-col w-[328px] bg-cream-100 border-r border-stone-200">
        {/* Subject Selector - Full Width at Top */}
        <div className="shrink-0 border-b border-stone-200">
          <SubjectSelector subject={subject} />
        </div>

        {/* Main Content: Activity Bar + Side Panel */}
        <div className="flex flex-1 min-h-0">
          {/* Activity Bar */}
          <ActivityBar />

          {/* Side Panel */}
          <SidePanel
            topics={topics}
            years={years}
            questionNumbers={questionNumbers}
          />
        </div>
      </aside>
    </TooltipProvider>
  )
}

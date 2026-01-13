'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useVSCodeSidebar } from './sidebar-context'
import { SidebarHeader } from './sidebar-header'
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
  const { isMobile, isCollapsed, openMobile, setOpenMobile } = useVSCodeSidebar()

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
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden lg:flex flex-col bg-white border-r border-stone-200',
          'transition-[width] duration-200 ease-out',
          isCollapsed ? 'w-12' : 'w-[328px]'
        )}
      >
        {/* Header with Logo and Toggle */}
        <SidebarHeader />

        {/* Main Content: Activity Bar + Side Panel */}
        <div className="flex flex-1 min-h-0">
          {/* Activity Bar - always visible */}
          <ActivityBar />

          {/* Side Panel - hidden when collapsed */}
          {!isCollapsed && (
            <SidePanel
              subject={subject}
              topics={topics}
              years={years}
              questionNumbers={questionNumbers}
            />
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}

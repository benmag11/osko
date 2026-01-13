'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useNormalSidebar } from './sidebar-context'
import { NormalSidebarHeader } from './normal-sidebar-header'
import { NormalActivityBar } from './normal-activity-bar'
import { NormalSidePanel } from './normal-side-panel'
import { NormalMobileDrawer } from './normal-mobile-drawer'
import type { Subject, Topic } from '@/lib/types/database'

interface NormalSidebarProps {
  subject: Subject
  topics: Topic[]
  years: number[]
  questionNumbers: number[]
}

export function NormalSidebar({
  subject,
  topics,
  years,
  questionNumbers,
}: NormalSidebarProps) {
  const { isMobile, isCollapsed, openMobile, setOpenMobile } = useNormalSidebar()

  // Mobile: Render Sheet-based drawer
  if (isMobile === true) {
    return (
      <NormalMobileDrawer
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

  // Desktop: Render normal sidebar
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
        <NormalSidebarHeader />

        {/* Main Content: Activity Bar + Side Panel */}
        <div className="flex flex-1 min-h-0">
          {/* Activity Bar - always visible */}
          <NormalActivityBar />

          {/* Side Panel - hidden when collapsed */}
          {!isCollapsed && (
            <NormalSidePanel
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

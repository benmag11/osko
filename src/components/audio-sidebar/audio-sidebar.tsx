'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAudioSidebar } from './sidebar-context'
import { AudioSidebarHeader } from './audio-sidebar-header'
import { AudioActivityBar } from './audio-activity-bar'
import { AudioSidePanel } from './audio-side-panel'
import { AudioMobileDrawer } from './audio-mobile-drawer'
import type { Subject, AudioTopic } from '@/lib/types/database'

interface AudioSidebarProps {
  subject: Subject
  topics: AudioTopic[]
  years: number[]
}

/**
 * Audio sidebar component for audio/listening viewer
 *
 * Key differences from NormalSidebar:
 * - No question numbers filtering (audio questions don't have this)
 * - Links to /dashboard/listening instead of /dashboard/study
 * - Uses audio-specific panels (AudioSubjectsPanel)
 * - Uses separate cookie storage for collapsed state
 */
export function AudioSidebar({
  subject,
  topics,
  years,
}: AudioSidebarProps) {
  const { isMobile, isCollapsed, openMobile, setOpenMobile } = useAudioSidebar()

  // Mobile: Render Sheet-based drawer
  if (isMobile === true) {
    return (
      <AudioMobileDrawer
        open={openMobile}
        onOpenChange={setOpenMobile}
        subject={subject}
        topics={topics}
        years={years}
      />
    )
  }

  // During SSR/hydration, render nothing to prevent mismatch
  if (isMobile === undefined) {
    return null
  }

  // Desktop: Render audio sidebar
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
        <AudioSidebarHeader />

        {/* Main Content: Activity Bar + Side Panel */}
        <div className="flex flex-1 min-h-0">
          {/* Activity Bar - always visible */}
          <AudioActivityBar />

          {/* Side Panel - hidden when collapsed */}
          {!isCollapsed && (
            <AudioSidePanel
              subject={subject}
              topics={topics}
              years={years}
            />
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useAudioSidebar } from './sidebar-context'

interface AudioSidebarAwareMainProps {
  children: React.ReactNode
  className?: string
}

/**
 * A wrapper for main content that responds to audio sidebar collapse state.
 * Applies dynamic margin-left on desktop to account for sidebar width.
 *
 * Same behavior as SidebarAwareMain but uses audio sidebar context.
 */
export function AudioSidebarAwareMain({ children, className }: AudioSidebarAwareMainProps) {
  const { isCollapsed, isMobile } = useAudioSidebar()

  // During SSR/hydration, use expanded margin as default
  // Mobile uses pt-14 for the navbar, no left margin
  return (
    <main
      className={cn(
        'min-h-screen bg-cream-50 pt-14 lg:pt-0',
        'transition-[margin-left] duration-200 ease-out',
        // Desktop margin based on collapse state
        // Collapsed: 48px (w-12), Expanded: 328px
        isMobile === false && isCollapsed ? 'lg:ml-12' : 'lg:ml-[328px]',
        className
      )}
    >
      {children}
    </main>
  )
}

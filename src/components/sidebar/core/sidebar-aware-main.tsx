'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { SidebarContextValue } from './types'

interface SidebarAwareMainProps {
  children: React.ReactNode
  className?: string
  /** Sidebar context value (only needs isCollapsed and isMobile) */
  sidebar: Pick<SidebarContextValue<string>, 'isCollapsed' | 'isMobile'>
}

/**
 * A wrapper for main content that responds to sidebar collapse state.
 * Applies dynamic margin-left on desktop to account for sidebar width.
 *
 * Width constants:
 * - Collapsed: 48px (w-12) - activity bar only
 * - Expanded: 328px - activity bar (48px) + side panel (280px)
 */
export function SidebarAwareMain({ children, className, sidebar }: SidebarAwareMainProps) {
  const { isCollapsed, isMobile } = sidebar

  // During SSR/hydration, use expanded margin as default
  // Mobile uses pt-14 for the navbar, no left margin
  return (
    <main
      className={cn(
        'min-h-screen bg-cream-50 pt-14 lg:pt-0',
        'transition-[margin-left] duration-200 ease-out',
        // Desktop margin based on collapse state
        isMobile === false && isCollapsed ? 'lg:ml-12' : 'lg:ml-[328px]',
        className
      )}
    >
      {children}
    </main>
  )
}

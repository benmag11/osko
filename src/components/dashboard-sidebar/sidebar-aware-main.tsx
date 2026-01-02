'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useDashboardSidebar } from './sidebar-context'

interface SidebarAwareMainProps {
  children: React.ReactNode
  className?: string
}

/**
 * A wrapper for main content that responds to sidebar collapse state.
 * Applies dynamic margin-left on desktop to account for sidebar width.
 *
 * Dashboard sidebar widths:
 * - Collapsed: 48px (w-12)
 * - Expanded: 180px (11.25rem)
 */
export function SidebarAwareMain({ children, className }: SidebarAwareMainProps) {
  const { isCollapsed, isMobile } = useDashboardSidebar()

  // During SSR/hydration, use expanded margin as default
  // Mobile uses pt-14 for the navbar, no left margin
  return (
    <main
      className={cn(
        'min-h-screen bg-cream-50 pt-14 lg:pt-10',
        'transition-[margin-left] duration-200 ease-out',
        // Desktop margin based on collapse state
        // Collapsed: 48px (w-12), Expanded: 180px (11.25rem)
        isMobile === false && isCollapsed ? 'lg:ml-12' : 'lg:ml-[180px]',
        className
      )}
    >
      {children}
    </main>
  )
}

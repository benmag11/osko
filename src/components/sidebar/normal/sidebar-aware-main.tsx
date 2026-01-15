'use client'

import * as React from 'react'
import { SidebarAwareMain as BaseSidebarAwareMain } from '../core/sidebar-aware-main'
import { useNormalSidebar } from './normal-sidebar'

interface NormalSidebarAwareMainProps {
  children: React.ReactNode
  className?: string
}

/**
 * Content wrapper that responds to normal sidebar collapse state.
 * Convenience wrapper that connects to the NormalSidebar context.
 */
export function NormalSidebarAwareMain({ children, className }: NormalSidebarAwareMainProps) {
  const sidebar = useNormalSidebar()

  return (
    <BaseSidebarAwareMain sidebar={sidebar} className={className}>
      {children}
    </BaseSidebarAwareMain>
  )
}

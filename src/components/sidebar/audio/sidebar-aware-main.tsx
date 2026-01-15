'use client'

import * as React from 'react'
import { SidebarAwareMain as BaseSidebarAwareMain } from '../core/sidebar-aware-main'
import { useAudioSidebar } from './audio-sidebar'

interface AudioSidebarAwareMainProps {
  children: React.ReactNode
  className?: string
}

/**
 * Content wrapper that responds to audio sidebar collapse state.
 * Convenience wrapper that connects to the AudioSidebar context.
 */
export function AudioSidebarAwareMain({ children, className }: AudioSidebarAwareMainProps) {
  const sidebar = useAudioSidebar()

  return (
    <BaseSidebarAwareMain sidebar={sidebar} className={className}>
      {children}
    </BaseSidebarAwareMain>
  )
}

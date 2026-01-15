'use client'

import * as React from 'react'
import type { SidebarConfig, SidebarContextValue } from './types'

interface SidePanelProps<TPanelId extends string> {
  /** Sidebar configuration (for panel titles) */
  config: SidebarConfig<TPanelId>
  /** Sidebar context value */
  sidebar: SidebarContextValue<TPanelId>
  /** Render function for panel content - receives active panel ID */
  renderPanel: (panelId: TPanelId) => React.ReactNode
  /** Optional status indicator to show for the jump panel */
  jumpStatusIndicator?: React.ReactNode
}

/**
 * Side panel container that shows the active panel content
 * Uses render props pattern for panel content to allow variant-specific panels
 *
 * Width: 280px (fixed)
 */
export function SidePanel<TPanelId extends string>({
  config,
  sidebar,
  renderPanel,
  jumpStatusIndicator,
}: SidePanelProps<TPanelId>) {
  const { activePanel } = sidebar
  const isJumpPanel = activePanel === 'jump'

  return (
    <div className="flex w-[280px] flex-col bg-white overflow-hidden">
      {/* Panel Header */}
      <div className="flex h-10 shrink-0 items-center px-4">
        <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
          {config.panelTitles[activePanel]}
        </span>
      </div>

      {/* Status row for jump panel */}
      {isJumpPanel && jumpStatusIndicator && (
        <div className="flex shrink-0 items-center px-4 pb-2 border-b border-stone-100">
          {jumpStatusIndicator}
        </div>
      )}

      {/* Panel Content */}
      <div className="flex-1 overflow-auto" data-scroll-container>
        {renderPanel(activePanel)}
      </div>
    </div>
  )
}

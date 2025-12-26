'use client'

import * as React from 'react'
import { Search, ListFilter, CalendarSearch, ArrowDown01, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useVSCodeSidebar, type PanelId } from './sidebar-context'
import { UserMenu } from './user-menu'

interface ActivityBarButtonProps {
  panelId: PanelId
  icon: LucideIcon
  tooltip: string
}

function ActivityBarButton({ panelId, icon: Icon, tooltip }: ActivityBarButtonProps) {
  const { activePanel, setActivePanel } = useVSCodeSidebar()
  const isActive = activePanel === panelId

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => setActivePanel(panelId)}
          className={cn(
            'relative flex h-12 w-12 items-center justify-center',
            'text-warm-text-muted transition-colors',
            'hover:text-warm-text-primary hover:bg-cream-300/50',
            isActive && 'text-salmon-600 bg-cream-100'
          )}
        >
          {/* Active indicator - left border */}
          {isActive && (
            <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-salmon-500" />
          )}
          <Icon className="h-5 w-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

const PANEL_CONFIG: { id: PanelId; icon: LucideIcon; tooltip: string }[] = [
  { id: 'search', icon: Search, tooltip: 'Search by keyword' },
  { id: 'topics', icon: ListFilter, tooltip: 'Study by topic' },
  { id: 'years', icon: CalendarSearch, tooltip: 'Study by year' },
  { id: 'questions', icon: ArrowDown01, tooltip: 'Study by question' },
]

export function ActivityBar() {
  return (
    <div className="flex w-12 flex-col bg-cream-200 border-r border-stone-200">
      {/* Panel icons */}
      <div className="flex flex-col">
        {PANEL_CONFIG.map((config) => (
          <ActivityBarButton
            key={config.id}
            panelId={config.id}
            icon={config.icon}
            tooltip={config.tooltip}
          />
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User menu at bottom */}
      <UserMenu />
    </div>
  )
}

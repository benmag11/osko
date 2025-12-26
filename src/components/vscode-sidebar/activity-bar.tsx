'use client'

import * as React from 'react'
import { Search, ListFilter, CalendarSearch, ArrowDown01, BookOpen, type LucideIcon } from 'lucide-react'
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
  const { activePanel, setActivePanel, isCollapsed, setIsCollapsed } = useVSCodeSidebar()
  // Only show as active when sidebar is expanded
  const isActive = activePanel === panelId && !isCollapsed

  const handleClick = () => {
    // If collapsed, expand first then switch panel
    if (isCollapsed) {
      setIsCollapsed(false)
    }
    setActivePanel(panelId)
  }

  const buttonElement = (
    <button
      onClick={handleClick}
      className={cn(
        'relative flex h-11 w-12 items-center justify-center',
        'text-stone-500 transition-all duration-150',
        // Hover styles only when NOT active
        !isActive && 'hover:text-stone-600 hover:bg-stone-100',
        // Active state with left indicator line (inset 2px from edge)
        isActive && [
          'text-salmon-500 bg-stone-50',
          'before:absolute before:left-[2px] before:top-1/2 before:-translate-y-1/2',
          'before:h-5 before:w-[2px] before:rounded-full before:bg-salmon-500',
        ]
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  )

  // Only show tooltip when sidebar is collapsed
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {buttonElement}
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    )
  }

  return buttonElement
}

const FILTER_CONFIG: { id: PanelId; icon: LucideIcon; tooltip: string }[] = [
  { id: 'search', icon: Search, tooltip: 'Search by keyword' },
  { id: 'topics', icon: ListFilter, tooltip: 'Study by topic' },
  { id: 'years', icon: CalendarSearch, tooltip: 'Study by year' },
  { id: 'questions', icon: ArrowDown01, tooltip: 'Study by question' },
]

export function ActivityBar() {
  return (
    <div className="flex w-12 flex-col bg-white border-r border-stone-200">
      {/* Filter icons */}
      <div className="flex flex-col">
        {FILTER_CONFIG.map((config) => (
          <ActivityBarButton
            key={config.id}
            panelId={config.id}
            icon={config.icon}
            tooltip={config.tooltip}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="mx-3 my-2 h-px bg-stone-200" />

      {/* Subject icon */}
      <ActivityBarButton
        panelId="subjects"
        icon={BookOpen}
        tooltip="Switch subject"
      />

      {/* Spacer */}
      <div className="flex-1" />

      {/* User menu at bottom */}
      <UserMenu />
    </div>
  )
}

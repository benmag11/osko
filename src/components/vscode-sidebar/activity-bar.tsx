'use client'

import * as React from 'react'
import Link from 'next/link'
import { Search, ListFilter, CalendarSearch, ArrowDown01, ChevronsDown, BookOpen, ArrowBigLeft, Settings, type LucideIcon } from 'lucide-react'
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
        'cursor-pointer relative flex h-11 w-12 items-center justify-center',
        'text-stone-600 transition-all duration-150',
        // Hover styles only when NOT active - just darken the icon, no background
        !isActive && 'hover:text-stone-800',
        // Active state with left indicator line (flush with edge) - no hover effect
        isActive && [
          'text-salmon-500',
          'before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2',
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
  { id: 'topics', icon: ListFilter, tooltip: 'Study by topic' },
  { id: 'search', icon: Search, tooltip: 'Search by keyword' },
  { id: 'questions', icon: ArrowDown01, tooltip: 'Study by question' },
  { id: 'years', icon: CalendarSearch, tooltip: 'Study by year' },
]

interface ActivityBarGroupProps {
  children: React.ReactNode
  /** If true, renders a divider below this group */
  withDivider?: boolean
  /** Whether the sidebar is collapsed */
  isCollapsed?: boolean
  /** Click handler for expanding when collapsed */
  onExpandClick?: (e: React.MouseEvent<HTMLDivElement>) => void
}

function ActivityBarGroup({ children, withDivider = false, isCollapsed, onExpandClick }: ActivityBarGroupProps) {
  return (
    <>
      <div className="flex flex-col" onClick={isCollapsed ? onExpandClick : undefined}>
        {children}
      </div>
      {withDivider && <div className="mx-3 my-0.5 h-px bg-stone-200" onClick={isCollapsed ? onExpandClick : undefined} />}
    </>
  )
}

function BackToDashboardButton() {
  const buttonElement = (
    <Link
      href="/dashboard/study"
      className={cn(
        'flex h-11 w-12 items-center justify-center',
        'text-stone-600 transition-all duration-150',
        'hover:text-stone-800 hover:bg-stone-100'
      )}
    >
      <ArrowBigLeft className="h-5 w-5" />
    </Link>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {buttonElement}
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        Back to Dashboard
      </TooltipContent>
    </Tooltip>
  )
}

export function ActivityBar() {
  const { isCollapsed, toggleSidebar } = useVSCodeSidebar()

  const handleExpandClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only expand if sidebar is collapsed and click is on empty space (not a button)
    if (isCollapsed && e.target === e.currentTarget) {
      toggleSidebar()
    }
  }

  return (
    <div
      className={cn(
        'flex w-12 flex-col bg-white border-r border-stone-200',
        isCollapsed && 'cursor-e-resize'
      )}
      onClick={handleExpandClick}
    >
      {/* Filter icons group */}
      <ActivityBarGroup withDivider isCollapsed={isCollapsed} onExpandClick={handleExpandClick}>
        {FILTER_CONFIG.map((config) => (
          <ActivityBarButton
            key={config.id}
            panelId={config.id}
            icon={config.icon}
            tooltip={config.tooltip}
          />
        ))}
      </ActivityBarGroup>

      {/* Jump to question + Settings group */}
      <ActivityBarGroup withDivider isCollapsed={isCollapsed} onExpandClick={handleExpandClick}>
        <ActivityBarButton
          panelId="jump"
          icon={ChevronsDown}
          tooltip="Jump to question"
        />
        <ActivityBarButton
          panelId="settings"
          icon={Settings}
          tooltip="Settings"
        />
      </ActivityBarGroup>

      {/* Subject group */}
      <ActivityBarGroup isCollapsed={isCollapsed} onExpandClick={handleExpandClick}>
        <ActivityBarButton
          panelId="subjects"
          icon={BookOpen}
          tooltip="Switch subject"
        />
      </ActivityBarGroup>

      {/* Spacer - clickable when collapsed */}
      <div
        className="flex-1"
        onClick={isCollapsed ? toggleSidebar : undefined}
      />

      {/* Back to Dashboard button */}
      <BackToDashboardButton />

      {/* User menu at bottom */}
      <UserMenu />
    </div>
  )
}

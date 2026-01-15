'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowBigLeft, ChevronsDown, Settings, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { SidebarConfig, SidebarContextValue } from './types'

interface ActivityBarButtonProps<TPanelId extends string> {
  panelId: TPanelId
  icon: LucideIcon
  tooltip: string
  sidebar: SidebarContextValue<TPanelId>
}

function ActivityBarButton<TPanelId extends string>({
  panelId,
  icon: Icon,
  tooltip,
  sidebar,
}: ActivityBarButtonProps<TPanelId>) {
  const { activePanel, setActivePanel, isCollapsed, setIsCollapsed } = sidebar
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
        // Hover styles only when NOT active
        !isActive && 'hover:text-stone-800',
        // Active state with left indicator line
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
        <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    )
  }

  return buttonElement
}

interface ActivityBarGroupProps {
  children: React.ReactNode
  withDivider?: boolean
  isCollapsed?: boolean
  onExpandClick?: (e: React.MouseEvent<HTMLDivElement>) => void
}

function ActivityBarGroup({
  children,
  withDivider = false,
  isCollapsed,
  onExpandClick,
}: ActivityBarGroupProps) {
  return (
    <>
      <div className="flex flex-col" onClick={isCollapsed ? onExpandClick : undefined}>
        {children}
      </div>
      {withDivider && (
        <div
          className="mx-3 my-0.5 h-px bg-stone-200"
          onClick={isCollapsed ? onExpandClick : undefined}
        />
      )}
    </>
  )
}

interface BackButtonProps {
  href: string
  label: string
}

function BackButton({ href, label }: BackButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          className={cn(
            'flex h-11 w-12 items-center justify-center',
            'text-stone-600 transition-all duration-150',
            'hover:text-stone-800 hover:bg-stone-100'
          )}
        >
          <ArrowBigLeft className="h-5 w-5" />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

interface ActivityBarProps<TPanelId extends string> {
  /** Sidebar configuration */
  config: SidebarConfig<TPanelId>
  /** Sidebar context value */
  sidebar: SidebarContextValue<TPanelId>
  /** User menu component to render at bottom */
  userMenu: React.ReactNode
}

/**
 * Activity bar with icon buttons for panel selection
 * Always visible (48px wide), even when sidebar is collapsed
 */
export function ActivityBar<TPanelId extends string>({
  config,
  sidebar,
  userMenu,
}: ActivityBarProps<TPanelId>) {
  const { isCollapsed, toggleSidebar } = sidebar

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
      {/* Filter buttons group */}
      <ActivityBarGroup withDivider isCollapsed={isCollapsed} onExpandClick={handleExpandClick}>
        {config.filterButtons.map((button) => (
          <ActivityBarButton
            key={button.id}
            panelId={button.id}
            icon={button.icon}
            tooltip={button.tooltip}
            sidebar={sidebar}
          />
        ))}
      </ActivityBarGroup>

      {/* Jump to question + Settings group */}
      <ActivityBarGroup withDivider isCollapsed={isCollapsed} onExpandClick={handleExpandClick}>
        <ActivityBarButton
          panelId={'jump' as TPanelId}
          icon={ChevronsDown}
          tooltip="Jump to question"
          sidebar={sidebar}
        />
        <ActivityBarButton
          panelId={'settings' as TPanelId}
          icon={Settings}
          tooltip="Settings"
          sidebar={sidebar}
        />
      </ActivityBarGroup>

      {/* Subject group */}
      <ActivityBarGroup isCollapsed={isCollapsed} onExpandClick={handleExpandClick}>
        <ActivityBarButton
          panelId={'subjects' as TPanelId}
          icon={config.subjectIcon}
          tooltip="Switch subject"
          sidebar={sidebar}
        />
      </ActivityBarGroup>

      {/* Spacer - clickable when collapsed */}
      <div className="flex-1" onClick={isCollapsed ? toggleSidebar : undefined} />

      {/* Back button */}
      <BackButton href={config.dashboardLink} label={config.dashboardLabel} />

      {/* User menu slot */}
      {userMenu}
    </div>
  )
}

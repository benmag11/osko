'use client'

import * as React from 'react'
import { SidebarMenuButton, useSidebar } from '@/components/ui/sidebar'
import type { ComponentProps } from 'react'

interface CollapsibleSidebarMenuButtonProps extends ComponentProps<typeof SidebarMenuButton> {
  onExpandedClick?: () => void
  expandDelay?: number
}

export function CollapsibleSidebarMenuButton({
  onClick,
  onExpandedClick,
  expandDelay = 0,
  children,
  ...props
}: CollapsibleSidebarMenuButtonProps) {
  const { state, setOpen } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (isCollapsed) {
      e.preventDefault()
      e.stopPropagation()
      setOpen(true)
      
      if (onExpandedClick && expandDelay > 0) {
        setTimeout(onExpandedClick, expandDelay)
      } else if (onExpandedClick) {
        onExpandedClick()
      }
    } else {
      onClick?.(e)
    }
  }, [isCollapsed, setOpen, onClick, onExpandedClick, expandDelay])

  return (
    <SidebarMenuButton
      {...props}
      onClick={handleClick}
    >
      {children}
    </SidebarMenuButton>
  )
}
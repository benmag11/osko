'use client'

import * as React from 'react'
import { SidebarMenuButton, useSidebar } from '@/components/ui/sidebar'
import type { ComponentProps } from 'react'

interface CollapsibleSidebarMenuButtonProps extends ComponentProps<typeof SidebarMenuButton> {
  onExpandedClick?: () => void
}

export function CollapsibleSidebarMenuButton({
  onClick,
  onExpandedClick,
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
      onExpandedClick?.()
    } else {
      onClick?.(e)
    }
  }, [isCollapsed, setOpen, onClick, onExpandedClick])

  return (
    <SidebarMenuButton
      {...props}
      onClick={handleClick}
    >
      {children}
    </SidebarMenuButton>
  )
}
'use client'

import * as React from 'react'
import { AccordionTrigger } from '@/components/ui/accordion'
import { useSidebar } from '@/components/ui/sidebar'
import type { ComponentProps } from 'react'

interface CollapsibleAccordionTriggerProps extends ComponentProps<typeof AccordionTrigger> {
  value: string
  pendingAccordionRef: React.MutableRefObject<string | null>
}

export function CollapsibleAccordionTrigger({
  value,
  pendingAccordionRef,
  onClick,
  children,
  ...props
}: CollapsibleAccordionTriggerProps) {
  const { state, setOpen } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (isCollapsed) {
      // When sidebar is collapsed, open it and mark this accordion to be opened
      e.preventDefault()
      e.stopPropagation()
      setOpen(true)
      pendingAccordionRef.current = value
    } else {
      // When sidebar is open, normal accordion behavior
      onClick?.(e)
    }
  }, [isCollapsed, setOpen, onClick, value, pendingAccordionRef])

  return (
    <AccordionTrigger
      {...props}
      onClick={handleClick}
    >
      {children}
    </AccordionTrigger>
  )
}
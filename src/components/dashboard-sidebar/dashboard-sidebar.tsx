'use client'

import * as React from 'react'
import {
  TooltipProvider,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useDashboardSidebar } from './sidebar-context'
import { SidebarHeader } from './sidebar-header'
import { SidebarNav } from './sidebar-nav'
import { SidebarUser } from './sidebar-user'
import { MobileDrawer } from './mobile-drawer'

export function DashboardSidebar() {
  const { isMobile, isCollapsed, openMobile, setOpenMobile } = useDashboardSidebar()

  // Mobile: render as Sheet drawer
  if (isMobile === true) {
    return <MobileDrawer open={openMobile} onOpenChange={setOpenMobile} />
  }

  // During SSR/hydration, render nothing to avoid mismatch
  if (isMobile === undefined) {
    return null
  }

  // Desktop: render fixed sidebar
  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden lg:flex flex-col bg-white border-r border-stone-200',
          'transition-[width] duration-200 ease-out',
          isCollapsed ? 'w-12' : 'w-[180px]'
        )}
      >
        <SidebarHeader />
        <SidebarNav />
        <SidebarUser />
      </aside>
    </TooltipProvider>
  )
}

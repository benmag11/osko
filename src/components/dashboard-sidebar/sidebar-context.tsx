'use client'

import * as React from 'react'
import { useIsMobile } from '@/lib/hooks/use-mobile'

const COLLAPSE_COOKIE_NAME = 'dashboard_sidebar_collapsed'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

interface DashboardSidebarContextValue {
  // Collapse state
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void

  // Mobile state
  isMobile: boolean | undefined
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
}

const DashboardSidebarContext = React.createContext<DashboardSidebarContextValue | null>(null)

export function useDashboardSidebar() {
  const context = React.useContext(DashboardSidebarContext)
  if (!context) {
    throw new Error('useDashboardSidebar must be used within DashboardSidebarProvider')
  }
  return context
}

interface DashboardSidebarProviderProps {
  children: React.ReactNode
  defaultCollapsed?: boolean
}

export function DashboardSidebarProvider({
  children,
  defaultCollapsed = false
}: DashboardSidebarProviderProps) {
  const isMobile = useIsMobile()
  const [isCollapsed, setIsCollapsedState] = React.useState(defaultCollapsed)
  const [openMobile, setOpenMobile] = React.useState(false)

  // Read initial state from cookies on mount
  React.useEffect(() => {
    const cookies = document.cookie.split(';')

    // Read collapse cookie
    const collapseCookie = cookies.find(c => c.trim().startsWith(`${COLLAPSE_COOKIE_NAME}=`))
    if (collapseCookie) {
      const value = collapseCookie.split('=')[1]?.trim()
      setIsCollapsedState(value === 'true')
    }
  }, [])

  const setIsCollapsed = React.useCallback((collapsed: boolean) => {
    setIsCollapsedState(collapsed)
    document.cookie = `${COLLAPSE_COOKIE_NAME}=${collapsed}; path=/; max-age=${COOKIE_MAX_AGE}`
  }, [])

  const toggleSidebar = React.useCallback(() => {
    setIsCollapsed(!isCollapsed)
  }, [isCollapsed, setIsCollapsed])

  const value = React.useMemo(() => ({
    isCollapsed,
    setIsCollapsed,
    toggleSidebar,
    isMobile,
    openMobile,
    setOpenMobile,
  }), [isCollapsed, setIsCollapsed, toggleSidebar, isMobile, openMobile])

  return (
    <DashboardSidebarContext.Provider value={value}>
      {children}
    </DashboardSidebarContext.Provider>
  )
}

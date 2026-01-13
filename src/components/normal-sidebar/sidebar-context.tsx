'use client'

import * as React from 'react'
import { useIsMobile } from '@/lib/hooks/use-mobile'

const PANEL_COOKIE_NAME = 'normal_sidebar_panel'
const COLLAPSE_COOKIE_NAME = 'normal_sidebar_collapsed'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export type NormalPanelId = 'search' | 'topics' | 'years' | 'questions' | 'jump' | 'subjects' | 'settings'

interface NormalSidebarContextValue {
  // Active panel state
  activePanel: NormalPanelId
  setActivePanel: (panel: NormalPanelId) => void

  // Collapse state
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void

  // Mobile state
  isMobile: boolean | undefined
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
}

const NormalSidebarContext = React.createContext<NormalSidebarContextValue | null>(null)

export function useNormalSidebar() {
  const context = React.useContext(NormalSidebarContext)
  if (!context) {
    throw new Error('useNormalSidebar must be used within NormalSidebarProvider')
  }
  return context
}

interface NormalSidebarProviderProps {
  children: React.ReactNode
  defaultPanel?: NormalPanelId
  defaultCollapsed?: boolean
}

export function NormalSidebarProvider({
  children,
  defaultPanel = 'topics',
  defaultCollapsed = false
}: NormalSidebarProviderProps) {
  const isMobile = useIsMobile()
  const [activePanel, setActivePanelState] = React.useState<NormalPanelId>(defaultPanel)
  const [isCollapsed, setIsCollapsedState] = React.useState(defaultCollapsed)
  const [openMobile, setOpenMobile] = React.useState(false)

  // Read initial state from cookies on mount
  React.useEffect(() => {
    const cookies = document.cookie.split(';')

    // Read panel cookie
    const panelCookie = cookies.find(c => c.trim().startsWith(`${PANEL_COOKIE_NAME}=`))
    if (panelCookie) {
      const value = panelCookie.split('=')[1]?.trim()
      if (value && ['search', 'topics', 'years', 'questions', 'jump', 'subjects', 'settings'].includes(value)) {
        setActivePanelState(value as NormalPanelId)
      }
    }

    // Read collapse cookie
    const collapseCookie = cookies.find(c => c.trim().startsWith(`${COLLAPSE_COOKIE_NAME}=`))
    if (collapseCookie) {
      const value = collapseCookie.split('=')[1]?.trim()
      setIsCollapsedState(value === 'true')
    }
  }, [])

  const setActivePanel = React.useCallback((panel: NormalPanelId) => {
    setActivePanelState(panel)
    document.cookie = `${PANEL_COOKIE_NAME}=${panel}; path=/; max-age=${COOKIE_MAX_AGE}`
  }, [])

  const setIsCollapsed = React.useCallback((collapsed: boolean) => {
    setIsCollapsedState(collapsed)
    document.cookie = `${COLLAPSE_COOKIE_NAME}=${collapsed}; path=/; max-age=${COOKIE_MAX_AGE}`
  }, [])

  const toggleSidebar = React.useCallback(() => {
    if (isCollapsed) {
      // Expanding - reset to topics (default panel)
      setIsCollapsedState(false)
      setActivePanelState('topics')
      document.cookie = `${COLLAPSE_COOKIE_NAME}=false; path=/; max-age=${COOKIE_MAX_AGE}`
      document.cookie = `${PANEL_COOKIE_NAME}=topics; path=/; max-age=${COOKIE_MAX_AGE}`
    } else {
      // Collapsing
      setIsCollapsed(true)
    }
  }, [isCollapsed, setIsCollapsed])

  const value = React.useMemo(() => ({
    activePanel,
    setActivePanel,
    isCollapsed,
    setIsCollapsed,
    toggleSidebar,
    isMobile,
    openMobile,
    setOpenMobile,
  }), [activePanel, setActivePanel, isCollapsed, setIsCollapsed, toggleSidebar, isMobile, openMobile])

  return (
    <NormalSidebarContext.Provider value={value}>
      {children}
    </NormalSidebarContext.Provider>
  )
}

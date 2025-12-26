'use client'

import * as React from 'react'
import { useIsMobile } from '@/lib/hooks/use-mobile'

const PANEL_COOKIE_NAME = 'vscode_sidebar_panel'
const COLLAPSE_COOKIE_NAME = 'vscode_sidebar_collapsed'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export type PanelId = 'search' | 'topics' | 'years' | 'questions' | 'subjects'

interface VSCodeSidebarContextValue {
  // Active panel state
  activePanel: PanelId
  setActivePanel: (panel: PanelId) => void

  // Collapse state
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void

  // Mobile state
  isMobile: boolean | undefined
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
}

const VSCodeSidebarContext = React.createContext<VSCodeSidebarContextValue | null>(null)

export function useVSCodeSidebar() {
  const context = React.useContext(VSCodeSidebarContext)
  if (!context) {
    throw new Error('useVSCodeSidebar must be used within VSCodeSidebarProvider')
  }
  return context
}

interface VSCodeSidebarProviderProps {
  children: React.ReactNode
  defaultPanel?: PanelId
  defaultCollapsed?: boolean
}

export function VSCodeSidebarProvider({
  children,
  defaultPanel = 'topics',
  defaultCollapsed = false
}: VSCodeSidebarProviderProps) {
  const isMobile = useIsMobile()
  const [activePanel, setActivePanelState] = React.useState<PanelId>(defaultPanel)
  const [isCollapsed, setIsCollapsedState] = React.useState(defaultCollapsed)
  const [openMobile, setOpenMobile] = React.useState(false)

  // Read initial state from cookies on mount
  React.useEffect(() => {
    const cookies = document.cookie.split(';')

    // Read panel cookie
    const panelCookie = cookies.find(c => c.trim().startsWith(`${PANEL_COOKIE_NAME}=`))
    if (panelCookie) {
      const value = panelCookie.split('=')[1]?.trim()
      if (value && ['search', 'topics', 'years', 'questions', 'subjects'].includes(value)) {
        setActivePanelState(value as PanelId)
      }
    }

    // Read collapse cookie
    const collapseCookie = cookies.find(c => c.trim().startsWith(`${COLLAPSE_COOKIE_NAME}=`))
    if (collapseCookie) {
      const value = collapseCookie.split('=')[1]?.trim()
      setIsCollapsedState(value === 'true')
    }
  }, [])

  const setActivePanel = React.useCallback((panel: PanelId) => {
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
    <VSCodeSidebarContext.Provider value={value}>
      {children}
    </VSCodeSidebarContext.Provider>
  )
}

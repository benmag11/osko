'use client'

import * as React from 'react'
import { useIsMobile } from '@/lib/hooks/use-mobile'

const PANEL_COOKIE_NAME = 'vscode_sidebar_panel'
const PANEL_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export type PanelId = 'search' | 'topics' | 'years' | 'questions'

interface VSCodeSidebarContextValue {
  // Active panel state
  activePanel: PanelId
  setActivePanel: (panel: PanelId) => void

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
}

export function VSCodeSidebarProvider({
  children,
  defaultPanel = 'topics'
}: VSCodeSidebarProviderProps) {
  const isMobile = useIsMobile()
  const [activePanel, setActivePanelState] = React.useState<PanelId>(defaultPanel)
  const [openMobile, setOpenMobile] = React.useState(false)

  // Read initial panel from cookie on mount
  React.useEffect(() => {
    const cookies = document.cookie.split(';')
    const panelCookie = cookies.find(c => c.trim().startsWith(`${PANEL_COOKIE_NAME}=`))
    if (panelCookie) {
      const value = panelCookie.split('=')[1]?.trim()
      if (value && ['search', 'topics', 'years', 'questions'].includes(value)) {
        setActivePanelState(value as PanelId)
      }
    }
  }, [])

  const setActivePanel = React.useCallback((panel: PanelId) => {
    setActivePanelState(panel)
    // Persist to cookie
    document.cookie = `${PANEL_COOKIE_NAME}=${panel}; path=/; max-age=${PANEL_COOKIE_MAX_AGE}`
  }, [])

  const value = React.useMemo(() => ({
    activePanel,
    setActivePanel,
    isMobile,
    openMobile,
    setOpenMobile,
  }), [activePanel, setActivePanel, isMobile, openMobile])

  return (
    <VSCodeSidebarContext.Provider value={value}>
      {children}
    </VSCodeSidebarContext.Provider>
  )
}

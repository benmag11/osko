'use client'

import * as React from 'react'
import { useIsMobile } from '@/lib/hooks/use-mobile'

const PANEL_COOKIE_NAME = 'audio_sidebar_panel'
const COLLAPSE_COOKIE_NAME = 'audio_sidebar_collapsed'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

// Audio sidebar excludes 'questions' panel (no question number filter)
export type AudioPanelId = 'search' | 'topics' | 'years' | 'jump' | 'subjects' | 'settings'

interface AudioSidebarContextValue {
  // Active panel state
  activePanel: AudioPanelId
  setActivePanel: (panel: AudioPanelId) => void

  // Collapse state
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void

  // Mobile state
  isMobile: boolean | undefined
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
}

const AudioSidebarContext = React.createContext<AudioSidebarContextValue | null>(null)

export function useAudioSidebar() {
  const context = React.useContext(AudioSidebarContext)
  if (!context) {
    throw new Error('useAudioSidebar must be used within AudioSidebarProvider')
  }
  return context
}

interface AudioSidebarProviderProps {
  children: React.ReactNode
  defaultPanel?: AudioPanelId
  defaultCollapsed?: boolean
}

export function AudioSidebarProvider({
  children,
  defaultPanel = 'topics',
  defaultCollapsed = false
}: AudioSidebarProviderProps) {
  const isMobile = useIsMobile()
  const [activePanel, setActivePanelState] = React.useState<AudioPanelId>(defaultPanel)
  const [isCollapsed, setIsCollapsedState] = React.useState(defaultCollapsed)
  const [openMobile, setOpenMobile] = React.useState(false)

  // Valid audio panel IDs (excludes 'questions')
  const validPanels: AudioPanelId[] = ['search', 'topics', 'years', 'jump', 'subjects', 'settings']

  // Read initial state from cookies on mount
  React.useEffect(() => {
    const cookies = document.cookie.split(';')

    // Read panel cookie
    const panelCookie = cookies.find(c => c.trim().startsWith(`${PANEL_COOKIE_NAME}=`))
    if (panelCookie) {
      const value = panelCookie.split('=')[1]?.trim()
      if (value && validPanels.includes(value as AudioPanelId)) {
        setActivePanelState(value as AudioPanelId)
      }
    }

    // Read collapse cookie
    const collapseCookie = cookies.find(c => c.trim().startsWith(`${COLLAPSE_COOKIE_NAME}=`))
    if (collapseCookie) {
      const value = collapseCookie.split('=')[1]?.trim()
      setIsCollapsedState(value === 'true')
    }
  }, [])

  const setActivePanel = React.useCallback((panel: AudioPanelId) => {
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
    <AudioSidebarContext.Provider value={value}>
      {children}
    </AudioSidebarContext.Provider>
  )
}

'use client'

import * as React from 'react'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import type { SidebarConfig, SidebarContextValue } from './types'

const DEFAULT_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

/**
 * Factory function to create a typed sidebar context
 *
 * This pattern allows us to create multiple sidebar variants (normal, audio)
 * that share the same logic but have different panel types and configurations.
 *
 * @example
 * ```tsx
 * const { SidebarProvider, useSidebar } = createSidebarContext(normalSidebarConfig)
 * export { SidebarProvider as NormalSidebarProvider, useSidebar as useNormalSidebar }
 * ```
 */
export function createSidebarContext<TPanelId extends string>(
  config: SidebarConfig<TPanelId>
) {
  const Context = React.createContext<SidebarContextValue<TPanelId> | null>(null)

  function useSidebar(): SidebarContextValue<TPanelId> {
    const context = React.useContext(Context)
    if (!context) {
      throw new Error('useSidebar must be used within SidebarProvider')
    }
    return context
  }

  interface ProviderProps {
    children: React.ReactNode
    defaultPanel?: TPanelId
    defaultCollapsed?: boolean
  }

  function SidebarProvider({
    children,
    defaultPanel = config.defaultPanel,
    defaultCollapsed = false,
  }: ProviderProps) {
    const isMobile = useIsMobile()
    const [activePanel, setActivePanelState] = React.useState<TPanelId>(defaultPanel)
    const [isCollapsed, setIsCollapsedState] = React.useState(defaultCollapsed)
    const [openMobile, setOpenMobile] = React.useState(false)

    const maxAge = config.cookies.maxAge ?? DEFAULT_COOKIE_MAX_AGE

    // Read initial state from cookies on mount
    React.useEffect(() => {
      const cookies = document.cookie.split(';')

      // Read panel cookie
      const panelCookie = cookies.find((c) =>
        c.trim().startsWith(`${config.cookies.panel}=`)
      )
      if (panelCookie) {
        const value = panelCookie.split('=')[1]?.trim()
        if (value && config.validPanels.includes(value as TPanelId)) {
          setActivePanelState(value as TPanelId)
        }
      }

      // Read collapse cookie
      const collapseCookie = cookies.find((c) =>
        c.trim().startsWith(`${config.cookies.collapsed}=`)
      )
      if (collapseCookie) {
        const value = collapseCookie.split('=')[1]?.trim()
        setIsCollapsedState(value === 'true')
      }
    }, [])

    const setActivePanel = React.useCallback(
      (panel: TPanelId) => {
        setActivePanelState(panel)
        document.cookie = `${config.cookies.panel}=${panel}; path=/; max-age=${maxAge}`
      },
      [maxAge]
    )

    const setIsCollapsed = React.useCallback(
      (collapsed: boolean) => {
        setIsCollapsedState(collapsed)
        document.cookie = `${config.cookies.collapsed}=${collapsed}; path=/; max-age=${maxAge}`
      },
      [maxAge]
    )

    const toggleSidebar = React.useCallback(() => {
      if (isCollapsed) {
        // Expanding - reset to default panel
        setIsCollapsedState(false)
        setActivePanelState(config.defaultPanel)
        document.cookie = `${config.cookies.collapsed}=false; path=/; max-age=${maxAge}`
        document.cookie = `${config.cookies.panel}=${config.defaultPanel}; path=/; max-age=${maxAge}`
      } else {
        // Collapsing
        setIsCollapsed(true)
      }
    }, [isCollapsed, setIsCollapsed, maxAge])

    const value = React.useMemo(
      () => ({
        activePanel,
        setActivePanel,
        isCollapsed,
        setIsCollapsed,
        toggleSidebar,
        isMobile,
        openMobile,
        setOpenMobile,
      }),
      [
        activePanel,
        setActivePanel,
        isCollapsed,
        setIsCollapsed,
        toggleSidebar,
        isMobile,
        openMobile,
      ]
    )

    return <Context.Provider value={value}>{children}</Context.Provider>
  }

  return { Context, SidebarProvider, useSidebar }
}

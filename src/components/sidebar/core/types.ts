import type { LucideIcon } from 'lucide-react'

/**
 * Base panel IDs shared by all sidebar variants
 * Variants can extend this with additional panels
 */
export type BasePanelId = 'search' | 'topics' | 'years' | 'jump' | 'subjects' | 'settings'

/**
 * Configuration object for a sidebar variant
 * Uses generics to ensure type safety for panel IDs
 */
export interface SidebarConfig<TPanelId extends string> {
  /** Cookie configuration for persisting state */
  cookies: {
    /** Cookie name for storing active panel */
    panel: string
    /** Cookie name for storing collapsed state */
    collapsed: string
    /** Cookie max age in seconds (default: 7 days) */
    maxAge?: number
  }

  /** Link to the dashboard page */
  dashboardLink: string
  /** Label for the back button tooltip */
  dashboardLabel: string

  /** Activity bar filter button configuration */
  filterButtons: Array<{
    id: TPanelId
    icon: LucideIcon
    tooltip: string
  }>

  /** Icon for the subject/switch button in activity bar */
  subjectIcon: LucideIcon

  /** Valid panel IDs for cookie validation */
  validPanels: readonly TPanelId[]

  /** Default panel to show when expanding sidebar */
  defaultPanel: TPanelId

  /** Human-readable titles for each panel */
  panelTitles: Record<TPanelId, string>
}

/**
 * Context value provided by the sidebar context
 * Generic over panel ID type for type-safe panel switching
 */
export interface SidebarContextValue<TPanelId extends string> {
  /** Currently active panel */
  activePanel: TPanelId
  /** Set the active panel */
  setActivePanel: (panel: TPanelId) => void

  /** Whether the sidebar is collapsed to icon-only mode */
  isCollapsed: boolean
  /** Set the collapsed state */
  setIsCollapsed: (collapsed: boolean) => void
  /** Toggle sidebar between collapsed and expanded */
  toggleSidebar: () => void

  /** Whether we're on mobile (undefined during SSR) */
  isMobile: boolean | undefined
  /** Whether the mobile drawer is open */
  openMobile: boolean
  /** Set the mobile drawer open state */
  setOpenMobile: (open: boolean) => void
}

/**
 * Navigation state used by jump panel status indicator
 * Generic interface that works with both question and audio navigation
 */
export interface NavigationState {
  totalCount: number
  isLoading: boolean
  isFetching: boolean
  isNavigating: boolean
  isReturning: boolean
  navigationTarget: { id: string; title: string } | null
  items: unknown[]
}

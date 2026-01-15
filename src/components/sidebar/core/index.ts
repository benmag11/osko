// Core sidebar infrastructure
// These components are shared between all sidebar variants

export { createSidebarContext } from './sidebar-context'
export { SidebarHeader } from './sidebar-header'
export { ActivityBar } from './activity-bar'
export { SidePanel } from './side-panel'
export { SidebarAwareMain } from './sidebar-aware-main'
export { UserMenu } from './user-menu'
export { JumpPanelStatus } from './jump-panel-status'
export { MobileDrawer } from './mobile-drawer'

export type {
  BasePanelId,
  SidebarConfig,
  SidebarContextValue,
  NavigationState,
} from './types'

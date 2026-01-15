// Main sidebar exports

// Normal sidebar
export {
  NormalSidebar,
  NormalSidebarProvider,
  useNormalSidebar,
  NormalSidebarAwareMain,
} from './normal'
export type { NormalPanelId } from './normal'

// Audio sidebar
export {
  AudioSidebar,
  AudioSidebarProvider,
  useAudioSidebar,
  AudioSidebarAwareMain,
} from './audio'
export type { AudioPanelId } from './audio'

// Core types (for extending/custom sidebars)
export type { SidebarConfig, SidebarContextValue, NavigationState, BasePanelId } from './core/types'

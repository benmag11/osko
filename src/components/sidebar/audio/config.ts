import { Search, ListFilter, CalendarSearch, BookOpen } from 'lucide-react'
import type { SidebarConfig } from '../core/types'

/**
 * Panel IDs for the audio (listening) sidebar
 * Excludes 'questions' panel - audio questions don't filter by question number
 */
export type AudioPanelId =
  | 'search'
  | 'topics'
  | 'years'
  | 'jump'
  | 'subjects'
  | 'settings'

/**
 * Configuration for the audio sidebar variant
 * Used for viewing listening/audio questions at /audio/[slug]
 */
export const audioSidebarConfig: SidebarConfig<AudioPanelId> = {
  cookies: {
    panel: 'audio_sidebar_panel',
    collapsed: 'audio_sidebar_collapsed',
  },

  dashboardLink: '/dashboard/listening',
  dashboardLabel: 'Back to Dashboard',

  filterButtons: [
    { id: 'topics', icon: ListFilter, tooltip: 'Study by topic' },
    { id: 'search', icon: Search, tooltip: 'Search by keyword' },
    { id: 'years', icon: CalendarSearch, tooltip: 'Study by year' },
  ],

  subjectIcon: BookOpen,

  validPanels: ['search', 'topics', 'years', 'jump', 'subjects', 'settings'] as const,

  defaultPanel: 'topics',

  panelTitles: {
    search: 'Search by Keyword',
    topics: 'Study by Topic',
    years: 'Study by Year',
    jump: 'Jump to Question',
    subjects: 'Change Subject',
    settings: 'Settings',
  },
}

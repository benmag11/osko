import { Search, ListFilter, CalendarSearch, ArrowDown01, BookOpen } from 'lucide-react'
import type { SidebarConfig } from '../core/types'

/**
 * Panel IDs for the normal (exam questions) sidebar
 * Includes 'questions' panel for filtering by question number
 */
export type NormalPanelId =
  | 'search'
  | 'topics'
  | 'years'
  | 'questions'
  | 'jump'
  | 'subjects'
  | 'settings'

/**
 * Configuration for the normal sidebar variant
 * Used for viewing standard exam questions at /subject/[slug]
 */
export const normalSidebarConfig: SidebarConfig<NormalPanelId> = {
  cookies: {
    panel: 'normal_sidebar_panel',
    collapsed: 'normal_sidebar_collapsed',
  },

  dashboardLink: '/dashboard/study',
  dashboardLabel: 'Back to Dashboard',

  filterButtons: [
    { id: 'topics', icon: ListFilter, tooltip: 'Study by topic' },
    { id: 'search', icon: Search, tooltip: 'Search by keyword' },
    { id: 'questions', icon: ArrowDown01, tooltip: 'Study by question' },
    { id: 'years', icon: CalendarSearch, tooltip: 'Study by year' },
  ],

  subjectIcon: BookOpen,

  validPanels: ['search', 'topics', 'years', 'questions', 'jump', 'subjects', 'settings'] as const,

  defaultPanel: 'topics',

  panelTitles: {
    search: 'Search by Keyword',
    topics: 'Study by Topic',
    years: 'Study by Year',
    questions: 'Study by Question',
    jump: 'Jump to Question',
    subjects: 'Change Subject',
    settings: 'Settings',
  },
}

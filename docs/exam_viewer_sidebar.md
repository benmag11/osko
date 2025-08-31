# Exam-viewer Sidebar Documentation

## Overview
The Exam-viewer Sidebar is a sophisticated filtering and navigation system that provides users with contextual controls for browsing exam papers. It features subject switching, multi-faceted filtering (topics, years, question numbers, keywords), responsive behavior with mobile/desktop adaptations, and seamless integration with URL-based state management for shareable filtered views.

## Architecture
The sidebar follows a component-based architecture built on shadcn/ui's sidebar primitives, implementing a provider pattern for state management, URL-based filter persistence, and responsive design patterns. The architecture prioritizes user experience through smooth transitions, keyboard shortcuts (Cmd/Ctrl+B), and intelligent mobile adaptations using sheet-based overlays.

## File Structure
### Core Components
- `/src/components/layout/exam-sidebar.tsx` - Main sidebar container component
- `/src/components/ui/sidebar.tsx` - Base sidebar UI primitives and context provider
- `/src/components/layout/nav-filters.tsx` - Filter accordion container
- `/src/components/layout/subject-switcher.tsx` - Subject selection dropdown
- `/src/components/layout/nav-user.tsx` - User profile and logout menu
- `/src/components/layout/floating-sidebar-trigger.tsx` - Desktop floating toggle button
- `/src/components/layout/mobile-navbar.tsx` - Mobile header with menu trigger

### Filter Components
- `/src/components/filters/search-filter.tsx` - Keyword search input
- `/src/components/filters/topic-filter-accordion.tsx` - Topic checkbox filters
- `/src/components/filters/year-filter-accordion.tsx` - Year selection filters
- `/src/components/filters/question-filter-accordion.tsx` - Question number filters
- `/src/components/filters/applied-filters-display.tsx` - Active filter tags display
- `/src/components/ui/collapsible-sidebar-menu-button.tsx` - Collapsible menu button helper

### Supporting Files
- `/src/lib/hooks/use-filter-updates.ts` - Filter state management hook
- `/src/lib/hooks/use-mobile.ts` - Responsive breakpoint detection
- `/src/lib/utils/url-filters.ts` - URL parameter serialization/parsing
- `/src/app/subject/[slug]/page.tsx` - Subject page integration

## Core Components

### ExamSidebar Component
The main sidebar container that orchestrates all sidebar functionality:

```tsx
export function ExamSidebar({ 
  subject,
  topics, 
  years, 
  questionNumbers,
  filters,
  ...props 
}: ExamSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SubjectSwitcher subject={subject} />
      </SidebarHeader>
      <SidebarContent>
        <NavFilters topics={topics} years={years} questionNumbers={questionNumbers} filters={filters} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
```

The component accepts:
- `subject`: Current subject data with name, level, and ID
- `topics`: Available topics for filtering
- `years`: Available exam years
- `questionNumbers`: Available question numbers
- `filters`: Current active filter state

### SidebarProvider Context
Manages sidebar state across desktop and mobile environments:

```tsx
const SidebarContext = React.createContext<{
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean | undefined
  toggleSidebar: () => void
}>
```

Key features:
- Cookie persistence for sidebar state (`sidebar_state`, 7-day expiry)
- Keyboard shortcut support (Cmd/Ctrl+B)
- Separate mobile/desktop state management
- CSS variable configuration for widths

## Data Flow

### Filter State Management
1. **URL as Single Source of Truth**: All filter state is stored in URL parameters
2. **Parameter Mapping**:
   ```typescript
   const FILTER_PARAM_MAP = {
     searchTerms: 'q',
     topicIds: 'topics',
     years: 'years',
     examTypes: 'types',
     questionNumbers: 'questions',
   }
   ```

3. **State Updates via useFilterUpdates Hook**:
   ```typescript
   const updateUrl = (updates: Partial<Filters>) => {
     const newParams = updateSearchParams(searchParams, updates)
     startTransition(() => {
       router.push(query ? `${pathname}?${query}` : pathname)
     })
   }
   ```

### Data Loading Pipeline
The subject page loads all required data in parallel:

```typescript
const [topicsResult, yearsResult, questionNumbersResult, questionsResult] = 
  await Promise.allSettled([
    getTopics(subject.id),
    getAvailableYears(subject.id),
    getAvailableQuestionNumbers(subject.id),
    searchQuestions(filters)
  ])
```

## Key Functions and Hooks

### useFilterUpdates Hook
Central hook for all filter operations:

```typescript
export function useFilterUpdates(filters: Filters) {
  // Methods for filter manipulation
  const addSearchTerm = (term: string) => { /* ... */ }
  const removeSearchTerm = (term: string) => { /* ... */ }
  const toggleTopic = (topicId: string) => { /* ... */ }
  const toggleYear = (year: number) => { /* ... */ }
  const toggleQuestionNumber = (questionNumber: number) => { /* ... */ }
  const clearAllFilters = () => { router.push(pathname) }
  
  return { /* all methods */ }
}
```

### useIsMobile Hook
Responsive breakpoint detection with hydration safety:

```typescript
const MOBILE_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
  
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    setIsMobile(mql.matches)
    
    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener("change", handleChange)
    
    return () => mql.removeEventListener("change", handleChange)
  }, [])
  
  return isMobile // undefined during SSR, boolean after hydration
}
```

### Collapsible Behavior Handler
Smart expansion for collapsed sidebar interactions:

```typescript
const handleClick = (e: React.MouseEvent) => {
  if (isCollapsed) {
    e.preventDefault()
    e.stopPropagation()
    setOpen(true)
    onExpandedClick?.() // Optional callback for focus management
  } else {
    onClick?.(e)
  }
}
```

## Integration Points

### Subject Page Integration
The sidebar is integrated at the page level with SidebarProvider:

```tsx
<SidebarProvider defaultOpen>
  <MobileNavbar />
  <ExamSidebar /* props */ />
  <FloatingSidebarTrigger />
  <SidebarInset>
    <main className="min-h-screen bg-cream-50 pt-14 lg:pt-0">
      <AppliedFiltersDisplay />
      <QuestionList />
    </main>
  </SidebarInset>
</SidebarProvider>
```

### Database Integration
Backend functions supporting sidebar functionality:

1. **get_available_years**: Returns distinct years for a subject
2. **get_available_question_numbers**: Returns distinct question numbers
3. **search_questions_paginated**: Main filtering function with:
   - Full-text search using PostgreSQL tsquery
   - Multi-criteria filtering (topics, years, exam types, question numbers)
   - Cursor-based pagination for performance
   - Sort key generation for stable ordering

## Configuration

### CSS Variables
Sidebar appearance controlled via CSS custom properties:

```css
/* Light mode */
--sidebar: 0 0% 100%; /* Pure white background */
--sidebar-foreground: 19 20% 21%; /* Dark text */
--sidebar-accent: 0 0% 97%; /* Light grey hover */
--sidebar-border: 20 6% 90%; /* Border color */

/* Dark mode */
--sidebar: 20 10% 12%; /* Dark background */
--sidebar-foreground: 40 23% 95%; /* Light text */
```

### Width Constants
```typescript
const SIDEBAR_WIDTH = "25rem"          // Desktop expanded width
const SIDEBAR_WIDTH_MOBILE = "18rem"   // Mobile sheet width
const SIDEBAR_WIDTH_ICON = "3rem"      // Collapsed icon-only width
```

## Type Definitions

### Core Filter Types
```typescript
export interface Filters {
  subjectId: string
  searchTerms?: string[]
  years?: number[]
  topicIds?: string[]
  examTypes?: string[]
  questionNumbers?: number[]
}

export interface ExamSidebarProps {
  subject: Subject
  topics: Topic[]
  years: number[]
  questionNumbers: number[]
  filters: Filters
}
```

## Implementation Details

### Mobile Behavior
On mobile devices (< 1024px), the sidebar:
1. Renders as a Sheet component (slide-over panel)
2. Triggered by hamburger menu in MobileNavbar
3. Uses portal rendering for overlay behavior
4. Maintains separate open/closed state from desktop

### Desktop Behavior
On desktop (≥ 1024px), the sidebar:
1. Can be collapsed to icon-only mode (3rem width)
2. Expands on hover when collapsed (for tooltips)
3. Persists state in cookie for user preference
4. Features a floating trigger button that moves with sidebar state

### Filter Accordion Interactions
Each filter accordion implements smart expansion:

```typescript
const handleAccordionClick = (e: React.MouseEvent) => {
  if (isCollapsed) {
    e.preventDefault()
    e.stopPropagation()
    setOpen(true)
    // Re-trigger accordion after expansion
    setTimeout(() => {
      const trigger = e.currentTarget as HTMLElement
      trigger?.click()
    }, 0)
  }
}
```

### Search Implementation
Keyword search with optimistic UI updates:
1. User types in search input
2. Pressing Enter or clicking + adds the term
3. Term immediately appears in URL and applied filters
4. Database query uses PostgreSQL full-text search
5. Multiple terms are combined with OR logic

### Performance Optimizations
1. **Parallel Data Loading**: All sidebar data loads concurrently
2. **URL-based Caching**: Browser handles back/forward with filter state
3. **React Transitions**: Filter updates use startTransition for non-blocking UI
4. **Memoized Context**: Sidebar context value is memoized to prevent re-renders

## Dependencies

### External Dependencies
- `@radix-ui/react-slot`: Polymorphic component composition
- `@radix-ui/accordion`: Accordion primitives
- `@radix-ui/dropdown-menu`: Dropdown menu primitives
- `@radix-ui/checkbox`: Checkbox component
- `lucide-react`: Icon library
- `class-variance-authority`: Variant styling utilities
- `@tanstack/react-query`: Server state management

### Internal Dependencies
- Supabase client for data fetching
- Next.js App Router for navigation
- Tailwind CSS for styling
- Custom hooks for user data and preferences

## API Reference

### Database Functions

#### get_available_years(p_subject_id: uuid)
Returns an array of distinct years for a subject, sorted descending.

#### get_available_question_numbers(p_subject_id: uuid)
Returns an array of distinct question numbers for a subject, sorted ascending.

#### search_questions_paginated
Main filtering function with parameters:
- `p_subject_id`: Subject UUID (required)
- `p_search_terms`: Array of search keywords
- `p_years`: Array of years to filter
- `p_topic_ids`: Array of topic UUIDs
- `p_exam_types`: Array of exam types
- `p_cursor`: Pagination cursor
- `p_limit`: Results per page (default: 20)

Returns JSON with questions array and next_cursor for pagination.

## Other Notes

### Accessibility Features
- ARIA labels on all interactive elements
- Keyboard navigation support throughout
- Screen reader announcements for state changes
- Focus management on accordion expansion
- Semantic HTML structure

### State Persistence Strategy
The sidebar uses a multi-layered persistence approach:
1. **URL Parameters**: Filter state for shareability
2. **Cookies**: Sidebar expanded/collapsed preference
3. **React State**: Temporary UI state (mobile open/closed)
4. **Database**: User preferences via user_profiles table

### Edge Cases Handled
- Hydration mismatch prevention with undefined initial state
- Graceful degradation when data fetching fails
- Empty state messaging when no filters applied
- Proper cleanup of event listeners
- Cookie expiry and fallback to defaults

### Mobile-First Responsive Design
The sidebar adapts its behavior based on viewport:
- **Mobile**: Full-height sheet overlay with portal rendering
- **Tablet**: Same as mobile with wider sheet
- **Desktop**: Fixed position with collapse/expand modes
- **Large Desktop**: Additional spacing and rail interactions

The implementation ensures smooth transitions between breakpoints and maintains user context across device changes.
# Question System Documentation

## Overview
The Question System is the core feature of the application that enables users to browse, search, and filter exam questions from past papers. It provides a comprehensive filtering interface, infinite scroll pagination, and reporting capabilities for quality control. The system is built with a focus on performance, handling large question datasets efficiently through cursor-based pagination and optimized database queries.

## Architecture
The Question System follows a client-server architecture with React Query for state management and Supabase for backend operations. The system uses URL-based state persistence for filters, enabling shareable filtered views and browser history navigation. Components are organized in a modular structure with clear separation between presentation (components), business logic (hooks), and data access (queries).

The architecture prioritizes:
- **Performance**: Cursor-based pagination with database-level optimization
- **User Experience**: Real-time search with debouncing, infinite scroll
- **Data Integrity**: Type-safe queries with TypeScript, error boundaries
- **Scalability**: Efficient indexing strategies, query optimization

## File Structure
```
src/
  components/
    questions/
      question-card.tsx         # Main question display component with marking scheme toggle
      question-list.tsx         # Simple question list with infinite scroll
      filtered-questions-view.tsx # Complete filtered view with applied filters display
      question-report-dialog.tsx  # Modal for reporting question issues
    filters/
      search-filter.tsx         # Keyword search with add functionality
      year-filter-accordion.tsx # Year selection with checkboxes
      topic-filter-accordion.tsx # Topic selection by subject
      question-filter-accordion.tsx # Question number filtering
      applied-filters-display.tsx # Shows active filters with result count
      filter-tag.tsx            # Individual filter tag component
      clear-filters-button.tsx  # Clear all filters action
  lib/
    hooks/
      use-questions-query.ts    # Main hook for fetching questions with infinite scroll
      use-filter-updates.ts     # Hook for managing filter state and URL updates
    supabase/
      queries.ts                # Server-side query functions
      client-queries.ts         # Client-side query functions for React Query
      query-builders.ts         # Shared query parameter builders
      report-actions.ts         # Question reporting functionality
    utils/
      url-filters.ts            # URL parameter serialization/deserialization
    queries/
      query-keys.ts             # React Query cache key management
    config/
      cache.ts                  # Cache configuration for different data types
    types/
      database.ts               # TypeScript type definitions
```

## Core Components

### QuestionCard Component
The central display component for individual questions, handling image display, marking scheme toggling, and admin/user actions.

```tsx
// src/components/questions/question-card.tsx
export const QuestionCard = memo(function QuestionCard({ question }: QuestionCardProps) {
  const [showMarkingScheme, setShowMarkingScheme] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  
  // Build dynamic title with format: 
  // [year] - Paper [paper_number] - [Deferred] - Question [question_number] - [subparts]
  let title = `${question.year}`
  if (question.paper_number) {
    title += ` - Paper ${question.paper_number}`
  }
  if (question.exam_type === 'deferred') {
    title += ' - Deferred'
  }
  title += ` - Question ${question.question_number}`
  if (formattedParts) {
    title += ` - ${formattedParts}`
  }
```

Key features:
- **Image Validation**: Checks for valid image URLs before rendering
- **Marking Scheme Toggle**: Collapsible marking scheme section
- **Admin Controls**: Edit metadata button for administrators
- **Report Functionality**: Flag button for users to report issues
- **Memoization**: Performance optimization using React.memo

### FilteredQuestionsView Component
Orchestrates the complete filtered question display experience, combining applied filters display with the question list.

```tsx
// src/components/questions/filtered-questions-view.tsx
export function FilteredQuestionsView({ topics, filters, initialData }: FilteredQuestionsViewProps) {
  const { 
    questions, 
    totalCount,
    isFetchingNextPage, 
    loadMoreRef,
    isLoading,
    error
  } = useQuestionsQuery({
    filters,
    initialData,
  })
  
  return (
    <>
      <AppliedFiltersDisplay 
        topics={topics} 
        filters={filters} 
        totalCount={totalCount}
        isLoading={isLoading}
      />
      {/* Question list with infinite scroll */}
    </>
  )
}
```

### QuestionReportDialog Component
Modal dialog for users to report issues with questions, supporting multiple report types with validation.

```tsx
// src/components/questions/question-report-dialog.tsx
const reportTypeOptions = [
  {
    value: 'metadata' as const,
    label: 'Question information (Year, question number, subparts)',
  },
  {
    value: 'incorrect_topic' as const,
    label: 'Incorrect topic',
  },
  {
    value: 'other' as const,
    label: 'Other',
  }
]
```

## Data Flow
The question data flows through multiple layers with clear boundaries:

1. **URL Parameters** → Parsed into Filters object
2. **Filters** → Passed to useQuestionsQuery hook
3. **React Query** → Fetches data using client-queries
4. **Supabase RPC** → Executes search_questions_paginated function
5. **Database** → Returns paginated results with cursor
6. **Components** → Render questions with infinite scroll

```
URL (?years=2024,2023&topics=algebra)
  ↓
parseSearchParams() → Filters object
  ↓
useQuestionsQuery(filters)
  ↓
searchQuestionsClient() → Supabase RPC
  ↓
search_questions_paginated() → Database query
  ↓
PaginatedResponse with cursor
  ↓
QuestionCard components render
```

## Key Functions and Hooks

### useQuestionsQuery Hook
The primary hook for fetching questions with infinite scroll support, cursor-based pagination, and caching.

```tsx
// src/lib/hooks/use-questions-query.ts
export function useQuestionsQuery({ filters, initialData, enabled = true }: UseQuestionsQueryOptions) {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px', // Pre-fetch when 100px from bottom
  })

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.infinite(filters),
    queryFn: async ({ pageParam, signal }) => {
      return searchQuestionsClient(filters, pageParam, signal)
    },
    initialPageParam: null as QuestionCursor | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    initialData: initialData ? {
      pages: [initialData],
      pageParams: [null],
    } : undefined,
    placeholderData: (previousData) => previousData, // Smooth transitions
  })
  
  // Automatically fetch next page when scrolling
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])
}
```

### useFilterUpdates Hook
Manages filter state updates and URL synchronization, ensuring browser history works correctly.

```tsx
// src/lib/hooks/use-filter-updates.ts
export function useFilterUpdates(filters: Filters) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const updateUrl = useCallback((updates: Partial<Filters>) => {
    const newParams = updateSearchParams(searchParams, updates)
    
    startTransition(() => {
      const query = newParams.toString()
      router.push(query ? `${pathname}?${query}` : pathname)
    })
  }, [pathname, router, searchParams])
  
  const toggleTopic = useCallback((topicId: string) => {
    const current = filters.topicIds || []
    const updated = current.includes(topicId)
      ? current.filter(id => id !== topicId)
      : [...current, topicId]
    updateUrl({ topicIds: updated })
  }, [filters.topicIds, updateUrl])
}
```

## Integration Points

### Database Integration
The system integrates with Supabase through RPC functions and direct table queries:

- **search_questions_paginated**: Main search function with comprehensive filtering
- **get_available_years**: Returns distinct years for a subject
- **get_available_question_numbers**: Returns distinct question numbers
- **question_reports**: Table for user-submitted reports

### React Query Integration
Centralized caching strategy with different TTLs for different data types:

```tsx
// src/lib/config/cache.ts
export const CACHE_TIMES = {
  QUESTIONS: {
    staleTime: 1 * 60 * 1000,    // 1 minute
    gcTime: 10 * 60 * 1000,      // 10 minutes
  },
  TOPICS: {
    staleTime: 10 * 60 * 1000,   // 10 minutes
    gcTime: 30 * 60 * 1000,      // 30 minutes
  },
}
```

### URL State Management
Bidirectional synchronization between URL parameters and filter state:

```tsx
// src/lib/utils/url-filters.ts
const FILTER_PARAM_MAP = {
  searchTerms: 'q',
  topicIds: 'topics',
  years: 'years',
  examTypes: 'types',
  questionNumbers: 'questions',
}

export function parseSearchParams(
  searchParams: URLSearchParams,
  subjectId: string
): Filters {
  return {
    subjectId,
    searchTerms: deserializeFilterValue('searchTerms', getValue('q')),
    topicIds: deserializeFilterValue('topicIds', getValue('topics')),
    years: deserializeFilterValue('years', getValue('years')),
    // ...
  }
}
```

## Configuration

### Environment Variables
No specific environment variables required beyond standard Supabase configuration:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Query Configuration
Infinite scroll configuration with performance optimizations:

```tsx
// Intersection Observer settings
const { ref, inView } = useInView({
  threshold: 0,        // Trigger as soon as element is visible
  rootMargin: '100px', // Pre-fetch 100px before reaching bottom
})

// Pagination settings
const ITEMS_PER_PAGE = 20 // Defined in query-builders.ts
```

### Cache Configuration
Different cache strategies for different query types:

```tsx
// Questions use shorter cache times due to frequent updates
queryClient.setQueryDefaults(
  queryKeys.infinite(filters),
  { 
    staleTime: CACHE_TIMES.QUESTIONS.staleTime,
    gcTime: CACHE_TIMES.QUESTIONS.gcTime 
  }
)
```

## Type Definitions

### Core Types
Essential TypeScript interfaces that define the data structure:

```tsx
// src/lib/types/database.ts
export interface Question {
  id: string
  subject_id: string
  year: number
  paper_number: number | null
  question_number: number
  question_parts: string[]
  exam_type: 'normal' | 'deferred' | 'supplemental'
  question_image_url: string | null
  marking_scheme_image_url: string | null
  full_text: string | null
  topics?: Array<{ id: string; name: string }>
}

export interface Filters {
  subjectId: string
  searchTerms?: string[]
  years?: number[]
  topicIds?: string[]
  examTypes?: string[]
  questionNumbers?: number[]
}

export interface QuestionCursor {
  sort_key: string  // Composite key for stable pagination
  year: number
  paper_number: number | null
  exam_type: 'normal' | 'deferred' | 'supplemental'
  question_number: number
  question_parts: string[]
}

export interface PaginatedResponse {
  questions: Question[]
  next_cursor: QuestionCursor | null
  total_count: number
}
```

## Implementation Details

### Search Functionality with Debouncing
The search filter component implements manual keyword entry rather than real-time typing to prevent excessive queries:

```tsx
// src/components/filters/search-filter.tsx
const handleAddKeyword = () => {
  if (value.trim()) {
    addSearchTerm(value.trim())
    setValue('') // Clear input after adding
  }
}

const handleKeyPress = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter') {
    handleAddKeyword()
  }
}
```

This design choice:
- Reduces database load by avoiding queries on every keystroke
- Allows users to refine search terms before executing
- Provides explicit control over when searches occur

### Cursor-Based Pagination
The system uses a composite sort key for stable, efficient pagination:

```sql
-- From search_questions_paginated function
LPAD((9999 - q.year)::text, 4, '0') || '_' ||
CASE q.exam_type 
  WHEN 'normal' THEN '1'
  WHEN 'deferred' THEN '2'
  WHEN 'supplemental' THEN '3'
END || '_' ||
LPAD(COALESCE(q.paper_number, 999)::text, 3, '0') || '_' ||
LPAD(q.question_number::text, 3, '0') || '_' ||
COALESCE(array_to_string(q.question_parts, ','), '')
```

This sort key ensures:
- Consistent ordering across page loads
- Efficient cursor comparisons
- No duplicate results when paginating

### Filter State Persistence
Filters are persisted in URL parameters enabling:
- Shareable links to filtered views
- Browser back/forward navigation
- Bookmark support for common filter combinations

```tsx
// Example URL with filters
/subject/mathematics-higher?years=2024,2023&topics=algebra,calculus&q=differentiate
```

### Performance Optimizations

#### Database Indexes
Strategic indexes for optimal query performance:

```sql
-- Full-text search index
CREATE INDEX idx_questions_full_text_gin 
ON questions USING gin (to_tsvector('english', full_text))

-- Composite sort index for pagination
CREATE INDEX idx_questions_comprehensive_sort 
ON questions (subject_id, year DESC, exam_type, paper_number, question_number, question_parts)

-- Optimized index for questions without paper numbers
CREATE INDEX idx_questions_no_paper 
ON questions (subject_id, year DESC, exam_type, question_number, question_parts) 
WHERE paper_number IS NULL
```

#### React Optimizations
- **Memoization**: QuestionCard uses React.memo to prevent unnecessary re-renders
- **Virtualization**: Infinite scroll loads questions incrementally
- **Placeholder Data**: Maintains previous data while fetching new results
- **Abort Signals**: Cancels in-flight requests when filters change

## Dependencies

### External Dependencies
- **@tanstack/react-query**: v5 for server state management
- **react-intersection-observer**: For infinite scroll trigger
- **sonner**: Toast notifications for user feedback
- **lucide-react**: Icon library for UI elements

### Internal Dependencies
- **Supabase Client**: Database connection and RPC calls
- **shadcn/ui Components**: UI primitives (Button, Dialog, Checkbox, etc.)
- **Auth Provider**: User authentication context
- **Custom Hooks**: useIsAdmin, useTopics for auxiliary data

## API Reference

### RPC Functions

#### search_questions_paginated
Main search function with comprehensive filtering capabilities:

```typescript
Parameters:
- p_subject_id: string
- p_search_terms: string[] | null
- p_years: number[] | null
- p_topic_ids: string[] | null
- p_exam_types: string[] | null
- p_question_numbers: number[] | null
- p_cursor: QuestionCursor | null
- p_limit: number

Returns: PaginatedResponse
```

#### get_available_years
Returns distinct years for a subject:

```typescript
Parameters:
- p_subject_id: string

Returns: number[]
```

### Client Functions

#### searchQuestionsClient
Client-side wrapper for RPC call with retry logic:

```typescript
async function searchQuestionsClient(
  filters: Filters,
  cursor?: QuestionCursor | null,
  signal?: AbortSignal
): Promise<PaginatedResponse>
```

#### createReport
Submit a report for a question issue:

```typescript
async function createReport(
  payload: CreateReportPayload
): Promise<{ success: boolean; error?: string }>
```

## Zoom Feature

### Overview
The zoom feature provides desktop users with the ability to scale the question viewer interface, improving readability and accessibility for exam content. The feature is desktop-only and provides zoom levels from 50% to 100% with keyboard shortcuts and visual controls.

### Architecture
The zoom system uses a context-based architecture with session storage persistence:
- **ZoomProvider**: React context provider managing zoom state
- **ZoomControls**: UI component for visual zoom controls
- **useSessionStorage**: Custom hook for per-tab state persistence
- **CSS Transform**: Scale-based zooming without reflow

### Implementation Components

#### ZoomProvider
The core context provider that manages zoom state and keyboard interactions:

```tsx
// src/components/providers/zoom-provider.tsx
const ZOOM_LEVELS = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0] as const
type ZoomLevel = typeof ZOOM_LEVELS[number]

export function ZoomProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  const isEnabled = isMobile === false // Only enable on desktop

  // Use sessionStorage hook with validation
  const [zoomLevel, setStoredZoom, isLoading] = useSessionStorage<ZoomLevel>({
    key: 'exam-viewer-zoom',
    defaultValue: 1.0,
    validator: isValidZoomLevel,
  })

  // Keyboard shortcuts (Cmd/Ctrl + +/- and 0)
  useEffect(() => {
    if (!isEnabled || isLoading) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return

      switch (e.key) {
        case '=':
        case '+':
          e.preventDefault()
          increaseZoom()
          break
        case '-':
          e.preventDefault()
          decreaseZoom()
          break
        case '0':
          e.preventDefault()
          resetZoom()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEnabled, isLoading, increaseZoom, decreaseZoom, resetZoom])
}
```

Key features:
- **Desktop-Only**: Disabled on mobile devices (viewport < 1024px)
- **Discrete Levels**: Fixed zoom levels (50%, 60%, 70%, 80%, 90%, 100%)
- **Keyboard Shortcuts**: Cmd/Ctrl + Plus/Minus for zoom, Cmd/Ctrl + 0 for reset
- **Type Safety**: Validates zoom levels with TypeScript type guards

#### ZoomControls Component
Visual controls for zoom with hover-to-show behavior:

```tsx
// src/components/questions/zoom-controls.tsx
export function ZoomControls() {
  const isMobile = useIsMobile()
  const { zoomLevel, increaseZoom, decreaseZoom, isLoading } = useZoom()
  const [isVisible, setIsVisible] = useState(false)

  // Don't render on mobile at all
  if (isMobile === true || isMobile === undefined || isLoading) {
    return null
  }

  return (
    <div
      className="fixed top-16 right-4 z-40"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {/* Hover trigger area */}
      <div className="absolute -left-24 top-0 w-28 h-24" />

      {/* Controls container with fade animation */}
      <div className={cn(
        "flex flex-col items-center gap-2 bg-cream-50 rounded-lg p-2 shadow-lg",
        "transition-opacity duration-200",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        {/* Plus and Minus buttons with tooltips */}
      </div>
    </div>
  )
}
```

Design features:
- **Hover Activation**: Controls appear on hover for minimal UI clutter
- **Vertical Layout**: Stacked buttons for compact footprint
- **Tooltips**: Clear labels for accessibility
- **Disabled States**: Visual feedback when at zoom limits

#### Session Storage Hook
Custom hook for managing per-tab zoom persistence:

```tsx
// src/lib/hooks/use-session-storage.ts
export function useSessionStorage<T>({
  key,
  defaultValue,
  validator,
}: UseSessionStorageOptions<T>): [T, (value: T) => void, boolean] {
  const [storedValue, setStoredValue] = useState<T>(defaultValue)
  const [isLoading, setIsLoading] = useState(true)
  const [isAvailable, setIsAvailable] = useState(false)

  useEffect(() => {
    // SSR safety check
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    // Check storage availability and load value
    try {
      const item = window.sessionStorage.getItem(key)
      if (item !== null) {
        const parsed = JSON.parse(item)

        // Validate with provided validator
        if (!validator || validator(parsed)) {
          setStoredValue(parsed)
        } else {
          // Invalid data, clear it
          window.sessionStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.warn(`SessionStorage not available for key "${key}":`, error)
      setIsAvailable(false)
    } finally {
      setIsLoading(false)
    }
  }, [key, defaultValue, validator])
}
```

Features:
- **SSR Safe**: Handles server-side rendering gracefully
- **Type Validation**: Ensures stored values match expected types
- **Error Recovery**: Falls back to defaults on corruption
- **Loading State**: Provides loading indicator during hydration

### Integration with Question System

#### FilteredQuestionsView Integration
The zoom feature applies transforms to the question container:

```tsx
// src/components/questions/filtered-questions-view.tsx
export function FilteredQuestionsView({ topics, filters, initialData }: FilteredQuestionsViewProps) {
  const { zoomLevel, isEnabled, isLoading: isZoomLoading } = useZoom()

  return (
    <>
      <ZoomControls />
      <div
        className="w-full max-w-4xl mx-auto"
        style={{
          // Only apply transform on desktop and when not loading
          transform: isEnabled && !isZoomLoading ? `scale(${zoomLevel})` : undefined,
          transformOrigin: 'top center',
        }}
      >
        {/* Question list content */}
      </div>
    </>
  )
}
```

#### Subject Page Provider Wrapping
The ZoomProvider wraps the entire subject page for context availability:

```tsx
// src/app/subject/[slug]/page.tsx
export default async function SubjectPage({ params, searchParams }: PageProps) {
  // ... data fetching

  return (
    <ZoomProvider>
      <SidebarProvider defaultOpen>
        {/* Page content with FilteredQuestionsView */}
      </SidebarProvider>
    </ZoomProvider>
  )
}
```

### Storage Utilities
Helper functions for safe storage operations:

```tsx
// src/lib/utils/storage.ts
export function isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
  if (typeof window === 'undefined') return false

  try {
    const storage = window[type]
    const testKey = '__storage_test__'
    storage.setItem(testKey, 'test')
    storage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

export function safeJsonParse<T>(
  value: string,
  fallback: T,
  validator?: (value: unknown) => value is T
): T {
  try {
    const parsed = JSON.parse(value)
    return validator && !validator(parsed) ? fallback : parsed
  } catch {
    return fallback
  }
}
```

### Technical Implementation Details

#### Zoom Mechanism
The zoom feature uses CSS `transform: scale()` for performance:
- **No Reflow**: Transform doesn't trigger layout recalculation
- **GPU Acceleration**: Scale transforms are hardware-accelerated
- **Center Origin**: `transformOrigin: 'top center'` keeps content centered

#### Mobile Detection
Uses a custom hook with media queries for responsive behavior:

```tsx
// src/lib/hooks/use-mobile.ts
const MOBILE_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }

    mql.addEventListener("change", handleChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

    return () => mql.removeEventListener("change", handleChange)
  }, [])

  return isMobile // undefined during SSR, boolean after hydration
}
```

#### Persistence Strategy
SessionStorage provides per-tab persistence:
- **Tab Isolation**: Each tab maintains its own zoom level
- **Session Duration**: Settings persist until tab closure
- **No Cross-Tab Sync**: Intentional design for independent viewing

### User Experience Features

#### Keyboard Shortcuts
Standard zoom shortcuts familiar to users:
- **Cmd/Ctrl + Plus (+)**: Increase zoom (up to 100%)
- **Cmd/Ctrl + Minus (-)**: Decrease zoom (down to 50%)
- **Cmd/Ctrl + Zero (0)**: Reset to 100%

#### Visual Feedback
- **Hover Controls**: Appear on hover to minimize UI clutter
- **Disabled States**: Buttons disable at zoom limits
- **Smooth Transitions**: Opacity animations for control visibility
- **Tooltip Hints**: Clear labels for each control

#### Accessibility Considerations
- **Keyboard Navigation**: Full keyboard support for zoom operations
- **ARIA Labels**: Implicit through button content and tooltips
- **Graceful Degradation**: Falls back to 100% if storage unavailable
- **Loading States**: Prevents layout shift during initialization

### Performance Optimizations

#### Memoization
All zoom functions are memoized to prevent unnecessary re-renders:

```tsx
const increaseZoom = useCallback(() => {
  if (!isEnabled) return

  const currentIndex = ZOOM_LEVELS.indexOf(zoomLevel)
  if (currentIndex < ZOOM_LEVELS.length - 1) {
    setZoomLevel(ZOOM_LEVELS[currentIndex + 1])
  }
}, [isEnabled, zoomLevel, setZoomLevel])
```

#### Context Value Memoization
The context value is memoized to prevent consumer re-renders:

```tsx
const contextValue = useMemo<ZoomContextValue>(() => ({
  zoomLevel: isEnabled && !isLoading ? zoomLevel : DEFAULT_ZOOM,
  setZoomLevel,
  increaseZoom,
  decreaseZoom,
  resetZoom,
  isEnabled,
  isLoading: isEnabled ? isLoading : false,
}), [zoomLevel, setZoomLevel, increaseZoom, decreaseZoom, resetZoom, isEnabled, isLoading])
```

#### Conditional Rendering
Components check multiple conditions before rendering:
- Mobile detection complete (`isMobile !== undefined`)
- Storage loading complete (`!isLoading`)
- Desktop confirmed (`isMobile === false`)

### Configuration

#### Zoom Levels
Fixed zoom levels defined as constants:
```tsx
const ZOOM_LEVELS = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0] as const
```

#### Storage Key
SessionStorage key for persistence:
```tsx
const STORAGE_KEY = 'exam-viewer-zoom'
```

#### Mobile Breakpoint
Viewport width threshold for mobile detection:
```tsx
const MOBILE_BREAKPOINT = 1024 // pixels
```

### Limitations and Constraints

1. **Desktop Only**: Feature is completely disabled on mobile devices
2. **Fixed Zoom Levels**: Limited to predefined increments (not continuous)
3. **Maximum 100%**: Cannot zoom beyond original size
4. **Minimum 50%**: Cannot zoom below half size
5. **Tab Isolation**: Zoom levels don't sync across tabs
6. **Session Duration**: Settings lost when tab closes

## Other Notes

### Question Reporting Workflow
The reporting system allows users to flag issues with questions. Reports are categorized into three types:
1. **Metadata Issues**: Problems with year, question number, or subparts
2. **Incorrect Topic**: Topic assignment errors
3. **Other**: General issues

Reports include:
- Duplicate detection to prevent spam
- Character limits (10-500 characters)
- Admin review interface for resolution
- Status tracking (pending → resolved/dismissed)

### Search Implementation Details
The full-text search uses PostgreSQL's text search capabilities:
- Converts search terms to tsquery format
- Supports OR operations between multiple terms
- Uses English language configuration for stemming
- Indexed with GIN for performance

### Error Handling
Comprehensive error handling at multiple levels:
- **Network Errors**: Retry logic with exponential backoff
- **Abort Signals**: Graceful cancellation of in-flight requests
- **User Feedback**: Toast notifications for actions
- **Fallback UI**: Error states in components

### Mobile Responsiveness
The filter system adapts to mobile viewports:
- Collapsible sidebar for filters
- Touch-friendly checkbox sizing
- Responsive grid layouts for year selection
- Optimized image loading for mobile bandwidth
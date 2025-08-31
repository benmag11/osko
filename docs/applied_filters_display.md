# Applied Filters Display Documentation

## Overview
The Applied Filters Display is a real-time filter visualization system in the exam viewer that shows currently active filters as interactive tags. It provides immediate visual feedback for filter state changes, enables direct filter removal through tag interactions, and maintains synchronization with URL state for shareable filtered views.

## Architecture
The system follows a unidirectional data flow architecture with URL as the single source of truth. Filter state is persisted in URL parameters, enabling shareable links and browser history navigation. The architecture uses React Server Components for initial data fetching, client-side hooks for real-time updates, and TanStack Query for efficient data caching and synchronization.

The design pattern separates concerns into:
- **Presentation Layer**: Visual components for displaying filter tags
- **State Management**: URL-based state with custom hooks for updates
- **Data Layer**: Supabase functions for filtered data retrieval
- **Synchronization**: Real-time updates between UI, URL, and data queries

## File Structure
```
src/
  components/filters/
    applied-filters-display.tsx    # Main container for filter visualization
    filter-tag.tsx                  # Individual filter tag component
    clear-filters-button.tsx        # Clear all filters action button
    
  lib/hooks/
    use-filter-updates.ts          # Hook for managing filter state updates
    
  lib/utils/
    url-filters.ts                 # URL parameter serialization/parsing utilities
    
  lib/types/
    database.ts                    # TypeScript interfaces for filters
    
  app/subject/[slug]/
    page.tsx                       # Main page integrating filter display
```

## Core Components

### AppliedFiltersDisplay Component
The main container component that orchestrates filter visualization and manages the overall display logic.

```typescript
export function AppliedFiltersDisplay({ topics, filters }: AppliedFiltersDisplayProps) {
  const { toggleTopic, toggleYear, toggleQuestionNumber, removeSearchTerm, clearAllFilters } = useFilterUpdates(filters)
  
  const hasFilters = !!(
    filters.searchTerms?.length ||
    filters.topicIds?.length ||
    filters.years?.length ||
    filters.questionNumbers?.length
  )

  const getTopicName = (id: string) => 
    topics.find(t => t.id === id)?.name || ''
```

The component:
- Receives current topics list and filter state as props
- Uses the `useFilterUpdates` hook to get filter manipulation functions
- Determines if any filters are active using the `hasFilters` check
- Maps topic IDs to human-readable names for display
- Renders filter tags for each active filter type
- Shows a helpful message when no filters are applied

### FilterTag Component
Individual filter tag with remove functionality and hover states.

```typescript
export function FilterTag({ label, onRemove }: FilterTagProps) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="group inline-flex items-center justify-center gap-3 rounded-md border border-stone-300 bg-cream-50 px-4 py-2 text-base font-sans font-normal text-warm-text-secondary transition-colors hover:border-stone-400 hover:bg-cream-100 hover:text-warm-text-primary"
      aria-label={`Remove ${label} filter`}
    >
      <SquareX className="h-5 w-5 text-warm-text-secondary transition-colors group-hover:text-salmon-500" />
      {label}
    </button>
  )
}
```

Features:
- Clickable button with remove icon (SquareX from lucide-react)
- Hover states for visual feedback
- Accessible ARIA label for screen readers
- Group hover effects for icon color changes
- Consistent spacing and typography

### ClearFiltersButton Component
Action button to remove all active filters at once.

```typescript
export function ClearFiltersButton({ onClick }: ClearFiltersButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-md border border-salmon-500 bg-cream-50 px-5 py-2 text-base font-sans font-medium text-salmon-500 transition-colors hover:border-salmon-600 hover:bg-cream-100 hover:text-salmon-600"
    >
      Clear all
    </button>
  )
}
```

Distinguished styling with salmon accent color to indicate a destructive action.

## Data Flow

### 1. Filter State Initialization
```typescript
// In app/subject/[slug]/page.tsx
const filters = parseSearchParams(resolvedSearchParams, subject.id)
```

URL parameters are parsed on the server into a structured Filters object.

### 2. Filter Updates via Hook
```typescript
// In use-filter-updates.ts
const updateUrl = useCallback((updates: Partial<Filters>) => {
  const newParams = updateSearchParams(searchParams, updates)
  
  startTransition(() => {
    const query = newParams.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  })
}, [pathname, router, searchParams])
```

Updates trigger URL navigation, which causes React to re-render with new filter state.

### 3. Real-time Query Updates
```typescript
// In use-questions-query.ts
useInfiniteQuery({
  queryKey: queryKeys.infinite(filters),
  queryFn: async ({ pageParam, signal }) => {
    return searchQuestionsClient(filters, pageParam, signal)
  },
  // ...
})
```

TanStack Query automatically refetches data when filter query keys change.

### 4. Visual Feedback Loop
The filter display updates immediately as URL changes propagate through the component tree, providing instant visual feedback for user actions.

## Key Functions and Hooks

### useFilterUpdates Hook
Central hook for managing all filter state mutations.

```typescript
export function useFilterUpdates(filters: Filters) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Individual filter type handlers
  const toggleTopic = useCallback((topicId: string) => {
    const current = filters.topicIds || []
    const updated = current.includes(topicId)
      ? current.filter(id => id !== topicId)
      : [...current, topicId]
    updateUrl({ topicIds: updated })
  }, [filters.topicIds, updateUrl])

  const clearAllFilters = useCallback(() => {
    router.push(pathname)
  }, [pathname, router])
```

Provides:
- `addSearchTerm`: Add keyword search filter
- `removeSearchTerm`: Remove specific keyword
- `toggleTopic`: Add/remove topic filter
- `toggleYear`: Add/remove year filter
- `toggleQuestionNumber`: Add/remove question number filter
- `clearAllFilters`: Remove all active filters
- `isPending`: Loading state during transitions

### URL Filter Utilities
Serialization and deserialization functions for URL state management.

```typescript
// Filter to URL parameter mapping
const FILTER_PARAM_MAP = {
  searchTerms: 'q',
  topicIds: 'topics',
  years: 'years',
  examTypes: 'types',
  questionNumbers: 'questions',
} as const

// Serialize filter values for URL
function serializeFilterValue<K extends keyof Omit<Filters, 'subjectId'>>(
  key: K,
  value: Filters[K]
): string | null {
  switch (key) {
    case 'searchTerms':
    case 'topicIds':
      return value.length > 0 ? value.join(',') : null
    case 'years':
    case 'questionNumbers':
      return value.length > 0 ? value.join(',') : null
  }
}
```

Handles:
- Type-safe serialization/deserialization
- Comma-separated values for arrays
- Null handling for empty filters
- Consistent parameter naming

## Integration Points

### Subject Page Integration
The main exam viewer page coordinates all filter-related components:

```typescript
export default async function SubjectPage({ params, searchParams }: PageProps) {
  // Parse filters from URL
  const filters = parseSearchParams(resolvedSearchParams, subject.id)
  
  // Fetch data with filters applied
  const [topicsResult, yearsResult, questionNumbersResult, questionsResult] = 
    await Promise.allSettled([
      getTopics(subject.id),
      getAvailableYears(subject.id),
      getAvailableQuestionNumbers(subject.id),
      searchQuestions(filters)
    ])

  return (
    <SidebarProvider defaultOpen>
      <ExamSidebar 
        subject={subject} 
        topics={topics} 
        years={years} 
        questionNumbers={questionNumbers} 
        filters={filters} 
      />
      <SidebarInset>
        <main>
          <AppliedFiltersDisplay topics={topics} filters={filters} />
          <QuestionList initialData={initialData} filters={filters} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
```

### Sidebar Filter Controls
Filter input components in the sidebar that update the same filter state:

```typescript
// In topic-filter-accordion.tsx
export function TopicFilterAccordion({ topics, filters }: TopicFilterAccordionProps) {
  const { toggleTopic } = useFilterUpdates(filters)
  
  return (
    <Checkbox
      checked={filters.topicIds?.includes(topic.id) ?? false}
      onCheckedChange={() => toggleTopic(topic.id)}
    />
  )
}
```

All filter controls use the same `useFilterUpdates` hook, ensuring consistency.

## Configuration

### Filter Types Configuration
```typescript
export interface Filters {
  subjectId: string           // Required subject context
  searchTerms?: string[]      // Keyword search terms
  years?: number[]            // Exam years
  topicIds?: string[]         // Topic UUIDs
  examTypes?: string[]        // normal, deferred, supplemental
  questionNumbers?: number[]  // Question numbers (1-10)
}
```

### URL Parameter Mapping
```typescript
const FILTER_PARAM_MAP = {
  searchTerms: 'q',        // ?q=keyword1,keyword2
  topicIds: 'topics',      // ?topics=uuid1,uuid2
  years: 'years',          // ?years=2023,2024
  examTypes: 'types',      // ?types=normal,deferred
  questionNumbers: 'questions', // ?questions=1,2,3
}
```

## Type Definitions

### Component Props
```typescript
interface AppliedFiltersDisplayProps {
  topics: Topic[]    // List of available topics for name resolution
  filters: Filters   // Current filter state
}

interface FilterTagProps {
  label: string      // Display text for the filter
  onRemove: () => void  // Callback when removing filter
}

interface ClearFiltersButtonProps {
  onClick: () => void   // Callback to clear all filters
}
```

### Database Types
```typescript
interface Topic {
  id: string
  name: string
  subject_id: string
  created_at: string
}

interface QuestionCursor {
  sort_key: string
  year: number
  paper_number: number | null
  exam_type: 'normal' | 'deferred' | 'supplemental'
  question_number: number
  question_parts: string[]
}
```

## Implementation Details

### Filter Display Logic
The component determines which filters to display based on the presence of values in the filter arrays:

```typescript
{filters.searchTerms?.map((term) => (
  <FilterTag
    key={term}
    label={`Keyword: '${term}'`}
    onRemove={() => removeSearchTerm(term)}
  />
))}
```

Each filter type has its own mapping logic:
- **Search Terms**: Prefixed with "Keyword: " and wrapped in quotes
- **Topics**: Resolved to topic names using the topics array
- **Years**: Displayed as raw year numbers
- **Question Numbers**: Prefixed with "Question "

### State Synchronization
The system maintains synchronization through several mechanisms:

1. **URL as Source of Truth**: All filter state is derived from URL parameters
2. **Optimistic Updates**: Uses React's `useTransition` for smooth updates
3. **Cache Invalidation**: TanStack Query automatically refetches when filter keys change
4. **Server-Side Rendering**: Initial state is fetched on the server with filters applied

### Performance Optimizations
- **Memoized Callbacks**: All update functions use `useCallback` to prevent unnecessary re-renders
- **Transition API**: Uses React 18's transition API for non-blocking updates
- **Query Caching**: TanStack Query caches results per unique filter combination
- **Placeholder Data**: Keeps previous data visible while fetching new results

## Dependencies

### External Dependencies
- **Next.js 15**: App Router for server components and routing
- **React 19**: For UI components and hooks
- **TanStack Query v5**: For data fetching and caching
- **Supabase**: Backend database and RPC functions
- **lucide-react**: Icon library for filter tag icons

### Internal Dependencies
- **UI Components**: shadcn/ui components (Button, Checkbox, Input)
- **Type System**: Shared database types from `lib/types/database.ts`
- **Utilities**: URL filtering utilities from `lib/utils/url-filters.ts`
- **Hooks**: Custom hooks for filter management

## API Reference

### Database Functions

#### search_questions_paginated
Filters and paginates questions based on provided criteria.

```sql
CREATE FUNCTION search_questions_paginated(
  p_subject_id uuid,
  p_search_terms text[] DEFAULT NULL,
  p_years integer[] DEFAULT NULL,
  p_topic_ids uuid[] DEFAULT NULL,
  p_exam_types text[] DEFAULT NULL,
  p_question_numbers integer[] DEFAULT NULL,
  p_cursor jsonb DEFAULT NULL,
  p_limit integer DEFAULT 20
) RETURNS jsonb
```

Applies filters using:
- Full-text search for keywords
- Array containment for years, topics, question numbers
- Cursor-based pagination for infinite scroll
- Topic filtering via junction table

#### get_available_years
Returns all unique years for a subject's questions.

```sql
CREATE FUNCTION get_available_years(p_subject_id uuid)
RETURNS integer[]
```

#### get_available_question_numbers
Returns all unique question numbers for a subject.

```sql
CREATE FUNCTION get_available_question_numbers(p_subject_id uuid)
RETURNS integer[]
```

## Other Notes

### Browser History Support
The URL-based approach enables full browser history support. Users can:
- Use back/forward buttons to navigate filter states
- Bookmark specific filtered views
- Share filtered URLs with other users
- Refresh the page without losing filter state

### Accessibility Considerations
- All filter tags have descriptive ARIA labels
- Keyboard navigation is fully supported
- Focus management during filter updates
- Clear visual hover states for interactive elements

### Mobile Responsiveness
The filter display uses flexbox with wrap for responsive layout:
- Tags flow naturally on smaller screens
- Touch-friendly tap targets (min 44px)
- Collapsible sidebar on mobile devices

### Edge Cases Handled
- Empty filter arrays are treated as no filter
- Invalid topic IDs gracefully fallback to empty string
- URL tampering is sanitized through type guards
- Duplicate filter values are prevented in toggle functions

### Future Extensibility
The architecture supports easy addition of new filter types:
1. Add new field to `Filters` interface
2. Add URL parameter mapping in `FILTER_PARAM_MAP`
3. Implement toggle function in `useFilterUpdates`
4. Add display logic in `AppliedFiltersDisplay`
5. Update database function to handle new filter
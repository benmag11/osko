# Filter System Documentation

## Overview
The filter system is a comprehensive multi-dimensional filtering architecture that enables real-time question search and filtering across multiple criteria including keywords, topics, years, exam types, and question numbers. It features URL state persistence for shareable filtered views, optimistic UI updates, and seamless integration with infinite scroll pagination.

## Architecture
The filter system follows a unidirectional data flow pattern with URL as the single source of truth. It uses Next.js App Router for server-side rendering, TanStack Query for client-side data fetching with caching, and Supabase PostgreSQL functions for optimized database queries. The architecture ensures filter state persistence across page refreshes and enables deep linking to specific filter combinations.

## File Structure
```
src/
  components/filters/           # Filter UI components
    search-filter.tsx          # Keyword search with add functionality
    topic-filter-accordion.tsx # Topic selection with checkboxes
    year-filter-accordion.tsx  # Year selection with checkboxes
    question-filter-accordion.tsx # Question number selection
    applied-filters-display.tsx # Visual display of active filters
    filter-tag.tsx             # Individual removable filter tag
    clear-filters-button.tsx   # Clear all filters action
  
  components/layout/
    nav-filters.tsx            # Filter navigation container
    exam-sidebar.tsx           # Sidebar integration with filters
  
  lib/hooks/
    use-filter-updates.ts      # Filter state management hook
    use-questions-query.ts     # Infinite query with filter integration
  
  lib/utils/
    url-filters.ts             # URL serialization/deserialization
  
  lib/supabase/
    queries.ts                 # Server-side filter queries
    client-queries.ts          # Client-side filter queries
    query-builders.ts          # Shared query parameter builder
  
  lib/types/
    database.ts                # Filter type definitions
  
  lib/queries/
    query-keys.ts              # React Query cache keys
  
  app/subject/[slug]/
    page.tsx                   # Main page with filter integration
```

## Core Components

### Filter Hook - useFilterUpdates
The central hook that manages all filter state updates and URL synchronization:

```typescript
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

  // Individual filter update methods
  const addSearchTerm = useCallback((term: string) => {
    const current = filters.searchTerms || []
    if (!current.includes(term)) {
      updateUrl({ searchTerms: [...current, term] })
    }
  }, [filters.searchTerms, updateUrl])

  const toggleTopic = useCallback((topicId: string) => {
    const current = filters.topicIds || []
    const updated = current.includes(topicId)
      ? current.filter(id => id !== topicId)
      : [...current, topicId]
    updateUrl({ topicIds: updated })
  }, [filters.topicIds, updateUrl])
}
```

### URL Filter Utilities
Handles bidirectional conversion between filter objects and URL parameters:

```typescript
// URL parameter mapping for compact URLs
const FILTER_PARAM_MAP = {
  searchTerms: 'q',
  topicIds: 'topics',
  years: 'years',
  examTypes: 'types',
  questionNumbers: 'questions',
} as const

// Parse URL params into Filters object
export function parseSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
  subjectId: string
): Filters {
  return {
    subjectId,
    searchTerms: deserializeFilterValue('searchTerms', getValue(FILTER_PARAM_MAP.searchTerms)),
    topicIds: deserializeFilterValue('topicIds', getValue(FILTER_PARAM_MAP.topicIds)),
    years: deserializeFilterValue('years', getValue(FILTER_PARAM_MAP.years)),
    examTypes: deserializeFilterValue('examTypes', getValue(FILTER_PARAM_MAP.examTypes)),
    questionNumbers: deserializeFilterValue('questionNumbers', getValue(FILTER_PARAM_MAP.questionNumbers)),
  }
}

// Update URL params with filter changes
export function updateSearchParams(
  currentParams: URLSearchParams,
  updates: Partial<Filters>
): URLSearchParams {
  const params = new URLSearchParams(currentParams.toString())
  
  Object.entries(FILTER_PARAM_MAP).forEach(([filterKey, paramName]) => {
    const key = filterKey as keyof Omit<Filters, 'subjectId'>
    if (key in updates) {
      const value = updates[key]
      if (value !== undefined) {
        const serialized = serializeFilterValue(key, value)
        if (serialized) {
          params.set(paramName, serialized)
        } else {
          params.delete(paramName)
        }
      }
    }
  })
  
  return params
}
```

### Search Filter Component
Implements keyword search with add functionality and sidebar collapse handling:

```typescript
export function SearchFilter({ filters }: SearchFilterProps) {
  const { addSearchTerm } = useFilterUpdates(filters)
  const [value, setValue] = useState('')
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const inputRef = useRef<HTMLInputElement>(null)
  const shouldFocusOnExpand = useRef(false)

  const handleAddKeyword = () => {
    if (value.trim()) {
      addSearchTerm(value.trim())
      setValue('')
    }
  }

  // Auto-focus input when sidebar expands
  useEffect(() => {
    if (!isCollapsed && shouldFocusOnExpand.current && inputRef.current) {
      inputRef.current.focus()
      shouldFocusOnExpand.current = false
    }
  }, [isCollapsed])

  return (
    <div>
      <CollapsibleSidebarMenuButton 
        tooltip="Search by keyword" 
        onExpandedClick={handleExpandedClick}
      >
        <Search />
        <span>Search by keyword</span>
      </CollapsibleSidebarMenuButton>
      {!isCollapsed && (
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Try typing 'prove'"
          />
          <button onClick={handleAddKeyword}>
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
```

### Topic Filter Accordion
Implements hierarchical topic selection with checkbox UI:

```typescript
export function TopicFilterAccordion({ topics, filters }: TopicFilterAccordionProps) {
  const { toggleTopic } = useFilterUpdates(filters)
  const { state, setOpen } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const handleAccordionClick = (e: React.MouseEvent) => {
    if (isCollapsed) {
      e.preventDefault()
      e.stopPropagation()
      setOpen(true)
      // Trigger accordion expansion after sidebar opens
      setTimeout(() => {
        const trigger = e.currentTarget as HTMLElement
        trigger?.click()
      }, 0)
    }
  }

  return (
    <AccordionItem value="topics">
      <AccordionTrigger onClick={handleAccordionClick}>
        <SidebarMenuButton tooltip="Study by topic">
          <ListFilter />
          <span>Study by topic</span>
          <ChevronRight data-chevron />
        </SidebarMenuButton>
      </AccordionTrigger>
      <AccordionContent>
        <SidebarMenuSub>
          {topics.map((topic) => (
            <SidebarMenuSubItem key={topic.id}>
              <label className="flex cursor-pointer items-center gap-3">
                <Checkbox
                  checked={filters.topicIds?.includes(topic.id) ?? false}
                  onCheckedChange={() => toggleTopic(topic.id)}
                />
                <span>{topic.name}</span>
              </label>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </AccordionContent>
    </AccordionItem>
  )
}
```

## Data Flow

### 1. Filter State Initialization
```typescript
// In page.tsx - Server-side filter parsing
const filters = parseSearchParams(resolvedSearchParams, subject.id)

// Parallel data fetching with filters
const [topicsResult, yearsResult, questionNumbersResult, questionsResult] = 
  await Promise.allSettled([
    getTopics(subject.id),
    getAvailableYears(subject.id),
    getAvailableQuestionNumbers(subject.id),
    searchQuestions(filters)  // Initial filtered questions
  ])
```

### 2. Filter Update Flow
1. User interacts with filter component (checkbox, search input)
2. Component calls appropriate hook method (toggleTopic, addSearchTerm, etc.)
3. Hook updates URL parameters via router.push with transition
4. URL change triggers page re-render with new searchParams
5. New filters are parsed from URL
6. Questions are fetched with updated filters
7. UI updates to reflect new filter state

### 3. Infinite Scroll Integration
```typescript
export function useQuestionsQuery({ filters, initialData }: Options) {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.infinite(filters),  // Cache key includes filters
    queryFn: async ({ pageParam, signal }) => {
      return searchQuestionsClient(filters, pageParam, signal)
    },
    initialPageParam: null as QuestionCursor | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    initialData: initialData ? {
      pages: [initialData],
      pageParams: [null],
    } : undefined,
  })

  // Auto-fetch next page on scroll
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])
}
```

## Key Functions and Hooks

### useFilterUpdates Hook Methods
- `updateUrl(updates: Partial<Filters>)` - Generic filter update method
- `addSearchTerm(term: string)` - Add keyword to search terms
- `removeSearchTerm(term: string)` - Remove specific search term
- `toggleTopic(topicId: string)` - Toggle topic selection
- `toggleYear(year: number)` - Toggle year selection
- `toggleQuestionNumber(questionNumber: number)` - Toggle question number
- `clearAllFilters()` - Remove all active filters
- `isPending` - Transition state for optimistic UI

### URL Serialization Functions
- `parseSearchParams()` - Convert URL params to Filters object
- `buildFilterUrl()` - Build complete URL with filter params
- `updateSearchParams()` - Update existing URL params with changes
- `serializeFilterValue()` - Convert filter array to URL string
- `deserializeFilterValue()` - Parse URL string to typed array

### Query Builder Functions
```typescript
export function buildSearchQueryParams(
  filters: Filters,
  cursor?: QuestionCursor | null,
  limit = 20
) {
  return {
    p_subject_id: filters.subjectId,
    p_search_terms: filters.searchTerms || null,
    p_years: filters.years || null,
    p_topic_ids: filters.topicIds || null,
    p_exam_types: filters.examTypes || null,
    p_question_numbers: filters.questionNumbers || null,
    p_cursor: cursor || null,
    p_limit: limit
  }
}
```

## Integration Points

### Sidebar Integration
The filter system is integrated into the exam sidebar with collapsible accordion UI:

```typescript
<ExamSidebar 
  subject={subject} 
  topics={topics} 
  years={years} 
  questionNumbers={questionNumbers} 
  filters={filters} 
/>
```

### Applied Filters Display
Visual representation of active filters with removal capability:

```typescript
<AppliedFiltersDisplay topics={topics} filters={filters} />

// Renders filter tags for each active filter
{filters.searchTerms?.map((term) => (
  <FilterTag
    key={term}
    label={`Keyword: '${term}'`}
    onRemove={() => removeSearchTerm(term)}
  />
))}

{filters.topicIds?.map((topicId) => (
  <FilterTag
    key={topicId}
    label={getTopicName(topicId)}
    onRemove={() => toggleTopic(topicId)}
  />
))}
```

### React Query Cache Integration
Filters are included in query keys for proper cache invalidation:

```typescript
export const queryKeys = {
  infinite: (filters: Filters) => 
    [...queryKeys.list(filters), 'infinite'] as const,
  list: (filters: Filters) => 
    [...queryKeys.lists(), filters] as const,
}
```

## Configuration

### Filter Types Definition
```typescript
export interface Filters {
  subjectId: string           // Required subject context
  searchTerms?: string[]      // Full-text search keywords
  years?: number[]            // Filter by exam years
  topicIds?: string[]         // Filter by topic UUIDs
  examTypes?: string[]        // Filter by exam types
  questionNumbers?: number[]  // Filter by question numbers
}
```

### URL Parameter Mapping
```typescript
const FILTER_PARAM_MAP = {
  searchTerms: 'q',        // ?q=prove,theorem
  topicIds: 'topics',      // ?topics=uuid1,uuid2
  years: 'years',          // ?years=2023,2024
  examTypes: 'types',      // ?types=normal,deferred
  questionNumbers: 'questions', // ?questions=1,2,3
}
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

export interface QuestionCursor {
  sort_key: string  // Composite sort key for pagination
  year?: number
  paper_number?: number
  exam_type?: string
  question_number?: number
  question_parts?: string[]
}

export interface PaginatedResponse {
  questions: Question[]
  next_cursor: QuestionCursor | null
  hasMore?: boolean
}
```

## Implementation Details

### Database Function - search_questions_paginated
The PostgreSQL function handles multi-criteria filtering with optimized indexing:

1. **Full-text search**: Uses PostgreSQL's `plainto_tsquery` for keyword matching
2. **OR condition for search terms**: Multiple keywords are combined with OR logic
3. **AND condition for filters**: Different filter types use AND logic
4. **Cursor-based pagination**: Uses composite sort key for stable pagination
5. **Topic aggregation**: LEFT JOIN with question_topics for topic filtering
6. **Sort order**: Year (desc), exam_type, paper_number, question_number

```sql
-- Build search query with OR conditions for multiple terms
IF p_search_terms IS NOT NULL AND array_length(p_search_terms, 1) > 0 THEN
  v_search_query := array_to_string(
    ARRAY(
      SELECT plainto_tsquery('english', term)::text
      FROM unnest(p_search_terms) AS term
    ),
    ' | '  -- OR operator for search terms
  );
END IF;

-- Apply filters with AND logic
WHERE q.subject_id = p_subject_id
  AND (v_search_query IS NULL OR 
       q.full_text @@ to_tsquery('english', v_search_query))
  AND (p_years IS NULL OR q.year = ANY(p_years))
  AND (p_topic_ids IS NULL OR EXISTS (
    SELECT 1 FROM question_topics qt2 
    WHERE qt2.question_id = q.id 
      AND qt2.topic_id = ANY(p_topic_ids)
  ))
```

### Optimistic UI Updates
Uses React's useTransition for non-blocking URL updates:

```typescript
const [isPending, startTransition] = useTransition()

const updateUrl = useCallback((updates: Partial<Filters>) => {
  const newParams = updateSearchParams(searchParams, updates)
  
  startTransition(() => {  // Non-blocking update
    const query = newParams.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  })
}, [pathname, router, searchParams])
```

### Sidebar Collapse Handling
Filter accordions auto-expand sidebar when clicked in collapsed state:

```typescript
const handleAccordionClick = (e: React.MouseEvent) => {
  if (isCollapsed) {
    e.preventDefault()
    e.stopPropagation()
    setOpen(true)  // Expand sidebar first
    
    // Then trigger accordion after sidebar animation
    setTimeout(() => {
      const trigger = e.currentTarget as HTMLElement
      trigger?.click()
    }, 0)
  }
}
```

## Dependencies

### External Dependencies
- `next/navigation` - Router, pathname, and search params hooks
- `@tanstack/react-query` - Infinite queries and caching
- `react-intersection-observer` - Infinite scroll trigger
- `@radix-ui/react-accordion` - Accordion UI components
- `lucide-react` - Icon components

### Internal Dependencies
- `@/lib/supabase/*` - Database client and queries
- `@/components/ui/*` - shadcn/ui components
- `@/lib/types/database` - TypeScript type definitions
- `@/lib/queries/query-keys` - React Query cache keys
- `@/lib/errors` - Custom error classes

## API Reference

### Filter Update Methods
```typescript
interface FilterUpdateMethods {
  updateUrl: (updates: Partial<Filters>) => void
  addSearchTerm: (term: string) => void
  removeSearchTerm: (term: string) => void
  toggleTopic: (topicId: string) => void
  toggleYear: (year: number) => void
  toggleQuestionNumber: (questionNumber: number) => void
  clearAllFilters: () => void
  isPending: boolean
}
```

### Database RPC Function
```typescript
// Supabase RPC: search_questions_paginated
interface SearchQuestionsParams {
  p_subject_id: string
  p_search_terms?: string[] | null
  p_years?: number[] | null
  p_topic_ids?: string[] | null
  p_exam_types?: string[] | null
  p_question_numbers?: number[] | null
  p_cursor?: QuestionCursor | null
  p_limit?: number
}

// Returns: PaginatedResponse with questions and next_cursor
```

## Other notes

### Performance Optimizations
- URL updates use React transitions for non-blocking UI
- Query results are cached by filter combination
- Infinite scroll uses intersection observer for efficient loading
- Database function uses composite indexes for fast filtering
- Previous data is preserved during filter changes for smooth UX

### Filter Persistence
- All filter state is stored in URL parameters
- Enables browser back/forward navigation through filter states
- Allows sharing filtered views via URL
- Survives page refreshes without data loss
- Server-side rendering with initial filter state

### Mobile Responsiveness
- Sidebar collapses to icon view on mobile
- Filter accordions remain functional in collapsed state
- Applied filters display adapts to screen size
- Touch-friendly checkbox and button interactions

### Accessibility Features
- Semantic HTML with proper ARIA labels
- Keyboard navigation support for all filters
- Focus management when sidebar expands
- Screen reader friendly filter removal buttons
- Clear visual feedback for filter states
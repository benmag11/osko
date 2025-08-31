# Question Display System Documentation

## Overview
The Question Display System is a sophisticated React-based architecture for rendering exam questions with infinite scroll, image optimization, and responsive layouts. It provides a seamless browsing experience for educational content, handling thousands of questions with efficient pagination, real-time filtering, and optimized image delivery from Supabase storage.

## Architecture
The system employs a multi-layered architecture combining server-side rendering (SSR) for initial data, client-side infinite scrolling with TanStack Query, and cursor-based pagination for efficient database queries. The design prioritizes performance through lazy loading, image optimization, and intelligent caching strategies while maintaining a responsive, mobile-first user interface.

## File Structure
```
src/
├── app/subject/[slug]/
│   └── page.tsx                    # Main subject page with SSR
├── components/questions/
│   ├── question-card.tsx           # Individual question display component
│   └── question-list.tsx           # Question list container with infinite scroll
├── components/filters/
│   ├── applied-filters-display.tsx # Active filters visualization
│   └── filter-tag.tsx              # Individual filter tag component
├── components/layout/
│   ├── exam-sidebar.tsx            # Desktop sidebar with filters
│   ├── mobile-navbar.tsx           # Mobile navigation header
│   └── floating-sidebar-trigger.tsx # Floating sidebar toggle button
├── lib/hooks/
│   ├── use-questions-query.ts      # Infinite scroll query hook
│   └── use-filter-updates.ts       # URL state management for filters
├── lib/supabase/
│   ├── queries.ts                  # Server-side database queries
│   ├── client-queries.ts           # Client-side database queries
│   └── query-builders.ts           # Query parameter builders
└── lib/types/
    └── database.ts                  # TypeScript type definitions
```

## Core Components

### QuestionCard Component
The primary component for rendering individual questions with collapsible marking schemes and admin editing capabilities.

```tsx
// src/components/questions/question-card.tsx
export const QuestionCard = memo(function QuestionCard({ question }: QuestionCardProps) {
  const [showMarkingScheme, setShowMarkingScheme] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const { isAdmin } = useIsAdmin()
  const { topics } = useTopics(question.subject_id)
  
  // URL validation for images
  const hasValidQuestionImage = question.question_image_url && 
    question.question_image_url !== 'placeholder' &&
    (question.question_image_url.startsWith('http') || 
     question.question_image_url.startsWith('/'))
```

Key features:
- **Memoized rendering**: Uses React.memo to prevent unnecessary re-renders
- **Image validation**: Checks for valid URLs before attempting to render
- **Dynamic title formatting**: Builds comprehensive question titles including year, paper, exam type, and parts
- **Collapsible marking scheme**: Toggle functionality for answer visibility
- **Admin controls**: Conditional rendering of edit capabilities

### QuestionList Component
Container component managing the infinite scroll implementation and error states.

```tsx
// src/components/questions/question-list.tsx
export function QuestionList({ initialData, filters }: QuestionListProps) {
  const { 
    questions, 
    isFetchingNextPage, 
    loadMoreRef,
    error
  } = useQuestionsQuery({
    filters,
    initialData,
  })
```

Features:
- **SSR integration**: Accepts initial data from server-side rendering
- **Error handling**: Displays user-friendly error messages
- **Empty state**: Shows helpful message when no questions match filters
- **Loading indicator**: Animated spinner during pagination
- **Separator lines**: Visual separation between questions

## Data Flow

### 1. Initial Page Load (SSR)
```tsx
// src/app/subject/[slug]/page.tsx
export default async function SubjectPage({ params, searchParams }: PageProps) {
  // Parse filters from URL
  const filters = parseSearchParams(resolvedSearchParams, subject.id)
  
  // Parallel data fetching for optimal performance
  const [topicsResult, yearsResult, questionNumbersResult, questionsResult] = 
    await Promise.allSettled([
      getTopics(subject.id),
      getAvailableYears(subject.id),
      getAvailableQuestionNumbers(subject.id),
      searchQuestions(filters)
    ])
```

The data flow begins with server-side fetching, utilizing Promise.allSettled for resilient parallel loading that gracefully handles partial failures.

### 2. Client-Side Infinite Scroll
```tsx
// src/lib/hooks/use-questions-query.ts
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
})
```

The infinite scroll mechanism uses intersection observer to automatically fetch new pages as users scroll, maintaining smooth performance through cursor-based pagination.

### 3. Database Query Execution
The Supabase RPC function `search_questions_paginated` implements sophisticated cursor-based pagination:

```sql
-- Stable sort key construction for consistent ordering
LPAD((9999 - q.year)::text, 4, '0') || '_' ||
CASE q.exam_type 
  WHEN 'normal' THEN '1'
  WHEN 'deferred' THEN '2'
  WHEN 'supplemental' THEN '3'
  ELSE '4'
END || '_' ||
LPAD(COALESCE(q.paper_number, 999)::text, 3, '0') || '_' ||
LPAD(q.question_number::text, 3, '0') || '_' ||
COALESCE(array_to_string(q.question_parts, ','), '')
```

This creates a deterministic sort order ensuring consistent pagination across requests.

## Key Functions and Hooks

### useQuestionsQuery Hook
Central hook managing infinite scroll state and automatic fetching.

```tsx
export function useQuestionsQuery({ filters, initialData, enabled = true }) {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px', // Preload 100px before visible
  })
  
  // Automatically fetch next page when scrolling
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])
  
  // Flatten pages and ensure uniqueness
  const questions = useMemo(() => {
    const uniqueQuestions = new Map<string, Question>()
    data.pages.forEach(page => {
      page.questions.forEach(question => {
        uniqueQuestions.set(question.id, question)
      })
    })
    return Array.from(uniqueQuestions.values())
  }, [data?.pages])
```

The hook combines intersection observer with TanStack Query for automatic pagination, ensuring unique questions through Map-based deduplication.

### useFilterUpdates Hook
Manages URL state synchronization for filter persistence.

```tsx
export function useFilterUpdates(filters: Filters) {
  const updateUrl = useCallback((updates: Partial<Filters>) => {
    const newParams = updateSearchParams(searchParams, updates)
    startTransition(() => {
      const query = newParams.toString()
      router.push(query ? `${pathname}?${query}` : pathname)
    })
  }, [pathname, router, searchParams])
```

This enables shareable URLs and maintains filter state across navigation using React's transition API for smooth updates.

## Integration Points

### Supabase Storage Integration
Images are served directly from Supabase storage with Next.js Image optimization:

```tsx
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
}
```

### Filter System Integration
The question display system integrates with the filtering UI through URL parameters:

```tsx
// src/components/filters/applied-filters-display.tsx
export function AppliedFiltersDisplay({ topics, filters }) {
  const { toggleTopic, toggleYear, toggleQuestionNumber, removeSearchTerm } = 
    useFilterUpdates(filters)
  
  // Filter tags with removal callbacks
  {filters.topicIds?.map((topicId) => (
    <FilterTag
      key={topicId}
      label={getTopicName(topicId)}
      onRemove={() => toggleTopic(topicId)}
    />
  ))}
```

## Configuration

### Query Configuration
```tsx
// Default pagination limit
const limit = 20

// Intersection Observer settings
const observerOptions = {
  threshold: 0,        // Trigger immediately when visible
  rootMargin: '100px', // Preload before reaching viewport
}

// Retry configuration for resilient queries
const retryConfig = {
  retries: 2,
  delay: 1000, // Exponential backoff: 1s, 2s
}
```

### Image Optimization Settings
```tsx
// Question card image rendering
<Image
  src={question.question_image_url}
  alt={`Question ${question.question_number}`}
  width={1073}    // Original width for aspect ratio
  height={800}     // Original height for aspect ratio
  className="w-full h-auto" // Responsive sizing
  priority={false} // Lazy load for performance
/>
```

## Type Definitions

### Core Question Types
```typescript
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
  word_coordinates: WordCoordinate[] | null
  created_at: string
  updated_at: string
  topics?: Array<{
    id: string
    name: string
  }>
}

export interface QuestionCursor {
  sort_key: string  // Primary field for cursor comparison
  year: number
  paper_number: number | null
  exam_type: 'normal' | 'deferred' | 'supplemental'
  question_number: number
  question_parts: string[]
}

export interface PaginatedResponse {
  questions: Question[]
  next_cursor: QuestionCursor | null
}
```

## Implementation Details

### Cursor-Based Pagination Logic
The system uses cursor-based pagination for efficient large dataset handling:

1. **Sort Key Generation**: Creates deterministic sort keys combining year, exam type, paper number, and question number
2. **Cursor Tracking**: Maintains the last item's sort key for next page fetching
3. **Query Optimization**: Uses indexed sort key comparison for O(log n) performance
4. **Duplicate Prevention**: Map-based deduplication ensures unique questions across pages

### Image Loading Strategy
```tsx
// Validation before rendering
const hasValidQuestionImage = question.question_image_url && 
  question.question_image_url !== 'placeholder' &&
  (question.question_image_url.startsWith('http') || 
   question.question_image_url.startsWith('/'))

// Conditional rendering with fallback
{hasValidQuestionImage ? (
  <Image ... />
) : (
  <div className="flex items-center justify-center h-48 bg-stone-100">
    <p className="text-warm-text-muted">Question image not available</p>
  </div>
)}
```

### Responsive Design Implementation
The system adapts to different screen sizes through:

1. **Mobile Navigation**: Dedicated mobile navbar with hamburger menu
2. **Collapsible Sidebar**: Desktop sidebar with floating trigger
3. **Responsive Padding**: Adjusted spacing for mobile views
4. **Touch-Optimized**: Larger tap targets on mobile devices

### Performance Optimizations
1. **Component Memoization**: React.memo prevents unnecessary re-renders
2. **Query Result Caching**: TanStack Query caches for instant navigation
3. **Image Format Optimization**: WebP/AVIF with fallbacks
4. **Lazy Loading**: Images load on-demand with intersection observer
5. **Parallel Data Fetching**: Promise.allSettled for concurrent requests
6. **Abort Signal Support**: Cancellable requests prevent memory leaks

## Dependencies

### External Libraries
- **@tanstack/react-query**: v5 for server state management
- **react-intersection-observer**: For infinite scroll triggers
- **next/image**: Optimized image component
- **lucide-react**: Icon library for UI elements

### Internal Dependencies
- **Supabase Client**: Database connection and queries
- **shadcn/ui Components**: UI primitives (Button, Dialog, Separator)
- **Custom Hooks**: Authentication, topics, filter management
- **Type System**: Comprehensive TypeScript definitions

## API Reference

### useQuestionsQuery
```typescript
interface UseQuestionsQueryOptions {
  filters: Filters
  initialData?: PaginatedResponse
  enabled?: boolean
}

interface UseQuestionsQueryReturn {
  questions: Question[]
  error: Error | null
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean | undefined
  loadMoreRef: RefCallback<HTMLElement>
  status: QueryStatus
  refetch: () => void
}
```

### searchQuestionsClient
```typescript
async function searchQuestionsClient(
  filters: Filters,
  cursor?: QuestionCursor | null,
  signal?: AbortSignal
): Promise<PaginatedResponse>
```

### QuestionCard Props
```typescript
interface QuestionCardProps {
  question: Question
}
```

## Other Notes

### Error Handling Strategy
The system implements multiple layers of error handling:
1. **Server-side resilience**: Promise.allSettled ensures partial data availability
2. **Retry logic**: Automatic retries with exponential backoff for transient failures
3. **User feedback**: Clear error messages with actionable recovery steps
4. **Graceful degradation**: Empty states and fallbacks for missing data

### SEO Considerations
- Server-side rendering provides initial content for search engines
- Structured data through semantic HTML and proper heading hierarchy
- Alt text for all images
- URL-based filter state enables indexable filtered views

### Accessibility Features
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus management for modal dialogs
- Screen reader announcements for dynamic content updates
- Semantic HTML structure

### Mobile-Specific Optimizations
- Touch-friendly tap targets (minimum 44x44px)
- Reduced data fetching on mobile connections
- Optimized image sizes for mobile displays
- Simplified UI with collapsible elements
# Database Architecture Documentation

## Overview
The application uses Supabase as its primary database infrastructure, providing PostgreSQL with real-time capabilities, Row Level Security (RLS), and built-in authentication. The architecture implements a sophisticated pattern of server/client query separation, retry logic, cache management, and type-safe database operations through generated TypeScript types.

## Architecture
The database architecture follows a multi-layered approach with clear separation of concerns:
- **Database Layer**: PostgreSQL on Supabase with RLS policies and custom functions
- **Query Layer**: Separate server and client query implementations with shared builders
- **Cache Layer**: TanStack Query (React Query) with user-scoped isolation
- **Type Layer**: Generated TypeScript types ensuring end-to-end type safety
- **Error Layer**: Custom error handling with retry logic and graceful fallbacks

The design prioritizes data security through RLS policies, performance through intelligent caching and indexing, and developer experience through comprehensive type safety.

## File Structure
```
src/lib/
├── supabase/
│   ├── server.ts              # Server-side Supabase client with SSR support
│   ├── client.ts              # Browser-side Supabase client
│   ├── queries.ts             # Server-side query functions with retry logic
│   ├── client-queries.ts      # Client-side query functions for React Query
│   ├── query-builders.ts      # Shared query parameter builders
│   └── admin-actions.ts       # Admin-only server actions with audit logging
├── cache/
│   ├── cache-utils.ts         # Cache invalidation and management utilities
│   └── cache-monitor.ts       # Development tools for cache debugging
├── config/
│   └── cache.ts               # Centralized cache configuration
├── queries/
│   └── query-keys.ts          # React Query cache key factory
├── types/
│   └── database.ts            # Generated TypeScript types from Supabase
└── errors.ts                  # Custom error classes
```

## Core Components

### Database Schema

The PostgreSQL database consists of 8 core tables with comprehensive relationships:

```typescript
// Main entities
subjects: {
  id: uuid (PK)
  name: text
  level: 'Higher' | 'Ordinary' | 'Foundation'
  created_at: timestamptz
}

questions: {
  id: uuid (PK)
  subject_id: uuid (FK -> subjects)
  year: integer (1990-2050)
  paper_number: integer? (1-3)
  question_number: integer (0-100)
  question_parts: text[]
  exam_type: 'normal' | 'deferred' | 'supplemental'
  question_image_url: text?
  marking_scheme_image_url: text?
  full_text: text?
  word_coordinates: jsonb[]
  created_at: timestamptz
  updated_at: timestamptz
}

topics: {
  id: uuid (PK)
  name: text
  subject_id: uuid (FK -> subjects)
  created_at: timestamptz
}

// Junction tables
question_topics: {
  question_id: uuid (FK -> questions)
  topic_id: uuid (FK -> topics)
  created_at: timestamptz
  PRIMARY KEY (question_id, topic_id)
}

// User data
user_profiles: {
  id: uuid (PK)
  user_id: uuid (FK -> auth.users)
  name: text
  onboarding_completed: boolean
  is_admin: boolean
  created_at: timestamptz
  updated_at: timestamptz
}

user_subjects: {
  id: uuid (PK)
  user_id: uuid (FK -> auth.users)
  subject_id: uuid (FK -> subjects)
  created_at: timestamptz
}

// Audit
question_audit_log: {
  id: uuid (PK)
  question_id: uuid (FK -> questions)
  user_id: uuid (FK -> auth.users)
  action: 'update' | 'delete' | 'topic_add' | 'topic_remove'
  changes: jsonb
  created_at: timestamptz
}
```

### Supabase Client Configuration

The architecture uses two distinct Supabase clients optimized for their environments:

**Server Client (server.ts)**:
```typescript
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Server Component cookie handling
          }
        },
      },
    }
  )
}
```

**Browser Client (client.ts)**:
```typescript
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

## Data Flow

### Query Execution Flow
1. **Request Initiation**: Component calls hook (e.g., `useQuestionsQuery`)
2. **Query Key Generation**: Creates unique cache key using `queryKeys` factory
3. **Cache Check**: TanStack Query checks for cached data
4. **Query Execution**: If needed, executes query via client-queries.ts
5. **Retry Logic**: Implements exponential backoff for failed requests
6. **Response Processing**: Transforms and validates response data
7. **Cache Update**: Stores result in user-scoped cache
8. **Component Update**: Returns data to requesting component

### Server-Side Query Pattern
```typescript
// Server queries use withRetry wrapper for resilience
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delay = 1000
): Promise<T> {
  let lastError: Error = new Error('Unknown error occurred')
  
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on client errors (4xx)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status
        if (status >= 400 && status < 500) {
          throw error
        }
      }
      
      // Exponential backoff
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }
  
  throw lastError
}
```

## Key Functions and Hooks

### Database Functions

**search_questions_paginated**: Core pagination function with comprehensive filtering
- Implements cursor-based pagination for infinite scroll
- Full-text search using PostgreSQL's tsvector
- Multi-criteria filtering (year, topic, exam type, question number)
- Optimized sorting with composite index usage
- Returns paginated results with next cursor

**get_available_years**: Returns distinct years for a subject
```sql
SELECT DISTINCT year 
FROM questions 
WHERE subject_id = p_subject_id 
ORDER BY year DESC
```

**get_user_subjects_sorted**: Fetches user's subjects with full subject data
```sql
SELECT us.*, s.* as subject 
FROM user_subjects us
JOIN subjects s ON us.subject_id = s.id
WHERE us.user_id = p_user_id
ORDER BY s.name, s.level
```

### React Hooks

**useQuestionsQuery**: Infinite scroll implementation
```typescript
export function useQuestionsQuery({ filters, initialData, enabled = true }) {
  const { ref, inView } = useInView({ threshold: 0, rootMargin: '100px' })
  
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage } = 
    useInfiniteQuery({
      queryKey: queryKeys.infinite(filters),
      queryFn: async ({ pageParam, signal }) => {
        return searchQuestionsClient(filters, pageParam, signal)
      },
      initialPageParam: null as QuestionCursor | null,
      getNextPageParam: (lastPage) => lastPage.next_cursor,
      enabled,
      initialData: initialData ? {
        pages: [initialData],
        pageParams: [null],
      } : undefined,
      placeholderData: (previousData) => previousData,
    })
  
  // Auto-fetch on scroll
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])
  
  return { questions, error, isLoading, loadMoreRef: ref }
}
```

## Integration Points

### Authentication Integration
- User profiles automatically created on signup via database trigger
- RLS policies enforce user-specific data access
- Admin role checked at database level for privileged operations
- Session validation in query hooks prevents unauthorized access

### Cache Integration with TanStack Query
- User-scoped QueryClient instances prevent data leakage between users
- Automatic cache invalidation on auth state changes
- Optimistic updates for better UX
- Stale-while-revalidate strategy for frequently accessed data

### Type System Integration
- Database types generated from Supabase schema
- End-to-end type safety from database to UI components
- Compile-time validation of query parameters
- Automatic IntelliSense for database operations

## Configuration

### Cache Configuration (cache.ts)
```typescript
export const CACHE_TIMES = {
  STATIC_DATA: {
    staleTime: 30 * 60 * 1000,  // 30 minutes
    gcTime: 60 * 60 * 1000,      // 1 hour
  },
  USER_DATA: {
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime: 10 * 60 * 1000,      // 10 minutes
  },
  DYNAMIC_DATA: {
    staleTime: 60 * 1000,        // 1 minute
    gcTime: 5 * 60 * 1000,       // 5 minutes
  },
  TOPICS: {
    staleTime: 10 * 60 * 1000,   // 10 minutes
    gcTime: 30 * 60 * 1000,      // 30 minutes
  },
  QUESTIONS: {
    staleTime: 1 * 60 * 1000,    // 1 minute
    gcTime: 10 * 60 * 1000,      // 10 minutes
  },
}
```

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
```

## Type Definitions

### Core Query Types
```typescript
interface Filters {
  subjectId: string
  searchTerms?: string[]
  years?: number[]
  topicIds?: string[]
  examTypes?: string[]
  questionNumbers?: number[]
}

interface QuestionCursor {
  sort_key: string
  year: number
  paper_number: number | null
  exam_type: 'normal' | 'deferred' | 'supplemental'
  question_number: number
  question_parts: string[]
}

interface PaginatedResponse {
  questions: Question[]
  next_cursor: QuestionCursor | null
}
```

## Implementation Details

### Query Builder Pattern
The `query-builders.ts` file centralizes parameter construction:
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

### Error Handling Strategy
- Custom `QueryError` class with error codes and details
- Retry logic with exponential backoff (2 retries by default)
- Graceful fallbacks returning empty arrays for non-critical failures
- Abort signal support for request cancellation
- Detailed error logging for debugging

### Indexing Strategy
Comprehensive indexes optimize query performance:
- `idx_questions_comprehensive_sort`: Composite index for pagination
- `idx_questions_full_text_gin`: GIN index for full-text search
- `idx_questions_subject_year`: Covering index for year filtering
- `idx_question_topics_question_id`: Junction table optimization
- `unique_subject_level`: Ensures data integrity

### RLS Policy Implementation
Row Level Security ensures data isolation:

**Public Access**:
- `subjects`, `topics`, `questions`: Read-only for everyone
- Authenticated users can insert with restrictions

**User-Specific**:
- `user_profiles`: Users can only access/modify their own profile
- `user_subjects`: Full control over own subject selections

**Admin-Only**:
- `question_audit_log`: View and insert restricted to admins
- Question updates require admin role verification
- Topic management restricted to admins

### Cache Isolation Pattern
The `providers.tsx` implements user-specific QueryClient instances:
```typescript
const queryClientMap = new Map<string, QueryClient>()

function getQueryClient(userId?: string) {
  const clientKey = userId || 'anonymous'
  
  if (!queryClientMap.has(clientKey)) {
    // Clean up old clients when creating new one
    for (const [key, client] of queryClientMap.entries()) {
      if (key !== clientKey) {
        client.clear()
        client.unmount()
        queryClientMap.delete(key)
      }
    }
    queryClientMap.set(clientKey, makeQueryClient(userId))
  }
  
  return queryClientMap.get(clientKey)!
}
```

## Dependencies
- `@supabase/ssr`: ^0.5.2 - Server-side rendering support
- `@supabase/supabase-js`: ^2.47.10 - Supabase client library
- `@tanstack/react-query`: ^5.62.2 - Data fetching and caching
- `react-intersection-observer`: ^9.13.1 - Infinite scroll triggers

## API Reference

### Server Query Functions
- `getSubjects()`: Fetch all subjects
- `getSubjectBySlug(slug)`: Get subject by URL slug
- `getTopics(subjectId)`: Fetch topics for a subject
- `getAvailableYears(subjectId)`: Get distinct years
- `searchQuestions(filters, cursor, signal)`: Paginated search
- `getUserSubjects(userId)`: Get user's selected subjects
- `saveUserSubjects(userId, subjectIds)`: Update user subjects

### Client Query Functions
- `searchQuestionsClient(filters, cursor, signal)`: Browser-side search

### Admin Functions
- `updateQuestionMetadata(questionId, updates)`: Update question with audit
- `getQuestionAuditLog(questionId)`: Retrieve audit history

### Cache Utilities
- `invalidateUserCache(queryClient)`: Clear user-specific cache
- `clearAllCache(queryClient)`: Complete cache reset
- `getCacheStats(queryClient)`: Get cache metrics
- `getUserScopedKey(userId, baseKey)`: Create user-scoped cache keys

## Other notes

### Cursor-Based Pagination Implementation
The pagination system uses a composite sort key to ensure stable ordering across pages. The sort key format is:
`[inverted_year]_[exam_type_priority]_[paper_number]_[question_number]_[parts]`

This ensures consistent ordering even when new questions are added during pagination.

### Full-Text Search Configuration
The database uses PostgreSQL's built-in full-text search with English language configuration. Search queries are converted to tsquery format with OR operators for multiple terms, enabling flexible search capabilities.

### Abort Signal Handling
All query functions support AbortSignal for request cancellation, crucial for preventing race conditions during rapid filter changes or navigation. The implementation uses Promise.race() to handle both successful responses and abort signals.

### Development Tools
The cache-monitor.ts provides development-only debugging tools accessible via `window.__cacheInspector`, allowing real-time cache inspection and manual cache operations during development.
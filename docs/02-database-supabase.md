# Database & Supabase Integration Documentation

## Overview
The application uses Supabase as its Backend-as-a-Service (BaaS) platform, providing PostgreSQL database hosting, authentication, real-time subscriptions, and Row Level Security (RLS). The integration is built with TypeScript, leveraging Supabase's SSR capabilities for Next.js and implementing comprehensive error handling with retry logic.

## Architecture

### High-Level Database Architecture
The system follows a multi-tier architecture with clear separation between server and client database operations:

1. **Database Layer**: PostgreSQL hosted on Supabase with RLS policies
2. **Function Layer**: PL/pgSQL stored procedures for complex operations
3. **Client Layer**: Separate Supabase clients for server (SSR) and browser contexts
4. **Query Layer**: Abstracted query builders and type-safe interfaces
5. **Cache Layer**: React Query for client-side caching with user-scoped isolation

### Design Patterns
- **Repository Pattern**: Centralized query functions in `/lib/supabase/queries.ts`
- **Command Query Separation**: Read operations vs. write actions clearly separated
- **Retry Pattern**: Automatic retry logic with exponential backoff for transient failures
- **Cursor-based Pagination**: Efficient pagination using sort keys for large datasets
- **Type Safety**: Generated TypeScript types from database schema

## File Structure
```
src/lib/supabase/
├── client.ts              # Browser Supabase client
├── server.ts              # Server-side Supabase client with cookie handling
├── queries.ts             # Server-side query functions
├── client-queries.ts      # Client-side query functions
├── queries-client.ts      # Client-specific query operations
├── query-builders.ts      # Shared query parameter builders
├── admin-actions.ts       # Admin-only database operations
├── admin-context.ts       # Admin authentication helpers
└── report-actions.ts      # Question reporting system actions

src/lib/types/
└── database.ts            # TypeScript type definitions

src/lib/queries/
└── query-keys.ts          # React Query cache key factory

src/lib/
└── errors.ts              # Custom error classes
```

## Core Components

### Database Schema

#### Tables Structure
```sql
-- Core content tables
subjects (id, name, level, created_at)
topics (id, name, subject_id, created_at)
questions (id, subject_id, year, paper_number, question_number, question_parts[], 
          exam_type, question_image_url, marking_scheme_image_url, full_text, 
          word_coordinates, created_at, updated_at)
question_topics (question_id, topic_id, created_at)

-- User management tables
user_profiles (id, user_id, name, onboarding_completed, is_admin, created_at, updated_at)
user_subjects (id, user_id, subject_id, created_at)

-- Admin and reporting tables
question_audit_log (id, question_id, user_id, action, changes, created_at)
question_reports (id, question_id, user_id, report_type, description, status, 
                 resolved_by, resolved_at, admin_notes, created_at)
```

### Supabase Client Configuration

#### Server Client (`server.ts`)
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

The server client:
- Integrates with Next.js cookies for session management
- Handles SSR authentication automatically
- Provides secure server-side database access
- Manages cookie synchronization with try-catch for Server Components

#### Browser Client (`client.ts`)
```typescript
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

The browser client:
- Used for client-side operations and real-time subscriptions
- Handles browser-based authentication
- Manages local session storage
- Integrates with React Query for caching

## Data Flow

### Query Execution Flow
1. **Request Initiation**: Component calls hook or server action
2. **Client Selection**: Server or browser client chosen based on context
3. **Query Building**: Parameters constructed via `buildSearchQueryParams`
4. **Retry Wrapper**: Query wrapped in `withRetry` function
5. **RLS Evaluation**: Database evaluates Row Level Security policies
6. **Response Processing**: Data transformed to match TypeScript interfaces
7. **Error Handling**: Failures caught and wrapped in `QueryError`
8. **Cache Update**: React Query updates cache (client-side only)

### Pagination Flow
```typescript
// 1. Build cursor from last item
const cursor: QuestionCursor = {
  sort_key: lastQuestion.sort_key,
  year: lastQuestion.year,
  paper_number: lastQuestion.paper_number,
  exam_type: lastQuestion.exam_type,
  question_number: lastQuestion.question_number,
  question_parts: lastQuestion.question_parts
}

// 2. Pass cursor to search function
const result = await searchQuestions(filters, cursor)

// 3. Database uses sort_key for efficient pagination
WHERE sort_key > v_cursor_sort_key
ORDER BY sort_key
LIMIT p_limit + 1
```

## Key Functions and Hooks

### Error Handling with Retry Logic
```typescript
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
      
      // Wait before retrying with exponential backoff
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }
  
  throw lastError
}
```

### Search Questions with Pagination
```typescript
export async function searchQuestions(
  filters: Filters,
  cursor?: QuestionCursor | null,
  signal?: AbortSignal
): Promise<PaginatedResponse> {
  // Check abort signal
  if (signal?.aborted) {
    throw new Error('Request was cancelled')
  }
  
  return withRetry(async () => {
    const supabase = await createServerSupabaseClient()
    
    // Create abort promise for cancellation
    const abortPromise = new Promise<never>((_, reject) => {
      if (signal) {
        signal.addEventListener('abort', () => {
          reject(new Error('Request was cancelled'))
        })
      }
    })
    
    // Build query parameters
    const queryParams = buildSearchQueryParams(filters, cursor, 20)
    
    // Race between RPC call and abort signal
    const data = await Promise.race([
      supabase.rpc('search_questions_paginated', queryParams),
      abortPromise
    ])
    
    if (data.error) {
      throw new QueryError(
        'Failed to search questions',
        'QUESTIONS_SEARCH_ERROR',
        data.error
      )
    }
    
    return data.data as PaginatedResponse
  })
}
```

### Admin Context Management
```typescript
// Cached admin verification to avoid multiple DB queries
const getCachedAdminStatus = cache(async (userId: string): Promise<boolean> => {
  const supabase = await createServerSupabaseClient()
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', userId)
    .single()
  
  return profile?.is_admin ?? false
})

export async function ensureAdmin(): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Not authenticated')
  }
  
  const isAdmin = await getCachedAdminStatus(user.id)
  
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }
  
  return user.id
}
```

## Integration Points

### React Query Integration
```typescript
// Query key factory for cache management
export const queryKeys = {
  // Public data queries
  all: ['questions'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (filters: Filters) => [...queryKeys.lists(), filters] as const,
  infinite: (filters: Filters) => [...queryKeys.list(filters), 'infinite'] as const,
  
  // User-specific queries
  user: {
    profile: (userId: string) => ['user', userId, 'profile'] as const,
    subjects: (userId: string) => ['user', userId, 'subjects'] as const,
    admin: (userId: string) => ['user', userId, 'admin'] as const,
  },
}

// Hook using React Query with Supabase
export function useQuestionsQuery({ filters, initialData, enabled = true }) {
  return useInfiniteQuery({
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
}
```

### Server Actions Integration
```typescript
export async function updateQuestionMetadata(
  questionId: string,
  updates: QuestionUpdatePayload
): Promise<{ success: boolean; error?: string; auditLogId?: string }> {
  try {
    await ensureAdmin() // Verify admin status
  } catch {
    return { success: false, error: 'Unauthorized' }
  }
  
  const supabase = await createServerSupabaseClient()
  
  try {
    // Get current data for audit
    const { data: currentQuestion } = await supabase
      .from('questions')
      .select('*, question_topics(topic_id)')
      .eq('id', questionId)
      .single()
    
    // Update question
    const { error: updateError } = await supabase
      .from('questions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', questionId)
    
    if (updateError) throw updateError
    
    // Create audit log
    const { data: { user } } = await supabase.auth.getUser()
    const { data: auditLog } = await supabase
      .from('question_audit_log')
      .insert({
        question_id: questionId,
        user_id: user?.id,
        action: 'update',
        changes: { before: currentQuestion, after: updates }
      })
      .select('id')
      .single()
    
    return { success: true, auditLogId: auditLog?.id }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Update failed' 
    }
  }
}
```

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
```

### Database Functions Configuration
The database includes several PL/pgSQL functions configured with specific security settings:

- **SECURITY DEFINER**: Functions run with the privileges of the function owner
- **STABLE**: Function results are cacheable within a single transaction
- **SET search_path TO 'public'**: Prevents search path injection attacks

## Type Definitions

### Core Database Types
```typescript
export interface Database {
  public: {
    Tables: {
      subjects: {
        Row: Subject
        Insert: Omit<Subject, 'id' | 'created_at'>
        Update: Partial<Omit<Subject, 'id'>>
      }
      questions: {
        Row: Question
        Insert: Omit<Question, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Question, 'id'>>
      }
      // ... other tables
    }
    Functions: {
      search_questions_paginated: {
        Args: {
          p_subject_id: string
          p_search_terms?: string[] | null
          p_years?: number[] | null
          p_topic_ids?: string[] | null
          p_exam_types?: string[] | null
          p_question_numbers?: number[] | null
          p_cursor?: QuestionCursor | null
          p_limit?: number
        }
        Returns: PaginatedResponse
      }
      // ... other functions
    }
  }
}
```

### Query Response Types
```typescript
export interface PaginatedResponse {
  questions: Question[]
  next_cursor: QuestionCursor | null
  total_count: number
}

export interface QuestionCursor {
  sort_key: string  // Composite key for efficient pagination
  year: number
  paper_number: number | null
  exam_type: 'normal' | 'deferred' | 'supplemental'
  question_number: number
  question_parts: string[]
}
```

## Implementation Details

### Query Builder Pattern
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

The query builder:
- Centralizes parameter construction logic
- Ensures consistent null handling
- Provides type safety through TypeScript
- Simplifies maintenance of RPC function calls

### Sort Key Implementation
The database uses a composite sort key for efficient cursor-based pagination:

```sql
-- Sort key construction in search_questions_paginated
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

This creates a sortable string like: `"7976_1_001_005_a,b"` for year 2023, normal exam, paper 1, question 5, parts a,b.

### Full-Text Search Implementation
The database uses PostgreSQL's full-text search capabilities:

```sql
-- GIN index for fast text search
CREATE INDEX idx_questions_full_text_gin 
ON questions USING gin(to_tsvector('english', full_text))

-- Query with multiple search terms (OR logic)
WHERE q.full_text @@ to_tsquery('english', 
  'term1 | term2 | term3')
```

### Transaction Management
Complex operations use database functions for atomic transactions:

```typescript
// update_user_subjects function ensures atomicity
export async function saveUserSubjects(
  userId: string, 
  subjectIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()
  
  // Atomic operation via RPC
  const { data, error } = await supabase
    .rpc('update_user_subjects', {
      p_user_id: userId,
      p_subject_ids: subjectIds
    })
  
  if (error) {
    return { 
      success: false, 
      error: error.message || 'Failed to save subjects' 
    }
  }
  
  return { success: data.success }
}
```

## Dependencies

### External Dependencies
- `@supabase/ssr`: ^0.5.1 - Server-side rendering support
- `@supabase/supabase-js`: ^2.45.1 - Supabase JavaScript client
- `@tanstack/react-query`: ^5.52.0 - Data fetching and caching
- PostgreSQL 17.4.1 - Database engine

### Database Extensions
- `pg_trgm`: Trigram matching for similarity searches
- `unaccent`: Text normalization for search
- `uuid-ossp`: UUID generation

## API Reference

### Server Query Functions

#### `getSubjects(): Promise<Subject[]>`
Fetches all subjects ordered by name and level.

#### `getSubjectBySlug(slug: string): Promise<Subject | null>`
Retrieves a subject by URL slug (e.g., "mathematics-higher").

#### `searchQuestions(filters, cursor?, signal?): Promise<PaginatedResponse>`
Searches questions with filtering, pagination, and cancellation support.

#### `getUserSubjects(userId: string): Promise<UserSubjectWithSubject[]>`
Gets user's selected subjects with full subject data.

#### `saveUserSubjects(userId: string, subjectIds: string[]): Promise<Result>`
Atomically updates user's subject selections.

### Admin Functions

#### `ensureAdmin(): Promise<string>`
Verifies admin status and returns user ID or throws error.

#### `updateQuestionMetadata(questionId, updates): Promise<Result>`
Updates question metadata with audit logging (admin only).

#### `getQuestionAuditHistory(questionId): Promise<QuestionAuditLog[]>`
Retrieves audit trail for a question (admin only).

### Client Query Functions

#### `searchQuestionsClient(filters, cursor?, signal?): Promise<PaginatedResponse>`
Client-side version of searchQuestions for React Query integration.

#### `getUserSubjectsClient(userId: string): Promise<UserSubjectWithSubject[]>`
Client-side version for fetching user subjects in hooks.

## Performance Optimizations

### Database Indexes
```sql
-- Composite index for sorting and filtering
CREATE INDEX idx_questions_comprehensive_sort 
ON questions(subject_id, year DESC, exam_type, paper_number, question_number, question_parts)

-- GIN index for full-text search
CREATE INDEX idx_questions_full_text_gin 
ON questions USING gin(to_tsvector('english', full_text))

-- Specialized index for questions without paper numbers
CREATE INDEX idx_questions_no_paper 
ON questions(subject_id, year DESC, exam_type, question_number, question_parts) 
WHERE paper_number IS NULL

-- Sort key index for cursor pagination
CREATE INDEX idx_questions_sort_key 
ON questions(subject_id, year DESC, exam_type, COALESCE(paper_number, 999), question_number, question_parts)
```

### Query Optimization Strategies
1. **Cursor-based Pagination**: Uses sort keys instead of OFFSET for O(1) pagination
2. **Index Coverage**: Composite indexes cover common query patterns
3. **Selective RPC Functions**: SECURITY DEFINER functions bypass RLS overhead
4. **Connection Pooling**: Supabase manages connection pooling automatically
5. **Result Caching**: React Query caches results with user-scoped isolation

### Retry Logic Benefits
- Handles transient network failures automatically
- Exponential backoff prevents overwhelming the server
- Distinguishes between retryable (5xx) and non-retryable (4xx) errors
- Improves reliability without manual intervention

## Security Considerations

### Row Level Security (RLS)
All tables have RLS enabled with specific policies:

```sql
-- Public read access for questions
CREATE POLICY "Everyone can read questions" ON questions
FOR SELECT USING (true);

-- User-specific access for user_subjects
CREATE POLICY "Users can manage own subjects" ON user_subjects
FOR ALL USING (auth.uid() = user_id);

-- Admin-only access for audit logs
CREATE POLICY "Admins can view audit logs" ON question_audit_log
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.is_admin = true
  )
);
```

### Security Best Practices
1. **Environment Variables**: Sensitive keys stored in environment variables
2. **Type Safety**: Generated types prevent SQL injection
3. **RLS Enforcement**: Database-level security for all operations
4. **Admin Verification**: Cached admin checks to prevent privilege escalation
5. **CSRF Protection**: Supabase Auth handles CSRF tokens automatically
6. **Input Validation**: UUID format validation for user IDs
7. **Function Security**: SECURITY DEFINER with explicit search_path

## Other Notes

### Abort Signal Handling
The search functions support AbortController for request cancellation:
```typescript
const controller = new AbortController()
const result = await searchQuestions(filters, cursor, controller.signal)
// Cancel request if needed
controller.abort()
```

### Error Classification
The `QueryError` class provides structured error information:
```typescript
class QueryError extends Error {
  constructor(
    message: string,
    public code: string,     // Machine-readable error code
    public details?: unknown // Original error details
  )
}
```

### Cache Isolation Strategy
User-specific data is scoped with user IDs in query keys to prevent cache leakage between users:
```typescript
queryKeys.user.subjects(userId) // ['user', userId, 'subjects']
```

### Database Migration Strategy
The `schema_version` table tracks database migrations, though the current implementation doesn't use a formal migration tool. Future improvements could integrate tools like Prisma Migrate or Supabase Migrations.

### Real-time Capabilities
While the current implementation doesn't use Supabase's real-time features, the client setup supports real-time subscriptions for future features like live question updates or collaborative features.
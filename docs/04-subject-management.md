# Subject Management Documentation

## Overview
The Subject Management system is a core feature that enables users to select, manage, and navigate between their enrolled subjects (courses) in the exam preparation application. It provides a hierarchical structure where subjects are organized by name and level (Higher/Ordinary), with seamless switching between different subject exam papers and personalized subject selection during onboarding and settings.

## Architecture
The system follows a client-server architecture with React components on the frontend, Next.js App Router for routing, and Supabase for backend data persistence. The design pattern emphasizes:
- **URL-based routing**: Dynamic routes using subject slugs for SEO-friendly URLs
- **Server-side data fetching**: Leveraging Next.js RSC for optimal performance
- **Optimistic UI updates**: Using React transitions for immediate feedback
- **Type-safe database operations**: Generated types from Supabase schema
- **Atomic transactions**: Database RPC functions ensure data consistency

## File Structure
```
src/
├── app/
│   ├── subject/[slug]/
│   │   ├── page.tsx              # Dynamic subject page with exam questions
│   │   └── not-found.tsx         # 404 handler for invalid subjects
│   └── dashboard/
│       └── settings/
│           ├── actions.ts        # Server actions for subject updates
│           └── components/
│               └── subject-section.tsx  # Subject management in settings
├── components/
│   ├── subjects/
│   │   ├── subject-card.tsx     # Individual subject selection card
│   │   ├── selected-subject-card.tsx  # Display card for selected subjects
│   │   └── subject-selector.tsx # Main subject selection component
│   ├── layout/
│   │   ├── subject-switcher.tsx # Sidebar subject switcher widget
│   │   └── subject-dropdown.tsx # Dropdown menu for subject navigation
│   └── onboarding/
│       └── subject-selection-step.tsx  # Onboarding subject selection
├── lib/
│   ├── hooks/
│   │   └── use-user-subjects.ts # React Query hook for user subjects
│   ├── utils/
│   │   ├── slug.ts              # Slug generation and parsing
│   │   └── subject-icons.ts     # Icon mapping for subjects
│   ├── supabase/
│   │   ├── queries.ts           # Server-side subject queries
│   │   └── queries-client.ts    # Client-side subject queries
│   └── types/
│       └── database.ts          # TypeScript types for subjects
```

## Core Components

### Subject Page Component (`/app/subject/[slug]/page.tsx`)
The main entry point for viewing subject-specific exam questions. Implements parallel data fetching for optimal performance.

```typescript
export default async function SubjectPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const subject = await getSubjectBySlug(resolvedParams.slug)
  
  if (!subject) {
    notFound()
  }

  // Parse filters early as it doesn't depend on other data
  const filters = parseSearchParams(resolvedSearchParams, subject.id)

  // Fetch all data in parallel for optimal performance
  const [topicsResult, yearsResult, questionNumbersResult, questionsResult] = 
    await Promise.allSettled([
      getTopics(subject.id),
      getAvailableYears(subject.id),
      getAvailableQuestionNumbers(subject.id),
      searchQuestions(filters)
    ])
```

### Subject Selector Component (`/components/subjects/subject-selector.tsx`)
A comprehensive subject selection interface with search, filtering, and real-time updates.

```typescript
export function SubjectSelector({ 
  subjects,
  initialSelectedIds = [],
  onSelectionChange,
  isDisabled = false,
  showSelectedPanel = true,
  className,
  actions
}: SubjectSelectorProps) {
  // Group subjects by name for display
  const groupedSubjects = useMemo(() => {
    const grouped = new Map<string, GroupedSubject>()
    
    subjects.forEach(subject => {
      const existing = grouped.get(subject.name) || { name: subject.name }
      
      if (subject.level === 'Higher') {
        existing.higher = subject
      } else if (subject.level === 'Ordinary') {
        existing.ordinary = subject
      }
      
      grouped.set(subject.name, existing)
    })
    
    return Array.from(grouped.values())
  }, [subjects])
```

### Subject Switcher Component (`/components/layout/subject-switcher.tsx`)
Sidebar widget for quick subject navigation with user context awareness.

```typescript
export function SubjectSwitcher({ subject }: SubjectSwitcherProps) {
  const { isMobile } = useSidebar()
  const { user } = useUserProfile()
  const { subjects, isLoading } = useUserSubjects(user?.id)
  
  const SubjectIcon = getSubjectIcon(subject.name)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg">
              <div className="bg-sidebar-primary flex aspect-square size-8">
                <SubjectIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm">
                <span className="truncate font-serif">{subject.name}</span>
                <span className="truncate text-xs">{subject.level} Level</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
```

## Data Flow

### Subject Selection Flow
1. User interacts with `SubjectSelector` component
2. Selection changes trigger `onSelectionChange` callback
3. Parent component calls server action `updateUserSubjects`
4. Server action validates user session and calls `saveUserSubjects`
5. Database RPC function `update_user_subjects` executes atomically
6. Cache invalidation triggers UI updates via `revalidatePath`

### Subject Navigation Flow
1. User clicks subject in `SubjectDropdown`
2. Router navigates to `/subject/[slug]` route
3. `getSubjectBySlug` parses slug to find subject
4. Subject data loads with parallel fetching of related data
5. `ExamSidebar` and `FilteredQuestionsView` render with subject context

## Key Functions and Hooks

### `useUserSubjects` Hook
Manages user's enrolled subjects with caching and real-time updates.

```typescript
export function useUserSubjects(userId: string | undefined): UseUserSubjectsReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: userId ? queryKeys.user.subjects(userId) : ['user-subjects-anonymous'],
    queryFn: async () => {
      if (!userId) {
        return []
      }
      
      // Get user subjects with built-in retry and error handling
      const userSubjects = await getUserSubjectsClient(userId)
      
      // Transform to include slugs for navigation
      return userSubjects.map(userSubject => ({
        ...userSubject.subject,
        slug: generateSlug(userSubject.subject)
      }))
    },
    enabled: !!userId,
    ...CACHE_TIMES.USER_DATA,
    retry: 1,
  })
```

### Slug Generation Functions
Converts between subject objects and URL-friendly slugs.

```typescript
export function generateSlug(subject: Subject): string {
  const name = subject.name.toLowerCase().replace(/\s+/g, '-')
  const level = subject.level.toLowerCase()
  return `${name}-${level}`
}

export function parseSlug(slug: string): { name: string; level: string } {
  const parts = slug.split('-')
  const level = parts[parts.length - 1]
  const name = parts.slice(0, -1).join(' ')
  
  return {
    name: name.charAt(0).toUpperCase() + name.slice(1),
    level: level.charAt(0).toUpperCase() + level.slice(1)
  }
}
```

## Integration Points

### Database Integration
- **Tables**: `subjects`, `user_subjects`
- **RPC Functions**: 
  - `get_user_subjects_sorted`: Fetches user's subjects ordered by name and level
  - `update_user_subjects`: Atomically updates user's subject selections
- **Row Level Security**: Ensures users can only manage their own subject selections

### Authentication Integration
- Subject management requires authenticated user session
- User ID from Supabase Auth links to `user_subjects` table
- Middleware protects subject routes from unauthorized access

### Query System Integration
- Subject ID serves as primary filter for question queries
- Topics are scoped to subjects via foreign key relationships
- Available years and question numbers filtered by subject

## Configuration

### Subject Icon Mapping
Maps subject names to Lucide React icons for consistent visual representation:

```typescript
const subjectIconMap: Record<string, LucideIcon> = {
  'Accounting': Calculator,
  'Agricultural Science': Leaf,
  'Applied Maths': Sigma,
  'Art': Palette,
  'Biology': Dna,
  'Business': Briefcase,
  'Chemistry': FlaskRound,
  // ... additional mappings
}
```

### Cache Configuration
Subject data cached with user-scoped keys to prevent data leakage:

```typescript
queryKeys.user.subjects(userId) // ['users', userId, 'subjects']
CACHE_TIMES.USER_DATA // { staleTime: 5 * 60 * 1000, cacheTime: 10 * 60 * 1000 }
```

## Type Definitions

### Core Subject Types
```typescript
export interface Subject {
  id: string
  name: string
  level: 'Higher' | 'Ordinary' | 'Foundation'
  created_at: string
}

export interface UserSubject {
  id: string
  user_id: string
  subject_id: string
  created_at: string | null
}

export interface UserSubjectWithSubject extends UserSubject {
  subject: Subject
}

interface SubjectWithSlug extends Subject {
  slug: string
}

interface GroupedSubject {
  name: string
  higher?: Subject
  ordinary?: Subject
}
```

## Implementation Details

### Subject Level Handling
The system distinguishes between Higher and Ordinary levels with distinct visual indicators:
- **Higher Level**: Salmon color (bg-salmon-500) - More challenging curriculum
- **Ordinary Level**: Sky blue color (bg-sky-500) - Standard curriculum
- **Visual Indicators**: Color-coded dots and badges throughout UI

### Subject Card Interaction Logic
```typescript
const handleSubjectToggle = useCallback((subject: Subject) => {
  if (isDisabled) return
  
  const newSelected = new Set(selectedSubjectIds)
  
  if (newSelected.has(subject.id)) {
    newSelected.delete(subject.id)
  } else {
    // Remove any other level of the same subject
    const otherLevelSubject = subjects.find(
      s => s.name === subject.name && s.id !== subject.id
    )
    if (otherLevelSubject) {
      newSelected.delete(otherLevelSubject.id)
    }
    newSelected.add(subject.id)
  }
  
  setSelectedSubjectIds(newSelected)
  onSelectionChange?.(Array.from(newSelected))
}, [selectedSubjectIds, subjects, isDisabled, onSelectionChange])
```

This ensures users can only select one level per subject, preventing conflicting selections.

### Database Transaction Safety
The `update_user_subjects` RPC function ensures atomicity:

```sql
BEGIN
  -- Delete all existing subjects for the user
  DELETE FROM user_subjects 
  WHERE user_id = p_user_id;
  
  -- Insert new subjects if array is not empty
  IF p_subject_ids IS NOT NULL AND array_length(p_subject_ids, 1) > 0 THEN
    INSERT INTO user_subjects (user_id, subject_id)
    SELECT p_user_id, unnest(p_subject_ids);
  END IF;
  
  -- Return success with count
  RETURN jsonb_build_object(
    'success', true,
    'count', COALESCE(array_length(p_subject_ids, 1), 0)
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Transaction automatically rolls back on any error
    RAISE;
END
```

### Search and Filter Implementation
The subject selector includes real-time search with optimized filtering:

```typescript
const filteredSubjects = useMemo(() => {
  if (!searchTerm) return groupedSubjects
  return groupedSubjects.filter(subject => 
    subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
}, [searchTerm, groupedSubjects])
```

## Dependencies

### External Dependencies
- **@tanstack/react-query**: v5 for server state management
- **lucide-react**: Icon library for subject visual indicators
- **@supabase/supabase-js**: Database client for subject operations
- **next/navigation**: Routing and navigation utilities

### Internal Dependencies
- **Auth System**: User authentication and session management
- **Query System**: Question filtering and search functionality
- **UI Components**: shadcn/ui components for consistent design
- **Cache Management**: Query key factories and cache timing configuration

## API Reference

### Server Actions

#### `updateUserSubjects(subjectIds: string[])`
Updates user's enrolled subjects.
- **Parameters**: Array of subject UUIDs
- **Returns**: `{ success: boolean } | { error: string }`
- **Side Effects**: Revalidates cache for dashboard and settings pages

### Database RPCs

#### `get_user_subjects_sorted(p_user_id: uuid)`
Fetches user's subjects sorted by name and level.
- **Returns**: Array of user_subjects with joined subject data
- **Security**: SECURITY DEFINER with RLS policies

#### `update_user_subjects(p_user_id: uuid, p_subject_ids: uuid[])`
Atomically replaces user's subject selections.
- **Returns**: JSON object with success status and count
- **Transaction**: Automatic rollback on error

### Hooks

#### `useUserSubjects(userId?: string)`
React Query hook for fetching user's enrolled subjects.
- **Returns**: `{ subjects: SubjectWithSlug[], isLoading: boolean, error: Error | null }`
- **Cache Key**: User-scoped for security isolation

## Other Notes

### Performance Optimizations
- **Parallel Data Fetching**: Subject page uses `Promise.allSettled` for concurrent data loading
- **Memoized Computations**: Heavy operations like grouping and filtering use `useMemo`
- **Optimistic Updates**: UI updates immediately while server operations complete
- **Query Caching**: TanStack Query provides intelligent cache management

### Accessibility Considerations
- **ARIA Labels**: Clear labels for interactive elements
- **Keyboard Navigation**: Full keyboard support in dropdowns and selectors
- **Focus Management**: Input focus restoration after clearing search
- **Color Contrast**: Level indicators meet WCAG AA standards

### Mobile Responsiveness
- **Responsive Grid**: Subject cards adjust from 2 columns to 1 on mobile
- **Touch Targets**: Minimum 44x44px touch areas for mobile interaction
- **Sidebar Behavior**: Collapsible sidebar with mobile-specific triggers
- **Scroll Areas**: Bounded scroll containers prevent layout issues

### Error Handling
- **Graceful Degradation**: Failed data fetches don't break the page
- **User Feedback**: Clear error messages for failed operations
- **Retry Logic**: Automatic retries with exponential backoff
- **Validation**: Client and server-side validation of inputs

### Security Measures
- **UUID Validation**: Regex validation of user IDs before database queries
- **RLS Policies**: Database-level security for multi-tenant isolation
- **Session Verification**: All mutations verify authenticated user
- **Cache Isolation**: Per-user query cache prevents data leakage
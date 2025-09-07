# Utilities & Helper Functions Documentation

## Overview
The application's utility layer provides a comprehensive set of helper functions, type-safe utilities, and configuration management tools. These utilities ensure consistent data handling, formatting, validation, and caching across the entire codebase. The utilities are organized into logical modules focusing on specific concerns like form validation, date formatting, URL management, and cache control.

## Architecture
The utility architecture follows a modular design pattern where each utility module handles a specific domain of functionality. All utilities are TypeScript-first with strict type safety, ensuring compile-time validation and better developer experience. The utilities layer acts as a foundation that other parts of the application build upon, providing consistent patterns for common operations.

## File Structure
```
src/lib/
├── utils.ts                        # Core utility function (cn for className merging)
├── utils/
│   ├── form-validation.ts          # Type-safe form data extraction and validation
│   ├── format-date.ts              # Date formatting utilities with SSR compatibility
│   ├── format-name.ts              # Name formatting with proper capitalization
│   ├── slug.ts                     # URL slug generation and parsing for subjects
│   ├── subject-icons.ts            # Subject-to-icon mapping for UI consistency
│   └── url-filters.ts              # URL parameter serialization for filters
├── cache/
│   └── cache-utils.ts              # React Query cache management utilities
├── auth/
│   └── client-auth.ts              # Client-side auth utilities with cache clearing
├── config/
│   └── cache.ts                    # Centralized cache timing configuration
├── errors.ts                       # Custom error classes for better error handling
└── queries/
    └── query-keys.ts               # Standardized query key factory for cache management
```

## Core Components

### Class Name Utility (cn)
The foundational utility for managing Tailwind CSS classes with conflict resolution:

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

This utility combines `clsx` for conditional class construction with `tailwind-merge` to intelligently merge Tailwind classes, resolving conflicts (e.g., `p-2 p-4` becomes `p-4`). It's used throughout all UI components for dynamic styling.

### Form Validation Utilities
Type-safe form data extraction with built-in validation rules:

```typescript
// src/lib/utils/form-validation.ts
export interface AuthFormData {
  email: string
  password: string
}

export function extractAuthFormData(formData: FormData): AuthFormData {
  const email = formData.get('email')
  const password = formData.get('password')
  
  // Validate email field
  if (!email || typeof email !== 'string') {
    throw new Error('Email is required and must be a string')
  }
  
  if (!email.includes('@')) {
    throw new Error('Please provide a valid email address')
  }
  
  // Validate password field
  if (!password || typeof password !== 'string') {
    throw new Error('Password is required and must be a string')
  }
  
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long')
  }
  
  return {
    email: email.trim(),
    password
  }
}
```

Additional helpers for flexible form field extraction:

```typescript
export function getFormField(formData: FormData, fieldName: string): string | null {
  const value = formData.get(fieldName)
  
  if (value === null || value === undefined) {
    return null
  }
  
  if (typeof value !== 'string') {
    console.warn(`FormData field ${fieldName} is not a string:`, value)
    return null
  }
  
  return value.trim()
}

export function getRequiredFormField(formData: FormData, fieldName: string): string {
  const value = getFormField(formData, fieldName)
  
  if (!value) {
    throw new Error(`${fieldName} is required`)
  }
  
  return value
}
```

## Data Flow

### Form Validation Flow
1. Form submission triggers server action
2. `extractAuthFormData` validates and extracts form data
3. Type-safe data is returned or validation error is thrown
4. Server action processes validated data
5. Error boundaries handle validation failures gracefully

### URL Filter State Management
1. User interacts with filter controls
2. `updateSearchParams` modifies URL parameters
3. URL state change triggers component re-render
4. `parseSearchParams` extracts filters from URL
5. Filters are applied to database queries

### Cache Management Flow
1. Query initiated with specific cache key
2. `getCacheConfig` determines cache timing based on data type
3. React Query manages cache lifecycle
4. `invalidateUserCache` clears user-specific data on auth changes
5. `clearAllCache` performs complete cache reset on sign-out

## Key Functions and Hooks

### Date Formatting Utilities
SSR-compatible date formatting with cached formatters for performance:

```typescript
// src/lib/utils/format-date.ts
// Cached formatters for performance (created once, reused)
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
})

export function formatDate(date: string | Date): string {
  return dateFormatter.format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return dateTimeFormatter.format(new Date(date))
}
```

The formatters are created once and reused, ensuring consistent output across server and client rendering while maintaining performance.

### Name Formatting and Normalization
Intelligent name formatting handling special cases like prefixes and cultural naming patterns:

```typescript
// src/lib/utils/format-name.ts
export function formatName(name: string): string {
  if (!name) return ''
  
  // Preserve intentional capitalization
  if (/[a-z][A-Z]/.test(name)) {
    return name
  }
  
  // Common prefixes that should remain lowercase
  const lowercasePrefixes = ['van', 'der', 'de', 'la', 'du', 'da', 'von', 'den', 'del', 'di', 'le']
  
  // Split by spaces and hyphens while keeping the delimiters
  const parts = name.split(/(\s+|-+)/)
  
  return parts.map((part, index) => {
    // Keep delimiters as-is
    if (/^[\s-]+$/.test(part)) return part
    
    const lowerPart = part.toLowerCase()
    
    // Check if this is a lowercase prefix (but not at the start of the name)
    if (index > 0 && lowercasePrefixes.includes(lowerPart)) {
      return lowerPart
    }
    
    // Handle O' and L' prefixes (O'Brien, L'Amour)
    if (/^[ol]'/i.test(lowerPart)) {
      return lowerPart.charAt(0).toUpperCase() + "'" + 
             lowerPart.charAt(2).toUpperCase() + 
             lowerPart.slice(3)
    }
    
    // Handle Mc and Mac prefixes (McDonald, MacLeod)
    if (/^mc/i.test(lowerPart) && lowerPart.length > 2) {
      return 'Mc' + lowerPart.charAt(2).toUpperCase() + lowerPart.slice(3)
    }
    if (/^mac/i.test(lowerPart) && lowerPart.length > 3) {
      return 'Mac' + lowerPart.charAt(3).toUpperCase() + lowerPart.slice(4)
    }
    
    // Standard title case
    return lowerPart.charAt(0).toUpperCase() + lowerPart.slice(1)
  }).join('')
}
```

### URL Filter Parameter Handling
Type-safe URL parameter serialization and deserialization for filter state:

```typescript
// src/lib/utils/url-filters.ts
const FILTER_PARAM_MAP = {
  searchTerms: 'q',
  topicIds: 'topics',
  years: 'years',
  examTypes: 'types',
  questionNumbers: 'questions',
} as const

export function parseSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
  subjectId: string
): Filters {
  const getValue = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) || undefined
    }
    const value = searchParams[key]
    return Array.isArray(value) ? value[0] : value
  }

  return {
    subjectId,
    searchTerms: deserializeFilterValue('searchTerms', getValue(FILTER_PARAM_MAP.searchTerms)),
    topicIds: deserializeFilterValue('topicIds', getValue(FILTER_PARAM_MAP.topicIds)),
    years: deserializeFilterValue('years', getValue(FILTER_PARAM_MAP.years)),
    examTypes: deserializeFilterValue('examTypes', getValue(FILTER_PARAM_MAP.examTypes)),
    questionNumbers: deserializeFilterValue('questionNumbers', getValue(FILTER_PARAM_MAP.questionNumbers)),
  }
}
```

## Integration Points

### UI Component Integration
All shadcn/ui components import the `cn` utility for consistent class merging:

```typescript
// Example from components/ui/button.tsx
import { cn } from "@/lib/utils"

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

### Server Action Integration
Form validation utilities integrate with Next.js server actions:

```typescript
// Example from app/auth/actions.ts
import { extractAuthFormData } from '@/lib/utils/form-validation'

export async function signUp(formData: FormData) {
  let email: string
  let password: string
  
  try {
    const validated = extractAuthFormData(formData)
    email = validated.email
    password = validated.password
  } catch (error) {
    // Handle validation error
  }
  
  // Process validated data
}
```

### Query Cache Integration
Cache utilities work with TanStack Query for state management:

```typescript
// Example cache invalidation on sign-out
import { clearAllCache } from '@/lib/cache/cache-utils'

export async function clientSignOut(queryClient: QueryClient) {
  // Clear all React Query cache first
  clearAllCache(queryClient)
  
  // Clear Supabase session
  const supabase = createClient()
  await supabase.auth.signOut()
  
  // Force reload to clear memory state
  window.location.href = '/'
}
```

## Configuration

### Cache Timing Configuration
Centralized cache timing based on data volatility:

```typescript
// src/lib/config/cache.ts
export const CACHE_TIMES = {
  // Static reference data that rarely changes
  STATIC_DATA: {
    staleTime: 30 * 60 * 1000,  // 30 minutes
    gcTime: 60 * 60 * 1000,      // 1 hour
  },
  // User-specific data
  USER_DATA: {
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime: 10 * 60 * 1000,      // 10 minutes
  },
  // Frequently changing data
  DYNAMIC_DATA: {
    staleTime: 60 * 1000,        // 1 minute
    gcTime: 5 * 60 * 1000,       // 5 minutes
  },
  // Topics data (semi-static)
  TOPICS: {
    staleTime: 10 * 60 * 1000,   // 10 minutes
    gcTime: 30 * 60 * 1000,      // 30 minutes
  },
  // Questions data
  QUESTIONS: {
    staleTime: 1 * 60 * 1000,    // 1 minute
    gcTime: 10 * 60 * 1000,      // 10 minutes
  },
} as const
```

### Query Key Factory Configuration
Standardized query keys for consistent cache management:

```typescript
// src/lib/queries/query-keys.ts
export const queryKeys = {
  // Public data queries (no user context needed)
  all: ['questions'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (filters: Filters) => [...queryKeys.lists(), filters] as const,
  infinite: (filters: Filters) => [...queryKeys.list(filters), 'infinite'] as const,
  subjects: () => ['subjects'] as const,
  subject: (slug: string) => [...queryKeys.subjects(), slug] as const,
  topics: (subjectId: string) => ['topics', subjectId] as const,
  years: (subjectId: string) => ['years', subjectId] as const,
  
  // User-specific queries (require user context)
  user: {
    profile: (userId: string) => ['user', userId, 'profile'] as const,
    subjects: (userId: string) => ['user', userId, 'subjects'] as const,
    preferences: (userId: string) => ['user', userId, 'preferences'] as const,
    progress: (userId: string) => ['user', userId, 'progress'] as const,
    admin: (userId: string) => ['user', userId, 'admin'] as const,
  },
}
```

## Type Definitions

### Error Handling Types
Custom error class for better error tracking:

```typescript
// src/lib/errors.ts
export class QueryError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'QueryError'
  }
}
```

### Form Validation Types
Type-safe form data interfaces:

```typescript
// src/lib/utils/form-validation.ts
export interface AuthFormData {
  email: string
  password: string
}
```

## Implementation Details

### Slug Generation for Routes
Subject slugs are generated combining name and level for unique URLs:

```typescript
// src/lib/utils/slug.ts
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

The slug system ensures SEO-friendly URLs while maintaining the ability to reconstruct the original subject information from the URL.

### Subject Icon System
Comprehensive icon mapping for visual subject identification:

```typescript
// src/lib/utils/subject-icons.ts
const subjectIconMap: Record<string, LucideIcon> = {
  'Accounting': Calculator,
  'Agricultural Science': Leaf,
  'Applied Maths': Sigma,
  'Art': Palette,
  'Biology': Dna,
  'Business': Briefcase,
  'Chemistry': FlaskRound,
  'Classical Studies': Scroll,
  'Computer Science': Code,
  'Construction Studies': HardHat,
  'Design & Communication Graphics': Ruler,
  'Economics': TrendingUp,
  'Engineering': Wrench,
  'English': BookOpen,
  'French': Globe2,
  'Geography': Globe,
  // ... and more
}

export function getSubjectIcon(subjectName: string): LucideIcon {
  return subjectIconMap[subjectName] || Book
}
```

### Cache Management Utilities
Comprehensive cache control for user session management:

```typescript
// src/lib/cache/cache-utils.ts
export async function invalidateUserCache(queryClient: QueryClient) {
  // Invalidate all queries that start with ['user']
  await queryClient.invalidateQueries({ queryKey: ['user'] })
  
  // Also invalidate the anonymous user profile query if it exists
  await queryClient.invalidateQueries({ queryKey: ['user-profile-anonymous'] })
  
  // Remove the invalidated queries from cache to force fresh data
  queryClient.removeQueries({ queryKey: ['user'] })
  queryClient.removeQueries({ queryKey: ['user-profile-anonymous'] })
}

export function clearAllCache(queryClient: QueryClient) {
  // Cancel all in-flight queries
  queryClient.cancelQueries()
  
  // Clear the entire cache
  queryClient.clear()
  
  // Reset default options to ensure clean state
  queryClient.setDefaultOptions({
    queries: {
      staleTime: 0,
      gcTime: 0,
    },
  })
}
```

## Dependencies
- **clsx**: ^2.0.0 - Conditional class construction
- **tailwind-merge**: ^2.0.0 - Intelligent Tailwind class merging
- **@tanstack/react-query**: ^5.0.0 - Cache management and state
- **lucide-react**: ^0.263.1 - Icon components for subject mapping
- **Next.js**: ^15.0.0 - Server actions and routing integration

## API Reference

### Core Utilities
- `cn(...inputs: ClassValue[]): string` - Merge class names with conflict resolution
- `formatName(name: string): string` - Format names with proper capitalization
- `formatInitials(name: string): string` - Extract and format initials from names
- `formatDate(date: string | Date): string` - Format date as DD/MM/YYYY
- `formatDateTime(date: string | Date): string` - Format date and time as DD/MM/YYYY, HH:MM:SS

### Form Validation
- `extractAuthFormData(formData: FormData): AuthFormData` - Extract and validate auth form data
- `getFormField(formData: FormData, fieldName: string): string | null` - Safely extract form field
- `getRequiredFormField(formData: FormData, fieldName: string): string` - Extract required form field

### URL Management
- `parseSearchParams(searchParams, subjectId): Filters` - Parse URL parameters to filters
- `buildFilterUrl(pathname: string, filters: Partial<Filters>): string` - Build URL with filter parameters
- `updateSearchParams(currentParams, updates): URLSearchParams` - Update URL search parameters

### Cache Management
- `invalidateUserCache(queryClient: QueryClient): Promise<void>` - Invalidate user-specific cache
- `clearAllCache(queryClient: QueryClient): void` - Clear entire cache
- `invalidateCacheByPattern(queryClient, pattern): Promise<void>` - Invalidate cache by pattern
- `resetQueryClient(queryClient: QueryClient): void` - Reset query client to initial state
- `getCacheStats(queryClient: QueryClient): object` - Get cache statistics

### Slug Management
- `generateSlug(subject: Subject): string` - Generate URL slug from subject
- `parseSlug(slug: string): { name: string; level: string }` - Parse slug to subject details

### Subject Icons
- `getSubjectIcon(subjectName: string): LucideIcon` - Get icon component for subject

## Other notes

### Performance Considerations
- Date formatters are cached and reused to avoid repeated instantiation
- URL parameter serialization uses type guards for runtime safety
- Cache invalidation is selective to avoid unnecessary refetches
- Form validation throws early for immediate feedback

### SSR Compatibility
- Date formatting uses deterministic `Intl.DateTimeFormat` for consistent server/client output
- Cache configuration considers hydration boundaries
- URL utilities work with both URLSearchParams and plain objects

### Error Handling Patterns
- Form validation throws descriptive errors for user feedback
- Type guards prevent runtime type errors
- Cache operations handle failures gracefully with fallbacks
- Custom QueryError class provides structured error information

### Security Considerations
- Form data is validated and sanitized before processing
- URL parameters are type-checked to prevent injection
- Cache isolation prevents cross-user data leakage
- Auth utilities ensure complete session cleanup
# Utility Functions Documentation

## Overview
The utility functions in this application provide essential helper methods for common operations including class name merging, slug generation, name formatting, form validation, URL filter management, icon mapping, query key management, and cache utilities. These utilities are centrally located in the `/src/lib/utils/` directory and are used throughout the application to maintain consistency and reduce code duplication.

## Architecture
The utility system is designed with modularity and type safety in mind. Each utility module focuses on a specific domain (e.g., formatting, validation, URL handling) and exports pure functions that can be easily tested and reused. All utilities are written in TypeScript with strict type checking to ensure compile-time safety and better developer experience.

## File Structure
```
src/
├── lib/
│   ├── utils.ts                    # Main utility (cn function for class merging)
│   ├── errors.ts                   # Error handling utilities
│   ├── utils/
│   │   ├── slug.ts                 # Slug generation and parsing
│   │   ├── format-name.ts          # Name formatting utilities
│   │   ├── form-validation.ts      # Form data extraction and validation
│   │   ├── subject-icons.ts        # Subject-to-icon mapping
│   │   └── url-filters.ts          # URL parameter serialization/deserialization
│   ├── cache/
│   │   └── cache-utils.ts          # React Query cache management
│   └── queries/
│       └── query-keys.ts           # React Query key factories
```

## Core Components

### 1. Class Name Merging (cn)
Located in `/src/lib/utils.ts`, the `cn` function combines `clsx` and `tailwind-merge` to handle class name composition with proper Tailwind CSS conflict resolution.

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Purpose**: This function solves the problem of conditional class application and Tailwind CSS class conflicts. When multiple Tailwind utilities that affect the same CSS property are present, `tailwind-merge` ensures only the last one takes effect.

**Usage Pattern**:
```typescript
// In components/ui/button.tsx
<Comp
  className={cn(buttonVariants({ variant, size, className }))}
  {...props}
/>
```

### 2. Slug Generation and Parsing
Located in `/src/lib/utils/slug.ts`, these functions handle URL-friendly slug creation from subject data.

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

**Purpose**: These functions create SEO-friendly URLs for subject pages and parse them back to retrieve subject information. The slug format follows the pattern `{subject-name}-{level}`.

**Implementation Details**:
- `generateSlug`: Converts spaces to hyphens and lowercases both name and level
- `parseSlug`: Assumes the last segment is the level, reconstructs the name with proper capitalization

### 3. Name Formatting
Located in `/src/lib/utils/format-name.ts`, provides intelligent name capitalization handling various cultural naming patterns.

```typescript
export function formatName(name: string): string {
  if (!name) return ''
  
  // Preserve intentional capitalization (e.g., "McDonald")
  if (/[a-z][A-Z]/.test(name)) {
    return name
  }
  
  const lowercasePrefixes = ['van', 'der', 'de', 'la', 'du', 'da', 'von', 'den', 'del', 'di', 'le']
  const parts = name.split(/(\s+|-+)/)
  
  return parts.map((part, index) => {
    // Handle special cases: O', Mc, Mac prefixes
    // Handle lowercase prefixes (van der Berg)
    // Standard title case for regular words
  }).join('')
}

export function formatInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
```

**Purpose**: Handles complex name formatting including:
- Irish names (O'Brien, McDonald, MacLeod)
- Dutch/German names (van der Berg, von Neumann)
- Preservation of intentional capitalization
- Generation of user initials for avatars

## Data Flow
The utility functions operate as pure functions in the data flow:

1. **Input Processing**: Raw data from forms, API responses, or user input
2. **Transformation**: Utilities transform data to required format
3. **Integration**: Transformed data used in components, queries, or navigation
4. **Output**: Formatted display or properly structured URLs/queries

Example flow for slug generation:
```
Subject Data → generateSlug() → URL Navigation → parseSlug() → Display Data
```

## Key Functions and Hooks

### Form Validation Utilities
Located in `/src/lib/utils/form-validation.ts`:

```typescript
export interface AuthFormData {
  email: string
  password: string
}

export function extractAuthFormData(formData: FormData): AuthFormData {
  const email = formData.get('email')
  const password = formData.get('password')
  
  // Validation logic with specific error messages
  if (!email.includes('@')) {
    throw new Error('Please provide a valid email address')
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long')
  }
  
  return { email: email.trim(), password }
}

export function getFormField(formData: FormData, fieldName: string): string | null
export function getRequiredFormField(formData: FormData, fieldName: string): string
```

**Purpose**: Type-safe extraction and validation of form data with proper error handling. Used in server actions for authentication.

### URL Filter Management
Located in `/src/lib/utils/url-filters.ts`:

```typescript
const FILTER_PARAM_MAP = {
  searchTerms: 'q',
  topicIds: 'topics',
  years: 'years',
  examTypes: 'types',
  questionNumbers: 'questions',
}

export function parseSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
  subjectId: string
): Filters

export function buildFilterUrl(pathname: string, filters: Partial<Filters>): string

export function updateSearchParams(
  currentParams: URLSearchParams,
  updates: Partial<Filters>
): URLSearchParams
```

**Purpose**: Manages URL state for filters, enabling shareable filtered views and browser history support. Uses comma-separated values for array parameters.

### Subject Icon Mapping
Located in `/src/lib/utils/subject-icons.ts`:

```typescript
import { Calculator, Leaf, Sigma, /* ... */ } from 'lucide-react'

const subjectIconMap: Record<string, LucideIcon> = {
  'Accounting': Calculator,
  'Agricultural Science': Leaf,
  'Applied Maths': Sigma,
  // ... 30+ subject mappings
}

export function getSubjectIcon(subjectName: string): LucideIcon {
  return subjectIconMap[subjectName] || Book
}
```

**Purpose**: Provides consistent visual representation for subjects across the application with a fallback to a default Book icon.

## Integration Points

### Authentication Flow Integration
```typescript
// In app/auth/actions.ts
import { extractAuthFormData } from '@/lib/utils/form-validation'

export async function signUp(formData: FormData) {
  try {
    const validated = extractAuthFormData(formData)
    // Use validated.email and validated.password
  } catch (error) {
    return { error: error.message }
  }
}
```

### Navigation Integration
```typescript
// In components/layout/subject-dropdown.tsx
import { generateSlug } from '@/lib/utils/slug'

const handleSubjectClick = (subject: Subject) => {
  const slug = generateSlug(subject)
  router.push(`/subject/${slug}`)
}
```

### Filter URL Integration
```typescript
// In hooks/use-filter-updates.ts
import { updateSearchParams } from '@/lib/utils/url-filters'

const updateUrl = useCallback((updates: Partial<Filters>) => {
  const newParams = updateSearchParams(searchParams, updates)
  router.push(query ? `${pathname}?${query}` : pathname)
}, [pathname, router, searchParams])
```

## Configuration
The utilities use several configuration constants:

- **Form Validation**: Minimum password length (6 characters)
- **Name Formatting**: List of lowercase prefixes for proper name handling
- **URL Filters**: Parameter name mappings for clean URLs
- **Subject Icons**: Complete mapping of all 30+ subjects to Lucide icons

## Type Definitions

### Core Types
```typescript
// From lib/types/database.ts
export interface Subject {
  id: string
  name: string
  level: 'Higher' | 'Ordinary' | 'Foundation'
  created_at: string
}

export interface Filters {
  subjectId: string
  searchTerms?: string[]
  years?: number[]
  topicIds?: string[]
  examTypes?: string[]
  questionNumbers?: number[]
}
```

### Utility-Specific Types
```typescript
// Form validation
export interface AuthFormData {
  email: string
  password: string
}

// Class name merging
type ClassValue = string | number | null | undefined | ClassValue[]
```

## Implementation Details

### Cache Management Utilities
Located in `/src/lib/cache/cache-utils.ts`:

```typescript
export async function invalidateUserCache(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['user-profile'] }),
    queryClient.invalidateQueries({ queryKey: ['user-subjects'] }),
    // ... other user queries
  ])
}

export function clearAllCache(queryClient: QueryClient) {
  queryClient.cancelQueries()
  queryClient.clear()
  queryClient.setDefaultOptions({ queries: { staleTime: 0, gcTime: 0 } })
}

export function getCacheStats(queryClient: QueryClient) {
  const cache = queryClient.getQueryCache()
  const queries = cache.getAll()
  return {
    totalQueries: queries.length,
    staleQueries: queries.filter(q => q.isStale()).length,
    // ... other stats
  }
}
```

**Purpose**: Manages React Query cache lifecycle, especially important for authentication state changes to prevent data leakage between users.

### Query Key Factories
Located in `/src/lib/queries/query-keys.ts`:

```typescript
export const queryKeys = {
  // Public data queries
  subjects: () => ['subjects'] as const,
  subject: (slug: string) => [...queryKeys.subjects(), slug] as const,
  topics: (subjectId: string) => ['topics', subjectId] as const,
  
  // User-specific queries
  user: {
    profile: (userId: string) => ['user', userId, 'profile'] as const,
    subjects: (userId: string) => ['user', userId, 'subjects'] as const,
  }
}

export function scopeWithUser(userId: string | null, baseKey: readonly unknown[]) {
  if (!userId) return baseKey
  return ['user', userId, ...baseKey] as const
}
```

**Purpose**: Provides consistent query key generation for React Query, ensuring proper cache invalidation and user-scoped data isolation.

### Error Handling
Located in `/src/lib/errors.ts`:

```typescript
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

**Purpose**: Custom error class for better error handling and debugging with additional context (error codes and details).

## Dependencies
- **clsx** (^2.1.1): Conditional class name construction
- **tailwind-merge** (^2.5.5): Intelligent Tailwind class merging
- **lucide-react** (^0.468.0): Icon library for subject icons
- **@tanstack/react-query** (^5.62.11): Cache management utilities
- **TypeScript** (^5): Type definitions and compile-time safety

## API Reference

### cn(...inputs: ClassValue[])
Merges class names with Tailwind conflict resolution.
- **Parameters**: Variable number of class values (strings, arrays, objects)
- **Returns**: Merged class string with conflicts resolved

### generateSlug(subject: Subject): string
Generates URL-friendly slug from subject.
- **Parameters**: Subject object with name and level
- **Returns**: Hyphenated lowercase slug

### parseSlug(slug: string): { name: string; level: string }
Parses slug back to subject components.
- **Parameters**: URL slug string
- **Returns**: Object with formatted name and level

### formatName(name: string): string
Formats name with proper capitalization.
- **Parameters**: Raw name string
- **Returns**: Properly formatted name

### formatInitials(name: string): string
Extracts initials from name.
- **Parameters**: Full name string
- **Returns**: Uppercase initials (max 2 characters)

### extractAuthFormData(formData: FormData): AuthFormData
Validates and extracts authentication form data.
- **Parameters**: FormData object from form submission
- **Returns**: Validated email and password
- **Throws**: Error with specific validation message

### parseSearchParams(searchParams, subjectId): Filters
Deserializes URL parameters to filter object.
- **Parameters**: URLSearchParams or param object, subject ID
- **Returns**: Complete Filters object

### getSubjectIcon(subjectName: string): LucideIcon
Returns appropriate icon for subject.
- **Parameters**: Subject name string
- **Returns**: Lucide icon component

## Other notes

### Performance Considerations
- All utility functions are pure and stateless, making them highly performant
- The `cn` function uses memoization internally via tailwind-merge
- Cache utilities provide statistics for monitoring performance
- URL filter functions use efficient string operations

### Security Considerations
- Form validation includes sanitization (trimming) and validation
- Error messages avoid exposing sensitive information
- Cache clearing on logout prevents data leakage between users
- Type safety prevents common runtime errors

### Testing Recommendations
- Unit test each utility function with edge cases
- Test name formatting with international names
- Validate slug generation/parsing round trips
- Ensure form validation catches all invalid inputs
- Test cache invalidation patterns

### Common Pitfalls
- Remember that `parseSlug` assumes the last hyphenated segment is the level
- The `cn` function requires both clsx and tailwind-merge to work properly
- Form validation throws errors that must be caught in server actions
- Cache utilities are async and should be awaited
- URL filters use comma separation for array values
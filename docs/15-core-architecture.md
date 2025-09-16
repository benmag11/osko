# Core Architecture & Infrastructure Documentation

## Overview

This Next.js 15 application is a sophisticated exam paper viewing platform built with a modern, security-first architecture. The system enables students to browse, filter, and study past exam papers with a focus on performance, user experience, and data security. The application leverages Next.js App Router, Supabase for backend services, and a carefully orchestrated state management system to deliver a seamless educational experience.

## Architecture

The application follows a layered architecture pattern with clear separation of concerns:

- **Presentation Layer**: React 19 components with Next.js 15 App Router
- **State Management Layer**: TanStack Query v5 with user-scoped caching and context-based UI state
- **Authentication Layer**: Supabase Auth with SSR support and middleware protection
- **Data Access Layer**: Supabase PostgreSQL with Row Level Security (RLS)
- **Storage Abstraction Layer**: Generic storage hooks with graceful degradation
- **Infrastructure Layer**: Vercel deployment-ready with edge optimization

### Design Patterns Used

1. **Server-First Rendering**: Prioritizes server components with selective client-side interactivity
2. **Cache Isolation Pattern**: Per-user QueryClient instances prevent data leakage
3. **Middleware Authentication**: Route-level protection before request processing
4. **Provider Hierarchy Pattern**: Context providers wrap feature-specific pages for scoped state
5. **Storage Abstraction Pattern**: Generic hooks for storage with validation and fallback mechanisms
6. **Layout-Based Protection**: Admin routes protected via route group layouts
7. **GPU-Accelerated Transforms**: CSS transforms for performant UI animations
8. **Error Boundary Pattern**: Graceful error handling at multiple levels
9. **Mobile-First Optimization**: Feature exclusion and conditional rendering based on device capabilities

### Architectural Rationale

- **Next.js 15 App Router**: Chosen for server components, streaming SSR, and improved performance
- **Supabase**: Provides authentication, database, and real-time capabilities in one platform
- **TanStack Query**: Offers powerful caching with request deduplication and background refetching
- **TypeScript Strict Mode**: Ensures type safety across the entire codebase
- **Context-Based State**: Lightweight state management for UI features without external dependencies
- **SessionStorage Persistence**: Preserves user preferences within browser sessions

## File Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with providers
│   ├── error.tsx                # Page-level error boundary
│   ├── global-error.tsx         # Application-level error boundary
│   ├── page.tsx                 # Landing page
│   ├── auth/                    # Authentication pages
│   │   ├── signin/page.tsx      # Sign in page
│   │   ├── signup/page.tsx      # Sign up page
│   │   ├── verify/page.tsx      # Email verification
│   │   ├── callback/route.ts    # OAuth callback handler
│   │   ├── actions.ts           # Server actions for auth
│   │   └── oauth-actions.ts     # OAuth-specific actions
│   ├── dashboard/               # Protected dashboard area
│   │   ├── layout.tsx           # Dashboard layout with sidebar
│   │   ├── (admin)/            # Admin-only routes (route group)
│   │   │   ├── layout.tsx      # Admin verification wrapper
│   │   │   └── reports/        # Admin reports functionality
│   │   ├── study/              # Main study interface
│   │   ├── statistics/         # User statistics
│   │   ├── settings/           # User settings
│   │   └── about/              # About page
│   ├── subject/[slug]/         # Dynamic subject pages
│   └── onboarding/             # User onboarding flow
├── components/
│   └── providers/
│       ├── providers.tsx        # QueryClient and session providers
│       ├── auth-provider.tsx    # Authentication context
│       └── zoom-provider.tsx    # Zoom context for subject pages
├── lib/
│   ├── supabase/
│   │   ├── server.ts           # Server-side Supabase client
│   │   ├── client.ts           # Browser Supabase client
│   │   ├── queries.ts          # Server-side database queries
│   │   ├── client-queries.ts   # Client-side query hooks
│   │   ├── admin-actions.ts    # Admin server actions
│   │   └── admin-context.ts    # Admin verification utilities
│   ├── config/
│   │   └── cache.ts            # Cache configuration
│   ├── cache/
│   │   └── cache-utils.ts      # Cache management utilities
│   ├── queries/
│   │   └── query-keys.ts       # Query key factory
│   ├── hooks/
│   │   ├── use-session-storage.ts  # Generic session storage hook
│   │   └── use-mobile.ts       # Mobile detection hook
│   └── utils/
│       └── storage.ts          # Storage utility functions
└── middleware.ts               # Authentication middleware
```

## Core Components

### Root Layout (`src/app/layout.tsx`)

The root layout initializes the application with server-side session hydration and global providers:

```typescript
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get initial session server-side for proper hydration
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  return (
    <html lang="en" className={`${sourceSerif.variable} ${sourceSans.variable}`}>
      <body className="font-sans">
        <Providers initialSession={session}>
          {children}
        </Providers>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
```

### Middleware (`src/middleware.ts`)

The middleware handles authentication and routing logic before requests reach page components:

```typescript
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Cookie management logic
        },
      },
    }
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Route protection logic
  if (!user && (isProtectedPage || isOnboardingPage)) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
  
  // Onboarding status verification
  if (user && isProtectedPage && !isOnboardingPage) {
    const userProfile = await getProfile()
    if (!userProfile || !userProfile.onboarding_completed) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Providers Component (`src/components/providers/providers.tsx`)

Implements user-scoped query client isolation for security:

```typescript
function makeQueryClient(userId?: string) {
  const client = new QueryClient({
    ...QUERY_CONFIG,
    defaultOptions: {
      ...QUERY_CONFIG.defaultOptions,
      queries: {
        ...QUERY_CONFIG.defaultOptions?.queries,
        staleTime: userId ? QUERY_CONFIG.defaultOptions?.queries?.staleTime : 0,
        gcTime: userId ? QUERY_CONFIG.defaultOptions?.queries?.gcTime : 0,
      },
    },
  })
  
  if (userId) {
    Object.defineProperty(client, '__userId', {
      value: userId,
      writable: false,
      enumerable: false,
      configurable: true
    })
  }
  
  return client
}

const queryClientMap = new Map<string, QueryClient>()

function getQueryClient(userId?: string) {
  if (typeof window === 'undefined') {
    return makeQueryClient(userId)
  }
  
  const clientKey = userId || 'anonymous'
  
  if (!queryClientMap.has(clientKey)) {
    // Clean up old clients when creating a new one
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

## Data Flow

### Authentication Flow

1. **Initial Load**: Server-side session retrieval in root layout
2. **Session Hydration**: Session passed to client providers
3. **Auth State Listener**: Client-side listener for auth changes
4. **Cache Management**: Cache cleared on user change/logout
5. **Route Protection**: Middleware validates auth state per request

### Data Fetching Flow

1. **Query Initiation**: Component uses query hook with user-scoped key
2. **Cache Check**: TanStack Query checks user-specific cache
3. **Server Request**: If stale/missing, request to Supabase
4. **RLS Enforcement**: Database applies row-level security
5. **Response Caching**: Data cached with user scope
6. **UI Update**: Component re-renders with fresh data

## Key Functions and Hooks

### Authentication Provider (`src/components/providers/auth-provider.tsx`)

```typescript
const handleAuthChange = useCallback(
  async (event: AuthChangeEvent, newSession: Session | null) => {
    const newUserId = newSession?.user?.id ?? null
    const userChanged = previousUserId !== null && previousUserId !== newUserId
    
    switch (event) {
      case 'SIGNED_OUT':
        clearAllCache(queryClient)
        setUser(null)
        setSession(null)
        setPreviousUserId(null)
        router.push('/')
        break
        
      case 'SIGNED_IN':
      case 'TOKEN_REFRESHED':
        if (userChanged) {
          clearAllCache(queryClient)
        }
        setUser(newSession?.user ?? null)
        setSession(newSession)
        setPreviousUserId(newUserId)
        break
    }
  },
  [queryClient, router, previousUserId]
)
```

### Cache Management (`src/lib/cache/cache-utils.ts`)

```typescript
export function clearAllCache(queryClient: QueryClient) {
  queryClient.cancelQueries()
  queryClient.clear()
  queryClient.setDefaultOptions({
    queries: {
      staleTime: 0,
      gcTime: 0,
    },
  })
}

export function getUserScopedKey(userId: string, baseKey: string[]) {
  return ['user', userId, ...baseKey]
}
```

## Integration Points

### Supabase Integration

- **Authentication**: OAuth and email/password auth flows
- **Database**: PostgreSQL with RLS for data security
- **Storage**: Image storage for exam papers
- **Real-time**: Potential for live updates (infrastructure ready)

### External Services

- **Vercel**: Deployment platform with edge functions
- **Google OAuth**: Third-party authentication provider
- **Image CDN**: Supabase storage with Next.js Image optimization

## Configuration

### Environment Variables

```bash
# Required environment variables
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
```

### Cache Configuration (`src/lib/config/cache.ts`)

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
}
```

### Build Configuration (`next.config.ts`)

```typescript
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

## Type Definitions

### TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Database Types

Generated from Supabase schema and imported as:
```typescript
import type { Database } from '@/lib/types/database'
```

## Implementation Details

### Error Boundaries

**Page-Level Error Boundary** (`src/app/error.tsx`):
```typescript
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  )
}
```

**Global Error Boundary** (`src/app/global-error.tsx`):
- Catches errors that escape page boundaries
- Provides minimal UI without dependencies
- Uses inline styles to avoid CSS loading issues

### Provider Hierarchy Pattern

**ZoomProvider** (`src/components/providers/zoom-provider.tsx`):

The ZoomProvider demonstrates the provider hierarchy pattern, wrapping specific pages with feature-specific context:

```typescript
export function ZoomProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  const isEnabled = isMobile === false // Only enable on desktop

  // Use sessionStorage hook with validation
  const [zoomLevel, setStoredZoom, isLoading] = useSessionStorage<ZoomLevel>({
    key: STORAGE_KEY,
    defaultValue: DEFAULT_ZOOM,
    validator: isValidZoomLevel,
  })

  // Keyboard shortcuts (desktop only)
  useEffect(() => {
    if (!isEnabled || isLoading) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      // Handle zoom shortcuts...
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEnabled, isLoading, increaseZoom, decreaseZoom, resetZoom])

  return (
    <ZoomContext.Provider value={contextValue}>
      {children}
    </ZoomContext.Provider>
  )
}
```

**Integration in Subject Pages**:
```typescript
// src/app/subject/[slug]/page.tsx
export default async function SubjectPage({ params, searchParams }: PageProps) {
  // ... data fetching ...

  return (
    <ZoomProvider>
      <SidebarProvider defaultOpen>
        {/* Page content */}
      </SidebarProvider>
    </ZoomProvider>
  )
}
```

### Storage Abstraction Layer

**Generic SessionStorage Hook** (`src/lib/hooks/use-session-storage.ts`):

This hook provides a robust abstraction for browser storage with graceful degradation:

```typescript
export function useSessionStorage<T>({
  key,
  defaultValue,
  validator,
}: UseSessionStorageOptions<T>): [T, (value: T) => void, boolean] {
  const [storedValue, setStoredValue] = useState<T>(defaultValue)
  const [isLoading, setIsLoading] = useState(true)
  const [isAvailable, setIsAvailable] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    try {
      // Test storage availability
      const testKey = '__test__'
      window.sessionStorage.setItem(testKey, 'test')
      window.sessionStorage.removeItem(testKey)
      setIsAvailable(true)

      // Load and validate existing value
      const item = window.sessionStorage.getItem(key)
      if (item !== null) {
        const parsed = JSON.parse(item)
        if (!validator || validator(parsed)) {
          setStoredValue(parsed)
        } else {
          // Invalid data, clear it
          window.sessionStorage.removeItem(key)
        }
      }
    } catch (error) {
      // Storage not available (e.g., incognito mode)
      console.warn(`SessionStorage not available for key "${key}":`, error)
      setIsAvailable(false)
    } finally {
      setIsLoading(false)
    }
  }, [key, defaultValue, validator])

  // Returns in-memory value if storage fails
  return [storedValue, setValue, isLoading]
}
```

**Storage Utilities** (`src/lib/utils/storage.ts`):
```typescript
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
```

### Admin Authentication Centralization

**Admin Context** (`src/lib/supabase/admin-context.ts`):

Centralized admin verification with React cache for request deduplication:

```typescript
import { cache } from 'react'

// Cached admin verification - only checks once per request
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

  // Use cached function to avoid multiple DB queries
  const isAdmin = await getCachedAdminStatus(user.id)

  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  return user.id
}
```

**Admin Layout Protection** (`src/app/dashboard/(admin)/layout.tsx`):
```typescript
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient()

  // Single admin verification for all admin routes
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!profile?.is_admin) {
    // Non-admin users are redirected to the main dashboard
    redirect('/dashboard/study')
  }

  // Admin verified - render children
  return <>{children}</>
}
```

## Dependencies

### Core Dependencies
- **next**: 15.4.6 - React framework with App Router
- **react**: 19.1.0 - UI library
- **react-dom**: 19.1.0 - React DOM renderer
- **typescript**: ^5 - Type safety

### Data & State
- **@supabase/ssr**: ^0.6.1 - SSR-compatible Supabase client
- **@supabase/supabase-js**: ^2.55.0 - Supabase JavaScript client
- **@tanstack/react-query**: ^5.85.0 - Data fetching and caching

### UI Components
- **@radix-ui/***: Various - Headless UI components
- **tailwindcss**: ^4.1.12 - Utility-first CSS framework
- **clsx**: ^2.1.1 - Conditional class names
- **tailwind-merge**: ^3.3.1 - Merge Tailwind classes

## API Reference

### Supabase Database Tables

1. **subjects**: Course subjects with levels
2. **topics**: Subject topics for categorization
3. **questions**: Exam questions with metadata
4. **question_topics**: Many-to-many relationship
5. **user_profiles**: User profile data
6. **user_subjects**: User's selected subjects
7. **question_audit_log**: Change tracking
8. **question_reports**: User-submitted issues

### Database Functions

- `search_questions_paginated`: Paginated question search
- `get_available_years`: Available years per subject

## Performance Patterns

### GPU-Accelerated Transforms

The application uses CSS transforms for performant UI animations, particularly in the zoom feature:

```typescript
// src/components/questions/filtered-questions-view.tsx
<div
  className="origin-top transition-transform duration-200 ease-out"
  style={{
    transform: isEnabled && !isZoomLoading ? `scale(${zoomLevel})` : undefined,
    transformOrigin: 'top center',
  }}
>
  {/* Content */}
</div>
```

**Performance Benefits**:
- **GPU Acceleration**: `transform: scale()` is GPU-accelerated by modern browsers
- **No Reflow**: Transform doesn't trigger layout recalculation
- **Smooth Animations**: 60fps animations without jank
- **Battery Efficient**: Hardware acceleration reduces CPU usage

### Mobile-First Optimization

Features are conditionally enabled based on device capabilities:

```typescript
// src/components/providers/zoom-provider.tsx
export function ZoomProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  const isEnabled = isMobile === false // Only enable on desktop

  // Desktop-only keyboard shortcuts
  useEffect(() => {
    if (!isEnabled || isLoading) return
    // Add keyboard listeners only on desktop
  }, [isEnabled, isLoading])
}
```

**Mobile Detection Hook** (`src/lib/hooks/use-mobile.ts`):
```typescript
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const checkMobile = () => window.innerWidth < MOBILE_BREAKPOINT

    setIsMobile(checkMobile())

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)

    mql.addEventListener("change", handleChange)
    return () => mql.removeEventListener("change", handleChange)
  }, [])

  return isMobile // undefined during SSR, boolean after hydration
}
```

## Other Notes

### Performance Optimizations

1. **Turbopack**: Development build optimization via `--turbopack` flag
2. **Image Optimization**: Next.js Image component with AVIF/WebP formats
3. **Code Splitting**: Automatic at route boundaries
4. **Streaming SSR**: Progressive rendering with Suspense boundaries
5. **Query Deduplication**: TanStack Query prevents duplicate requests
6. **GPU-Accelerated Transforms**: Use CSS `transform: scale()` for zoom without reflows
7. **Conditional Feature Loading**: Desktop-only features excluded on mobile devices
8. **Request Caching**: React `cache()` for deduplicating admin checks

### Security Architecture

1. **Row Level Security (RLS)**: Database-level access control
2. **User Session Isolation**: Separate QueryClient per user
3. **CSRF Protection**: Built into Supabase Auth
4. **Environment Variable Protection**: Server-only secrets
5. **Cookie Security**: Secure, httpOnly, sameSite settings

### Error Handling Improvements

The application implements multiple layers of error handling with graceful degradation:

The application uses comprehensive error handling patterns with type-safe validation and graceful degradation for robust operation.

**Fallback Mechanisms**:
- Storage failures fall back to in-memory state
- Invalid stored data falls back to defaults
- Missing features gracefully degrade on unsupported devices

### Development Workflow

1. **Hot Module Replacement**: Via Turbopack
2. **Type Checking**: TypeScript strict mode
3. **Linting**: ESLint with Next.js rules
4. **Error Reporting**: Console logging in development
5. **Environment Management**: .env.local for local development
6. **Storage Testing**: Automatic detection and fallback for restricted environments

### Deployment Considerations

1. **Platform**: Optimized for Vercel deployment
2. **Edge Functions**: Middleware runs at edge
3. **Static Generation**: Where possible for performance
4. **Dynamic Imports**: For code splitting
5. **Environment Variables**: Required for Supabase connection

### Monitoring and Logging

Currently uses console logging for errors. In production, consider:
- Error tracking service (Sentry, LogRocket)
- Performance monitoring (Vercel Analytics)
- User session replay tools
- Custom logging infrastructure

### Recent Architectural Improvements

The architecture has been enhanced with several key patterns that improve robustness and maintainability:

1. **Provider Hierarchy Pattern**: Feature-specific providers (like ZoomProvider) wrap only the pages that need them, reducing bundle size and improving code organization.

2. **Storage Abstraction Layer**: Generic hooks for browser storage with automatic fallback to in-memory state when storage is unavailable (e.g., incognito mode).

3. **Admin Authentication Centralization**: Single source of truth for admin verification using React's `cache()` to prevent duplicate database queries within the same request.

4. **Performance Patterns**: GPU-accelerated CSS transforms for smooth animations, mobile-first optimization with feature exclusion, and request deduplication.

5. **Error Handling Improvements**: Multi-layered error handling with graceful degradation, type-safe validation, and automatic fallback mechanisms.

These patterns work together to create a more resilient system that gracefully handles edge cases while maintaining excellent performance across all devices.

### Future Architecture Considerations

The architecture is designed to support:
- Real-time features via Supabase subscriptions
- Offline support with service workers
- Progressive Web App capabilities
- Internationalization (i18n)
- A/B testing infrastructure
- Advanced caching strategies
- WebAssembly integration for compute-intensive tasks
- Edge computing with Vercel Edge Functions
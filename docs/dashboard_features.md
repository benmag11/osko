# Dashboard Features Documentation

## Overview
The dashboard is the central hub of the application, providing authenticated users with access to their study materials, statistics, and settings. It features a collapsible sidebar navigation system, user profile management, and subject-based study routing. The dashboard serves as the primary interface after user authentication and onboarding completion.

## Architecture
The dashboard follows a modular architecture using Next.js App Router with server-side rendering for initial data fetching and client components for interactivity. It implements a hierarchical layout system with nested routes, leveraging React Server Components for optimal performance. The architecture ensures user data isolation through session-scoped query clients and implements row-level security at the database level.

## File Structure
```
src/app/dashboard/
├── layout.tsx                    # Main dashboard layout with sidebar
├── page.tsx                       # Dashboard index (redirects to /study)
├── study/
│   ├── page.tsx                  # Server component for study page
│   └── study-page-client.tsx    # Client component for study interface
├── statistics/
│   └── page.tsx                  # Statistics page (placeholder)
└── settings/
    └── page.tsx                  # Settings page (placeholder)

src/components/layout/
├── app-sidebar.tsx               # Collapsible sidebar navigation
├── nav-user.tsx                  # User profile dropdown in sidebar
└── dashboard-breadcrumb.tsx     # Dynamic breadcrumb navigation

src/lib/hooks/
├── use-user-profile.ts           # User profile data fetching
├── use-user-subjects.ts          # User subjects management
└── use-is-admin.ts              # Admin role detection

src/lib/auth/
└── client-auth.ts               # Client-side auth utilities

src/lib/cache/
└── cache-utils.ts               # Cache management utilities

src/components/providers/
├── providers.tsx                # Query client provider with user isolation
└── auth-provider.tsx            # Authentication context provider
```

## Core Components

### Dashboard Layout (`dashboard/layout.tsx`)
The root layout component that wraps all dashboard pages with consistent navigation and structure.

```tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider 
      defaultOpen
      style={{
        "--sidebar-width": "12.5rem",
      } as React.CSSProperties}
    >
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" />
            <DashboardBreadcrumb />
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
```

### Study Page (`dashboard/study/page.tsx`)
Server component that fetches user data and subjects before rendering the study interface.

```tsx
export default async function StudyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Parallel data fetching for performance
  const [profileResult, userSubjects] = await Promise.all([
    supabase.from('user_profiles').select('name').eq('user_id', user.id).single(),
    getUserSubjects(user.id)
  ])
  
  const subjectsWithSlugs = userSubjects.map(userSubject => ({
    id: userSubject.subject.id,
    name: userSubject.subject.name,
    level: userSubject.subject.level,
    slug: generateSlug(userSubject.subject)
  }))
  
  return <StudyPageClient userName={userName} subjects={subjectsWithSlugs} />
}
```

### Study Page Client (`dashboard/study/study-page-client.tsx`)
Interactive client component displaying subject cards with dynamic greeting.

```tsx
export function StudyPageClient({ userName, subjects }: StudyPageClientProps) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {subjects.map((subject) => (
        <Link href={`/subject/${subject.slug}`}>
          <Card className="p-4 hover:border-stone-500">
            {/* Subject card content */}
          </Card>
        </Link>
      ))}
    </div>
  )
}
```

### App Sidebar (`components/layout/app-sidebar.tsx`)
Collapsible sidebar with navigation items and user profile section.

```tsx
const navItems = [
  { title: 'Study', url: '/dashboard/study', icon: BookOpen },
  { title: 'Statistics', url: '/dashboard/statistics', icon: BarChart3 },
  { title: 'Settings', url: '/dashboard/settings', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {/* Logo with responsive text */}
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton isActive={pathname === item.url}>
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
```

## Data Flow

### Authentication Flow
1. Middleware (`middleware.ts`) validates user session on each request
2. Checks onboarding completion status from `user_profiles` table
3. Redirects unauthenticated users to `/auth/signin`
4. Redirects incomplete onboarding to `/onboarding`
5. Allows access to dashboard routes for authenticated, onboarded users

### User Data Loading
1. Server component fetches user session via Supabase auth
2. Parallel queries fetch user profile and enrolled subjects
3. Data transformed with slugs for routing
4. Client component receives processed data as props
5. React Query caches user data with session-scoped keys

### Cache Management
The application implements sophisticated cache isolation per user session:

```tsx
// providers.tsx - User-specific QueryClient creation
function makeQueryClient(userId?: string) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: userId ? CACHE_TIMES.USER_DATA.staleTime : 0,
        gcTime: userId ? CACHE_TIMES.USER_DATA.gcTime : 0,
      },
    },
  })
  
  // Tag client with user ID for debugging
  if (userId) {
    Object.defineProperty(client, '__userId', { value: userId })
  }
  
  return client
}
```

## Key Functions and Hooks

### useUserProfile Hook
Fetches and caches user profile data with automatic session validation.

```tsx
export function useUserProfile(): UseUserProfileReturn {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  
  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user?.id ?? null)
      }
    )
    return () => subscription.unsubscribe()
  }, [supabase])
  
  const { data, isLoading, error } = useQuery({
    queryKey: userId ? queryKeys.user.profile(userId) : ['user-profile-anonymous'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      // Validate session before fetching
      if (!session || session.expires_at * 1000 < Date.now()) {
        return { user: null, profile: null }
      }
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
      
      return { user: session.user, profile }
    },
    enabled: !!userId,
    ...CACHE_TIMES.USER_DATA,
  })
  
  return { user: data?.user ?? null, profile: data?.profile ?? null, isLoading, error }
}
```

### useUserSubjects Hook
Manages user's enrolled subjects with slug generation for navigation.

```tsx
export function useUserSubjects(userId: string | undefined): UseUserSubjectsReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: userId ? queryKeys.user.subjects(userId) : ['user-subjects-anonymous'],
    queryFn: async () => {
      if (!userId) return []
      
      const userSubjects = await getUserSubjectsClient(userId)
      
      // Transform to include slugs for navigation
      return userSubjects.map(userSubject => ({
        ...userSubject.subject,
        slug: generateSlug(userSubject.subject)
      }))
    },
    enabled: !!userId,
    ...CACHE_TIMES.USER_DATA,
  })
  
  return { subjects: data ?? [], isLoading, error }
}
```

### clientSignOut Function
Secure sign-out with complete cache clearing.

```tsx
export async function clientSignOut(queryClient: QueryClient) {
  try {
    // 1. Clear all React Query cache first
    clearAllCache(queryClient)
    
    // 2. Clear client-side Supabase session
    const supabase = createClient()
    await supabase.auth.signOut()
    
    // 3. Force reload to clear in-memory state
    window.location.href = '/'
  } catch (error) {
    console.error('Error during sign-out:', error)
    window.location.href = '/'
  }
}
```

## Integration Points

### Authentication Middleware
The middleware intercepts all dashboard routes and validates authentication:

```tsx
// middleware.ts
const isProtectedPage = request.nextUrl.pathname.startsWith('/dashboard')

if (!user && isProtectedPage) {
  return NextResponse.redirect(new URL('/auth/signin', request.url))
}

if (user && isProtectedPage) {
  const userProfile = await getProfile()
  
  if (!userProfile || !userProfile.onboarding_completed) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }
}
```

### Subject Navigation
Dashboard integrates with subject pages through slug-based routing:

```tsx
// Study page generates slugs
const slug = generateSlug(subject) // e.g., "mathematics-higher"

// Links route to subject pages
<Link href={`/subject/${subject.slug}`}>
```

### User Profile System
Integration with NavUser component for profile display and actions:

```tsx
export function NavUser() {
  const { user, profile } = useUserProfile()
  const queryClient = useQueryClient()
  
  const handleSignOut = async () => {
    await clientSignOut(queryClient)
  }
  
  return (
    <DropdownMenu>
      <Avatar>
        <AvatarFallback>{formatInitials(profile?.name)}</AvatarFallback>
      </Avatar>
      <DropdownMenuItem onClick={handleSignOut}>
        <LogOut /> Log out
      </DropdownMenuItem>
    </DropdownMenu>
  )
}
```

## Configuration

### Cache Configuration
Defined in `lib/config/cache.ts`:

```tsx
export const CACHE_TIMES = {
  USER_DATA: {
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime: 10 * 60 * 1000,      // 10 minutes
  },
  STATIC_DATA: {
    staleTime: 30 * 60 * 1000,  // 30 minutes
    gcTime: 60 * 60 * 1000,      // 1 hour
  },
}
```

### Sidebar Configuration
Width and collapse behavior configured in layout:

```tsx
<SidebarProvider 
  defaultOpen
  style={{ "--sidebar-width": "12.5rem" }}
>
```

### Navigation Items
Centralized navigation configuration in app-sidebar:

```tsx
const navItems = [
  { title: 'Study', url: '/dashboard/study', icon: BookOpen },
  { title: 'Statistics', url: '/dashboard/statistics', icon: BarChart3 },
  { title: 'Settings', url: '/dashboard/settings', icon: Settings },
]
```

## Type Definitions

### User Profile Types
```typescript
interface UserProfile {
  id: string
  user_id: string
  name: string
  onboarding_completed: boolean | null
  is_admin: boolean
  created_at: string | null
  updated_at: string | null
}

interface UseUserProfileReturn {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  error: Error | null
}
```

### Subject Types
```typescript
interface Subject {
  id: string
  name: string
  level: 'Higher' | 'Ordinary' | 'Foundation'
  created_at: string
}

interface SubjectWithSlug extends Subject {
  slug: string
}

interface UserSubjectWithSubject extends UserSubject {
  subject: Subject
}
```

### Study Page Props
```typescript
interface StudyPageClientProps {
  userName: string
  subjects: SubjectWithSlug[]
}
```

## Implementation Details

### Dynamic Greeting System
The study page implements time-based greetings:

```tsx
const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
// Displays: "Good morning, John."
```

### Name Formatting
Sophisticated name formatting handles various patterns:

```tsx
export function formatName(name: string): string {
  // Handles O'Brien, McDonald, van der Berg patterns
  const lowercasePrefixes = ['van', 'der', 'de', 'la', 'du']
  
  // Special handling for Mc and Mac prefixes
  if (/^mc/i.test(lowerPart) && lowerPart.length > 2) {
    return 'Mc' + lowerPart.charAt(2).toUpperCase() + lowerPart.slice(3)
  }
}
```

### Session Expiry Monitoring
Auth provider checks session validity every minute:

```tsx
useEffect(() => {
  const checkSessionExpiry = () => {
    if (session?.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000)
      if (new Date() >= expiresAt) {
        clearAllCache(queryClient)
        router.push('/auth/signin')
      }
    }
  }
  
  const interval = setInterval(checkSessionExpiry, 60000)
  return () => clearInterval(interval)
}, [session])
```

### Cache Isolation Strategy
Each user gets an isolated QueryClient instance:

```tsx
const queryClientMap = new Map<string, QueryClient>()

function getQueryClient(userId?: string) {
  const clientKey = userId || 'anonymous'
  
  if (!queryClientMap.has(clientKey)) {
    // Clear other user clients to prevent memory leaks
    for (const [key, client] of queryClientMap.entries()) {
      if (key !== clientKey) {
        client.clear()
        queryClientMap.delete(key)
      }
    }
    queryClientMap.set(clientKey, makeQueryClient(userId))
  }
  
  return queryClientMap.get(clientKey)!
}
```

## Dependencies

### External Dependencies
- `@supabase/supabase-js`: Authentication and database client
- `@tanstack/react-query`: Server state management
- `lucide-react`: Icon components for navigation
- `next/navigation`: Next.js routing utilities

### Internal Dependencies
- `@/lib/supabase/server`: Server-side Supabase client
- `@/lib/supabase/queries`: Database query functions
- `@/components/ui/*`: shadcn/ui components
- `@/lib/utils/*`: Utility functions for formatting and slugs

## API Reference

### Database Functions

#### get_user_subjects_sorted
Returns user's enrolled subjects sorted alphabetically.
```sql
Args: p_user_id uuid
Returns: TABLE(
  id uuid,
  user_id uuid,
  subject_id uuid,
  created_at timestamp,
  subject jsonb
)
```

### Row Level Security Policies

#### user_profiles Table
- `Users can view own profile`: SELECT where `auth.uid() = user_id`
- `Users can update own profile`: UPDATE where `auth.uid() = user_id`
- `Users can insert own profile`: INSERT where `auth.uid() = user_id`

#### user_subjects Table
- `Users can manage own subjects`: ALL operations where `auth.uid() = user_id`
- `Users can view own subjects`: SELECT where `auth.uid() = user_id`

## Other Notes

### Placeholder Pages
Statistics and Settings pages are currently placeholders displaying "Coming soon". These are structured to maintain consistent layout while features are under development.

### Admin Detection
The `useIsAdmin` hook provides admin role detection by checking the `is_admin` field in user_profiles. This enables conditional rendering of admin-only features.

### Error Handling
All data fetching includes retry logic with exponential backoff:
```tsx
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
  // Don't retry on client errors (4xx)
  if (status >= 400 && status < 500) throw error
  
  // Exponential backoff
  await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
}
```

### Responsive Design
The sidebar collapses to icon-only mode on smaller screens, with tooltip support for navigation items. Subject cards use responsive grid layout adapting from 1 column on mobile to 3 columns on desktop.
# User Dashboard Documentation

## Overview
The User Dashboard is the central hub of the application after authentication, providing users with personalized access to study materials, settings, statistics, and platform information. It serves as the main navigation point for authenticated users, featuring a collapsible sidebar layout with responsive design and role-based access control for admin features.

## Architecture

### High-Level Design
The dashboard follows a nested layout architecture using Next.js App Router with server-side rendering for data fetching and client-side interactivity where needed. The architecture implements:
- **Protected Route Pattern**: Middleware-based authentication checks before rendering
- **Layout Composition**: Nested layouts for dashboard wrapper and admin sections
- **Server-First Data Fetching**: Initial data loaded on server, with client-side caching via TanStack Query
- **Role-Based Access Control**: Admin routes protected at both middleware and layout levels
- **Responsive Sidebar Navigation**: Collapsible sidebar with mobile sheet overlay

### Design Patterns Used
- **Provider Pattern**: SidebarProvider manages sidebar state across dashboard
- **Compound Component Pattern**: Sidebar components work together (Sidebar, SidebarMenu, SidebarMenuItem)
- **Server Components by Default**: Only using client components for interactivity
- **Optimistic UI Updates**: Settings changes reflect immediately with server sync

## File Structure

### Core Dashboard Files
- `src/app/dashboard/layout.tsx` - Main dashboard layout wrapper with sidebar
- `src/app/dashboard/page.tsx` - Dashboard index (redirects to study)
- `src/app/dashboard/study/page.tsx` - Server component for study page
- `src/app/dashboard/study/study-page-client.tsx` - Client component for study UI
- `src/app/dashboard/statistics/page.tsx` - Statistics page (placeholder)
- `src/app/dashboard/about/page.tsx` - About page with features timeline
- `src/app/dashboard/settings/page.tsx` - Settings server component
- `src/app/dashboard/settings/settings-client.tsx` - Settings client wrapper

### Admin Section
- `src/app/dashboard/(admin)/layout.tsx` - Admin authentication wrapper
- `src/app/dashboard/(admin)/reports/page.tsx` - Reports management page
- `src/app/dashboard/(admin)/reports/reports-client.tsx` - Reports client UI

### Layout Components
- `src/components/layout/app-sidebar.tsx` - Main sidebar navigation component
- `src/components/layout/dashboard-page.tsx` - Dashboard page wrapper
- `src/components/layout/dashboard-breadcrumb.tsx` - Breadcrumb navigation
- `src/components/layout/nav-user.tsx` - User dropdown in sidebar footer

### About Page Components
- `src/app/dashboard/about/components/subject-status-table.tsx` - Subject availability table
- `src/app/dashboard/about/components/future-features-timeline.tsx` - Animated features timeline

### Settings Components
- `src/app/dashboard/settings/components/name-section.tsx` - Name management
- `src/app/dashboard/settings/components/email-section.tsx` - Email management
- `src/app/dashboard/settings/components/password-section.tsx` - Password change
- `src/app/dashboard/settings/components/subject-section.tsx` - Subject selection
- `src/app/dashboard/settings/components/change-email-dialog.tsx` - Email change modal
- `src/app/dashboard/settings/actions.ts` - Server actions for settings

### Supporting Files
- `src/lib/hooks/use-user-profile.ts` - User profile data hook
- `src/lib/hooks/use-is-admin.ts` - Admin status detection hook
- `src/lib/utils/format-name.ts` - Name formatting utilities
- `src/lib/utils/subject-icons.ts` - Subject icon mapping
- `src/lib/auth/client-auth.ts` - Client-side auth utilities

## Core Components

### Dashboard Layout
The main dashboard layout provides the wrapper for all dashboard pages:

```tsx
// src/app/dashboard/layout.tsx
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

### App Sidebar
The sidebar component manages navigation with role-based filtering:

```tsx
// src/components/layout/app-sidebar.tsx
const navItems: NavItem[] = [
  { title: 'Study', url: '/dashboard/study', icon: BookOpen },
  { title: 'Statistics', url: '/dashboard/statistics', icon: BarChart3 },
  { title: 'Reports', url: '/dashboard/reports', icon: Flag, adminOnly: true },
  { title: 'Settings', url: '/dashboard/settings', icon: Settings },
  { title: 'About', url: '/dashboard/about', icon: Info },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { isAdmin } = useIsAdmin()
  
  // Filter nav items based on admin status
  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin)
  
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {/* Logo with text that hides when collapsed */}
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {filteredNavItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === item.url}
                tooltip={item.title}
              >
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

### User Authentication Flow
1. Middleware checks authentication status via Supabase session
2. Unauthenticated users redirected to `/auth/signin`
3. Authenticated users checked for onboarding completion
4. Incomplete onboarding redirects to `/onboarding`
5. Completed users access dashboard routes

### Profile Data Management
The user profile is fetched and cached using TanStack Query:

```tsx
// src/lib/hooks/use-user-profile.ts
export function useUserProfile() {
  const { data, isLoading, error } = useQuery({
    queryKey: userId ? queryKeys.user.profile(userId) : ['user-profile-anonymous'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return { user: null, profile: null }
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      return { user: session.user, profile }
    },
    ...CACHE_TIMES.USER_DATA,
    enabled: !!userId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}
```

### Subject Data Flow
1. Server fetches user subjects from `user_subjects` table
2. Subjects enriched with metadata from `subjects` table
3. Slugs generated for URL routing
4. Data passed to client components as props

## Key Functions and Hooks

### useIsAdmin Hook
Determines if current user has admin privileges:

```tsx
// src/lib/hooks/use-is-admin.ts
export function useIsAdmin() {
  const { profile, isLoading } = useUserProfile()
  
  return {
    isAdmin: profile?.is_admin ?? false,
    isLoading,
  }
}
```

### clientSignOut Function
Handles secure sign-out with cache clearing:

```tsx
// src/lib/auth/client-auth.ts
export async function clientSignOut(queryClient: QueryClient) {
  // 1. Clear all React Query cache first
  clearAllCache(queryClient)
  
  // 2. Clear client-side Supabase session
  const supabase = createClient()
  await supabase.auth.signOut()
  
  // 3. Force reload to clear in-memory state
  window.location.href = '/'
}
```

### formatName Utility
Handles proper name capitalization with special cases:

```tsx
// src/lib/utils/format-name.ts
export function formatName(name: string): string {
  // Handles O'Brien, McDonald, van der Berg patterns
  // Preserves intentional capitalization
  // Processes prefixes like 'van', 'de', 'la'
}
```

## Integration Points

### Supabase Integration
The dashboard integrates with Supabase for:
- **Authentication**: Session management and user verification
- **User Profiles**: Storing name, onboarding status, admin flag
- **User Subjects**: Many-to-many relationship for subject selection
- **Reports System**: Admin-only access to user reports
- **Row Level Security**: Policies enforce data access rules

### Database Schema
Key tables for dashboard functionality:

```sql
-- User profiles with admin flag
user_profiles (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  name text,
  onboarding_completed boolean DEFAULT false,
  is_admin boolean DEFAULT false
)

-- User subject selections
user_subjects (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  subject_id uuid REFERENCES subjects(id)
)

-- RLS Policies
"Users can view own profile" - (auth.uid() = user_id)
"Users can manage own subjects" - (auth.uid() = user_id)
"Admins can view all reports" - EXISTS (is_admin = true)
```

### Middleware Protection
Routes protected at middleware level:

```tsx
// src/middleware.ts
const isProtectedPage = 
  request.nextUrl.pathname.startsWith('/subject/') ||
  request.nextUrl.pathname.startsWith('/dashboard')

if (!user && isProtectedPage) {
  return NextResponse.redirect(new URL('/auth/signin', request.url))
}

// Check onboarding for authenticated users
if (user && isProtectedPage && !isOnboardingPage) {
  const userProfile = await getProfile()
  if (!userProfile?.onboarding_completed) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }
}
```

## Configuration

### Sidebar Configuration
```tsx
const SIDEBAR_WIDTH = "12.5rem"  // Via CSS variable
const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"
```

### Cache Configuration
User data cached with specific timeouts:
```tsx
CACHE_TIMES.USER_DATA = {
  staleTime: 5 * 60 * 1000,  // 5 minutes
  gcTime: 10 * 60 * 1000,     // 10 minutes
}
```

## Type Definitions

### User Profile Type
```tsx
interface UserProfile {
  user_id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  onboarding_completed: boolean
  is_admin: boolean
  created_at: string
  updated_at: string
}
```

### Navigation Item Type
```tsx
interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  adminOnly?: boolean
}
```

### Subject with Slug Type
```tsx
interface SubjectWithSlug {
  id: string
  name: string
  level: string
  slug: string
}
```

## Implementation Details

### Study Page Implementation
The study page shows personalized greeting and subject cards:

```tsx
// src/app/dashboard/study/study-page-client.tsx
export function StudyPageClient({ userName, subjects }) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <DashboardPage maxWidth="max-w-6xl">
      <h1 className="text-6xl font-serif">
        {getGreeting()}, {userName}.
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject) => (
          <Link href={`/subject/${subject.slug}`}>
            <Card className="p-4 hover:border-stone-500">
              <Icon className="h-7 w-7" />
              <h3>{subject.name}</h3>
              <p>{subject.level} Level</p>
            </Card>
          </Link>
        ))}
      </div>
    </DashboardPage>
  )
}
```

### About Page Features Timeline
Animated timeline using Framer Motion:

```tsx
// src/app/dashboard/about/components/future-features-timeline.tsx
const timelineData: TimelineItem[] = [
  { title: 'Filter past exam', date: 'September 1st', status: 'complete' },
  { title: 'Practice Exam Mode', date: 'Q2 2025', status: 'in-progress' },
  { title: 'Mobile App Launch', date: 'Q1 2026', status: 'future' }
]

// Uses motion.div for scroll-triggered animations
// Animated center line with progress indicator
// Staggered entry animations for timeline items
```

### Admin Route Protection
Admin routes use nested layout for centralized protection:

```tsx
// src/app/dashboard/(admin)/layout.tsx
export default async function AdminLayout({ children }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/auth/signin')
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()
  
  if (!profile?.is_admin) redirect('/dashboard/study')
  
  return <>{children}</>
}
```

## Dependencies

### External Dependencies
- **@supabase/ssr**: Server-side Supabase client
- **@tanstack/react-query**: Data fetching and caching
- **framer-motion**: Animation library for timeline
- **lucide-react**: Icon library for navigation
- **@radix-ui/react-slot**: Slot component for sidebar

### Internal Dependencies
- **Supabase clients**: Server and browser clients
- **UI components**: shadcn/ui sidebar, card, button components
- **Utility functions**: Name formatting, slug generation
- **Custom hooks**: User profile, admin detection

## API Reference

### Server Actions

#### updateUserName
Updates user's display name:
```tsx
async function updateUserName(formData: FormData) {
  const name = formData.get('name')
  await supabase.from('user_profiles')
    .update({ name })
    .eq('user_id', user.id)
}
```

#### updateUserSubjects
Updates user's subject selections:
```tsx
async function updateUserSubjects(subjectIds: string[]) {
  await supabase.rpc('update_user_subjects', {
    p_user_id: user.id,
    p_subject_ids: subjectIds
  })
}
```

### Database Functions

#### get_user_subjects_sorted
Returns user's subjects ordered by name:
```sql
SELECT s.* FROM subjects s
JOIN user_subjects us ON s.id = us.subject_id
WHERE us.user_id = $1
ORDER BY s.name
```

#### get_report_statistics
Returns admin statistics for reports:
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
  COUNT(*) as total
FROM question_reports
```

## Other Notes

### Mobile Responsiveness
- Sidebar collapses to hamburger menu on mobile
- Uses Sheet component for mobile sidebar overlay
- Responsive grid layouts for subject cards
- Touch-optimized interaction targets

### Performance Optimizations
- Server-side data fetching reduces client requests
- User-scoped query caching prevents data leakage
- Parallel data fetching in server components
- Optimistic UI updates for settings changes

### Accessibility Features
- ARIA labels on navigation elements
- Keyboard navigation support (Tab, Enter, Escape)
- Focus management in dialogs and sheets
- Semantic HTML structure throughout

### Security Considerations
- RLS policies enforce data access at database level
- Admin routes double-protected (middleware + layout)
- User ID validation in all queries
- Session expiry checks in profile hook

### Future Extensibility
The dashboard architecture supports easy addition of new pages through the navigation configuration. Admin-only routes can be added with the `adminOnly` flag, and the sidebar automatically adjusts based on user role.
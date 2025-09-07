# Layout & Navigation Documentation

## Overview
The Layout & Navigation system in this Next.js application provides a responsive, hierarchical layout structure with collapsible sidebars, mobile-optimized navigation, and context-aware routing. The system uses Next.js App Router's nested layouts combined with shadcn/ui's sidebar components to create a seamless navigation experience across desktop and mobile devices.

## Architecture

### Layout Hierarchy
The application uses a three-tier layout architecture leveraging Next.js's nested layouts:

1. **Root Layout** (`/src/app/layout.tsx`) - Global application wrapper
2. **Dashboard Layout** (`/src/app/dashboard/layout.tsx`) - Protected dashboard areas
3. **Admin Layout** (`/src/app/dashboard/(admin)/layout.tsx`) - Admin-only sections
4. **Subject Layout** (inline in `/src/app/subject/[slug]/page.tsx`) - Subject exam viewer

### Design Patterns
- **Composite Layout Pattern**: Nested layouts inherit from parent layouts
- **Provider Pattern**: Context providers manage sidebar state and authentication
- **Responsive First**: Mobile and desktop layouts handled by the same components
- **Server-Side Authentication**: Session validation happens at the layout level
- **Role-Based Access Control**: Admin routes protected by dedicated layout wrapper

## File Structure

```
src/
├── app/
│   ├── layout.tsx                           # Root layout with providers
│   ├── dashboard/
│   │   ├── layout.tsx                       # Dashboard layout with AppSidebar
│   │   └── (admin)/
│   │       └── layout.tsx                   # Admin-only layout wrapper
│   └── subject/[slug]/
│       └── page.tsx                         # Subject page with ExamSidebar
├── components/
│   ├── layout/
│   │   ├── app-sidebar.tsx                  # Main dashboard sidebar
│   │   ├── exam-sidebar.tsx                 # Subject exam sidebar
│   │   ├── mobile-navbar.tsx                # Mobile header navigation
│   │   ├── floating-sidebar-trigger.tsx     # Desktop floating toggle
│   │   ├── dashboard-breadcrumb.tsx         # Breadcrumb navigation
│   │   ├── nav-user.tsx                     # User menu component
│   │   ├── nav-filters.tsx                  # Filter navigation for exams
│   │   ├── subject-switcher.tsx             # Subject selector in sidebar
│   │   ├── subject-dropdown.tsx             # Subject dropdown menu
│   │   └── dashboard-page.tsx               # Page wrapper component
│   ├── ui/
│   │   ├── sidebar.tsx                      # Core sidebar components
│   │   └── collapsible-sidebar-menu-button.tsx # Collapsible menu button
│   └── landing/
│       └── navigation.tsx                   # Landing page navigation
├── lib/
│   └── hooks/
│       ├── use-mobile.ts                    # Mobile detection hook
│       ├── use-is-admin.ts                  # Admin role detection
│       └── use-user-profile.ts              # User profile data hook
└── middleware.ts                            # Auth & routing middleware
```

## Core Components

### Root Layout
The root layout establishes the application foundation with fonts, providers, and session initialization:

```tsx
// src/app/layout.tsx
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

### Dashboard Layout
The dashboard layout implements the primary navigation structure with collapsible sidebar:

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

### AppSidebar Component
The main application sidebar with navigation items and admin-only routes:

```tsx
// src/components/layout/app-sidebar.tsx
const navItems: NavItem[] = [
  {
    title: 'Study',
    url: '/dashboard/study',
    icon: BookOpen,
  },
  {
    title: 'Statistics',
    url: '/dashboard/statistics',
    icon: BarChart3,
  },
  {
    title: 'Reports',
    url: '/dashboard/reports',
    icon: Flag,
    adminOnly: true,  // Admin-only route
  },
  // ... more items
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { isAdmin } = useIsAdmin()
  
  // Filter nav items based on admin status
  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="mb-1">
        {/* Logo with collapsible text */}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
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
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
```

### ExamSidebar Component
Specialized sidebar for subject exam pages with filters:

```tsx
// src/components/layout/exam-sidebar.tsx
export function ExamSidebar({ 
  subject,
  topics, 
  years, 
  questionNumbers,
  filters,
  ...props 
}: ExamSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SubjectSwitcher subject={subject} />
      </SidebarHeader>
      <SidebarContent>
        <NavFilters 
          topics={topics} 
          years={years} 
          questionNumbers={questionNumbers} 
          filters={filters} 
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
```

## Data Flow

### Session Management
Session data flows from server to client through the layout hierarchy:

1. Root layout fetches session server-side
2. Session passed to Providers component
3. AuthProvider distributes session to child components
4. Components access session via useUserProfile hook

```tsx
// Session flow
RootLayout (SSR fetch) 
  → Providers (initialSession prop)
    → AuthProvider (context distribution)
      → Child components (useUserProfile hook)
```

### Navigation State Management
The sidebar state is managed through React Context:

```tsx
// src/components/ui/sidebar.tsx
const SidebarContext = React.createContext<SidebarContextProps | null>(null)

type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean | undefined
  toggleSidebar: () => void
}
```

State persistence uses cookies:
```tsx
// Cookie persistence for sidebar state
document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
```

## Key Functions and Hooks

### useIsMobile Hook
Detects mobile viewport with proper hydration handling:

```tsx
// src/lib/hooks/use-mobile.ts
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkMobile = () => window.innerWidth < MOBILE_BREAKPOINT
    setIsMobile(checkMobile())
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    
    mql.addEventListener("change", handleChange)
    return () => mql.removeEventListener("change", handleChange)
  }, [])

  return isMobile  // undefined during SSR, boolean after hydration
}
```

### useIsAdmin Hook
Determines admin access rights:

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

### toggleSidebar Function
Handles sidebar toggle with mobile/desktop differentiation:

```tsx
const toggleSidebar = React.useCallback(() => {
  return isMobile === true 
    ? setOpenMobile((open) => !open) 
    : setOpen((open) => !open)
}, [isMobile, setOpen, setOpenMobile])
```

## Integration Points

### Middleware Integration
The middleware handles authentication and routing protection:

```tsx
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const isProtectedPage = request.nextUrl.pathname.startsWith('/subject/') ||
                         request.nextUrl.pathname.startsWith('/dashboard')
  
  // Redirect unauthenticated users
  if (!user && isProtectedPage) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
  
  // Check onboarding status
  if (user && isProtectedPage && !profile?.onboarding_completed) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }
}
```

### Router Integration
Navigation uses Next.js router for programmatic navigation:

```tsx
// Subject switching example
const router = useRouter()
const handleSubjectClick = (slug: string) => {
  router.push(`/subject/${slug}`)
}
```

## Configuration

### Sidebar Configuration
Default sidebar settings and dimensions:

```tsx
const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7  // 7 days
const SIDEBAR_WIDTH = "25rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"  // Cmd+B to toggle
```

### Mobile Breakpoint
Mobile detection breakpoint:

```tsx
const MOBILE_BREAKPOINT = 1024  // px, matches lg: breakpoint
```

### Style Variables
CSS custom properties for sidebar styling:

```css
--sidebar-width: 25rem;
--sidebar-width-icon: 3rem;
--sidebar: theme colors defined in tailwind.config.ts
```

## Type Definitions

### Navigation Types
```tsx
interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  adminOnly?: boolean
}

interface SidebarContextProps {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean | undefined
  toggleSidebar: () => void
}

interface ExamSidebarProps extends React.ComponentProps<typeof Sidebar> {
  subject: Subject
  topics: Topic[]
  years: number[]
  questionNumbers: number[]
  filters: Filters
}
```

## Implementation Details

### Sidebar Collapse Behavior
The sidebar implements intelligent collapse with icon-only mode:

1. **Desktop**: Collapses to icon-only view (3rem width)
2. **Mobile**: Opens as overlay sheet
3. **State Persistence**: Uses cookies to remember user preference
4. **Keyboard Shortcut**: Cmd/Ctrl+B toggles sidebar
5. **Rail Interaction**: Click sidebar rail to toggle state

### Mobile Navigation Flow
Mobile navigation uses a sheet overlay pattern:

```tsx
// Mobile sidebar renders as Sheet component
if (isMobile) {
  return (
    <Sheet open={openMobile} onOpenChange={setOpenMobile}>
      <SheetContent className="w-(--sidebar-width) p-0">
        {children}
      </SheetContent>
    </Sheet>
  )
}
```

### Breadcrumb Generation
Dynamic breadcrumb based on current route:

```tsx
const getPageName = () => {
  const segments = pathname.split('/')
  const lastSegment = segments[segments.length - 1]
  
  switch(lastSegment) {
    case 'study': return 'Study'
    case 'statistics': return 'Statistics'
    case 'settings': return 'Settings'
    default: return 'Dashboard'
  }
}
```

### Subject Switching
Subject switcher enables quick navigation between enrolled subjects:

1. Fetches user's enrolled subjects
2. Displays current subject with icon
3. Dropdown shows all subjects with active state
4. Includes "Back to dashboard" option
5. Routes to `/subject/[slug]` on selection

## Dependencies

### External Dependencies
- **@radix-ui/react-slot**: Slot component for composition
- **@radix-ui/react-dropdown-menu**: Dropdown menu primitives
- **class-variance-authority**: Variant styling utilities
- **lucide-react**: Icon library
- **@tanstack/react-query**: Data fetching and caching

### Internal Dependencies
- **Supabase clients**: Authentication and data fetching
- **Custom hooks**: useIsMobile, useIsAdmin, useUserProfile
- **UI components**: Button, Sheet, Tooltip, ScrollArea
- **Utils**: cn (className merger), formatName, generateSlug

## API Reference

### SidebarProvider Props
```tsx
interface SidebarProviderProps {
  defaultOpen?: boolean        // Initial open state (default: true)
  open?: boolean               // Controlled open state
  onOpenChange?: (open: boolean) => void  // Open state change handler
  style?: React.CSSProperties  // Custom CSS properties
  children: React.ReactNode
}
```

### Sidebar Props
```tsx
interface SidebarProps {
  side?: "left" | "right"     // Sidebar position
  variant?: "sidebar" | "floating" | "inset"  // Visual variant
  collapsible?: "offcanvas" | "icon" | "none"  // Collapse behavior
  className?: string
  children: React.ReactNode
}
```

### useSidebar Hook API
```tsx
function useSidebar(): {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean | undefined
  toggleSidebar: () => void
}
```

## Other Notes

### Performance Optimizations
- Server-side session fetching prevents authentication flicker
- Parallel data fetching in layouts using Promise.allSettled
- Query client isolation per user prevents cache leakage
- Mobile detection uses MediaQueryList for efficient updates

### Accessibility Features
- ARIA labels on all interactive elements
- Keyboard navigation support (Tab, Enter, Space)
- Screen reader announcements for state changes
- Focus management in dropdown menus
- Semantic HTML structure

### Edge Cases Handled
- **Hydration Mismatch**: Mobile state starts as undefined to prevent SSR issues
- **Session Expiry**: Automatic redirect to signin on expired sessions
- **Admin Route Protection**: Double-layer protection (middleware + layout)
- **Empty States**: Graceful handling of no subjects or failed data fetches
- **Cookie Persistence**: 7-day expiry for sidebar state preference

### Mobile-Specific Behaviors
- Fixed header with hamburger menu at 56px height
- Sidebar opens as full-screen overlay
- Touch gestures not implemented (potential enhancement)
- Automatic close on navigation (via router events)
- Logo in mobile header links to dashboard

### Desktop-Specific Features
- Floating sidebar trigger follows sidebar edge
- Hover states on sidebar rail for discoverability
- Tooltip hints when sidebar is collapsed
- Keyboard shortcut (Cmd/Ctrl+B) for power users
- Smooth width transitions (200ms ease-linear)
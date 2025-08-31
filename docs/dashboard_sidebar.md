# Dashboard Sidebar Documentation

## Overview
The Dashboard Sidebar is a responsive, collapsible navigation system that provides the primary navigation interface for authenticated users in the application. It integrates with the dashboard layout to provide consistent navigation across dashboard pages (Study, Statistics, Settings) while supporting both desktop and mobile experiences with different interaction patterns.

## Architecture
The sidebar system follows a component-based architecture using shadcn/ui primitives with custom styling. It implements a provider pattern for state management, uses cookies for persistence, and leverages React Context for cross-component communication. The design prioritizes accessibility, responsive behavior, and smooth transitions between expanded/collapsed states.

## File Structure
```
src/
├── components/
│   ├── ui/
│   │   ├── sidebar.tsx                 # Core sidebar primitives and context
│   │   └── collapsible-sidebar-menu-button.tsx  # Specialized button for expand-on-click behavior
│   └── layout/
│       ├── app-sidebar.tsx             # Dashboard-specific sidebar implementation
│       ├── nav-user.tsx                # User profile dropdown in sidebar footer
│       ├── dashboard-breadcrumb.tsx    # Breadcrumb navigation in header
│       ├── exam-sidebar.tsx            # Alternative sidebar for exam pages
│       ├── subject-switcher.tsx        # Subject selection dropdown
│       ├── subject-dropdown.tsx        # Subject dropdown menu content
│       ├── floating-sidebar-trigger.tsx # Floating trigger button (unused)
│       └── mobile-navbar.tsx           # Mobile navigation header
├── app/
│   └── dashboard/
│       └── layout.tsx                  # Dashboard layout with sidebar integration
├── lib/
│   ├── hooks/
│   │   ├── use-mobile.ts              # Responsive breakpoint detection
│   │   ├── use-user-profile.ts        # User profile data fetching
│   │   └── use-is-admin.ts            # Admin role detection
│   ├── utils/
│   │   ├── format-name.ts             # Name formatting utilities
│   │   └── subject-icons.ts           # Subject icon mapping
│   └── auth/
│       └── client-auth.ts             # Client-side authentication utilities
└── app/globals.css                    # Global styles and CSS variables
```

## Core Components

### SidebarProvider (sidebar.tsx)
The root provider component that manages sidebar state and provides context to child components.

```typescript
function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
})
```

Key features:
- Manages open/collapsed state with controlled/uncontrolled patterns
- Persists state to cookies (7-day expiration)
- Provides keyboard shortcuts (Cmd/Ctrl + B to toggle)
- Handles mobile vs desktop behavior differentiation
- Wraps children with TooltipProvider for tooltip support

State management:
```typescript
const contextValue = React.useMemo<SidebarContextProps>(
  () => ({
    state,        // "expanded" | "collapsed"
    open,         // boolean
    setOpen,      // state setter
    isMobile,     // boolean | undefined
    openMobile,   // boolean (mobile sheet state)
    setOpenMobile,// mobile state setter
    toggleSidebar,// toggle helper
  }),
  [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
)
```

### Sidebar Component (sidebar.tsx)
The main sidebar container that adapts between desktop and mobile layouts.

```typescript
function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
})
```

Mobile implementation:
- Renders as a Sheet component (modal drawer)
- Width: 18rem (SIDEBAR_WIDTH_MOBILE)
- Includes accessibility labels

Desktop implementation:
- Fixed positioning with animated transitions
- Three collapsible modes:
  - `offcanvas`: Slides completely off-screen
  - `icon`: Collapses to icon-only width (3rem)
  - `none`: No collapse functionality
- Width transitions: 25rem expanded, 3rem collapsed

### AppSidebar (app-sidebar.tsx)
The dashboard-specific sidebar implementation with navigation items and branding.

```typescript
const navItems = [
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
    title: 'Settings',
    url: '/dashboard/settings',
    icon: Settings,
  },
]
```

Structure:
- **Header**: Logo with responsive collapse animation
- **Content**: Navigation menu with active state detection
- **Footer**: User profile dropdown
- **Rail**: Clickable edge for toggling (desktop only)

Logo animation implementation:
```typescript
<span className="overflow-hidden transition-all duration-200 ease-linear
                 w-auto opacity-100 max-w-[50px]
                 group-data-[collapsible=icon]:w-0 
                 group-data-[collapsible=icon]:opacity-0
                 group-data-[collapsible=icon]:max-w-0">
```

### NavUser (nav-user.tsx)
User profile management component in the sidebar footer.

Features:
- Displays user avatar with initials fallback
- Shows formatted name and email
- Dropdown menu with sign-out functionality
- Responsive positioning (bottom on mobile, right on desktop)
- Integration with React Query for cache clearing on sign-out

```typescript
const handleSignOut = async () => {
  await clientSignOut(queryClient)  // Clears cache and redirects
}
```

## Data Flow

### Sidebar State Management
1. **Initial State**: Reads from cookie or uses defaultOpen prop
2. **State Updates**: Through setOpen function or toggleSidebar helper
3. **Persistence**: Automatically saves to cookie on state change
4. **Keyboard Shortcuts**: Global event listener for Cmd/Ctrl + B
5. **Mobile Detection**: useIsMobile hook determines rendering mode

### User Authentication Flow
1. **Session Initialization**: Server-side in layout.tsx
2. **Profile Fetching**: useUserProfile hook with caching
3. **Navigation Guards**: Middleware.ts protects routes
4. **Sign Out**: Clears cache, session, and redirects

```typescript
// Middleware route protection
if (!user && (isProtectedPage || isOnboardingPage)) {
  return NextResponse.redirect(new URL('/auth/signin', request.url))
}
```

## Key Functions and Hooks

### useSidebar Hook
Provides access to sidebar context from any component.

```typescript
function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}
```

Returns:
- `state`: Current sidebar state ("expanded" | "collapsed")
- `open`: Boolean indicating if sidebar is open
- `setOpen`: Function to set sidebar state
- `isMobile`: Mobile detection result
- `openMobile`: Mobile sheet open state
- `setOpenMobile`: Mobile sheet state setter
- `toggleSidebar`: Helper to toggle sidebar state

### useIsMobile Hook
Detects mobile viewport and responds to resize events.

```typescript
const MOBILE_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
  
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    // ... event listeners
  }, [])
  
  return isMobile  // undefined during SSR, boolean after hydration
}
```

### useUserProfile Hook
Fetches and caches user profile data with session validation.

```typescript
export function useUserProfile(): UseUserProfileReturn {
  // Validates session before fetching
  // Returns user and profile data
  // Handles session expiration
  // Uses user-scoped cache keys
}
```

## Integration Points

### Dashboard Layout Integration
The sidebar integrates with the dashboard layout through SidebarProvider and SidebarInset:

```typescript
export default function DashboardLayout({ children }) {
  return (
    <SidebarProvider 
      defaultOpen
      style={{ "--sidebar-width": "12.5rem" }}
    >
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center">
          <SidebarTrigger />
          <DashboardBreadcrumb />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
```

### Route Protection
Middleware ensures authentication before accessing dashboard:

```typescript
const isProtectedPage = request.nextUrl.pathname.startsWith('/dashboard')

if (!user && isProtectedPage) {
  return NextResponse.redirect(new URL('/auth/signin', request.url))
}
```

### Query Client Integration
User-specific query clients prevent cache leakage between sessions:

```typescript
const queryClientMap = new Map<string, QueryClient>()

function getQueryClient(userId?: string) {
  const clientKey = userId || 'anonymous'
  // Creates or retrieves user-specific client
}
```

## Configuration

### CSS Variables
Defined in globals.css for theming:

```css
/* Light mode */
--sidebar: 0 0% 100%;                    /* Pure white background */
--sidebar-foreground: 19 20% 21%;        /* Dark text */
--sidebar-accent: 0 0% 97%;              /* Light grey hover */
--sidebar-border: 20 6% 90%;             /* Border color */
--sidebar-ring: 13 63% 60%;              /* Focus ring (salmon) */

/* Dark mode */
--sidebar: 20 10% 12%;                   /* Dark background */
--sidebar-foreground: 40 23% 95%;        /* Light text */
```

### Constants
```typescript
const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7  // 7 days
const SIDEBAR_WIDTH = "25rem"                     // Desktop width
const SIDEBAR_WIDTH_MOBILE = "18rem"              // Mobile width
const SIDEBAR_WIDTH_ICON = "3rem"                 // Collapsed width
const SIDEBAR_KEYBOARD_SHORTCUT = "b"             // Cmd/Ctrl + B
const MOBILE_BREAKPOINT = 1024                    // px
```

### Tailwind Configuration
```typescript
// tailwind.config.ts
sidebar: {
  DEFAULT: "hsl(var(--sidebar))",
  foreground: "hsl(var(--sidebar-foreground))",
  primary: "hsl(var(--sidebar-primary))",
  "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
  accent: "hsl(var(--sidebar-accent))",
  "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
  border: "hsl(var(--sidebar-border))",
  ring: "hsl(var(--sidebar-ring))",
}
```

## Type Definitions

### SidebarContextProps
```typescript
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

### UserProfile Interface
```typescript
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
```typescript
interface NavItem {
  title: string
  url: string
  icon: LucideIcon
}
```

## Implementation Details

### Responsive Behavior
The sidebar system implements different behaviors based on viewport size:

**Desktop (≥1024px)**:
- Sidebar is always visible (expanded or collapsed)
- Toggles between full width (12.5rem) and icon width (3rem)
- State persists in cookies
- Keyboard shortcut support (Cmd/Ctrl + B)
- Rail component for edge-click toggling

**Mobile (<1024px)**:
- Sidebar renders as modal sheet
- Triggered by hamburger menu button
- Full overlay with backdrop
- Swipe gestures supported (via Sheet component)
- No persistent state (always starts closed)

### Animation System
All transitions use CSS transitions for smooth animations:

```css
/* Width transitions */
transition-[width] duration-200 ease-linear

/* Opacity and transform */
transition-all duration-200 ease-linear

/* Specific collapsed state animations */
group-data-[collapsible=icon]:w-0
group-data-[collapsible=icon]:opacity-0
```

### Cookie Persistence
State persistence implementation:

```typescript
const setOpen = React.useCallback(
  (value: boolean | ((value: boolean) => boolean)) => {
    const openState = typeof value === "function" ? value(open) : value
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
  },
  [setOpenProp, open]
)
```

### Active State Detection
Navigation items detect active state using pathname matching:

```typescript
const pathname = usePathname()

<SidebarMenuButton 
  asChild 
  isActive={pathname === item.url}
  tooltip={item.title}
>
```

### Tooltip System
Tooltips appear only when sidebar is collapsed:

```typescript
<TooltipContent
  side="right"
  align="center"
  hidden={state !== "collapsed" || isMobile}
  {...tooltip}
/>
```

## Dependencies

### External Dependencies
- **@radix-ui/react-slot**: Component composition
- **@radix-ui/react-tooltip**: Tooltip primitives
- **class-variance-authority**: Variant styling
- **lucide-react**: Icon library
- **@tanstack/react-query**: Server state management
- **@supabase/supabase-js**: Authentication and database

### Internal Dependencies
- **/lib/hooks/use-mobile**: Responsive detection
- **/lib/hooks/use-user-profile**: User data fetching
- **/lib/utils/format-name**: Name formatting
- **/lib/auth/client-auth**: Sign-out functionality
- **/components/ui/button**: Button component
- **/components/ui/sheet**: Mobile drawer component
- **/components/ui/dropdown-menu**: Dropdown primitives

## API Reference

### SidebarProvider Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| defaultOpen | boolean | true | Initial open state |
| open | boolean \| undefined | - | Controlled open state |
| onOpenChange | (open: boolean) => void | - | State change handler |
| className | string | - | Additional CSS classes |
| style | CSSProperties | - | Inline styles |
| children | ReactNode | - | Child components |

### Sidebar Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| side | "left" \| "right" | "left" | Sidebar position |
| variant | "sidebar" \| "floating" \| "inset" | "sidebar" | Visual variant |
| collapsible | "offcanvas" \| "icon" \| "none" | "offcanvas" | Collapse behavior |
| className | string | - | Additional CSS classes |
| children | ReactNode | - | Sidebar content |

### SidebarMenuButton Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| asChild | boolean | false | Render as child component |
| isActive | boolean | false | Active state |
| variant | "default" \| "outline" | "default" | Visual variant |
| size | "default" \| "sm" \| "lg" | "default" | Button size |
| tooltip | string \| TooltipContentProps | - | Tooltip configuration |

## Other Notes

### Performance Considerations
- Sidebar state changes trigger minimal re-renders through React.memo and useMemo
- Cookie operations are debounced implicitly through React state batching
- Query client isolation prevents cross-user data leakage
- CSS transitions used instead of JavaScript animations for better performance

### Accessibility Features
- Proper ARIA labels on all interactive elements
- Keyboard navigation support (Tab, Enter, Escape)
- Screen reader announcements for state changes
- Focus management in mobile sheet
- Semantic HTML structure

### Security Considerations
- User-scoped query clients prevent cache poisoning
- Cookie has path restriction and max-age for security
- Authentication checked in middleware before rendering
- Sign-out clears all client-side state and caches

### Browser Compatibility
- CSS custom properties for theming (all modern browsers)
- Media queries for responsive behavior
- Cookie storage for persistence
- CSS Grid and Flexbox for layout
- Transition and animation support required

### Known Limitations
- Mobile keyboard shortcut (Cmd/Ctrl + B) not supported
- Cookie persistence limited to 7 days
- No swipe gesture on desktop collapsed state
- Rail component only visible on desktop
- Maximum sidebar width fixed (not user-adjustable)

### Future Extensibility
The sidebar system is designed for extensibility:
- New navigation items can be added to navItems array
- Custom sidebar variants can be created
- Additional sidebar sections can be added (groups, dividers)
- Theme customization through CSS variables
- Plugin system possible through context providers
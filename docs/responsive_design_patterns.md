# Responsive Design Patterns Documentation

## Overview
The application implements a comprehensive mobile-first responsive design system built on Tailwind CSS v4, with breakpoint-aware components, adaptive layouts, and specialized mobile/desktop patterns. The design ensures seamless experiences across all device sizes through systematic responsive utilities, collapsible sidebars, and context-aware navigation patterns.

## Architecture
The responsive system leverages Tailwind CSS v4's modern breakpoint utilities combined with custom React hooks for runtime responsive behavior detection. The architecture employs a mobile-first approach where base styles target mobile devices, with progressive enhancement for larger screens. Key architectural decisions include using CSS media queries for layout shifts, JavaScript-based mobile detection for interactive behaviors, and a unified sidebar system that transforms between mobile sheets and desktop panels.

## File Structure
```
src/
├── lib/hooks/
│   └── use-mobile.ts                    # Core mobile detection hook
├── components/
│   ├── ui/
│   │   ├── sidebar.tsx                  # Responsive sidebar system
│   │   ├── sheet.tsx                    # Mobile overlay component
│   │   ├── button.tsx                   # Responsive button variants
│   │   └── collapsible-sidebar-menu-button.tsx  # Adaptive sidebar controls
│   └── layout/
│       ├── mobile-navbar.tsx            # Mobile-specific navigation
│       ├── app-sidebar.tsx              # Desktop application sidebar
│       ├── exam-sidebar.tsx             # Subject page sidebar
│       └── floating-sidebar-trigger.tsx # Responsive sidebar toggle
├── app/
│   ├── layout.tsx                       # Root responsive viewport setup
│   ├── dashboard/layout.tsx             # Dashboard responsive container
│   └── subject/[slug]/page.tsx          # Adaptive exam viewer layout
└── tailwind.config.ts                   # Breakpoint and container config
```

## Core Components

### Mobile Detection Hook (`use-mobile.ts`)
```typescript
const MOBILE_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
  
  React.useEffect(() => {
    const checkMobile = () => {
      return window.innerWidth < MOBILE_BREAKPOINT
    }
    setIsMobile(checkMobile())
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }
    mql.addEventListener("change", handleChange)
    
    return () => {
      mql.removeEventListener("change", handleChange)
    }
  }, [])
  
  return isMobile
}
```
The hook returns `undefined` during SSR/hydration, then boolean values after client-side initialization, enabling proper progressive enhancement.

### Responsive Sidebar System (`sidebar.tsx`)
```typescript
// Mobile sidebar renders as a Sheet overlay
if (isMobile) {
  return (
    <Sheet open={openMobile} onOpenChange={setOpenMobile}>
      <SheetContent
        data-mobile="true"
        className="bg-sidebar w-(--sidebar-width) p-0"
        style={{
          "--sidebar-width": SIDEBAR_WIDTH_MOBILE, // 18rem
        }}
        side={side}
      >
        <div className="flex h-full w-full flex-col">{children}</div>
      </SheetContent>
    </Sheet>
  )
}

// Desktop sidebar with collapsible states
return (
  <div
    className="group peer text-sidebar-foreground hidden lg:block"
    data-state={state}
    data-collapsible={state === "collapsed" ? collapsible : ""}
  >
    <div
      className={cn(
        "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) lg:flex",
        "group-data-[collapsible=icon]:w-(--sidebar-width-icon)"
      )}
    >
      {children}
    </div>
  </div>
)
```

### Mobile Navigation (`mobile-navbar.tsx`)
```typescript
export function MobileNavbar() {
  const { setOpenMobile } = useSidebar()
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 block lg:hidden bg-cream-50 border-b">
      <div className="flex items-center justify-between h-14 px-4">
        <Link href="/" className="flex items-center">
          <Image src="/logo-full.svg" alt="Osko" width={76} height={20} />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpenMobile(true)}
          className="h-10 w-10"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
```

## Data Flow
1. **Viewport Detection**: The `useIsMobile` hook monitors viewport width changes via MediaQueryList API
2. **State Management**: SidebarProvider maintains separate `open` (desktop) and `openMobile` (mobile) states
3. **Layout Adaptation**: Components conditionally render mobile/desktop variants based on `isMobile` state
4. **User Interactions**: Mobile triggers open Sheet overlays; desktop toggles sidebar collapse states
5. **Cookie Persistence**: Desktop sidebar state persists via cookies; mobile state resets on close

## Key Functions and Hooks

### `useSidebar()` Context Hook
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
Provides unified API for sidebar state management across responsive contexts.

### `toggleSidebar()` Responsive Toggle
```typescript
const toggleSidebar = React.useCallback(() => {
  return isMobile === true 
    ? setOpenMobile((open) => !open) 
    : setOpen((open) => !open)
}, [isMobile, setOpen, setOpenMobile])
```
Intelligently toggles appropriate sidebar state based on device context.

## Integration Points

### Layout Containers
- **Root Layout**: Sets viewport meta tag for proper mobile scaling
  ```tsx
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5'
  ```
- **Dashboard Layout**: Configures sidebar width CSS variable
  ```tsx
  <SidebarProvider style={{ "--sidebar-width": "12.5rem" }}>
  ```
- **Subject Pages**: Combines mobile navbar with desktop sidebar
  ```tsx
  <SidebarProvider defaultOpen>
    <MobileNavbar />
    <ExamSidebar />
    <FloatingSidebarTrigger />
    <SidebarInset>
      <main className="pt-14 lg:pt-0">
  ```

## Configuration

### Tailwind Breakpoint System
```typescript
// tailwind.config.ts
theme: {
  container: {
    center: true,
    padding: "2rem",
    screens: {
      "2xl": "1400px",  // Container max-width
    },
  },
}
```

### CSS Custom Properties
```css
:root {
  --sidebar-width: 25rem;           /* Desktop sidebar width */
  --sidebar-width-mobile: 18rem;    /* Mobile sheet width */
  --sidebar-width-icon: 3rem;       /* Collapsed sidebar width */
}
```

### Mobile Breakpoint Constants
```typescript
const MOBILE_BREAKPOINT = 1024      // lg breakpoint threshold
const SIDEBAR_WIDTH = "25rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
```

## Type Definitions

### Sidebar Component Props
```typescript
interface SidebarProps extends React.ComponentProps<"div"> {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}
```

### Sheet Content Props
```typescript
interface SheetContentProps extends React.ComponentProps<typeof SheetPrimitive.Content> {
  side?: "top" | "right" | "bottom" | "left"
}
```

## Implementation Details

### Breakpoint Strategy
The application uses Tailwind's default breakpoints with mobile-first philosophy:
- **Base (0-639px)**: Mobile styles, single column layouts
- **sm (640px+)**: Minor adjustments, still primarily mobile
- **md (768px+)**: Tablet layouts, 2-column grids
- **lg (1024px+)**: Desktop layouts, sidebar visible, 3-column grids
- **xl (1280px+)**: Wide desktop optimizations
- **2xl (1536px+)**: Ultra-wide container constraints

### Mobile Navigation Patterns
```tsx
// Mobile: Fixed header with hamburger menu
<header className="fixed top-0 left-0 right-0 z-50 block lg:hidden">

// Desktop: Hidden mobile nav, visible sidebar
<div className="group peer hidden lg:block">
```

### Responsive Grid Systems
```tsx
// Dashboard subject cards - responsive columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Onboarding layout - stacked mobile, side-by-side desktop
<div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
  <div className="order-1 lg:order-2 lg:col-span-1">
  <div className="order-2 lg:order-1 lg:col-span-2">
```

### Responsive Typography
```tsx
// Hero section - scaled text sizes
<span className="text-7xl md:text-8xl lg:text-9xl">
<span className="text-5xl md:text-7xl lg:text-8xl">

// CTA section - responsive headings
<span className="text-2xl md:text-3xl">
<span className="text-5xl md:text-6xl">
```

### Adaptive Spacing
```tsx
// Mobile-aware padding adjustments
<section className="pt-16 pb-16 md:pt-24 md:pb-12">
<section className="py-4 md:py-6">
<div className="p-6 md:p-10">

// Responsive container padding
<main className="container mx-auto px-4">
<div className="px-8 py-8">
```

### Sheet Component Responsive Widths
```tsx
// Mobile sheet takes 75% width, max 24rem on larger mobile
className="w-3/4 sm:max-w-sm"

// Different slide animations per side
side === "right" && "data-[state=closed]:slide-out-to-right"
side === "left" && "data-[state=closed]:slide-out-to-left"
```

## Dependencies
- **Tailwind CSS v4**: Core responsive utility system
- **@radix-ui/react-dialog**: Sheet/modal primitives
- **class-variance-authority**: Responsive variant management
- **lucide-react**: Responsive icon components
- **Next.js Image**: Responsive image optimization

## API Reference

### Responsive Utility Classes
```css
/* Visibility utilities */
.hidden        /* Hide element */
.block         /* Display block */
.lg:hidden     /* Hide on large screens */
.lg:block      /* Show on large screens */

/* Grid utilities */
.grid-cols-1   /* Single column */
.md:grid-cols-2 /* 2 columns on medium+ */
.lg:grid-cols-3 /* 3 columns on large+ */

/* Spacing utilities */
.px-4          /* Horizontal padding 1rem */
.md:px-6       /* Horizontal padding 1.5rem on medium+ */
.lg:px-8       /* Horizontal padding 2rem on large+ */

/* Container utilities */
.container     /* Responsive container with padding */
.mx-auto       /* Center horizontally */
.max-w-4xl     /* Maximum width constraint */
```

### Responsive Component APIs
```typescript
// useIsMobile() returns
undefined | boolean  // undefined during SSR, boolean after hydration

// useSidebar() provides
{
  isMobile: boolean | undefined
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  toggleSidebar: () => void
}
```

## Other Notes

### Hydration Considerations
The `useIsMobile` hook intentionally returns `undefined` during SSR and initial hydration to prevent hydration mismatches. Components should handle this undefined state gracefully, typically by defaulting to desktop behavior during the loading phase.

### Performance Optimizations
- MediaQueryList listeners are more performant than resize event listeners
- Sidebar state changes use CSS transitions for smooth animations
- Mobile detection is memoized to prevent unnecessary re-renders
- Sheet components lazy-load only when opened on mobile

### Accessibility Features
- All interactive elements maintain proper focus states across breakpoints
- Mobile menu triggers include proper ARIA labels
- Sidebar can be toggled via keyboard shortcut (Cmd/Ctrl + B)
- Sheet overlays trap focus and handle escape key dismissal

### Edge Cases
- Ultra-wide monitors (>1536px) constrain content width to maintain readability
- Sidebar collapse state persists via cookies but only on desktop
- Mobile sheet width adapts to viewport but caps at 24rem for usability
- Floating sidebar trigger appears only when sidebar is collapsed on desktop
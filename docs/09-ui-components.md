# UI Components Library Documentation

## Overview

The application's UI components library is built on top of shadcn/ui v4, a modern component library that provides copy-paste React components built with Radix UI primitives and styled with Tailwind CSS. The library emphasizes a warm, cream-colored design system with custom styling that creates a distinctive and professional appearance for the educational platform.

## Architecture

The UI components follow a layered architecture pattern:

1. **Base Layer**: Radix UI primitives provide unstyled, accessible components
2. **Styling Layer**: Tailwind CSS with custom warm color palette and CSS variables
3. **Component Layer**: shadcn/ui components with custom variants and styling
4. **Composition Layer**: Application-specific components that combine base components

The architecture ensures consistency, reusability, and maintainability while providing full control over styling and behavior.

## File Structure

```
src/components/ui/              # shadcn/ui components
├── accordion.tsx               # Expandable content sections
├── avatar.tsx                  # User profile images
├── badge.tsx                   # Status and category indicators
├── button.tsx                  # Interactive buttons with variants
├── card.tsx                    # Content containers
├── checkbox.tsx                # Form checkboxes
├── collapsible.tsx             # Collapsible content areas
├── collapsible-sidebar-menu-button.tsx  # Sidebar-specific button
├── dialog.tsx                  # Modal dialogs
├── dropdown-menu.tsx           # Context menus and dropdowns
├── input.tsx                   # Text input fields
├── input-otp.tsx               # OTP verification inputs
├── label.tsx                   # Form field labels
├── progress.tsx                # Progress indicators
├── scroll-area.tsx             # Custom scrollable areas
├── select.tsx                  # Dropdown select fields
├── separator.tsx               # Visual dividers
├── sheet.tsx                   # Side panels/drawers
├── sidebar.tsx                 # Application sidebar system
├── skeleton.tsx                # Loading placeholders
├── sonner.tsx                  # Toast notifications
├── table.tsx                   # Data tables
├── tabs.tsx                    # Tab navigation
├── textarea.tsx                # Multi-line text inputs
└── tooltip.tsx                 # Hover tooltips

src/components/                 # Application-specific components
├── filters/                    # Filter UI components
├── questions/                  # Question display components
│   ├── question-card.tsx       # Individual question cards
│   ├── zoom-controls.tsx       # Zoom UI controls
│   └── filtered-questions-view.tsx  # Question list with zoom
├── layout/                     # Layout components
├── auth/                       # Authentication components
├── admin/                      # Admin-specific components
├── onboarding/                 # User onboarding flow
├── landing/                    # Landing page sections
├── settings/                   # Settings UI
└── providers/                  # React context providers
    ├── providers.tsx           # Root providers wrapper
    ├── auth-provider.tsx       # Authentication context
    └── zoom-provider.tsx       # Zoom state management
```

## Core Components

### Button Component

The Button component is the primary interactive element with multiple variants designed for different use cases:

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium font-sans transition-all disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-stone-800 text-cream-50 hover:bg-stone-700",
        primary: "bg-salmon-500 text-white hover:bg-salmon-600",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border border-stone-400 bg-transparent hover:bg-stone-50",
        secondary: "bg-stone-100 text-warm-text-secondary hover:bg-stone-200",
        ghost: "text-warm-text-primary font-semibold hover:bg-stone-100",
        link: "text-salmon-500 underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-6 py-2",
        sm: "h-8 rounded gap-1.5 px-6",
        lg: "h-10 rounded px-6",
        xl: "h-11 rounded px-9 text-base",
        icon: "size-9"
      }
    }
  }
)
```

Usage:
```tsx
<Button variant="primary" size="lg">
  Submit Application
</Button>
```

### Card Component

The Card component system provides structured content containers with a warm, cream-colored background:

```tsx
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-cream-200 text-warm-text-secondary flex flex-col gap-6 rounded-xl border border-stone-200 py-6",
        className
      )}
      {...props}
    />
  )
}
```

Card composition example:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Exam Results</CardTitle>
    <CardDescription>View your recent performance</CardDescription>
    <CardAction>
      <Button variant="ghost" size="icon">
        <MoreHorizontal />
      </Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    {/* Content here */}
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

### Input Component

The Input component features custom styling with salmon accent colors for focus states:

```tsx
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-9 w-full rounded-md border border-stone-300 bg-white px-3 py-1 text-base font-sans text-warm-text-secondary",
        "focus-visible:border-salmon-500",
        "selection:bg-salmon-500 selection:text-cream-50",
        className
      )}
      {...props}
    />
  )
}
```

### Badge Component

Badges provide visual indicators with semantic variants:

```tsx
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-sans font-medium",
  {
    variants: {
      variant: {
        default: "border-transparent bg-salmon-500 text-cream-50",
        secondary: "border-transparent bg-stone-100 text-warm-text-secondary",
        destructive: "border-transparent bg-destructive text-white",
        outline: "border-stone-300 text-warm-text-secondary"
      }
    }
  }
)
```

### Sidebar Component

The Sidebar system is a comprehensive component featuring state management, keyboard shortcuts, and responsive behavior:

```tsx
const SIDEBAR_WIDTH = "25rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  ...props
}: SidebarProviderProps) {
  // Manages sidebar state with cookie persistence
  // Handles mobile vs desktop behavior
  // Provides keyboard shortcut (Cmd+B) for toggling
}
```

### ZoomControls Component

The ZoomControls component provides a desktop-only zoom interface for scaling content in the question viewer:

```tsx
export function ZoomControls() {
  const isMobile = useIsMobile()
  const { zoomLevel, increaseZoom, decreaseZoom, isLoading } = useZoom()
  const [isVisible, setIsVisible] = useState(false)

  // Desktop-only rendering
  if (isMobile === true || isMobile === undefined || isLoading) {
    return null
  }

  return (
    <div className="fixed top-16 right-4 z-40"
         onMouseEnter={() => setIsVisible(true)}
         onMouseLeave={() => setIsVisible(false)}>
      {/* Extended hover trigger area */}
      <div className="absolute -left-24 top-0 w-28 h-24" />

      {/* Controls with fade transition */}
      <div className={cn(
        "flex flex-col items-center gap-2 bg-cream-50 rounded-lg p-2 shadow-lg",
        "transition-opacity duration-200",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        {/* Zoom buttons with tooltips */}
      </div>
    </div>
  )
}
```

**Key Features:**
- **Fixed Positioning**: Anchored to top-right corner (top-16, right-4)
- **Hover-to-Show**: Controls appear on hover with smooth opacity transition
- **Edge Activation**: Extended trigger area (-left-24) for easy edge activation
- **Vertical Layout**: Buttons stacked vertically for minimal footprint
- **Accessibility**: Full keyboard support via Cmd/Ctrl +/- shortcuts
- **Desktop-Only**: Returns null on mobile devices or during loading
- **Visual Feedback**: Buttons disabled at min/max zoom levels

**Design Patterns:**
1. **Progressive Disclosure**: Controls hidden until needed
2. **Edge Triggering**: Extended invisible area for cursor catching from screen edge
3. **Tooltip Integration**: Left-positioned tooltips to avoid edge overflow
4. **State Synchronization**: Integrates with ZoomProvider context
5. **Responsive Behavior**: Mobile detection prevents unnecessary rendering

## Data Flow

### Component State Management

1. **Controlled Components**: Most components support both controlled and uncontrolled modes
2. **Context Providers**: Complex components like Sidebar and Zoom use React Context for state distribution
3. **Storage Persistence**: Sidebar uses cookies, Zoom uses sessionStorage for state persistence
4. **URL State**: Filter components sync with URL parameters for shareable states

### ZoomProvider Context

The ZoomProvider manages zoom state for the question viewer with intelligent persistence:

```tsx
const ZOOM_LEVELS = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0] as const
const DEFAULT_ZOOM = 1.0

export function ZoomProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  const isEnabled = isMobile === false // Desktop-only feature

  // Session storage with validation
  const [zoomLevel, setStoredZoom, isLoading] = useSessionStorage<ZoomLevel>({
    key: 'exam-viewer-zoom',
    defaultValue: DEFAULT_ZOOM,
    validator: isValidZoomLevel,
  })

  // Keyboard shortcuts (Cmd/Ctrl + +/- / 0)
  useEffect(() => {
    if (!isEnabled || isLoading) return
    // Handle keyboard events...
  }, [isEnabled, isLoading])

  return (
    <ZoomContext.Provider value={contextValue}>
      {children}
    </ZoomContext.Provider>
  )
}
```

**State Management Features:**
- **Discrete Zoom Levels**: Fixed array of zoom levels (0.5 to 1.0)
- **Session Persistence**: Zoom level preserved during browser session
- **Type Validation**: Runtime validation of stored zoom values
- **Keyboard Shortcuts**: Cmd/Ctrl + for zoom in, - for zoom out, 0 for reset
- **Mobile Detection**: Automatically disabled on mobile devices
- **Loading States**: Proper handling of storage initialization

### Event Handling Pattern

```tsx
// Example from TopicFilterAccordion
const handleAccordionClick = (e: React.MouseEvent) => {
  if (isCollapsed) {
    e.preventDefault()
    e.stopPropagation()
    setOpen(true)
    setTimeout(() => {
      const trigger = e.currentTarget as HTMLElement
      trigger?.click()
    }, 0)
  }
}
```

## Key Functions and Hooks

### cn() Utility Function

The `cn()` function combines clsx and tailwind-merge for optimal class name handling:

```tsx
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

This ensures:
- Conditional class application
- Proper Tailwind class precedence
- Removal of conflicting utilities

### useSidebar Hook

Provides access to sidebar state and controls:

```tsx
function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}
```

### useZoom Hook

Accesses zoom context for content scaling:

```tsx
export function useZoom() {
  const context = useContext(ZoomContext)
  if (!context) {
    throw new Error('useZoom must be used within ZoomProvider')
  }
  return context
}
```

Returns:
- `zoomLevel`: Current zoom level (0.5 to 1.0)
- `setZoomLevel`: Direct zoom setter with validation
- `increaseZoom`: Step up to next zoom level
- `decreaseZoom`: Step down to previous zoom level
- `resetZoom`: Reset to default (1.0)
- `isEnabled`: Whether zoom is available (desktop only)
- `isLoading`: Storage initialization state

### useIsMobile Hook

Responsive breakpoint detection with hydration safety:

```tsx
const MOBILE_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)

    mql.addEventListener("change", handleChange)
    return () => mql.removeEventListener("change", handleChange)
  }, [])

  return isMobile // undefined during SSR, boolean after hydration
}
```

### useSessionStorage Hook

Type-safe session storage with validation:

```tsx
export function useSessionStorage<T>({
  key,
  defaultValue,
  validator,
}: UseSessionStorageOptions<T>): [T, (value: T) => void, boolean] {
  const [storedValue, setStoredValue] = useState<T>(defaultValue)
  const [isLoading, setIsLoading] = useState(true)

  // Load and validate stored value
  useEffect(() => {
    const item = window.sessionStorage.getItem(key)
    if (item !== null) {
      const parsed = JSON.parse(item)
      if (!validator || validator(parsed)) {
        setStoredValue(parsed)
      }
    }
    setIsLoading(false)
  }, [key, validator])

  return [storedValue, setValue, isLoading]
}
```

## Integration Points

### Radix UI Integration

Components are built on Radix UI primitives for accessibility and behavior:

```tsx
import * as DialogPrimitive from "@radix-ui/react-dialog"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import * as SelectPrimitive from "@radix-ui/react-select"
```

### Icon Library Integration

Lucide React provides the icon system:

```tsx
import { ChevronDown, XIcon, CheckIcon } from 'lucide-react'
```

### Form Integration

Components work seamlessly with form libraries through forwardRef patterns:

```tsx
const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => {
  // Implementation
})
```

## Configuration

### shadcn/ui Configuration (components.json)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

### Tailwind Configuration

Key configuration for the warm color palette:

```typescript
colors: {
  // Warm cream backgrounds
  "cream": {
    50: "#FFFEFB",
    100: "#FFFEFD",
    200: "#FFFDF8",
    300: "#FFF9F0",
  },
  // Warm accent colors
  "salmon": {
    300: "#dda896",
    400: "#E59C84",
    500: "#D97757",
    600: "#c55f37ff",
  },
  // Warm text colors
  "warm": {
    "text-primary": "#1A1A1A",
    "text-secondary": "#4A4A4A",
    "text-muted": "#6B6B6B",
    "text-subtle": "#9A9A9A",
  }
}
```

## Type Definitions

### Component Props Pattern

Components use intersection types for prop extension:

```tsx
type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }
```

### Slot Pattern

The `asChild` prop allows component composition:

```tsx
const Comp = asChild ? Slot : "button"
return <Comp {...props} />
```

## Implementation Details

### CSS Variables System

The design system uses CSS variables for theming:

```css
:root {
  --background: 60 67% 99%;
  --foreground: 19 20% 21%;
  --primary: 13 63% 60%;
  --primary-foreground: 60 67% 99%;
  --border: 20 6% 90%;
  --ring: 13 63% 60%;
  --radius: 0.5rem;
}
```

### Animation System

Tailwind CSS Animate plugin provides smooth transitions:

```tsx
className="data-[state=open]:animate-in data-[state=closed]:animate-out"
```

### Responsive Design

Components adapt to screen sizes:

```tsx
className="w-full max-w-[calc(100%-2rem)] sm:max-w-lg"
```

### Accessibility Features

1. **ARIA Labels**: All interactive elements include proper ARIA attributes
2. **Keyboard Navigation**: Full keyboard support with visible focus indicators
3. **Screen Reader Support**: Semantic HTML and SR-only text for context
4. **Focus Management**: Proper focus trapping in modals and dialogs
5. **Zoom Accessibility**:
   - Keyboard shortcuts (Cmd/Ctrl +/-/0) for zoom control
   - Tooltip hints for button functionality
   - Disabled state indicators at zoom limits
   - Preserves text readability at all zoom levels

## Dependencies

### External Dependencies
- `@radix-ui/react-*`: Unstyled, accessible component primitives
- `class-variance-authority`: Variant management for components
- `clsx`: Conditional class name construction
- `tailwind-merge`: Intelligent Tailwind class merging
- `lucide-react`: Icon library
- `tailwindcss-animate`: Animation utilities

### Internal Dependencies
- `/lib/utils`: Utility functions including `cn()`
- `/lib/hooks/*`: Custom React hooks
- Component inter-dependencies for composition

## API Reference

### Button API

```tsx
interface ButtonProps {
  variant?: "default" | "primary" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "xl" | "icon"
  asChild?: boolean
  disabled?: boolean
  onClick?: (event: React.MouseEvent) => void
  children: React.ReactNode
  className?: string
}
```

### Dialog API

```tsx
interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContentProps {
  showCloseButton?: boolean
  className?: string
  children: React.ReactNode
}
```

### Select API

```tsx
interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  disabled?: boolean
  children: React.ReactNode
}
```

## Other Notes

### Performance Optimizations

1. **Component Memoization**: Heavy components use React.memo for performance
2. **Lazy Loading**: Sheet and Dialog components use portal pattern
3. **CSS-in-JS Avoidance**: All styling through Tailwind for optimal performance
4. **Event Delegation**: Proper event handling to prevent bubbling issues
5. **Transform-based Zoom**: Uses CSS transform for hardware-accelerated scaling

### Custom Component Patterns

The application extends shadcn/ui components with domain-specific components:

1. **FilterTag**: Custom tag component for filter display
2. **QuestionCard**: Complex card composition for exam questions
3. **TopicFilterAccordion**: Accordion with checkbox integration
4. **AppSidebar**: Application-specific sidebar implementation
5. **ZoomControls**: Progressive disclosure zoom interface with hover activation
6. **FilteredQuestionsView**: Integration of zoom transform with question list

### Zoom Implementation Pattern

The zoom feature demonstrates advanced UI patterns:

```tsx
// In FilteredQuestionsView component
<div className="relative">
  <div
    className="origin-top transition-transform duration-200 ease-out"
    style={{
      transform: isEnabled && !isZoomLoading ? `scale(${zoomLevel})` : undefined,
      transformOrigin: 'top center',
    }}
  >
    {/* Question cards rendered here */}
  </div>
</div>
```

This approach:
- Uses CSS transforms for GPU-accelerated performance
- Centers scaling from top-center for intuitive zoom behavior
- Smooth transitions with 200ms duration
- Conditional application based on device capability

### Styling Conventions

1. **Color Usage**: Warm palette for primary UI, salmon for accents
2. **Border Radius**: Consistent use of rounded-md, rounded-xl
3. **Spacing**: Standard Tailwind spacing scale (px-4, py-2, gap-3)
4. **Typography**: Font-serif for headings, font-sans for body text
5. **Hover States**: Subtle color transitions with hover: prefix
6. **Focus States**: Visible salmon-colored ring for accessibility

### Future Extensibility

The component library is designed for easy extension:

1. **Variant System**: CVA allows adding new variants without breaking changes
2. **Composition Pattern**: Components can be combined for complex UIs
3. **Theme Variables**: CSS variables enable runtime theme switching
4. **TypeScript Support**: Full type safety for component props and variants
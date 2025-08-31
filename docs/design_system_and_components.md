# Design System & Components Documentation

## Overview
The application implements a warm, inviting design system built on top of shadcn/ui components with extensive customization for educational content. The system emphasizes readability, accessibility, and a cohesive visual experience through a carefully crafted warm color palette and thoughtful typography choices.

## Architecture
The design system follows a layered architecture approach:
- **Base Layer**: Tailwind CSS v4 with custom configuration
- **Token Layer**: CSS custom properties for dynamic theming
- **Component Layer**: shadcn/ui components with Radix UI primitives
- **Pattern Layer**: Composite components and layout patterns

The architecture prioritizes:
- Component composition over inheritance
- Variant-based styling using class-variance-authority (CVA)
- Accessibility through Radix UI primitives
- Performance through Tailwind's utility-first approach
- Type safety with TypeScript throughout

## File Structure
```
src/
  app/
    globals.css              # Global styles, CSS variables, theme definitions
    layout.tsx               # Font configuration and root layout
  components/
    ui/                      # shadcn/ui component implementations
      accordion.tsx          # Collapsible content sections
      avatar.tsx            # User profile images
      badge.tsx             # Status and category indicators
      button.tsx            # Primary interactive element
      card.tsx              # Content containers
      checkbox.tsx          # Form checkboxes
      dialog.tsx            # Modal dialogs
      dropdown-menu.tsx     # Context menus
      input.tsx             # Text input fields
      label.tsx             # Form labels
      select.tsx            # Dropdown selects
      sidebar.tsx           # Navigation sidebar
      skeleton.tsx          # Loading placeholders
      tooltip.tsx           # Hover information
  lib/
    utils.ts                # cn() utility for className merging
    hooks/
      use-mobile.ts         # Responsive breakpoint detection
tailwind.config.ts          # Tailwind configuration
components.json             # shadcn/ui configuration
```

## Core Components

### Button Component
The button is the primary interactive element with extensive variant support:

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium font-sans transition-all disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-stone-700 text-cream-50 shadow-2xs hover:bg-stone-700",
        destructive: "bg-destructive text-white shadow-2xs hover:bg-destructive/90",
        outline: "border border-stone-300 bg-cream-50 shadow-2xs hover:bg-cream-100",
        secondary: "bg-stone-100 text-warm-text-secondary shadow-2xs hover:bg-stone-200",
        ghost: "hover:bg-cream-100 hover:text-warm-text-primary",
        link: "text-salmon-500 underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md gap-1.5 px-3",
        lg: "h-10 rounded-md px-6",
        icon: "size-9"
      }
    }
  }
)
```

### Card Component
Cards provide structured content containers with semantic sections:

```tsx
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-cream-200 text-warm-text-secondary flex flex-col gap-6 rounded-xl border border-stone-200 py-6",
        className
      )}
      {...props}
    />
  )
}
```

### Input Component
Form inputs with comprehensive state handling:

```tsx
<input
  className={cn(
    "flex h-9 w-full rounded-md border border-stone-300 bg-white px-3 py-1",
    "placeholder:text-warm-text-subtle",
    "selection:bg-salmon-500 selection:text-cream-50",
    "focus-visible:border-salmon-500",
    "aria-invalid:border-destructive"
  )}
/>
```

## Data Flow
The design system implements a unidirectional data flow for theming and component state:

1. **Theme Configuration**: Defined in `tailwind.config.ts` and `globals.css`
2. **CSS Variables**: Propagated through `:root` and `.dark` selectors
3. **Component Props**: Variant props control component appearance
4. **Runtime Classes**: CVA generates appropriate classes based on props
5. **Utility Merging**: `cn()` function handles class conflicts and overrides

## Key Functions and Hooks

### cn() Utility Function
Combines clsx and tailwind-merge for intelligent class merging:

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### useIsMobile Hook
Responsive state management with SSR safety:

```typescript
const MOBILE_BREAKPOINT = 1024

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
  
  return isMobile // undefined during SSR, boolean after hydration
}
```

## Integration Points

### shadcn/ui Configuration
Configured via `components.json`:

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
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

### Font System Integration
Fonts loaded and configured in layout.tsx:

```typescript
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
})

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})
```

## Configuration

### Tailwind Configuration
Extended color palette and custom theme values:

```typescript
extend: {
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
      600: "#C2410C",
    },
    // Warm text colors
    "warm": {
      "text-primary": "#1A1A1A",
      "text-secondary": "#4A4A4A",
      "text-muted": "#6B6B6B",
      "text-subtle": "#9A9A9A",
    }
  }
}
```

### CSS Variables
Design tokens as CSS custom properties:

```css
:root {
  --background: 60 67% 99%;
  --foreground: 19 20% 21%;
  --primary: 13 63% 60%;
  --border: 20 6% 90%;
  --radius: 0.5rem;
  
  /* Custom warm palette tokens */
  --color-cream-50: #FFFEFB;
  --color-salmon-500: #D97757;
  --color-warm-text-primary: #1A1A1A;
}
```

## Type Definitions

### Component Props Pattern
All components follow consistent prop typing:

```typescript
// Basic component props extending HTML element
function Component({ 
  className, 
  ...props 
}: React.ComponentProps<"div">) {
  // Implementation
}

// With variant support
function Component({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & 
  VariantProps<typeof componentVariants> & {
    asChild?: boolean
  }) {
  // Implementation
}
```

## Implementation Details

### Color Palette Philosophy
The warm color palette creates an inviting, educational atmosphere:

1. **Cream Backgrounds** (#FFFEFB to #FFF9F0): Soft, paper-like backgrounds reducing eye strain
2. **Salmon Accents** (#D97757): Primary interactive elements with warmth
3. **Stone Neutrals** (#F5F5F5 to #262626): UI structure and secondary elements
4. **Sky Blue** (#0EA5E9): Contrast color for CTAs and important actions

### Component Conventions

#### Data Slot Attributes
Every component includes `data-slot` attributes for testing and styling:

```tsx
<div data-slot="card">
  <div data-slot="card-header">
    <div data-slot="card-title">Title</div>
  </div>
</div>
```

#### Focus Management
Consistent focus states across all interactive elements:

```css
focus-visible:border-salmon-500
focus-visible:ring-salmon-500/30
focus-visible:ring-[3px]
```

#### Animation Patterns
Subtle animations using Tailwind's animation utilities:

```tsx
// Enter/exit animations for modals
"data-[state=open]:animate-in data-[state=closed]:animate-out"
"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"

// Loading states
"animate-pulse" // for skeletons
"transition-all" // for interactive elements
```

### Responsive Patterns

#### Mobile-First Design
Components adapt using:
- `useIsMobile()` hook for JavaScript-based responsiveness
- Tailwind breakpoint utilities for CSS-based responsiveness
- Conditional rendering for mobile-specific UI

#### Sidebar Responsiveness
The sidebar transforms between desktop and mobile:

```typescript
const SIDEBAR_WIDTH = "25rem"          // Desktop
const SIDEBAR_WIDTH_MOBILE = "18rem"   // Mobile
const SIDEBAR_WIDTH_ICON = "3rem"      // Collapsed state
```

### Accessibility Considerations

#### ARIA Support
Components include comprehensive ARIA attributes:

```tsx
// Invalid state communication
"aria-invalid:ring-destructive/20"
"aria-invalid:border-destructive"

// Screen reader labels
<span className="sr-only">Close</span>

// Semantic HTML elements
<div role="button" aria-pressed={isPressed}>
```

#### Keyboard Navigation
- All interactive elements reachable via Tab
- Escape key closes modals and dropdowns
- Enter/Space activate buttons and checkboxes
- Arrow keys navigate menus and selects

#### Focus Management
- Visible focus indicators on all interactive elements
- Focus trap in modals and sheets
- Return focus on modal close

## Dependencies

### Core Dependencies
- **@radix-ui/react-***: Unstyled, accessible component primitives (v1.2+)
- **class-variance-authority**: Variant class management (v0.7.1)
- **tailwind-merge**: Intelligent Tailwind class merging (v3.3.1)
- **clsx**: Conditional class construction (v2.1.1)
- **tailwindcss-animate**: Animation utilities (v1.0.7)

### UI Component Libraries
- **lucide-react**: Icon library (v0.539.0)
- **sonner**: Toast notifications (v2.0.7)
- **input-otp**: OTP input component (v1.4.2)

## API Reference

### Component Variant APIs

#### Button Variants
```typescript
variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
size: "default" | "sm" | "lg" | "icon"
asChild?: boolean // Render as child component using Slot
```

#### Badge Variants
```typescript
variant: "default" | "secondary" | "destructive" | "outline"
asChild?: boolean
```

#### Card Sections
```typescript
Card
CardHeader
CardTitle
CardDescription
CardContent
CardFooter
CardAction
```

### Utility Functions

#### cn(...classes)
Merges class names with conflict resolution:
```typescript
cn("px-2 py-1", "px-3") // Result: "py-1 px-3"
cn("text-red-500", condition && "text-blue-500")
```

## Other Notes

### Tailwind v4 Migration
The project uses Tailwind CSS v4 with important changes:
- New `@theme` directive for custom theme values
- `@custom-variant` for custom variant definitions
- Updated configuration syntax in globals.css
- Border color default changed to `currentcolor`

### Component Composition Pattern
Components use Radix UI's Slot pattern for flexible composition:

```tsx
const Comp = asChild ? Slot : "button"
return <Comp {...props} />
```

This allows components to render as different elements while maintaining styling.

### Performance Optimizations
- Font display set to 'swap' for faster initial render
- Tailwind's JIT compiler for minimal CSS bundle
- Component code-splitting at route level
- Skeleton loaders for perceived performance

### Dark Mode Support
While primarily light-themed, dark mode foundations exist:
- CSS variables defined for `.dark` class
- Component classes ready for dark variants
- Preserved for future implementation

### Custom Scrollbar Styling
Custom utility for styled scrollbars:

```css
@utility scrollbar-thin {
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: hsl(13 63% 60% / 0.3);
    border-radius: 3px;
  }
}
```

This design system provides a cohesive, accessible, and performant foundation for the application's user interface, balancing aesthetic appeal with functional requirements.
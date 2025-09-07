# Landing Page & Marketing Documentation

## Overview

The landing page serves as the primary entry point for non-authenticated users, providing a clean, conversion-optimized interface that communicates the core value proposition ("It's Studyclix... But It's free"). The implementation follows a minimalist design philosophy with a focus on immediate user understanding and conversion through clear CTAs (Call-to-Action).

## Architecture

The landing page architecture employs a server-side rendered approach using Next.js App Router, ensuring optimal SEO and performance. The page is composed of modular React components with a clear separation between layout, presentation, and interaction concerns.

### Design Patterns
- **Component Composition**: Modular components (`LandingNavigation`, `HeroSection`) for maintainability
- **Server-Side Rendering**: Optimal for SEO and initial page load performance
- **Responsive-First Design**: Mobile-first approach with distinct layouts for different viewports
- **Warm Color Palette**: Custom design system emphasizing comfort and approachability

### Architectural Rationale
The decision to keep the landing page minimal (only navigation and hero) reflects a focus on conversion rather than information overload. The warm color palette creates a welcoming educational atmosphere, while the typography choices (Source Serif for headlines, Source Sans for body) balance professionalism with readability.

## File Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page root component
│   ├── layout.tsx                  # Root layout with fonts and providers
│   └── auth/
│       ├── signin/page.tsx         # Sign in page
│       └── signup/page.tsx         # Sign up page
├── components/
│   ├── landing/
│   │   ├── hero-section.tsx        # Hero section with main messaging
│   │   └── navigation.tsx          # Landing page navigation bar
│   └── auth/
│       ├── login-form.tsx          # Sign in form component
│       ├── signup-form.tsx         # Sign up form component
│       └── oauth-buttons.tsx       # OAuth authentication buttons
├── middleware.ts                   # Route protection and auth redirects
└── public/
    ├── hero-image.svg              # Hero section illustration
    ├── logo-full.svg               # Full logo (icon + text)
    ├── logo-icon.svg               # Logo icon only
    └── logo-text.svg               # Logo text only
```

## Core Components

### Landing Page Root (`src/app/page.tsx`)

The root landing page component serves as a simple container that composes the navigation and hero section:

```tsx
export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream-50">
      <LandingNavigation />
      <main>
        <HeroSection />
      </main>
    </div>
  )
}
```

**Key Design Decisions:**
- `min-h-screen` ensures full viewport coverage
- `bg-cream-50` (#FFFEFB) provides a warm, inviting background
- Semantic HTML with `<main>` for accessibility

### Hero Section (`src/components/landing/hero-section.tsx`)

The hero section implements a sophisticated responsive design with distinct mobile and desktop layouts:

```tsx
const HERO_IMAGE_CONFIG = {
  src: '/hero-image.svg',
  alt: 'Student studying with laptop',
  width: 500,
  height: 500,
  priority: true,
} as const
```

**Mobile Layout (default, lg:hidden):**
- Centered single-column layout
- Stacked headline and tagline
- Full-width CTA buttons
- Responsive image sizing (280px to 450px height)

**Desktop Layout (lg and above):**
- Two-column grid layout
- Full-width primary headline
- Left column: tagline with CTAs
- Right column: hero illustration
- Asymmetric spacing for visual hierarchy

### Landing Navigation (`src/components/landing/navigation.tsx`)

Minimal navigation bar focusing on authentication actions:

```tsx
<header className="bg-cream-50 border-b border-stone-200">
  <div className="container mx-auto px-4 py-4 flex items-center justify-between">
    <Link href="/" className="flex items-center gap-2">
      <Image src="/logo-full.svg" alt="Osko" width={76} height={20} priority />
    </Link>
    <nav className="flex items-center gap-4">
      <Button asChild variant="ghost" size="default">
        <Link href="/auth/signin">Log In</Link>
      </Button>
      <Button asChild variant="default" size="default">
        <Link href="/auth/signup">Sign Up</Link>
      </Button>
    </nav>
  </div>
</header>
```

**Design Rationale:**
- Fixed height header (73px computed)
- Logo with `priority` for immediate loading
- Dual CTA approach (ghost vs. default variants)
- Container constraints for consistent alignment

## Data Flow

The landing page operates with minimal data requirements:

1. **Initial Load**: Server-side rendered with no data dependencies
2. **Session Check**: Middleware validates authentication state
3. **Navigation**: Client-side routing to auth pages
4. **OAuth Flow**: Server actions handle Google authentication

### Authentication Flow
```
Landing Page → Sign Up/Sign In → OAuth/Email Auth → Onboarding → Dashboard
```

## Key Functions and Hooks

### Button Variants (UI System)

The button component uses class-variance-authority for consistent styling:

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium font-sans transition-all",
  {
    variants: {
      variant: {
        default: "bg-stone-800 text-cream-50 hover:bg-stone-700",
        primary: "bg-salmon-500 text-white hover:bg-salmon-600",
        ghost: "text-warm-text-primary font-semibold hover:bg-stone-100",
        outline: "border border-stone-400 bg-transparent hover:bg-stone-50"
      },
      size: {
        default: "h-9 px-6 py-2",
        xl: "h-11 rounded px-9 text-base"
      }
    }
  }
)
```

## Integration Points

### Middleware Integration

The middleware handles authentication-based routing:

```typescript
// Redirect authenticated users away from landing
if (user && isAuthPage && !request.nextUrl.pathname.includes('/callback')) {
  if (!userProfile || !userProfile.onboarding_completed) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }
  return NextResponse.redirect(new URL('/dashboard/study', request.url))
}
```

### Font Loading Integration

Custom fonts are loaded at the root layout level:

```typescript
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
})
```

## Configuration

### Viewport Configuration
```typescript
viewport: 'width=device-width, initial-scale=1, maximum-scale=5'
```

### Image Optimization
- SVG assets for scalability
- Next.js Image component with `priority` flag
- Responsive image sizing based on viewport

## Type Definitions

### Hero Image Configuration Type
```typescript
const HERO_IMAGE_CONFIG = {
  src: string,
  alt: string,
  width: number,
  height: number,
  priority: boolean,
} as const
```

## Implementation Details

### Responsive Breakpoints

The hero section uses Tailwind's responsive utilities:

```tsx
// Mobile-first approach
<div className="lg:hidden">           // Mobile/Tablet (< 1024px)
<div className="hidden lg:block">     // Desktop (≥ 1024px)

// Text sizing scales
text-5xl sm:text-7xl md:text-8xl     // Mobile headline
text-8xl lg:text-9xl xl:text-[10rem] // Desktop headline
```

### Marketing Copy Strategy

The messaging follows a simple, effective formula:

1. **Primary Message**: "It's Studyclix..." - Establishes familiarity
2. **Value Proposition**: "But It's free" - Immediate differentiation
3. **Visual Hierarchy**: Serif fonts for authority, italicized "free" for emphasis

### Conversion Optimization Elements

1. **Dual CTAs**: Both "Sign Up" and "Log In" prominently displayed
2. **Button Hierarchy**: Primary action (Sign Up) uses salmon color
3. **Above-the-fold**: All critical elements visible without scrolling
4. **Minimal Friction**: Direct links to authentication, no intermediary pages

### Performance Optimizations

1. **Font Display Swap**: Prevents invisible text during font load
```typescript
display: 'swap'
```

2. **Image Priority Loading**: Hero image and logo load immediately
```tsx
priority={true}
```

3. **Turbopack Development**: Fast refresh during development
```json
"dev": "next dev --turbopack"
```

4. **SVG Assets**: Vector graphics for perfect scaling and small file sizes

## Dependencies

### External Dependencies
- `next`: Framework for SSR and routing
- `@radix-ui/react-slot`: For polymorphic button component
- `class-variance-authority`: Button variant management
- `tailwind-merge`: Class name conflict resolution

### Internal Dependencies
- `/lib/utils`: Utility functions including `cn` for className merging
- `/components/ui/button`: Reusable button component
- Authentication actions from `/app/auth/actions`

## API Reference

### Component Props

#### HeroSection
No props - self-contained component

#### LandingNavigation
No props - self-contained component

#### Button (as used in landing)
```typescript
interface ButtonProps {
  variant?: 'default' | 'primary' | 'ghost' | 'outline'
  size?: 'default' | 'xl'
  asChild?: boolean  // For Link composition
}
```

## Other Notes

### SEO Considerations
- Server-side rendering ensures content is immediately available to crawlers
- Semantic HTML structure with proper heading hierarchy
- Alt text for images
- Meta tags configured in root layout

### Accessibility Features
- Semantic HTML elements (`<header>`, `<main>`, `<nav>`)
- Proper heading hierarchy (h1, h2)
- Focus states on interactive elements
- Sufficient color contrast ratios

### User Journey from Landing to Signup/Signin

1. **Landing Page Load**
   - User sees hero message and illustration
   - Two clear CTAs: "Sign Up" and "Log In"

2. **Authentication Choice**
   - Click "Sign Up" → `/auth/signup`
   - Click "Log In" → `/auth/signin`

3. **Authentication Page**
   - Centered card design with logo
   - Google OAuth option (primary)
   - Email/password fallback
   - Cross-link between signin/signup

4. **Post-Authentication Flow**
   - New users → `/onboarding` (profile setup)
   - Existing users → `/dashboard/study`
   - Middleware handles routing logic

5. **Error Handling**
   - Inline error messages in forms
   - Toast notifications for system errors
   - Graceful OAuth failure recovery

### Mobile-First Implementation Details

The hero section employs a sophisticated mobile-first strategy:

```tsx
// Mobile layout is default (no breakpoint prefix)
<div className="lg:hidden flex flex-col items-center text-center">

// Desktop layout requires explicit breakpoint
<div className="hidden lg:block">
```

This ensures mobile users get optimized layout immediately without CSS overrides.

### Color Psychology in Marketing

The warm color palette serves specific psychological purposes:
- **Cream backgrounds** (#FFFEFB): Comfort, approachability
- **Salmon CTAs** (#D97757): Energy without aggression
- **Stone text** (#1A1A1A): Readability without harshness

### Future-Proofing Considerations

While not implementing features speculatively, the architecture supports:
- Additional landing page sections (features, testimonials)
- A/B testing different hero messages
- Analytics integration points
- Internationalization through Next.js i18n
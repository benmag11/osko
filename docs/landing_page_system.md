# Landing Page System Documentation

## Overview
The landing page system is the primary entry point for unauthenticated users, designed to convert visitors into registered users through a minimalist, high-impact design. It features a bold hero section, interactive typewriter animation, visual exam showcase, and clear call-to-action elements that emphasize the platform's free nature as a competitive advantage.

## Architecture
The landing page follows a component-based architecture using Next.js App Router with server-side rendering for optimal SEO and initial load performance. The system employs a modular design where each section is a self-contained component, allowing for easy A/B testing and content updates. The architecture prioritizes performance through static rendering while maintaining interactive elements through selective client-side hydration.

## File Structure
```
src/app/page.tsx                           # Main landing page route
src/components/landing/
├── navigation.tsx                         # Header navigation with auth links
├── hero-section.tsx                       # Bold headline section
├── typewriter-word.tsx                    # Animated typewriter effect component
├── exam-showcase.tsx                      # Visual product showcase
└── cta-section.tsx                        # Call-to-action with typewriter

public/
├── hero-image.webp                        # Main product screenshot (117KB)
├── logo-full.svg                          # Complete logo with text
├── logo-icon.svg                          # Icon-only logo variant
└── logo-text.svg                          # Text-only logo variant

src/lib/hooks/use-safe-timeout.ts          # Timeout management for animations
```

## Core Components

### Main Landing Page (`src/app/page.tsx`)
The root component orchestrates the landing page layout and section composition:

```tsx
export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream-50">
      <LandingNavigation />
      <main className="container mx-auto px-4">
        <HeroSection />
        <ExamShowcase />
        <CTASection />
      </main>
    </div>
  )
}
```

The page uses a cream background (`bg-cream-50`) establishing the warm, inviting aesthetic. The container wrapper ensures consistent horizontal padding and centering across all viewport sizes.

### Landing Navigation (`navigation.tsx`)
A minimal header component providing brand identity and authentication entry points:

```tsx
export function LandingNavigation() {
  return (
    <header className="bg-cream-50 border-b border-stone-200">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-full.svg" alt="Osko" width={76} height={20} priority />
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/auth/signin" 
            className="text-sm font-medium text-warm-text-secondary hover:text-salmon-500 transition-colors">
            Log in
          </Link>
          <Button asChild size="sm">
            <Link href="/auth/signup">Sign up</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
```

Key design decisions:
- Fixed height logo (20px) maintains consistent header height
- Salmon color (`salmon-500`) on hover provides visual feedback
- Primary CTA uses filled button while secondary uses text link
- Priority loading on logo ensures immediate brand visibility

### Hero Section (`hero-section.tsx`)
The hero creates immediate impact through typographic hierarchy and strategic color usage:

```tsx
export function HeroSection() {
  return (
    <section className="pt-16 pb-16 md:pt-24 md:pb-12 text-center">
      <h1 className="font-serif font-bold tracking-tight">
        <span className="block text-7xl md:text-8xl lg:text-9xl text-warm-text-primary">
          It's Studyclix...
        </span>
        <span className="block mt-5 text-5xl md:text-7xl lg:text-8xl">
          <span className="text-warm-text-muted">But it's </span>
          <span className="text-salmon-500">free</span>
        </span>
      </h1>
    </section>
  )
}
```

Typography scales responsively:
- Mobile: 7xl (72px) primary, 5xl (48px) secondary
- Tablet: 8xl (96px) primary, 7xl (72px) secondary
- Desktop: 9xl (128px) primary, 8xl (96px) secondary

The competitive positioning ("It's Studyclix... But it's free") immediately communicates value proposition through contrast between competitor name and differentiator.

### Typewriter Animation Component (`typewriter-word.tsx`)
Complex client-side animation component managing typewriter effect with full lifecycle control:

```tsx
interface TypewriterSequence {
  text: string;
  deleteAfter?: boolean;
  pauseAfter?: number;
}

export default function TypewriterWord({
  sequences = [
    { text: "keyword", deleteAfter: true },
    { text: "topic", deleteAfter: true },
    { text: "year", deleteAfter: true },
  ],
  typingSpeed = 80,
  startDelay = 500,
  autoLoop = true,
  loopDelay = 500,
}: TypewriterWordProps) {
  const [scope, animate] = useAnimate();
  const { setSafeTimeout, clearAllTimeouts } = useSafeTimeout();
  const isActiveRef = useRef(true);
  const isFirstRunRef = useRef(true);
```

The component handles:
- **SSR Hydration**: First word renders statically to prevent hydration mismatches
- **Memory Management**: Custom timeout hook prevents memory leaks
- **Animation Lifecycle**: Typing, pausing, deleting phases with configurable speeds
- **Loop Control**: Automatic looping with cleanup on unmount

Animation sequence flow:
1. Initial delay (500ms default)
2. Type characters at 80ms intervals
3. Pause after completion (1500ms for CTA usage)
4. Delete characters at 40ms intervals (2x speed)
5. Loop to next sequence or restart

### Exam Showcase (`exam-showcase.tsx`)
Visual product demonstration using optimized image loading:

```tsx
export function ExamShowcase() {
  return (
    <section className="py-4 md:py-6">
      <div className="relative md:rounded-lg md:p-8">
        <Image
          src="/hero-image.webp"
          alt="Osko exam interface showing Mathematics questions with filters"
          width={1200}
          height={675}
          className="w-full h-auto rounded-lg shadow-[0_0_30px_10px_rgba(2,117,222,0.25)]"
          priority
        />
      </div>
    </section>
  )
}
```

Image optimization strategies:
- WebP format for 30% smaller file size
- Priority loading prevents layout shift
- Aspect ratio (16:9) maintained with responsive sizing
- Custom shadow creates depth with brand color glow

### CTA Section (`cta-section.tsx`)
Conversion-focused section combining animation with clear actions:

```tsx
export function CTASection() {
  return (
    <section className="pt-8 pb-12 md:pt-10 md:pb-16">
      <div className="max-w-md mx-auto">
        <h2 className="text-center mb-6 font-serif">
          <span className="block text-2xl md:text-3xl text-warm-text-muted">Study by</span>
          <div className="h-[72px] md:h-[84px] mt-2 flex items-center justify-center">
            <span className="text-5xl md:text-6xl font-bold text-warm-text-primary">
              <TypewriterWord 
                sequences={[
                  { text: "keyword", deleteAfter: true, pauseAfter: 1500 },
                  { text: "topic", deleteAfter: true, pauseAfter: 1500 },
                  { text: "year", deleteAfter: false, pauseAfter: 1500 }
                ]}
              />
            </span>
          </div>
        </h2>
        <div className="flex flex-col gap-4">
          <Button asChild size="lg" className="w-full">
            <Link href="/auth/signup">Sign up</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/auth/signin">Sign in</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
```

The fixed height container (`h-[72px]`) prevents layout shift during animation. The typewriter showcases key product features (search by keyword, topic, year) while maintaining visual engagement.

## Data Flow
The landing page operates as a static system with no server-state dependencies:

1. **Initial Render**: Server-side rendered with all content except typewriter animation
2. **Hydration**: Client-side JavaScript activates interactive elements
3. **Animation Start**: Typewriter begins after 500ms delay post-hydration
4. **User Interaction**: Navigation triggers client-side routing to auth pages
5. **Session Check**: Auth pages validate session state before rendering forms

## Key Functions and Hooks

### useSafeTimeout Hook
Critical for animation memory management:

```typescript
export function useSafeTimeout() {
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set())

  const setSafeTimeout = useCallback((callback: () => void, delay: number): NodeJS.Timeout => {
    const timeoutId = setTimeout(() => {
      timeoutsRef.current.delete(timeoutId)
      callback()
    }, delay)
    
    timeoutsRef.current.add(timeoutId)
    return timeoutId
  }, [])

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current.clear()
  }, [])

  useEffect(() => {
    const timeouts = timeoutsRef.current
    return () => {
      timeouts.forEach(clearTimeout)
      timeouts.clear()
    }
  }, [])
```

The hook maintains a Set of active timeouts, automatically clearing them on unmount to prevent memory leaks - crucial for the typewriter's multiple concurrent timeouts.

## Integration Points

### Authentication System
Landing page integrates with auth system through:
- Direct links to `/auth/signin` and `/auth/signup` routes
- Session state checked in root layout for redirect logic
- No protected content on landing ensures fast initial load

### Design System
Utilizes global design tokens:
- **Colors**: `cream-50`, `salmon-500`, `warm-text-*` palette
- **Typography**: Source Serif for headings, Source Sans for body
- **Components**: Button component with variant system
- **Spacing**: Consistent padding scale (4, 8, 12, 16, 24)

### Router Integration
Leverages Next.js App Router features:
- Static rendering by default for SEO optimization
- Client-side navigation via Link components
- Image optimization through Next.js Image component
- Font optimization with next/font

## Configuration

### Color Palette
Defined in `tailwind.config.ts`:

```javascript
"cream": {
  50: "#FFFEFB",  // Primary background
  100: "#FFFEFD", // Hover states
  200: "#FFFDF8", // Elevated surfaces
  300: "#FFF9F0", // Borders
},
"salmon": {
  300: "#dda896", // Muted accent
  400: "#E59C84", // Secondary accent
  500: "#D97757", // Primary accent (CTAs)
  600: "#C2410C", // Pressed state
},
"warm": {
  "text-primary": "#1A1A1A",   // Headlines
  "text-secondary": "#4A4A4A", // Body text
  "text-muted": "#6B6B6B",     // Secondary text
  "text-subtle": "#9A9A9A",    // Disabled states
}
```

### Responsive Breakpoints
Standard Tailwind breakpoints with mobile-first approach:
- Base: < 640px (mobile)
- `md:` ≥ 768px (tablet)
- `lg:` ≥ 1024px (desktop)
- `xl:` ≥ 1280px (wide desktop)

## Type Definitions

### TypewriterSequence Interface
```typescript
interface TypewriterSequence {
  text: string;           // Text to type
  deleteAfter?: boolean;  // Whether to delete after typing
  pauseAfter?: number;    // Milliseconds to pause after typing
}
```

### TypewriterWordProps Interface
```typescript
interface TypewriterWordProps {
  sequences?: TypewriterSequence[];  // Array of text sequences
  typingSpeed?: number;               // Ms between characters (default: 80)
  startDelay?: number;                // Ms before animation starts (default: 500)
  autoLoop?: boolean;                 // Whether to loop sequences (default: true)
  loopDelay?: number;                 // Ms between loops (default: 500)
  className?: string;                 // Additional CSS classes
}
```

## Implementation Details

### Typewriter Animation State Machine
The typewriter component implements a complex state machine:

```typescript
const runTypewriterAnimation = useCallback(async () => {
  const titleElement = scope.current?.querySelector("[data-typewriter]");
  
  while (isActiveRef.current) {
    // Skip clearing on first run for SSR hydration
    if (!isFirstRunRef.current) {
      await animate(scope.current, { opacity: 1 });
      titleElement.textContent = "";
    }

    // Process each sequence
    for (let sequenceIndex = 0; sequenceIndex < sequences.length; sequenceIndex++) {
      const sequence = sequences[sequenceIndex];
      
      // Type phase
      for (let i = 0; i < sequence.text.length; i++) {
        await new Promise((resolve) => {
          setSafeTimeout(() => {
            typeCharacter(titleElement, sequence.text, i);
            resolve();
          }, typingSpeed);
        });
      }
      
      // Delete phase (if configured)
      if (sequence.deleteAfter) {
        for (let i = sequence.text.length; i > 0; i--) {
          await new Promise((resolve) => {
            setSafeTimeout(() => {
              deleteCharacter(titleElement, sequence.text, i);
              resolve();
            }, typingSpeed / 2);
          });
        }
      }
    }
  }
});
```

### Image Optimization Strategy
The hero image uses multiple optimization techniques:
1. **Format**: WebP provides 30% size reduction over JPEG
2. **Dimensions**: 1200x675 matches common social media preview ratios
3. **Loading**: Priority flag prevents lazy loading
4. **Responsive**: `w-full h-auto` maintains aspect ratio across breakpoints

### Shadow Effect Implementation
Custom box-shadow creates brand-colored glow:
```css
shadow-[0_0_30px_10px_rgba(2,117,222,0.25)]
```
- Offset: 0,0 (centered glow)
- Blur: 30px (soft edge)
- Spread: 10px (extended reach)
- Color: Sky blue with 25% opacity

## Dependencies

### External Dependencies
- **motion**: v12.23.12 - Animation library for typewriter effect
- **@radix-ui/react-slot**: Component composition for Button asChild
- **class-variance-authority**: Button variant management
- **tailwindcss-animate**: CSS animation utilities

### Internal Dependencies
- `/components/ui/button`: Shared button component
- `/lib/hooks/use-safe-timeout`: Timeout management hook
- `/lib/utils`: Utility functions (cn for className merging)

## API Reference
The landing page system exposes no public APIs as it operates as a static presentation layer. All components are internal and not designed for external consumption.

## Other Notes

### Performance Considerations
1. **Static Generation**: Landing page is statically generated at build time for optimal performance
2. **Font Loading**: Source Serif and Source Sans use `display: 'swap'` for immediate text rendering
3. **Image Priority**: Logo and hero image load with priority to prevent layout shift
4. **Code Splitting**: Typewriter component is dynamically imported only when rendered

### SEO Optimization
- Semantic HTML structure with proper heading hierarchy
- Descriptive alt text for images
- Static rendering ensures full content indexing
- No JavaScript required for core content visibility

### Accessibility Features
- Proper heading hierarchy (h1 for hero, h2 for CTA)
- Sufficient color contrast ratios (checked against WCAG AA)
- Keyboard navigation support through native elements
- Focus states defined for interactive elements

### Browser Compatibility
- CSS Grid and Flexbox for layout (98%+ browser support)
- WebP images with fallback considerations
- Modern JavaScript features transpiled by Next.js
- Responsive design tested across major browsers

### Animation Performance
The typewriter animation uses several optimizations:
- RAF (via motion library) for smooth 60fps animation
- Ref-based state to avoid React re-renders
- Cleanup on unmount prevents memory leaks
- Debounced character updates reduce DOM operations

### Conversion Optimization Strategies
1. **Above-the-fold content**: All critical elements visible without scrolling on desktop
2. **Single value proposition**: "Free" as primary differentiator
3. **Dual CTAs**: Accommodate both new and returning users
4. **Visual proof**: Product screenshot demonstrates immediate value
5. **Minimal friction**: Two-click path to registration

### Mobile-First Responsive Design
Breakpoint progression ensures optimal experience:
- **Mobile**: Stacked layout, reduced font sizes, full-width CTAs
- **Tablet**: Increased spacing, larger typography
- **Desktop**: Maximum typography scale, centered content with margins

### A/B Testing Readiness
Component architecture supports easy testing:
- Self-contained sections enable variant swapping
- Props-based configuration for copy changes
- Isolated styling allows visual experimentation
- No interdependencies between sections
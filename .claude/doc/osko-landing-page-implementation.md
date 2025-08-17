# Osko Landing Page Implementation Plan

## Overview
Create a pixel-perfect landing page for the Osko exam papers study website based on provided mobile and desktop designs. The page will feature a clean navigation bar, compelling hero section with the tagline "It's Studyclix... But it's free", and showcase the exam interface with a call-to-action section.

## Design Specifications

### Color Scheme
- Primary Blue: `#0275DE` (from logo, used for "free" text and buttons)
- Black: `#000000` (main heading text)
- Gray: `#9CA3AF` (for "But it's" text)
- Background: White (`#FFFFFF`)
- Button hover states: Darker blue (`#0262B8`)

### Typography
- Hero Text: Extra large, bold font (text-6xl on mobile, text-7xl/8xl on desktop)
- Navigation: Medium font weight, standard size
- Button text: Medium font weight

### Responsive Breakpoints
- Mobile: < 768px
- Desktop: >= 768px

## File Structure & Implementation

### 1. Main Landing Page Component
**File**: `/src/app/page.tsx`

```tsx
import { LandingNavigation } from '@/components/landing/navigation'
import { HeroSection } from '@/components/landing/hero-section'
import { ExamShowcase } from '@/components/landing/exam-showcase'
import { CTASection } from '@/components/landing/cta-section'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
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

### 2. Navigation Component
**File**: `/src/components/landing/navigation.tsx`

**Requirements**:
- Logo with blue square icon and "Osko" text on left
- "Log in" text link and "Sign up" button on right
- Sticky positioning
- Responsive padding

**Implementation Details**:
```tsx
// Component structure
- Fixed/sticky header with white background
- Flex container with justify-between
- Logo as Image component (Next.js optimized)
- Navigation items with proper spacing
- Sign up button using shadcn Button component with default variant
- Log in as text link with hover state
```

**Key Classes**:
- Container: `sticky top-0 z-50 bg-white border-b`
- Inner wrapper: `container mx-auto px-4 py-4 flex items-center justify-between`
- Logo wrapper: `flex items-center gap-2`
- Nav items: `flex items-center gap-4`

### 3. Hero Section Component
**File**: `/src/components/landing/hero-section.tsx`

**Requirements**:
- Large, bold text "It's Studyclix..."
- "But it's free" with "free" in blue
- Proper responsive sizing
- Centered on mobile, left-aligned on desktop

**Implementation Details**:
```tsx
// Text structure
<div className="py-16 md:py-24">
  <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold">
    <span className="block">It's Studyclix...</span>
    <span className="block mt-2">
      <span className="text-gray-400">But it's </span>
      <span className="text-[#0275DE]">free</span>
    </span>
  </h1>
</div>
```

### 4. Exam Showcase Component
**File**: `/src/components/landing/exam-showcase.tsx`

**Requirements**:
- Display hero-image.webp
- Dashed border on desktop
- Proper aspect ratio maintenance
- Responsive sizing

**Implementation Details**:
```tsx
// Image container structure
<div className="py-8 md:py-12">
  <div className="relative md:border-2 md:border-dashed md:border-gray-300 md:rounded-lg md:p-8">
    <Image
      src="/hero-image.webp"
      alt="Osko exam interface showing Mathematics questions with filters"
      width={1200}
      height={675}
      className="w-full h-auto rounded-lg shadow-lg"
      priority
    />
  </div>
</div>
```

### 5. CTA Section Component
**File**: `/src/components/landing/cta-section.tsx`

**Requirements**:
- "Study by Keyword" heading
- Full-width buttons on mobile
- Centered buttons on desktop
- Sign up button (primary) and Sign in button (outline variant)

**Implementation Details**:
```tsx
// Section structure
<section className="py-12 md:py-16">
  <div className="max-w-md mx-auto">
    <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">
      Study by Keyword
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
```

## Component Dependencies

### Required shadcn/ui Components
Already installed:
- `Button` - For navigation and CTA buttons
- `Separator` - May be useful for visual dividers

### Next.js Components
- `Image` from 'next/image' - For optimized image loading
- `Link` from 'next/link' - For client-side navigation

## Implementation Steps

1. **Create component directory structure**:
   ```
   src/components/landing/
   ├── navigation.tsx
   ├── hero-section.tsx
   ├── exam-showcase.tsx
   └── cta-section.tsx
   ```

2. **Implement Navigation Component**:
   - Add logo display with Next.js Image
   - Implement responsive navigation items
   - Add proper link routing to auth pages

3. **Implement Hero Section**:
   - Create responsive text sizing
   - Apply proper color to "free" text
   - Add responsive spacing

4. **Implement Exam Showcase**:
   - Display hero image with proper optimization
   - Add dashed border for desktop only
   - Ensure responsive behavior

5. **Implement CTA Section**:
   - Create centered layout container
   - Add full-width buttons
   - Implement proper routing

6. **Update main page.tsx**:
   - Import all components
   - Compose final layout
   - Add container and spacing

## Mobile-First Considerations

1. **Navigation**:
   - Smaller logo on mobile
   - Compact button sizes
   - Reduced padding

2. **Hero Text**:
   - Smaller font size on mobile (text-5xl)
   - Centered alignment on mobile
   - Reduced vertical spacing

3. **Exam Showcase**:
   - Full-width image on mobile
   - No dashed border on mobile
   - Smaller padding

4. **CTA Section**:
   - Full-width buttons on mobile
   - Stack buttons vertically
   - Consistent spacing

## Accessibility Requirements

1. **Semantic HTML**:
   - Use proper heading hierarchy (h1 for hero, h2 for CTA)
   - nav element for navigation
   - main element for content

2. **ARIA Labels**:
   - Proper alt text for images
   - Button labels clearly indicate action
   - Link text is descriptive

3. **Keyboard Navigation**:
   - All interactive elements focusable
   - Visible focus indicators
   - Logical tab order

## Performance Optimizations

1. **Image Optimization**:
   - Use Next.js Image component with priority loading for hero image
   - Specify width and height for layout stability
   - Use WebP format for hero-image

2. **Code Splitting**:
   - Components are already code-split by Next.js
   - No additional lazy loading needed for landing page

3. **CSS Optimization**:
   - Use Tailwind classes for all styling
   - No custom CSS files needed
   - Leverage Tailwind's built-in purging

## Testing Checklist

- [ ] Logo displays correctly with proper sizing
- [ ] Navigation links work correctly
- [ ] Hero text displays with correct colors and sizing
- [ ] Hero image loads and displays properly
- [ ] Dashed border appears only on desktop
- [ ] CTA buttons link to correct auth pages
- [ ] Mobile responsive behavior works correctly
- [ ] Desktop layout matches design
- [ ] All interactive elements are keyboard accessible
- [ ] Page loads quickly with optimized images

## Important Notes

1. **Assets**: Both `/public/logo.svg` and `/public/hero-image.webp` are already available in the project

2. **Routing**: Auth pages are already implemented at:
   - `/auth/signup` - Sign up page
   - `/auth/signin` - Sign in page

3. **Styling**: Project uses Tailwind v4, ensure all classes are compatible

4. **Color Accuracy**: The blue color `#0275DE` should be used exactly as specified for brand consistency

5. **Component Reusability**: These landing components are specific to the landing page and separate from the main app components

## Potential Enhancements (Future)

- Add subtle animations (fade-in, slide-up) using Tailwind animation classes
- Implement smooth scroll behavior
- Add loading states for buttons
- Consider adding testimonials or feature sections
- Add footer with additional links
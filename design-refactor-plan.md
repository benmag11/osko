# Comprehensive Design System Refactor Plan

## Executive Summary
Complete redesign of the website's visual identity, moving from cold blues/grays to a warm, sophisticated color palette with professional typography using Source Serif Pro and Source Sans Pro. This refactor will touch every component while maintaining Tailwind CSS v4 best practices.

## 1. DESIGN SYSTEM FOUNDATION

### 1.1 Color System

#### Primary Palette (Warm Tones)
```css
/* Backgrounds */
--color-cream-50: #FFFEFB;    /* Main background (exam-viewer, pages) */
--color-cream-100: #FFFEFD;   /* Sidebar background */
--color-cream-200: #FFFDF8;   /* Card backgrounds */
--color-cream-300: #FFF9F0;   /* Hover states */

/* Filter Section Colors (extracted from current implementation) */
--color-warm-beige: #F5F4ED;  /* Filter section background */
--color-warm-border: #F0EEE6; /* Filter section border */
--color-filter-bg: #FFFEFB;   /* Filter pill background */
--color-filter-border: #D0D0D0; /* Filter pill border */

/* Accent Colors (Warm) */
--color-salmon-400: #E59C84;  /* Clear filters text */
--color-salmon-500: #D97757;  /* Primary CTA */
--color-salmon-600: #C2410C;  /* Hover states */
--color-coral-400: #FB923C;   /* Secondary accents */
--color-coral-500: #EA580C;   /* Active states */

/* Text Colors (Warm Neutrals) */
--color-text-primary: #3D2E2A;   /* Main headings (warm dark brown) */
--color-text-secondary: #5C4A45; /* Body text (medium warm brown) */
--color-text-muted: #8B7A75;     /* Muted text (light warm gray) */
--color-text-subtle: #A39490;    /* Very subtle text */

/* Neutral Grays (Warm-tinted) */
--color-stone-100: #F5F5F4;
--color-stone-200: #E7E5E4;
--color-stone-300: #D6D3D1;
--color-stone-400: #A8A29E;
--color-stone-500: #78716C;
--color-stone-600: #57534E;
--color-stone-700: #44403C;
--color-stone-800: #292524;

/* Semantic Colors */
--color-success: #84CC16;     /* Success states */
--color-warning: #FBB040;     /* Warning states */
--color-error: #EF4444;       /* Error states */
--color-info: #3B82F6;        /* Info states */
```

### 1.2 Typography System

#### Font Families
```css
/* Serif for headings and important text */
--font-serif: 'Source Serif Pro', Georgia, serif;

/* Sans for body text and UI elements */
--font-sans: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, sans-serif;

/* Monospace for code and technical content */
--font-mono: 'JetBrains Mono', 'Courier New', monospace;
```

#### Typography Scale & Usage
```css
/* Display - Source Serif Pro */
--text-display-large: 4.5rem;   /* 72px - Hero headings */
--text-display-medium: 3.75rem; /* 60px - Section headings */
--text-display-small: 3rem;     /* 48px - Page titles */

/* Headings - Source Serif Pro */
--text-h1: 2.5rem;    /* 40px - Main headings */
--text-h2: 2rem;      /* 32px - Section headings */
--text-h3: 1.75rem;   /* 28px - Subsection headings */
--text-h4: 1.5rem;    /* 24px - Card headings */
--text-h5: 1.25rem;   /* 20px - Small headings */
--text-h6: 1.125rem;  /* 18px - Tiny headings */

/* Body - Source Sans Pro */
--text-body-large: 1.125rem;  /* 18px - Large body text */
--text-body: 1rem;             /* 16px - Regular body text */
--text-body-small: 0.875rem;  /* 14px - Small body text */
--text-caption: 0.75rem;      /* 12px - Captions */
--text-tiny: 0.625rem;         /* 10px - Tiny text */

/* Line Heights */
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 1.3 Component-Specific Typography Rules

#### Where to Use Each Font:
- **Source Serif Pro**:
  - All headings (h1-h6)
  - Landing page hero text
  - Navigation brand text
  - Card titles
  - Modal headers
  - Filter section headers ("Applied filters")
  - Dashboard section titles
  
- **Source Sans Pro**:
  - All body text
  - Button text
  - Form labels and inputs
  - Navigation links
  - Filter pills
  - Tooltips
  - Table content
  - Sidebar menu items
  - Breadcrumbs
  - Badges

## 2. TAILWIND CONFIGURATION UPDATES

### 2.1 Files to Update

#### `/tailwind.config.ts`
```typescript
// Complete replacement with new warm color system
// Add Source Serif Pro and Source Sans Pro
// Remove all cold blue/gray colors
// Add new spacing and sizing scales
```

#### `/src/app/globals.css`
```css
// Update all CSS variables to warm palette
// Add @font-face declarations for custom fonts
// Update theme directive with new colors
// Add typography utilities
```

## 3. COMPONENT-BY-COMPONENT REFACTOR LIST

### 3.1 Core Layout Files
1. **`/src/app/layout.tsx`**
   - Add font imports for Source Serif Pro and Source Sans Pro
   - Apply base font classes to body

2. **`/src/app/globals.css`**
   - Replace all color variables with warm palette
   - Add font-face declarations
   - Update base styles

### 3.2 Landing Page Components
3. **`/src/app/page.tsx`**
   - Update background color to cream-50

4. **`/src/components/landing/hero-section.tsx`**
   - Apply Source Serif Pro to all headings
   - Update text colors to warm palette
   - Change blue accent to salmon-500

5. **`/src/components/landing/navigation.tsx`**
   - Update nav background to cream-50
   - Apply Source Sans Pro to links
   - Update hover states to warm colors

6. **`/src/components/landing/exam-showcase.tsx`**
   - Update showcase background
   - Apply new typography scale

7. **`/src/components/landing/cta-section.tsx`**
   - Apply Source Serif Pro to heading
   - Update CTA button colors to salmon palette

8. **`/src/components/landing/typewriter-word.tsx`**
   - Apply Source Serif Pro for animated text
   - Update cursor color to salmon

### 3.3 Authentication Components
9. **`/src/components/auth/login-form.tsx`**
   - Update form background to cream-100
   - Apply Source Sans Pro to labels
   - Update button colors

10. **`/src/components/auth/signup-form.tsx`**
    - Same as login-form updates

11. **`/src/components/auth/oauth-buttons.tsx`**
    - Update button styles with warm accents

12. **`/src/components/auth/otp-verification-form.tsx`**
    - Update OTP input styles
    - Apply Source Sans Pro

### 3.4 Filter Components (Critical - Reference Design)
13. **`/src/components/filters/applied-filters-display.tsx`**
    - Keep existing warm colors as reference
    - Apply Source Serif Pro to "Applied filters" heading
    - Ensure consistent spacing

14. **`/src/components/filters/filter-tag.tsx`**
    - Maintain current warm styling
    - Apply Source Sans Pro for text

15. **`/src/components/filters/clear-filters-button.tsx`**
    - Keep salmon color scheme
    - Apply Source Sans Pro

16. **`/src/components/filters/search-filter.tsx`**
    - Update input styles with warm borders
    - Apply Source Sans Pro

17. **`/src/components/filters/year-filter.tsx`**
    - Update checkbox styles
    - Apply Source Sans Pro to labels

18. **`/src/components/filters/topic-filter.tsx`**
    - Same as year-filter updates

19. **`/src/components/filters/collapsible-filter.tsx`**
    - Update collapse icon colors
    - Apply typography system

### 3.5 Layout Components
20. **`/src/components/layout/app-sidebar.tsx`**
    - Update sidebar background to cream-100
    - Apply Source Sans Pro to menu items
    - Update active states with warm colors

21. **`/src/components/layout/exam-sidebar.tsx`**
    - Update background to cream-100
    - Apply typography system
    - Update border colors

22. **`/src/components/layout/nav-user.tsx`**
    - Update user menu styles
    - Apply Source Sans Pro

23. **`/src/components/layout/subject-switcher.tsx`**
    - Update dropdown styles
    - Apply Source Serif Pro to subject names

24. **`/src/components/layout/mobile-navbar.tsx`**
    - Update mobile nav background
    - Apply typography system

25. **`/src/components/layout/dashboard-breadcrumb.tsx`**
    - Apply Source Sans Pro
    - Update separator colors

### 3.6 Question Components
26. **`/src/components/questions/question-card.tsx`**
    - Apply Source Serif Pro to question titles
    - Update card backgrounds to cream-200
    - Update button colors to salmon palette

27. **`/src/components/questions/question-list.tsx`**
    - Update list container styles
    - Apply consistent spacing

### 3.7 UI Components (shadcn/ui)
28. **`/src/components/ui/button.tsx`**
    - Update all button variants with warm colors
    - Apply Source Sans Pro
    - Update hover/active states

29. **`/src/components/ui/input.tsx`**
    - Update border colors to stone-300
    - Apply Source Sans Pro
    - Update focus states with salmon ring

30. **`/src/components/ui/card.tsx`**
    - Update card background to cream-200
    - Update border colors

31. **`/src/components/ui/checkbox.tsx`**
    - Update checked state to salmon-500
    - Update border colors

32. **`/src/components/ui/select.tsx`**
    - Update dropdown styles
    - Apply Source Sans Pro

33. **`/src/components/ui/dialog.tsx`**
    - Update modal background
    - Apply Source Serif Pro to headers

34. **`/src/components/ui/dropdown-menu.tsx`**
    - Update menu background to cream-100
    - Apply Source Sans Pro

35. **`/src/components/ui/label.tsx`**
    - Apply Source Sans Pro
    - Update text color to text-secondary

36. **`/src/components/ui/badge.tsx`**
    - Update badge colors with warm palette
    - Apply Source Sans Pro

37. **`/src/components/ui/tooltip.tsx`**
    - Update tooltip background
    - Apply Source Sans Pro

38. **`/src/components/ui/separator.tsx`**
    - Update separator color to stone-200

39. **`/src/components/ui/sidebar.tsx`**
    - Update all sidebar component styles
    - Apply typography system

40. **`/src/components/ui/skeleton.tsx`**
    - Update skeleton animation colors

41. **`/src/components/ui/scroll-area.tsx`**
    - Update scrollbar colors

42. **`/src/components/ui/collapsible.tsx`**
    - Update transition styles

43. **`/src/components/ui/sheet.tsx`**
    - Update sheet background
    - Apply typography system

44. **`/src/components/ui/progress.tsx`**
    - Update progress bar colors to salmon

45. **`/src/components/ui/avatar.tsx`**
    - Update avatar placeholder colors

46. **`/src/components/ui/sonner.tsx`**
    - Update toast notification styles

47. **`/src/components/ui/input-otp.tsx`**
    - Update OTP input styles

### 3.8 Onboarding Components
48. **`/src/components/onboarding/subject-card.tsx`**
    - Update card styles with warm colors
    - Apply Source Serif Pro to subject names

49. **`/src/components/onboarding/selected-subject-card.tsx`**
    - Update selected state colors

50. **`/src/components/onboarding/subject-selection-step.tsx`**
    - Update step container styles

51. **`/src/components/onboarding/name-step.tsx`**
    - Update form styles

52. **`/src/components/onboarding/progress-indicator.tsx`**
    - Update progress colors to salmon

### 3.9 Page Components
53. **`/src/app/subject/[slug]/page.tsx`**
    - Update page background to cream-50
    - Apply typography system

54. **`/src/app/dashboard/layout.tsx`**
    - Update dashboard wrapper styles

55. **`/src/app/dashboard/study/page.tsx`**
    - Update study page styles

56. **`/src/app/dashboard/settings/page.tsx`**
    - Update settings form styles

57. **`/src/app/dashboard/statistics/page.tsx`**
    - Update stats card styles

58. **`/src/app/auth/signin/page.tsx`**
    - Update auth page background

59. **`/src/app/auth/signup/page.tsx`**
    - Same as signin page

60. **`/src/app/onboarding/page.tsx`**
    - Update onboarding background

## 4. IMPLEMENTATION STRATEGY

### Phase 1: Foundation (Files 1-2)
1. Update Tailwind configuration with complete color system
2. Update globals.css with all CSS variables
3. Add font imports and declarations

### Phase 2: Core Components (Files 3-27)
1. Update landing page components
2. Update authentication components
3. Update filter components (maintain warm colors)

### Phase 3: Layout & Navigation (Files 20-25)
1. Update all sidebar components
2. Update navigation components
3. Update layout wrappers

### Phase 4: UI Library (Files 28-47)
1. Update all shadcn/ui components systematically
2. Test each component in isolation
3. Ensure consistency across variants

### Phase 5: Feature Components (Files 48-60)
1. Update onboarding flow
2. Update dashboard pages
3. Update question display components

### Phase 6: Final Polish
1. Run comprehensive visual regression tests
2. Check color contrast ratios for accessibility
3. Ensure responsive design consistency
4. Validate font loading performance

## 5. VALIDATION CHECKLIST

### Color Consistency
- [ ] All backgrounds use cream palette
- [ ] All text uses warm neutral colors
- [ ] All CTAs use salmon/coral accents
- [ ] No cold blues/grays remain

### Typography Consistency
- [ ] All headings use Source Serif Pro
- [ ] All body text uses Source Sans Pro
- [ ] Font weights are consistent
- [ ] Line heights provide good readability

### Component Consistency
- [ ] All buttons follow new design system
- [ ] All forms have consistent styling
- [ ] All cards use cream backgrounds
- [ ] All borders use warm stone colors

### Accessibility
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus states are clearly visible
- [ ] Interactive elements have proper hover states
- [ ] Text remains readable at all sizes

## 6. ROLLBACK STRATEGY

1. Create git branch: `feature/warm-design-system`
2. Commit changes in logical groups
3. Test each phase before proceeding
4. Keep original color values commented for reference
5. Document any breaking changes

## 7. PERFORMANCE CONSIDERATIONS

1. **Font Loading**:
   - Use font-display: swap for custom fonts
   - Preload critical font files
   - Subset fonts to reduce file size

2. **CSS Size**:
   - Remove unused color variables
   - Optimize Tailwind purge settings
   - Minimize custom CSS

3. **Build Optimization**:
   - Verify tree-shaking works correctly
   - Check bundle size impact
   - Optimize image assets if needed

## 8. TESTING REQUIREMENTS

1. **Visual Testing**:
   - Screenshot comparison for all pages
   - Cross-browser testing (Chrome, Firefox, Safari)
   - Mobile responsive testing

2. **Functional Testing**:
   - All interactive elements work correctly
   - Forms submit properly
   - Navigation functions as expected

3. **Accessibility Testing**:
   - Screen reader compatibility
   - Keyboard navigation
   - Color contrast validation

## 9. DOCUMENTATION UPDATES

1. Update style guide documentation
2. Create color palette reference sheet
3. Document typography usage guidelines
4. Update component library docs
5. Create migration guide for developers

## 10. ESTIMATED TIMELINE

- **Phase 1**: 2 hours (Foundation setup)
- **Phase 2**: 4 hours (Core components)
- **Phase 3**: 3 hours (Layout & Navigation)
- **Phase 4**: 5 hours (UI Library - most time-consuming)
- **Phase 5**: 3 hours (Feature components)
- **Phase 6**: 2 hours (Polish and testing)

**Total Estimated Time**: 19 hours of focused development

## APPENDIX A: Color Migration Map

| Old Color | New Color | Usage |
|-----------|-----------|-------|
| `#f6f8fc` (exam-background) | `#FFFEFB` (cream-50) | Main backgrounds |
| `#ffffff` (white) | `#FFFEFD` (cream-100) | Sidebar background |
| `#0275DE` (primary blue) | `#D97757` (salmon-500) | Primary CTAs |
| `#438FD5` (button blue) | `#E59C84` (salmon-400) | Secondary buttons |
| `#1b1b1b` (text-primary) | `#3D2E2A` (text-primary) | Main headings |
| `#424242` (text-secondary) | `#5C4A45` (text-secondary) | Body text |
| `#757575` (text-muted) | `#8B7A75` (text-muted) | Muted text |
| `#ededed` (border) | `#E7E5E4` (stone-200) | Borders |

## APPENDIX B: Font Loading Strategy

```html
<!-- Add to document head -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Source+Serif+Pro:wght@400;600;700&family=Source+Sans+Pro:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+Pro:wght@400;600;700&family=Source+Sans+Pro:wght@400;500;600;700&display=swap" media="print" onload="this.media='all'">
```

---

This plan provides a complete roadmap for transforming the entire website's design system from cold to warm colors while implementing professional typography and maintaining Tailwind CSS best practices.
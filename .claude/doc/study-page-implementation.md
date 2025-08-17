# Study Page Implementation Plan

## Overview
Create a beautiful, welcoming study dashboard page for the education platform that displays user's subjects in an organized grid layout with proper responsive design.

## File Structure & Changes

### 1. Create Main Study Page Component
**File:** `/src/app/dashboard/study/page.tsx`

**Implementation Details:**
```typescript
// Server Component (no 'use client' directive)
import { Card, CardContent } from '@/components/ui/card'
import { StudyPageClient } from './study-page-client'

// This will be a server component that fetches data
// For now, use placeholder data
export default async function StudyPage() {
  // Placeholder data structure
  const userData = {
    userName: "Ben", // This will come from auth/session
    subjects: [
      { id: '1', name: 'Mathematics', level: 'Higher Level', icon: 'Calculator' },
      { id: '2', name: 'Physics', level: 'Higher Level', icon: 'Atom' },
      { id: '3', name: 'Chemistry', level: 'Ordinary Level', icon: 'Flask' },
      // Add more subjects as needed
    ]
  }
  
  return <StudyPageClient {...userData} />
}
```

### 2. Create Client Component for Interactivity
**File:** `/src/app/dashboard/study/study-page-client.tsx`

**Key Features:**
- Use `'use client'` directive for hover effects and interactions
- Implement the full UI with:
  - Dynamic greeting based on time of day
  - Responsive grid layout
  - Beautiful card hover effects
  - Icon integration

**Component Structure:**
```typescript
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { 
  Calculator, 
  Atom, 
  Flask, 
  BookOpen, 
  Globe, 
  Languages,
  History,
  Palette
} from 'lucide-react'

interface Subject {
  id: string
  name: string  
  level: string
  icon: string
}

interface StudyPageClientProps {
  userName: string
  subjects: Subject[]
}

export function StudyPageClient({ userName, subjects }: StudyPageClientProps) {
  // Component implementation
}
```

## Design Specifications

### Color Scheme
- **Page Background:** Use the exam background color `#f6f8fc` (already defined as `--color-exam-background`)
- **Cards:** White (`bg-white`) with subtle borders
- **Text Colors:**
  - Primary text: `text-exam-text-primary` (#1b1b1b)
  - Secondary text: `text-exam-text-secondary` (#424242)
  - Muted text: `text-exam-text-muted` (#757575)

### Layout Structure

#### 1. Header Section
```jsx
<div className="mb-8">
  <h1 className="text-3xl font-semibold text-exam-text-primary">
    Good {timeOfDay}, {userName}
  </h1>
  <p className="text-lg text-exam-text-secondary mt-2">
    What are you studying today?
  </p>
</div>
```

**Time-based Greetings:**
- Morning: 5:00 - 11:59
- Afternoon: 12:00 - 16:59  
- Evening: 17:00 - 4:59

#### 2. Subject Cards Grid
```jsx
<section>
  <h2 className="text-xl font-semibold text-exam-text-primary mb-6">
    Your subjects
  </h2>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Subject cards */}
  </div>
</section>
```

#### 3. Individual Subject Card Design
```jsx
<Card className="
  bg-white 
  border border-exam-border 
  hover:border-exam-border-secondary 
  hover:shadow-md 
  transition-all 
  duration-200 
  cursor-pointer
  group
">
  <CardContent className="p-6 flex items-center gap-4">
    <div className="
      w-12 h-12 
      rounded-lg 
      bg-primary/10 
      flex items-center justify-center
      group-hover:bg-primary/15
      transition-colors
    ">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <div className="flex-1">
      <h3 className="font-semibold text-exam-text-primary text-lg">
        {subject.name}
      </h3>
      <p className="text-sm text-exam-text-muted mt-0.5">
        {subject.level}
      </p>
    </div>
  </CardContent>
</Card>
```

### Responsive Design Breakpoints
- **Mobile (< 768px):** 1 column, full width cards
- **Tablet (768px - 1024px):** 2 columns
- **Desktop (> 1024px):** 3 columns

### Spacing Guidelines
- Page padding: `p-6 lg:p-8`
- Section spacing: `mb-8` between major sections
- Card gap: `gap-4` in grid
- Internal card padding: `p-6`

## Icon Mapping Strategy

Create an icon mapping object:
```typescript
const iconMap = {
  'Calculator': Calculator,
  'Atom': Atom,
  'Flask': Flask,
  'BookOpen': BookOpen,
  'Globe': Globe,
  'Languages': Languages,
  'History': History,
  'Palette': Palette,
  // Add more as needed
}

// Usage in component
const IconComponent = iconMap[subject.icon] || BookOpen // Default to BookOpen
```

## Hover Effects & Interactions

### Card Hover States
1. Border color change: `border-exam-border` → `border-exam-border-secondary`
2. Shadow elevation: Add `shadow-md`
3. Icon background intensify: `bg-primary/10` → `bg-primary/15`
4. Smooth transitions: `transition-all duration-200`

### Click Behavior
- Cards should be clickable (add `cursor-pointer`)
- Future: Navigate to `/dashboard/study/[subjectId]`
- For now: Can add onClick handler that shows a toast or console.log

## CSS Custom Properties to Add

If not already present in globals.css, ensure these are defined:
```css
.text-exam-text-primary { color: var(--color-exam-text-primary); }
.text-exam-text-secondary { color: var(--color-exam-text-secondary); }
.text-exam-text-muted { color: var(--color-exam-text-muted); }
.border-exam-border { border-color: var(--color-exam-border); }
.border-exam-border-secondary { border-color: var(--color-exam-border-secondary); }
.bg-exam-background { background-color: var(--color-exam-background); }
```

## Full Page Structure

```tsx
<div className="min-h-screen bg-exam-background">
  <div className="p-6 lg:p-8 max-w-7xl mx-auto">
    {/* Header Section */}
    <header className="mb-8">
      {/* Greeting and subtitle */}
    </header>

    {/* Main Content */}
    <main>
      {/* Subject Cards Section */}
      <section>
        {/* Section title and grid */}
      </section>
    </main>
  </div>
</div>
```

## Implementation Steps

1. **Create the page.tsx file** in `/src/app/dashboard/study/`
2. **Create the study-page-client.tsx** file for client-side interactions
3. **Import required components** from shadcn/ui (Card, CardContent)
4. **Import icons** from lucide-react
5. **Implement time-based greeting logic**
6. **Create the responsive grid layout**
7. **Add hover effects and transitions**
8. **Test responsive behavior** at different breakpoints

## Future Enhancements

1. **Data Fetching:** 
   - Integrate with Supabase to fetch actual user subjects
   - Add loading states with Skeleton components
   - Error handling with error boundaries

2. **Navigation:**
   - Add routing to individual subject pages
   - Implement breadcrumb navigation

3. **Personalization:**
   - Add recently studied subjects section
   - Show progress indicators per subject
   - Display upcoming exams or deadlines

4. **Animations:**
   - Add subtle entrance animations for cards (stagger effect)
   - Smooth page transitions

## Dependencies Required
- All dependencies are already installed:
  - `lucide-react` for icons
  - `@/components/ui/card` from shadcn/ui
  - Tailwind CSS for styling

## Testing Checklist
- [ ] Responsive design works on all breakpoints
- [ ] Hover effects are smooth and consistent
- [ ] Time-based greeting updates correctly
- [ ] Cards are properly aligned in grid
- [ ] Colors match the exam theme
- [ ] Page integrates well with existing sidebar layout
- [ ] Accessibility: Keyboard navigation works
- [ ] Performance: No layout shifts on load

## Important Notes

1. **Server Component Pattern:** The main page.tsx is a server component for data fetching, while study-page-client.tsx handles client-side interactions.

2. **Type Safety:** Use TypeScript interfaces for all props to ensure type safety.

3. **Icon Flexibility:** The icon prop is a string that maps to actual icon components, allowing easy configuration from database.

4. **Consistent Theming:** Leverage existing CSS variables from the exam theme for consistency across the platform.

5. **Layout Integration:** The page will be wrapped by the existing dashboard layout with sidebar, so content should be designed to work within that context.

## Code Quality Standards
- Use semantic HTML elements
- Add proper ARIA labels for accessibility
- Implement proper error boundaries
- Use React.memo for optimization if needed
- Follow existing code patterns in the codebase
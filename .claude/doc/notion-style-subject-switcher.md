# Notion-Style Subject Switcher Implementation Plan

## Overview
Replace the current non-functional "Change Subject" dropdown in the sidebar with a clean, minimal Notion-style UI component that allows users to navigate between their subjects and back to the dashboard.

## Design Approach
- **Style**: Clean, minimal Notion-style interface with subtle hover states
- **Component**: Use shadcn/ui DropdownMenu for consistent behavior and accessibility
- **Icons**: Subject-specific icons from lucide-react library
- **Structure**: Hierarchical menu with "Back to Dashboard" and "My Subjects" sections

## Implementation Details

### 1. Update Subject Switcher Component
**File**: `/src/components/layout/subject-switcher.tsx`

#### Key Changes:
1. **Fetch User's Subjects**: Create a custom hook to fetch and cache user subjects
2. **Enhanced Dropdown Structure**:
   - "Back to Dashboard" action with Home icon
   - Separator
   - "My Subjects" group with subject list
   - Each subject shows name, level, and appropriate icon
3. **Navigation Logic**: Implement proper navigation using Next.js router
4. **Active State**: Highlight the currently active subject

#### Component Structure:
```tsx
<DropdownMenu>
  <DropdownMenuTrigger>
    [Current Subject Display]
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem> // Back to Dashboard
    <DropdownMenuSeparator />
    <DropdownMenuLabel> // My Subjects
    <DropdownMenuGroup>
      [Subject Items with Icons]
    </DropdownMenuGroup>
  </DropdownMenuContent>
</DropdownMenu>
```

### 2. Create User Subjects Hook
**File**: `/src/lib/hooks/use-user-subjects.ts` (NEW)

#### Purpose:
- Fetch user's enrolled subjects
- Cache results with React Query
- Return formatted data with slugs for navigation

#### Key Features:
- Integration with existing React Query setup
- Proper error handling
- Type-safe returns
- 5-minute cache time

### 3. Add Subject Icon Mapping Utility
**File**: `/src/lib/utils/subject-icons.ts` (NEW)

#### Purpose:
Map subject names to appropriate lucide-react icons

#### Icon Mappings:
- Mathematics → Calculator
- Physics → Atom
- Chemistry → Flask
- Biology → Microscope
- English → BookOpen
- History → Clock
- Geography → Globe
- Business → Briefcase
- Computer Science → Code
- Default → Book

### 4. Update Types (if needed)
**File**: `/src/lib/types/database.ts`

Add interface for UserSubject if not already present:
```typescript
export interface UserSubject {
  id: string
  user_id: string
  subject_name: string
  level: 'Higher' | 'Ordinary' | 'Foundation'
  created_at: string
}
```

## Component Implementation Details

### Subject Switcher Component Structure

```tsx
// Key imports
import { useRouter, usePathname } from 'next/navigation'
import { Home, ChevronsUpDown, [subject icons] } from 'lucide-react'
import { useUserSubjects } from '@/lib/hooks/use-user-subjects'
import { getSubjectIcon } from '@/lib/utils/subject-icons'
import { generateSlug } from '@/lib/utils/slug'

// Component logic
1. Fetch user subjects using custom hook
2. Get current pathname to determine active subject
3. Handle navigation on item click
4. Show loading state with Skeleton
5. Handle error states gracefully
```

### Styling Approach

#### Design Tokens:
- **Hover State**: `hover:bg-accent hover:text-accent-foreground`
- **Active State**: `bg-accent text-accent-foreground`
- **Transitions**: `transition-colors duration-200`
- **Icon Size**: `size-4` for consistency
- **Spacing**: Consistent padding using Tailwind classes

#### Visual Hierarchy:
1. Current subject display with icon and level
2. Clear separation between sections
3. Subtle label for "My Subjects"
4. Each subject item with icon, name, and level badge

### Navigation Logic

```typescript
const handleNavigation = (path: string) => {
  router.push(path)
  // Close dropdown after navigation
}

// For dashboard
handleNavigation('/dashboard/study')

// For subjects
handleNavigation(`/subject/${slug}`)
```

### Loading and Error States

#### Loading:
- Show skeleton loader in dropdown content
- Maintain trigger button functionality

#### Error:
- Fallback to simple navigation items
- Show error message if subjects fail to load
- Allow dashboard navigation regardless

## File Changes Summary

### Modified Files:
1. `/src/components/layout/subject-switcher.tsx` - Complete rewrite with new functionality

### New Files:
1. `/src/lib/hooks/use-user-subjects.ts` - Custom hook for fetching user subjects
2. `/src/lib/utils/subject-icons.ts` - Icon mapping utility

### Optional Updates:
1. `/src/lib/types/database.ts` - Add UserSubject interface if missing

## Dependencies
All required dependencies are already installed:
- `@tanstack/react-query` - For data fetching
- `lucide-react` - For icons
- `next/navigation` - For routing
- shadcn/ui components - Already configured

## Testing Checklist
- [ ] Subject switcher opens and closes properly
- [ ] All user subjects are displayed
- [ ] Navigation to dashboard works
- [ ] Navigation to each subject works
- [ ] Active subject is highlighted
- [ ] Loading state displays correctly
- [ ] Error state handled gracefully
- [ ] Mobile responsive behavior
- [ ] Keyboard navigation works
- [ ] Screen reader accessibility

## Performance Considerations
1. **Caching**: User subjects cached for 5 minutes via React Query
2. **Lazy Loading**: Icons loaded on demand
3. **Memoization**: Use React.memo if list is large
4. **Request Deduplication**: React Query prevents duplicate requests

## Accessibility Features
1. **ARIA Labels**: Proper labels for screen readers
2. **Keyboard Navigation**: Full keyboard support via DropdownMenu
3. **Focus Management**: Proper focus states and tab order
4. **Semantic HTML**: Correct use of menu roles

## Migration Notes
- No database changes required
- No breaking changes to existing components
- Backward compatible with current routing structure
- Uses existing authentication and data fetching patterns


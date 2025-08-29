# Filter Components Refactoring Plan

## Current Implementation Analysis

### Component Architecture
- **FilterPill**: Uses shadcn Button with variant="ghost", custom className overrides
- **ClearAllButton**: Uses shadcn Button with variant="ghost", custom className overrides  
- **AppliedFiltersSection**: Container component that orchestrates filter display

### Exact Current Styling Documentation

#### FilterPill Component
**Base Styles:**
- Layout: `inline-flex items-center justify-center gap-2.5` (10px gap between icon and text)
- Dimensions: `px-5 py-2` (20px horizontal, 8px vertical padding)
- Border: `border border-filter-pill-border` (1px solid #d0d0d0)
- Background: `bg-[#fffefb]` (off-white)
- Typography: `text-base font-normal text-[#404040]` (16px normal weight, dark gray)
- Border radius: `rounded-md` (6px from shadcn base)
- Transition: `transition-colors` (smooth color transitions)
- Shadow: `shadow-none` (no shadow)

**Icon:**
- Component: SquareX from lucide-react
- Size: `h-5 w-5` (20x20px)
- Color: `text-[#404040]` (matches text color)

**Hover State:**
- Border: `hover:border-orange-500` (rgb(249, 115, 22))
- Background: `hover:bg-orange-50` (rgb(255, 247, 237))
- Text: `hover:text-[#404040]` (unchanged)

**Accessibility:**
- Dynamic aria-label: `Remove ${label} filter`

#### ClearAllButton Component
**Base Styles:**
- Layout: `inline-flex items-center justify-center`
- Dimensions: `px-5 py-2` (20px horizontal, 8px vertical padding)
- Border: `border border-[rgb(217,119,87)]` (1px solid warm orange)
- Background: `bg-[#fffefb]` (off-white, same as pills)
- Typography: `text-base font-normal text-[rgb(217,119,87)]` (16px, warm orange)
- Border radius: `rounded-md` (6px from shadcn base)
- Transition: `transition-colors`
- Shadow: `shadow-none`

**Hover State:**
- Border: `hover:border-[rgb(194,65,12)]` (darker orange)
- Background: `hover:bg-orange-50` (rgb(255, 247, 237))
- Text: `hover:text-[rgb(194,65,12)]` (darker orange)

#### AppliedFiltersSection Container
**Container:**
- Shape: `rounded-[20px]` (20px border radius)
- Background: `bg-[#f5f4ed]` (light beige)
- Width: `w-full`
- Position: `relative` (for overlay border)

**Inner Layout:**
- Padding: `p-[35px]` (35px all sides)
- Flex layout: `flex flex-col`
- Gap: `gap-[41px]` (41px between heading and pills)

**Heading:**
- Font: `font-serif` (serif typeface)
- Size: `text-[40px]` (40px)
- Weight: `font-normal` (400)
- Line height: `leading-[29.892px]`
- Color: `text-[#2e2e2e]` (dark gray)
- Text: "Applied filters"

**Pills Container:**
- Layout: `flex flex-wrap items-start`
- Gap: `gap-2` (8px between pills)

**Overlay Border:**
- Position: `absolute inset-0`
- Shape: `rounded-[20px]` (matches container)
- Border: `border border-[#f0eee6]` (1px solid light border)
- Interaction: `pointer-events-none` (decorative only)
- Accessibility: `aria-hidden="true"`

### Inherited Button Styles (from shadcn)
**Base button class:**
```
inline-flex items-center justify-center gap-2 whitespace-nowrap 
rounded-md text-sm font-medium transition-all 
disabled:pointer-events-none disabled:opacity-50
```

**Ghost variant adds:**
```
hover:bg-accent hover:text-accent-foreground
```

**Default size:**
```
h-9 px-4 py-2
```

## Refactoring Implementation Plan

### Phase 1: New Component Creation

#### 1. Create `/src/components/filters/filter-tag.tsx`
```tsx
'use client'

interface FilterTagProps {
  label: string
  onRemove: () => void
}

export function FilterTag({ label, onRemove }: FilterTagProps) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center justify-center gap-2.5 rounded-md border border-[#d0d0d0] bg-[#fffefb] px-5 py-2 text-base font-normal text-[#404040] transition-colors hover:border-orange-500 hover:bg-orange-50"
      aria-label={`Remove ${label} filter`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <path d="m15 9-6 6" />
        <path d="m9 9 6 6" />
      </svg>
      {label}
    </button>
  )
}
```

#### 2. Create `/src/components/filters/clear-filters-button.tsx`
```tsx
'use client'

interface ClearFiltersButtonProps {
  onClick: () => void
}

export function ClearFiltersButton({ onClick }: ClearFiltersButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-md border border-[rgb(217,119,87)] bg-[#fffefb] px-5 py-2 text-base font-normal text-[rgb(217,119,87)] transition-colors hover:border-[rgb(194,65,12)] hover:bg-orange-50 hover:text-[rgb(194,65,12)]"
    >
      Clear all
    </button>
  )
}
```

#### 3. Create `/src/components/filters/applied-filters-display.tsx`
```tsx
'use client'

import { FilterTag } from './filter-tag'
import { ClearFiltersButton } from './clear-filters-button'
import { useFilterUpdates } from '@/lib/hooks/use-filter-updates'
import type { Topic, Filters } from '@/lib/types/database'

interface AppliedFiltersDisplayProps {
  topics: Topic[]
  filters: Filters
}

export function AppliedFiltersDisplay({ topics, filters }: AppliedFiltersDisplayProps) {
  const { toggleTopic, toggleYear, removeSearchTerm, clearAllFilters } = useFilterUpdates(filters)
  
  const hasFilters = !!(
    filters.searchTerms?.length ||
    filters.topicIds?.length ||
    filters.years?.length
  )

  if (!hasFilters) return null

  const getTopicName = (id: string) => 
    topics.find(t => t.id === id)?.name || ''

  return (
    <div className="relative w-full rounded-[20px] bg-[#f5f4ed]">
      <div className="flex flex-col gap-[41px] p-[35px]">
        <h2 className="font-serif text-[40px] font-normal leading-[29.892px] text-[#2e2e2e]">
          Applied filters
        </h2>
        
        <div className="flex flex-wrap items-start gap-2">
          {filters.searchTerms?.map((term) => (
            <FilterTag
              key={term}
              label={`Keyword: '${term}'`}
              onRemove={() => removeSearchTerm(term)}
            />
          ))}

          {filters.topicIds?.map((topicId) => (
            <FilterTag
              key={topicId}
              label={getTopicName(topicId)}
              onRemove={() => toggleTopic(topicId)}
            />
          ))}

          {filters.years?.map((year) => (
            <FilterTag
              key={year}
              label={year.toString()}
              onRemove={() => toggleYear(year)}
            />
          ))}

          <ClearFiltersButton onClick={clearAllFilters} />
        </div>
      </div>
      
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute inset-0 rounded-[20px] border border-[#f0eee6]" 
      />
    </div>
  )
}
```

### Phase 2: Update Imports

Update `/src/app/subject/[slug]/page.tsx`:
- Change import from `AppliedFiltersSection` to `AppliedFiltersDisplay`
- Update component usage

### Phase 3: Verification Checklist

- [ ] Visual appearance matches exactly (pixel-perfect)
- [ ] All hover states work correctly
- [ ] Click handlers function properly
- [ ] Accessibility attributes preserved
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Components properly exported
- [ ] All imports updated

### Phase 4: Cleanup

After verification:
1. Delete `/src/components/filters/filter-pill.tsx`
2. Delete `/src/components/filters/clear-all-button.tsx`
3. Delete `/src/components/filters/applied-filters-section.tsx`
4. Remove any unused shadcn Button imports

### Technical Notes

**Key Differences from shadcn approach:**
- No variant system (styles are hardcoded)
- No external dependencies except React
- Icon is inline SVG instead of lucide-react import
- Direct button element instead of polymorphic component
- Simpler, more maintainable for single-use components

**Benefits of new approach:**
- Reduced bundle size (no radix-ui/react-slot)
- Fewer dependencies
- More explicit and readable
- Easier to modify styles
- Better performance (no runtime style calculations)

**Preserved from original:**
- Exact visual appearance
- All interactive states
- Accessibility features
- TypeScript types
- Component API
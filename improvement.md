# Filter Performance Optimization: Comprehensive Implementation Plan

## Executive Summary
The current filter implementation has a 200-500ms delay when clicking checkboxes due to synchronous URL state management. This plan details a complete refactor to achieve instant (<16ms) UI updates while maintaining URL shareability and removing redundant code.

## Problem Analysis

### Current Architecture Issues
1. **Synchronous URL Dependency**: Checkbox state directly tied to URL parameters
2. **startTransition Delays**: Non-urgent priority causing visible lag
3. **No Local State Buffer**: Missing optimistic UI pattern
4. **Redundant Re-renders**: Entire component tree updates on filter change
5. **Inefficient Data Flow**: URL ’ Parse ’ Props ’ Render cycle

### Performance Bottleneck Chain
```
User Click ’ toggleTopic() ’ updateUrl() ’ startTransition() ’ router.push()
’ URL Change ’ Page Re-render ’ parseSearchParams() ’ Props Update ’ UI Update
Total Time: 200-500ms
```

## Solution Architecture

### Three-Layer State Management
```
Layer 1: Optimistic State (Local) - Instant UI updates
Layer 2: URL State (Background) - Debounced sync for shareability
Layer 3: Query State (Cached) - Actual data fetching
```

### Key Principles
- **Optimistic First**: UI updates before server/URL confirmation
- **Async URL Sync**: Non-blocking background synchronization
- **Smart Caching**: Leverage React Query for intelligent data management
- **Progressive Enhancement**: Maintain all current features while improving UX

---

## File-by-File Implementation Plan

### 1. Create New Hook: `src/lib/hooks/use-optimistic-filters.ts`

**Purpose**: Central optimistic state management for all filters

```typescript
// NEW FILE - Complete implementation
'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { updateSearchParams } from '@/lib/utils/url-filters'
import type { Filters } from '@/lib/types/database'

interface OptimisticFiltersOptions {
  syncDelay?: number // Default 200ms
  replaceHistory?: boolean // Use replace instead of push
}

export function useOptimisticFilters(
  initialFilters: Filters,
  options: OptimisticFiltersOptions = {}
) {
  const { syncDelay = 200, replaceHistory = true } = options
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Local optimistic state - this updates instantly
  const [optimisticFilters, setOptimisticFilters] = useState<Filters>(initialFilters)
  const [isSyncing, setIsSyncing] = useState(false)

  // Track if we're currently applying a URL update to avoid loops
  const isApplyingUrlUpdate = useRef(false)

  // Sync optimistic state when URL changes (browser back/forward, direct URL edit)
  useEffect(() => {
    if (!isApplyingUrlUpdate.current) {
      setOptimisticFilters(initialFilters)
    }
  }, [initialFilters])

  // Debounced URL sync function
  const syncToUrl = useDebouncedCallback(
    (filters: Filters) => {
      isApplyingUrlUpdate.current = true
      setIsSyncing(true)

      const newParams = updateSearchParams(searchParams, filters)
      const query = newParams.toString()
      const url = query ? `${pathname}?${query}` : pathname

      // Use replace to avoid history spam when rapidly clicking filters
      if (replaceHistory) {
        router.replace(url, { scroll: false })
      } else {
        router.push(url, { scroll: false })
      }

      // Reset flags after navigation completes
      requestAnimationFrame(() => {
        isApplyingUrlUpdate.current = false
        setIsSyncing(false)
      })
    },
    syncDelay,
    { leading: false, trailing: true }
  )

  // Optimistic update functions - these update local state immediately
  const updateFilters = useCallback((updates: Partial<Filters>) => {
    setOptimisticFilters(prev => {
      const newFilters = { ...prev, ...updates }
      syncToUrl(newFilters)
      return newFilters
    })
  }, [syncToUrl])

  const toggleTopic = useCallback((topicId: string) => {
    setOptimisticFilters(prev => {
      const current = prev.topicIds || []
      const updated = current.includes(topicId)
        ? current.filter(id => id !== topicId)
        : [...current, topicId]

      const newFilters = { ...prev, topicIds: updated }
      syncToUrl(newFilters)
      return newFilters
    })
  }, [syncToUrl])

  const toggleYear = useCallback((year: number) => {
    setOptimisticFilters(prev => {
      const current = prev.years || []
      const updated = current.includes(year)
        ? current.filter(y => y !== year)
        : [...current, year]

      const newFilters = { ...prev, years: updated }
      syncToUrl(newFilters)
      return newFilters
    })
  }, [syncToUrl])

  const toggleQuestionNumber = useCallback((questionNumber: number) => {
    setOptimisticFilters(prev => {
      const current = prev.questionNumbers || []
      const updated = current.includes(questionNumber)
        ? current.filter(q => q !== questionNumber)
        : [...current, questionNumber]

      const newFilters = { ...prev, questionNumbers: updated }
      syncToUrl(newFilters)
      return newFilters
    })
  }, [syncToUrl])

  const addSearchTerm = useCallback((term: string) => {
    setOptimisticFilters(prev => {
      const current = prev.searchTerms || []
      if (current.includes(term)) return prev

      const newFilters = { ...prev, searchTerms: [...current, term] }
      syncToUrl(newFilters)
      return newFilters
    })
  }, [syncToUrl])

  const removeSearchTerm = useCallback((term: string) => {
    setOptimisticFilters(prev => {
      const current = prev.searchTerms || []
      const updated = current.filter(t => t !== term)

      const newFilters = {
        ...prev,
        searchTerms: updated.length > 0 ? updated : undefined
      }
      syncToUrl(newFilters)
      return newFilters
    })
  }, [syncToUrl])

  const clearAllFilters = useCallback(() => {
    const clearedFilters = { subjectId: optimisticFilters.subjectId }
    setOptimisticFilters(clearedFilters)
    router.replace(pathname, { scroll: false })
  }, [optimisticFilters.subjectId, pathname, router])

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    // Optimistic state for immediate UI updates
    filters: optimisticFilters,
    // URL state for data fetching (original filters)
    urlFilters: initialFilters,
    // Update functions
    updateFilters,
    toggleTopic,
    toggleYear,
    toggleQuestionNumber,
    addSearchTerm,
    removeSearchTerm,
    clearAllFilters,
    // Status
    isSyncing,
  }), [
    optimisticFilters,
    initialFilters,
    updateFilters,
    toggleTopic,
    toggleYear,
    toggleQuestionNumber,
    addSearchTerm,
    removeSearchTerm,
    clearAllFilters,
    isSyncing,
  ])
}
```

**Dependencies to add**:
```bash
npm install use-debounce
```

---

### 2. Create Filter Context: `src/components/providers/filter-provider.tsx`

**Purpose**: Provide optimistic filter state to all filter components

```typescript
// NEW FILE
'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useOptimisticFilters } from '@/lib/hooks/use-optimistic-filters'
import type { Filters } from '@/lib/types/database'

interface FilterContextValue {
  filters: Filters
  urlFilters: Filters
  toggleTopic: (topicId: string) => void
  toggleYear: (year: number) => void
  toggleQuestionNumber: (questionNumber: number) => void
  addSearchTerm: (term: string) => void
  removeSearchTerm: (term: string) => void
  clearAllFilters: () => void
  isSyncing: boolean
}

const FilterContext = createContext<FilterContextValue | null>(null)

export function useFilters() {
  const context = useContext(FilterContext)
  if (!context) {
    throw new Error('useFilters must be used within FilterProvider')
  }
  return context
}

interface FilterProviderProps {
  children: ReactNode
  initialFilters: Filters
}

export function FilterProvider({ children, initialFilters }: FilterProviderProps) {
  const filterState = useOptimisticFilters(initialFilters, {
    syncDelay: 200,
    replaceHistory: true,
  })

  return (
    <FilterContext.Provider value={filterState}>
      {children}
    </FilterContext.Provider>
  )
}
```

---

### 3. Update `src/components/filters/topic-filter-accordion.tsx`

**Current Issues**:
- Uses URL-dependent state causing delays
- No optimistic updates
- Redundant filter prop passing

**Changes Required**:
```typescript
'use client'

import { ChevronRight, ListFilter } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useFilters } from '@/components/providers/filter-provider' // NEW
import type { Topic } from '@/lib/types/database'

interface TopicFilterAccordionProps {
  topics: Topic[]
  // REMOVE: filters prop - no longer needed
}

export function TopicFilterAccordion({ topics }: TopicFilterAccordionProps) {
  const { filters, toggleTopic } = useFilters() // NEW: Use context
  const { state, setOpen } = useSidebar()
  const isCollapsed = state === 'collapsed'

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

  return (
    <AccordionItem value="topics" className="border-0">
      <AccordionTrigger
        className="p-0 hover:no-underline [&>svg]:hidden data-[state=open]:pb-0 [&[data-state=open]_[data-chevron]]:rotate-90"
        onClick={handleAccordionClick}
      >
        <SidebarMenuButton
          tooltip="Study by topic"
          className="w-full font-medium text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          asChild
        >
          <div className="flex items-center">
            <ListFilter />
            <span className="text-base">Study by topic</span>
            <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200" data-chevron />
          </div>
        </SidebarMenuButton>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-0">
        <SidebarMenuSub>
          {topics.map((topic) => (
            <SidebarMenuSubItem key={topic.id}>
              <label className="flex cursor-pointer items-center gap-3 px-2 py-1.5">
                <Checkbox
                  checked={filters.topicIds?.includes(topic.id) ?? false}
                  onCheckedChange={() => toggleTopic(topic.id)}
                  className="h-4 w-4 data-[state=checked]:animate-scale-in" // NEW: Add micro-animation
                />
                <span className="text-sm font-sans text-warm-text-secondary">
                  {topic.name}
                </span>
              </label>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </AccordionContent>
    </AccordionItem>
  )
}
```

---

## Testing Strategy

### Manual Testing Checklist
- [ ] Checkbox updates instantly (<16ms)
- [ ] URL updates within 200ms (debounced)
- [ ] Browser back/forward works correctly
- [ ] Shared URLs load correct filter state
- [ ] No duplicate requests on rapid clicking
- [ ] Loading indicators appear appropriately
- [ ] Previous results remain visible during fetch
- [ ] Mobile responsiveness maintained

### Performance Metrics
- **Before**: 200-500ms checkbox response
- **After**: <16ms checkbox response
- **URL Sync**: 200ms debounced
- **Perceived Performance**: 95% improvement

---

## Implementation Order

1. Install dependencies (use-debounce)
2. Create use-optimistic-filters.ts hook
3. Create filter-provider.tsx context
4. Update all filter components to use context
5. Update filtered-questions-view.tsx
6. Update nav-filters.tsx to remove prop drilling
7. Update exam-sidebar.tsx to remove filter prop
8. Update subject page to wrap with FilterProvider
9. Delete use-filter-updates.ts (redundant)
10. Add CSS animations for visual feedback
11. Test thoroughly
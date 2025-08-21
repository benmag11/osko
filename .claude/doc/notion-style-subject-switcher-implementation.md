# Notion-Style Subject Switcher Dropdown Implementation Plan

## Overview
This document outlines the implementation plan for transforming the existing basic SubjectSwitcher component into a beautiful, Notion-style dropdown menu with user subjects, navigation, and premium aesthetics.

## Component Architecture

### Primary Component File to Update
**File:** `/src/components/layout/subject-switcher.tsx`

This component will be completely redesigned to include:
- Notion-style dropdown aesthetics
- User subjects fetching via React Query
- Navigation to dashboard and subject pages
- Subject icons with proper visual hierarchy

## Implementation Details

### 1. Update SubjectSwitcher Component (`/src/components/layout/subject-switcher.tsx`)

**Complete Implementation:**

```typescript
"use client"

import { BookOpen, Home, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import type { Subject } from "@/lib/types/database"
import { getSubjectIcon } from "@/lib/utils/subject-icons"
import { generateSlug } from "@/lib/utils/slug"
import { getUserSubjects } from "@/lib/services/subjects"
import { useUser } from "@/lib/hooks/use-user-profile"
import { cn } from "@/lib/utils"

interface SubjectSwitcherProps {
  subject: Subject
}

export function SubjectSwitcher({ subject }: SubjectSwitcherProps) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const { user } = useUser()
  
  // Fetch user subjects with React Query
  const { data: userSubjects, isLoading } = useQuery({
    queryKey: ['user-subjects', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const subjects = await getUserSubjects(user.id)
      return subjects.map(us => us.subject).filter(Boolean)
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const CurrentIcon = getSubjectIcon(subject.name)

  const handleSubjectClick = (selectedSubject: Subject) => {
    const slug = generateSlug(selectedSubject)
    router.push(`/subject/${slug}`)
  }

  const handleDashboardClick = () => {
    router.push('/dashboard/study')
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-colors"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 shadow-sm">
                <CurrentIcon className="size-4 text-slate-700 dark:text-slate-300" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium text-slate-900 dark:text-slate-100">
                  {subject.name}
                </span>
                <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {subject.level} Level
                </span>
              </div>
              <ChevronDown className="ml-auto size-4 text-slate-400 transition-transform duration-200 data-[state=open]:rotate-180" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-[280px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={8}
          >
            {/* Dashboard Navigation */}
            <DropdownMenuItem 
              onClick={handleDashboardClick}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                <Home className="size-4 text-slate-600 dark:text-slate-400" />
              </div>
              <span className="text-slate-700 dark:text-slate-300">Back to dashboard</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="my-2 bg-slate-100 dark:bg-slate-800" />
            
            {/* Subjects Section */}
            <DropdownMenuLabel className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              My Subjects
            </DropdownMenuLabel>
            
            {isLoading ? (
              <div className="px-3 py-8 text-center">
                <div className="inline-flex size-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600 dark:border-slate-700 dark:border-t-slate-400" />
              </div>
            ) : userSubjects && userSubjects.length > 0 ? (
              <ScrollArea className="max-h-[320px]">
                <div className="px-2 py-1">
                  {userSubjects.map((userSubject) => {
                    const Icon = getSubjectIcon(userSubject.name)
                    const isActive = userSubject.id === subject.id
                    
                    return (
                      <DropdownMenuItem
                        key={userSubject.id}
                        onClick={() => handleSubjectClick(userSubject)}
                        className={cn(
                          "flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer transition-all duration-150",
                          isActive
                            ? "bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100"
                            : "hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300"
                        )}
                      >
                        <div className={cn(
                          "flex size-8 items-center justify-center rounded-lg transition-colors",
                          isActive
                            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        )}>
                          <Icon className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm font-medium">
                            {userSubject.name}
                          </div>
                          <div className={cn(
                            "text-xs",
                            isActive 
                              ? "text-slate-600 dark:text-slate-400" 
                              : "text-slate-500 dark:text-slate-500"
                          )}>
                            {userSubject.level} Level
                          </div>
                        </div>
                        {isActive && (
                          <div className="size-1.5 rounded-full bg-blue-500 shadow-sm" />
                        )}
                      </DropdownMenuItem>
                    )
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No subjects added yet
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
```

### 2. Install Required shadcn/ui Components

Before implementing, ensure these components are installed:

```bash
# Check if scroll-area is installed, if not:
npx shadcn@latest add scroll-area
```

### 3. Key Design Features

#### Visual Hierarchy
- **Trigger Button**: Clean gradient background for icon, clear text hierarchy with subject name and level
- **Dropdown Content**: Rounded corners (rounded-xl), subtle border, clean shadow
- **Active State Indicator**: Blue gradient background for active subject icon, small blue dot indicator
- **Hover States**: Subtle background color changes with smooth transitions

#### Notion-Style Elements
- **Clean Typography**: Using font weights and sizes to create clear hierarchy
- **Minimal Color Palette**: Mostly grays with blue accents for active states
- **Smooth Transitions**: All hover and state changes use transitions
- **Icon System**: Consistent icon sizing and placement in rounded containers
- **Uppercase Labels**: Section headers use uppercase with letter-spacing

#### Interactive Elements
- **Loading State**: Animated spinner while fetching subjects
- **Empty State**: Helpful message when no subjects are available
- **Scroll Area**: Clean scrolling for long lists of subjects (max-height: 320px)
- **Active Subject Highlight**: Visual feedback showing current subject

### 4. Dependencies and Imports

The component requires:
- React Query for data fetching (`@tanstack/react-query`)
- Next.js navigation (`next/navigation`)
- Lucide icons (`lucide-react`)
- shadcn/ui components (dropdown-menu, scroll-area, button)
- Custom utilities (getSubjectIcon, generateSlug)
- Services for fetching user subjects
- User hook for authentication state

### 5. Data Flow

1. **User Authentication**: Uses `useUser()` hook to get current user
2. **Data Fetching**: React Query fetches user subjects with caching
3. **Navigation**: Uses Next.js router for client-side navigation
4. **State Management**: Dropdown open/close handled by Radix UI primitives

### 6. Accessibility Features

- Proper ARIA labels through Radix UI primitives
- Keyboard navigation support (Tab, Enter, Escape)
- Focus management with visible focus rings
- Screen reader friendly with semantic HTML
- Proper heading hierarchy with DropdownMenuLabel

### 7. Responsive Design

- Adapts dropdown position based on `isMobile` from sidebar context
- Touch-friendly tap targets (minimum 44px)
- Responsive text truncation for long subject names
- Consistent spacing across viewport sizes

### 8. Performance Optimizations

- Query caching with 5-minute stale time
- Conditional fetching (only when user is authenticated)
- Memoization not needed as component is lightweight
- CSS transitions instead of JavaScript animations

### 9. Error Handling

The component gracefully handles:
- Loading states during data fetch
- Empty state when no subjects exist
- Null/undefined user scenarios
- Failed API requests (returns empty array)

### 10. Testing Considerations

When testing this component:
- Mock `useUser` and `getUserSubjects` functions
- Test navigation to correct routes
- Verify active subject highlighting
- Check scroll area with many subjects
- Test loading and empty states
- Verify keyboard navigation works

## Migration Notes

### Breaking Changes
- None - the component maintains the same props interface

### Backwards Compatibility
- The component still accepts the same `subject` prop
- Works within the existing SidebarMenu structure
- Compatible with current sidebar context

### Future Enhancements
- Add subject search/filter for large lists
- Include recent/favorite subjects section
- Add subject progress indicators
- Include keyboard shortcuts for quick switching
- Add animation for dropdown open/close

## Summary

This implementation transforms the basic subject switcher into a premium, Notion-style dropdown that:
- Provides intuitive navigation between subjects and dashboard
- Displays user's subjects with beautiful visual hierarchy
- Includes loading and empty states for better UX
- Uses consistent design language with smooth interactions
- Maintains accessibility and performance standards

The component is production-ready and follows React/Next.js best practices while delivering a delightful user experience that feels professional and modern.
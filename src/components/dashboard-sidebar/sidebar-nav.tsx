'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BookOpen,
  Headphones,
  Calculator,
  Calendar,
  Users,
  Settings,
  Flag,
  type LucideIcon,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useIsAdmin } from '@/lib/hooks/use-is-admin'
import { useQueryClient } from '@tanstack/react-query'
import { prefetchDashboardData } from '@/lib/supabase/dashboard-bootstrap.client'
import { useNavigationMetrics } from '@/lib/metrics/use-navigation-metrics'
import { useDashboardSidebar } from './sidebar-context'

interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  adminOnly?: boolean
}

interface NavGroup {
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { title: 'Study', url: '/dashboard/study', icon: BookOpen },
      { title: 'Listening', url: '/dashboard/listening', icon: Headphones },
      { title: 'Grinds', url: '/dashboard/grinds', icon: Users },
      { title: 'Points', url: '/dashboard/points', icon: Calculator },
      { title: 'Timetable', url: '/dashboard/timetable', icon: Calendar },
    ]
  },
  {
    items: [
      { title: 'Reports', url: '/dashboard/reports', icon: Flag, adminOnly: true },
      { title: 'Settings', url: '/dashboard/settings', icon: Settings },
    ]
  }
]

export function SidebarNav() {
  const pathname = usePathname()
  const { isAdmin } = useIsAdmin()
  const { isCollapsed } = useDashboardSidebar()
  const queryClient = useQueryClient()
  const router = useRouter()
  const { markNavigation } = useNavigationMetrics()
  const intentTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const prefetchedRoutesRef = React.useRef(new Set<string>())

  React.useEffect(() => {
    void prefetchDashboardData(queryClient)
  }, [queryClient])

  const schedulePrefetch = React.useCallback((href: string) => {
    if (prefetchedRoutesRef.current.has(href)) {
      return
    }

    if (intentTimeoutRef.current) {
      clearTimeout(intentTimeoutRef.current)
    }

    intentTimeoutRef.current = setTimeout(() => {
      prefetchedRoutesRef.current.add(href)
      try {
        router.prefetch(href)
      } catch (error) {
        console.debug('Failed to prefetch route', href, error)
      }
      void prefetchDashboardData(queryClient)
    }, 120)
  }, [queryClient, router])

  const cancelPrefetch = React.useCallback(() => {
    if (intentTimeoutRef.current) {
      clearTimeout(intentTimeoutRef.current)
      intentTimeoutRef.current = null
    }
  }, [])

  React.useEffect(() => {
    return () => {
      if (intentTimeoutRef.current) {
        clearTimeout(intentTimeoutRef.current)
      }
    }
  }, [])

  // Filter nav groups based on admin status
  const filteredGroups = NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => !item.adminOnly || isAdmin)
  })).filter(group => group.items.length > 0)

  return (
    <nav className="flex-1 py-2">
      {filteredGroups.map((group, groupIndex) => (
        <React.Fragment key={groupIndex}>
          {groupIndex > 0 && (
            <div className="mx-3 my-2 border-t border-stone-200" />
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = pathname === item.url
              const Icon = item.icon

              const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
                if (
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey ||
                  (event.nativeEvent instanceof MouseEvent && event.nativeEvent.button !== 0)
                ) {
                  return
                }
                markNavigation(item.url)
              }

              const linkContent = (
                <Link
                  href={item.url}
                  onClick={handleClick}
                  onPointerEnter={() => schedulePrefetch(item.url)}
                  onPointerLeave={cancelPrefetch}
                  onFocus={() => schedulePrefetch(item.url)}
                  className={cn(
                    'flex items-center h-9 transition-colors duration-150',
                    isCollapsed ? 'w-12' : 'mr-2 rounded-r-md',
                    isActive
                      ? 'text-salmon-600 bg-salmon-50'
                      : 'text-stone-600 hover:text-stone-800 hover:bg-stone-100'
                  )}
                >
                  {/* Active indicator bar (only when collapsed) */}
                  {isCollapsed && isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-salmon-500 rounded-r" />
                  )}
                  <span className="flex w-12 shrink-0 items-center justify-center">
                    <Icon className="h-4 w-4" />
                  </span>
                  {!isCollapsed && (
                    <span className="text-sm">{item.title}</span>
                  )}
                </Link>
              )

              return (
                <li key={item.title} className="relative">
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8}>
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    linkContent
                  )}
                </li>
              )
            })}
          </ul>
        </React.Fragment>
      ))}
    </nav>
  )
}

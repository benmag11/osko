'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BookOpen,
  Info,
  BarChart3,
  Settings,
  Flag,
  type LucideIcon,
} from 'lucide-react'

import { NavUser } from '@/components/layout/nav-user'
import { useIsAdmin } from '@/lib/hooks/use-is-admin'
import { useQueryClient } from '@tanstack/react-query'
import { prefetchDashboardData } from '@/lib/supabase/dashboard-bootstrap.client'
import { useNavigationMetrics } from '@/lib/metrics/use-navigation-metrics'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'

interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  {
    title: 'Study',
    url: '/dashboard/study',
    icon: BookOpen,
  },
  {
    title: 'Statistics',
    url: '/dashboard/statistics',
    icon: BarChart3,
  },
  {
    title: 'Reports',
    url: '/dashboard/reports',
    icon: Flag,
    adminOnly: true,
  },
  {
    title: 'Settings',
    url: '/dashboard/settings',
    icon: Settings,
  },
  {
    title: 'About',
    url: '/dashboard/about',
    icon: Info,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { isAdmin } = useIsAdmin()
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
  
  // Filter nav items based on admin status
  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="mb-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link 
              href="/dashboard/study"
              className="inline-flex items-center gap-2 rounded-md p-2 
                         group-data-[collapsible=icon]:p-1.5
                         ml-0 mr-auto
                         group-data-[collapsible=icon]:mx-auto
                         transition-[margin,padding] duration-200 ease-linear
                         focus-visible:outline-none focus-visible:ring-2 
                         focus-visible:ring-sidebar-ring"
              aria-label="OSKO - Go to homepage"
            >
              <Image 
                src="/logo-icon.svg" 
                alt="" 
                width={20} 
                height={20}
                className="w-5 h-5 shrink-0"
              />
              <span className="overflow-hidden transition-all duration-200 ease-linear
                               w-auto opacity-100 max-w-[50px]
                               group-data-[collapsible=icon]:w-0 
                               group-data-[collapsible=icon]:opacity-0
                               group-data-[collapsible=icon]:max-w-0">
                <Image 
                  src="/logo-text.svg" 
                  alt=""
                  width={50} 
                  height={20}
                  className="h-5 w-auto"
                />
              </span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {filteredNavItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.url}
                  tooltip={item.title}
                  className="text-[15px]"
                >
                  <Link
                    href={item.url}
                    onClick={(event) => {
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
                    }}
                    onPointerEnter={() => schedulePrefetch(item.url)}
                    onPointerLeave={cancelPrefetch}
                    onFocus={() => schedulePrefetch(item.url)}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

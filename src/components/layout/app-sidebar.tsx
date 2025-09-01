'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  Info,
  BarChart3,
  Settings,
} from 'lucide-react'

import { NavUser } from '@/components/layout/nav-user'
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

const navItems = [
  {
    title: 'Study',
    url: '/dashboard/study',
    icon: BookOpen,
  },
  {
    title: 'About',
    url: '/dashboard/about',
    icon: Info,
  },
  {
    title: 'Statistics',
    url: '/dashboard/statistics',
    icon: BarChart3,
  },
  {
    title: 'Settings',
    url: '/dashboard/settings',
    icon: Settings,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

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
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.url}
                  tooltip={item.title}
                  className="text-[15px]"
                >
                  <Link href={item.url}>
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
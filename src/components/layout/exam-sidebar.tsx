"use client"

import * as React from "react"
import { NavFilters } from "@/components/layout/nav-filters"
import { NavUser } from "@/components/layout/nav-user"
import { SubjectSwitcher } from "@/components/layout/subject-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import type { Topic, Filters, Subject } from "@/lib/types/database"
import { useUserProfile } from "@/lib/hooks/use-user-profile"
import { formatName } from "@/lib/utils/format-name"

interface ExamSidebarProps extends React.ComponentProps<typeof Sidebar> {
  subject: Subject
  topics: Topic[]
  years: number[]
  filters: Filters
}

export function ExamSidebar({ 
  subject,
  topics, 
  years, 
  filters,
  ...props 
}: ExamSidebarProps) {
  const { user, profile } = useUserProfile()
  
  const profileData = profile as { full_name?: string; name?: string } | null
  const name = profileData?.full_name || profileData?.name || user?.email?.split('@')[0] || 'User'
  const displayName = formatName(name)
  
  const userData = {
    name: displayName,
    email: user?.email || '',
    avatar: '',
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SubjectSwitcher subject={subject} />
      </SidebarHeader>
      <SidebarContent>
        <NavFilters topics={topics} years={years} filters={filters} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
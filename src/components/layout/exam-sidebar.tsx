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

interface ExamSidebarProps extends React.ComponentProps<typeof Sidebar> {
  subject: Subject
  topics: Topic[]
  years: number[]
  filters: Filters
}

// Sample user data - in production this would come from auth
const userData = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
}

export function ExamSidebar({ 
  subject,
  topics, 
  years, 
  filters,
  ...props 
}: ExamSidebarProps) {
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
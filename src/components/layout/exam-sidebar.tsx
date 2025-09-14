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
import type { Topic, Subject } from "@/lib/types/database"

interface ExamSidebarProps extends React.ComponentProps<typeof Sidebar> {
  subject: Subject
  topics: Topic[]
  years: number[]
  questionNumbers: number[]
}

export function ExamSidebar({
  subject,
  topics,
  years,
  questionNumbers,
  ...props
}: ExamSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SubjectSwitcher subject={subject} />
      </SidebarHeader>
      <SidebarContent>
        <NavFilters topics={topics} years={years} questionNumbers={questionNumbers} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
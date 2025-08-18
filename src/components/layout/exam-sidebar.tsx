"use client"

import * as React from "react"
import { useEffect, useState } from "react"
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
import { createClient } from "@/lib/supabase/client"
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
  const [userData, setUserData] = useState<{
    name: string
    email: string
    avatar: string
  }>({
    name: "User",
    email: "",
    avatar: "",
  })

  useEffect(() => {
    async function loadUserData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('name')
          .eq('user_id', user.id)
          .single()
        
        const name = profile?.name || user.email?.split('@')[0] || 'User'
        const displayName = formatName(name)
        
        setUserData({
          name: displayName,
          email: user.email || '',
          avatar: '',
        })
      }
    }
    
    loadUserData()
  }, [])

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
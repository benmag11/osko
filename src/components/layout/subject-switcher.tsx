"use client"

import { ChevronsUpDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { SubjectDropdown } from "@/components/layout/subject-dropdown"
import { useUserSubjects } from "@/lib/hooks/use-user-subjects"
import { useUserProfile } from "@/lib/hooks/use-user-profile"
import { getSubjectIcon } from "@/lib/utils/subject-icons"
import type { Subject } from "@/lib/types/database"

interface SubjectSwitcherProps {
  subject: Subject
}

export function SubjectSwitcher({ subject }: SubjectSwitcherProps) {
  const { isMobile } = useSidebar()
  const { user } = useUserProfile()
  const { subjects, isLoading } = useUserSubjects(user?.id)
  
  const SubjectIcon = getSubjectIcon(subject.name)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <SubjectIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-serif font-semibold text-warm-text-primary">{subject.name}</span>
                <span className="truncate text-xs font-sans text-warm-text-muted">{subject.level} Level</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <SubjectDropdown 
            subjects={subjects}
            currentSubject={subject}
            isLoading={isLoading}
            isMobile={isMobile}
          />
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
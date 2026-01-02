'use client'

import { LogOut, ChevronsUpDown } from 'lucide-react'
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAuth } from '@/components/providers/auth-provider'
import { formatName, formatInitials } from '@/lib/utils/format-name'
import { clientSignOut } from '@/lib/auth/client-auth'
import { useQueryClient } from '@tanstack/react-query'
import { useDashboardSidebar } from './sidebar-context'

export function SidebarUser() {
  const { isMobile, isCollapsed } = useDashboardSidebar()
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    await clientSignOut(queryClient)
  }

  const name = profile?.name || user.user_metadata?.full_name || 'User'
  const displayName = formatName(name)
  const initials = formatInitials(name)
  const email = user.email || ''

  // Collapsed state: Avatar only with tooltip
  const collapsedTrigger = (
    <button className="flex h-9 w-12 items-center justify-center transition-colors duration-150 hover:bg-stone-100">
      <Avatar className="h-6 w-6 rounded-lg">
        <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-[10px]">
          {initials}
        </AvatarFallback>
      </Avatar>
    </button>
  )

  // Expanded state: Full user info with avatar, name, email, chevron
  const expandedTrigger = (
    <button className="flex w-full items-center text-left transition-colors duration-150 hover:bg-stone-100 rounded-r-md mr-2 mb-1">
      <span className="flex w-12 shrink-0 items-center justify-center">
        <Avatar className="h-6 w-6 rounded-lg">
          <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-[10px]">
            {initials}
          </AvatarFallback>
        </Avatar>
      </span>
      <div className="grid flex-1 text-left text-sm leading-tight overflow-hidden py-1.5">
        <span className="truncate font-medium text-stone-800 text-xs">{displayName}</span>
        <span className="truncate text-[10px] text-stone-500">{email}</span>
      </div>
      <ChevronsUpDown className="h-3.5 w-3.5 text-stone-400 shrink-0 mr-2" />
    </button>
  )

  const dropdownContent = (
    <DropdownMenuContent
      className="w-56 rounded-lg"
      side={isMobile ? 'top' : 'right'}
      align="end"
      sideOffset={8}
    >
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{displayName}</span>
            <span className="truncate text-xs text-muted-foreground">{email}</span>
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleSignOut}>
        <LogOut className="mr-2 h-4 w-4" />
        <span>Log out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  )

  if (isCollapsed) {
    return (
      <div className="border-t border-stone-200">
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                {collapsedTrigger}
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {displayName}
            </TooltipContent>
          </Tooltip>
          {dropdownContent}
        </DropdownMenu>
      </div>
    )
  }

  return (
    <div className="border-t border-stone-200 pt-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {expandedTrigger}
        </DropdownMenuTrigger>
        {dropdownContent}
      </DropdownMenu>
    </div>
  )
}

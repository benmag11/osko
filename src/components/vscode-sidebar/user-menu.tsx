'use client'

import { LogOut } from 'lucide-react'
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
import { useVSCodeSidebar } from './sidebar-context'

export function UserMenu() {
  const { isMobile, isCollapsed } = useVSCodeSidebar()
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

  const triggerButton = (
    <button className="flex h-11 w-12 items-center justify-center transition-colors duration-150 hover:bg-stone-100">
      <Avatar className="h-7 w-7 rounded-lg">
        <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>
    </button>
  )

  return (
    <DropdownMenu>
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              {triggerButton}
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {displayName}
          </TooltipContent>
        </Tooltip>
      ) : (
        <DropdownMenuTrigger asChild>
          {triggerButton}
        </DropdownMenuTrigger>
      )}
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
    </DropdownMenu>
  )
}

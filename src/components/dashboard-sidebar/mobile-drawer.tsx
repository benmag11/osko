'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  Headphones,
  Calculator,
  Calendar,
  Users,
  Settings,
  Flag,
  BarChart3,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useIsAdmin } from '@/lib/hooks/use-is-admin'
import { useAuth } from '@/components/providers/auth-provider'
import { formatName, formatInitials } from '@/lib/utils/format-name'
import { clientSignOut } from '@/lib/auth/client-auth'
import { useQueryClient } from '@tanstack/react-query'

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
    ]
  },
  {
    items: [
      { title: 'Points', url: '/dashboard/points', icon: Calculator },
      { title: 'Timetable', url: '/dashboard/timetable', icon: Calendar },
      { title: 'Stats', url: '/dashboard/stats', icon: BarChart3 },
    ]
  },
  {
    items: [
      { title: 'Reports', url: '/dashboard/reports', icon: Flag, adminOnly: true },
      { title: 'Settings', url: '/dashboard/settings', icon: Settings },
    ]
  }
]

interface MobileDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  const pathname = usePathname()
  const { isAdmin } = useIsAdmin()
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()

  const handleSignOut = async () => {
    await clientSignOut(queryClient)
  }

  const name = profile?.name || user?.user_metadata?.full_name || 'User'
  const displayName = formatName(name)
  const initials = formatInitials(name)
  const email = user?.email || ''

  // Filter nav groups based on admin status
  const filteredGroups = NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => !item.adminOnly || isAdmin)
  })).filter(group => group.items.length > 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 w-[280px]">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>

        {/* Header with logo */}
        <div className="flex items-center h-14 px-4 border-b border-stone-200">
          <Link
            href="/dashboard/study"
            className="flex items-center gap-2"
            onClick={() => onOpenChange(false)}
          >
            <Image
              src="/logo-icon.svg"
              alt=""
              width={25}
              height={25}
              className="h-[25px] w-[25px]"
            />
            <Image
              src="/logo-text.svg"
              alt="OSKO"
              width={50}
              height={20}
              className="h-5 w-auto"
            />
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 py-4 overflow-auto">
          {filteredGroups.map((group, groupIndex) => (
            <React.Fragment key={groupIndex}>
              {groupIndex > 0 && (
                <div className="mx-4 my-3 border-t border-stone-200" />
              )}
              <ul className="space-y-1 px-2">
                {group.items.map((item) => {
                  const isActive = pathname === item.url
                  const Icon = item.icon

                  return (
                    <li key={item.title}>
                      <Link
                        href={item.url}
                        onClick={() => onOpenChange(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-md text-[15px] transition-colors',
                          isActive
                            ? 'text-salmon-600 bg-salmon-50'
                            : 'text-stone-600 hover:text-stone-800 hover:bg-stone-100'
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </React.Fragment>
          ))}
        </nav>

        {/* User section at bottom */}
        {user && (
          <div className="border-t border-stone-200 p-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-stone-100 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4 text-stone-500" />
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

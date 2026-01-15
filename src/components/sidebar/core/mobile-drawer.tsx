'use client'

import * as React from 'react'
import { LogOut } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/components/providers/auth-provider'
import { formatName, formatInitials } from '@/lib/utils/format-name'
import { clientSignOut } from '@/lib/auth/client-auth'
import { useQueryClient } from '@tanstack/react-query'

interface MobileDrawerProps {
  /** Whether the drawer is open */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Header content (subject selector/info) */
  headerContent: React.ReactNode
  /** Main content (filter accordions) */
  children: React.ReactNode
  /** Accessible title for the drawer */
  title?: string
}

/**
 * Mobile drawer shell component
 * Provides the container structure with header, scrollable content, and user footer
 * Variants provide the header and filter content via slots
 */
export function MobileDrawer({
  open,
  onOpenChange,
  headerContent,
  children,
  title = 'Navigation',
}: MobileDrawerProps) {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()

  const handleSignOut = async () => {
    await clientSignOut(queryClient)
  }

  const name = profile?.name || user?.user_metadata?.full_name || 'User'
  const displayName = formatName(name)
  const initials = formatInitials(name)
  const email = user?.email || ''

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 w-[300px]">
        <SheetHeader className="sr-only">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        {/* Header slot (subject selector/info) */}
        <div className="border-b border-stone-200">{headerContent}</div>

        {/* Scrollable filter content */}
        <ScrollArea className="flex-1 h-[calc(100vh-140px)]">{children}</ScrollArea>

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
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-cream-200 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4 text-warm-text-muted" />
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

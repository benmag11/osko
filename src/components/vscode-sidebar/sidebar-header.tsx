'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PanelLeft, PanelLeftClose } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVSCodeSidebar } from './sidebar-context'

export function SidebarHeader() {
  const { isCollapsed, toggleSidebar } = useVSCodeSidebar()
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <div
      className={cn(
        'flex items-center h-12 border-b border-stone-200',
        isCollapsed ? 'justify-center px-0' : 'justify-between px-3'
      )}
    >
      {/* Logo - when collapsed, becomes toggle on hover */}
      {isCollapsed ? (
        <button
          onClick={toggleSidebar}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="flex h-12 w-12 items-center justify-center transition-colors hover:bg-stone-50"
          aria-label="Expand sidebar"
        >
          {isHovered ? (
            <PanelLeft className="h-5 w-5 text-stone-500" />
          ) : (
            <Image
              src="/logo-icon.svg"
              alt="OSKO"
              width={20}
              height={20}
              className="h-5 w-5"
            />
          )}
        </button>
      ) : (
        <>
          {/* Logo link - expanded state */}
          <Link
            href="/dashboard/study"
            className="inline-flex items-center gap-2 rounded-md py-1.5 px-1.5 transition-colors hover:bg-stone-50"
            aria-label="OSKO - Go to dashboard"
          >
            <Image
              src="/logo-icon.svg"
              alt=""
              width={20}
              height={20}
              className="h-5 w-5 shrink-0"
            />
            <Image
              src="/logo-text.svg"
              alt="OSKO"
              width={50}
              height={20}
              className="h-5 w-auto"
            />
          </Link>

          {/* Toggle button - expanded state */}
          <button
            onClick={toggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-stone-50"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4 text-stone-400" />
          </button>
        </>
      )}
    </div>
  )
}

'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PanelLeft, PanelLeftClose } from 'lucide-react'
import { useVSCodeSidebar } from './sidebar-context'
import type { Subject } from '@/lib/types/database'

interface SidebarHeaderProps {
  subject: Subject
}

export function SidebarHeader({ subject }: SidebarHeaderProps) {
  const { isCollapsed, toggleSidebar } = useVSCodeSidebar()

  return (
    <div className="flex items-center h-12 border-b border-stone-200">
      {/* Left section: 48px wide, matches activity bar width - logo always centered here */}
      <div className="flex h-full w-12 shrink-0 items-center justify-center">
        {isCollapsed ? (
          <button
            onClick={toggleSidebar}
            className="group flex h-12 w-12 items-center justify-center transition-colors"
            aria-label="Expand sidebar"
          >
            {/* Logo shown by default, hidden on hover */}
            <Image
              src="/logo-icon.svg"
              alt="OSKO"
              width={20}
              height={20}
              className="h-5 w-5 block group-hover:hidden"
            />
            {/* Expand icon hidden by default, shown on hover */}
            <PanelLeft className="h-5 w-5 text-stone-800 hidden group-hover:block" />
          </button>
        ) : (
          <Link
            href="/dashboard/study"
            className="flex h-12 w-12 cursor-pointer items-center justify-center transition-colors hover:bg-stone-50"
            aria-label="OSKO - Go to dashboard"
          >
            <Image
              src="/logo-icon.svg"
              alt="OSKO"
              width={20}
              height={20}
              className="h-5 w-5"
            />
          </Link>
        )}
      </div>

      {/* Right section: logo text and collapse button - only visible when expanded */}
      {!isCollapsed && (
        <div className="flex flex-1 items-center justify-between pr-3">
          <Link
            href="/dashboard/study"
            className="cursor-pointer"
            aria-label="OSKO - Go to dashboard"
          >
            <Image
              src="/logo-text.svg"
              alt="OSKO"
              width={50}
              height={20}
              className="h-5 w-auto"
            />
          </Link>
          <button
            onClick={toggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-md text-stone-500 transition-colors hover:text-stone-800"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
}

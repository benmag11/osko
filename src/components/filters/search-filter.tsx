'use client'

import { useState, useRef } from 'react'
import { Search, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { CollapsibleSidebarMenuButton } from '@/components/ui/collapsible-sidebar-menu-button'
import { useFilterUpdates } from '@/lib/hooks/use-filter-updates'
import type { Filters } from '@/lib/types/database'

interface SearchFilterProps {
  filters: Filters
}

export function SearchFilter({ filters }: SearchFilterProps) {
  const { addSearchTerm } = useFilterUpdates(filters)
  const [value, setValue] = useState('')
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAddKeyword = () => {
    if (value.trim()) {
      addSearchTerm(value.trim())
      setValue('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddKeyword()
    }
  }

  const handleExpandedClick = () => {
    setTimeout(() => {
      inputRef.current?.focus()
    }, 200)
  }

  return (
    <div>
      <SidebarMenu>
        <SidebarMenuItem>
          <CollapsibleSidebarMenuButton 
            tooltip="Search by keyword" 
            className="font-medium text-sidebar-foreground/90"
            onExpandedClick={handleExpandedClick}
            expandDelay={200}
          >
            <Search />
            <span className="text-base">Search by keyword</span>
          </CollapsibleSidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      {!isCollapsed && (
        <div className="px-3 pt-2">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Try typing 'prove'"
              className="h-8 text-sm flex-1"
            />
            <button
              type="button"
              onClick={handleAddKeyword}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-stone-300 bg-transparent transition-colors hover:border-salmon-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-salmon-500/30"
              aria-label="Add search keyword"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
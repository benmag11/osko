'use client'

import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar'
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

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="Search by keyword" className="font-medium text-sidebar-foreground/90">
            <Search />
            <span>Search by keyword</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      {!isCollapsed && (
        <div className="px-3 py-2">
          <div className="flex gap-2">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Try typing 'prove'"
              className="h-8 text-sm flex-1"
            />
            <button
              type="button"
              onClick={handleAddKeyword}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-transparent transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Add search keyword"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </SidebarGroup>
  )
}
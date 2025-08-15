'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
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
  const { debouncedSearchUpdate } = useFilterUpdates(filters)
  const [value, setValue] = useState(filters.searchTerm || '')
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  useEffect(() => {
    setValue(filters.searchTerm || '')
  }, [filters.searchTerm])

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="Search by keyword" className="justify-start">
            <Search />
            {!isCollapsed && <span>Search by keyword</span>}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      {!isCollapsed && (
        <div className="px-3 py-2">
          <Input
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              debouncedSearchUpdate(e.target.value)
            }}
            placeholder="Try typing 'prove'"
            className="h-8 text-sm"
          />
        </div>
      )}
    </SidebarGroup>
  )
}
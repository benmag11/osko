'use client'

import { useState, memo, useCallback } from 'react'
import { ChevronRight, LucideIcon } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'

interface FilterItem {
  id: string | number
  label: string
}

interface CollapsibleFilterProps {
  title: string
  icon: LucideIcon
  items: FilterItem[]
  selectedIds: (string | number)[] | undefined
  onToggle: (id: string | number) => void
  defaultOpen?: boolean
}

export const CollapsibleFilter = memo(function CollapsibleFilter({ 
  title, 
  icon: Icon, 
  items, 
  selectedIds = [], 
  onToggle,
  defaultOpen = true 
}: CollapsibleFilterProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  const handleToggle = useCallback((id: string | number) => {
    onToggle(id)
  }, [onToggle])

  return (
    <SidebarGroup>
      <SidebarMenu>
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="group/collapsible"
          asChild
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip={title}>
                {Icon && <Icon />}
                <span>{title}</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {items.map((item) => (
                  <SidebarMenuSubItem key={item.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-1.5">
                      <Checkbox
                        checked={selectedIds.includes(item.id)}
                        onCheckedChange={() => handleToggle(item.id)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">
                        {item.label}
                      </span>
                    </label>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  )
})
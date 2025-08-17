"use client"

import * as React from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function FloatingSidebarTrigger() {
  const { state, isMobile } = useSidebar()
  
  if (isMobile) {
    return (
      <div className="fixed top-4 left-4 z-50">
        <SidebarTrigger className="h-10 w-10 bg-white shadow-md hover:bg-accent/50" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "fixed top-4 z-50 transition-[left] duration-200 ease-linear",
        state === "expanded" ? "left-[26rem]" : "left-[5rem]"
      )}
    >
      <SidebarTrigger className="h-10 w-10 bg-white shadow-md hover:bg-accent/50" />
    </div>
  )
}
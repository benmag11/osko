"use client"

import * as React from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function FloatingSidebarTrigger() {
  const { state } = useSidebar()

  return (
    <div
      className={cn(
        "fixed top-4 z-50 transition-[left] duration-200 ease-linear hidden lg:block",
        state === "expanded" ? "left-[26rem]" : "left-[5rem]"
      )}
    >
      <SidebarTrigger className="h-10 w-10 bg-white shadow-md hover:bg-accent/50" />
    </div>
  )
}
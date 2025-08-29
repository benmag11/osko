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
        "fixed top-[0.5rem] z-50 transition-[left] duration-200 ease-linear hidden lg:block",
        state === "expanded" ? "left-[26rem]" : "left-[3.5rem]"
      )}
    >
      <SidebarTrigger className="h-10 w-10 bg-white hover:bg-cream-200 hover:border-stone-300 border border-stone-200 transition-all duration-200 ease-in-out" />
    </div>
  )
}
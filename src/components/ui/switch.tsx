"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "group relative inline-grid h-7 w-[72px] grid-cols-2 shrink-0 cursor-pointer items-center rounded border border-stone-300 bg-stone-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] outline-hidden transition-colors focus-visible:ring-[3px] focus-visible:ring-salmon-500/30 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none absolute inset-y-px w-[calc(50%-2px)] rounded-[3px] shadow-sm transition-all duration-200 ease-out data-[state=unchecked]:left-px data-[state=unchecked]:bg-white data-[state=checked]:left-[calc(50%+1px)] data-[state=checked]:bg-salmon-500"
      />
      <span className="relative z-10 text-center text-xs font-medium select-none transition-colors duration-200 group-data-[state=unchecked]:text-stone-700 group-data-[state=checked]:text-stone-400">
        Off
      </span>
      <span className="relative z-10 text-center text-xs font-medium select-none transition-colors duration-200 group-data-[state=checked]:text-white group-data-[state=unchecked]:text-stone-400">
        On
      </span>
    </SwitchPrimitive.Root>
  )
}

export { Switch }

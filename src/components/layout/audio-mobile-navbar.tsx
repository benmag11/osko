"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAudioSidebar } from "@/components/sidebar"

/**
 * Mobile navbar for audio viewer pages
 * Uses AudioSidebar context instead of NormalSidebar
 */
export function AudioMobileNavbar() {
  const { setOpenMobile } = useAudioSidebar()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 block lg:hidden bg-cream-50 border-b border-stone-200">
      <div className="flex items-center justify-between h-14 px-4">
        <Link href="/dashboard/listening" className="flex items-center">
          <Image
            src="/logo-full.svg"
            alt="Osko"
            width={76}
            height={20}
            priority
            className="h-5"
          />
        </Link>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpenMobile(true)}
          className="h-10 w-10"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}

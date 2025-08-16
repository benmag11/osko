'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export function Navigation() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-[11px]">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.svg"
              alt="Studyclix"
              width={280}
              height={80}
              priority
              className="h-16 w-auto lg:h-20"
            />
          </Link>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="text-gray-700 hover:text-gray-900 hover:bg-transparent text-lg font-['Helvetica_Neue',sans-serif]"
              asChild
            >
              <Link href="/login">Sign in</Link>
            </Button>
            <Button
              className="bg-[#0275de] text-white hover:bg-[#0263c2] text-lg font-['Helvetica_Neue',sans-serif]"
              asChild
            >
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export function Navigation() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-4 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.svg"
              alt="Studyclix"
              width={140}
              height={40}
              priority
              className="h-8 w-auto lg:h-10"
            />
          </Link>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="text-gray-700 hover:text-gray-900 hover:bg-transparent"
              asChild
            >
              <Link href="/login">Sign in</Link>
            </Button>
            <Button
              className="bg-gray-900 text-white hover:bg-gray-800"
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
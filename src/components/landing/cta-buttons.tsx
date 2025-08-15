'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function CTAButtons() {
  return (
    <div className="flex items-center gap-4">
      <Button
        size="lg"
        className="bg-gray-900 text-white hover:bg-gray-800 px-8"
        asChild
      >
        <Link href="/signup">Sign up</Link>
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="border-gray-900 text-gray-900 hover:bg-gray-100 px-8"
        asChild
      >
        <Link href="/login">Sign in</Link>
      </Button>
    </div>
  )
}
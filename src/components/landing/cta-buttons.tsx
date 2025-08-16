'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function CTAButtons() {
  return (
    <div className="flex items-center gap-4">
      <Button
        size="lg"
        className="bg-[#292929] text-white hover:bg-[#1a1a1a] px-8 font-['Helvetica_Neue',_sans-serif]"
        asChild
      >
        <Link href="/signup">Sign up</Link>
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="border-[#292929] text-[#292929] hover:bg-gray-100 px-8 font-['Helvetica_Neue',_sans-serif]"
        asChild
      >
        <Link href="/login">Sign in</Link>
      </Button>
    </div>
  )
}
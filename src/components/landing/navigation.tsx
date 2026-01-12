import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function LandingNavigation() {
  return (
    <header className="bg-cream-50 border-b border-stone-200">
      <div className="container mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-full.svg"
            alt="Osko"
            width={134}
            height={36}
            priority
            className="h-9 w-auto"
          />
        </Link>
        
        <nav className="flex items-center gap-4">
          <Button asChild variant="ghost" size="default">
            <Link href="/auth/signin">Log In</Link>
          </Button>
          <Button asChild variant="default" size="default">
            <Link href="/auth/signup">Sign Up</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
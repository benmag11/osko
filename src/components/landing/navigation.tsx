import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function LandingNavigation() {
  return (
    <header className="bg-cream-50 border-b border-stone-200">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="Osko"
            width={76}
            height={20}
            priority
          />
        </Link>
        
        <nav className="flex items-center gap-4">
          <Link
            href="/auth/signin"
            className="text-sm font-medium text-warm-text-secondary hover:text-salmon-500 transition-colors"
          >
            Log in
          </Link>
          <Button asChild size="sm">
            <Link href="/auth/signup">Sign up</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function CTASection() {
  return (
    <section className="pt-8 pb-12 md:pt-10 md:pb-16">
      <div className="max-w-md mx-auto">
        <h2 className="text-center mb-6">
          <span className="block text-2xl md:text-3xl text-gray-400">Study by</span>
          <span className="block mt-2 text-5xl md:text-6xl font-bold text-gray-700">Keyword</span>
        </h2>
        <div className="flex flex-col gap-4">
          <Button asChild size="lg" className="w-full">
            <Link href="/auth/signup">Sign up</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/auth/signin">Sign in</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
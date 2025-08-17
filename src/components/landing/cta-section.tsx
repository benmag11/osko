'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import TypewriterWord from './typewriter-word'

export function CTASection() {
  return (
    <section className="pt-8 pb-12 md:pt-10 md:pb-16">
      <div className="max-w-md mx-auto">
        <h2 className="text-center mb-6">
          <span className="block text-2xl md:text-3xl text-gray-400">Study by</span>
          <div className="h-[72px] md:h-[84px] mt-2 flex items-center justify-center">
            <span className="text-5xl md:text-6xl font-bold text-gray-700">
              <TypewriterWord 
                sequences={[
                  { text: "keyword", deleteAfter: true, pauseAfter: 1500 },
                  { text: "topic", deleteAfter: true, pauseAfter: 1500 },
                  { text: "year", deleteAfter: false, pauseAfter: 1500 }
                ]}
                typingSpeed={80}
                startDelay={500}
                autoLoop={true}
                loopDelay={500}
              />
            </span>
          </div>
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
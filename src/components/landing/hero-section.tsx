import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  return (
    <section className="min-h-[calc(100vh-73px)] flex items-center justify-center px-4 py-12 md:py-16 lg:py-20">
      <div className="container mx-auto max-w-7xl w-full">
        {/* Full-width headline - spans entire container */}
        <h1 className="w-full font-serif font-semibold text-warm-text-primary text-7xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] 2xl:text-[12rem] leading-tight mb-8 md:mb-12 lg:mb-16">
          It&apos;s Studyclix...
        </h1>
        
        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-start">
          {/* Left column - Tagline and CTAs */}
          <div>
            {/* Text and divider wrapper - inline-block ensures divider matches text width */}
            <div className="inline-block">
              <h2 className="font-sans font-semibold text-warm-text-secondary text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-[7rem]">
                But It&apos;s{' '}
                <span className="text-salmon-500 font-semibold italic">free</span>
              </h2>
              
              {/* Divider - asymmetric spacing, closer to buttons */}
              <hr className="border-t-2 border-stone-400 mt-10 md:mt-12 lg:mt-14" />
            </div>
            
            {/* CTA Buttons - extra large for maximum prominence */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 md:mt-5 lg:mt-6">
              <Button asChild variant="primary" size="xl">
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link href="/auth/signin">Log In</Link>
              </Button>
            </div>
          </div>
          
          {/* Right column - Hero Image */}
          <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px] flex items-center justify-center">
            <Image
              src="/hero-image.svg"
              alt="Student studying with laptop"
              width={500}
              height={500}
              priority
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
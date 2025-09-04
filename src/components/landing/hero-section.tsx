import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Shared image configuration to maintain consistency and avoid duplication
const HERO_IMAGE_CONFIG = {
  src: '/hero-image.svg',
  alt: 'Student studying with laptop',
  width: 500,
  height: 500,
  priority: true,
} as const

export function HeroSection() {
  return (
    <section className="min-h-[calc(100vh-73px)] flex items-center justify-center py-12 md:px-4 md:py-16 lg:py-20">
      <div className="container mx-auto max-w-7xl w-full px-4 md:px-6 lg:px-8">
        {/* Mobile Layout (default) - Centered single column */}
        <div className="lg:hidden flex flex-col items-center text-center">
          {/* Combined headline for mobile */}
          <div className="mb-8 sm:mb-10 w-full">
            <h1 className="font-serif font-semibold text-warm-text-primary text-5xl sm:text-7xl md:text-8xl leading-tight">
              It&apos;s Studyclix...
            </h1>
            <h2 className="font-sans font-semibold text-warm-text-secondary text-5xl sm:text-4xl md:text-5xl mt-3 mb-3">
              But It&apos;s{' '}
              <span className="text-salmon-500 italic">free</span>
            </h2>
          </div>
          
          {/* Hero Image - Mobile */}
          <div className="relative w-full h-[280px] sm:h-[350px] md:h-[450px] mb-2 sm:mb-10">
            <Image 
              src={HERO_IMAGE_CONFIG.src}
              alt={HERO_IMAGE_CONFIG.alt}
              width={HERO_IMAGE_CONFIG.width}
              height={HERO_IMAGE_CONFIG.height}
              priority={HERO_IMAGE_CONFIG.priority}
              className="w-full h-full object-contain"
            />
          </div>
          
          {/* Divider - Mobile */}
          <hr className="border-t-2 border-stone-400 w-40 sm:w-48 mb-8 sm:mb-10" />
          
          {/* CTA Buttons - Mobile (stacked and centered) */}
          <div className="flex flex-col gap-4 w-full sm:max-w-sm md:max-w-md">
            <Button asChild variant="primary" size="xl" className="w-full">
              <Link href="/auth/signup">Sign Up</Link>
            </Button>
            <Button asChild variant="outline" size="xl" className="w-full">
              <Link href="/auth/signin">Log In</Link>
            </Button>
          </div>
        </div>
        
        {/* Desktop Layout (lg and above) - Original two-column layout */}
        <div className="hidden lg:block">
          {/* Full-width headline - spans entire container */}
          <h1 className="w-full font-serif font-semibold text-warm-text-primary text-8xl lg:text-9xl xl:text-[10rem] leading-tight mb-12 lg:mb-16">
            It&apos;s Studyclix...
          </h1>
          
          {/* Two-column layout */}
          <div className="grid grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left column - Tagline and CTAs */}
            <div>
              {/* Text and divider wrapper - inline-block ensures divider matches text width */}
              <div className="inline-block">
                <h2 className="font-sans font-semibold text-warm-text-secondary text-5xl lg:text-6xl">
                  But It&apos;s{' '}
                  <span className="text-salmon-500 italic">free</span>
                </h2>
                
                {/* Divider - asymmetric spacing, closer to buttons */}
                <hr className="border-t-2 border-stone-400 mt-12 lg:mt-14" />
              </div>
              
              {/* CTA Buttons - extra large for maximum prominence */}
              <div className="flex gap-4 mt-5 lg:mt-6">
                <Button asChild variant="primary" size="xl">
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
                <Button asChild variant="outline" size="xl">
                  <Link href="/auth/signin">Log In</Link>
                </Button>
              </div>
            </div>
            
            {/* Right column - Hero Image */}
            <div className="relative w-full h-[500px] flex items-center justify-center">
              <Image 
                src={HERO_IMAGE_CONFIG.src}
                alt={HERO_IMAGE_CONFIG.alt}
                width={HERO_IMAGE_CONFIG.width}
                height={HERO_IMAGE_CONFIG.height}
                priority={HERO_IMAGE_CONFIG.priority}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
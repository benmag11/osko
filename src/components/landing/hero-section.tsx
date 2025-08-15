'use client'

import Image from 'next/image'
import { CTAButtons } from './cta-buttons'

export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-white overflow-hidden">
      <div className="container mx-auto max-w-7xl px-6 lg:px-8">
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-20 lg:pt-0">
          <div className="lg:col-span-5 space-y-8 text-center lg:text-left py-12 lg:py-0">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-tight">
                It&apos;s Studyclix...
              </h1>
              <p className="text-3xl lg:text-4xl xl:text-5xl text-gray-600">
                But it&apos;s{' '}
                <span className="text-[#0275de] font-medium italic">free</span>
              </p>
            </div>
            
            <div className="flex justify-center lg:justify-start">
              <CTAButtons />
            </div>
          </div>
          
          <div className="lg:col-span-7 relative h-[400px] lg:h-[600px] xl:h-[700px]">
            <div className="absolute inset-0 flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-[400px] lg:max-w-[500px] xl:max-w-[600px] h-full">
                <Image
                  src="/landing-page-banner.svg"
                  alt="Studyclix mascot"
                  fill
                  priority
                  className="object-contain"
                  style={{ objectPosition: 'center' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
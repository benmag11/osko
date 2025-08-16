'use client'

import Image from 'next/image'
import { CTAButtons } from './cta-buttons'

export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-white overflow-hidden">
      <div className="container mx-auto max-w-7xl px-6 lg:px-8 min-h-screen flex items-center">
        <div className="max-w-3xl text-center lg:text-left py-12 lg:py-0 -mt-20">
          <div className="space-y-4 mb-32">
            <h1 className="text-9xl lg:text-[10.5rem] xl:text-[142px] font-medium text-gray-900 leading-tight whitespace-nowrap font-['Helvetica_Neue',sans-serif]">
              It&apos;s Studyclix...
            </h1>
            <p className="text-4xl lg:text-5xl xl:text-6xl text-gray-600 font-['Helvetica_Neue',sans-serif]">
              But it&apos;s{' '}
              <span className="text-[#0275de] font-bold italic">free</span>
            </p>
          </div>
          
          <div className="flex justify-center lg:justify-start">
            <CTAButtons />
          </div>
        </div>
      </div>
      
      <div className="absolute top-[70%] right-[20%] transform -translate-y-1/2 w-[400px] lg:w-[500px] xl:w-[600px] h-[400px] lg:h-[500px] xl:h-[600px]">
        <Image
          src="/landing-page-banner.svg"
          alt="Studyclix mascot"
          fill
          priority
          className="object-contain"
          style={{ objectPosition: 'center' }}
        />
      </div>
    </section>
  )
}
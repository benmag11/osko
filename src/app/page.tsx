'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="landing-background">
      {/* Content wrapper - above pseudo-elements */}
      <div className="relative z-10">
        {/* Header */}
        <header
          className={`fixed top-0 left-0 right-0 z-20 px-6 md:px-12 lg:px-16 py-6 transition-colors duration-200 ${
            scrolled ? 'bg-[#F9F8F1] border-b border-stone-200/60' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="transition-opacity hover:opacity-70 focus-visible:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 rounded"
            >
              <Image
                src="/logo-full.svg"
                alt="Osko"
                width={134}
                height={36}
                priority
                className="h-8 w-auto md:h-9"
              />
            </Link>

            <Link
              href="/auth/signup"
              className="text-[#D97757] text-base md:text-lg font-medium transition-opacity hover:opacity-70 focus-visible:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]/50 rounded px-2 py-1"
            >
              sign up →
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <main className="px-6 md:px-12 lg:px-16 pt-8 md:pt-12 lg:pt-16">
          <div className="max-w-4xl">
            {/* Headline */}
            <h1 className="font-sans text-4xl md:text-5xl lg:text-6xl font-extralight text-stone-900 mb-1">
              study smarter.
            </h1>
            <p className="font-sans text-2xl md:text-3xl lg:text-4xl font-extralight text-stone-500 mb-1">
              every past paper, every marking scheme,
            </p>
            <p className="font-sans text-2xl md:text-3xl lg:text-4xl font-extralight text-stone-400 mb-8 md:mb-10">
              all free.
            </p>

            {/* CTA Button */}
            <Link
              href="/auth/signup"
              className="inline-block bg-stone-800 text-white font-medium px-6 py-3 rounded-lg transition-colors hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-800 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9F8F1]"
            >
              get started
            </Link>
          </div>

          {/* Browser Mockup */}
          <div className="mt-16 md:mt-24 lg:mt-32 pb-16 md:pb-24">
            <div className="browser-mockup">
              {/* Browser Header */}
              <div className="browser-mockup-header">
                <div className="browser-mockup-button browser-mockup-button--close" />
                <div className="browser-mockup-button browser-mockup-button--minimize" />
                <div className="browser-mockup-button browser-mockup-button--maximize" />
              </div>
              {/* Screenshot - cropped to hide built-in traffic lights */}
              <div className="overflow-hidden">
                <Image
                  src="/website-screenshot.png"
                  alt="Osko exam platform interface showing past papers and marking schemes"
                  width={1920}
                  height={1080}
                  className="w-full h-auto -mt-[38px]"
                  priority
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

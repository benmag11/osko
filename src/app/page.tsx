'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import {
  Archive,
  Search,
  FileText,
  Headphones,
  Calculator,
  Gift,
} from 'lucide-react'

const features = [
  {
    icon: Archive,
    title: 'Complete Archive',
    description:
      'Every past paper and marking scheme from the Leaving Certificate, organised by subject and year.',
  },
  {
    icon: Search,
    title: 'Smart Search',
    description:
      'Filter questions by topic, year, question number, or exam type. Find exactly what you need.',
  },
  {
    icon: FileText,
    title: 'Full-Text Search',
    description:
      'Search within questions themselves. Looking for "quadratic equations"? Find every question instantly.',
  },
  {
    icon: Headphones,
    title: 'Listening Practice',
    description:
      'Audio comprehension practice with transcripts for oral exam preparation.',
  },
  {
    icon: Calculator,
    title: 'Points Calculator',
    description:
      'Plan your CAO points. See what grades you need across your subjects.',
  },
  {
    icon: Gift,
    title: 'Always Free',
    description:
      'No subscriptions, no hidden costs. Free for all students, forever.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Choose your subjects',
    description: 'Select the subjects you\'re studying from the full Leaving Cert curriculum.',
  },
  {
    number: '02',
    title: 'Browse & search',
    description: 'Find questions by topic, year, or keyword. Filter to focus on what matters.',
  },
  {
    number: '03',
    title: 'Study with answers',
    description: 'Every question comes with its official marking scheme. Learn from the source.',
  },
]

export default function HomePage() {
  const [showBorder, setShowBorder] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => setShowBorder(!entry.isIntersecting),
      { rootMargin: '-72px 0px 0px 0px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="landing-background">
      {/* Content wrapper - above pseudo-elements */}
      <div className="relative z-10">
        {/* ============================================
            NAVIGATION HEADER
            ============================================ */}
        <header
          className={`landing-header fixed top-0 left-0 right-0 z-20 px-6 md:px-12 lg:px-16 py-5 transition-shadow duration-200 ${
            showBorder ? 'shadow-[0_1px_0_0_rgba(28,25,23,0.08)]' : ''
          }`}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link
              href="/"
              className="transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 rounded"
            >
              <Image
                src="/logo-full.svg"
                alt="Uncooked"
                width={134}
                height={36}
                priority
                className="h-7 w-auto md:h-8"
              />
            </Link>

            <div className="flex items-center gap-6">
              <Link
                href="/auth/signin"
                className="text-link text-sm font-medium hidden sm:block"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="btn-salmon text-sm font-medium px-4 py-2 rounded-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </header>

        {/* ============================================
            HERO SECTION
            ============================================ */}
        <main className="relative px-6 md:px-12 lg:px-16 pt-32 md:pt-40 lg:pt-48">
          {/* Sentinel for scroll detection */}
          <div ref={sentinelRef} className="absolute top-0 left-0 h-px w-px" aria-hidden="true" />

          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              {/* Section label */}
              <p className="small-caps text-[#57534E] text-sm mb-4">
                Leaving Certificate Study Platform
              </p>

              {/* Main headline - Crimson Pro */}
              <h1 className="font-display text-4xl md:text-5xl lg:text-[3.5rem] leading-[1.1] font-medium text-[#1C1917] mb-6">
                Every past paper.
                <br />
                Every marking scheme.
                <br />
                One place.
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-[#57534E] mb-8 max-w-xl leading-relaxed">
                The complete Leaving Certificate study archive — searchable, organised, and completely free.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <Link
                  href="/auth/signup"
                  className="btn-salmon text-base font-medium px-6 py-3 rounded-lg inline-flex items-center gap-2"
                >
                  Start studying free
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/auth/signin"
                  className="text-link text-base font-medium sm:hidden"
                >
                  Sign in
                </Link>
              </div>
            </motion.div>

            {/* Decorative ruled line */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="ruled-line mt-16 md:mt-20"
            />

            {/* ============================================
                SOCIAL PROOF / STATS BAR
                ============================================ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap justify-center md:justify-start items-center gap-6 md:gap-10 py-10 md:py-12"
            >
              <div className="text-center md:text-left">
                <p className="font-display text-2xl md:text-3xl font-semibold text-[#1C1917]">
                  10,000+
                </p>
                <p className="text-sm text-[#57534E]">exam questions</p>
              </div>
              <div className="stat-separator hidden md:block" />
              <div className="text-center md:text-left">
                <p className="font-display text-2xl md:text-3xl font-semibold text-[#1C1917]">
                  All subjects
                </p>
                <p className="text-sm text-[#57534E]">Higher & Ordinary</p>
              </div>
              <div className="stat-separator hidden md:block" />
              <div className="text-center md:text-left">
                <p className="font-display text-2xl md:text-3xl font-semibold text-[#1C1917]">
                  100% free
                </p>
                <p className="text-sm text-[#57534E]">no hidden costs</p>
              </div>
            </motion.div>

            {/* ============================================
                FEATURES SECTION
                ============================================ */}
            <section className="py-16 md:py-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6 }}
              >
                <p className="small-caps text-[#57534E] text-sm mb-3">Features</p>
                <h2 className="font-display text-2xl md:text-3xl font-medium text-[#1C1917] mb-10">
                  Everything you need to study
                </h2>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="feature-card p-6 rounded-lg"
                  >
                    <feature.icon
                      className="w-5 h-5 text-[#57534E] mb-4"
                      strokeWidth={1.5}
                    />
                    <h3 className="font-display text-lg font-medium text-[#1C1917] mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-[#57534E] leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Decorative ruled line */}
            <div className="ruled-line" />

            {/* ============================================
                HOW IT WORKS SECTION
                ============================================ */}
            <section className="py-16 md:py-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6 }}
              >
                <p className="small-caps text-[#57534E] text-sm mb-3">How it works</p>
                <h2 className="font-display text-2xl md:text-3xl font-medium text-[#1C1917] mb-10">
                  Start studying in minutes
                </h2>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: index * 0.15 }}
                  >
                    <p className="step-number text-3xl mb-3">{step.number}</p>
                    <h3 className="font-display text-lg font-medium text-[#1C1917] mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-[#57534E] leading-relaxed">
                      {step.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* ============================================
                PRODUCT SCREENSHOT SECTION
                ============================================ */}
            <section className="py-16 md:py-20">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.7 }}
                className="browser-mockup"
              >
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
                    alt="Uncooked exam platform interface showing past papers and marking schemes"
                    width={1920}
                    height={1080}
                    className="w-full h-auto -mt-[38px]"
                    priority
                  />
                </div>
              </motion.div>
            </section>

            {/* Decorative ruled line */}
            <div className="ruled-line" />

            {/* ============================================
                FINAL CTA SECTION
                ============================================ */}
            <section className="py-20 md:py-28 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6 }}
                className="max-w-2xl mx-auto"
              >
                <h2 className="font-display text-3xl md:text-4xl font-medium text-[#1C1917] mb-4">
                  Ready to start studying?
                </h2>
                <p className="text-lg text-[#57534E] mb-8">
                  Join thousands of students using Uncooked to prepare for their Leaving Cert.
                </p>
                <Link
                  href="/auth/signup"
                  className="btn-salmon text-base font-medium px-8 py-3.5 rounded-lg inline-flex items-center gap-2"
                >
                  Create your free account
                  <span aria-hidden="true">→</span>
                </Link>
              </motion.div>
            </section>
          </div>
        </main>

        {/* ============================================
            FOOTER
            ============================================ */}
        <footer className="px-6 md:px-12 lg:px-16 py-10 border-t border-[#1C1917]/8">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="transition-opacity hover:opacity-70">
              <Image
                src="/logo-full.svg"
                alt="Uncooked"
                width={100}
                height={28}
                className="h-6 w-auto opacity-60"
              />
            </Link>
            <p className="text-sm text-[#57534E]">
              © {new Date().getFullYear()} Uncooked. Built for Irish students.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

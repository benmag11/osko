'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/providers/auth-provider'
import { createCheckoutSession } from '@/lib/stripe/subscription-actions'
import { Loader2, Check, Play } from 'lucide-react'

// ─── Video embed URL ───────────────────────────────────────────────
// Set to a URL to show the video, or null to show the placeholder.
// Vimeo (recommended — no end-screen suggestions):
//   'https://player.vimeo.com/video/VIDEO_ID?badge=0&autopause=0&player_id=0'
// YouTube:
//   'https://www.youtube-nocookie.com/embed/VIDEO_ID'
const VIDEO_EMBED_URL: string | null = null

const features = [
  '3 live grinds every week',
  '12 sessions per month',
  'Live, interactive classes',
  'Taught by a 625-point tutor',
  'Small group sizes',
  'Exam-focused preparation',
  'Cancel anytime',
]

function CtaButton({ className }: { className?: string }) {
  const { user, hasActiveSubscription, isLoading } = useAuth()
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)

  const handleCheckout = async () => {
    setIsCheckoutLoading(true)
    try {
      await createCheckoutSession()
    } catch (error) {
      console.error('Failed to create checkout session:', error)
      setIsCheckoutLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Button disabled variant="primary" size="xl" className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  // Gate on user === null BEFORE checking subscriptionState
  if (user === null) {
    return (
      <Button variant="primary" size="xl" asChild className={className}>
        <Link href="/auth/signup">
          Sign Up to Get Started
          <span aria-hidden="true">→</span>
        </Link>
      </Button>
    )
  }

  if (hasActiveSubscription) {
    return (
      <div className="text-center">
        <p className="text-sm text-[#57534E] mb-3">
          You&apos;re already an Ultra member
        </p>
        <Button variant="outline" size="lg" asChild className={className}>
          <Link href="/dashboard/grinds">Go to Your Grinds</Link>
        </Button>
      </div>
    )
  }

  // no_access / free_credits / expired
  return (
    <Button
      variant="primary"
      size="xl"
      onClick={handleCheckout}
      disabled={isCheckoutLoading}
      className={className}
    >
      {isCheckoutLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          Join Uncooked Ultra
          <span aria-hidden="true">→</span>
        </>
      )}
    </Button>
  )
}

function HeaderNav() {
  const { user, isLoading } = useAuth()

  // Invisible placeholder while loading to prevent layout shift
  if (isLoading) {
    return (
      <div className="flex items-center gap-6">
        <span className="invisible text-sm font-medium px-4 py-2">Sign Up</span>
      </div>
    )
  }

  // Logged in — show dashboard link
  if (user) {
    return (
      <div className="flex items-center gap-6">
        <Link
          href="/dashboard"
          className="btn-salmon text-sm font-medium px-4 py-2 rounded-lg"
        >
          Dashboard
        </Link>
      </div>
    )
  }

  // Logged out — sign in / sign up
  return (
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
        Sign Up
      </Link>
    </div>
  )
}

function VideoSection() {
  if (VIDEO_EMBED_URL) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7 }}
        className="aspect-video w-full overflow-hidden rounded-lg border border-[#1C1917]/8 shadow-[0_8px_30px_rgba(28,25,23,0.08)]"
      >
        <iframe
          src={VIDEO_EMBED_URL}
          title="Uncooked Ultra"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7 }}
      className="aspect-video w-full overflow-hidden rounded-lg border border-[#1C1917]/8 bg-[#F5F4ED] flex flex-col items-center justify-center gap-4"
    >
      <div className="w-16 h-16 rounded-full bg-white/80 border border-[#1C1917]/8 flex items-center justify-center shadow-sm">
        <Play className="w-6 h-6 text-[#57534E] ml-0.5" strokeWidth={1.5} />
      </div>
      <p className="text-sm text-[#57534E]">Video coming soon</p>
    </motion.div>
  )
}

function PricingCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
      className="max-w-lg mx-auto w-full rounded-xl bg-white border border-[#1C1917]/8 shadow-[0_4px_24px_rgba(28,25,23,0.06)] overflow-hidden"
    >
      {/* Card header */}
      <div className="px-8 pt-8 pb-6 text-center border-b border-[#1C1917]/6">
        <p className="small-caps text-[#57534E] text-sm mb-4">Uncooked Ultra</p>
        <div className="flex items-baseline justify-center gap-1.5">
          <span className="font-display text-5xl md:text-6xl font-semibold text-[#1C1917]">€30</span>
          <span className="text-lg text-[#57534E]">/month</span>
        </div>
      </div>

      {/* Features checklist */}
      <div className="px-8 py-6">
        <ul className="space-y-3.5">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#ED805E]/10 flex items-center justify-center">
                <Check className="w-3 h-3 text-[#D97757]" strokeWidth={2.5} />
              </div>
              <span className="text-[15px] text-[#1C1917]">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="px-8 pb-8">
        <CtaButton className="w-full" />
      </div>
    </motion.div>
  )
}

export default function UltraPage() {
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

            <HeaderNav />
          </div>
        </header>

        {/* ============================================
            HERO SECTION
            ============================================ */}
        <main className="relative px-6 md:px-12 lg:px-16 pt-32 md:pt-40 lg:pt-48">
          <div ref={sentinelRef} className="absolute top-0 left-0 h-px w-px" aria-hidden="true" />

          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <p className="small-caps text-[#57534E] text-sm mb-5">
                  Weekly live maths grinds for Leaving Cert students
                </p>

                <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[1.05] font-medium text-[#1C1917] mb-0">
                  Become an Uncooked{' '}
                  <span className="font-serif italic bg-gradient-to-r from-[#ED805E] to-[#D97757] bg-clip-text text-transparent">
                    Ultra
                  </span>
                </h1>
              </motion.div>
            </div>

            {/* ============================================
                PRICING CARD
                ============================================ */}
            <section className="mt-16 md:mt-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6 }}
                className="text-center mb-10"
              >
                <p className="small-caps text-[#57534E] text-sm mb-3">Pricing</p>
                <h2 className="font-display text-2xl md:text-3xl font-medium text-[#1C1917]">
                  One plan. Everything included.
                </h2>
              </motion.div>

              <PricingCard />
            </section>

            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="ruled-line mt-16 md:mt-24"
            />

            {/* ============================================
                VIDEO SECTION
                ============================================ */}
            <section className="mt-16 md:mt-24 mb-8 md:mb-12 max-w-3xl mx-auto text-center">
              <p className="small-caps text-[#57534E] text-sm mb-3">Hear me out</p>
              <VideoSection />
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

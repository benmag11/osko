'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Users, Loader2, ExternalLink, Lock, Info } from 'lucide-react'
import { getGrindsForWeek, registerForGrind, unregisterFromGrind } from '@/lib/supabase/grind-actions'
import { createCheckoutSession } from '@/lib/stripe/subscription-actions'
import { motion, AnimatePresence } from 'motion/react'
import Image from 'next/image'
import { useAuth } from '@/components/providers/auth-provider'
import type { GrindWithStatus, SubscriptionState } from '@/lib/types/database'

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-IE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTimeRange(scheduledAt: string, durationMinutes: number): string {
  const start = new Date(scheduledAt)
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000)
  const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
  return `${start.toLocaleTimeString('en-IE', opts)}–${end.toLocaleTimeString('en-IE', opts)}`
}

function getWeekDateRange(weekOffset: number): string {
  const now = new Date()
  // Get Monday of the target week (ISO week starts on Monday)
  const dayOfWeek = now.getDay()
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday + weekOffset * 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  return `${monday.toLocaleDateString('en-IE', opts)} – ${sunday.toLocaleDateString('en-IE', opts)}`
}

function TutorSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      <h2 className="text-2xl font-sans font-medium text-warm-text-muted mb-4">
        About the teacher (me)
      </h2>
      <div className="overflow-hidden rounded-sm border border-stone-200 bg-white">
        <div className="grid md:grid-cols-[200px_1fr]">
          {/* Left — Photo */}
          <div className="relative flex flex-col items-center justify-center gap-2 p-5">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm">
              <Image
                src="/baby_pic.JPG"
                alt="Photo of tutor as a baby"
                fill
                className="object-cover"
                sizes="200px"
                priority
              />
            </div>
            <p className="text-xs italic text-stone-400">This is me.</p>
          </div>

          {/* Right — Content */}
          <div className="flex flex-col justify-center p-6 md:p-8">
            <p className="text-sm md:text-base leading-relaxed text-stone-600">
              Hi, I&apos;m the creator of this website and I&apos;ll be giving grinds on here. I got{" "}
              <span className="font-medium text-stone-800">625 points</span> in the Leaving Cert
              and I&apos;m currently studying Engineering in UCD. I&apos;ve been awarded two
              academic scholarships:
            </p>
            <ul className="mt-3 mb-3 flex flex-col gap-1.5 text-sm md:text-base text-stone-600">
              <li className="flex items-baseline gap-2">
                <span className="text-stone-300">•</span>
                <span><span className="font-medium text-stone-800">UCD Ad Astra Scholarship (2025)</span> (€12,000)</span>
              </li>
              <li className="flex items-baseline gap-2">
                <span className="text-stone-300">•</span>
                <span><span className="font-medium text-stone-800">Naughton Scholarship (2025)</span> (€24,000)</span>
              </li>
              <li className="flex items-baseline gap-2">
                <span className="text-stone-300">•</span>
                <span>Combined value: <span className="font-medium text-stone-800">€36,000</span></span>
              </li>
            </ul>
            <p className="text-sm md:text-base leading-relaxed text-stone-600">
              I believe in teaching through understanding, not memorisation, and I&apos;ll be
              sharing the exam techniques and approaches to the maths exams that I think have done me well.
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

function GrindCard({ grind, weekOffset, subscriptionState }: {
  grind: GrindWithStatus
  weekOffset: number
  subscriptionState: SubscriptionState
}) {
  const queryClient = useQueryClient()
  const { user, refetchProfile } = useAuth()
  const isPast = new Date(grind.scheduled_at) < new Date()
  const [isSubscribeLoading, setIsSubscribeLoading] = useState(false)

  const handleSubscribe = async () => {
    setIsSubscribeLoading(true)
    try {
      await createCheckoutSession()
    } catch (error) {
      console.error('Failed to create checkout session:', error)
      setIsSubscribeLoading(false)
    }
  }

  const register = useMutation({
    mutationFn: () => registerForGrind(grind.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['grinds', weekOffset] })
      const previous = queryClient.getQueryData<{ data: GrindWithStatus[] }>(['grinds', weekOffset])

      queryClient.setQueryData<{ data: GrindWithStatus[] }>(['grinds', weekOffset], (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((g) =>
            g.id === grind.id
              ? { ...g, is_registered: true, registration_count: g.registration_count + 1 }
              : g
          ),
        }
      })

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['grinds', weekOffset], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['grinds', weekOffset] })
      refetchProfile()
    },
  })

  const unregister = useMutation({
    mutationFn: () => unregisterFromGrind(grind.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['grinds', weekOffset] })
      const previous = queryClient.getQueryData<{ data: GrindWithStatus[] }>(['grinds', weekOffset])

      queryClient.setQueryData<{ data: GrindWithStatus[] }>(['grinds', weekOffset], (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((g) =>
            g.id === grind.id
              ? { ...g, is_registered: false, registration_count: Math.max(0, g.registration_count - 1) }
              : g
          ),
        }
      })

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['grinds', weekOffset], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['grinds', weekOffset] })
      refetchProfile()
    },
  })

  const isMutating = register.isPending || unregister.isPending

  return (
    <Card className="bg-white rounded-sm">
      <CardHeader>
        <CardTitle className="font-sans text-2xl">{grind.title}</CardTitle>
        {grind.description && <CardDescription>{grind.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-warm-text-muted">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formatDate(grind.scheduled_at)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {formatTimeRange(grind.scheduled_at, grind.duration_minutes)}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {grind.registration_count} {grind.registration_count === 1 ? 'person' : 'people'} signed up
          </span>
          {grind.meeting_url && grind.is_registered && !isPast && (
            <a
              href={grind.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-stone-700 underline underline-offset-2 transition-colors hover:text-stone-900"
            >
              <ExternalLink className="h-4 w-4" />
              Join meeting
            </a>
          )}
        </div>
        <div className="mt-4">
          {isPast ? (
            <span className="inline-block text-xs text-warm-text-muted font-medium px-2 py-1 rounded-sm bg-stone-100">
              Ended
            </span>
          ) : grind.is_registered ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => unregister.mutate()}
              disabled={isMutating}
            >
              {unregister.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Leave'}
            </Button>
          ) : ['active', 'canceling', 'trialing', 'past_due'].includes(subscriptionState) ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => register.mutate()}
              disabled={isMutating}
            >
              {register.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign Up'}
            </Button>
          ) : subscriptionState === 'free_credits' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => register.mutate()}
              disabled={isMutating}
            >
              {register.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign Up — Free'}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSubscribe}
              disabled={isSubscribeLoading}
              className="gap-1.5"
            >
              {isSubscribeLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
              Subscribe to sign up
            </Button>
          )}
        </div>
        <AnimatePresence>
          {grind.is_registered && !isPast && (
            <motion.p
              key="reg-confirm"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="text-sm text-stone-500 leading-relaxed overflow-hidden"
            >
              You are registered! An email will be sent to{' '}
              <span className="font-medium text-stone-700">{user?.email}</span>{' '}
              confirming your registration.
              <br />
              Another reminder will be sent <span className="font-medium text-stone-700">2 hours</span> before your class.
            </motion.p>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

function GrindListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Banner skeleton */}
      <div className="h-12 rounded-sm bg-stone-100" />
      {/* Card skeletons */}
      <div className="rounded-sm border border-stone-200 bg-white p-6 space-y-3">
        <div className="h-6 w-48 rounded bg-stone-100" />
        <div className="h-4 w-72 rounded bg-stone-50" />
        <div className="flex gap-4">
          <div className="h-4 w-32 rounded bg-stone-50" />
          <div className="h-4 w-24 rounded bg-stone-50" />
        </div>
        <div className="h-8 w-20 rounded bg-stone-100" />
      </div>
      <div className="rounded-sm border border-stone-200 bg-white p-6 space-y-3">
        <div className="h-6 w-56 rounded bg-stone-100" />
        <div className="h-4 w-64 rounded bg-stone-50" />
        <div className="flex gap-4">
          <div className="h-4 w-32 rounded bg-stone-50" />
          <div className="h-4 w-24 rounded bg-stone-50" />
        </div>
        <div className="h-8 w-20 rounded bg-stone-100" />
      </div>
    </div>
  )
}

function SubscriptionBanner({ subscriptionState, periodEnd }: {
  subscriptionState: SubscriptionState
  periodEnd: string | null
}) {
  const [isSubscribeLoading, setIsSubscribeLoading] = useState(false)

  const handleSubscribe = async () => {
    setIsSubscribeLoading(true)
    try {
      await createCheckoutSession()
    } catch (error) {
      console.error('Failed to create checkout session:', error)
      setIsSubscribeLoading(false)
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-IE', { day: 'numeric', month: 'long' })

  switch (subscriptionState) {
    case 'active':
      return null
    case 'canceling':
      return (
        <div className="flex items-start gap-3 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>Your subscription ends on <span className="font-semibold">{periodEnd ? formatDate(periodEnd) : 'soon'}</span>. You have access until then.</p>
        </div>
      )
    case 'trialing':
      return (
        <div className="flex items-start gap-3 rounded-sm border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>You&apos;re on a free trial. Subscribe to keep access after <span className="font-semibold">{periodEnd ? formatDate(periodEnd) : 'your trial ends'}</span>.</p>
        </div>
      )
    case 'past_due':
      return (
        <div className="flex items-start gap-3 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p>Payment past due. Update your payment method to keep access.</p>
            <Button variant="outline" size="sm" onClick={handleSubscribe} disabled={isSubscribeLoading} className="h-7 text-xs">
              {isSubscribeLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Update Payment'}
            </Button>
          </div>
        </div>
      )
    case 'expired':
      return (
        <div className="flex items-start gap-3 rounded-sm border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p>Your subscription has ended. Subscribe for unlimited access.</p>
            <Button variant="outline" size="sm" onClick={handleSubscribe} disabled={isSubscribeLoading} className="h-7 text-xs">
              {isSubscribeLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Subscribe'}
            </Button>
          </div>
        </div>
      )
    case 'free_credits':
      return (
        <div className="flex items-start gap-3 rounded-sm border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>You have <span className="font-semibold">1 free grind</span>! Sign up for any session below to try it out.</p>
        </div>
      )
    case 'no_access':
      return (
        <div className="flex items-start gap-3 rounded-sm border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p>Subscribe for unlimited access to weekly grinds.</p>
            <Button variant="primary" size="sm" onClick={handleSubscribe} disabled={isSubscribeLoading} className="h-7 text-xs">
              {isSubscribeLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Subscribe — €30/month'}
            </Button>
          </div>
        </div>
      )
    default:
      return null
  }
}

function GrindList({ weekOffset }: { weekOffset: number }) {
  const { isProfileLoading, subscriptionState, profile } = useAuth()
  const { data, isLoading, error } = useQuery({
    queryKey: ['grinds', weekOffset],
    queryFn: () => getGrindsForWeek(weekOffset),
  })

  if (isLoading || isProfileLoading) {
    return <GrindListSkeleton />
  }

  if (error || data?.error) {
    return (
      <p className="text-center py-16 text-warm-text-muted">
        Failed to load grinds. Please try again later.
      </p>
    )
  }

  const grinds = data?.data ?? []

  if (grinds.length === 0) {
    return (
      <p className="text-center py-16 text-warm-text-muted">
        No grinds scheduled for this week.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <SubscriptionBanner
        subscriptionState={subscriptionState}
        periodEnd={profile?.subscription_current_period_end ?? null}
      />
      {grinds.map((grind) => (
        <GrindCard
          key={grind.id}
          grind={grind}
          weekOffset={weekOffset}
          subscriptionState={subscriptionState}
        />
      ))}
    </div>
  )
}

export function GrindsPageClient() {
  return (
    <DashboardPage maxWidth="max-w-6xl">
      {/* Heading */}
      <div className="mb-12 w-fit">
        <h1 className="text-6xl font-serif font-normal text-warm-text-secondary">
          Force you to learn.
        </h1>
      </div>

      <div className="space-y-10">
        {/* Upcoming Grinds — visible to all, sign-up gated for subscribers */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-sans font-medium text-warm-text-muted mb-4">
            Upcoming grinds
          </h2>
          <Tabs defaultValue="this-week">
            <TabsList>
              <TabsTrigger value="this-week" className="text-stone-500 data-[state=active]:bg-white data-[state=active]:text-stone-800">
                This Week
                <span className="ml-1.5 text-xs text-stone-400 hidden sm:inline">
                  ({getWeekDateRange(0)})
                </span>
              </TabsTrigger>
              <TabsTrigger value="next-week" className="text-stone-500 data-[state=active]:bg-white data-[state=active]:text-stone-800">
                Next Week
                <span className="ml-1.5 text-xs text-stone-400 hidden sm:inline">
                  ({getWeekDateRange(1)})
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="this-week">
              <GrindList weekOffset={0} />
            </TabsContent>
            <TabsContent value="next-week">
              <GrindList weekOffset={1} />
            </TabsContent>
          </Tabs>
        </motion.section>

        {/* Tutor Section — moved down */}
        <TutorSection />
      </div>
    </DashboardPage>
  )
}

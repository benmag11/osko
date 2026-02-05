'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/providers/auth-provider'
import { createPortalSession } from '@/lib/stripe/subscription-actions'
import { Loader2 } from 'lucide-react'

function BillingSkeleton() {
  return (
    <div className="px-6 py-5 animate-pulse">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-5 w-40 rounded bg-stone-100" />
        <div className="h-5 w-16 rounded bg-stone-100" />
      </div>
      <div className="h-4 w-56 rounded bg-stone-50 mb-4" />
      <div className="h-8 w-36 rounded bg-stone-100" />
    </div>
  )
}

export function BillingSection() {
  const { profile, isProfileLoading, subscriptionState } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleManageSubscription = async () => {
    setIsLoading(true)
    try {
      await createPortalSession()
    } catch (error) {
      console.error('Failed to create portal session:', error)
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  if (isProfileLoading) {
    return <BillingSkeleton />
  }

  switch (subscriptionState) {
    case 'active':
      return (
        <div className="px-6 py-5">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-base font-serif font-medium text-warm-text-primary">
                Uncooked Ultra
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active
              </span>
            </div>
            <p className="text-sm text-warm-text-muted mb-4">
              {profile?.subscription_current_period_end ? (
                <>
                  Next billing date:{' '}
                  <span className="font-medium text-warm-text-secondary">
                    {formatDate(profile.subscription_current_period_end)}
                  </span>
                </>
              ) : (
                'You have access to all grinds'
              )}
            </p>
            <Button onClick={handleManageSubscription} disabled={isLoading} variant="outline" size="sm">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Manage Subscription'}
            </Button>
          </div>
        </div>
      )

    case 'canceling':
      return (
        <div className="px-6 py-5">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-base font-serif font-medium text-warm-text-primary">
                Uncooked Ultra
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                Canceling
              </span>
            </div>
            <p className="text-sm text-warm-text-muted mb-4">
              {profile?.subscription_current_period_end ? (
                <>
                  Your subscription ends on{' '}
                  <span className="font-medium text-warm-text-secondary">
                    {formatDate(profile.subscription_current_period_end)}
                  </span>. You have access until then.
                </>
              ) : (
                'Your subscription is being canceled'
              )}
            </p>
            <Button onClick={handleManageSubscription} disabled={isLoading} variant="outline" size="sm">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Manage Subscription'}
            </Button>
          </div>
        </div>
      )

    case 'trialing':
      return (
        <div className="px-6 py-5">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-base font-serif font-medium text-warm-text-primary">
                Uncooked Ultra
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                Trial
              </span>
            </div>
            <p className="text-sm text-warm-text-muted mb-4">
              {profile?.subscription_current_period_end ? (
                <>
                  Your trial ends on{' '}
                  <span className="font-medium text-warm-text-secondary">
                    {formatDate(profile.subscription_current_period_end)}
                  </span>
                </>
              ) : (
                'You are on a free trial'
              )}
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/ultra">Upgrade</Link>
            </Button>
          </div>
        </div>
      )

    case 'past_due':
      return (
        <div className="px-6 py-5">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-base font-serif font-medium text-warm-text-primary">
                Uncooked Ultra
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                Past Due
              </span>
            </div>
            <p className="text-sm text-warm-text-muted mb-4">
              Your payment is past due. Please update your payment method to keep access.
            </p>
            <Button onClick={handleManageSubscription} disabled={isLoading} variant="primary" size="sm">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Payment'}
            </Button>
          </div>
        </div>
      )

    case 'free_credits':
      return (
        <div className="px-6 py-5">
          <div className="flex-1">
            <p className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-sm px-3 py-2 mb-3">
              You have <span className="font-semibold">1 free grind</span> available
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/ultra">Upgrade</Link>
            </Button>
          </div>
        </div>
      )

    case 'expired':
    case 'no_access':
    default:
      return (
        <div className="px-6 py-5">
          <div className="flex-1">
            <Button variant="outline" size="sm" asChild>
              <Link href="/ultra">Upgrade</Link>
            </Button>
          </div>
        </div>
      )
  }
}

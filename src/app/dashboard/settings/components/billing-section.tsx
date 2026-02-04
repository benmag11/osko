'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/providers/auth-provider'
import { createCheckoutSession, createPortalSession } from '@/lib/stripe/subscription-actions'
import { Loader2 } from 'lucide-react'

export function BillingSection() {
  const { profile, hasActiveSubscription } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async () => {
    setIsLoading(true)
    try {
      await createCheckoutSession()
    } catch (error) {
      console.error('Failed to create checkout session:', error)
      setIsLoading(false)
    }
  }

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

  if (hasActiveSubscription && profile) {
    return (
      <div className="px-6 py-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-base font-serif font-medium text-warm-text-primary">
                Grinds Subscription
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active
              </span>
            </div>

            <p className="text-sm text-warm-text-muted mb-4">
              {profile.subscription_cancel_at_period_end && profile.subscription_current_period_end ? (
                <>
                  Your subscription will end on{' '}
                  <span className="font-medium text-warm-text-secondary">
                    {formatDate(profile.subscription_current_period_end)}
                  </span>
                </>
              ) : profile.subscription_current_period_end ? (
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

            <Button
              onClick={handleManageSubscription}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Manage Subscription'
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-base font-serif font-medium text-warm-text-primary mb-1">
            Subscribe to access 3 weekly grinds
          </h3>

          <p className="text-sm text-warm-text-muted mb-4">
            Join live tutoring sessions every week with expert guidance on Leaving Cert maths.
          </p>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleSubscribe}
              disabled={isLoading}
              variant="primary"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Subscribe'
              )}
            </Button>
            <span className="text-sm text-warm-text-muted">
              <span className="font-semibold text-warm-text-secondary">€30</span>/month
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

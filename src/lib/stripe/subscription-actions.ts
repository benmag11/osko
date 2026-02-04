'use server'

import { redirect } from 'next/navigation'
import { stripe, GRINDS_PRICE_ID } from './stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://uncooked.ie'

/**
 * Creates a Stripe Checkout session for the grinds subscription.
 * Redirects user to Stripe's hosted checkout page.
 */
export async function createCheckoutSession(): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'You must be logged in to subscribe' }
  }

  // Check if user already has a Stripe customer ID
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id

  // Create a new customer if one doesn't exist
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        user_id: user.id,
      },
    })
    customerId = customer.id

    // Store customer ID in database
    await supabase
      .from('user_profiles')
      .update({ stripe_customer_id: customerId })
      .eq('user_id', user.id)
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: GRINDS_PRICE_ID,
        quantity: 1,
      },
    ],
    success_url: `${siteUrl}/dashboard/grinds?success=true`,
    cancel_url: `${siteUrl}/dashboard/settings?canceled=true`,
    metadata: {
      user_id: user.id,
    },
  })

  if (!session.url) {
    return { error: 'Failed to create checkout session' }
  }

  redirect(session.url)
}

/**
 * Creates a Stripe Customer Portal session.
 * Allows users to manage their subscription, payment methods, and view invoices.
 */
export async function createPortalSession(): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'You must be logged in' }
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return { error: 'No subscription found' }
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${siteUrl}/dashboard/settings`,
  })

  redirect(portalSession.url)
}

/**
 * Gets the current user's subscription status.
 */
export async function getSubscriptionStatus(): Promise<{
  status: 'none' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing'
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  error?: string
}> {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      status: 'none',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      error: 'Not authenticated',
    }
  }

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select(
      'subscription_status, subscription_current_period_end, subscription_cancel_at_period_end'
    )
    .eq('user_id', user.id)
    .single()

  if (error || !profile) {
    return {
      status: 'none',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      error: 'Failed to fetch subscription status',
    }
  }

  return {
    status: (profile.subscription_status as 'none' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing') || 'none',
    currentPeriodEnd: profile.subscription_current_period_end,
    cancelAtPeriodEnd: profile.subscription_cancel_at_period_end || false,
  }
}

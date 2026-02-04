import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

/**
 * Maps Stripe subscription status to our database status
 */
function mapSubscriptionStatus(
  status: Stripe.Subscription.Status
): 'none' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing' {
  switch (status) {
    case 'active':
      return 'active'
    case 'past_due':
      return 'past_due'
    case 'canceled':
      return 'canceled'
    case 'incomplete':
    case 'incomplete_expired':
      return 'incomplete'
    case 'trialing':
      return 'trialing'
    case 'unpaid':
      return 'past_due'
    case 'paused':
      return 'canceled'
    default:
      return 'none'
  }
}

/**
 * Updates user subscription data in database
 */
async function updateUserSubscription(
  stripeCustomerId: string,
  subscriptionData: {
    subscription_status: string
    subscription_id?: string | null
    subscription_current_period_end?: string | null
    subscription_cancel_at_period_end?: boolean
  }
) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('user_profiles')
    .update(subscriptionData)
    .eq('stripe_customer_id', stripeCustomerId)

  if (error) {
    console.error('Failed to update user subscription:', error)
    throw error
  }
}

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Only process subscription checkouts
        if (session.mode !== 'subscription') break

        const userId = session.metadata?.user_id
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        if (!userId || !customerId) {
          console.error('Missing user_id or customer in checkout session')
          break
        }

        // Link Stripe customer to user and set initial subscription status
        const supabase = createAdminClient()
        const { error } = await supabase
          .from('user_profiles')
          .update({
            stripe_customer_id: customerId,
            subscription_id: subscriptionId,
            subscription_status: 'active',
          })
          .eq('user_id', userId)

        if (error) {
          console.error('Failed to link Stripe customer to user:', error)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await updateUserSubscription(customerId, {
          subscription_status: mapSubscriptionStatus(subscription.status),
          subscription_id: subscription.id,
          subscription_current_period_end: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
          subscription_cancel_at_period_end: subscription.cancel_at_period_end,
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await updateUserSubscription(customerId, {
          subscription_status: 'canceled',
          subscription_id: null,
          subscription_current_period_end: null,
          subscription_cancel_at_period_end: false,
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        if (typeof customerId === 'string') {
          await updateUserSubscription(customerId, {
            subscription_status: 'past_due',
          })
        }
        break
      }

      default:
        // Unhandled event type
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

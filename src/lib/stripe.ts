import Stripe from 'stripe'
import type { Plan } from '@/types'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
})

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    briefs_per_month: 3,
    features: [
      '3 meeting briefs per month',
      'Basic attendee summaries',
      'Agenda suggestions',
      'Email delivery',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 15,
    briefs_per_month: 20,
    features: [
      '20 meeting briefs per month',
      'Company enrichment (Clearbit)',
      'Talking points & icebreakers',
      'Risk flags',
      'Priority email delivery',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    briefs_per_month: null,
    features: [
      'Unlimited meeting briefs',
      'Advanced company research',
      'LinkedIn summaries',
      'Custom brief templates',
      'Slack integration',
      'Priority support',
    ],
  },
]

export async function createCheckoutSession(
  userId: string,
  email: string,
  priceId: string
): Promise<string> {
  // Check if customer already exists
  const existingCustomers = await stripe.customers.list({ email, limit: 1 })
  let customerId: string

  if (existingCustomers.data.length > 0) {
    customerId = existingCustomers.data[0].id
  } else {
    const customer = await stripe.customers.create({
      email,
      metadata: { userId },
    })
    customerId = customer.id
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    subscription_data: {
      metadata: { userId },
    },
    metadata: { userId },
  })

  return session.url!
}

export async function createBillingPortalSession(
  customerId: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
  })

  return session.url
}

export function getPlanFromSubscription(
  subscription: Stripe.Subscription
): 'free' | 'starter' | 'pro' {
  if (
    subscription.status !== 'active' &&
    subscription.status !== 'trialing'
  ) {
    return 'free'
  }

  const priceId = subscription.items.data[0]?.price.id

  if (priceId === process.env.STRIPE_STARTER_PRICE_ID) {
    return 'starter'
  }
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
    return 'pro'
  }

  return 'free'
}

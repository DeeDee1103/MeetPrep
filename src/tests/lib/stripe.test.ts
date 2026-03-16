import { describe, it, expect, vi, beforeEach } from 'vitest'
import type Stripe from 'stripe'

// ─── Mock Stripe SDK ──────────────────────────────────────────────────────────

const mockCustomersList = vi.fn()
const mockCustomersCreate = vi.fn()
const mockCheckoutCreate = vi.fn()
const mockPortalCreate = vi.fn()

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => ({
    customers: {
      list: mockCustomersList,
      create: mockCustomersCreate,
    },
    checkout: {
      sessions: { create: mockCheckoutCreate },
    },
    billingPortal: {
      sessions: { create: mockPortalCreate },
    },
  })),
}))

const {
  PLANS,
  createCheckoutSession,
  createBillingPortalSession,
  getPlanFromSubscription,
} = await import('@/lib/stripe')

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PLANS', () => {
  it('has exactly 3 plans: free, starter, pro', () => {
    const ids = PLANS.map((p) => p.id)
    expect(ids).toEqual(['free', 'starter', 'pro'])
  })

  it('free plan has 3 briefs/month and $0 price', () => {
    const free = PLANS.find((p) => p.id === 'free')!
    expect(free.price).toBe(0)
    expect(free.briefs_per_month).toBe(3)
  })

  it('starter plan is $15/month with 20 briefs', () => {
    const starter = PLANS.find((p) => p.id === 'starter')!
    expect(starter.price).toBe(15)
    expect(starter.briefs_per_month).toBe(20)
  })

  it('pro plan is $29/month with unlimited briefs (null)', () => {
    const pro = PLANS.find((p) => p.id === 'pro')!
    expect(pro.price).toBe(29)
    expect(pro.briefs_per_month).toBeNull()
  })
})

describe('createCheckoutSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    mockCheckoutCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/session_123' })
  })

  it('reuses existing Stripe customer when one is found', async () => {
    mockCustomersList.mockResolvedValueOnce({
      data: [{ id: 'cus_existing' }],
    })

    await createCheckoutSession('user-1', 'user@example.com', 'price_abc')

    expect(mockCustomersCreate).not.toHaveBeenCalled()
    const checkoutCall = mockCheckoutCreate.mock.calls[0][0]
    expect(checkoutCall.customer).toBe('cus_existing')
  })

  it('creates a new Stripe customer when none exists', async () => {
    mockCustomersList.mockResolvedValueOnce({ data: [] })
    mockCustomersCreate.mockResolvedValueOnce({ id: 'cus_new' })

    await createCheckoutSession('user-2', 'new@example.com', 'price_abc')

    expect(mockCustomersCreate).toHaveBeenCalledWith({
      email: 'new@example.com',
      metadata: { userId: 'user-2' },
    })
    const checkoutCall = mockCheckoutCreate.mock.calls[0][0]
    expect(checkoutCall.customer).toBe('cus_new')
  })

  it('returns the checkout session URL', async () => {
    mockCustomersList.mockResolvedValueOnce({ data: [{ id: 'cus_x' }] })

    const url = await createCheckoutSession('u', 'u@e.com', 'price_abc')

    expect(url).toBe('https://checkout.stripe.com/session_123')
  })

  it('uses subscription mode', async () => {
    mockCustomersList.mockResolvedValueOnce({ data: [{ id: 'cus_x' }] })

    await createCheckoutSession('u', 'u@e.com', 'price_abc')

    expect(mockCheckoutCreate.mock.calls[0][0].mode).toBe('subscription')
  })
})

describe('createBillingPortalSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    mockPortalCreate.mockResolvedValue({ url: 'https://billing.stripe.com/portal_123' })
  })

  it('returns billing portal URL', async () => {
    const url = await createBillingPortalSession('cus_abc')
    expect(url).toBe('https://billing.stripe.com/portal_123')
  })

  it('passes the correct customerId and return_url', async () => {
    await createBillingPortalSession('cus_abc')
    expect(mockPortalCreate).toHaveBeenCalledWith({
      customer: 'cus_abc',
      return_url: 'http://localhost:3000/settings',
    })
  })
})

describe('getPlanFromSubscription', () => {
  beforeEach(() => {
    process.env.STRIPE_STARTER_PRICE_ID = 'price_starter'
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro'
  })

  function makeSubscription(status: string, priceId: string): Stripe.Subscription {
    return {
      status,
      items: { data: [{ price: { id: priceId } }] },
    } as unknown as Stripe.Subscription
  }

  it('returns "starter" for active starter subscription', () => {
    const sub = makeSubscription('active', 'price_starter')
    expect(getPlanFromSubscription(sub)).toBe('starter')
  })

  it('returns "pro" for active pro subscription', () => {
    const sub = makeSubscription('active', 'price_pro')
    expect(getPlanFromSubscription(sub)).toBe('pro')
  })

  it('returns "starter" for trialing starter subscription', () => {
    const sub = makeSubscription('trialing', 'price_starter')
    expect(getPlanFromSubscription(sub)).toBe('starter')
  })

  it('returns "free" for canceled subscription', () => {
    const sub = makeSubscription('canceled', 'price_starter')
    expect(getPlanFromSubscription(sub)).toBe('free')
  })

  it('returns "free" for past_due subscription', () => {
    const sub = makeSubscription('past_due', 'price_pro')
    expect(getPlanFromSubscription(sub)).toBe('free')
  })

  it('returns "free" for unrecognized price ID', () => {
    const sub = makeSubscription('active', 'price_unknown')
    expect(getPlanFromSubscription(sub)).toBe('free')
  })
})

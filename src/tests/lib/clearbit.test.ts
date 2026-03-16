import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { enrichCompany } from '@/lib/clearbit'

// ─── Mock global fetch ────────────────────────────────────────────────────────

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function mockOkResponse(body: object) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => body,
  })
}

function mockErrorResponse(status: number) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({}),
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('enrichCompany', () => {
  const CLEARBIT_RESPONSE = {
    name: 'Stripe',
    description: 'Payment infrastructure for the internet.',
    category: { industry: 'Financial Technology' },
    metrics: { employees: 8000, employeesRange: '5001-10000' },
    logo: 'https://logo.clearbit.com/stripe.com',
    tags: ['fintech', 'payments'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CLEARBIT_API_KEY = 'test-clearbit-key'
  })

  afterEach(() => {
    delete process.env.CLEARBIT_API_KEY
  })

  it('returns null and warns when CLEARBIT_API_KEY is not set', async () => {
    delete process.env.CLEARBIT_API_KEY

    const result = await enrichCompany('stripe.com')

    expect(result).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('maps a full Clearbit response to CompanySnapshot', async () => {
    mockOkResponse(CLEARBIT_RESPONSE)

    const result = await enrichCompany('stripe.com')

    expect(result).toEqual({
      name: 'Stripe',
      description: 'Payment infrastructure for the internet.',
      industry: 'Financial Technology',
      employee_count: '5001-10000',
      logo_url: 'https://logo.clearbit.com/stripe.com',
      recent_news: [],
    })
  })

  it('falls back to domain as name when Clearbit name is absent', async () => {
    mockOkResponse({ ...CLEARBIT_RESPONSE, name: undefined })

    const result = await enrichCompany('stripe.com')

    expect(result!.name).toBe('stripe.com')
  })

  it('uses employees number as string when employeesRange is absent', async () => {
    mockOkResponse({
      ...CLEARBIT_RESPONSE,
      metrics: { employees: 500 },
    })

    const result = await enrichCompany('stripe.com')

    expect(result!.employee_count).toBe('500')
  })

  it('sets employee_count to null when metrics are absent', async () => {
    mockOkResponse({ ...CLEARBIT_RESPONSE, metrics: undefined })

    const result = await enrichCompany('stripe.com')

    expect(result!.employee_count).toBeNull()
  })

  it('returns null on 404 (company not found)', async () => {
    mockErrorResponse(404)

    const result = await enrichCompany('unknown-domain.xyz')

    expect(result).toBeNull()
  })

  it('returns null on non-404 API errors', async () => {
    mockErrorResponse(429)

    const result = await enrichCompany('stripe.com')

    expect(result).toBeNull()
  })

  it('returns null when fetch throws (network error)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'))

    const result = await enrichCompany('stripe.com')

    expect(result).toBeNull()
  })

  it('encodes the domain in the request URL', async () => {
    mockOkResponse(CLEARBIT_RESPONSE)

    await enrichCompany('stripe.com')

    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('stripe.com')
    expect(url).toContain('/v2/companies/find')
  })

  it('sends Authorization header with Bearer token', async () => {
    mockOkResponse(CLEARBIT_RESPONSE)

    await enrichCompany('stripe.com')

    const opts = mockFetch.mock.calls[0][1] as RequestInit
    expect((opts.headers as Record<string, string>)['Authorization']).toBe(
      'Bearer test-clearbit-key'
    )
  })

  it('sets logo_url to null when logo field is absent', async () => {
    mockOkResponse({ ...CLEARBIT_RESPONSE, logo: undefined })

    const result = await enrichCompany('stripe.com')

    expect(result!.logo_url).toBeNull()
  })
})

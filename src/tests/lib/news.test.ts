import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getCompanyNews } from '@/lib/news'

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

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BING_RESPONSE = {
  value: [
    { name: 'Stripe raises $1B at $65B valuation' },
    { name: 'Stripe launches new payment APIs' },
    { name: 'Stripe expands to 40 new countries' },
    { name: 'Stripe acquires fintech startup' },
    { name: 'Fifth article should be excluded' },
  ],
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('getCompanyNews', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.BING_NEWS_API_KEY = 'test-bing-key'
  })

  afterEach(() => {
    delete process.env.BING_NEWS_API_KEY
  })

  it('returns [] and does not fetch when BING_NEWS_API_KEY is not set', async () => {
    delete process.env.BING_NEWS_API_KEY

    const result = await getCompanyNews('Stripe')

    expect(result).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns an array of article names on success', async () => {
    mockOkResponse(BING_RESPONSE)

    const result = await getCompanyNews('Stripe')

    expect(result).toContain('Stripe raises $1B at $65B valuation')
    expect(result).toContain('Stripe launches new payment APIs')
  })

  it('limits results to 3 headlines', async () => {
    mockOkResponse(BING_RESPONSE)

    const result = await getCompanyNews('Stripe')

    expect(result).toHaveLength(3)
    expect(result).not.toContain('Fifth article should be excluded')
  })

  it('returns [] on non-200 API error', async () => {
    mockErrorResponse(429)

    const result = await getCompanyNews('Stripe')

    expect(result).toEqual([])
  })

  it('returns [] when fetch throws (network error)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'))

    const result = await getCompanyNews('Stripe')

    expect(result).toEqual([])
  })

  it('returns [] when response has no value array', async () => {
    mockOkResponse({})

    const result = await getCompanyNews('Stripe')

    expect(result).toEqual([])
  })

  it('includes the company name in the search query', async () => {
    mockOkResponse(BING_RESPONSE)

    await getCompanyNews('Stripe')

    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('Stripe')
    expect(url).toContain('/v7.0/news/search')
  })

  it('sends the Bing subscription key header', async () => {
    mockOkResponse(BING_RESPONSE)

    await getCompanyNews('Stripe')

    const opts = mockFetch.mock.calls[0][1] as RequestInit
    expect((opts.headers as Record<string, string>)['Ocp-Apim-Subscription-Key']).toBe(
      'test-bing-key'
    )
  })

  it('handles fewer than 3 articles gracefully', async () => {
    mockOkResponse({ value: [{ name: 'Only one article' }] })

    const result = await getCompanyNews('SmallCo')

    expect(result).toEqual(['Only one article'])
  })
})

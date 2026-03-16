import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getLinkedInProfile } from '@/lib/proxycurl'

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

const FULL_PROFILE_RESPONSE = {
  url: 'https://www.linkedin.com/in/alice-example',
  name: 'Alice Example',
  occupation: 'VP of Engineering',
  headline: 'Engineering leader building developer tools',
  summary: 'Experienced engineering executive with 10+ years in B2B SaaS.',
  experiences: [
    { company: 'Acme Corp', title: 'VP of Engineering' },
    { company: 'Previous Co', title: 'Senior Engineer' },
  ],
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('getLinkedInProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.PROXYCURL_API_KEY = 'test-proxycurl-key'
  })

  afterEach(() => {
    delete process.env.PROXYCURL_API_KEY
  })

  it('returns null and does not fetch when PROXYCURL_API_KEY is not set', async () => {
    delete process.env.PROXYCURL_API_KEY

    const result = await getLinkedInProfile('alice@acme.com')

    expect(result).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns null on 404 (profile not found)', async () => {
    mockErrorResponse(404)

    const result = await getLinkedInProfile('nobody@acme.com')

    expect(result).toBeNull()
  })

  it('returns null on non-404 API errors', async () => {
    mockErrorResponse(429)

    const result = await getLinkedInProfile('alice@acme.com')

    expect(result).toBeNull()
  })

  it('returns null when response has no url field', async () => {
    mockOkResponse({ name: 'Alice', occupation: 'Engineer' }) // no url

    const result = await getLinkedInProfile('alice@acme.com')

    expect(result).toBeNull()
  })

  it('returns null when fetch throws (network error)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'))

    const result = await getLinkedInProfile('alice@acme.com')

    expect(result).toBeNull()
  })

  it('maps a full response to LinkedInProfile', async () => {
    mockOkResponse(FULL_PROFILE_RESPONSE)

    const result = await getLinkedInProfile('alice@acme.com')

    expect(result).toEqual({
      name: 'Alice Example',
      role: 'VP of Engineering',
      company: 'Acme Corp',
      summary: expect.stringContaining('Engineering leader building developer tools'),
    })
  })

  it('includes both headline and summary in the summary field', async () => {
    mockOkResponse(FULL_PROFILE_RESPONSE)

    const result = await getLinkedInProfile('alice@acme.com')

    expect(result!.summary).toContain('Engineering leader building developer tools')
    expect(result!.summary).toContain('Experienced engineering executive')
  })

  it('falls back to first experience title when occupation is absent', async () => {
    mockOkResponse({
      url: 'https://linkedin.com/in/bob',
      name: 'Bob',
      experiences: [{ company: 'Corp', title: 'Manager' }],
    })

    const result = await getLinkedInProfile('bob@corp.com')

    expect(result!.role).toBe('Manager')
    expect(result!.company).toBe('Corp')
  })

  it('returns null summary when neither headline nor summary is present', async () => {
    mockOkResponse({
      url: 'https://linkedin.com/in/minimal',
      name: 'Minimal User',
      occupation: 'Engineer',
    })

    const result = await getLinkedInProfile('minimal@acme.com')

    expect(result!.summary).toBeNull()
  })

  it('sends the email as work_email query param', async () => {
    mockOkResponse(FULL_PROFILE_RESPONSE)

    await getLinkedInProfile('alice@acme.com')

    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('work_email=alice%40acme.com')
  })

  it('sends Authorization header with Bearer token', async () => {
    mockOkResponse(FULL_PROFILE_RESPONSE)

    await getLinkedInProfile('alice@acme.com')

    const opts = mockFetch.mock.calls[0][1] as RequestInit
    expect((opts.headers as Record<string, string>)['Authorization']).toBe(
      'Bearer test-proxycurl-key'
    )
  })

  it('requests enrich_profile=enrich for a single-call lookup', async () => {
    mockOkResponse(FULL_PROFILE_RESPONSE)

    await getLinkedInProfile('alice@acme.com')

    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('enrich_profile=enrich')
  })

  it('truncates summary to 400 chars', async () => {
    const longSummary = 'X'.repeat(500)
    mockOkResponse({ ...FULL_PROFILE_RESPONSE, summary: longSummary, headline: undefined })

    const result = await getLinkedInProfile('alice@acme.com')

    expect(result!.summary!.length).toBeLessThanOrEqual(400)
  })
})

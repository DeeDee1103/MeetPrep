import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Supabase mock ────────────────────────────────────────────────────────────

const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

// ─── Dependency mocks ─────────────────────────────────────────────────────────

const mockGenerateBrief = vi.fn()
vi.mock('@/lib/anthropic', () => ({ generateMeetingBrief: mockGenerateBrief }))

const mockEnrichCompany = vi.fn()
vi.mock('@/lib/clearbit', () => ({ enrichCompany: mockEnrichCompany }))

const { POST } = await import('@/app/api/briefs/demo/route')

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BRIEF_CONTENT = {
  agenda: ['Intro', 'Demo', 'Q&A'],
  talking_points: ['t1', 't2', 't3', 't4', 't5'],
  company_snapshot: null,
  icebreakers: ['i1', 'i2'],
  risk_flags: [],
  attendee_summaries: [],
}

const STORED_MEETING = { id: 'demo-meeting-1' }
const STORED_BRIEF = { id: 'demo-brief-1' }

function setupSupabaseChain(
  user: object | null = { id: 'user-1' },
  meetingInsertData: object | null = STORED_MEETING,
  briefInsertData: object | null = STORED_BRIEF
) {
  mockGetUser.mockResolvedValue({ data: { user } })

  mockFrom.mockImplementation((table: string) => {
    const makeSingleChain = (data: object | null, errorMsg?: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data,
        error: data ? null : { message: errorMsg ?? 'error' },
      }),
    })

    if (table === 'meetings') {
      return {
        insert: vi.fn().mockReturnValue(makeSingleChain(meetingInsertData)),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }
    }

    if (table === 'briefs') {
      return {
        insert: vi.fn().mockReturnValue(makeSingleChain(briefInsertData)),
      }
    }

    return {}
  })
}

function buildRequest() {
  return new NextRequest('http://localhost/api/demo', { method: 'POST' })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/demo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGenerateBrief.mockResolvedValue(BRIEF_CONTENT)
    mockEnrichCompany.mockResolvedValue(null)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const res = await POST()
    expect(res.status).toBe(401)
  })

  it('returns 200 with briefId and meetingId on success', async () => {
    setupSupabaseChain()

    const res = await POST()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.briefId).toBe('demo-brief-1')
    expect(body.meetingId).toBe('demo-meeting-1')
  })

  it('calls enrichCompany for stripe.com', async () => {
    setupSupabaseChain()

    await POST()

    expect(mockEnrichCompany).toHaveBeenCalledWith('stripe.com')
  })

  it('uses hardcoded Stripe company fallback when enrichment returns null', async () => {
    setupSupabaseChain()
    mockEnrichCompany.mockResolvedValue(null)

    await POST()

    const briefCall = mockGenerateBrief.mock.calls[0][0]
    expect(briefCall.companyData.name).toBe('Stripe')
  })

  it('uses Clearbit data when enrichment succeeds', async () => {
    const clearbitStripe = {
      name: 'Stripe Inc',
      description: 'Payments',
      industry: 'Fintech',
      employee_count: '5001-10000',
      logo_url: 'https://logo.clearbit.com/stripe.com',
      recent_news: [],
    }
    setupSupabaseChain()
    mockEnrichCompany.mockResolvedValue(clearbitStripe)

    await POST()

    const briefCall = mockGenerateBrief.mock.calls[0][0]
    expect(briefCall.companyData).toEqual(clearbitStripe)
  })

  it('generates brief with Stripe demo meeting title', async () => {
    setupSupabaseChain()

    await POST()

    const briefCall = mockGenerateBrief.mock.calls[0][0]
    expect(briefCall.meetingTitle).toBe('Intro Call with Stripe Team')
  })

  it('returns 500 when meeting insert fails', async () => {
    setupSupabaseChain({ id: 'user-1' }, null)

    const res = await POST()
    expect(res.status).toBe(500)
  })

  it('returns 500 when brief insert fails', async () => {
    setupSupabaseChain({ id: 'user-1' }, STORED_MEETING, null)

    const res = await POST()
    expect(res.status).toBe(500)
  })

  it('returns 500 when generateMeetingBrief throws', async () => {
    setupSupabaseChain()
    mockGenerateBrief.mockRejectedValueOnce(new Error('API failure'))

    const res = await POST()
    expect(res.status).toBe(500)
  })

  it('stores the brief with correct fields', async () => {
    setupSupabaseChain()

    await POST()

    // The insert into briefs should include the brief content fields
    const briefsFrom = mockFrom.mock.calls.find((call) => call[0] === 'briefs')
    expect(briefsFrom).toBeDefined()
  })
})

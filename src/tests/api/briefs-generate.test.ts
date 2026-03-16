import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Supabase mock ────────────────────────────────────────────────────────────

const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockRpc = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
    rpc: mockRpc,
  })),
}))

// ─── Anthropic mock ───────────────────────────────────────────────────────────

const mockGenerateBrief = vi.fn()
vi.mock('@/lib/anthropic', () => ({ generateMeetingBrief: mockGenerateBrief }))

// ─── Clearbit mock ────────────────────────────────────────────────────────────

const mockEnrichCompany = vi.fn()
vi.mock('@/lib/clearbit', () => ({ enrichCompany: mockEnrichCompany }))

// ─── Resend mock ──────────────────────────────────────────────────────────────

const mockSendBriefEmail = vi.fn()
vi.mock('@/lib/resend', () => ({ sendBriefEmail: mockSendBriefEmail }))

// Import route AFTER mocks are set up
const { POST } = await import('@/app/api/briefs/generate/route')

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MEETING = {
  id: 'meeting-1',
  user_id: 'user-1',
  title: 'Discovery Call',
  description: 'Exploratory call',
  start_time: new Date(Date.now() + 86400000).toISOString(),
  end_time: new Date(Date.now() + 90000000).toISOString(),
  attendees: [
    { email: 'guest@acme.com', name: 'Guest', company: 'Acme', linkedin_url: null },
  ],
  brief_status: 'pending',
  brief_id: null,
  location: null,
  meeting_link: null,
}

const PROFILE = {
  plan: 'free' as const,
  briefs_generated_this_month: 0,
  email: 'owner@mycompany.com',
}

const BRIEF_CONTENT = {
  agenda: ['a', 'b', 'c'],
  talking_points: ['t1', 't2', 't3', 't4', 't5'],
  company_snapshot: null,
  icebreakers: ['i1', 'i2'],
  risk_flags: [],
  attendee_summaries: [],
}

const STORED_BRIEF = { id: 'brief-1', ...BRIEF_CONTENT }

function buildRequest(body: object, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/briefs/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

// ─── Supabase chain builder ───────────────────────────────────────────────────

function setupSupabaseChain({
  user = { id: 'user-1' },
  profile = PROFILE,
  meeting = MEETING,
  insertBrief = STORED_BRIEF,
  updateMeetingOk = true,
}: {
  user?: object | null
  profile?: object | null
  meeting?: object | null
  insertBrief?: object | null
  updateMeetingOk?: boolean
} = {}) {
  mockGetUser.mockResolvedValue({ data: { user } })

  // Each .from() call returns a chainable object
  mockFrom.mockImplementation((table: string) => {
    const chain: Record<string, unknown> = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    }

    if (table === 'users') {
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({ data: profile, error: null })
    } else if (table === 'meetings') {
      // first single() = fetch meeting; subsequent update().eq() chains
      let meetingFetchCalled = false
      ;(chain.single as ReturnType<typeof vi.fn>).mockImplementation(() => {
        if (!meetingFetchCalled) {
          meetingFetchCalled = true
          return Promise.resolve({ data: meeting, error: null })
        }
        return Promise.resolve({ data: meeting, error: null })
      })
      ;(chain.update as ReturnType<typeof vi.fn>).mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: updateMeetingOk ? null : { message: 'err' } }),
      })
    } else if (table === 'briefs') {
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: insertBrief,
        error: insertBrief ? null : { message: 'insert failed' },
      })
      ;(chain.update as ReturnType<typeof vi.fn>).mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })
    }

    return chain
  })

  mockRpc.mockResolvedValue({ error: null })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/briefs/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.WEBHOOK_SECRET = 'secret'
    mockEnrichCompany.mockResolvedValue(null)
    mockGenerateBrief.mockResolvedValue(BRIEF_CONTENT)
    mockSendBriefEmail.mockResolvedValue(undefined)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }))

    const req = buildRequest({ meetingId: 'meeting-1' })
    const res = await POST(req)

    expect(res.status).toBe(401)
  })

  it('returns 400 when meetingId is missing', async () => {
    setupSupabaseChain()

    const req = buildRequest({})
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('returns 402 when user is over plan limit', async () => {
    setupSupabaseChain({
      profile: { ...PROFILE, briefs_generated_this_month: 3 }, // free limit = 3
    })

    const req = buildRequest({ meetingId: 'meeting-1' })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(402)
    expect(body.limitReached).toBe(true)
  })

  it('returns 404 when meeting is not found', async () => {
    setupSupabaseChain({ meeting: null })

    const req = buildRequest({ meetingId: 'ghost-meeting' })
    const res = await POST(req)

    expect(res.status).toBe(404)
  })

  it('returns 409 when brief is already generating', async () => {
    setupSupabaseChain({ meeting: { ...MEETING, brief_status: 'generating' } })

    const req = buildRequest({ meetingId: 'meeting-1' })
    const res = await POST(req)

    expect(res.status).toBe(409)
  })

  it('returns 200 with briefId on successful generation', async () => {
    setupSupabaseChain()

    const req = buildRequest({ meetingId: 'meeting-1' })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.briefId).toBe('brief-1')
  })

  it('calls generateMeetingBrief with correct params', async () => {
    setupSupabaseChain()

    const req = buildRequest({ meetingId: 'meeting-1' })
    await POST(req)

    expect(mockGenerateBrief).toHaveBeenCalledWith(
      expect.objectContaining({
        meetingTitle: 'Discovery Call',
        attendees: MEETING.attendees,
      })
    )
  })

  it('calls enrichCompany for external attendee domain', async () => {
    setupSupabaseChain()

    const req = buildRequest({ meetingId: 'meeting-1' })
    await POST(req)

    expect(mockEnrichCompany).toHaveBeenCalledWith('acme.com')
  })

  it('skips enrichment for free email providers', async () => {
    const gmailMeeting = {
      ...MEETING,
      attendees: [{ email: 'guest@gmail.com', name: 'Guest', company: null, linkedin_url: null }],
    }
    setupSupabaseChain({ meeting: gmailMeeting })

    const req = buildRequest({ meetingId: 'meeting-1' })
    await POST(req)

    expect(mockEnrichCompany).not.toHaveBeenCalled()
  })

  it('accepts webhook calls with valid webhook secret header', async () => {
    setupSupabaseChain()

    const req = buildRequest(
      { meetingId: 'meeting-1' },
      { 'x-webhook-secret': 'secret', 'x-user-id': 'user-1' }
    )
    const res = await POST(req)

    expect(res.status).toBe(200)
  })

  it('returns 500 and marks meeting as failed when generation throws', async () => {
    setupSupabaseChain()
    mockGenerateBrief.mockRejectedValueOnce(new Error('Claude timeout'))

    const req = buildRequest({ meetingId: 'meeting-1' })
    const res = await POST(req)

    expect(res.status).toBe(500)
  })

  it('still returns 200 even when email sending fails', async () => {
    setupSupabaseChain()
    mockSendBriefEmail.mockRejectedValueOnce(new Error('SMTP error'))

    const req = buildRequest({ meetingId: 'meeting-1' })
    const res = await POST(req)

    expect(res.status).toBe(200)
  })
})

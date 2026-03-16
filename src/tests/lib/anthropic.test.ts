import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Attendee, CompanySnapshot } from '@/types'

// ─── Mock the Anthropic SDK before importing the lib ─────────────────────────

const mockCreate = vi.fn()

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}))

// Import AFTER mock is set up
const { generateMeetingBrief } = await import('@/lib/anthropic')

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ATTENDEES: Attendee[] = [
  { email: 'alice@acme.com', name: 'Alice', company: 'Acme', linkedin_url: null },
]

const COMPANY: CompanySnapshot = {
  name: 'Acme Corp',
  description: 'A fictional company.',
  industry: 'Software',
  employee_count: '500-1000',
  logo_url: 'https://logo.clearbit.com/acme.com',
  recent_news: ['Acme raises $50M Series B'],
}

const VALID_BRIEF_JSON = {
  agenda: ['Introductions', 'Product demo', 'Next steps'],
  talking_points: ['Point 1', 'Point 2', 'Point 3', 'Point 4', 'Point 5'],
  icebreakers: ['Did you see the game last night?', 'How was your flight?'],
  risk_flags: ['Budget constraints mentioned in email'],
  attendee_summaries: [
    {
      email: 'alice@acme.com',
      name: 'Alice',
      role: 'CTO',
      company: 'Acme',
      linkedin_summary: 'Experienced engineering leader.',
    },
  ],
}

function mockClaudeResponse(json: object) {
  mockCreate.mockResolvedValueOnce({
    content: [{ type: 'text', text: JSON.stringify(json) }],
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('generateMeetingBrief', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ANTHROPIC_API_KEY = 'test-key'
  })

  it('returns structured brief on a valid Claude response', async () => {
    mockClaudeResponse(VALID_BRIEF_JSON)

    const result = await generateMeetingBrief({
      meetingTitle: 'Intro Call',
      attendees: ATTENDEES,
      companyData: COMPANY,
      meetingDescription: 'Discovery call',
    })

    expect(result.agenda).toHaveLength(3)
    expect(result.talking_points).toHaveLength(5)
    expect(result.icebreakers).toHaveLength(2)
    expect(result.risk_flags).toHaveLength(1)
    expect(result.attendee_summaries).toHaveLength(1)
    expect(result.company_snapshot).toEqual(COMPANY)
  })

  it('passes meetingTitle and attendees into the prompt', async () => {
    mockClaudeResponse(VALID_BRIEF_JSON)

    await generateMeetingBrief({
      meetingTitle: 'Quarterly Review',
      attendees: ATTENDEES,
      companyData: null,
      meetingDescription: null,
    })

    const callArgs = mockCreate.mock.calls[0][0]
    const userMessage = callArgs.messages[0].content as string
    expect(userMessage).toContain('Quarterly Review')
    expect(userMessage).toContain('alice@acme.com')
  })

  it('strips markdown code fences from Claude response', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'text',
          text: '```json\n' + JSON.stringify(VALID_BRIEF_JSON) + '\n```',
        },
      ],
    })

    const result = await generateMeetingBrief({
      meetingTitle: 'Test',
      attendees: ATTENDEES,
      companyData: null,
      meetingDescription: null,
    })

    expect(result.agenda).toHaveLength(3)
  })

  it('defaults to empty arrays when Claude omits fields', async () => {
    mockClaudeResponse({ agenda: ['Only this'] })

    const result = await generateMeetingBrief({
      meetingTitle: 'Partial',
      attendees: [],
      companyData: null,
      meetingDescription: null,
    })

    expect(result.talking_points).toEqual([])
    expect(result.icebreakers).toEqual([])
    expect(result.risk_flags).toEqual([])
    expect(result.attendee_summaries).toEqual([])
  })

  it('throws when Claude returns non-JSON text', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Sorry, I cannot help with that.' }],
    })

    await expect(
      generateMeetingBrief({
        meetingTitle: 'Bad',
        attendees: [],
        companyData: null,
        meetingDescription: null,
      })
    ).rejects.toThrow('Failed to parse Claude response as JSON')
  })

  it('throws when Claude returns a non-text content block', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'image', source: {} }],
    })

    await expect(
      generateMeetingBrief({
        meetingTitle: 'Bad',
        attendees: [],
        companyData: null,
        meetingDescription: null,
      })
    ).rejects.toThrow('Unexpected response type from Claude')
  })

  it('uses claude-sonnet-4-6 model', async () => {
    mockClaudeResponse(VALID_BRIEF_JSON)

    await generateMeetingBrief({
      meetingTitle: 'Model check',
      attendees: [],
      companyData: null,
      meetingDescription: null,
    })

    expect(mockCreate.mock.calls[0][0].model).toBe('claude-sonnet-4-6')
  })

  it('sets company_snapshot to null when no companyData provided', async () => {
    mockClaudeResponse(VALID_BRIEF_JSON)

    const result = await generateMeetingBrief({
      meetingTitle: 'No company',
      attendees: [],
      companyData: null,
      meetingDescription: null,
    })

    expect(result.company_snapshot).toBeNull()
  })
})

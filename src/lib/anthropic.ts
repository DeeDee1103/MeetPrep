import Anthropic from '@anthropic-ai/sdk'
import type { Attendee, Brief, CompanySnapshot, AttendeeSummary } from '@/types'
import type { LinkedInProfile } from './proxycurl'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type BriefContent = Omit<Brief, 'id' | 'meeting_id' | 'user_id' | 'generated_at' | 'email_sent_at' | 'research_quality' | 'followup_content' | 'followup_generated_at'>

interface GenerateBriefParams {
  meetingTitle: string
  attendees: Attendee[]
  companyData: CompanySnapshot | null
  meetingDescription: string | null
  linkedinProfiles?: Record<string, LinkedInProfile>
}

export async function generateMeetingBrief(
  params: GenerateBriefParams
): Promise<BriefContent> {
  const { meetingTitle, attendees, companyData, meetingDescription, linkedinProfiles } = params

  const attendeeList = attendees
    .map((a) => {
      const profile = linkedinProfiles?.[a.email]
      const name = profile?.name ?? a.name ?? 'Unknown'
      const company = a.company ?? profile?.company ?? null
      const role = profile?.role ?? null
      let line = `- ${name} (${a.email})`
      if (company) line += ` from ${company}`
      if (role) line += ` · ${role}`
      if (profile?.summary) line += `\n  LinkedIn: ${profile.summary}`
      return line
    })
    .join('\n')

  const companyContext = companyData
    ? `
Company: ${companyData.name}
Industry: ${companyData.industry ?? 'Unknown'}
Description: ${companyData.description}
Size: ${companyData.employee_count ?? 'Unknown'}
Recent news: ${companyData.recent_news.length > 0 ? companyData.recent_news.join('; ') : 'None available'}
`.trim()
    : 'No company data available.'

  const systemPrompt = `You are MeetPrep, an AI assistant that prepares professionals for business meetings.
Your job is to generate a comprehensive meeting brief that helps the user walk into the meeting fully prepared.
Always return a valid JSON object with no additional text or markdown.`

  const userPrompt = `Prepare a meeting brief for the following meeting:

Meeting Title: ${meetingTitle}
Description: ${meetingDescription ?? 'No description provided.'}

Attendees:
${attendeeList}

Company Context:
${companyContext}

Generate a JSON object with EXACTLY this structure:
{
  "agenda": ["item1", "item2", "item3"],
  "talking_points": ["point1", "point2", "point3", "point4", "point5"],
  "icebreakers": ["icebreaker1", "icebreaker2"],
  "risk_flags": ["flag1"],
  "attendee_summaries": [
    {
      "email": "person@example.com",
      "name": "Person Name",
      "role": "Their likely role/title",
      "company": "Their company",
      "linkedin_summary": "Brief professional summary based on what you know about them"
    }
  ]
}

Rules:
- agenda: exactly 3 likely agenda items for this meeting
- talking_points: exactly 5 specific, actionable talking points tailored to this meeting
- icebreakers: exactly 2 natural conversation starters relevant to the attendees or company
- risk_flags: array of potential concerns or red flags (can be empty [])
- attendee_summaries: one entry per attendee with professional context

Return ONLY the JSON object, no markdown, no explanation.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    system: systemPrompt,
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  // Strip any potential markdown code fences
  const rawText = content.text
    .replace(/^```(?:json)?\n?/m, '')
    .replace(/\n?```$/m, '')
    .trim()

  let parsed: {
    agenda: string[]
    talking_points: string[]
    icebreakers: string[]
    risk_flags: string[]
    attendee_summaries: AttendeeSummary[]
  }

  try {
    parsed = JSON.parse(rawText)
  } catch {
    throw new Error(`Failed to parse Claude response as JSON: ${rawText.slice(0, 200)}`)
  }

  return {
    agenda: Array.isArray(parsed.agenda) ? parsed.agenda : [],
    talking_points: Array.isArray(parsed.talking_points) ? parsed.talking_points : [],
    company_snapshot: companyData,
    icebreakers: Array.isArray(parsed.icebreakers) ? parsed.icebreakers : [],
    risk_flags: Array.isArray(parsed.risk_flags) ? parsed.risk_flags : [],
    attendee_summaries: Array.isArray(parsed.attendee_summaries)
      ? parsed.attendee_summaries
      : [],
  }
}

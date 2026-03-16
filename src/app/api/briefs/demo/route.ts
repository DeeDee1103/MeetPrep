import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateMeetingBrief } from '@/lib/anthropic'
import { enrichCompany } from '@/lib/clearbit'
import type { Attendee } from '@/types'

const DEMO_MEETING_TITLE = 'Intro Call with Stripe Team'
const DEMO_ATTENDEES: Attendee[] = [
  {
    email: 'patrick@stripe.com',
    name: 'Patrick Collison',
    company: 'Stripe',
    linkedin_url: null,
  },
  {
    email: 'john@stripe.com',
    name: 'John Collison',
    company: 'Stripe',
    linkedin_url: null,
  },
]

const DEMO_DESCRIPTION =
  'Initial discovery call to explore partnership opportunities and learn more about Stripe\'s APIs and payment infrastructure.'

export async function POST() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Enrich Stripe company data
    const companyData = await enrichCompany('stripe.com')

    // Fallback company data if Clearbit fails or key not set
    const company = companyData ?? {
      name: 'Stripe',
      description:
        'Stripe is a technology company that builds economic infrastructure for the internet. Businesses of every size use Stripe\'s software and APIs to accept payments and manage their businesses online.',
      industry: 'Financial Technology',
      employee_count: '8,000+',
      logo_url: 'https://logo.clearbit.com/stripe.com',
      recent_news: [
        'Stripe valued at $65B in secondary market transactions',
        'Launched Stripe Tax for automated tax collection globally',
        'Expanded Stripe Issuing to 30+ new countries',
      ],
    }

    // Generate the demo brief
    const briefContent = await generateMeetingBrief({
      meetingTitle: DEMO_MEETING_TITLE,
      attendees: DEMO_ATTENDEES,
      companyData: company,
      meetingDescription: DEMO_DESCRIPTION,
    })

    // Create a demo meeting 1 day from now
    const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)

    const { data: meetingData, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        user_id: user.id,
        google_event_id: `demo-stripe-${user.id}-${Date.now()}`,
        title: DEMO_MEETING_TITLE,
        description: DEMO_DESCRIPTION,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        attendees: DEMO_ATTENDEES,
        location: null,
        meeting_link: 'https://meet.google.com/demo-link',
        brief_status: 'generating',
      })
      .select()
      .single()

    if (meetingError || !meetingData) {
      throw new Error(`Failed to create demo meeting: ${meetingError?.message}`)
    }

    // Store the brief
    const { data: briefData, error: briefError } = await supabase
      .from('briefs')
      .insert({
        meeting_id: meetingData.id,
        user_id: user.id,
        agenda: briefContent.agenda,
        talking_points: briefContent.talking_points,
        company_snapshot: briefContent.company_snapshot,
        icebreakers: briefContent.icebreakers,
        risk_flags: briefContent.risk_flags,
        attendee_summaries: briefContent.attendee_summaries,
        research_quality: 'full',
      })
      .select()
      .single()

    if (briefError || !briefData) {
      throw new Error(`Failed to store demo brief: ${briefError?.message}`)
    }

    // Update meeting with brief ID
    await supabase
      .from('meetings')
      .update({
        brief_id: briefData.id,
        brief_status: 'ready',
      })
      .eq('id', meetingData.id)

    return NextResponse.json({ briefId: briefData.id, meetingId: meetingData.id })
  } catch (error) {
    console.error('Demo brief generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate demo brief' },
      { status: 500 }
    )
  }
}

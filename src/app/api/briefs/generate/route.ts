import { NextResponse, type NextRequest } from 'next/server'

// Allow up to 5 minutes for the full enrichment + Claude pipeline on Vercel Pro
export const maxDuration = 300
import { createClient } from '@/lib/supabase/server'
import { generateMeetingBrief } from '@/lib/anthropic'
import { enrichCompany } from '@/lib/clearbit'
import { getLinkedInProfile } from '@/lib/proxycurl'
import { getCompanyNews } from '@/lib/news'
import { sendBriefEmail } from '@/lib/resend'
import { getDomainFromEmail, isOverLimit, isPersonalEmailDomain } from '@/lib/utils'
import type { Meeting, User, Brief } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = createClient()

  // Support both authenticated requests and internal webhook calls
  // WEBHOOK_SECRET must be set and non-empty; otherwise reject all webhook auth attempts
  const configuredSecret = process.env.WEBHOOK_SECRET
  const webhookSecret = request.headers.get('x-webhook-secret')
  const webhookUserId = request.headers.get('x-user-id')
  const isWebhookCall =
    !!configuredSecret &&
    webhookSecret === configuredSecret &&
    !!webhookUserId

  let userId: string

  if (isWebhookCall && webhookUserId) {
    userId = webhookUserId
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    userId = user.id
  }

  let body: { meetingId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { meetingId } = body
  if (!meetingId) {
    return NextResponse.json({ error: 'meetingId is required' }, { status: 400 })
  }

  // Fetch user profile for plan limits
  const { data: profileData } = await supabase
    .from('users')
    .select('plan, briefs_generated_this_month, email')
    .eq('id', userId)
    .single()

  const profile = profileData as Pick<User, 'plan' | 'briefs_generated_this_month' | 'email'> | null

  if (!profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Check plan limits
  if (isOverLimit(profile.plan, profile.briefs_generated_this_month)) {
    return NextResponse.json(
      {
        error: `You have reached your ${profile.plan} plan limit. Please upgrade to generate more briefs.`,
        limitReached: true,
      },
      { status: 402 }
    )
  }

  // Fetch the meeting
  const { data: meetingData } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', meetingId)
    .eq('user_id', userId)
    .single()

  if (!meetingData) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
  }

  const meeting = meetingData as Meeting

  if (meeting.brief_status === 'generating') {
    return NextResponse.json({ error: 'Brief is already being generated' }, { status: 409 })
  }

  // Mark as generating
  await supabase
    .from('meetings')
    .update({ brief_status: 'generating' })
    .eq('id', meetingId)

  try {
    // Find external attendees (not from the user's own domain)
    const userDomain = profile.email.split('@')[1]
    const externalAttendees = meeting.attendees.filter(
      (a) => !a.email.endsWith(`@${userDomain}`)
    )

    let companyData = null
    const linkedinProfiles: Record<string, NonNullable<Awaited<ReturnType<typeof getLinkedInProfile>>>> = {}
    let researchQuality: 'full' | 'limited' | 'minimal' = 'minimal'

    if (externalAttendees.length > 0) {
      const domain = getDomainFromEmail(externalAttendees[0].email)
      const isPersonalEmail = !domain || isPersonalEmailDomain(domain)

      // Run Clearbit + LinkedIn lookups in parallel
      const [clearbitResult, ...linkedinResults] = await Promise.all([
        isPersonalEmail ? Promise.resolve(null) : enrichCompany(domain),
        ...externalAttendees.map((a) => getLinkedInProfile(a.email)),
      ])

      companyData = clearbitResult

      // Collect LinkedIn profiles
      externalAttendees.forEach((a, i) => {
        const lp = linkedinResults[i]
        if (lp) linkedinProfiles[a.email] = lp
      })

      // Fetch news using company name from Clearbit, or the domain
      if (!isPersonalEmail) {
        const companyName = companyData?.name ?? domain
        const news = await getCompanyNews(companyName)
        if (companyData) {
          companyData = { ...companyData, recent_news: news }
        } else if (news.length > 0) {
          companyData = {
            name: companyName,
            description: '',
            industry: null,
            employee_count: null,
            logo_url: null,
            recent_news: news,
          }
        }
      }

      // Determine research quality based on what data was available
      const hasLinkedIn = Object.keys(linkedinProfiles).length > 0
      if (!isPersonalEmail && companyData && hasLinkedIn) {
        researchQuality = 'full'
      } else if (!isPersonalEmail && (companyData || hasLinkedIn)) {
        researchQuality = 'limited'
      } else {
        researchQuality = 'minimal'
      }
    }

    // Generate brief via Claude
    const briefContent = await generateMeetingBrief({
      meetingTitle: meeting.title,
      attendees: meeting.attendees,
      companyData,
      meetingDescription: meeting.description,
      linkedinProfiles: Object.keys(linkedinProfiles).length > 0
        ? linkedinProfiles
        : undefined,
    })

    // Store the brief
    const { data: newBriefData, error: briefError } = await supabase
      .from('briefs')
      .insert({
        meeting_id: meeting.id,
        user_id: userId,
        agenda: briefContent.agenda,
        talking_points: briefContent.talking_points,
        company_snapshot: briefContent.company_snapshot,
        icebreakers: briefContent.icebreakers,
        risk_flags: briefContent.risk_flags,
        attendee_summaries: briefContent.attendee_summaries,
        research_quality: researchQuality,
      })
      .select()
      .single()

    if (briefError || !newBriefData) {
      throw new Error(`Failed to store brief: ${briefError?.message}`)
    }

    const newBrief = newBriefData as Brief

    // Update meeting with brief reference
    await supabase
      .from('meetings')
      .update({
        brief_id: newBrief.id,
        brief_status: 'ready',
      })
      .eq('id', meetingId)

    // Increment monthly brief count using the atomic RPC (preferred for production).
    // The direct .update() fallback is only for local development before the RPC
    // migration has been applied — it is not safe for concurrent production traffic.
    try {
      const { error: rpcError } = await supabase.rpc('increment_brief_count', { user_id_param: userId })
      if (rpcError) {
        await supabase
          .from('users')
          .update({
            briefs_generated_this_month: profile.briefs_generated_this_month + 1,
          })
          .eq('id', userId)
      }
    } catch {
      await supabase
        .from('users')
        .update({
          briefs_generated_this_month: profile.briefs_generated_this_month + 1,
        })
        .eq('id', userId)
    }

    // Send email (non-fatal)
    if (profile.email) {
      try {
        const updatedMeeting = { ...meeting, brief_id: newBrief.id, brief_status: 'ready' as const }
        await sendBriefEmail(profile.email, newBrief, updatedMeeting)

        await supabase
          .from('briefs')
          .update({ email_sent_at: new Date().toISOString() })
          .eq('id', newBrief.id)
      } catch (emailError) {
        console.warn('Failed to send brief email:', emailError)
      }
    }

    return NextResponse.json({ briefId: newBrief.id })
  } catch (error) {
    console.error('Brief generation error:', error)

    // Mark as failed
    await supabase
      .from('meetings')
      .update({ brief_status: 'failed' })
      .eq('id', meetingId)

    return NextResponse.json(
      { error: 'Failed to generate brief' },
      { status: 500 }
    )
  }
}

import { inngest } from '@/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateMeetingBrief } from '@/lib/anthropic'
import { enrichCompany } from '@/lib/clearbit'
import { getLinkedInProfile } from '@/lib/proxycurl'
import { getCompanyNews } from '@/lib/news'
import { sendBriefEmail } from '@/lib/resend'
import { getDomainFromEmail } from '@/lib/utils'
import type { Meeting, User, Brief } from '@/types'
import type { LinkedInProfile } from '@/lib/proxycurl'

export const generateBriefFn = inngest.createFunction(
  {
    id: 'generate-brief',
    name: 'Generate Meeting Brief',
    retries: 2,
  },
  { event: 'meetprep/brief.requested' },
  async ({ event, step }) => {
    const { meetingId, userId } = event.data as { meetingId: string; userId: string }
    const supabase = createAdminClient()

    // Step 1: Load meeting and user profile
    const { meeting, userEmail } = await step.run('load-meeting', async () => {
      const { data: meetingData } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .eq('user_id', userId)
        .single()

      if (!meetingData) throw new Error(`Meeting ${meetingId} not found`)

      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single()

      if (!userData) throw new Error(`User ${userId} not found`)

      // Mark as generating
      await supabase
        .from('meetings')
        .update({ brief_status: 'generating' })
        .eq('id', meetingId)

      return { meeting: meetingData as Meeting, userEmail: userData.email as string }
    })

    // Step 2: Enrich attendee data in parallel
    const enrichmentData = await step.run('enrich-attendees', async () => {
      const userDomain = userEmail.split('@')[1]
      const externalAttendees = meeting.attendees.filter(
        (a) => !a.email.endsWith(`@${userDomain}`)
      )

      if (externalAttendees.length === 0) {
        return { companyData: null, linkedinProfiles: {}, researchQuality: 'minimal' as const }
      }

      const domain = getDomainFromEmail(externalAttendees[0].email)
      const isPersonalEmail = !domain || !!domain.match(/^(gmail|yahoo|hotmail|outlook)\./i)

      const [clearbitResult, ...linkedinResults] = await Promise.all([
        isPersonalEmail ? Promise.resolve(null) : enrichCompany(domain),
        ...externalAttendees.map((a) => getLinkedInProfile(a.email)),
      ])

      let companyData = clearbitResult
      const linkedinProfiles: Record<string, LinkedInProfile> = {}

      externalAttendees.forEach((a, i) => {
        const lp = linkedinResults[i]
        if (lp) linkedinProfiles[a.email] = lp
      })

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

      const hasLinkedIn = Object.keys(linkedinProfiles).length > 0
      let researchQuality: 'full' | 'limited' | 'minimal' = 'minimal'
      if (!isPersonalEmail && companyData && hasLinkedIn) {
        researchQuality = 'full'
      } else if (!isPersonalEmail && (companyData || hasLinkedIn)) {
        researchQuality = 'limited'
      }

      return { companyData, linkedinProfiles, researchQuality }
    })

    // Step 3: Generate brief via Claude
    const briefContent = await step.run('generate-with-claude', async () => {
      return generateMeetingBrief({
        meetingTitle: meeting.title,
        attendees: meeting.attendees,
        companyData: enrichmentData.companyData,
        meetingDescription: meeting.description,
        linkedinProfiles:
          Object.keys(enrichmentData.linkedinProfiles).length > 0
            ? enrichmentData.linkedinProfiles
            : undefined,
      })
    })

    // Step 4: Store brief and update meeting
    const brief = await step.run('store-brief', async () => {
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
          research_quality: enrichmentData.researchQuality,
        })
        .select()
        .single()

      if (briefError || !newBriefData) {
        throw new Error(`Failed to store brief: ${briefError?.message}`)
      }

      await supabase
        .from('meetings')
        .update({ brief_id: newBriefData.id, brief_status: 'ready' })
        .eq('id', meetingId)

      const { error: rpcError } = await supabase.rpc('increment_brief_count', { user_id_param: userId })
      if (rpcError) {
        const { data: currentUser } = await supabase
          .from('users')
          .select('briefs_generated_this_month')
          .eq('id', userId)
          .single()
        await supabase
          .from('users')
          .update({ briefs_generated_this_month: (currentUser?.briefs_generated_this_month ?? 0) + 1 })
          .eq('id', userId)
      }

      return newBriefData as Brief
    })

    // Step 5: Send email (non-fatal)
    await step.run('send-email', async () => {
      try {
        const updatedMeeting = { ...meeting, brief_id: brief.id, brief_status: 'ready' as const }
        await sendBriefEmail(userEmail, brief, updatedMeeting)
        await supabase
          .from('briefs')
          .update({ email_sent_at: new Date().toISOString() })
          .eq('id', brief.id)
      } catch (err) {
        console.warn('Failed to send brief email:', err)
        // Non-fatal — brief is still ready
      }
    })

    return { briefId: brief.id }
  }
)

import { inngest } from '@/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { render } from '@react-email/components'
import { Resend } from 'resend'
import Anthropic from '@anthropic-ai/sdk'
import { FollowUpEmail } from '@/emails/FollowUpEmail'
import type { Meeting, Brief } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Hourly cron: finds meetings that ended in the last 2 hours for Pro users
 * where a brief exists but no follow-up has been generated yet.
 * Generates an AI follow-up draft and emails it to the user.
 */
export const sendFollowUpEmailFn = inngest.createFunction(
  {
    id: 'send-followup-emails',
    name: 'Send Pro Follow-Up Email Drafts',
  },
  { cron: 'TZ=UTC 0 * * * *' }, // every hour at :00
  async ({ step }) => {
    const supabase = createAdminClient()

    // Find meetings that ended in the last 2 hours with a ready brief and no follow-up
    const eligibleMeetings = await step.run('find-eligible-meetings', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          briefs!inner(id, agenda, talking_points, icebreakers, followup_content),
          users!inner(email, plan)
        `)
        .eq('brief_status', 'ready')
        .gte('end_time', twoHoursAgo)
        .lte('end_time', now)
        .eq('users.plan', 'pro')
        .is('briefs.followup_content', null)

      if (error) throw new Error(`Failed to fetch eligible meetings: ${error.message}`)
      return data ?? []
    })

    if (eligibleMeetings.length === 0) return { processed: 0 }

    let processed = 0

    for (const row of eligibleMeetings) {
      await step.run(`followup-${row.id}`, async () => {
        const meeting = row as Meeting & { users: { email: string; plan: string }; briefs: Brief }
        const brief = meeting.briefs
        const userEmail = meeting.users.email

        // Generate follow-up draft via Claude
        const followupDraft = await generateFollowUpDraft(meeting, brief)

        // Store the draft
        await supabase
          .from('briefs')
          .update({
            followup_content: followupDraft,
            followup_generated_at: new Date().toISOString(),
          })
          .eq('id', brief.id)

        // Send notification email to the user
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://meetprep.app'
        const html = await render(
          FollowUpEmail({
            meetingTitle: meeting.title,
            meetingId: brief.id,
            followupDraft,
            appUrl,
          })
        )

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'briefs@meetprep.ai',
          to: userEmail,
          subject: `Follow-up draft ready: ${meeting.title}`,
          html,
        })

        processed++
      })
    }

    return { processed }
  }
)

async function generateFollowUpDraft(meeting: Meeting, brief: Brief): Promise<string> {
  const attendeeNames = meeting.attendees
    .map((a) => a.name ?? a.email)
    .join(', ')

  const agendaItems = (brief.agenda ?? []).slice(0, 3).join('; ')
  const talkingPoints = (brief.talking_points ?? []).slice(0, 3).join('; ')

  const prompt = `You are helping a professional write a brief follow-up email after a business meeting.

Meeting: "${meeting.title}"
Attendees: ${attendeeNames}
Topics covered (from agenda): ${agendaItems || 'General discussion'}
Key talking points: ${talkingPoints || 'None specified'}

Write a concise, professional follow-up email (150-200 words) that:
1. Thanks the attendees for their time
2. Briefly recaps 2-3 key points discussed
3. Outlines any clear next steps
4. Has a warm but professional closing

Write only the email body (no subject line). Use "Hi [Name]," as the greeting.
Do not use placeholders — write it as if ready to send.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected Claude response type')
  return content.text.trim()
}

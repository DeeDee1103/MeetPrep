import { Resend } from 'resend'
import { BriefEmail } from '@/emails/BriefEmail'
import type { Brief, Meeting } from '@/types'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendBriefEmail(
  to: string,
  brief: Brief,
  meeting: Meeting
): Promise<void> {
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'MeetPrep <briefs@meetprep.app>',
    to,
    subject: `Your brief for "${meeting.title}" is ready`,
    react: BriefEmail({ brief, meeting }),
  })

  if (error) {
    throw new Error(`Failed to send brief email: ${error.message}`)
  }
}

import { NextResponse, type NextRequest } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { inngest } from '@/inngest/client'
import type { Attendee } from '@/types'

/**
 * Calendly webhook payload (invitee.created event).
 * Docs: https://developer.calendly.com/api-docs/ZG9jOjM2MzE3MDgw-webhook-signatures
 */
interface CalendlyPayload {
  event: 'invitee.created' | 'invitee.canceled'
  time: string
  payload: {
    event_type: { name: string }
    event: {
      name: string
      start_time: string
      end_time: string
      location?: { join_url?: string; location?: string }
    }
    invitee: {
      name: string
      email: string
    }
    questions_and_answers: Array<{ question: string; answer: string }>
    tracking: { utm_content?: string } // utm_content = MeetPrep userId
  }
}

function verifyCalendlySignature(
  rawBody: string,
  signatureHeader: string | null,
  signingKey: string
): boolean {
  if (!signatureHeader) return false

  // Header format: "t=<timestamp>,v1=<signature>"
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => p.split('=') as [string, string])
  )
  const timestamp = parts['t']
  const receivedSig = parts['v1']
  if (!timestamp || !receivedSig) return false

  // Reject events older than 5 minutes
  const age = Date.now() - Number(timestamp) * 1000
  if (age > 5 * 60 * 1000) return false

  const expected = createHmac('sha256', signingKey)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(receivedSig, 'hex'))
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY
  if (!signingKey) {
    return NextResponse.json({ error: 'Calendly not configured' }, { status: 503 })
  }

  const rawBody = await request.text()
  const signatureHeader = request.headers.get('Calendly-Webhook-Signature')

  if (!verifyCalendlySignature(rawBody, signatureHeader, signingKey)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: CalendlyPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Only handle new bookings
  if (payload.event !== 'invitee.created') {
    return NextResponse.json({ ok: true, skipped: true })
  }

  // userId is passed via UTM content when generating the Calendly booking link
  const userId = payload.payload.tracking?.utm_content
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId in tracking.utm_content' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Verify the user exists and has Calendly (Pro) access
  const { data: user } = await supabase
    .from('users')
    .select('id, plan, email')
    .eq('id', userId)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (user.plan !== 'pro') {
    return NextResponse.json({ error: 'Calendly integration requires Pro plan' }, { status: 403 })
  }

  const { event: cal, invitee, event_type } = payload.payload

  const attendee: Attendee = {
    email: invitee.email,
    name: invitee.name,
    company: null,
    linkedin_url: null,
  }

  const meetingTitle = event_type.name || cal.name || 'Calendly Meeting'
  const googleEventId = `calendly-${invitee.email}-${cal.start_time}`

  const { data: upserted, error: upsertError } = await supabase
    .from('meetings')
    .upsert(
      {
        user_id: userId,
        google_event_id: googleEventId,
        title: meetingTitle,
        description: null,
        start_time: cal.start_time,
        end_time: cal.end_time,
        attendees: [attendee],
        location: cal.location?.location ?? null,
        meeting_link: cal.location?.join_url ?? null,
        brief_status: 'pending',
      },
      { onConflict: 'user_id,google_event_id' }
    )
    .select('id')
    .single()

  if (upsertError || !upserted) {
    console.error('Failed to upsert Calendly meeting:', upsertError)
    return NextResponse.json({ error: 'Failed to save meeting' }, { status: 500 })
  }

  // Dispatch Inngest event to generate brief in the background
  await inngest.send({
    name: 'meetprep/brief.requested',
    data: { meetingId: upserted.id, userId },
  })

  return NextResponse.json({ ok: true, meetingId: upserted.id })
}

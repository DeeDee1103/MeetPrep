import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUpcomingMeetings } from '@/lib/calendar'
import { inngest } from '@/inngest/client'
import type { User } from '@/types'

export async function POST(request: NextRequest) {
  // Google Calendar push notification headers
  const channelToken = request.headers.get('x-goog-channel-token')
  const resourceState = request.headers.get('x-goog-resource-state')

  // Ignore sync messages (initial notification)
  if (resourceState === 'sync') {
    return NextResponse.json({ ok: true })
  }

  if (!channelToken) {
    return NextResponse.json({ error: 'Missing channel token' }, { status: 400 })
  }

  const supabase = createClient()

  // channelToken is the userId stored when setting up the watch
  const { data: profile } = await supabase
    .from('users')
    .select('id, google_refresh_token, calendar_connected')
    .eq('id', channelToken)
    .single()

  const userProfile = profile as Pick<
    User,
    'id' | 'google_refresh_token' | 'calendar_connected'
  > | null

  if (!userProfile?.google_refresh_token || !userProfile.calendar_connected) {
    return NextResponse.json({ error: 'User not found or calendar not connected' }, { status: 404 })
  }

  try {
    const meetings = await getUpcomingMeetings(userProfile.google_refresh_token)
    const newMeetingIds: string[] = []

    for (const meeting of meetings) {
      const { data: existing } = await supabase
        .from('meetings')
        .select('id')
        .eq('user_id', userProfile.id)
        .eq('google_event_id', meeting.google_event_id)
        .single()

      const { data: upserted } = await supabase
        .from('meetings')
        .upsert(
          {
            user_id: userProfile.id,
            google_event_id: meeting.google_event_id,
            title: meeting.title,
            description: meeting.description,
            start_time: meeting.start_time,
            end_time: meeting.end_time,
            attendees: meeting.attendees,
            location: meeting.location,
            meeting_link: meeting.meeting_link,
          },
          { onConflict: 'user_id,google_event_id' }
        )
        .select('id')
        .single()

      // Trigger brief generation for new meetings
      if (!existing && upserted) {
        newMeetingIds.push(upserted.id)
      }
    }

    // Dispatch Inngest events for each new meeting (background jobs)
    if (newMeetingIds.length > 0) {
      await inngest.send(
        newMeetingIds.map((meetingId) => ({
          name: 'meetprep/brief.requested' as const,
          data: { meetingId, userId: userProfile.id },
        }))
      )
    }

    return NextResponse.json({ ok: true, new: newMeetingIds.length })
  } catch (error) {
    console.error('Calendar webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUpcomingMeetings } from '@/lib/calendar'
import type { User } from '@/types'

export async function POST() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('google_refresh_token, calendar_connected')
    .eq('id', user.id)
    .single()

  const userProfile = profile as Pick<User, 'google_refresh_token' | 'calendar_connected'> | null

  if (!userProfile?.calendar_connected || !userProfile.google_refresh_token) {
    return NextResponse.json(
      { error: 'Calendar not connected' },
      { status: 400 }
    )
  }

  try {
    const meetings = await getUpcomingMeetings(userProfile.google_refresh_token)

    let synced = 0
    for (const meeting of meetings) {
      const { error } = await supabase.from('meetings').upsert(
        {
          user_id: user.id,
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

      if (!error) synced++
    }

    return NextResponse.json({ synced })
  } catch (error) {
    console.error('Calendar sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync calendar' },
      { status: 500 }
    )
  }
}

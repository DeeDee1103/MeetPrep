import type { Meeting, Attendee } from '@/types'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

export function getGoogleAuthUrl(userId: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state: userId,
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeCodeForTokens(
  code: string
): Promise<{ access_token: string; refresh_token: string }> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange code for tokens: ${error}`)
  }

  const data = await response.json()
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  }
}

async function getAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to refresh access token: ${error}`)
  }

  const data = await response.json()
  return data.access_token
}

interface GoogleCalendarEvent {
  id: string
  summary?: string
  description?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  attendees?: Array<{
    email: string
    displayName?: string
    organizer?: boolean
  }>
  location?: string
  hangoutLink?: string
  conferenceData?: {
    entryPoints?: Array<{ uri?: string }>
  }
}

function parseMeetingLink(event: GoogleCalendarEvent): string | null {
  if (event.hangoutLink) return event.hangoutLink
  const entryPoints = event.conferenceData?.entryPoints
  if (entryPoints && entryPoints.length > 0) {
    return entryPoints[0].uri ?? null
  }
  return null
}

function parseAttendees(event: GoogleCalendarEvent): Attendee[] {
  if (!event.attendees) return []
  return event.attendees.map((a) => ({
    email: a.email,
    name: a.displayName ?? null,
    company: null,
    linkedin_url: null,
  }))
}

export async function getUpcomingMeetings(
  refreshToken: string
): Promise<Omit<Meeting, 'id' | 'user_id' | 'brief_id' | 'brief_status' | 'created_at'>[]> {
  const accessToken = await getAccessToken(refreshToken)

  const now = new Date().toISOString()
  const sevenDaysLater = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toISOString()

  const params = new URLSearchParams({
    timeMin: now,
    timeMax: sevenDaysLater,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  })

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch calendar events: ${error}`)
  }

  const data = await response.json()
  const events: GoogleCalendarEvent[] = data.items ?? []

  return events
    .filter(
      (e) =>
        e.summary &&
        (e.start?.dateTime || e.start?.date) &&
        (e.attendees?.length ?? 0) > 1
    )
    .map((e) => ({
      google_event_id: e.id,
      title: e.summary ?? 'Untitled Meeting',
      description: e.description ?? null,
      start_time: e.start?.dateTime ?? e.start?.date ?? new Date().toISOString(),
      end_time: e.end?.dateTime ?? e.end?.date ?? new Date().toISOString(),
      attendees: parseAttendees(e),
      location: e.location ?? null,
      meeting_link: parseMeetingLink(e),
    }))
}

export async function setupCalendarWatch(
  refreshToken: string,
  userId: string
): Promise<void> {
  try {
    const accessToken = await getAccessToken(refreshToken)
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/calendar`

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events/watch',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: `meetprep-${userId}-${Date.now()}`,
          type: 'web_hook',
          address: webhookUrl,
          token: userId,
          expiration: String(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.warn(`Failed to set up calendar watch: ${error}`)
    }
  } catch (error) {
    console.warn('Failed to set up calendar watch:', error)
  }
}

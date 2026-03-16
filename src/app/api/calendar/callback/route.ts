import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens, setupCalendarWatch } from '@/lib/calendar'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('state')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (!code || !userId) {
    return NextResponse.redirect(`${appUrl}/settings?error=missing_params`)
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== userId) {
    return NextResponse.redirect(`${appUrl}/login`)
  }

  try {
    const { refresh_token } = await exchangeCodeForTokens(code)

    // Store refresh token and mark calendar as connected
    const { error } = await supabase
      .from('users')
      .update({
        google_refresh_token: refresh_token,
        calendar_connected: true,
      })
      .eq('id', user.id)

    if (error) {
      console.error('Failed to store refresh token:', error)
      return NextResponse.redirect(`${appUrl}/settings?error=db_error`)
    }

    // Set up calendar push notifications (non-fatal)
    await setupCalendarWatch(refresh_token, user.id)

    // Trigger demo brief immediately — this is the activation moment (fire and forget)
    fetch(`${appUrl}/api/briefs/demo`, {
      method: 'POST',
      headers: {
        // Forward the user's session cookie so the demo endpoint can auth
        cookie: request.headers.get('cookie') ?? '',
      },
    }).catch((err) => console.error('Demo brief trigger failed:', err))

    return NextResponse.redirect(`${appUrl}/dashboard?calendar=connected`)
  } catch (error) {
    console.error('Calendar callback error:', error)
    return NextResponse.redirect(`${appUrl}/settings?error=oauth_error`)
  }
}

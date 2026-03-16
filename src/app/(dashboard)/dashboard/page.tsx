import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MeetingList } from '@/components/meetings/MeetingList'
import { BriefCard } from '@/components/briefs/BriefCard'
import { SyncButtonClient } from './SyncButton'
import type { Meeting, Brief, User } from '@/types'

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const userProfile = profile as User | null

  // Fetch upcoming meetings
  const { data: meetingsData } = await supabase
    .from('meetings')
    .select('*')
    .eq('user_id', user.id)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(20)

  const meetings = (meetingsData ?? []) as Meeting[]

  // Fetch most recent ready brief to show as sample
  const { data: demoBriefData } = await supabase
    .from('briefs')
    .select('*, meetings(*)')
    .eq('user_id', user.id)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single()

  const isDemoMode = process.env.DEMO_MODE === 'true'
  const calendarConnected = userProfile?.calendar_connected ?? false

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Demo mode banner */}
      {isDemoMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-yellow-500 text-lg flex-shrink-0">⚡</span>
          <div>
            <p className="text-sm font-semibold text-yellow-800">Demo Mode Active</p>
            <p className="text-sm text-yellow-700 mt-0.5">
              You&apos;re running MeetPrep in demo mode. Data is simulated and no emails will be sent.
            </p>
          </div>
        </div>
      )}

      {/* Calendar connection banner */}
      {!calendarConnected && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="h-5 w-5 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-indigo-900">Connect Google Calendar</p>
              <p className="text-sm text-indigo-700 mt-0.5">
                Sync your meetings automatically and get AI briefs before every call.
              </p>
            </div>
          </div>
          <Link
            href="/api/calendar/connect"
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Connect Calendar
          </Link>
        </div>
      )}

      {/* Demo/latest brief highlight */}
      {demoBriefData && demoBriefData.meetings && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Latest Brief
          </h2>
          <BriefCard
            brief={demoBriefData as Brief}
            meeting={demoBriefData.meetings as Meeting}
          />
        </div>
      )}

      {/* Meetings section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Meetings</h2>
          {calendarConnected && <SyncButtonClient />}
        </div>
        <MeetingList meetings={meetings} />
      </div>
    </div>
  )
}

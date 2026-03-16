import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BriefViewer } from '@/components/briefs/BriefViewer'
import type { Brief, Meeting } from '@/types'

interface BriefPageProps {
  params: { id: string }
}

// Publicly accessible brief viewer — no auth required (share by link)
export default async function PublicBriefPage({ params }: BriefPageProps) {
  const supabase = createClient()

  const { data: briefData } = await supabase
    .from('briefs')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!briefData) {
    notFound()
  }

  const brief = briefData as Brief

  const { data: meetingData } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', brief.meeting_id)
    .single()

  if (!meetingData) {
    notFound()
  }

  const meeting = meetingData as Meeting
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://meetprep.app'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <BriefViewer brief={brief} meeting={meeting} />
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Powered by{' '}
            <a
              href={`${appUrl}?ref=brief`}
              className="text-indigo-500 hover:text-indigo-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              MeetPrep
            </a>{' '}
            · AI-powered meeting preparation
          </p>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: BriefPageProps) {
  const supabase = createClient()
  const { data: brief } = await supabase
    .from('briefs')
    .select('meeting_id')
    .eq('id', params.id)
    .single()

  if (!brief) return { title: 'Brief Not Found' }

  const { data: meeting } = await supabase
    .from('meetings')
    .select('title')
    .eq('id', brief.meeting_id)
    .single()

  return {
    title: meeting ? `Brief: ${meeting.title} – MeetPrep` : 'Brief – MeetPrep',
  }
}

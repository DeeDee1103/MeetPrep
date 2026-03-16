import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Brief, Meeting } from '@/types'

interface RouteContext {
  params: { id: string }
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const supabase = createClient()

  // Public read — RLS policy allows SELECT by ID without auth
  const { data: briefData } = await supabase
    .from('briefs')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!briefData) {
    return NextResponse.json({ error: 'Brief not found' }, { status: 404 })
  }

  const brief = briefData as Brief

  const { data: meetingData } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', brief.meeting_id)
    .single()

  return NextResponse.json({
    brief,
    meeting: meetingData as Meeting | null,
  })
}

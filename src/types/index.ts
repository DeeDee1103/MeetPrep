export type User = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan: 'free' | 'starter' | 'pro'
  briefs_generated_this_month: number
  calendar_connected: boolean
  google_refresh_token: string | null
  created_at: string
}

export type Meeting = {
  id: string
  user_id: string
  google_event_id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  attendees: Attendee[]
  location: string | null
  meeting_link: string | null
  brief_id: string | null
  brief_status: 'pending' | 'generating' | 'ready' | 'failed'
  created_at: string
}

export type Attendee = {
  email: string
  name: string | null
  company: string | null
  linkedin_url: string | null
}

export type Brief = {
  id: string
  meeting_id: string
  user_id: string
  agenda: string[]
  talking_points: string[]
  company_snapshot: CompanySnapshot | null
  icebreakers: string[]
  risk_flags: string[]
  attendee_summaries: AttendeeSummary[]
  research_quality: 'full' | 'limited' | 'minimal'
  generated_at: string
  email_sent_at: string | null
}

export type CompanySnapshot = {
  name: string
  description: string
  industry: string | null
  employee_count: string | null
  logo_url: string | null
  recent_news: string[]
}

export type AttendeeSummary = {
  email: string
  name: string | null
  role: string | null
  company: string | null
  linkedin_summary: string | null
}

export type Plan = {
  id: 'free' | 'starter' | 'pro'
  name: string
  price: number
  briefs_per_month: number | null
  features: string[]
}

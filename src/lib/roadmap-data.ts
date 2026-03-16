export type Status = 'live' | 'in-progress' | 'planned' | 'future'
export type Category =
  | 'ai'
  | 'calendar'
  | 'email'
  | 'billing'
  | 'research'
  | 'ui'
  | 'integrations'

export interface Feature {
  id: string
  title: string
  description: string
  detail: string
  status: Status
  category: Category
  icon: string
}

export const STATUS_CONFIG: Record<
  Status,
  { label: string; color: string; dot: string; bg: string }
> = {
  live: {
    label: 'Live',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50 border-emerald-200',
  },
  'in-progress': {
    label: 'In Progress',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    bg: 'bg-blue-50 border-blue-200',
  },
  planned: {
    label: 'Planned',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50 border-amber-200',
  },
  future: {
    label: 'Future',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    dot: 'bg-purple-400',
    bg: 'bg-purple-50 border-purple-200',
  },
}

export const CATEGORY_CONFIG: Record<Category, { label: string; color: string }> =
  {
    ai: { label: 'AI', color: 'bg-violet-100 text-violet-700' },
    calendar: { label: 'Calendar', color: 'bg-sky-100 text-sky-700' },
    email: { label: 'Email', color: 'bg-pink-100 text-pink-700' },
    billing: { label: 'Billing', color: 'bg-orange-100 text-orange-700' },
    research: { label: 'Research', color: 'bg-teal-100 text-teal-700' },
    ui: { label: 'UI/UX', color: 'bg-indigo-100 text-indigo-700' },
    integrations: { label: 'Integrations', color: 'bg-rose-100 text-rose-700' },
  }

export const ALL_STATUSES: Status[] = ['live', 'in-progress', 'planned', 'future']
export const ALL_CATEGORIES: Category[] = [
  'ai',
  'calendar',
  'email',
  'billing',
  'research',
  'ui',
  'integrations',
]

export const FEATURES: Feature[] = [
  // ── Live ────────────────────────────────────────────────────────────────────
  {
    id: 'brief-generation',
    title: 'AI Brief Generation',
    description: 'Claude Sonnet generates structured meeting briefs from research data.',
    detail:
      'Uses Anthropic Claude Sonnet to create JSON-structured briefs with company snapshot, attendee role, agenda items, talking points, icebreakers, and risk flags. Gracefully degrades to "minimal" quality when enrichment data is unavailable.',
    status: 'live',
    category: 'ai',
    icon: '🤖',
  },
  {
    id: 'google-calendar',
    title: 'Google Calendar Integration',
    description: 'OAuth connection that syncs upcoming meetings automatically.',
    detail:
      "One-click Google OAuth connects the user's calendar. New booking events trigger the research pipeline via webhook, extracting attendee name, email, meeting title, and time.",
    status: 'live',
    category: 'calendar',
    icon: '📅',
  },
  {
    id: 'clearbit-enrichment',
    title: 'Company Enrichment (Clearbit)',
    description: 'Instant company snapshots from attendee email domains.',
    detail:
      "Clearbit lookup provides industry, company size, and description from the attendee's email domain. Falls back gracefully for personal email addresses (Gmail, Hotmail, etc.) with a 'Limited info' label.",
    status: 'live',
    category: 'research',
    icon: '🏢',
  },
  {
    id: 'proxycurl-linkedin',
    title: 'LinkedIn Enrichment (ProxyCurl)',
    description: 'Professional summaries via ProxyCurl — no direct LinkedIn scraping.',
    detail:
      "ProxyCurl API provides LinkedIn profile summaries at ~$0.01 per lookup. Fetches role, background, and recent activity without violating LinkedIn's terms of service.",
    status: 'live',
    category: 'research',
    icon: '🔗',
  },
  {
    id: 'email-delivery',
    title: 'Email Brief Delivery',
    description: 'Beautiful HTML briefs delivered 1 hour before every meeting.',
    detail:
      'Resend + React Email templates send a formatted brief 1 hour before the meeting. Every email includes a "Powered by MeetPrep" footer with a referral link for organic distribution.',
    status: 'live',
    category: 'email',
    icon: '✉️',
  },
  {
    id: 'brief-viewer',
    title: 'Brief Viewer (/briefs/[id])',
    description: 'Public brief page shareable with colleagues.',
    detail:
      'Each brief has a publicly accessible URL at /briefs/[id] — no auth required — so users can share their AI-generated prep with colleagues or managers before a call.',
    status: 'live',
    category: 'ui',
    icon: '📄',
  },
  {
    id: 'stripe-billing',
    title: 'Stripe Billing',
    description: 'Starter ($15), Pro ($29), and Team ($19/seat) plans with usage limits.',
    detail:
      'Stripe powers subscription management with three tiers. Brief generation is blocked when plan limits are reached, and users see an upgrade prompt. Usage is tracked via briefs_generated per billing period.',
    status: 'live',
    category: 'billing',
    icon: '💳',
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Central hub to view upcoming meetings and generated briefs.',
    detail:
      'The dashboard lists upcoming meetings, highlights the latest AI brief, shows calendar connection status, and provides a sync button. Demo mode banner is available during development.',
    status: 'live',
    category: 'ui',
    icon: '🖥️',
  },
  {
    id: 'demo-brief',
    title: 'Demo Brief on Signup',
    description: 'Instant activation brief generated on first calendar connection.',
    detail:
      'Immediately after a user connects their calendar, a sample brief is generated using a hardcoded "Demo call with Stripe" meeting. This is the critical activation moment — users see value without waiting for a real meeting.',
    status: 'live',
    category: 'ai',
    icon: '⚡',
  },
  {
    id: 'talking-points',
    title: 'Talking Points & Agenda',
    description: 'Five tailored talking points and an AI-predicted agenda per meeting.',
    detail:
      'Claude generates five meeting-specific talking points and predicts the likely agenda based on the meeting title, attendee roles, and company context.',
    status: 'live',
    category: 'ai',
    icon: '💬',
  },
  {
    id: 'icebreakers',
    title: 'Icebreakers & Risk Flags',
    description: 'Conversation starters and potential concerns surfaced automatically.',
    detail:
      'Two natural icebreakers open the meeting on a warm note. Risk flags surface red flags (e.g., recent layoffs, competitor partnerships) so users walk in with eyes open.',
    status: 'live',
    category: 'ai',
    icon: '🤝',
  },
  // ── In Progress ─────────────────────────────────────────────────────────────
  {
    id: 'calendly-webhooks',
    title: 'Calendly Webhook Support',
    description: 'Receive new booking events directly from Calendly.',
    detail:
      "Calendly webhooks are a secondary integration path — Calendly's free tier has limits, but Pro users benefit from the tighter Calendly workflow. Signing key validation is already in place.",
    status: 'in-progress',
    category: 'calendar',
    icon: '🗓️',
  },
  {
    id: 'news-lookup',
    title: 'Company News Lookup',
    description: 'Recent press coverage surfaced via Bing News or Perplexity API.',
    detail:
      "Fetches recent news articles about the attendee's company to surface in the brief. Helps flag M&A activity, funding rounds, or negative press before the meeting.",
    status: 'in-progress',
    category: 'research',
    icon: '📰',
  },
  // ── Planned ─────────────────────────────────────────────────────────────────
  {
    id: 'follow-up-drafts',
    title: 'AI Follow-up Email Drafts',
    description: 'Claude drafts a follow-up email after the meeting time passes (Pro).',
    detail:
      'Once the meeting time passes, a background job triggers Claude to draft a personalized follow-up email based on the brief content and any notes the user adds. Available on Pro plan only.',
    status: 'planned',
    category: 'ai',
    icon: '📬',
  },
  {
    id: 'custom-prompts',
    title: 'Custom Brief Prompts',
    description: 'Pro users can customize the AI instructions for their briefs.',
    detail:
      'Pro users can provide custom system prompts and adjust the output format of their briefs — for example, focusing more on technical details for engineering-led sales or adding a specific CTA section.',
    status: 'planned',
    category: 'ai',
    icon: '🎛️',
  },
  {
    id: 'slack-integration',
    title: 'Slack Integration',
    description: 'Receive brief summaries directly in Slack before meetings.',
    detail:
      "Deliver a condensed brief summary to the user's chosen Slack channel 1 hour before the meeting, alongside the full email. Configured via the Settings page.",
    status: 'planned',
    category: 'integrations',
    icon: '💬',
  },
  // ── Future ──────────────────────────────────────────────────────────────────
  {
    id: 'team-dashboard',
    title: 'Team Dashboard',
    description: 'Shared workspace for teams with admin controls and analytics.',
    detail:
      "Team plan unlocks a shared dashboard where admins can see all team members' meetings, briefs, and usage stats. Includes role-based access controls and team-level settings.",
    status: 'future',
    category: 'ui',
    icon: '👥',
  },
  {
    id: 'crm-sync',
    title: 'CRM Sync (Salesforce / HubSpot)',
    description: 'Push brief data back into your CRM after each meeting.',
    detail:
      'After a meeting, automatically sync the attendee data, brief summary, and any follow-up actions back to Salesforce or HubSpot. Removes double-entry for sales teams.',
    status: 'future',
    category: 'integrations',
    icon: '🔄',
  },
  {
    id: 'referral-program',
    title: 'Referral Program',
    description: 'Built-in referral loop powered by the brief email footer.',
    detail:
      'Every brief email footer includes a personalized referral link. A formal referral dashboard lets users track conversions and earn free brief credits for each new signup.',
    status: 'future',
    category: 'billing',
    icon: '🎁',
  },
  {
    id: 'mobile-app',
    title: 'Mobile App (iOS / Android)',
    description: 'Read briefs and get push notifications on the go.',
    detail:
      'A native mobile app delivering push notifications 1 hour before meetings. Users can review briefs, add quick notes, and trigger the follow-up email draft directly from their phone.',
    status: 'future',
    category: 'ui',
    icon: '📱',
  },
  {
    id: 'meeting-notes',
    title: 'In-Meeting Notes & Recap',
    description: 'Capture notes during the call and auto-generate a meeting recap.',
    detail:
      'A lightweight note-taking overlay lets users jot down key points during the meeting. After the call, Claude turns those notes into a structured recap with action items and decision log.',
    status: 'future',
    category: 'ai',
    icon: '📝',
  },
]

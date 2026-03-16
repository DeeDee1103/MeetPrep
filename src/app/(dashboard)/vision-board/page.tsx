'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

type Status = 'live' | 'in-progress' | 'planned' | 'future'
type Category = 'ai' | 'calendar' | 'email' | 'billing' | 'research' | 'ui' | 'integrations'

interface Feature {
  id: string
  title: string
  description: string
  detail: string
  status: Status
  category: Category
  icon: string
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; dot: string }> = {
  live: {
    label: 'Live',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  'in-progress': {
    label: 'In Progress',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  planned: {
    label: 'Planned',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  future: {
    label: 'Future',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    dot: 'bg-purple-400',
  },
}

const CATEGORY_CONFIG: Record<Category, { label: string; color: string }> = {
  ai: { label: 'AI', color: 'bg-violet-100 text-violet-700' },
  calendar: { label: 'Calendar', color: 'bg-sky-100 text-sky-700' },
  email: { label: 'Email', color: 'bg-pink-100 text-pink-700' },
  billing: { label: 'Billing', color: 'bg-orange-100 text-orange-700' },
  research: { label: 'Research', color: 'bg-teal-100 text-teal-700' },
  ui: { label: 'UI/UX', color: 'bg-indigo-100 text-indigo-700' },
  integrations: { label: 'Integrations', color: 'bg-rose-100 text-rose-700' },
}

const FEATURES: Feature[] = [
  // Live features
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
      'One-click Google OAuth connects the user's calendar. New booking events trigger the research pipeline via webhook, extracting attendee name, email, meeting title, and time.',
    status: 'live',
    category: 'calendar',
    icon: '📅',
  },
  {
    id: 'clearbit-enrichment',
    title: 'Company Enrichment (Clearbit)',
    description: 'Instant company snapshots from attendee email domains.',
    detail:
      'Clearbit lookup provides industry, company size, and description from the attendee's email domain. Falls back gracefully for personal email addresses (Gmail, Hotmail, etc.) with a "Limited info" label.',
    status: 'live',
    category: 'research',
    icon: '🏢',
  },
  {
    id: 'proxycurl-linkedin',
    title: 'LinkedIn Enrichment (ProxyCurl)',
    description: 'Professional summaries via ProxyCurl — no direct LinkedIn scraping.',
    detail:
      'ProxyCurl API provides LinkedIn profile summaries at ~$0.01 per lookup. Fetches role, background, and recent activity without violating LinkedIn's terms of service.',
    status: 'live',
    category: 'research',
    icon: '🔗',
  },
  {
    id: 'email-delivery',
    title: 'Email Brief Delivery',
    description: 'Beautiful HTML briefs delivered 1 hour before every meeting.',
    detail:
      'Resend + React Email templates send a formatted brief 1 hour before the meeting. Every email includes an "MeetPrep" footer with a referral link for organic distribution.',
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
      'The dashboard lists upcoming meetings, highlights the latest AI brief, shows calendar connection status, and provides a sync button. Demo mode banner helps during development.',
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
  // In Progress
  {
    id: 'calendly-webhooks',
    title: 'Calendly Webhook Support',
    description: 'Receive new booking events directly from Calendly.',
    detail:
      'Calendly webhooks are a secondary integration path — Calendly's free tier has limits, but Pro users benefit from the tighter Calendly workflow. Signing key validation is already in place.',
    status: 'in-progress',
    category: 'calendar',
    icon: '🗓️',
  },
  {
    id: 'news-lookup',
    title: 'Company News Lookup',
    description: 'Recent press coverage surfaced via Bing News or Perplexity API.',
    detail:
      'Fetches recent news articles about the attendee's company to surface in the brief. Helps flag M&A activity, funding rounds, or negative press before the meeting.',
    status: 'in-progress',
    category: 'research',
    icon: '📰',
  },
  // Planned
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
      'Deliver a condensed brief summary to the user's chosen Slack channel 1 hour before the meeting, alongside the full email. Configured via the Settings page.',
    status: 'planned',
    category: 'integrations',
    icon: '💬',
  },
  // Future
  {
    id: 'team-dashboard',
    title: 'Team Dashboard',
    description: 'Shared workspace for teams with admin controls and analytics.',
    detail:
      'Team plan unlocks a shared dashboard where admins can see all team members' meetings, briefs, and usage stats. Includes role-based access controls and team-level settings.',
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

const ALL_STATUSES: Status[] = ['live', 'in-progress', 'planned', 'future']
const ALL_CATEGORIES: Category[] = ['ai', 'calendar', 'email', 'billing', 'research', 'ui', 'integrations']

export default function VisionBoardPage() {
  const [selectedStatuses, setSelectedStatuses] = useState<Set<Status>>(new Set(ALL_STATUSES))
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(new Set(ALL_CATEGORIES))
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  function toggleStatus(status: Status) {
    setSelectedStatuses((prev) => {
      const next = new Set(prev)
      if (next.has(status)) {
        if (next.size === 1) return prev // keep at least one
        next.delete(status)
      } else {
        next.add(status)
      }
      return next
    })
  }

  function toggleCategory(category: Category) {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        if (next.size === 1) return prev
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  function resetFilters() {
    setSelectedStatuses(new Set(ALL_STATUSES))
    setSelectedCategories(new Set(ALL_CATEGORIES))
    setSearchQuery('')
  }

  const filteredFeatures = FEATURES.filter((f) => {
    if (!selectedStatuses.has(f.status)) return false
    if (!selectedCategories.has(f.category)) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      if (!f.title.toLowerCase().includes(q) && !f.description.toLowerCase().includes(q)) return false
    }
    return true
  })

  const countByStatus = (status: Status) =>
    FEATURES.filter((f) => f.status === status && selectedCategories.has(f.category)).length

  const isFiltered =
    selectedStatuses.size < ALL_STATUSES.length ||
    selectedCategories.size < ALL_CATEGORIES.length ||
    searchQuery.trim().length > 0

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vision Board</h1>
        <p className="text-gray-500 mt-1">
          Track current features, work in progress, and the product roadmap ahead.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {ALL_STATUSES.map((status) => {
          const cfg = STATUS_CONFIG[status]
          const count = FEATURES.filter((f) => f.status === status).length
          return (
            <button
              key={status}
              onClick={() => {
                setSelectedStatuses(new Set([status]))
                setSelectedCategories(new Set(ALL_CATEGORIES))
                setSearchQuery('')
              }}
              className={cn(
                'bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400',
                selectedStatuses.has(status) && selectedStatuses.size === 1
                  ? 'ring-2 ring-indigo-400 border-indigo-300'
                  : 'border-gray-200'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={cn('w-2.5 h-2.5 rounded-full', cfg.dot)} />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {cfg.label}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-xs text-gray-400">features</div>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search features…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          {/* Status filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status:</span>
            {ALL_STATUSES.map((status) => {
              const cfg = STATUS_CONFIG[status]
              const active = selectedStatuses.has(status)
              return (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all',
                    active ? cfg.color : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                  )}
                >
                  <span className={cn('w-1.5 h-1.5 rounded-full', active ? cfg.dot : 'bg-gray-300')} />
                  {cfg.label} ({countByStatus(status)})
                </button>
              )
            })}
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category:</span>
            {ALL_CATEGORIES.map((cat) => {
              const cfg = CATEGORY_CONFIG[cat]
              const active = selectedCategories.has(cat)
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-all border',
                    active ? cn(cfg.color, 'border-transparent') : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                  )}
                >
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>

        {isFiltered && (
          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing <span className="font-semibold text-gray-700">{filteredFeatures.length}</span> of{' '}
              {FEATURES.length} features
            </p>
            <button
              onClick={resetFilters}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Board columns */}
      {filteredFeatures.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-lg font-medium text-gray-500">No features match your filters</p>
          <button onClick={resetFilters} className="mt-3 text-sm text-indigo-600 hover:underline">
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ALL_STATUSES.map((status) => {
            const cfg = STATUS_CONFIG[status]
            const columnFeatures = filteredFeatures.filter((f) => f.status === status)
            if (columnFeatures.length === 0) return null
            return (
              <div key={status} className="flex flex-col gap-3">
                {/* Column header */}
                <div className="flex items-center gap-2">
                  <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', cfg.dot)} />
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{cfg.label}</h2>
                  <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                    {columnFeatures.length}
                  </span>
                </div>

                {/* Feature cards */}
                {columnFeatures.map((feature) => {
                  const isExpanded = expandedId === feature.id
                  const catCfg = CATEGORY_CONFIG[feature.category]
                  return (
                    <button
                      key={feature.id}
                      onClick={() => setExpandedId(isExpanded ? null : feature.id)}
                      className={cn(
                        'w-full text-left bg-white rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400',
                        isExpanded
                          ? 'border-indigo-300 shadow-md shadow-indigo-50'
                          : 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
                      )}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="text-2xl leading-none">{feature.icon}</div>
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
                              catCfg.color
                            )}
                          >
                            {catCfg.label}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">{feature.title}</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">{feature.description}</p>

                        {/* Expand/collapse indicator */}
                        <div
                          className={cn(
                            'mt-3 flex items-center gap-1 text-xs font-medium transition-colors',
                            isExpanded ? 'text-indigo-600' : 'text-gray-400'
                          )}
                        >
                          <svg
                            className={cn('h-3 w-3 transition-transform', isExpanded && 'rotate-180')}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                          {isExpanded ? 'Show less' : 'Learn more'}
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-600 leading-relaxed">{feature.detail}</p>
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

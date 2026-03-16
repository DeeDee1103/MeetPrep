# MeetPrep — Claude Code Project Context

## What This Project Is

MeetPrep is an AI-powered meeting prep SaaS. When someone books a meeting with the user, the app automatically researches the attendee's company, LinkedIn profile, and recent news, then generates a custom prep brief (agenda, talking points, icebreakers, risk flags) and delivers it via email before the call. Calendly/Google Calendar handle scheduling — MeetPrep owns the intelligence layer.

**Target users:** B2B sales reps, consultants, recruiters
**Pricing:** Starter $15/mo (20 briefs), Pro $29/mo (unlimited), Team $19/seat/mo

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Auth | NextAuth.js + Supabase Auth |
| Database | Postgres via Supabase |
| Background jobs | Inngest or Trigger.dev |
| Email sending | Resend + React Email templates |
| Billing | Stripe |
| AI (brief generation) | Anthropic Claude Sonnet API |
| Company enrichment | Clearbit (start) → People Data Labs (scale) |
| LinkedIn data | ProxyCurl via RapidAPI (~$0.01/lookup) |
| News lookup | Bing News API or Perplexity API |
| Calendar integration | Google Calendar API + Calendly webhooks |
| Deployment | Vercel + Supabase |

---

## Database Schema

Three core tables:

- **users** — auth, plan tier, briefs_generated count this month
- **meetings** — attendee name, email, meeting title, scheduled time, calendar source
- **briefs** — meeting_id, company snapshot, agenda items, talking points, icebreakers, risk flags, delivered_at

---

## Core User Flow

1. User connects Google Calendar or Calendly via OAuth
2. New booking event received via webhook → extract attendee name, email, meeting title, time
3. Research pipeline fires (background job):
   - Clearbit enrichment from email domain
   - ProxyCurl LinkedIn summary
   - Bing News recent company coverage
4. Claude Sonnet generates structured brief from all research context
5. HTML email delivered via Resend 1 hour before meeting
6. Brief also viewable in app at `/briefs/[id]`
7. After meeting time passes → AI drafts follow-up email (Pro feature)

---

## Key API Endpoints

- `POST /api/webhooks/calendar` — receives new meeting events from Google/Calendly
- `GET /api/briefs/[id]` — fetch brief by ID
- `POST /api/briefs/demo` — generate demo brief on signup (DEMO_MODE)
- `POST /api/stripe/webhook` — Stripe billing events

---

## Brief Structure (Claude Output Format)

Each brief should be structured JSON with these fields:

```json
{
  "company_snapshot": "2-3 sentence overview",
  "attendee_role": "title and background",
  "agenda_items": ["item 1", "item 2", "item 3"],
  "talking_points": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "icebreakers": ["opener 1", "opener 2"],
  "risk_flags": ["e.g. company had layoffs last month"],
  "research_quality": "full | limited | minimal"
}
```

If enrichment fails (Gmail/Hotmail address, no company data), set `research_quality: "minimal"` and generate the brief from name + meeting title alone. Never fail silently — always produce a brief.

---

## Build Timeline

| Week | Focus |
|---|---|
| 1 | Google OAuth, Calendly webhook, DB schema, dashboard shell |
| 2 | Research pipeline (Clearbit → ProxyCurl → News → Claude brief) |
| 3 | React Email template, Resend delivery, brief viewer UI, settings page |
| 4 | Stripe billing, usage limits, onboarding demo brief, Product Hunt launch |

---

## Pricing & Usage Limits

| Plan | Price | Brief limit | Features |
|---|---|---|---|
| Starter | $15/mo | 20/month | Google Calendar, email delivery, company snapshot |
| Pro | $29/mo | Unlimited | + Calendly, Slack, LinkedIn enrichment, follow-up drafts, custom prompts |
| Team | $19/seat/mo | Unlimited | + Team dashboard, admin controls, CRM sync (roadmap) |

Block brief generation at plan limits and show an upgrade prompt. Track `briefs_generated` per user per billing period in the users table.

---

## Critical Implementation Notes

**LinkedIn data:** Never scrape LinkedIn directly — use ProxyCurl from day one. Budget ~$0.01 per lookup.

**Enrichment failures:** If the attendee email is a personal address (Gmail, Hotmail, etc.), enrichment will fail. Build graceful fallback: generate brief from meeting title + name, clearly label it "Limited info — personal email detected."

**Demo brief on signup:** Immediately after a user connects their calendar, generate a sample brief using a hardcoded "Demo call with Stripe" meeting. This is the activation moment — don't make users wait for a real meeting.

**Calendar priority:** Treat Google Calendar as the primary integration. Calendly webhooks are a secondary option — Calendly's free tier has limits and adds a third-party dependency.

**Email footer:** Every brief email should include "Powered by MeetPrep" with a referral link. The brief itself is the distribution channel.

**AI cost:** Claude Sonnet costs ~$0.08 per brief at current rates. Gross margin at scale is ~82%.

---

## Environment Variables Required

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Calendly
CALENDLY_WEBHOOK_SIGNING_KEY=

# Enrichment
CLEARBIT_API_KEY=
PROXYCURL_API_KEY=
BING_NEWS_API_KEY=

# AI
ANTHROPIC_API_KEY=

# Email
RESEND_API_KEY=

# Billing
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_STARTER_PRICE_ID=
STRIPE_PRO_PRICE_ID=

# Feature flags
DEMO_MODE=true
```

---

## Go-to-Market (First 100 Users)

- **Week 1:** Post in Sales Hackers Slack, Reddit r/sales, LinkedIn with a real sample brief
- **Week 2:** Cold DM 50 SDRs at Series A/B startups — offer 3-month free Pro for feedback
- **Week 3:** Product Hunt launch (Tuesday/Wednesday). Lead with "AI meeting prep" not "Calendly alternative"
- **Month 2:** Referral loop via brief email footer

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| LinkedIn blocking | Use ProxyCurl API from day one, never scrape |
| Brief quality when enrichment fails | Graceful fallback brief, labeled "limited info" |
| Calendly API limits | Default to Google Calendar as primary source |
| Activation drop-off | Demo brief fires immediately on signup |

---

## Developer Notes

- Run `/init` at the start of each Claude Code session to load this file
- Use `DEMO_MODE=true` locally to bypass real calendar events during development
- Each background job step should be logged individually so failures are easy to diagnose
- The brief viewer at `/briefs/[id]` should be publicly accessible (no auth required) so users can share briefs with colleagues

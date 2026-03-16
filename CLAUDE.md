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
| Auth | Supabase Auth (email + Google OAuth) |
| Database | Postgres via Supabase |
| Background jobs | Inngest (see above row) |
| Email sending | Resend + React Email templates |
| Billing | Stripe |
| AI (brief generation) | Anthropic Claude Sonnet API (claude-sonnet-4-6) |
| Company enrichment | Clearbit → People Data Labs (scale) |
| LinkedIn data | ProxyCurl via RapidAPI (~$0.01/lookup) |
| News lookup | Bing News API |
| Background jobs | Inngest (brief generation, follow-up email cron, monthly reset cron) |
| Calendar integration | Google Calendar API (primary); Calendly webhooks (Pro — `POST /api/webhooks/calendly`) |
| Deployment | Vercel + Supabase |

---

## Database Schema

Three core tables:

- **users** — auth, plan tier, briefs_generated count this month
- **meetings** — attendee name, email, meeting title, scheduled time, calendar source
- **briefs** — meeting_id, company snapshot, agenda items, talking points, icebreakers, risk flags, delivered_at

---

## Core User Flow

1. User connects Google Calendar via OAuth
2. New booking event received via Google Calendar push notification → extract attendee name, email, meeting title, time
3. Research pipeline fires (currently inline; moving to Inngest background jobs):
   - Clearbit enrichment from email domain
   - ProxyCurl LinkedIn summary
   - Bing News recent company coverage
4. Claude Sonnet generates structured brief from all research context
5. HTML email delivered via Resend 1 hour before meeting
6. Brief also viewable in app at `/briefs/[id]`
7. After meeting time passes → Inngest cron generates AI follow-up draft + emails user (Pro feature)

---

## Key API Endpoints

- `POST /api/webhooks/calendar` — receives Google Calendar push notifications; dispatches `meetprep/brief.requested` Inngest event
- `POST /api/webhooks/calendly` — receives Calendly `invitee.created` events (Pro); verifies HMAC signature; dispatches Inngest event
- `POST /api/webhooks/stripe` — Stripe billing events
- `GET/POST/PUT /api/inngest` — Inngest serve endpoint (background job runner)
- `GET /api/briefs/[id]` — fetch brief by ID (public)
- `POST /api/briefs/generate` — trigger brief generation (authenticated or webhook-signed)
- `POST /api/briefs/demo` — generate demo brief on signup (DEMO_MODE)
- `GET /api/calendar/connect` — redirect to Google OAuth
- `GET /api/calendar/callback` — Google OAuth callback; stores refresh token; triggers demo brief
- `POST /api/calendar/sync` — manual sync of upcoming meetings
- `POST /api/stripe/create-checkout` — create Stripe checkout session
- `POST /api/stripe/create-portal` — create Stripe billing portal session

---

## Brief Structure (Claude Output Format)

Each brief should be structured JSON with these fields:

```json
{
  "company_snapshot": {
    "name": "Company Name",
    "description": "2-3 sentence overview",
    "industry": "SaaS",
    "employee_count": "500-1000",
    "logo_url": "https://...",
    "recent_news": ["headline 1", "headline 2"]
  },
  "attendee_summaries": [
    {
      "email": "attendee@company.com",
      "name": "Jane Smith",
      "role": "VP of Sales",
      "company": "Acme Corp",
      "linkedin_summary": "15 years in B2B SaaS..."
    }
  ],
  "agenda": ["item 1", "item 2", "item 3"],
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

| Plan | Price | Brief limit | Features | Status |
|---|---|---|---|---|
| Free | $0 | 3/month | Google Calendar, email delivery, company snapshot | ✅ Implemented |
| Starter | $15/mo | 20/month | Google Calendar, email delivery, company snapshot | ✅ Implemented |
| Pro | $29/mo | Unlimited | + Calendly, LinkedIn enrichment, follow-up drafts, custom prompts | ✅ Implemented (Calendly + follow-up drafts pending) |
| Team | $19/seat/mo | Unlimited | + Team dashboard, admin controls, CRM sync | 🗓 Roadmap |

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
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEMO_MODE=true
WEBHOOK_SECRET=your_internal_webhook_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_STARTER_PRICE_ID=
STRIPE_PRO_PRICE_ID=

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM_EMAIL=briefs@meetprep.ai

# Google Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback

# Enrichment
CLEARBIT_API_KEY=          # optional
PROXYCURL_API_KEY=
BING_NEWS_API_KEY=

# Calendly (Pro)
CALENDLY_WEBHOOK_SIGNING_KEY=

# Inngest (background jobs)
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
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
- Auth is handled entirely by Supabase Auth (not NextAuth.js)
- Brief generation: user-triggered = inline in `/api/briefs/generate` (maxDuration=300); webhook-triggered = Inngest background job
- Inngest functions: `generate-brief` (event-driven), `send-followup-emails` (hourly cron), `reset-brief-counts` (monthly cron)
- Dev: run `npm run dev` + `npm run dev:inngest` in separate terminals; Inngest Dev Server proxies to `/api/inngest`
- Google Calendar push notifications expire every 7 days — watch renewal must be automated
- Calendly integration: userId is passed via `utm_content` on the Calendly booking link so the webhook can identify which MeetPrep user booked

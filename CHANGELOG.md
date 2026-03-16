# Changelog

All notable changes to MeetPrep are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versions follow [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added
- `research_quality` field (`full` | `limited` | `minimal`) on every brief, calculated from enrichment results and stored in DB
- `POST /api/briefs/demo` as the canonical demo brief endpoint
- Auto-trigger of demo brief immediately after Google Calendar OAuth connect (activation moment)
- Publicly accessible brief viewer at `/briefs/{id}` — no login required, shareable by link
- Public SELECT RLS policies on `briefs` and `meetings` tables (UUID IDs are unguessable)
- GitHub Actions `docs-check` workflow — blocks PRs that change source files without updating documentation
- GitHub Actions `docs-generate` workflow — auto-regenerates `docs/api-reference.md` on push
- `scripts/generate-api-docs.js` — scans `src/app/api/**` route handlers and generates API reference markdown
- Full documentation suite: user guide, technical architecture, process flow, database schema, deployment guide, development guide

### Changed
- `POST /api/demo` is now a 308 permanent redirect to `POST /api/briefs/demo`
- `GET /api/briefs/{id}` no longer requires authentication (public read via RLS)
- Dashboard `/briefs/{id}` page redirects to the public brief viewer

### Fixed
- Brief viewer was inaccessible to unauthenticated users (users could not share briefs)
- Demo brief was not triggered automatically on calendar connect

---

## [0.1.0] — 2026-03-15

### Added
- Next.js 14 App Router project scaffold with TypeScript and Tailwind CSS
- Supabase Auth (email/password) with session middleware
- Database schema: `users`, `meetings`, `briefs` with full RLS
- Google Calendar OAuth connect flow and push-notification webhook
- Manual calendar sync endpoint (`POST /api/calendar/sync`)
- Brief generation pipeline:
  - Clearbit company enrichment
  - ProxyCurl LinkedIn profile lookup
  - Bing News recent coverage
  - Anthropic Claude Sonnet brief generation (structured JSON)
- React Email template (`BriefEmail`) with company snapshot, attendee profiles, agenda, talking points, icebreakers, risk flags
- Resend email delivery
- Stripe billing: Checkout, Customer Portal, subscription webhook handling
- Plan limits enforcement (`free`: 3, `starter`: 20, `pro`: unlimited)
- Dashboard with meeting list and brief status badges
- Settings page: calendar connection, subscription management
- `GET /api/briefs/{id}` — fetch brief by ID
- `POST /api/briefs/generate` — run research pipeline and generate brief
- `POST /api/briefs/demo` — generate a demo "Intro Call with Stripe Team" brief
- `POST /api/webhooks/calendar` — receive Google Calendar push notifications
- `POST /api/webhooks/stripe` — receive Stripe billing events
- Vitest unit test suite covering lib helpers and API routes
- `CLAUDE.md` project context file for AI-assisted development sessions

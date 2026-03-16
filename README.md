# MeetPrep

AI-powered meeting preparation for B2B sales reps, consultants, and recruiters.

When someone books a meeting with you, MeetPrep automatically researches the attendee's company, LinkedIn profile, and recent news — then delivers a personalised prep brief to your inbox before the call.

---

## Documentation

| Document | Description |
|---|---|
| [User Guide](docs/user-guide.md) | How to use MeetPrep as an end user |
| [Technical Architecture](docs/technical-architecture.md) | System design, stack decisions, directory structure |
| [Process Flows](docs/process-flow.md) | Sequence diagrams for all major flows |
| [Database Schema](docs/database-schema.md) | Tables, columns, RLS policies, ER diagram |
| [API Reference](docs/api-reference.md) | All API endpoints — auto-generated |
| [Deployment Guide](docs/deployment-guide.md) | Vercel + Supabase production setup |
| [Development Guide](docs/development-guide.md) | Local setup, scripts, branch strategy |
| [Changelog](CHANGELOG.md) | All notable changes by version |

---

## Quick Start (local dev)

```bash
git clone https://github.com/DeeDee1103/MeetPrep.git
cd MeetPrep
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

See the [Development Guide](docs/development-guide.md) for the full setup instructions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Auth + Database | Supabase (Postgres + Auth) |
| AI brief generation | Anthropic Claude Sonnet |
| Company enrichment | Clearbit |
| LinkedIn data | ProxyCurl |
| News | Bing News API |
| Email | Resend + React Email |
| Billing | Stripe |
| Deployment | Vercel |

---

## Pricing

| Plan | Price | Briefs/month |
|---|---|---|
| Free | $0 | 3 |
| Starter | $15/mo | 20 |
| Pro | $29/mo | Unlimited |
| Team | $19/seat/mo | Unlimited |

---

## Contributing

1. Branch from `develop`: `git checkout -b feature/your-feature develop`
2. Make your changes.
3. Update `CHANGELOG.md` (or a file in `docs/`) — the CI will block your PR otherwise.
4. Open a PR to `develop`.

See the [Development Guide](docs/development-guide.md) for the full workflow.

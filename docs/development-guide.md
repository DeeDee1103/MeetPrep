# Development Guide

Everything you need to run MeetPrep locally and contribute code.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| npm | 10+ | Bundled with Node |
| Git | Any | [git-scm.com](https://git-scm.com) |
| Supabase CLI (optional) | Latest | `npm i -g supabase` |

---

## 1. Clone and Install

```bash
git clone https://github.com/DeeDee1103/MeetPrep.git
cd MeetPrep
npm install
```

---

## 2. Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

For local development the minimum required variables are:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-xxxx
DEMO_MODE=true
```

Set `DEMO_MODE=true` to bypass real calendar events and generate briefs from hardcoded demo data. This is the recommended setting for local development.

> See [deployment-guide.md](./deployment-guide.md) for the full list of environment variables.

---

## 3. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Hot-reload is enabled — save a file and the browser updates instantly.

---

## 4. Project Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Start production server locally |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript compiler check (no emit) |
| `npm test` | Run all Vitest unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `node scripts/generate-api-docs.js` | Regenerate `docs/api-reference.md` |

---

## 5. Running Tests

```bash
npm test
```

Tests live in `src/tests/`. The test runner is **Vitest**.

```
src/tests/
├── api/
│   ├── briefs-generate.test.ts   # Tests for the brief generation API route
│   └── demo.test.ts              # Tests for the demo brief route
├── lib/
│   ├── anthropic.test.ts         # Claude integration tests
│   ├── clearbit.test.ts          # Clearbit enrichment tests
│   ├── news.test.ts              # Bing News tests
│   ├── proxycurl.test.ts         # ProxyCurl LinkedIn tests
│   ├── stripe.test.ts            # Stripe helper tests
│   └── utils.test.ts             # Utility function tests
└── setup.ts                      # Global test setup (mocks, env)
```

To run a single test file:

```bash
npx vitest run src/tests/lib/anthropic.test.ts
```

---

## 6. Code Organisation

### Adding a new API route

1. Create `src/app/api/<path>/route.ts`.
2. Export one or more async functions named `GET`, `POST`, `PUT`, `PATCH`, or `DELETE`.
3. Add a JSDoc comment above each exported function — it will appear in the auto-generated API reference.
4. Run `node scripts/generate-api-docs.js` to update `docs/api-reference.md`.

```ts
/**
 * Fetch the user's notification preferences.
 */
export async function GET(request: NextRequest) { ... }
```

### Adding a new page

- **Authenticated page** (needs sidebar/header): create under `src/app/(dashboard)/`.
- **Public page** (no auth): create under `src/app/` directly (outside any route group).

### Adding a new component

Place it in the appropriate subdirectory of `src/components/`:

| Folder | Contents |
|--------|----------|
| `briefs/` | Brief card, brief viewer |
| `layout/` | Header, sidebar |
| `meetings/` | Meeting card, list, generate-brief button |
| `ui/` | Generic primitives (Badge, Button, Card, Spinner) |

### Adding a new library helper

Place it in `src/lib/` and add a corresponding test in `src/tests/lib/`.

---

## 7. Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code. Only merged from `develop` via PR. |
| `develop` | Active development. Feature branches merge here. |
| `feature/<name>` | Individual features / fixes. Branch from and PR to `develop`. |

### Typical workflow

```bash
# Start from develop
git checkout develop
git pull origin develop

# Create a feature branch
git checkout -b feature/my-feature

# ... make changes, commit ...

# Push and open a PR to develop
git push -u origin feature/my-feature
```

> **Documentation guardrail:** Every PR that touches `src/` or `supabase/` must also update at least one file in `docs/` or `CHANGELOG.md`. The `docs-check` GitHub Actions workflow enforces this and will block the merge if it fails.

---

## 8. Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short description>

[optional body]
```

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change that isn't a feat or fix |
| `test` | Adding or updating tests |
| `chore` | Build system, dependencies, CI config |

Examples:
```
feat: add research_quality field to brief pipeline
fix: handle personal email fallback in generate route
docs: auto-update API reference
```

---

## 9. Linting and Type Checking

Run before pushing:

```bash
npm run lint
npm run typecheck
```

The CI pipeline will also run these on every PR.

---

## 10. Common Issues

### `supabase.auth.getUser()` returns null locally
Make sure your `.env.local` has valid `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Calendar webhook not triggering locally
Google Calendar push notifications require a public HTTPS URL. Locally, use **ngrok**:

```bash
npx ngrok http 3000
```

Then update `NEXT_PUBLIC_APP_URL` to the ngrok URL and re-run `POST /api/calendar/connect` to create a new watch channel.

### `DEMO_MODE` brief keeps failing
Make sure `ANTHROPIC_API_KEY` is set. The demo brief calls Claude even in DEMO_MODE.

### Port 3000 already in use

```bash
npx kill-port 3000
npm run dev
```

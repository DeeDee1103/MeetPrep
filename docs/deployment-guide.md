# Deployment Guide

This guide covers deploying MeetPrep to production using **Vercel** (app) and **Supabase** (database + auth).

---

## Prerequisites

- Node.js 20+
- A [Vercel](https://vercel.com) account
- A [Supabase](https://supabase.com) project
- Accounts / API keys for all third-party services (see [Environment Variables](#environment-variables))

---

## 1. Supabase Setup

### Create a new project

1. Log in to [supabase.com](https://supabase.com) and create a new project.
2. Choose a region close to your Vercel deployment (e.g. US East).
3. Note the project **URL** and **anon key** from **Project Settings → API**.

### Run the schema

1. Go to **SQL Editor** in the Supabase dashboard.
2. Paste and run the contents of `supabase/schema.sql`.
3. Verify the three tables appear in the **Table Editor**: `users`, `meetings`, `briefs`.

### Enable email auth

1. Go to **Authentication → Providers → Email**.
2. Enable **Email confirmations** for production.

### Schedule monthly brief-count reset

In the SQL editor:
```sql
SELECT cron.schedule(
  'reset-brief-counts',
  '0 0 1 * *',
  'SELECT public.reset_monthly_brief_counts()'
);
```

> **Note:** `pg_cron` must be enabled. Go to **Database → Extensions** and enable `pg_cron`.

---

## 2. Google OAuth Setup

### Create Google Cloud credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project (or reuse one).
3. Enable these APIs:
   - **Google Calendar API**
   - **Google People API** (optional, for profile photos)
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**.
5. Application type: **Web application**.
6. Authorised redirect URIs:
   ```
   https://your-project.supabase.co/auth/v1/callback
   https://<your-vercel-domain>/api/calendar/callback
   ```
7. Copy the **Client ID** and **Client Secret**.

---

## 3. Stripe Setup

1. Log in to [dashboard.stripe.com](https://dashboard.stripe.com).
2. Create two **recurring prices** (Products → Add product):
   - **Starter** — $15/month
   - **Pro** — $29/month
3. Note the **Price IDs** (`price_xxx`).
4. Go to **Developers → Webhooks → Add endpoint**:
   - URL: `https://<your-domain>/api/webhooks/stripe`
   - Events to listen to:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `checkout.session.completed`
     - `invoice.payment_failed`
5. Copy the **Webhook signing secret**.

---

## 4. Third-Party API Keys

| Service | Where to get the key |
|---|---|
| Clearbit | [clearbit.com/keys](https://clearbit.com) |
| ProxyCurl | [nubela.co/proxycurl](https://nubela.co/proxycurl) |
| Bing News API | [Azure Portal → Cognitive Services → Bing Search v7](https://portal.azure.com) |
| Anthropic (Claude) | [console.anthropic.com/api-keys](https://console.anthropic.com) |
| Resend | [resend.com/api-keys](https://resend.com) |
| Calendly (Pro) | [developer.calendly.com](https://developer.calendly.com) |

---

## 5. Vercel Deployment

### Connect the repository

1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New Project** and import the GitHub repository.
3. Framework preset: **Next.js** (auto-detected).
4. Do not change the build or output settings.

### Set environment variables

In **Project Settings → Environment Variables**, add every variable from the table below.

> Set them for **Production**, **Preview**, and **Development** environments as appropriate.

---

## Environment Variables

```bash
# ── Supabase ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # Server-side only — never expose client-side

# ── Application ───────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app   # No trailing slash
WEBHOOK_SECRET=<random 32-char string>               # Shared secret for internal webhook calls

# ── Auth ──────────────────────────────────────────────────────────────────────
NEXTAUTH_SECRET=<random 32-char string>
NEXTAUTH_URL=https://your-domain.vercel.app

# ── Google Calendar ───────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx

# ── Calendly (Pro feature) ────────────────────────────────────────────────────
CALENDLY_WEBHOOK_SIGNING_KEY=xxxx

# ── Enrichment ────────────────────────────────────────────────────────────────
CLEARBIT_API_KEY=sk_xxxx
PROXYCURL_API_KEY=xxxx
BING_NEWS_API_KEY=xxxx

# ── AI ────────────────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-xxxx

# ── Email ─────────────────────────────────────────────────────────────────────
RESEND_API_KEY=re_xxxx

# ── Billing ───────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_xxxx           # Use sk_test_xxxx for staging
STRIPE_WEBHOOK_SECRET=whsec_xxxx
STRIPE_STARTER_PRICE_ID=price_xxxx
STRIPE_PRO_PRICE_ID=price_xxxx

# ── Feature flags ─────────────────────────────────────────────────────────────
DEMO_MODE=false                           # Set true locally to bypass real calendar events
```

### Generate `WEBHOOK_SECRET`

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 6. First Deploy

1. Push to `main` (or trigger a deploy from the Vercel dashboard).
2. Visit `https://your-domain.vercel.app` — you should see the landing page.
3. Sign up and connect your Google Calendar to verify the full flow.

---

## 7. Custom Domain

1. In Vercel: **Project → Settings → Domains → Add**.
2. Add your domain (e.g. `meetprep.app`) and follow the DNS instructions.
3. Update `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` to the custom domain.
4. Update the Google OAuth redirect URI to include the custom domain.
5. Update the Stripe webhook URL to the custom domain.

---

## 8. Monitoring

| What to watch | Where |
|---|---|
| API errors | Vercel **Functions** tab → error logs |
| Brief generation failures | Supabase: `SELECT * FROM meetings WHERE brief_status = 'failed'` |
| Email delivery | Resend dashboard → delivery logs |
| Billing events | Stripe dashboard → Webhooks → recent deliveries |
| Database performance | Supabase → Database → Performance |

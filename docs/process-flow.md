# Process Flows

All major flows in MeetPrep are documented below using sequence and flowchart diagrams.

---

## 1. User Onboarding Flow

```mermaid
flowchart TD
    A([User visits MeetPrep]) --> B[Sign up with email + password]
    B --> C[Verify email]
    C --> D[Click 'Connect Google Calendar']
    D --> E[Google OAuth consent screen]
    E --> F{Permission granted?}
    F -- No --> G[Show error — retry]
    F -- Yes --> H[Store refresh token in DB]
    H --> I[Set calendar_connected = true]
    I --> J[Setup Google Calendar push-notification watch]
    J --> K[Fire demo brief in background\nPOST /api/briefs/demo]
    K --> L[Redirect → /dashboard?calendar=connected]
    L --> M[User sees demo brief card]
    M --> N{Real meeting booked?}
    N -- Yes --> O[Brief auto-generated before call]
    N -- No --> P[User manually syncs or waits]
```

---

## 2. Meeting Ingestion Flow

Triggered whenever Google Calendar sends a push notification to the webhook.

```mermaid
sequenceDiagram
    participant GCal as Google Calendar
    participant Webhook as POST /api/webhooks/calendar
    participant DB as Supabase DB
    participant BriefAPI as POST /api/briefs/generate

    GCal->>Webhook: Push notification (x-goog-resource-state: exists)
    Webhook->>DB: Lookup user by x-goog-channel-token
    Webhook->>GCal: Fetch upcoming events (getUpcomingMeetings)
    loop For each meeting
        Webhook->>DB: Upsert meeting record (user_id, google_event_id unique)
        alt New meeting (no existing record)
            Webhook->>BriefAPI: POST {meetingId, userId} — fire and forget
        end
    end
    Webhook-->>GCal: 200 OK
```

---

## 3. Brief Generation Pipeline

The core intelligence layer. Runs as a background call from the webhook handler.

```mermaid
sequenceDiagram
    participant API as POST /api/briefs/generate
    participant DB as Supabase DB
    participant Clearbit
    participant ProxyCurl
    participant Bing as Bing News API
    participant Claude as Anthropic Claude

    API->>DB: Fetch meeting + user profile
    API->>DB: Check plan limits (isOverLimit)
    alt Over limit
        API-->>Caller: 402 Plan limit reached
    end
    API->>DB: Set brief_status = 'generating'

    note over API: Identify external attendees\n(filter out same-domain emails)

    par Research — runs in parallel
        API->>Clearbit: enrichCompany(domain)
        API->>ProxyCurl: getLinkedInProfile(email) × N attendees
    end

    API->>Bing: getCompanyNews(companyName)

    note over API: Determine research_quality\nfull | limited | minimal

    API->>Claude: generateMeetingBrief(title, attendees, company, news)
    Claude-->>API: Structured JSON brief

    API->>DB: INSERT brief (agenda, talking_points, icebreakers,\nrisk_flags, attendee_summaries, research_quality)
    API->>DB: UPDATE meeting SET brief_id, brief_status = 'ready'
    API->>DB: increment_brief_count(userId)
    API->>Resend: sendBriefEmail(userEmail, brief, meeting)
    API->>DB: UPDATE brief SET email_sent_at
```

---

## 4. Demo Brief Flow

Fires automatically on first calendar connect. Provides immediate value before any real meeting is booked.

```mermaid
flowchart TD
    A[Calendar OAuth callback completes] --> B[Store refresh token]
    B --> C[Setup calendar watch]
    C --> D[fire-and-forget: POST /api/briefs/demo]
    D --> E[Enrich stripe.com via Clearbit]
    E --> F{Clearbit success?}
    F -- Yes --> G[Use live Stripe company data]
    F -- No --> H[Use hardcoded Stripe fallback data]
    G --> I[Call Claude with Stripe context]
    H --> I
    I --> J[Insert demo meeting record]
    J --> K[Insert brief record — research_quality: full]
    K --> L[Update meeting brief_id + status = ready]
    L --> M[Dashboard shows demo brief card]
```

---

## 5. Email Delivery Flow

```mermaid
sequenceDiagram
    participant Pipeline as Brief Pipeline
    participant Resend
    participant User as User Inbox

    Pipeline->>Resend: sendBriefEmail(to, brief, meeting)
    note over Resend: Renders BriefEmail React component\nto HTML
    Resend->>User: Email with full brief\n(company, attendees, agenda,\ntalking points, icebreakers, risk flags)
    note over User: CTA button → /briefs/{id}\n(public shareable link)
    Resend-->>Pipeline: messageId
    Pipeline->>DB: UPDATE briefs SET email_sent_at = now()
```

---

## 6. Stripe Billing Flow

```mermaid
flowchart TD
    A[User hits brief limit] --> B[402 response — limitReached: true]
    B --> C[Frontend shows upgrade modal]
    C --> D[User clicks Upgrade plan]
    D --> E[POST /api/stripe/create-checkout]
    E --> F[Stripe Checkout page]
    F --> G{Payment result}
    G -- Success --> H[Stripe: checkout.session.completed event]
    H --> I[POST /api/webhooks/stripe]
    I --> J[Update user stripe_customer_id in DB]
    I --> K[customer.subscription.created event]
    K --> L[POST /api/webhooks/stripe]
    L --> M[Update user.plan = starter OR pro]
    M --> N[User can generate briefs again]
    G -- Failure --> O[Stripe redirects back with error]

    P[User manages subscription] --> Q[POST /api/stripe/create-portal]
    Q --> R[Stripe Customer Portal]
    R -- Cancel --> S[customer.subscription.deleted event]
    S --> T[POST /api/webhooks/stripe]
    T --> U[Update user.plan = free]
```

---

## 7. Authentication Flow

```mermaid
sequenceDiagram
    participant Browser
    participant MW as Next.js Middleware
    participant Supabase as Supabase Auth
    participant Page as Server Component

    Browser->>MW: Request to /dashboard
    MW->>Supabase: updateSession (refresh token if needed)
    alt No valid session
        MW-->>Browser: Redirect → /login?redirectTo=/dashboard
    end
    MW->>Page: Forward request with refreshed session
    Page->>Supabase: getUser() — verify session server-side
    Page-->>Browser: Render authenticated page
```

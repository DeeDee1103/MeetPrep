# MeetPrep — User Guide

## Overview

MeetPrep automatically researches everyone you're about to meet and delivers a personalised prep brief to your inbox before every call. No manual research, no last-minute scrambling.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Connecting Your Calendar](#2-connecting-your-calendar)
3. [Your First Demo Brief](#3-your-first-demo-brief)
4. [The Dashboard](#4-the-dashboard)
5. [Understanding a Brief](#5-understanding-a-brief)
6. [Sharing a Brief](#6-sharing-a-brief)
7. [Settings](#7-settings)
8. [Plans and Billing](#8-plans-and-billing)
9. [FAQ](#9-faq)

---

## 1. Getting Started

### Sign up

1. Go to the MeetPrep app and click **Sign up**.
2. Enter your email address and choose a password.
3. Check your inbox for a verification email and click the link.

You are now on the **Free plan** (3 briefs/month). No credit card needed to start.

---

## 2. Connecting Your Calendar

MeetPrep needs access to your Google Calendar to detect new meetings automatically.

1. Go to **Settings → Calendar**.
2. Click **Connect Google Calendar**.
3. Sign in with your Google account and grant the requested permissions.
   - MeetPrep requests **read-only** access to your calendar events.
4. You are redirected back to the dashboard.

> **Why Google Calendar?**
> Google Calendar is the primary integration. Calendly webhooks are also supported for Pro users.

### What MeetPrep reads from your calendar

- Meeting title and description
- Start and end time
- Attendee names and email addresses
- Video meeting link (Google Meet, Zoom, etc.)

MeetPrep does **not** read your personal or all-day events — only meetings with external attendees.

---

## 3. Your First Demo Brief

Immediately after you connect your calendar, MeetPrep generates a **demo brief** for a fictional "Intro Call with Stripe Team". This shows you exactly what a real brief looks like before your first real meeting.

Click **View Brief** on the demo meeting card to see it.

---

## 4. The Dashboard

The dashboard shows all your upcoming meetings and the status of each brief.

| Status badge | Meaning |
|---|---|
| **Generating** | MeetPrep is currently researching and writing the brief |
| **Brief Ready** | Your brief is ready — click to view |
| **Failed** | Something went wrong — click **Retry** |
| **Pending** | Meeting detected, brief not yet started |

### Syncing manually

If you added a meeting in Google Calendar and it hasn't appeared yet, click **Sync Calendar** at the top of the dashboard. Push notifications normally make this instant.

---

## 5. Understanding a Brief

Each brief contains:

### Company Snapshot
A 2–3 sentence overview of the attendee's company, plus industry, size, and recent news headlines.

> Research quality badge:
> - **Full** — company data + LinkedIn profiles + news
> - **Limited** — partial data (e.g. no LinkedIn profile found)
> - **Minimal** — personal email address (Gmail/Hotmail) detected; no company enrichment possible

### Attendee Profiles
Name, title, company, and a professional summary for each external attendee, drawn from LinkedIn via ProxyCurl.

### Likely Agenda
Three predicted agenda items based on the meeting title, description, and attendee context.

### Talking Points
Five specific, actionable points tailored to this meeting and company.

### Icebreakers
Two natural conversation starters relevant to the attendees or their company.

### Risk Flags
Any concerns worth being aware of — recent layoffs, funding difficulties, leadership changes, etc.

---

## 6. Sharing a Brief

Every brief has a **public shareable link** at:

```
https://meetprep.app/briefs/{brief-id}
```

Anyone with the link can read the brief — no login required. This is useful for forwarding to a colleague or sales manager before the call.

> Brief IDs are long random UUIDs — they cannot be guessed.

---

## 7. Settings

| Setting | Description |
|---|---|
| **Calendar** | Connect / disconnect Google Calendar |
| **Calendly** | Connect Calendly webhook (Pro only) |
| **Notification email** | Where briefs are delivered (defaults to your account email) |
| **Brief timing** | How long before the meeting the email is sent (default: 1 hour) |
| **Custom prompt** | Add instructions to every brief, e.g. "Always include a MEDDIC qualification section" (Pro only) |
| **Subscription** | View current plan, upgrade, or manage billing |

---

## 8. Plans and Billing

| Plan | Price | Briefs / month | Key features |
|---|---|---|---|
| **Free** | $0 | 3 | Google Calendar, email delivery |
| **Starter** | $15/mo | 20 | + Company snapshot, all research sources |
| **Pro** | $29/mo | Unlimited | + Calendly, Slack, LinkedIn enrichment, follow-up email drafts, custom prompts |
| **Team** | $19/seat/mo | Unlimited | + Team dashboard, admin controls, CRM sync (roadmap) |

### Upgrading

1. Go to **Settings → Subscription**.
2. Click **Upgrade**.
3. Complete checkout via Stripe (card, Apple Pay, or Google Pay).
4. Your plan upgrades instantly — no waiting.

### Cancelling

Go to **Settings → Subscription → Manage Billing**. You can cancel at any time; access continues until the end of the billing period.

---

## 9. FAQ

**Q: Why does my brief say "Limited info — personal email detected"?**
A: When an attendee uses a personal address (Gmail, Hotmail, etc.) there is no company domain to look up. MeetPrep generates the best brief it can from the meeting title and attendee name alone.

**Q: How long does a brief take to generate?**
A: Usually 15–30 seconds after the meeting is detected.

**Q: Does MeetPrep store my meeting recordings?**
A: No. MeetPrep only reads calendar metadata (title, attendees, time). It never accesses meeting audio, video, or chat.

**Q: Can I generate a brief manually?**
A: Yes — click **Generate Brief** on any meeting card in the dashboard.

**Q: What happens to my data if I cancel?**
A: Your briefs are retained for 30 days after cancellation, then permanently deleted.

# MindForge — Deployment Guide

**Version:** 1.1 | **Stack:** Next.js 14 · Firebase Auth + Firestore · Gemini AI · Lemon Squeezy · Resend · Vercel

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Firebase Setup](#2-firebase-setup)
3. [Google Gemini AI Setup](#3-google-gemini-ai-setup)
4. [Lemon Squeezy Setup (Payments)](#4-lemon-squeezy-setup-payments)
5. [Resend Setup (Email)](#5-resend-setup-email)
6. [PostHog Setup (Analytics)](#6-posthog-setup-analytics)
7. [Sentry Setup (Error Tracking)](#7-sentry-setup-error-tracking)
8. [Environment Variables Reference](#8-environment-variables-reference)
9. [Local Development](#9-local-development)
10. [Production Deployment (Vercel)](#10-production-deployment-vercel)
11. [Post-Deployment Configuration](#11-post-deployment-configuration)
12. [Seed the Database](#12-seed-the-database)
13. [Security Checklist](#13-security-checklist)
14. [Launch Checklist](#14-launch-checklist)
15. [Cost Estimates](#15-cost-estimates)

---

## 1. Prerequisites

Before deploying, create accounts on the following services. All are free to start.

| Service | Purpose | Free tier |
|---|---|---|
| [Firebase](https://console.firebase.google.com) | Auth + Firestore database | Yes (Spark plan) |
| [Google AI Studio](https://aistudio.google.com) | Gemini API key | Yes (rate-limited) |
| [Lemon Squeezy](https://lemonsqueezy.com) | Payments & subscriptions | Yes (5% fee on free) |
| [Resend](https://resend.com) | Transactional email | Yes (3,000/mo) |
| [PostHog](https://posthog.com) | Product analytics | Yes (1M events/mo) |
| [Sentry](https://sentry.io) | Error tracking | Yes (5,000 errors/mo) |
| [Vercel](https://vercel.com) | Hosting + cron jobs | Yes (Pro needed for cron) |

> **Node.js requirement:** Node.js ≥ 20.0.0. Run `node -v` to confirm.

---

## 2. Firebase Setup

### 2.1 Create the Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com) → **Add project**
2. Name it `mindforge` (or your preferred name)
3. Disable Google Analytics during setup (PostHog handles analytics separately)
4. Click **Create project**

### 2.2 Enable Authentication

1. In Firebase Console → **Authentication** → **Get started**
2. Under **Sign-in method**, enable:
   - **Email/Password** → Enable → Save
   - **Google** → Enable → set Project support email → Save
3. Under **Settings** → **Authorized domains**, add:
   - Your production domain (e.g., `mindforge.app`)
   - Your Replit preview domain (e.g., `*.replit.dev`)

### 2.3 Create Firestore Database

1. Firebase Console → **Firestore Database** → **Create database**
2. Choose **Start in production mode**
3. Select your preferred region (e.g., `us-central1` for lowest latency in the US)
4. Click **Enable**

### 2.4 Deploy Firestore Security Rules

In Firebase Console → **Firestore Database** → **Rules**, paste the following and click **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      match /badges/{badgeKey} {
        allow read: if request.auth != null && request.auth.uid == uid;
        allow write: if false;
      }
    }
    match /habits/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /habit_completions/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /habit_streaks/{docId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow write: if false;
    }
    match /daily_checkins/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /challenges/{docId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    match /{collection}/{docId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow write: if false;
    }
  }
}
```

### 2.5 Get Firebase Client SDK Config

1. Firebase Console → **Project Settings** (gear icon) → **General**
2. Under **Your apps**, click **Add app** → choose **Web** (`</>`)
3. Register the app with a nickname (e.g., `mindforge-web`)
4. Copy the `firebaseConfig` object — you need these values:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

### 2.6 Create a Firebase Admin Service Account

1. Firebase Console → **Project Settings** → **Service accounts**
2. Click **Generate new private key** → **Generate key**
3. A `.json` file downloads. Open it and extract:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

> **CRITICAL:** The `private_key` value contains literal `\n` characters. When adding it to Vercel or Replit Secrets, paste the key exactly as it appears in the JSON file (with the `\n` characters). The app replaces `\\n` → `\n` at runtime in `lib/firebase/admin.ts`.

> **Security:** Never commit the downloaded `.json` file to version control. Add it to `.gitignore`.

---

## 3. Google Gemini AI Setup

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **Create API key** → Select your Firebase project (or create a new one)
3. Copy the key → `GEMINI_API_KEY`

**Models used:**
| Model | Purpose |
|---|---|
| `gemini-2.5-pro` | Daily debriefs, coaching, 40% Rule, weekly reports |
| `gemini-2.5-flash` | Memory extraction, mood classification, environment audit |
| `text-embedding-004` | Cookie Jar + user memory semantic embeddings (768-dim) |

> Embeddings are stored as `number[]` arrays in Firestore. Cosine similarity is computed in-process on the server — no external vector database required.

---

## 4. Lemon Squeezy Setup (Payments)

### 4.1 Create Store and Products

1. Sign up at [Lemon Squeezy](https://app.lemonsqueezy.com)
2. Create a **Store** → note your **Store ID** → `LEMONSQUEEZY_STORE_ID`
3. Create two **Products**:

**Product 1: Pro — The Forged**
- Create two variants:
  - Monthly: $12.00/month → copy **Variant ID** → `LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID`
  - Annual: $89.00/year → copy **Variant ID** → `LEMONSQUEEZY_PRO_ANNUAL_VARIANT_ID`

**Product 2: Elite — The Unbreakable**
- Create two variants:
  - Monthly: $29.00/month → copy **Variant ID** → `LEMONSQUEEZY_ELITE_MONTHLY_VARIANT_ID`
  - Annual: $219.00/year → copy **Variant ID** → `LEMONSQUEEZY_ELITE_ANNUAL_VARIANT_ID`

### 4.2 Get API Key

1. Lemon Squeezy Dashboard → **Settings** → **API** → **Create API key**
2. Copy it → `LEMONSQUEEZY_API_KEY`

### 4.3 Configure Webhook

1. Lemon Squeezy → **Settings** → **Webhooks** → **Add webhook**
2. URL: `https://your-domain.com/api/billing/webhook`
3. Events to subscribe:
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_expired`
   - `subscription_payment_success`
   - `subscription_payment_failed`
4. Copy the **Signing secret** → `LEMONSQUEEZY_WEBHOOK_SECRET`

> You must configure the webhook URL with your actual production domain before going live. During development, use a tool like [ngrok](https://ngrok.com) to expose localhost to the internet for testing.

---

## 5. Resend Setup (Email)

1. Sign up at [Resend](https://resend.com)
2. **Add a domain** for sending (e.g., `mindforge.app`)
   - Follow the DNS setup instructions to add SPF, DKIM, and DMARC records
   - Verify the domain
3. Go to **API Keys** → **Create API key**
4. Copy it → `RESEND_API_KEY`
5. Set the from address: `forge@mindforge.app` → `RESEND_FROM_EMAIL`

> Until your domain is verified, Resend restricts delivery to your own email address only. Set up the domain before launch.

**Weekly Neural Report cron schedule:** Every Sunday at 8:00 AM UTC (`0 8 * * 0`)
- Requires **Vercel Pro** plan for cron jobs
- Configured in `vercel.json` (already in the codebase)

---

## 6. PostHog Setup (Analytics)

1. Sign up at [PostHog](https://posthog.com)
2. Create a new project called `MindForge`
3. Go to **Project Settings** → copy:
   - **Project API Key** → `NEXT_PUBLIC_POSTHOG_KEY`
   - **Host** → `NEXT_PUBLIC_POSTHOG_HOST` (use `https://app.posthog.com` for PostHog Cloud)

**Events tracked automatically:**
`sign_up`, `onboarding_complete`, `habit_created`, `habit_logged`, `checkin_submitted`, `coach_message_sent`, `upgrade_clicked`, `subscription_created`, `challenge_activated`, `challenge_completed`, `cookie_jar_entry_added`, `badge_earned`, `forty_percent_triggered`, `forty_percent_accepted`

---

## 7. Sentry Setup (Error Tracking)

1. Sign up at [Sentry](https://sentry.io)
2. Create a new project → choose **Next.js**
3. Copy the **DSN** → `NEXT_PUBLIC_SENTRY_DSN`
4. Note your **Organization slug** and **Project slug** (for `sentry.server.config.ts`)

The Sentry config files are already in the codebase:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

---

## 8. Environment Variables Reference

### 8.1 Complete Variable List

Create a `.env.local` file in the project root for local development. **Never commit this file.**

```bash
# ─── Firebase Client SDK (NEXT_PUBLIC_ prefix required — safe for browser) ───
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_web_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# ─── Firebase Admin SDK (SERVER-ONLY — no NEXT_PUBLIC_ prefix) ───────────────
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR KEY HERE\n-----END PRIVATE KEY-----\n"

# ─── Google Gemini AI (SERVER-ONLY) ──────────────────────────────────────────
GEMINI_API_KEY=your_google_ai_studio_api_key

# ─── Lemon Squeezy Payments (SERVER-ONLY) ────────────────────────────────────
LEMONSQUEEZY_API_KEY=your_lemonsqueezy_api_key
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_signing_secret
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID=variant_id_for_pro_monthly
LEMONSQUEEZY_PRO_ANNUAL_VARIANT_ID=variant_id_for_pro_annual
LEMONSQUEEZY_ELITE_MONTHLY_VARIANT_ID=variant_id_for_elite_monthly
LEMONSQUEEZY_ELITE_ANNUAL_VARIANT_ID=variant_id_for_elite_annual

# ─── Resend Email (SERVER-ONLY) ───────────────────────────────────────────────
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=forge@mindforge.app

# ─── PostHog Analytics ────────────────────────────────────────────────────────
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# ─── Sentry Error Tracking ───────────────────────────────────────────────────
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# ─── App Config ───────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:5000      # Change to production URL after deploy
CRON_SECRET=generate_a_random_32char_string   # Used to authenticate cron job calls
```

### 8.2 Which Variables Are Required for Launch

| Variable | Required for app to start | Required for billing | Required for email |
|---|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` (6 vars) | ✅ Yes | — | — |
| `FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY` | ✅ Yes | — | — |
| `GEMINI_API_KEY` | ✅ Yes | — | — |
| `LEMONSQUEEZY_*` | No (app starts but billing is broken) | ✅ Yes | — |
| `RESEND_API_KEY` | No (app starts but email is skipped) | — | ✅ Yes |
| `NEXT_PUBLIC_POSTHOG_KEY` | No (analytics silently skip) | — | — |
| `NEXT_PUBLIC_SENTRY_DSN` | No (errors only logged to console) | — | — |
| `CRON_SECRET` | No | — | ✅ Yes (weekly report cron) |

### 8.3 Generating a CRON_SECRET

```bash
# Run this in terminal to generate a secure 32-character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 9. Local Development

### 9.1 Install Dependencies

```bash
pnpm install
```

### 9.2 Set Up Environment Variables

```bash
cp .env.local.example .env.local
# Then fill in all values in .env.local
```

### 9.3 Run the Dev Server

```bash
pnpm run dev
# App runs at http://localhost:5000
```

### 9.4 Seed Challenges (Optional)

Run this once to populate the 20 Callousing Challenges in Firestore:

```bash
pnpm seed:challenges
```

> This script writes to Firestore using the Admin SDK. Make sure your Firebase Admin env vars are set before running.

### 9.5 Testing Webhooks Locally

To test Lemon Squeezy webhooks locally, use [ngrok](https://ngrok.com):

```bash
# In one terminal, run the dev server
pnpm run dev

# In another terminal, expose port 5000
ngrok http 5000
```

Then update your Lemon Squeezy webhook URL to the ngrok HTTPS URL + `/api/billing/webhook`.

---

## 10. Production Deployment (Vercel)

### 10.1 Connect Repository

1. Push your code to GitHub (or GitLab / Bitbucket)
2. Go to [Vercel](https://vercel.com) → **Add New Project**
3. Import your repository
4. Vercel auto-detects Next.js — no framework changes needed

### 10.2 Configure Build Settings

Vercel auto-detects these correctly, but verify:

| Setting | Value |
|---|---|
| Framework Preset | Next.js |
| Build Command | `pnpm run build` |
| Output Directory | `.next` (default) |
| Install Command | `pnpm install` |
| Node.js Version | 20.x |

### 10.3 Add Environment Variables in Vercel

1. In your Vercel project → **Settings** → **Environment Variables**
2. Add every variable from Section 8.1
3. For `FIREBASE_PRIVATE_KEY`: paste the full key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`, with literal `\n` characters (not actual newlines) — Vercel handles the wrapping
4. Set `NEXT_PUBLIC_APP_URL` to your production domain (e.g., `https://mindforge.app`)
5. Select **Production**, **Preview**, and **Development** for each variable as appropriate

### 10.4 Deploy

Click **Deploy**. Vercel builds and deploys the app. The first build takes 2–4 minutes.

### 10.5 Custom Domain (Optional)

1. Vercel project → **Settings** → **Domains**
2. Add your custom domain (e.g., `mindforge.app`)
3. Update your DNS records as instructed by Vercel
4. Update `NEXT_PUBLIC_APP_URL` env var to your custom domain
5. Update Firebase Auth → **Authorized domains** to include your custom domain

---

## 11. Post-Deployment Configuration

### 11.1 Update Lemon Squeezy Webhook URL

After your production domain is live:

1. Lemon Squeezy → **Settings** → **Webhooks**
2. Update the webhook URL to `https://your-production-domain.com/api/billing/webhook`

### 11.2 Update Firebase Authorized Domains

1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Add your production domain

### 11.3 Enable Cron Jobs (Vercel Pro)

The `vercel.json` in the codebase configures the weekly neural report:

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-report",
      "schedule": "0 8 * * 0"
    }
  ]
}
```

This runs every **Sunday at 8:00 AM UTC**. Cron jobs require a **Vercel Pro** plan ($20/month). On the Hobby plan, this cron will not execute.

Vercel automatically sends the `CRON_SECRET` as a Bearer token header. The endpoint verifies it before processing.

### 11.4 Test the Cron Endpoint Manually

```bash
curl -X GET "https://your-domain.com/api/cron/weekly-report" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response: `{ "processed": N, "failed": 0 }`

### 11.5 Test Auth Flow in Production

1. Visit your production URL
2. Sign up with a new email/password account
3. Complete all 3 onboarding steps (Mirror → Why → Environment)
4. Verify you land on `/dashboard` with Forge Score = 0

---

## 12. Seed the Database

### 12.1 Seed Callousing Challenges

The 20 Callousing Challenges need to be seeded into Firestore before users can access them.

```bash
# Run from project root with env vars set
pnpm seed:challenges
```

This script writes to the `challenges` Firestore collection using the Admin SDK. It is idempotent — safe to run multiple times.

### 12.2 Verify Challenges

In Firebase Console → **Firestore Database**, check that the `challenges` collection contains 20 documents with these categories: `cold`, `screen`, `physical`, `fast`, `social`.

---

## 13. Security Checklist

Run these checks before going live:

### 13.1 Environment Variable Audit

No secret should ever start with `NEXT_PUBLIC_`. Run this check:

```bash
grep -r "NEXT_PUBLIC_FIREBASE_PRIVATE\|NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL\|NEXT_PUBLIC_GEMINI\|NEXT_PUBLIC_LEMONSQUEEZY\|NEXT_PUBLIC_RESEND" .
```

Expected output: **zero results**.

### 13.2 Server-Only Imports

Verify these files have `import "server-only"` at the top:
- `lib/firebase/admin.ts`
- `lib/auth.ts`
- `lib/gemini/client.ts`

### 13.3 Cookie Security

The `mf_session` cookie is set in `app/api/auth/session/route.ts` with:
- `httpOnly: true` — not accessible from JavaScript
- `secure: true` in production — HTTPS only
- `sameSite: 'strict'` — CSRF protection
- `maxAge: 14 * 24 * 60 * 60` — 14-day expiry

### 13.4 Webhook HMAC Verification

The Lemon Squeezy webhook at `app/api/billing/webhook/route.ts` must verify the HMAC signature on every incoming request. Return `401` for any request with an invalid signature.

### 13.5 Rate Limiting

The AI streaming endpoint `/api/coach/stream` is rate-limited to **20 requests/hour per user**. Verify this is active before launch.

### 13.6 Firestore Security Rules

After deploying rules (Section 2.4), test them in Firebase Console → **Firestore** → **Rules** → **Rules Playground**:
- Unauthenticated read on `users/any-uid` should **deny**
- Authenticated read on `users/own-uid` should **allow**
- Server-write via Admin SDK bypasses these rules intentionally

---

## 14. Launch Checklist

Work through this list before going public:

### Foundation
- [ ] New user can sign up with email/password
- [ ] New user can sign up with Google OAuth
- [ ] `mf_session` cookie is set after login (visible in browser DevTools → Application → Cookies)
- [ ] Unauthenticated access to `/dashboard` redirects to `/login`
- [ ] Authenticated access to `/login` redirects to `/dashboard`

### Onboarding
- [ ] All 3 onboarding steps complete: Mirror → Why Excavation → Environment Audit
- [ ] AI mirrors stream responses within 3 seconds
- [ ] "Identity Locked" badge animation plays after Why Excavation
- [ ] Environment recommendations generate with specific, actionable items
- [ ] User redirects to `/dashboard` after "Enter the Forge"

### Core App
- [ ] Habit creation works (name, category, type, frequency)
- [ ] Free tier enforced at 3 habits (upgrade prompt shows on 4th attempt)
- [ ] "Completed" / "Missed" buttons log correctly
- [ ] Forge Spark particle animation fires on habit completion
- [ ] Streak increments correctly on consecutive days
- [ ] Forge Score animates up with count-up effect (500ms)
- [ ] Daily check-in submits and AI debrief streams in (Pro user)
- [ ] Free users see upgrade prompt instead of AI debrief
- [ ] 40% Rule modal: pure black, heading "YOUR MIND IS LYING TO YOU", dismissable only via the two buttons
- [ ] `/coach` page is locked for Free users (shows upgrade card)
- [ ] Cookie Jar entries embed and semantic search works
- [ ] Callousing Challenges list, activate, complete with reflection

### Gamification
- [ ] XP amounts: habit complete = 20, daily check-in = 30, cookie jar entry = 25, environment item = 50, full onboarding = 200
- [ ] Level names correct: Raw (0), Tempered (500), Forged (1500), Hardened (3500), Unbreakable (7500), Legendary (15000)
- [ ] XP bar fills and level-up animation plays
- [ ] All 6 badges: `identity_locked`, `mirror_gazer`, `cookie_jar_founder`, `forty_percent_survivor`, `cold_mind`, `tempered`

### Billing
- [ ] Upgrade page shows $12/mo Pro and $29/mo Elite (correct PRD prices)
- [ ] Checkout link redirects to Lemon Squeezy
- [ ] Webhook updates `users.tier` after successful payment
- [ ] Settings page shows "Manage Billing" link

### Analytics & Email
- [ ] Analytics page charts load (Forge Score, habits, honesty trend, XP)
- [ ] Cron endpoint requires valid `CRON_SECRET` (returns 401 without it)
- [ ] Weekly report generates structured JSON and sends via Resend

### Compliance
- [ ] `/privacy` page exists
- [ ] `/terms` page exists
- [ ] Data export endpoint at `/api/user/export` works
- [ ] Delete account flow soft-deletes data and calls `adminAuth.deleteUser(uid)`

### Performance
- [ ] TypeScript compiles: `pnpm tsc --noEmit` passes with zero errors
- [ ] No console errors on dashboard load
- [ ] Mobile flows work at 375px (iPhone SE viewport)
- [ ] All touch targets ≥ 44px height

### Tracking
- [ ] PostHog receives `sign_up` event on new registration
- [ ] PostHog receives `onboarding_complete` after Step 3
- [ ] Sentry captures a test error with `user_id` context

---

## 15. Cost Estimates

At launch with approximately 1,000 Pro users:

| Service | Monthly cost |
|---|---|
| Vercel Pro | $20 |
| Firebase Firestore (Blaze plan) | ~$5–30 (reads/writes-based) |
| Gemini AI (1,000 Pro users × ~30 coaching sessions) | ~$800–1,200 |
| Lemon Squeezy fees | ~5% of revenue |
| Resend (1,000 weekly emails × 4 = 4,000/mo) | Free tier |
| PostHog | Free tier (under 1M events) |
| Sentry | Free tier (under 5,000 errors) |
| **Total infrastructure** | **~$850–1,270/mo** |
| **Revenue (1,000 × $12)** | **$12,000 MRR** |
| **Estimated gross margin** | **~89%** |

### Firebase Billing Note

Firebase Spark plan (free) has limits. Switch to the **Blaze plan** (pay-as-you-go) before launch:
- Firebase Console → **Project Settings** → **Usage and billing** → **Modify plan** → Blaze
- Blaze is free up to the Spark limits; you only pay beyond them
- Set a **budget alert** at $50/month to avoid surprise bills

### Gemini AI Cost Control

- `gemini-2.5-flash` is used for cheap tasks (classification, memory extraction, environment audit)
- `gemini-2.5-pro` is only called for full coaching sessions
- Free users do not trigger Gemini calls (no AI debrief)
- Rate limit of 20 requests/hour per user prevents runaway costs

---

## Appendix: Key PRD Constants

These values must never be approximated in code. They are specified in the PRD and build guide.

| Constant | Correct value |
|---|---|
| Pro price | $12/month, $89/year |
| Elite price | $29/month, $219/year |
| Cookie Jar title limit | 80 characters |
| Cookie Jar description limit | 500 characters |
| Cookie Jar XP | 25 XP |
| Daily check-in min chars | 50 characters |
| Onboarding mirror min chars | 100 characters |
| Habit completion XP | 20 XP |
| Check-in submission XP | 30 XP |
| Environment item XP | 50 XP |
| Full onboarding XP | 200 XP |
| Forge Score rounding | `floor()` always — never `Math.round()` |
| Streak Consistency weight | 40% (max 400 pts) |
| Checkin Honesty Depth weight | 20% (max 200 pts) |
| Challenge Completion weight | 20% (max 200 pts) |
| Cookie Jar Growth weight | 10% (max 100 pts) |
| Environment Improvements weight | 10% (max 100 pts) |
| Level 1 (Raw) XP threshold | 0 XP |
| Level 2 (Tempered) XP threshold | 500 XP |
| Level 3 (Forged) XP threshold | 1,500 XP |
| Level 4 (Hardened) XP threshold | 3,500 XP |
| Level 5 (Unbreakable) XP threshold | 7,500 XP |
| Level 6 (Legendary) XP threshold | 15,000 XP |
| 40% Rule modal heading | `YOUR MIND IS LYING TO YOU` |
| mood_signal values | `excusing`, `deflecting`, `owning`, `crushing` |
| Session type for daily check-in | `daily_checkin` |
| Forge Score animation duration | 500ms |
| Cron batch size (weekly report) | 50 users per batch |
| Session cookie name | `mf_session` |
| Session cookie max age | 14 days |
| AI streaming rate limit | 20 requests/hour per user |

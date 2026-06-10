# PRD: MindForge
**Version:** 1.0
**Date:** June 9, 2026
**Status:** Ready for Development

---

## 1. EXECUTIVE SUMMARY

MindForge is a dark-mode, AI-powered web application that uses neuroscience-backed behavioral frameworks and persistent AI coaching memory to help ambitious adults break bad habits, build extreme discipline, and consciously rewire their brains into a new identity. It serves high-achieving professionals, entrepreneurs, and students aged 22–45 who are frustrated by gentle habit apps that coddle rather than challenge. The core problem MindForge solves is that 52% of users abandon wellness apps within weeks because existing tools reward participation instead of results — MindForge is the first platform to combine honest AI accountability, the neuroscience of neuroplasticity and dopamine regulation, and the behavioral philosophy of peak performers like David Goggins into a single, cohesive product.

---

## 2. PROBLEM STATEMENT

### 2.1 Current Pain Points

- **Participation trophies replace accountability:** Every major habit app (Habitica, Fabulous, Streaks, Finch) rewards effort over results. Users receive encouragement even when they fail, which trains the brain to tolerate failure as acceptable — the opposite of neurological habit formation.
- **No persistent AI relationship exists:** AI integrations in wellness apps are superficial — generic reminders, not coaches. No app builds a longitudinal memory of the user's patterns, triggers, past victories, and identity to deliver genuinely personalized coaching.
- **Surface motivation collapses quickly:** Apps do not help users excavate their "deeper why" — the identity-level purpose that sustains discipline when mood and motivation fail. Without this anchor, streaks break and users churn.
- **Dopamine and environment design are ignored:** The neuroscience is clear — environment design precedes willpower, and dopamine baseline degradation from hyper-stimulation makes real life feel unrewarding. No app architects its product around these mechanisms.
- **No system for callousing the mind:** Peak performance research shows that intentional, graduated discomfort builds mental toughness. No app operationalizes this. They avoid discomfort entirely.

### 2.2 Proposed Solution

MindForge gives users a system to fight back against the neural rewiring happening to them passively. On day one, users face a raw Accountability Mirror — a blank text field with no prompts, where they write the honest truth about their life. An AI Forge Coach reads it and responds truthfully. Over the following days and weeks, the coach learns the user's deepest why, their past victories (stored in a Cookie Jar), their behavioral patterns and triggers, and their identity declarations — building an irreplaceable AI coaching relationship grounded in memory and science. The platform enforces honest habit logging (completed or missed — no skip option), a Forge Score that drops when commitments are broken, progressive Callousing Challenges that expand mental toughness, and a 40% Rule Engine that triggers when users are about to quit. The result is the first app that treats users like capable adults and gives them a system that actually matches how behavior change works neurologically.

---

## 3. GOALS & SUCCESS METRICS

### 3.1 Primary Goals

- [ ] Achieve 2,000 Monthly Active Users within 6 months of launch
- [ ] Reach $10,000 MRR within 12 months of public launch
- [ ] Sustain Day-30 retention of 45% or higher (vs. industry average of ~20% for habit apps)
- [ ] Achieve Day-66 retention of 30% or higher (the neural consolidation milestone)
- [ ] Maintain a Net Promoter Score (NPS) of 55 or above by Month 6

### 3.2 Success Metrics (KPIs)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Monthly Active Users (MAU) | 2,000 by Month 6 | PostHog active user count |
| Monthly Recurring Revenue (MRR) | $10,000 by Month 12 | Lemon Squeezy dashboard |
| Free-to-Pro Conversion Rate | 5–7% | (Paying users / total signups) × 100 |
| Day-30 Retention | 45% | PostHog cohort retention report |
| Day-66 Retention | 30% | PostHog cohort retention report |
| Daily Check-In Rate (actives) | 60% | Check-ins submitted / DAU |
| AI Debrief Completion Rate | 80% of check-ins | Coaching sessions created / check-ins submitted |
| NPS | 55+ | In-app survey at Day 14 and Day 66 |
| Weekly Neural Report Open Rate | 55%+ | Resend analytics |
| Average Forge Score at Day 30 | 350+ | Supabase aggregate query |

---

## 4. TARGET USERS

### 4.1 Primary User Persona

- **Name:** Marcus — "The Striving Achiever"
- **Role:** 28-year-old software engineer and part-time entrepreneur. Consumes Huberman Lab, Goggins, and Jocko podcasts daily. Reads atomic habits-type books but doesn't finish them.
- **Goals:** Build consistent morning workouts, eliminate doom-scrolling before bed, finish his side project, feel like he is actually becoming the person he talks about wanting to be.
- **Frustrations:** Has downloaded and abandoned 6 habit apps. They all feel the same — streaks, cute animations, "you got this!" messages. Nothing holds him accountable. He knows what to do but can't stay consistent. He feels embarrassed by the gap between his self-image and his actual behavior.
- **Tech Level:** Advanced — uses web apps, comfortable with AI tools, expects fast, polished UI.

### 4.2 Secondary User

**Priya — "The Rock-Bottom Rebuilder":** 34-year-old woman 90 days out of a burnout-induced leave of absence. She was high-performing but crashed. She needs radical accountability, not gentle wellness. She's tried therapy (helpful but slow), journaling (abandoned), and meditation apps (too soft). She needs something that matches the severity of her situation — a system that will tell her the truth and help her forge a new self without letting her slide.

---

## 5. TECH STACK & ARCHITECTURE

### 5.1 Recommended Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | Next.js 14 (App Router) + TypeScript | Full-stack, SSR/SSG, streaming support, edge-ready, best DX for solo founders |
| Styling | Tailwind CSS + shadcn/ui (customized) | Rapid dark-mode UI with accessible components, no design system overhead |
| API Layer | tRPC | End-to-end type safety between Next.js server and client — eliminates REST boilerplate |
| Database | Supabase (PostgreSQL + pgvector) | Managed Postgres with built-in auth, RLS, realtime, and vector similarity search |
| Auth | Supabase Auth | Magic link + Google OAuth, JWT sessions, Row Level Security policies |
| AI — Coaching | Google Gemini 2.5 Pro | Best reasoning + long context for nuanced coaching conversations and structured output |
| AI — Light Tasks | Google Gemini 2.5 Flash | Fast, cheap for memory extraction, mood classification, short AI tasks |
| AI — Embeddings | Google text-embedding-004 | Embeds user memories and cookie jar entries for RAG retrieval via pgvector |
| Payments | Lemon Squeezy | Merchant of Record — handles global VAT/GST/sales tax automatically, no tax registration needed |
| Email | Resend + React Email | Developer-first transactional email; weekly neural report delivery |
| Hosting | Vercel | Zero-config Next.js deployment, edge functions, cron jobs (for weekly reports) |
| Analytics | PostHog | Open-source, GDPR-friendly, cohort retention, funnel analysis, feature flags |
| Monitoring | Sentry | Error tracking and performance monitoring |

### 5.2 Project Structure

```
mindforge/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx          # Login page (magic link + Google)
│   │   └── callback/
│   │       └── route.ts          # Supabase auth callback
│   ├── (onboarding)/
│   │   ├── mirror/
│   │   │   └── page.tsx          # Step 1: Accountability Mirror
│   │   ├── why/
│   │   │   └── page.tsx          # Step 2: Why Excavation (multi-turn AI chat)
│   │   └── environment/
│   │       └── page.tsx          # Step 3: Environment Audit questionnaire
│   ├── (app)/
│   │   ├── layout.tsx            # App shell (sidebar, nav)
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Main dashboard
│   │   ├── habits/
│   │   │   ├── page.tsx          # Habit list + completion grid
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Single habit detail
│   │   ├── checkin/
│   │   │   └── page.tsx          # Daily Accountability Mirror check-in
│   │   ├── coach/
│   │   │   └── page.tsx          # AI Forge Coach conversation view
│   │   ├── cookie-jar/
│   │   │   └── page.tsx          # Victory archive
│   │   ├── challenges/
│   │   │   └── page.tsx          # Callousing Challenge library
│   │   ├── analytics/
│   │   │   └── page.tsx          # Forge Score history + habit analytics
│   │   ├── settings/
│   │   │   └── page.tsx          # Account, billing, preferences
│   │   └── upgrade/
│   │       └── page.tsx          # Upgrade to Pro/Elite
│   ├── api/
│   │   ├── trpc/
│   │   │   └── [trpc]/
│   │   │       └── route.ts      # tRPC handler
│   │   ├── coach/
│   │   │   └── stream/
│   │   │       └── route.ts      # SSE streaming endpoint for AI responses
│   │   ├── billing/
│   │   │   ├── create-checkout/
│   │   │   │   └── route.ts      # Lemon Squeezy checkout creation
│   │   │   └── webhook/
│   │   │       └── route.ts      # Lemon Squeezy webhook handler
│   │   └── cron/
│   │       └── weekly-report/
│   │           └── route.ts      # Vercel cron: Sunday neural report generation
│   └── layout.tsx                # Root layout (fonts, metadata)
│
├── components/
│   ├── ui/                       # shadcn/ui base components (Button, Card, Input, etc.)
│   ├── forge/                    # MindForge-specific components
│   │   ├── ForgeScore.tsx        # Forge Score display widget
│   │   ├── HabitGrid.tsx         # Calendar-style habit completion grid
│   │   ├── HabitCard.tsx         # Individual habit card with complete/miss buttons
│   │   ├── CheckInForm.tsx       # Daily check-in textarea + submit
│   │   ├── CoachMessage.tsx      # AI coach message bubble (streaming)
│   │   ├── CookieJarEntry.tsx    # Victory archive entry card
│   │   ├── ChallengeCard.tsx     # Callousing challenge card
│   │   ├── XPBar.tsx             # XP and level progress bar
│   │   ├── BadgeDisplay.tsx      # Badge grid/showcase
│   │   ├── RuleForty.tsx         # 40% Rule intervention overlay
│   │   └── WeeklyReport.tsx      # In-app weekly neural report view
│   └── layout/
│       ├── Sidebar.tsx           # App navigation sidebar
│       ├── Header.tsx            # Top bar with Forge Score
│       └── MobileNav.tsx         # Bottom nav for mobile
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Supabase browser client
│   │   ├── server.ts             # Supabase server client (RSC)
│   │   └── middleware.ts         # Auth middleware + tier gating
│   ├── gemini/
│   │   ├── client.ts             # Gemini API client setup
│   │   ├── coach.ts              # Forge Coach prompt builder + streaming
│   │   ├── memory.ts             # Memory extraction agent (Flash)
│   │   ├── embeddings.ts         # text-embedding-004 wrapper
│   │   └── prompts.ts            # All system prompts (versioned)
│   ├── forge-score.ts            # Forge Score calculation logic
│   ├── streak.ts                 # Streak calculation + cache update
│   ├── xp.ts                     # XP award + level-up logic
│   ├── badges.ts                 # Badge eligibility checks
│   └── lemonsqueezy.ts           # Lemon Squeezy API + webhook verification
│
├── server/
│   └── trpc/
│       ├── router.ts             # Root tRPC router
│       └── routers/
│           ├── habits.ts         # Habit CRUD + completion
│           ├── checkins.ts       # Check-in submit + fetch
│           ├── cookiejar.ts      # Cookie jar CRUD
│           ├── challenges.ts     # Challenge library + user progress
│           ├── analytics.ts      # Forge Score history, habit stats
│           ├── user.ts           # Profile, onboarding status
│           └── pods.ts           # Accountability pods (P1)
│
├── emails/
│   └── WeeklyNeuralReport.tsx    # React Email template
│
├── types/
│   └── index.ts                  # Shared TypeScript types
│
├── middleware.ts                 # Next.js middleware (auth redirect + tier check)
├── .env.local                    # Local environment variables
├── vercel.json                   # Cron job configuration
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql  # Full database schema migration
```

### 5.3 Key Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key (server-only)

# Google Gemini AI
GEMINI_API_KEY=your_google_ai_studio_api_key

# Lemon Squeezy
LEMONSQUEEZY_API_KEY=your_lemonsqueezy_api_key
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_signing_secret
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID=variant_id_for_pro_monthly
LEMONSQUEEZY_PRO_ANNUAL_VARIANT_ID=variant_id_for_pro_annual
LEMONSQUEEZY_ELITE_MONTHLY_VARIANT_ID=variant_id_for_elite_monthly
LEMONSQUEEZY_ELITE_ANNUAL_VARIANT_ID=variant_id_for_elite_annual

# Resend (Email)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=forge@mindforge.app

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Sentry
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# App
NEXT_PUBLIC_APP_URL=https://mindforge.app (or http://localhost:3000 locally)
CRON_SECRET=random_secret_to_authenticate_vercel_cron_calls
```

---

## 6. FEATURES & REQUIREMENTS

---

### Feature 1: Authentication & Session Management
- **Priority:** P0
- **User Story:** As a new visitor, I want to sign up with my email or Google account so that I can access MindForge securely without creating a password.
- **Acceptance Criteria:**
  - [ ] User can request a magic link by entering their email address; link arrives within 60 seconds
  - [ ] User can authenticate via Google OAuth (one-click)
  - [ ] Authenticated session persists for 7 days; silent refresh via Supabase JWT
  - [ ] Unauthenticated users attempting to access any `/app/*` route are redirected to `/login`
  - [ ] Users who have not completed onboarding are redirected to `/onboarding/mirror` after login
  - [ ] Users who have completed onboarding are redirected to `/dashboard` after login
- **UI Notes:** Login page uses full dark background (#0A0A0A). MindForge logotype centered. Two options: "Continue with Email" (text input + submit) and "Continue with Google" (icon button). No password field. Tag line below: *"Rewire your brain. Forge your identity."*
- **API/Logic Notes:**
  - Magic link sent via Supabase Auth `signInWithOtp`. Callback route `/api/auth/callback` exchanges code for session.
  - Google OAuth via Supabase Auth `signInWithOAuth`. Same callback route.
  - On first successful login: create `users` record if not exists (via Supabase trigger or server action).
  - Middleware (`middleware.ts`) reads Supabase session cookie on every request. Redirects unauthenticated requests to `/login`. Checks `onboarding_complete` field; redirects incomplete users to onboarding.
- **Dependencies:** Supabase Auth, middleware.ts

---

### Feature 2: Onboarding — Step 1: Accountability Mirror
- **Priority:** P0
- **User Story:** As a new user, I want to write a raw, honest assessment of my current life before anything else so that I begin my journey with radical self-awareness and receive an honest AI reflection.
- **Acceptance Criteria:**
  - [ ] Step 1 is shown immediately after first login, before dashboard access
  - [ ] Page shows only a large blank textarea (no character limit, no sub-prompts), a headline ("Face the Mirror"), and a brief instruction: "Write the truth about where you are right now. Your failures. Your excuses. Your wasted potential. Don't filter it."
  - [ ] Submit button disabled until at least 100 characters are entered
  - [ ] On submit: AI debrief streams into the page below the submitted text (SSE), starting within 3 seconds
  - [ ] AI response is 150–300 words, honest and direct — identifies at least one specific excuse pattern if present, acknowledges real honesty if present, ends with one question
  - [ ] After reading the AI response, user clicks "I'm Ready — Continue" to proceed to Step 2
  - [ ] Raw text + AI response stored in `daily_checkins` table with `onboarding_mirror = true` flag
- **UI Notes:** Dark full-screen layout. Textarea fills 60% of viewport height. Placeholder text fades on focus. "Submit to the Mirror" CTA button in molten orange (#FF6B2B). AI response appears below with a thin orange left-border accent. "Continue" button appears only after streaming completes.
- **API/Logic Notes:**
  - POST to `/api/coach/stream` with `session_type: 'onboarding_mirror'` and raw text.
  - System prompt instructs Forge Coach to be truthful, not to soften, and to end with one probing question.
  - Do NOT extract long-term memories from this session (it's the starting baseline, not a coaching session).
  - `onboarding_step` field on `users` table updated to `'why'` on completion.
- **Dependencies:** Feature 1 (Auth), Gemini 2.5 Pro streaming, SSE endpoint

---

### Feature 3: Onboarding — Step 2: Why Excavation
- **Priority:** P0
- **User Story:** As a new user, I want to have a guided AI conversation that uncovers my deepest motivation so that I have an identity-level anchor that sustains my discipline when surface motivation fails.
- **Acceptance Criteria:**
  - [ ] Page shows a conversational chat interface between user and Forge Coach
  - [ ] Coach opens with: "What's the one thing you want most to change or achieve?"
  - [ ] Coach uses the 5-Whys method across 4–6 turns, drilling from surface goal to identity anchor
  - [ ] After reaching identity level, coach presents a proposed "Why Statement" ("You want to be the man your children look up to — someone who didn't quit when it was hard.")
  - [ ] User can accept the statement or request a revision (up to 2 revisions)
  - [ ] Accepted Why Statement is stored in `users.why_statement` field
  - [ ] Coach then asks for one Identity Declaration: "I am someone who..." — user types it; stored in `users.identity_declaration`
  - [ ] "Identity Locked" badge awarded on completion
  - [ ] `onboarding_step` updated to `'environment'` on completion
- **UI Notes:** Chat-style UI with coach messages on the left (steel blue accent), user inputs on the right. Input field at bottom. "Send" button. No back button — this is a commitment. Final Why Statement displayed in a prominent card with orange border before acceptance.
- **API/Logic Notes:**
  - Each turn is a separate POST to `/api/coach/stream` with `session_type: 'why_excavation'`
  - Full conversation history passed in each request to maintain context
  - Max 8 turns. If user hasn't reached identity level by turn 6, coach synthesizes from available information.
  - Why statement and identity declaration saved via tRPC `user.updateProfile` mutation
- **Dependencies:** Feature 2 (Onboarding Step 1), Gemini 2.5 Pro streaming

---

### Feature 4: Onboarding — Step 3: Environment Audit
- **Priority:** P0
- **User Story:** As a new user, I want to assess my physical and digital environment so that I receive specific, science-backed recommendations on how to redesign it to make my goals easier and my bad habits harder.
- **Acceptance Criteria:**
  - [ ] 12-question structured questionnaire covering: phone location at night, social media apps on home screen, workspace setup, junk food accessibility, alarm placement, reading material visibility, drinking water availability, gym bag location, TV in bedroom (y/n), notification settings, sleep environment, and social/environmental triggers
  - [ ] Each question is multiple choice (3–4 options)
  - [ ] On completion, Gemini 2.5 Pro generates a personalized 5–8 item action plan with specific changes ("Move your phone charger out of your bedroom tonight. Put it in the kitchen.")
  - [ ] Action plan stored in `users.environment_audit` (JSONB)
  - [ ] User can mark each recommendation as "Done" (tracked in the same field)
  - [ ] Completing ≥3 recommendations awards XP (50 XP each) and contributes to Forge Score (environment component)
  - [ ] `onboarding_complete` set to `true` after this step; user redirected to dashboard
- **UI Notes:** Card-based questionnaire, one question per screen with a progress bar (step 3 of 12). Back navigation allowed. Recommendations displayed as a numbered list with checkboxes. Each item has a "Mark Done" button.
- **API/Logic Notes:**
  - Questionnaire answers POSTed to tRPC `user.submitEnvironmentAudit` which calls Gemini 2.5 Flash to generate recommendations (structured JSON output)
  - Recommendations returned as `{ item: string, category: string, done: boolean }[]`
  - XP events created for each completed recommendation via tRPC `user.markEnvironmentItemDone`
- **Dependencies:** Features 2–3 (Onboarding Steps 1–2), Gemini 2.5 Flash

---

### Feature 5: Habit Forge Tracker
- **Priority:** P0
- **User Story:** As a user, I want to create and honestly track my daily habits so that I have a clear record of whether I am actually doing what I say I'll do.
- **Acceptance Criteria:**
  - [ ] User can create a habit with: name (required, max 60 chars), category (health / mind / avoid / perform), habit type (build or avoid), target frequency (daily or specific weekdays — multi-select Mon–Sun)
  - [ ] Free tier: maximum 3 active habits enforced at creation time with upgrade prompt
  - [ ] Pro tier: unlimited active habits
  - [ ] Each active habit appears on the dashboard with today's status: Pending / Completed / Missed
  - [ ] Two action buttons per habit: "Completed" (green) and "Missed" (red). No skip, no grace, no undo after 11:59pm local time.
  - [ ] Completion is scoped to the user's local date (sent from client, stored as `local_date DATE` — never UTC datetime)
  - [ ] Completing or missing a habit triggers: streak update, XP award (completion only: 20 XP), Forge Score recalculation
  - [ ] Missing a habit with a current streak ≥7 days triggers the 40% Rule Engine (Feature 9)
  - [ ] Habit detail page shows: full completion history as a calendar grid (last 90 days), current streak, longest streak, completion rate %
  - [ ] User can edit (name, category, frequency) or archive (soft delete, `is_active = false`) a habit
  - [ ] Archived habits are excluded from all score calculations
- **UI Notes:** Habit cards on dashboard. Sharp rectangular cards on dark background (#111111). Completed state: green left border + checkmark. Missed state: red left border + X. Pending state: orange left border + circle. "Completed" / "Missed" buttons are large enough for thumb tap. Calendar grid on detail page uses color fill: green (completed), red (missed), dark grey (pending/future), charcoal (no data).
- **API/Logic Notes:**
  - tRPC `habits.list`, `habits.create`, `habits.update`, `habits.archive`
  - tRPC `habits.logCompletion(habitId, localDate, completed: boolean)`
  - On `logCompletion`: upsert `habit_completions`, recalculate streak (read last 60 days of completions, find consecutive run ending on localDate), update `habit_streaks` cache, award XP if completed, call `recalculateForgeScore(userId)`
  - Edge case: if user logs a completion for a past date (allowed up to 24 hours prior only), streak recalculation must handle gaps correctly
  - Streak algorithm: query `habit_completions` ordered by `local_date DESC` where `completed = true`. Walk back from today counting consecutive days. Stop on first gap.
- **Dependencies:** Feature 1 (Auth), Feature 13 (Forge Score), Feature 15 (Gamification)

---

### Feature 6: Daily Accountability Mirror (Check-In)
- **Priority:** P0
- **User Story:** As a user, I want to write an honest daily check-in and receive an AI coaching response that doesn't coddle me so that I start each day with radical self-awareness and external accountability.
- **Acceptance Criteria:**
  - [ ] One check-in per user per local date (enforced via unique constraint on `daily_checkins(user_id, local_date)`)
  - [ ] If check-in already submitted today, page shows the submitted text + AI response (read-only)
  - [ ] Free tier: check-in text stored, no AI debrief generated (message shown: "Upgrade to Pro to unlock your AI debrief")
  - [ ] Pro tier: AI debrief streams in within 3 seconds of submission
  - [ ] AI debrief is 150–250 words. Persona: honest, direct, non-sycophantic, neuroscience-aware. It MUST: identify at least one excuse or deflection pattern if present; acknowledge genuine wins without over-praising; surface one specific observation; end with one concrete challenge or question for the day.
  - [ ] AI never uses phrases: "Great job!", "You're doing amazing!", "I'm proud of you", or any emoji
  - [ ] After AI response streams, two metadata fields extracted via Gemini 2.5 Flash (separate non-streaming call): `honesty_score` (1–10 integer) and `mood_signal` (one of: 'excusing' / 'deflecting' / 'owning' / 'crushing')
  - [ ] If `mood_signal` is 'excusing' or 'deflecting': 40% Rule Engine triggered automatically (overlay shown)
  - [ ] Completing a check-in awards 30 XP and triggers Forge Score recalculation
  - [ ] Missed check-in (no submission by 11:59pm local) reduces check-in streak counter and Forge Score
- **UI Notes:** Full-screen dark page. Large heading: "The Mirror — [Today's Date]". Textarea with placeholder: "What actually happened? Be honest." Character count shown at bottom right. "Submit to the Mirror" button (orange). After submission: submitted text displayed in a muted card above; AI response streams below with a blinking cursor until complete; honesty score shown as a small badge ("Honesty: 7/10"). 40% Rule overlay appears as a full-screen dark modal if triggered.
- **API/Logic Notes:**
  - tRPC `checkins.submit(text: string, localDate: string)`
  - Streams AI response via `/api/coach/stream` (SSE) with `session_type: 'daily_checkin'`
  - After streaming complete: POST to `/api/coach/classify` (non-streaming Gemini 2.5 Flash call) to extract `honesty_score` and `mood_signal`
  - tRPC `checkins.updateMetadata(checkinId, honestyScore, moodSignal)` stores classification
  - tRPC `checkins.getToday(localDate)` returns today's check-in or null
- **Dependencies:** Feature 1 (Auth), Feature 5 (Habit Tracker — streak data injected into coach context), Feature 9 (40% Rule Engine), Feature 13 (Forge Score), Feature 15 (Gamification)

---

### Feature 7: AI Forge Coach (Persistent Memory System)
- **Priority:** P0
- **User Story:** As a Pro user, I want an AI coach that remembers everything about me across sessions so that its coaching gets more specific and irreplaceable the longer I use the platform.
- **Acceptance Criteria:**
  - [ ] Every AI response (check-in debrief, 40% intervention, direct chat) uses the full memory-enriched system prompt
  - [ ] System prompt construction (before every request) must include: Forge Coach persona instructions, user's `why_statement`, user's `identity_declaration`, user's current Forge Score and level, user's active habit names and current streaks, top-3 Cookie Jar entries (retrieved semantically), top-5 long-term memories (retrieved by cosine similarity to current input, using pgvector)
  - [ ] After every coaching session (check-in debrief or direct conversation): run Gemini 2.5 Flash memory extraction to identify new atomic facts, embed them with text-embedding-004, upsert to `user_memories` table
  - [ ] Memory facts are typed: 'preference' / 'trigger' / 'victory' / 'fear' / 'identity' / 'pattern'
  - [ ] Pro/Elite users can access a direct chat interface with the Forge Coach (not just daily debriefs)
  - [ ] Free users see a locked state with: "Your coach is waiting. Unlock with Pro."
  - [ ] All AI responses stream in real time via Server-Sent Events
  - [ ] Forge Coach never references being an AI unless directly asked
  - [ ] Coach intensity is configurable in settings: "Hard Truth" (default) / "Firm but Kind" — affects system prompt tone
- **UI Notes:** `/coach` page shows a chat interface. Coach messages left-aligned with a small forge icon. User messages right-aligned. Input fixed at bottom. "Send" button (orange). Streaming response shows blinking cursor. Memory retrieval is invisible to user — no "I'm looking up your memories" message.
- **API/Logic Notes:**
  - `/api/coach/stream` route (POST, returns SSE stream):
    1. Authenticate user, verify Pro/Elite tier
    2. Embed incoming message with text-embedding-004
    3. Query pgvector: `SELECT content FROM user_memories WHERE user_id = $1 ORDER BY embedding <=> $2 LIMIT 5`
    4. Query pgvector: `SELECT title, description FROM cookie_jar_entries WHERE user_id = $1 ORDER BY embedding <=> $2 LIMIT 3`
    5. Fetch user profile (why, identity, level, Forge Score)
    6. Fetch active habits + streaks
    7. Construct system prompt from all above
    8. Call Gemini 2.5 Pro `generateContentStream`, pipe to SSE response
  - After stream ends: call Gemini 2.5 Flash with full exchange, extract JSON array of memory facts, embed each, upsert to `user_memories`
  - Store full session (messages JSONB) in `coaching_sessions` table
- **Dependencies:** Feature 1 (Auth), Feature 5 (Habits), Feature 10 (Cookie Jar), Feature 13 (Forge Score), Supabase pgvector, Gemini API

---

### Feature 8: Forge Score
- **Priority:** P0
- **User Story:** As a user, I want a single score that honestly reflects my behavioral integrity so that I feel the real weight of my choices — both the wins and the failures.
- **Acceptance Criteria:**
  - [ ] Forge Score is an integer between 0 and 1000, displayed prominently on the dashboard and in the app header
  - [ ] Score is composed of 5 weighted components:
    - Streak Consistency (40%): Average of (current_streak / max(longest_streak, 7)) across all active habits, capped at 1.0. Range: 0–400 points.
    - Check-in Honesty Depth (20%): Rolling 14-day average of `honesty_score` / 10. Range: 0–200 points.
    - Challenge Completion (20%): (Challenges completed this month / max(challenges available, 1)) × 200. Range: 0–200 points.
    - Cookie Jar Growth (10%): min(cookie_jar_entries_count / 20, 1) × 100. Range: 0–100 points.
    - Environment Improvements (10%): (Environment audit items marked done / total items) × 100. Range: 0–100 points.
  - [ ] Score recalculated and stored on every: habit completion/miss, check-in submission, challenge completion, cookie jar entry, environment item marked done
  - [ ] Historical Forge Score stored in `forge_score_history` table (one record per recalculation) for trend chart
  - [ ] Score displayed with level label (Raw / Tempered / Forged / Hardened / Unbreakable / Legendary)
  - [ ] Score animates on update (count-up animation, 500ms)
  - [ ] Score never rounds up — always floor(). Cannot reach 1000 without perfect execution across all 5 components.
- **UI Notes:** Dashboard hero: large Forge Score number in white, level label below in muted orange. Small delta indicator ("+12 today" in green, "-8 today" in red). Clicking score opens a breakdown modal showing each component as a progress bar.
- **API/Logic Notes:**
  - `lib/forge-score.ts` exports `recalculateForgeScore(userId: string): Promise<number>`
  - Function fetches all required data in parallel (Promise.all), computes formula, updates `users.forge_score`, inserts into `forge_score_history`
  - tRPC `analytics.forgeScoreHistory(days: number)` returns timeseries for chart
- **Dependencies:** Feature 5 (Habits), Feature 6 (Check-ins), Feature 10 (Cookie Jar), Feature 11 (Challenges), Feature 4 (Environment Audit)

---

### Feature 9: 40% Rule Engine
- **Priority:** P0
- **User Story:** As a user, I want the app to challenge me when my mind signals it wants to quit so that I learn to push past the mental stop and discover my real capacity.
- **Acceptance Criteria:**
  - [ ] Automatically triggered when: (a) a habit with a streak ≥7 is marked "Missed", OR (b) check-in `mood_signal` is 'excusing' or 'deflecting'
  - [ ] User can manually trigger from any page via a persistent "40% Rule" button in the navigation
  - [ ] When triggered: a full-screen dark modal overlay appears with the heading "YOUR MIND IS LYING TO YOU" and a streaming AI intervention (150–200 words)
  - [ ] Intervention is personalized: references the specific broken habit (if auto-triggered by habit miss) or check-in pattern (if triggered by mood signal), pulls from Cookie Jar semantically, ends with one concrete "next step right now"
  - [ ] User has two options: "I'll take that step" (closes modal, awards 15 XP) or "I still can't" (closes modal, no penalty but no XP)
  - [ ] Both choices are logged in `rule_forty_events` table with timestamp and choice
  - [ ] No more than 3 auto-triggers per day (prevents flooding)
- **UI Notes:** Modal: pure black (#000000) background. Heading in white. Subheading in orange: "You've only used 40% of your capacity." AI text streams in below. Two buttons at bottom: "I'll take that step" (full orange) / "I still can't" (ghost/outline). Cannot be dismissed by clicking outside or pressing Escape — only via the two buttons.
- **API/Logic Notes:**
  - Auto-trigger: after `habits.logCompletion` with `completed = false` and streak ≥7, emit event to frontend (via tRPC subscription or response flag)
  - Auto-trigger: after `checkins.updateMetadata` if `moodSignal` is 'excusing'/'deflecting', response flag triggers modal
  - Manual trigger: client-side button calls `/api/coach/stream` with `session_type: 'forty_percent_rule'`
  - System prompt for 40% Rule: inject context of what triggered it, most relevant Cookie Jar entry, current Forge Score, one specific action they can take in the next 5 minutes
  - `rule_forty_events` table: `user_id, triggered_by ('auto_habit'|'auto_checkin'|'manual'), habit_id (nullable), choice ('took_step'|'declined'), created_at`
- **Dependencies:** Feature 5 (Habits), Feature 6 (Check-in), Feature 7 (AI Coach), Feature 10 (Cookie Jar)

---

### Feature 10: Cookie Jar (Victory Archive)
- **Priority:** P0
- **User Story:** As a user, I want to log my past victories so that I have a fuel reserve my AI coach can draw from when I'm about to give up.
- **Acceptance Criteria:**
  - [ ] User can add a Cookie Jar entry with: title (required, max 80 chars), description (required, max 500 chars), optional date of victory
  - [ ] Free tier: max 5 entries enforced at creation with upgrade prompt
  - [ ] Pro tier: unlimited entries
  - [ ] Each entry is embedded with text-embedding-004 immediately on save; embedding stored in `cookie_jar_entries.embedding` (vector(768))
  - [ ] Entries displayed as a grid of cards sorted by most recently added
  - [ ] User can edit or delete their own entries
  - [ ] Adding a cookie jar entry awards 25 XP
  - [ ] Adding 10th entry awards "Cookie Jar Founder" badge
  - [ ] On `/cookie-jar` page: search bar (semantic search via embedding similarity) to find relevant victories
- **UI Notes:** Dark cards with an orange corner accent. Title in white bold. Description in muted grey. Date badge if provided. "Add Victory" button (orange). Search bar at top of page with placeholder "Search your victories..." — results update on Enter or 500ms debounce.
- **API/Logic Notes:**
  - tRPC `cookiejar.add(title, description, dateOfVictory?)`: saves entry, calls `lib/gemini/embeddings.ts` to embed `${title}. ${description}`, stores vector
  - tRPC `cookiejar.list()`: returns all entries ordered by `created_at DESC`
  - tRPC `cookiejar.search(query: string)`: embeds query, queries pgvector `ORDER BY embedding <=> $queryEmbedding LIMIT 5`
  - tRPC `cookiejar.delete(id)`: deletes entry (RLS ensures ownership)
  - Google text-embedding-004 produces 768-dimension vectors. pgvector column must be `vector(768)`.
- **Dependencies:** Feature 1 (Auth), Feature 15 (Gamification), Gemini embeddings

---

### Feature 11: Callousing Challenges
- **Priority:** P0
- **User Story:** As a user, I want access to a library of graduated discomfort challenges so that I systematically build mental toughness by doing hard things on purpose.
- **Acceptance Criteria:**
  - [ ] 20 challenges pre-seeded in the `challenges` table at launch (see seed data section)
  - [ ] Each challenge has: title, description (what to do + why it builds mental toughness), category (cold / screen / physical / fast / social), difficulty (1–5), duration_minutes, xp_reward
  - [ ] Free tier: can view all challenges but can only activate the 5 difficulty-1 challenges (others show lock icon)
  - [ ] Pro tier: full library access
  - [ ] User can have max 1 active challenge at a time
  - [ ] Activating a challenge: creates `user_challenges` record with `status = 'active'`, `started_at = now()`
  - [ ] Challenge expires (auto-fails) if not completed within `duration_minutes × 3` (i.e., triple the stated time is the deadline window)
  - [ ] Completing a challenge: user clicks "Mark Complete" → writes a mandatory reflection (min 50 chars) → XP awarded → badge eligibility checked → `status = 'completed'`
  - [ ] Completing 7 cold-category challenges in lifetime awards "Cold Mind" badge
  - [ ] Completed challenges can be repeated (no cooldown in v1)
  - [ ] Challenge history visible on profile: list of completed challenges with dates and reflections
- **UI Notes:** Card grid layout. Difficulty shown as 1–5 filled squares (like signal bars). Category shown as a tag. Duration shown in minutes. XP reward shown with a bolt icon. "Activate" button. Locked challenges show a padlock icon with "Pro" badge. Active challenge shown as a pinned card at the top with a live timer countdown.
- **API/Logic Notes:**
  - tRPC `challenges.list()`: returns all with user's status per challenge
  - tRPC `challenges.activate(challengeId)`: creates `user_challenges` record; fails if user already has active challenge
  - tRPC `challenges.complete(userChallengeId, reflection)`: validates reflection ≥50 chars, sets status/timestamps, awards XP, calls badge check, triggers Forge Score recalculation
  - Seed data (20 challenges) included in migration SQL file
- **Dependencies:** Feature 1 (Auth), Feature 15 (Gamification), Feature 13 (Forge Score)

---

### Feature 12: Lemon Squeezy Billing & Tier Gating
- **Priority:** P0
- **User Story:** As a user, I want to upgrade to Pro or Elite so that I can unlock the full AI coaching, unlimited habits, and all challenges.
- **Acceptance Criteria:**
  - [ ] Three tiers: Free, Pro ($12/month or $89/year), Elite ($29/month or $219/year)
  - [ ] Upgrade page at `/upgrade` shows a comparison table of all three tiers
  - [ ] Clicking "Upgrade to Pro" or "Upgrade to Elite" calls `/api/billing/create-checkout` which creates a Lemon Squeezy checkout URL and redirects user to it
  - [ ] On successful payment: Lemon Squeezy sends `subscription_created` webhook to `/api/billing/webhook`
  - [ ] Webhook verified via HMAC signature using `LEMONSQUEEZY_WEBHOOK_SECRET`
  - [ ] Webhook upserts `subscriptions` table with: `lemonsqueezy_customer_id`, `lemonsqueezy_subscription_id`, `tier`, `status`, `current_period_end`
  - [ ] `users.tier` field updated immediately after subscription sync
  - [ ] Feature gating: Next.js middleware checks `users.tier` before serving any page under `/app/*`. Gated pages redirect to `/upgrade` with `?feature=X` param showing what they tried to access
  - [ ] Cancellation: Lemon Squeezy `subscription_cancelled` webhook sets `status = 'cancelled'`; user retains Pro/Elite access until `current_period_end`
  - [ ] Billing portal: "Manage Billing" link in settings redirects to Lemon Squeezy customer portal URL
  - [ ] Free tier limits enforced in tRPC routers (not just middleware): habit creation, cookie jar creation, challenge activation all check tier before proceeding
- **UI Notes:** Upgrade page: dark full-width layout. Three columns (Free / Pro / Elite). Pro column has orange highlight border. Annual pricing shown by default with monthly toggle. Each tier shows its features with checkmarks (green) and X marks (muted). CTA button in each column.
- **API/Logic Notes:**
  - `/api/billing/create-checkout` (POST, auth required): calls Lemon Squeezy API `POST /v1/checkouts` with `variant_id`, `custom_price` (if needed), `checkout_data.custom.user_id` for webhook attribution
  - `/api/billing/webhook` (POST, no auth): verify signature, switch on `event_name`, upsert `subscriptions` and update `users.tier`
  - tRPC middleware helper: `requireTier(ctx, 'pro')` — throws `TRPCError FORBIDDEN` if user tier insufficient
- **Dependencies:** Feature 1 (Auth), Lemon Squeezy API, middleware.ts

---

### Feature 13: Gamification System (XP, Levels, Badges)
- **Priority:** P0
- **User Story:** As a user, I want to earn XP and level up through real achievements so that I have a meaningful, ungameable measure of my actual progress.
- **Acceptance Criteria:**
  - [ ] XP awarded for the following actions (no duplicates per day where noted):
    - Habit completed: 20 XP (per habit, per day)
    - Daily check-in submitted: 30 XP (once per day)
    - Check-in with `mood_signal = 'crushing'`: bonus 20 XP
    - Callousing Challenge completed: challenge's `xp_reward` (varies 50–200)
    - 40% Rule "I'll take that step" selected: 15 XP
    - Cookie Jar entry added: 25 XP
    - Environment item marked done: 50 XP
    - Onboarding completed (Why Excavation + Environment Audit): 200 XP one-time
  - [ ] Levels and XP thresholds:
    - Raw: 0–499 XP
    - Tempered: 500–1,499 XP
    - Forged: 1,500–3,499 XP
    - Hardened: 3,500–7,499 XP
    - Unbreakable: 7,500–14,999 XP
    - Legendary: 15,000+ XP
  - [ ] Level-up: full-screen forge animation plays (CSS animation — sparks effect), new level label shown, toast notification
  - [ ] Badges (6 in v1):
    - "Identity Locked" — Why Excavation completed (one-time)
    - "Mirror Gazer" — 30-day daily check-in streak
    - "Cookie Jar Founder" — 10+ Cookie Jar entries logged
    - "40% Survivor" — Selected "I'll take that step" 5 times total
    - "Cold Mind" — 7 cold-category challenges completed
    - "Tempered" — Reached Tempered level (500 XP)
  - [ ] Badges displayed on profile/settings page; each shows earned date or lock icon if not earned
  - [ ] All XP events logged to `xp_events` table for audit trail
- **UI Notes:** XP bar in app header (below Forge Score). Level label shown. On level-up: full-screen animation, then toast "You've reached [Level]." Badges page shows a 3-column grid of badge cards. Earned badges: colored icon + earned date. Unearned: grayscale icon + lock icon + requirement description.
- **API/Logic Notes:**
  - `lib/xp.ts` exports `awardXP(userId, amount, reason, eventType)`: inserts `xp_events`, updates `users.xp`, checks for level-up (compares new total to thresholds), updates `users.level`
  - `lib/badges.ts` exports `checkBadgeEligibility(userId, badgeKey)`: queries relevant data, inserts into `user_badges` if newly earned, returns `{ earned: boolean, isNew: boolean }`
  - Badge checks triggered after relevant actions: after check-in (Mirror Gazer), after cookie jar add (Founder), after 40% Rule resolution (Survivor), after challenge complete (Cold Mind), after onboarding (Identity Locked), after XP update (Tempered)
- **Dependencies:** All P0 features

---

### Feature 14: Weekly Neural Report
- **Priority:** P0
- **User Story:** As a Pro user, I want to receive a personalized weekly report every Sunday so that I have objective, AI-generated feedback on my behavioral arc and a clear challenge for the coming week.
- **Acceptance Criteria:**
  - [ ] Vercel cron job runs every Sunday at 8:00am UTC (configured in `vercel.json`)
  - [ ] Cron endpoint authenticated by `CRON_SECRET` header (Vercel sets this automatically)
  - [ ] For each Pro/Elite user: query the past 7 days of data (habit completions, check-in honesty scores, Forge Score history, challenges completed, cookie jar additions)
  - [ ] Gemini 2.5 Pro generates a structured report (JSON output) containing:
    - `forge_score_change`: integer delta (this week vs last week)
    - `habit_completion_rate`: percentage (0–100)
    - `best_streak_this_week`: string (habit name + days)
    - `behavioral_arc`: string (2–3 sentence narrative of the user's behavioral pattern this week)
    - `key_insight`: string (one specific, honest observation — not generic)
    - `next_week_challenge`: string (one specific action challenge for the coming week, personalized)
  - [ ] Report sent via Resend email using React Email template (dark theme)
  - [ ] Report also stored in `weekly_reports` table and surfaced in `/analytics` page as latest report card
  - [ ] Free users receive a locked email teaser ("Your weekly neural report is ready — upgrade to read it")
- **UI Notes:** Email: dark background (#0A0A0A), MindForge logo at top, structured sections with orange headings. In-app: compact card on analytics page showing this week's report, expandable.
- **API/Logic Notes:**
  - `vercel.json`: `{ "crons": [{ "path": "/api/cron/weekly-report", "schedule": "0 8 * * 0" }] }`
  - Endpoint fetches all Pro/Elite users in batches of 50, generates report for each, sends email, stores report — with 200ms delay between users to avoid rate limits
  - Gemini call uses `responseMimeType: 'application/json'` for structured output
  - Resend: `from: 'MindForge <forge@mindforge.app>'`, `subject: 'Your Weekly Neural Report — [Date Range]'`
- **Dependencies:** Feature 5 (Habits), Feature 6 (Check-ins), Feature 8 (Forge Score), Feature 11 (Challenges), Feature 12 (Billing), Gemini 2.5 Pro, Resend

---

### Feature 15: Dashboard
- **Priority:** P0
- **User Story:** As a user, I want a clear, honest dashboard showing my current state so that I know exactly where I stand every time I open the app.
- **Acceptance Criteria:**
  - [ ] Dashboard shows (in order): Forge Score widget (large), Today's habit cards (with complete/miss buttons), Daily check-in CTA (if not submitted today) or check-in summary (if submitted), active challenge (if any), XP bar + level, recent cookie jar entries (last 3)
  - [ ] All data loads within 1.5 seconds (use React Suspense boundaries with skeleton loaders)
  - [ ] Forge Score widget shows: current score (large number), level label, delta from 7 days ago
  - [ ] Check-in CTA: if not submitted today, shows a prominent card: "The Mirror is waiting — face it." with a link to `/checkin`
  - [ ] Mobile layout: single column. Desktop: two-column grid (habits on left, widgets on right)
- **UI Notes:** Background #0A0A0A. Cards on #111111. Orange accents on active elements. No clutter. Only essential information. Skeleton loaders match card dimensions exactly.
- **API/Logic Notes:**
  - Single tRPC query: `dashboard.getAll()` — returns user profile, today's habits + completion status, today's check-in status, active challenge, recent cookie jar entries, XP/level. One round trip.
- **Dependencies:** All P0 features

---

### Feature 16: Analytics Page
- **Priority:** P1
- **User Story:** As a user, I want to see charts and trends of my behavioral data over time so that I have objective evidence of my progress or regression.
- **Acceptance Criteria:**
  - [ ] Forge Score history chart: line chart, last 30 days, daily data points
  - [ ] Habit completion rate: bar chart per habit, last 30 days, showing % days completed
  - [ ] Streak calendar: GitHub-style contribution grid for each habit, last 90 days
  - [ ] Check-in honesty score trend: line chart, last 30 days
  - [ ] Total XP earned over time: cumulative line chart
  - [ ] Latest weekly neural report card (if Pro)
  - [ ] All charts use a dark theme with orange/blue data colors
- **UI Notes:** Full-width page with section headings. Charts use Recharts library. No tooltips with emojis.
- **API/Logic Notes:**
  - tRPC `analytics.forgeScoreHistory(30)`, `analytics.habitCompletionRates(30)`, `analytics.checkinHonestyTrend(30)`, `analytics.xpHistory(90)`
- **Dependencies:** Features 5, 6, 8, 13, 14

---

### Feature 17: Accountability Pods
- **Priority:** P1 (Month 4 post-launch)
- **User Story:** As a Pro user, I want to be matched with a small group of people at a similar level so that I have real social stakes in my daily commitments.
- **Acceptance Criteria:**
  - [ ] Pods of 3–7 users, matched by Forge Score range (±150 points)
  - [ ] Pod matching runs weekly (Monday 00:00 UTC cron) for users who opted in
  - [ ] Pod dashboard: shows each member's name (first name only), check-in status today (Done / Not Done — no text content shared), and current Forge Score
  - [ ] Members can send a "Push" message to another member: a pre-set encouragement/challenge message (not freeform — select from a list of 8 options to prevent harassment)
  - [ ] Pod is dissolved if average Forge Score drops below 100 for 2 consecutive weeks (members re-matched or placed in a lower tier pod)
- **Dependencies:** Feature 8 (Forge Score), Feature 12 (Billing — Pro gate), Feature 1 (Auth)

---

### Feature 18: Settings & Profile
- **Priority:** P1
- **User Story:** As a user, I want to manage my account settings so that I can update my profile, adjust coach intensity, and manage my subscription.
- **Acceptance Criteria:**
  - [ ] Display name editable
  - [ ] Coach intensity toggle: "Hard Truth" (default) / "Firm but Kind" — stored in `users.coach_intensity`
  - [ ] Timezone selection (dropdown of IANA timezone strings) — stored in `users.timezone`, used for `local_date` calculations
  - [ ] "Manage Billing" button → Lemon Squeezy customer portal URL
  - [ ] "Export My Data" → triggers download of user's data as JSON (check-ins, cookie jar, habits)
  - [ ] "Delete My Account" → confirmation modal → soft-deletes all user data
  - [ ] View earned badges
  - [ ] View why statement + identity declaration (read-only, cannot re-do Why Excavation in v1)
- **Dependencies:** Feature 1 (Auth), Feature 12 (Billing)

---

## 7. DATA MODELS

### User
```typescript
interface User {
  id: string;                          // UUID, primary key
  email: string;                       // unique, not null
  display_name: string | null;         // user's chosen name
  avatar_url: string | null;           // from OAuth provider
  tier: 'free' | 'pro' | 'elite';     // default 'free'
  forge_score: number;                 // 0–1000, default 0
  xp: number;                         // total XP earned, default 0
  level: number;                       // 1–6, default 1
  why_statement: string | null;        // from Why Excavation
  identity_declaration: string | null; // "I am someone who..."
  coach_intensity: 'hard' | 'firm';   // default 'hard'
  timezone: string;                    // IANA timezone, default 'UTC'
  onboarding_complete: boolean;        // default false
  onboarding_step: 'mirror' | 'why' | 'environment' | 'complete'; // default 'mirror'
  environment_audit: Record<string, { item: string; category: string; done: boolean }> | null;
  created_at: Date;
  updated_at: Date;
}
```

### Habit
```typescript
interface Habit {
  id: string;                          // UUID
  user_id: string;                     // FK → users.id
  name: string;                        // max 60 chars
  category: 'health' | 'mind' | 'avoid' | 'perform';
  habit_type: 'build' | 'avoid';
  target_frequency: 'daily' | 'weekdays' | 'custom';
  target_days: number[];               // [0,1,2,3,4,5,6] — 0=Sunday. Empty = daily.
  is_active: boolean;                  // default true; false = archived
  sort_order: number;                  // for user-defined ordering
  created_at: Date;
}
```

### HabitCompletion
```typescript
interface HabitCompletion {
  id: string;                          // UUID
  habit_id: string;                    // FK → habits.id
  user_id: string;                     // FK → users.id (denormalized for RLS)
  local_date: string;                  // 'YYYY-MM-DD' — user's local date, NOT UTC
  completed: boolean;                  // true = done, false = deliberately missed
  notes: string | null;                // optional (not used in v1 UI but stored)
  completion_time: Date;               // UTC timestamp of the log action
  // UNIQUE constraint: (habit_id, local_date)
}
```

### HabitStreak
```typescript
interface HabitStreak {
  id: string;                          // UUID
  habit_id: string;                    // FK → habits.id; UNIQUE
  user_id: string;                     // FK → users.id
  current_streak: number;              // default 0
  longest_streak: number;              // default 0
  last_completed_date: string | null;  // 'YYYY-MM-DD'
  updated_at: Date;
}
```

### DailyCheckin
```typescript
interface DailyCheckin {
  id: string;                          // UUID
  user_id: string;                     // FK → users.id
  local_date: string;                  // 'YYYY-MM-DD'
  raw_reflection: string;              // user's submitted text
  ai_response: string | null;          // Forge Coach debrief text
  honesty_score: number | null;        // 1–10 integer
  mood_signal: 'excusing' | 'deflecting' | 'owning' | 'crushing' | null;
  forge_score_delta: number;           // score change from this check-in, default 0
  onboarding_mirror: boolean;          // true if this is the onboarding mirror entry
  created_at: Date;
  // UNIQUE constraint: (user_id, local_date) WHERE onboarding_mirror = false
}
```

### CoachingSession
```typescript
interface CoachingSession {
  id: string;                          // UUID
  user_id: string;                     // FK → users.id
  session_type: 'onboarding_mirror' | 'why_excavation' | 'daily_checkin' | 'forty_percent_rule' | 'direct_chat';
  messages: Array<{ role: 'user' | 'model'; content: string }>;  // JSONB
  session_summary: string | null;      // post-session AI summary
  forge_score_delta: number;           // default 0
  created_at: Date;
}
```

### UserMemory
```typescript
interface UserMemory {
  id: string;                          // UUID
  user_id: string;                     // FK → users.id
  content: string;                     // e.g. "User prefers evening workouts over mornings"
  memory_type: 'preference' | 'trigger' | 'victory' | 'fear' | 'identity' | 'pattern';
  embedding: number[];                 // vector(768) — text-embedding-004 output
  created_at: Date;
  last_accessed: Date | null;
}
```

### CookieJarEntry
```typescript
interface CookieJarEntry {
  id: string;                          // UUID
  user_id: string;                     // FK → users.id
  title: string;                       // max 80 chars
  description: string;                 // max 500 chars
  date_of_victory: string | null;      // 'YYYY-MM-DD' — optional
  embedding: number[];                 // vector(768) — text-embedding-004 output
  created_at: Date;
}
```

### Challenge
```typescript
interface Challenge {
  id: string;                          // UUID
  title: string;
  description: string;                 // what to do + why it builds mental toughness
  category: 'cold' | 'screen' | 'physical' | 'fast' | 'social';
  difficulty: 1 | 2 | 3 | 4 | 5;
  duration_minutes: number;            // stated challenge window
  xp_reward: number;                   // XP on completion
}
```

### UserChallenge
```typescript
interface UserChallenge {
  id: string;                          // UUID
  user_id: string;                     // FK → users.id
  challenge_id: string;                // FK → challenges.id
  status: 'active' | 'completed' | 'failed';
  reflection: string | null;           // min 50 chars on completion
  started_at: Date | null;
  completed_at: Date | null;
}
```

### XPEvent
```typescript
interface XPEvent {
  id: string;                          // UUID
  user_id: string;                     // FK → users.id
  xp_amount: number;
  reason: string;                      // human-readable description
  event_type: 'habit_complete' | 'checkin' | 'checkin_bonus' | 'challenge' | 'forty_percent' | 'cookie_jar' | 'environment' | 'onboarding';
  created_at: Date;
}
```

### UserBadge
```typescript
interface UserBadge {
  id: string;                          // UUID
  user_id: string;                     // FK → users.id
  badge_key: 'identity_locked' | 'mirror_gazer' | 'cookie_jar_founder' | 'forty_percent_survivor' | 'cold_mind' | 'tempered';
  earned_at: Date;
  // UNIQUE constraint: (user_id, badge_key)
}
```

### Subscription
```typescript
interface Subscription {
  id: string;                          // UUID
  user_id: string;                     // FK → users.id; UNIQUE
  lemonsqueezy_customer_id: string | null;    // UNIQUE
  lemonsqueezy_subscription_id: string | null; // UNIQUE
  tier: 'free' | 'pro' | 'elite';
  status: 'active' | 'cancelled' | 'past_due' | 'expired';
  current_period_end: Date | null;
  created_at: Date;
  updated_at: Date;
}
```

### ForgeScoreHistory
```typescript
interface ForgeScoreHistory {
  id: string;                          // UUID
  user_id: string;                     // FK → users.id
  score: number;                       // 0–1000
  recorded_at: Date;                   // timestamp of recalculation
}
```

### RuleFortyEvent
```typescript
interface RuleFortyEvent {
  id: string;                          // UUID
  user_id: string;                     // FK → users.id
  triggered_by: 'auto_habit' | 'auto_checkin' | 'manual';
  habit_id: string | null;             // FK → habits.id (if auto_habit)
  choice: 'took_step' | 'declined';
  created_at: Date;
}
```

### WeeklyReport
```typescript
interface WeeklyReport {
  id: string;                          // UUID
  user_id: string;                     // FK → users.id
  week_start_date: string;             // 'YYYY-MM-DD' of the Monday
  forge_score_change: number;          // delta from prior week
  habit_completion_rate: number;       // 0–100 percentage
  best_streak_this_week: string;       // "Morning workout — 7 days"
  behavioral_arc: string;              // 2–3 sentence narrative
  key_insight: string;                 // one honest observation
  next_week_challenge: string;         // one specific action challenge
  email_sent: boolean;                 // default false
  created_at: Date;
}
```

---

## 8. API ENDPOINTS

| Method | Endpoint | Auth | Tier | Request Body | Response | Description |
|--------|----------|------|------|--------------|----------|-------------|
| POST | /api/auth/callback | No | — | `{code, next}` | Redirect | Supabase OAuth callback |
| POST | /api/coach/stream | Yes | Pro | `{message, sessionType, habitId?}` | SSE stream | Streaming AI coach response |
| POST | /api/coach/classify | Yes | Pro | `{checkinId, text}` | `{honestyScore, moodSignal}` | Classify check-in mood via Flash |
| POST | /api/billing/create-checkout | Yes | Any | `{variantId, billingPeriod}` | `{checkoutUrl}` | Create Lemon Squeezy checkout |
| POST | /api/billing/webhook | No (HMAC) | — | LemonSqueezy event payload | `{received: true}` | Handle subscription events |
| GET | /api/cron/weekly-report | Cron secret | — | — | `{processed: number}` | Sunday neural report generation |

**tRPC Routes** (all authenticated via Supabase session middleware):

| Router | Procedure | Type | Input | Output | Description |
|--------|-----------|------|-------|--------|-------------|
| user | getProfile | query | — | User | Current user profile |
| user | updateProfile | mutation | `{displayName?, coachIntensity?, timezone?}` | User | Update profile fields |
| user | updateWhy | mutation | `{whyStatement, identityDeclaration}` | User | Save Why Excavation results |
| user | submitEnvironmentAudit | mutation | `{answers: Record<string, string>}` | `{recommendations: EnvItem[]}` | Submit audit, get AI recommendations |
| user | markEnvironmentItemDone | mutation | `{itemIndex: number}` | User | Mark env item done, award XP |
| habits | list | query | — | `Habit & {todayStatus, streak}[]` | All active habits with today's status |
| habits | create | mutation | `{name, category, habitType, frequency, targetDays?}` | Habit | Create habit (tier check) |
| habits | update | mutation | `{id, name?, category?, frequency?, targetDays?}` | Habit | Update habit |
| habits | archive | mutation | `{id}` | `{success: true}` | Soft-delete habit |
| habits | logCompletion | mutation | `{habitId, localDate, completed}` | `{streak, forgeScore, xpAwarded}` | Log completion or miss |
| habits | getCompletionHistory | query | `{habitId, days: number}` | `HabitCompletion[]` | History for calendar grid |
| checkins | getToday | query | `{localDate: string}` | `DailyCheckin | null` | Today's check-in |
| checkins | submit | mutation | `{text: string, localDate: string}` | `DailyCheckin` | Submit check-in (streams debrief separately) |
| checkins | updateMetadata | mutation | `{checkinId, honestyScore, moodSignal}` | DailyCheckin | Store AI classification |
| cookiejar | list | query | — | `CookieJarEntry[]` | All entries (no embeddings returned) |
| cookiejar | add | mutation | `{title, description, dateOfVictory?}` | CookieJarEntry | Add entry + embed |
| cookiejar | search | query | `{query: string}` | `CookieJarEntry[]` | Semantic search |
| cookiejar | delete | mutation | `{id}` | `{success: true}` | Delete entry |
| challenges | list | query | — | `Challenge & {userStatus?}[]` | All challenges with user status |
| challenges | activate | mutation | `{challengeId}` | UserChallenge | Start challenge |
| challenges | complete | mutation | `{userChallengeId, reflection}` | `{xpAwarded, badgesEarned}` | Complete + reflect |
| analytics | forgeScoreHistory | query | `{days: number}` | `{date, score}[]` | Forge Score timeseries |
| analytics | habitCompletionRates | query | `{days: number}` | `{habitId, name, rate}[]` | Per-habit completion % |
| analytics | checkinHonestyTrend | query | `{days: number}` | `{date, score}[]` | Daily honesty scores |
| analytics | xpHistory | query | `{days: number}` | `{date, totalXp}[]` | Cumulative XP |
| analytics | getLatestWeeklyReport | query | — | WeeklyReport | null | Latest neural report |
| dashboard | getAll | query | `{localDate: string}` | Dashboard data bundle | Single-query dashboard load |

---

## 9. PAGES & ROUTES

| Route | Page Name | Auth Required | Tier | Description |
|-------|-----------|---------------|------|-------------|
| / | Landing Page | No | — | Marketing landing page with hero, features, pricing, CTA |
| /login | Login | No (redirects if authed) | — | Magic link + Google OAuth |
| /onboarding/mirror | Accountability Mirror | Yes | Any | Step 1 onboarding |
| /onboarding/why | Why Excavation | Yes | Any | Step 2 onboarding |
| /onboarding/environment | Environment Audit | Yes | Any | Step 3 onboarding |
| /dashboard | Dashboard | Yes | Any | Main app home |
| /habits | Habit List | Yes | Any | All habits + today's grid |
| /habits/[id] | Habit Detail | Yes | Any | Single habit history calendar |
| /habits/new | New Habit | Yes | Any | Create habit form |
| /checkin | Daily Check-In | Yes | Any | Accountability Mirror check-in |
| /coach | AI Forge Coach | Yes | Pro | Direct chat with Forge Coach |
| /cookie-jar | Cookie Jar | Yes | Any | Victory archive |
| /challenges | Callousing Challenges | Yes | Any (gated content) | Challenge library |
| /analytics | Analytics | Yes | Any | Charts + weekly report |
| /upgrade | Upgrade | Yes | Any | Pricing comparison + checkout |
| /settings | Settings | Yes | Any | Profile, billing, preferences |

---

## 10. UI/UX REQUIREMENTS

### 10.1 Design Principles

- **Honest darkness:** Dark mode only. No light mode. The aesthetic must feel serious, focused, and slightly uncomfortable — mirroring the product philosophy.
- **Mobile-first:** All critical flows (check-in, habit logging, 40% Rule) must be fully functional on a 375px wide mobile browser. Desktop is enhanced, not primary.
- **Earned aesthetics:** No visual rewards for incomplete actions. Progress is visible, never inflated.
- **Zero emojis** in AI responses, badge descriptions, or system messages. The product's tone is serious.
- **Speed as respect:** All interactions must feel immediate. Skeleton loaders for async data. Never show a blank white flash.

### 10.2 Color & Theme

- **Background (primary):** #0A0A0A
- **Background (cards):** #111111
- **Background (elevated):** #1A1A1A
- **Border:** #2A2A2A
- **Text (primary):** #FFFFFF
- **Text (muted):** #888888
- **Accent (CTAs, active states):** #FF6B2B (Molten Orange)
- **Accent (secondary, info):** #3B82F6 (Steel Blue)
- **Success:** #22C55E (Green)
- **Danger/Miss:** #EF4444 (Red)
- **Typography (headings):** Geist (or Cal Sans as fallback) — `font-bold tracking-tight`
- **Typography (body):** Inter — `font-normal`
- **Border radius:** `rounded-none` on primary buttons and cards (sharp corners). `rounded-sm` on small UI elements only.
- **Component library:** shadcn/ui with custom theme overrides to match above colors and sharp corners.

### 10.3 Key UI Flows

**Flow 1: First-Time User Onboarding**
1. User lands on `/login`, enters email, receives magic link
2. Clicks magic link → redirected to `/onboarding/mirror`
3. Sees large textarea: "Write the truth about where you are right now."
4. Writes reflection (min 100 chars), clicks "Submit to the Mirror"
5. AI response streams in below (starts within 3 seconds)
6. After stream completes, "I'm Ready — Continue" button appears
7. Clicks → redirected to `/onboarding/why`
8. Multi-turn chat with Forge Coach extracts their deepest why (4–6 turns)
9. Coach presents why statement → user accepts → identity declaration entered
10. "Identity Locked" badge animates into view
11. Continues → `/onboarding/environment`
12. Completes 12-question audit → AI recommendations generated
13. Clicks "Enter the Forge" → redirected to `/dashboard`

**Flow 2: Daily Check-In**
1. User opens app, sees "The Mirror is waiting — face it" card on dashboard
2. Clicks → `/checkin`
3. Writes honest reflection in textarea
4. Clicks "Submit to the Mirror"
5. AI debrief streams in (Pro) or upgrade prompt appears (Free)
6. If mood signal is 'excusing': 40% Rule modal appears full-screen
7. User chooses "I'll take that step" or "I still can't"
8. Returns to dashboard, sees updated Forge Score

**Flow 3: Habit Completion**
1. User sees habit cards on dashboard
2. Taps "Completed" button on a habit
3. Button turns green, checkmark appears, XP count increments with animation (+20 XP)
4. Forge Score widget updates with count-up animation
5. If this is the 7th consecutive day: bonus visual indicator "7-day streak!"
6. If habit is missed and streak ≥7: 40% Rule modal triggers immediately

---

## 11. AUTHENTICATION & AUTHORIZATION

- **Auth Method:** Supabase Auth — magic link (email OTP) + Google OAuth. No passwords stored.
- **Session:** Supabase JWT, 7-day expiry with silent refresh via `@supabase/ssr` cookie-based session.
- **Row Level Security (RLS):** Enabled on ALL tables. Every table has RLS policies ensuring users can only read/write their own rows. Service role key bypasses RLS (used only in webhook handler and cron).

| Role | Permissions |
|------|-------------|
| Authenticated (Free) | Read/write own data; limited by feature tier gates in tRPC |
| Authenticated (Pro) | Full access to all Pro features; unlimited data creation |
| Authenticated (Elite) | Full access including direct coach chat, unlimited conversations |
| Service Role (server) | Full unrestricted access — used only in webhook + cron handlers |
| Unauthenticated | Access to `/`, `/login` only |

**Tier gating approach:**
- `middleware.ts`: redirects unauthenticated users. Does NOT check tier (too slow for every request).
- tRPC routers: `requireTier(ctx, 'pro')` helper function checks `ctx.user.tier` before proceeding. Throws `TRPCError({ code: 'FORBIDDEN' })` for insufficient tier.
- Free tier limits (habit count, cookie jar count, challenge access): enforced in tRPC mutation handlers, not middleware.

---

## 12. ERROR HANDLING & EDGE CASES

- [ ] **Empty check-in submission:** Blocked at UI level (submit button disabled until 50+ chars). Server-side: tRPC `checkins.submit` validates `text.trim().length >= 50`, returns `BAD_REQUEST` if not.
- [ ] **Gemini API unavailable / timeout:** All Gemini calls wrapped in try/catch with 30-second timeout. On failure: store raw check-in without AI response, show user: "Your coach is temporarily unavailable. Your reflection has been saved. We'll generate your debrief shortly." Retry job (manual or cron) can regenerate missing debriefs.
- [ ] **Gemini streaming interrupted mid-response:** SSE stream closed by client (user navigates away). Partial response is NOT stored. On return to the page, show: "Your debrief was interrupted. Resubmit to generate it." Allow resubmission of existing check-in for AI response regeneration (same day only).
- [ ] **Duplicate habit completion (same habitId + localDate):** SQL unique constraint on `(habit_id, local_date)` prevents duplicates. tRPC returns `CONFLICT` error. Frontend shows: "You've already logged this habit today."
- [ ] **Free user hitting habit limit:** On `habits.create` call with 3 existing habits, tRPC returns `FORBIDDEN` with `{ upgradeRequired: true }`. Frontend shows upgrade modal.
- [ ] **Lemon Squeezy webhook replay / duplicate event:** Webhook handler checks `lemonsqueezy_subscription_id` before upserting — idempotent. Processing the same event twice produces the same result.
- [ ] **Invalid Lemon Squeezy webhook signature:** Return `401 Unauthorized` immediately without processing. Log to Sentry.
- [ ] **Cron job fails mid-batch (weekly report):** Each user's report is processed in a separate try/catch. Failure for one user does not stop processing of others. Failed users logged to Sentry.
- [ ] **User accesses `/coach` (Pro-only) on Free tier:** Middleware does not block it (tier check is tRPC-level). Page loads but shows a locked state UI with: "Your coach is waiting. Unlock with Pro." Upgrade CTA centered on page.
- [ ] **pgvector similarity search with no memories:** Returns empty array. System prompt injected with: "No prior memories available for this user." Coach introduces itself without referencing past context.
- [ ] **Timezone-related date mismatch:** `localDate` always sent from client (`new Date().toLocaleDateString('en-CA', { timeZone: userTimezone })` — returns 'YYYY-MM-DD'). Never computed server-side. Server accepts and stores as-is.
- [ ] **User deletes account:** Soft-delete: set `users.is_deleted = true`, anonymize email to `deleted_[id]@mindforge.app`, delete all personal data (check-ins, coach sessions, memories, cookie jar) within 24 hours via background job. Subscription cancellation must be triggered via Lemon Squeezy API first.

---

## 13. PERFORMANCE & SECURITY REQUIREMENTS

- [ ] **First Contentful Paint (FCP) < 1.5 seconds** on a 4G connection via Vercel Edge Network
- [ ] **AI streaming first token < 3 seconds** — enforced by Gemini 2.5 Pro API; if exceeded, show animated "Forge Coach is thinking..." state
- [ ] **Dashboard load < 1.5 seconds** — achieved via single `dashboard.getAll` tRPC query + React Suspense skeleton loaders
- [ ] **Forge Score recalculation < 200ms** — all required data fetched via indexed queries; no N+1 patterns
- [ ] **All user inputs sanitized** before database writes — tRPC Zod schema validation on all inputs; no raw SQL string interpolation
- [ ] **API rate limiting:** `/api/coach/stream` limited to 20 requests/hour per user (enforced via Supabase Edge Function or Vercel middleware rate limiter using user ID)
- [ ] **Lemon Squeezy webhook HMAC verification** on every incoming webhook request
- [ ] **Cron endpoint protected** by `Authorization: Bearer CRON_SECRET` header (set automatically by Vercel)
- [ ] **No sensitive data in client bundle:** `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `LEMONSQUEEZY_API_KEY`, `RESEND_API_KEY` are server-only env vars (no `NEXT_PUBLIC_` prefix)
- [ ] **HTTPS enforced** in production (Vercel default)
- [ ] **Supabase RLS enabled** on all tables — no table may be created without RLS policy
- [ ] **SQL injection impossible** — all database access via Supabase client's parameterized queries
- [ ] **User data isolation** — RLS policies enforce `user_id = auth.uid()` on all user data tables
- [ ] **GDPR compliance** — data export endpoint and delete-my-account flow implemented in v1

---

## 14. OUT OF SCOPE (v1.0)

- **Native iOS / Android app** — Web app only in v1. PWA support optional but not required. Native app is v2 (Month 7–9).
- **Accountability Pods** — Deferred to Month 4 post-launch. (Feature 17 spec written but not built in v1.)
- **Brain Map Visualization** — Deferred to Month 5. Motivational neural pathway metaphor requires design iteration.
- **Dopamine Detox Mode** — P2, deferred to v2. Requires additional AI-guided protocol design.
- **Forge Teams (B2B)** — Deferred to Month 6. Requires SSO, admin dashboard, bulk billing flows.
- **Identity Declaration re-do flow** — Users cannot redo Why Excavation in v1. Contact support to reset.
- **Wearable / health data integration** — No Apple Health, Garmin, or Fitbit integrations in v1.
- **In-app video / audio content** — Neuroscience content library is text-only in v1.
- **Push notifications** — Browser notifications not implemented in v1 (rely on daily habit of opening the app).
- **Multi-language support** — English only in v1.
- **Human coach marketplace** — Elite v2 feature. In v1 Elite tier, weekly group coaching is AI-facilitated.
- **Social sharing cards** — Milestone share cards (Instagram, Twitter) deferred to v2.
- **1-on-1 chat with human coaches** — Not in v1.
- **Light mode** — Dark mode only. No toggle.

---

## 15. IMPLEMENTATION ORDER

**Phase 1: Foundation (Days 1–14)**
1. Next.js project setup: TypeScript, Tailwind CSS, shadcn/ui, dark theme config, Geist + Inter fonts
2. Supabase project: enable pgvector extension, run full schema migration (all tables, RLS policies, indexes)
3. Supabase Auth: magic link + Google OAuth, middleware.ts (auth redirect + onboarding redirect)
4. tRPC setup: router structure, context (Supabase client injection), base middleware (requireAuth, requireTier)
5. Core layout components: Sidebar, Header with Forge Score widget, MobileNav, app shell

**Phase 2: Onboarding (Days 15–21)**
6. Onboarding Step 1 — Accountability Mirror page + SSE streaming endpoint
7. Onboarding Step 2 — Why Excavation multi-turn chat + why/identity save
8. Onboarding Step 3 — Environment Audit questionnaire + Gemini Flash recommendations
9. Onboarding completion → dashboard redirect + "Identity Locked" badge

**Phase 3: Core Habit Engine (Days 22–35)**
10. Habit CRUD: create, edit, archive (tRPC + UI)
11. Habit completion logging: `logCompletion` tRPC with local_date, upsert to `habit_completions`
12. Streak calculation algorithm + `habit_streaks` cache update
13. Dashboard habit cards with Completed / Missed buttons + today's status display

**Phase 4: Daily Check-In + AI Coach (Days 36–50)**
14. Daily check-in page: textarea, submit, display today's check-in (read-only if submitted)
15. Gemini 2.5 Pro streaming debrief: SSE endpoint, system prompt construction, stream to UI
16. Mood signal classification: Gemini 2.5 Flash classify endpoint, `updateMetadata` tRPC
17. AI Forge Coach memory system: pgvector embedding pipeline (text-embedding-004), memory extraction agent, RAG retrieval
18. `/coach` direct chat page (Pro-gated)

**Phase 5: Forge Score + Gamification (Days 51–60)**
19. Forge Score formula implementation (`lib/forge-score.ts`) + recalculation on all triggers
20. `forge_score_history` table inserts + analytics timeseries query
21. XP system: `awardXP` function, `xp_events` table, level calculation
22. Badge eligibility checks: all 6 v1 badges
23. Level-up animation (CSS forge spark effect)
24. 40% Rule Engine: auto-trigger logic, modal component, streaming intervention

**Phase 6: Cookie Jar + Challenges (Days 61–70)**
25. Cookie Jar: add, list, delete, embed on save, semantic search
26. Callousing Challenges: seed 20 challenges, list page, activate, complete with reflection
27. Free tier limits enforced: habit (3), cookie jar (5), challenges (5)

**Phase 7: Billing (Days 71–77)**
28. Lemon Squeezy: create-checkout endpoint, webhook handler (HMAC verification, subscription sync)
29. Upgrade page with pricing table
30. Feature gating via `requireTier` in all Pro/Elite tRPC procedures
31. Settings page: manage billing portal link, profile edits, data export, delete account

**Phase 8: Weekly Report + Analytics (Days 78–84)**
32. Analytics page: Forge Score chart, habit completion bars, check-in honesty trend, XP chart (Recharts)
33. Weekly Neural Report: Gemini 2.5 Pro structured JSON generation, React Email template, Resend delivery
34. Vercel cron job configuration (`vercel.json`)

**Phase 9: Polish + Launch Prep (Days 85–90)**
35. Error boundaries on all pages + meaningful error messages
36. Skeleton loaders for all async data (match exact card dimensions)
37. Mobile responsiveness audit (375px, 390px, 430px widths)
38. PostHog event tracking: sign_up, onboarding_complete, habit_logged, checkin_submitted, upgrade_clicked, subscription_created
39. Sentry integration: error tracking on API routes and client
40. Landing page (`/`) — hero, features, pricing, testimonials, CTA
41. Performance audit: Lighthouse score ≥90 on dashboard route
42. GDPR: data export + delete account endpoints
43. **Launch**

---

## 16. OPEN QUESTIONS

- [ ] **Coach intensity "Firm but Kind" prompt:** What exactly changes in the system prompt for this mode? Define specific language guardrails that soften without losing honesty — needs prompt engineering decision before Week 5.
- [ ] **Why Excavation re-do policy:** In v1, users cannot redo the Why Excavation. Should we allow a one-time reset (resets why_statement and identity_declaration, marks onboarding_step = 'why', clears related memories)? Decision needed before Settings page is built (Phase 7).
- [ ] **Streak definition for 'avoid' type habits:** A 'build' habit streak is consecutive completed days. An 'avoid' habit streak should be consecutive days without performing the bad habit — but how is this logged? The user taps "Completed" to mean "I avoided it today." Confirm this is the right UX before building (Phase 3).
- [ ] **40% Rule daily trigger limit:** Set at 3 auto-triggers/day in spec. Confirm this is right — could be too many if a user misses all 3 habits. Consider reducing to 1 auto-trigger per day?
- [ ] **Lemon Squeezy variant IDs for annual vs monthly:** Two separate Lemon Squeezy variant IDs needed per tier (monthly + annual). Confirm whether annual billing is set up as a separate variant or as a billing cycle option on the same variant in the Lemon Squeezy dashboard before building the checkout endpoint (Phase 7).
- [ ] **Elite tier "weekly group coaching sessions":** In v1, is this an AI-facilitated session (all in app) or a Zoom/external link? If external, how is scheduling handled? ⚠️ ASSUMPTION: Assumed AI-facilitated in-app for v1. Needs product decision.
- [ ] **Memory deduplication:** If the same atomic fact is extracted multiple times across sessions (e.g., "User prefers mornings" appears 5 times), should duplicates be merged? Current design inserts all without dedup — could cause retrieval noise over time. Consider cosine similarity threshold for dedup (e.g., if new memory is >0.95 similar to existing, update instead of insert).

---

**END OF PRD**

⚠️ ASSUMPTION: The `/coach` direct chat page is Pro-gated. The daily check-in debrief (one response per day, auto-triggered by check-in submission) is the primary AI touchpoint for Pro users. The `/coach` page provides unlimited additional conversation for Pro users, not just the debrief.

⚠️ ASSUMPTION: Google text-embedding-004 produces 768-dimension vectors. pgvector column defined as `vector(768)`. If using a different embedding model with different dimensions (e.g., 1536), the schema must be updated before migration.

⚠️ ASSUMPTION: Vercel cron is used for weekly reports. This requires a Vercel Pro plan (cron jobs are not available on the free Hobby plan). Alternatively, Supabase `pg_cron` extension can be used as a fallback.

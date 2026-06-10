# MindForge — Phase-by-Phase Build Guide
**Version:** 1.0 | **Based on PRD v1.0** | **Total Timeline: 90 Days**

This file contains every prompt needed to build MindForge end-to-end, organized by phase. Each prompt is self-contained and references the PRD for full spec details. Paste each prompt directly into your AI coding agent to complete that step.

---

## HOW TO USE THIS GUIDE

1. Work through phases in order — each phase depends on the previous.
2. Each prompt is numbered and maps to a specific deliverable.
3. After each prompt, verify the acceptance criteria in the PRD before moving on.
4. Environment variables must be set before Phase 1 Step 3.

---

## PHASE 1: Foundation (Days 1–14)
*Goal: Working Next.js skeleton with auth, database, tRPC, and layout shell.*

---

### Step 1.1 — Next.js Project Setup

```
Create a new Next.js 14 App Router project called "mindforge" with the following configuration:

STACK:
- Next.js 14 with App Router and TypeScript (strict mode)
- Tailwind CSS
- shadcn/ui (initialize with the CLI: `npx shadcn@latest init`)
- Geist font (from `next/font/google`) for headings
- Inter font (from `next/font/google`) for body text

TAILWIND CONFIG (tailwind.config.ts):
Extend the theme with these exact values:
- Colors: forge.base=#0A0908, forge.subtle=#111110, forge.elevated=#1A1918, forge.overlay=#232220, forge.input=#161514, forge.border=#2A2927, forge.border-strong=#3D3B39, forge.orange=#FF6B2B, forge.orange-hover=#FF5214, forge.orange-text=#FFBDA3, forge.orange-glow=rgba(255,107,43,0.20), forge.blue=#3B82F6, forge.blue-hover=#2563EB, forge.blue-text=#93C5FD
- Text colors: text.primary=#EDEDEF, text.secondary=#C2C0BE, text.muted=#87857F, text.disabled=#4A4845
- Border radius: DEFAULT=0px (sharp), sm=2px, md=4px, full=9999px
- Font families: heading=['Geist','Cal Sans','system-ui','sans-serif'], body=['Inter','system-ui','sans-serif'], mono=['Geist Mono','monospace']
- Font sizes with line heights: display=3.052rem/1.05/800, 4xl=2.441rem/1.08/700, 3xl=1.953rem/1.15/700, 2xl=1.563rem/1.20/600, xl=1.25rem/1.30/600, base=1rem/1.65/400, sm=0.875rem/1.55/400, xs=0.75rem/1.40/400

SHADCN CSS VARIABLES (globals.css — dark theme only, no light mode):
--background: 10 6% 4%
--foreground: 240 5% 93%
--card: 40 5% 7%
--card-foreground: 240 5% 93%
--popover: 30 4% 13%
--popover-foreground: 240 5% 93%
--primary: 21 100% 58%
--primary-foreground: 10 6% 4%
--secondary: 217 91% 60%
--secondary-foreground: 240 5% 93%
--muted: 30 4% 13%
--muted-foreground: 30 3% 53%
--accent: 30 4% 13%
--accent-foreground: 21 100% 58%
--destructive: 0 84% 60%
--destructive-foreground: 0 0% 98%
--border: 30 3% 17%
--input: 30 3% 10%
--ring: 21 100% 58%
--radius: 0rem

Set `darkMode: 'class'` in Tailwind config and add `class="dark"` to the html element in the root layout. This is a dark-mode-only app — no light mode toggle.

Install packages: @tanstack/react-query, framer-motion, recharts, zod

Create a placeholder root layout (app/layout.tsx) with both fonts loaded, dark background (#0A0908), and a simple `<main>{children}</main>`. No navigation yet.

Create app/page.tsx with just "MindForge — Coming Soon" centered on the dark background in orange (#FF6B2B) using the display font size. This confirms the theme is working.

Create a types/index.ts file with a comment: "// Shared TypeScript types — populated as features are built"

ACCEPTANCE: `npm run dev` starts without errors. Page shows "MindForge — Coming Soon" in orange on a near-black background. Tailwind IntelliSense shows forge.* color tokens.
```

---

### Step 1.2 — Supabase Database Schema

```
Set up the complete Supabase database schema for MindForge. Create the file supabase/migrations/001_initial_schema.sql with the following tables, all with Row Level Security enabled:

TABLE: users
- id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
- email TEXT NOT NULL
- display_name TEXT
- avatar_url TEXT
- tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'elite'))
- onboarding_step TEXT NOT NULL DEFAULT 'mirror' CHECK (onboarding_step IN ('mirror', 'why', 'environment', 'complete'))
- onboarding_complete BOOLEAN NOT NULL DEFAULT false
- why_statement TEXT
- identity_declaration TEXT
- environment_audit JSONB DEFAULT '[]'
- forge_score INTEGER NOT NULL DEFAULT 0
- xp_total INTEGER NOT NULL DEFAULT 0
- xp_level INTEGER NOT NULL DEFAULT 1
- current_streak_days INTEGER NOT NULL DEFAULT 0
- lemonsqueezy_customer_id TEXT
- lemonsqueezy_subscription_id TEXT
- subscription_status TEXT DEFAULT 'inactive'
- is_deleted BOOLEAN NOT NULL DEFAULT false
- created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
- updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

TABLE: habits
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- name TEXT NOT NULL CHECK (char_length(name) <= 60)
- category TEXT NOT NULL CHECK (category IN ('health', 'mind', 'avoid', 'perform'))
- habit_type TEXT NOT NULL CHECK (habit_type IN ('build', 'avoid'))
- frequency_days INTEGER[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}' -- 0=Sun, 6=Sat
- is_active BOOLEAN NOT NULL DEFAULT true
- created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

TABLE: habit_completions
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- local_date DATE NOT NULL
- completed BOOLEAN NOT NULL
- logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
- UNIQUE(habit_id, local_date)

TABLE: habit_streaks (cache table)
- habit_id UUID PRIMARY KEY REFERENCES habits(id) ON DELETE CASCADE
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- current_streak INTEGER NOT NULL DEFAULT 0
- longest_streak INTEGER NOT NULL DEFAULT 0
- last_completed_date DATE
- updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

TABLE: daily_checkins
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- local_date DATE NOT NULL
- raw_text TEXT NOT NULL
- ai_response TEXT
- mood_signal TEXT CHECK (mood_signal IN ('crushing', 'steady', 'struggling', 'excusing', 'deflecting'))
- honesty_score INTEGER CHECK (honesty_score BETWEEN 1 AND 10)
- is_onboarding_mirror BOOLEAN NOT NULL DEFAULT false
- created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
- UNIQUE(user_id, local_date) -- one check-in per day

TABLE: coach_sessions
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- checkin_id UUID REFERENCES daily_checkins(id)
- session_type TEXT NOT NULL CHECK (session_type IN ('onboarding_mirror', 'why_excavation', 'checkin_debrief', 'direct_chat', 'forty_percent', 'challenge_reflection'))
- messages JSONB NOT NULL DEFAULT '[]' -- [{role: 'user'|'coach', content: string, timestamp: string}]
- created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

TABLE: memories
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- content TEXT NOT NULL
- category TEXT NOT NULL CHECK (category IN ('trigger', 'victory', 'pattern', 'identity', 'goal', 'obstacle'))
- source_session_id UUID REFERENCES coach_sessions(id)
- embedding vector(768) -- pgvector: text-embedding-004 dimensions
- created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

TABLE: cookie_jar
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- title TEXT NOT NULL CHECK (char_length(title) <= 100)
- description TEXT NOT NULL
- date_of_victory DATE
- embedding vector(768)
- created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

TABLE: callousing_challenges
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- title TEXT NOT NULL
- description TEXT NOT NULL
- difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5)
- category TEXT NOT NULL CHECK (category IN ('physical', 'mental', 'social', 'digital'))
- duration_days INTEGER NOT NULL DEFAULT 1
- min_tier TEXT NOT NULL DEFAULT 'free' CHECK (min_tier IN ('free', 'pro', 'elite'))
- is_active BOOLEAN NOT NULL DEFAULT true

TABLE: user_challenges
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- challenge_id UUID NOT NULL REFERENCES callousing_challenges(id)
- status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed'))
- started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
- completed_at TIMESTAMPTZ
- reflection TEXT
- UNIQUE(user_id, challenge_id)

TABLE: xp_events
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- amount INTEGER NOT NULL
- reason TEXT NOT NULL
- reference_id UUID -- generic reference to the triggering entity
- created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

TABLE: badges
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- badge_type TEXT NOT NULL CHECK (badge_type IN ('identity_locked', 'first_habit_logged', 'seven_day_streak', 'cookie_jar_first', 'first_challenge_complete', 'thirty_day_member'))
- earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
- UNIQUE(user_id, badge_type)

TABLE: forge_score_history
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- score INTEGER NOT NULL
- recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

Enable RLS on every table. Add these policies:
- For all user-data tables: `ENABLE ROW LEVEL SECURITY`, then `CREATE POLICY "Users can only access own data" ON [table] FOR ALL USING (auth.uid() = user_id);`
- For callousing_challenges (read-only public): `CREATE POLICY "Anyone authenticated can read challenges" ON callousing_challenges FOR SELECT USING (auth.role() = 'authenticated');`

Add indexes:
- habits: (user_id, is_active)
- habit_completions: (habit_id, local_date), (user_id, local_date)
- daily_checkins: (user_id, local_date)
- memories: (user_id, category), use ivfflat for embedding: `CREATE INDEX memories_embedding_idx ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);`
- cookie_jar: (user_id), ivfflat index on embedding
- forge_score_history: (user_id, recorded_at DESC)

Enable the pgvector extension at the top: `CREATE EXTENSION IF NOT EXISTS vector;`

Add a trigger to auto-update users.updated_at on row changes.
Add a trigger to auto-create a users row when a new auth.users record is inserted (via AFTER INSERT ON auth.users trigger, INSERT INTO public.users(id, email) VALUES (NEW.id, NEW.email)).

ACCEPTANCE: Migration runs successfully in Supabase dashboard. All tables visible. RLS enabled on all tables (shown by lock icon in Supabase table editor).
```

---

### Step 1.3 — Supabase Auth + Middleware

```
Implement Supabase Auth and Next.js middleware for MindForge.

INSTALL: @supabase/ssr @supabase/supabase-js

CREATE lib/supabase/client.ts:
Browser Supabase client using createBrowserClient from @supabase/ssr.
Uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.

CREATE lib/supabase/server.ts:
Server Supabase client using createServerClient from @supabase/ssr.
Uses cookies() from next/headers. Exports async function createClient().

CREATE middleware.ts (root level):
- Use createServerClient from @supabase/ssr with request/response cookie handling
- Get session via supabase.auth.getUser()
- If no session AND path starts with /app: redirect to /login
- If session AND path is /login: redirect based on onboarding status:
  - Fetch users.onboarding_complete and users.onboarding_step for the user
  - If onboarding_complete = false: redirect to /onboarding/[onboarding_step]
  - If onboarding_complete = true: redirect to /app/dashboard
- Apply middleware to: matcher: ['/((?!_next/static|_next/image|favicon.ico|api/billing/webhook).*)']

CREATE app/(auth)/login/page.tsx:
- Full dark background (#0A0908)
- Centered layout, max-width 400px
- MindForge logotype (text, bold, orange, font-heading, text-2xl)
- Tagline below: "Rewire your brain. Forge your identity." (text-muted, text-sm)
- 32px gap
- "Continue with Email" section: email input (full width, dark bg #161514, border #2A2927, text-primary, sharp corners, focus ring orange) + "Send Magic Link" button (full width, bg orange #FF6B2B, text black, sharp corners, font-medium)
- Divider: "or" with horizontal lines
- "Continue with Google" button (full width, border #2A2927, bg transparent, text-primary, Google icon SVG on left)
- Success state: "Magic link sent! Check your email." shown after submission
- Use Supabase signInWithOtp for magic link, signInWithOAuth for Google

CREATE app/(auth)/callback/route.ts:
- Exchange code for session via supabase.auth.exchangeCodeForSession(code)
- On success: redirect to /app/dashboard (middleware will redirect to onboarding if needed)
- On error: redirect to /login?error=auth_error

ACCEPTANCE: Magic link email is received. Clicking it logs the user in. Unauthenticated /app/* access redirects to /login. Google OAuth button initiates OAuth flow.
```

---

### Step 1.4 — tRPC Setup

```
Set up tRPC for MindForge with full type-safe server/client communication.

INSTALL: @trpc/server @trpc/client @trpc/react-query @trpc/next @tanstack/react-query zod

CREATE server/trpc/context.ts:
- Export createTRPCContext that:
  - Creates Supabase server client
  - Gets user from supabase.auth.getUser()
  - Fetches users row (id, tier, onboarding_complete) if authenticated
  - Returns { supabase, user: authUser | null, userProfile: dbUser | null }

CREATE server/trpc/trpc.ts:
- Initialize tRPC with context
- Create base router and procedure
- Create protectedProcedure: throws UNAUTHORIZED if no user
- Create requireTier helper: requireTier(ctx, 'pro') — throws FORBIDDEN if user.tier is insufficient (free < pro < elite)

CREATE server/trpc/router.ts (root router):
- Import and merge: habits, checkins, cookiejar, challenges, analytics, user, pods routers
- Export type AppRouter

CREATE server/trpc/routers/user.ts (stub):
- updateProfile mutation (name, why_statement, identity_declaration)
- getProfile query
- submitEnvironmentAudit mutation (stub — returns empty array for now)
- markEnvironmentItemDone mutation (stub)

CREATE server/trpc/routers/habits.ts (stub):
- list query (returns empty array)
- create mutation (stub)
- update mutation (stub)
- archive mutation (stub)
- logCompletion mutation (stub)

CREATE server/trpc/routers/checkins.ts (stub):
- submit mutation (stub)
- getToday query (stub)
- getHistory query (stub)

CREATE server/trpc/routers/cookiejar.ts (stub):
- list query, create mutation, delete mutation (all stubs)

CREATE server/trpc/routers/challenges.ts (stub):
- list query, activate mutation, complete mutation (all stubs)

CREATE server/trpc/routers/analytics.ts (stub):
- getForgeScoreHistory query (stub)
- getHabitStats query (stub)

CREATE server/trpc/routers/pods.ts (stub):
- Empty router with a comment "// Accountability Pods — v2 feature, deferred"

CREATE app/api/trpc/[trpc]/route.ts:
- Standard Next.js tRPC handler using fetchRequestHandler

CREATE lib/trpc/client.ts:
- tRPC React Query client setup with transformer (superjson)
- Export api (typed tRPC client hooks)

CREATE lib/trpc/provider.tsx:
- QueryClient + tRPC provider component for app/layout.tsx

Add TRPCProvider to app/layout.tsx wrapping children.

INSTALL: superjson @trpc/server/adapters/fetch

ACCEPTANCE: No TypeScript errors on `tsc --noEmit`. The tRPC handler responds at /api/trpc/user.getProfile (should return 401 when unauthenticated). All stub routers compile cleanly.
```

---

### Step 1.5 — Core Layout Components

```
Build the app shell layout components for MindForge.

CREATE components/layout/Sidebar.tsx:
Navigation items (with icons from lucide-react):
- Dashboard (LayoutDashboard icon) → /app/dashboard
- Habits (CheckSquare icon) → /app/habits
- Daily Mirror (BookOpen icon) → /app/checkin
- AI Coach (Brain icon) → /app/coach [Pro badge shown]
- Cookie Jar (Cookie icon) → /app/cookie-jar
- Challenges (Zap icon) → /app/challenges
- Analytics (BarChart2 icon) → /app/analytics
- Settings (Settings icon) → /app/settings

Styling: fixed left sidebar, width 240px on desktop. Background #111110. Each nav item: flex row, icon + label, padding 12px 16px, text-muted default, text-primary on hover, bg #1A1918 on hover, border-left 2px solid transparent, border-left-color orange on active route. Use usePathname() from next/navigation for active state.

Mobile: hidden on < lg breakpoint (MobileNav handles mobile).

CREATE components/layout/MobileNav.tsx:
Fixed bottom navigation for mobile (visible only below lg breakpoint).
Show 5 items: Dashboard, Habits, Mirror, Cookie Jar, Settings.
Background #111110, border-top #2A2927. Icons + labels. Active state: orange icon + label.

CREATE components/layout/Header.tsx:
Top bar, height 56px, background #111110, border-bottom #2A2927.
Left: page title (passed as prop or derived from pathname).
Right: ForgeScore widget (import ForgeScore component) + user avatar (if available, else initials circle, bg #232220).

CREATE components/forge/ForgeScore.tsx:
Displays the user's Forge Score.
Layout: small label "FORGE SCORE" (text-xs, text-muted, tracking-widest), large number below (text-display font size, text-primary, tabular nums, Geist font).
Animate score changes using Framer Motion useSpring + useTransform for count-up over 300ms.
On score increase: apply box-shadow glow (rgba(255,107,43,0.15)) via ::after opacity animation — NOT direct box-shadow.
For now accept score as prop (will be wired to real data in Phase 5).

CREATE app/(app)/layout.tsx:
App shell layout for all /app/* routes.
- Sidebar on left (desktop only)
- Main content area: flex-1, overflow-y-auto, bg #0A0908
- Header at top of main area
- MobileNav at bottom (mobile only)
- Wrap with a <div> that has padding-left 240px on lg+, padding-bottom 64px on mobile for the bottom nav

CREATE app/(app)/dashboard/page.tsx (stub):
Simple placeholder: "Dashboard — Coming Soon" with the forge color scheme. This confirms the layout shell works.

ACCEPTANCE: Navigating to /app/dashboard (after logging in) shows the sidebar + header + placeholder content. Sidebar highlights the active route. Header shows "FORGE SCORE 0". Mobile view shows bottom nav.
```

---

## PHASE 2: Onboarding (Days 15–21)
*Goal: Complete 3-step onboarding flow with AI streaming responses.*

---

### Step 2.1 — Gemini Client Setup

```
Set up the Google Gemini AI client for MindForge.

INSTALL: @google/generative-ai

CREATE lib/gemini/client.ts:
- Initialize GoogleGenerativeAI with GEMINI_API_KEY
- Export geminiPro: getGenerativeModel({ model: 'gemini-2.5-pro' })
- Export geminiFlash: getGenerativeModel({ model: 'gemini-2.5-flash' })
- Export embeddingModel: getGenerativeModel({ model: 'text-embedding-004' })

CREATE lib/gemini/prompts.ts:
Define and export all system prompts as constants (versioned with a comment // v1.0):

FORGE_COACH_BASE_SYSTEM_PROMPT:
"You are the Forge Coach — an AI built on neuroscience, behavioral psychology, and the philosophy of peak performers like David Goggins and Jocko Willink. You do NOT coddle. You do NOT offer participation trophies. You tell the truth, even when it's uncomfortable. You treat the user as a capable adult who is here to change their life, not be comforted. Your responses are direct, specific, and grounded in what the user has actually written. You never use hollow affirmations ('great job!', 'you've got this!'). You acknowledge genuine wins with respect, not cheerleading. You identify excuse patterns when you see them — label them clearly and redirect. You end coaching sessions with one actionable next step or one probing question, never both."

ONBOARDING_MIRROR_SYSTEM_PROMPT (extends base):
Add: "This is the user's first interaction. They have just written a raw, honest accountability mirror entry. Your job: Read it carefully. Identify the central pattern — is this person avoiding responsibility, or genuinely facing themselves? Respond in 150–300 words. Be honest. If they are making excuses, name the excuses specifically (quote their words back). If they show genuine self-awareness, acknowledge it without praising it. End with exactly one probing question that will make them think differently about their situation."

WHY_EXCAVATION_SYSTEM_PROMPT (extends base):
Add: "You are conducting a Why Excavation — a structured Socratic dialogue to uncover the user's deepest identity-level motivation. Use the 5 Whys method. Each turn: acknowledge what they said, then ask one deeper 'why' question. After 4–6 turns, synthesize their answers into a single 'Why Statement' in this format: 'You want to [identity goal] — someone who [specific character trait implied by their answers].' Present this statement and ask them to accept or refine it. Then ask for one Identity Declaration: 'Complete this: I am someone who...'"

CHECKIN_DEBRIEF_SYSTEM_PROMPT:
"You are the Forge Coach reviewing the user's daily accountability mirror entry. Prior memories about this user: {MEMORIES}. Today's entry: analyze it against their stated why ({WHY_STATEMENT}) and identity declaration ({IDENTITY_DECLARATION}). Classify their mood signal (crushing/steady/struggling/excusing/deflecting) and give them a direct debrief in 150–250 words: what patterns you see, whether their actions match their identity, and one specific next step. If they are excusing or deflecting, name it directly."

FORTY_PERCENT_RULE_SYSTEM_PROMPT:
"The user is at their mental limit and about to quit or miss a commitment. Research shows humans give up at 40% of their true capacity. Your job: deliver a direct, specific intervention in 100–150 words. Reference their Why Statement. Name the exact choice they're making. Give them one micro-step they can take in the next 5 minutes. Do not be gentle. Do not offer an exit. Give them a way through."

CREATE lib/gemini/embeddings.ts:
- Export async function generateEmbedding(text: string): Promise<number[]>
- Uses embeddingModel.embedContent(text)
- Returns the embedding values array
- Include error handling with retry (1 retry on failure)

ACCEPTANCE: No TypeScript errors. Importing from lib/gemini/client.ts works without runtime errors (API key not needed for compilation check).
```

---

### Step 2.2 — SSE Streaming Endpoint

```
Build the Server-Sent Events (SSE) streaming endpoint for AI coaching responses.

CREATE app/api/coach/stream/route.ts:

This is a POST endpoint that:
1. Authenticates the user via Supabase server client
2. Parses the request body: { session_type, messages, context }
   - session_type: 'onboarding_mirror' | 'why_excavation' | 'checkin_debrief' | 'direct_chat' | 'forty_percent' | 'challenge_reflection'
   - messages: Array<{role: 'user'|'model', parts: [{text: string}]}>
   - context: { why_statement?, identity_declaration?, memories? }
3. Selects the appropriate system prompt from lib/gemini/prompts.ts based on session_type
4. For checkin_debrief: interpolates WHY_STATEMENT, IDENTITY_DECLARATION, MEMORIES into the prompt
5. Calls geminiPro.startChat({ history: messages, systemInstruction: systemPrompt })
6. Calls chat.sendMessageStream(lastUserMessage)
7. Returns a ReadableStream (SSE format):
   - Each chunk: `data: ${JSON.stringify({ text: chunk.text() })}\n\n`
   - On completion: `data: [DONE]\n\n`
   - On error: `data: ${JSON.stringify({ error: 'Coach unavailable' })}\n\n`

Response headers: Content-Type: text/event-stream, Cache-Control: no-cache, Connection: keep-alive

Rate limiting: Check a simple in-memory counter per userId (20 requests/hour). If exceeded return 429 with { error: 'Rate limit exceeded. Try again in an hour.' }

Note: For onboarding_mirror session_type, do NOT trigger memory extraction after the response completes.

CREATE a client-side hook lib/hooks/useStreamingResponse.ts:
- Takes endpoint URL and request body
- Manages streaming state: { text: string, isStreaming: boolean, isComplete: boolean, error: string | null }
- Uses fetch with ReadableStream reader
- Parses SSE data lines
- Handles [DONE] signal
- Exports: { streamedText, isStreaming, isComplete, error, startStream }

ACCEPTANCE: POST to /api/coach/stream with a valid session and test message returns a streaming SSE response. The hook correctly accumulates streamed text chunks.
```

---

### Step 2.3 — Onboarding Step 1: Accountability Mirror

```
Build the Onboarding Step 1 — Accountability Mirror page.

CREATE app/(onboarding)/mirror/page.tsx:

LAYOUT: Full-screen dark layout (#0A0908). No sidebar. No header nav.
Centered content, max-width 720px, padding 48px 24px.

TOP: Small breadcrumb "Step 1 of 3" (text-xs, text-muted). Below: "Face the Mirror" (text-4xl, font-heading, text-primary). Below: "Write the truth about where you are right now. Your failures. Your excuses. Your wasted potential. Don't filter it." (text-base, text-secondary, max-width 560px).

TEXTAREA: width 100%, height 60vh minimum, background #161514, border 1px solid #2A2927, text-primary, text-base, line-height 1.65, padding 20px, no border-radius (sharp), placeholder "Start writing..." that disappears on focus. No character counter visible.

SUBMIT BUTTON: "Submit to the Mirror" — full width, bg #FF6B2B, text black, font-bold, sharp corners, disabled + opacity-50 until textarea has ≥100 characters. On hover: bg #FF5214, ::after glow effect.

AI RESPONSE AREA (hidden until submit):
- Appears below the submitted text
- Has a left border 3px solid #FF6B2B
- Padding 20px
- Text streams in character by character (use useStreamingResponse hook)
- "Forge Coach is thinking..." animated state (pulsing dots) shown while waiting for first token (up to 3 seconds)
- After streaming completes: "I'm Ready — Continue" button appears (same style as submit button)
- Clicking Continue: calls tRPC user mutation to set onboarding_step = 'why', then router.push('/onboarding/why')

DATA STORAGE: On submit, call tRPC checkins.submit with { raw_text, is_onboarding_mirror: true, local_date }. Store the AI response via a second tRPC call checkins.updateAiResponse once streaming completes.

STATE MANAGEMENT: submitted (boolean), submittedText (string), streamedResponse (string), isComplete (boolean).

If user has already completed this step (onboarding_step !== 'mirror'), redirect to /onboarding/why immediately.

ACCEPTANCE: User can type ≥100 chars. Submit button enables. On submit, AI streams a response. After streaming completes, "I'm Ready — Continue" button appears. Clicking it redirects to /onboarding/why.
```

---

### Step 2.4 — Onboarding Step 2: Why Excavation

```
Build the Onboarding Step 2 — Why Excavation multi-turn chat page.

CREATE app/(onboarding)/why/page.tsx:

LAYOUT: Full-screen dark layout. No sidebar. Centered, max-width 720px.
Top: "Step 2 of 3" breadcrumb. Title: "Excavate Your Why" (text-4xl, font-heading). Subtitle: "Your coach will guide you to the motivation that won't break." (text-secondary).

CHAT INTERFACE:
- Messages list: scrollable area, max-height 65vh, overflow-y-auto
- Coach messages: left-aligned bubble, background #111110, border 1px solid #1A3A6E (blue), text-secondary, padding 16px, max-width 85%
- User messages: right-aligned bubble, background #1A1918, border 1px solid #2A2927, text-primary, padding 16px, max-width 85%
- Auto-scroll to bottom on new message

INITIAL STATE: On page load, show the coach's opening message streaming in: "What's the one thing you want most to change or achieve? Be specific — not 'be better', but what does better actually look like for you?"

INPUT AREA: Fixed at bottom. Textarea (1–3 lines, auto-expand). "Send" button (bg orange, sharp). Disable send while coach is streaming.

TURN MANAGEMENT:
- Track conversation as messages array: Array<{role: 'user'|'coach', content: string}>
- On each user send: append user message, POST to /api/coach/stream with session_type='why_excavation', full conversation history
- Stream coach response and append
- Max 8 turns total

WHY STATEMENT ACCEPTANCE FLOW:
- After turn 4–6, the coach will present a Why Statement
- Detect this by checking if the coach response contains the pattern "You want to..."
- When detected: show the statement in a highlighted card (border 2px solid #FF6B2B, padding 24px)
- Two buttons: "This is my truth — Accept" (orange button) and "Refine it" (ghost button, max 2 refinement attempts)
- On Accept: show Identity Declaration input: "Complete this: I am someone who..." (text input, full width)
- On Identity Declaration submit: call tRPC user.updateProfile({ why_statement, identity_declaration })
- Then show "Identity Locked" badge animation (badge icon: scale(0) rotate(-15deg) → scale(1.15) rotate(5deg) → scale(1) with Framer Motion spring stiffness:250 damping:12)
- Award badge via tRPC (badge_type: 'identity_locked')
- "Continue to Step 3" button appears → set onboarding_step = 'environment' → redirect to /onboarding/environment

NO back button. This is a commitment.

ACCEPTANCE: Multi-turn chat works. After 4–6 turns a Why Statement card appears. User can accept or refine (max 2). After accepting and entering Identity Declaration, the badge animation plays. Redirects to Step 3.
```

---

### Step 2.5 — Onboarding Step 3: Environment Audit

```
Build the Onboarding Step 3 — Environment Audit page.

CREATE app/(onboarding)/environment/page.tsx:

LAYOUT: Full-screen dark layout. No sidebar. Centered, max-width 640px.
Top: "Step 3 of 3" breadcrumb + progress bar (1–12 steps, orange fill, height 4px, sharp).
Title changes per question.

THE 12 QUESTIONS (one per screen, multiple choice 3–4 options):
1. "Where is your phone at night?" → [On my nightstand, plugged in, In another room, Under my pillow, I don't have a set place]
2. "Do you have social media apps on your home screen?" → [Yes, multiple, Yes, one or two, No, they're in folders, No, I deleted them]
3. "Describe your workspace" → [Clean desk, minimal distractions, Somewhat cluttered, Very cluttered / I work from my couch, I don't have a dedicated workspace]
4. "How accessible is junk food in your home?" → [None in the house, It's there but out of sight, It's visible on the counter, Everywhere and easy to grab]
5. "Where is your alarm?" → [Phone next to my bed, Across the room / separate alarm clock, I use a phone on a table, No alarm / I wake naturally]
6. "Do you have books or learning material visible?" → [Books on my desk / shelf I can see, Books exist but stored away, I read digitally only, I don't read regularly]
7. "How easy is it to drink water in your home?" → [Water bottle always filled and visible, I have to go get water each time, I usually forget to drink water, I prefer other drinks]
8. "Where is your gym bag or workout gear?" → [Ready and visible, Put away but accessible, Have it but rarely use it, I don't have workout gear]
9. "Do you have a TV in your bedroom?" → [Yes and I watch it most nights, Yes but I rarely use it, No]
10. "How would you describe your phone notification settings?" → [Most notifications off, only essentials, Many apps send notifications, Everything is on, I've never adjusted them]
11. "How would you describe your sleep environment?" → [Dark, cool, no screens — optimized, Pretty good but room for improvement, Screens on, not dark enough, Pretty chaotic]
12. "What is your biggest environmental trigger for your main bad habit?" → [Social media / phone, Food / kitchen, Certain people or places, Evening / night time, Stress]

UI: Card layout. Question title text-2xl, options as large clickable cards (border #2A2927, bg #111110, hover bg #1A1918, selected: border #FF6B2B bg #1A0A04). Back/Next navigation. "Submit" on step 12.

ON SUBMIT:
- Call tRPC user.submitEnvironmentAudit with all 12 answers
- This calls Gemini 2.5 Flash with a structured JSON output prompt:
  "Based on these environment audit answers: {answers}, generate 5–8 specific, actionable environment redesign recommendations. Return JSON array: [{item: string, category: string, done: boolean}]. Each item must be a specific physical action (e.g., 'Move your phone charger to the kitchen tonight' not 'Use your phone less'). Reference the user's specific answers."
- Display results as numbered checklist cards
- Each card has title + "Mark as Done" button (calls tRPC user.markEnvironmentItemDone)
- Completing any item: award 50 XP
- "Enter the Forge" button at bottom: sets onboarding_complete = true, onboarding_step = 'complete', redirects to /app/dashboard

ACCEPTANCE: All 12 questions display with proper navigation. On submit, AI generates personalized recommendations in <10 seconds. "Mark as Done" works. "Enter the Forge" redirects to dashboard.
```

---

## PHASE 3: Core Habit Engine (Days 22–35)
*Goal: Full habit CRUD, completion logging, streak tracking, and dashboard habit cards.*

---

### Step 3.1 — Habit CRUD (tRPC + UI)

```
Implement full habit management for MindForge.

UPDATE server/trpc/routers/habits.ts with real implementations:

habits.list: Protected query. Fetch all active habits for user (is_active = true). Also fetch today's completion status for each habit from habit_completions where local_date = today. Return: Array<{id, name, category, habit_type, frequency_days, current_streak, longest_streak, today_status: 'pending'|'completed'|'missed'}>

habits.create: Protected mutation. Input: {name (max 60 chars), category, habit_type, frequency_days}. 
- Free tier check: count active habits — if ≥3, throw FORBIDDEN with { upgradeRequired: true }
- Insert into habits
- Insert into habit_streaks with defaults
- Award badge 'first_habit_logged' if this is their first habit ever (check badge table)
- Return created habit

habits.update: Protected mutation. Input: {id, name?, category?, frequency_days?}. Verify habit belongs to user. Update habits row.

habits.archive: Protected mutation. Input: {id}. Set is_active = false. Habit excluded from all future calculations.

habits.logCompletion: Protected mutation. Input: {habit_id, local_date (DATE string 'YYYY-MM-DD'), completed (boolean)}.
- Verify habit belongs to user
- Upsert into habit_completions
- Call recalculateStreak(habit_id, user_id, local_date)
- If completed: call awardXP(user_id, 20, 'habit_completed', habit_id)
- Call recalculateForgeScore(user_id)
- If completed and streak ≥7: check if 'seven_day_streak' badge already earned; if not, award it
- If NOT completed and current_streak ≥7 BEFORE this miss: trigger 40% Rule flag (return { triggerFortyPercent: true } in response)
- Return: { streak: newStreakValue, forgeScore: newScore, xpAwarded: number, leveledUp: boolean, triggerFortyPercent: boolean }

CREATE lib/streak.ts:
recalculateStreak(habit_id, user_id, local_date):
- Query habit_completions for this habit, last 90 days, ordered by local_date DESC
- Walk back from local_date counting consecutive days where completed = true
- Stop at first gap or missed day
- Update habit_streaks: { current_streak, longest_streak (max of current and existing), last_completed_date }
- Return current_streak

CREATE app/(app)/habits/page.tsx:
List of all habits. "New Habit" button top right.
Each habit shown as HabitCard component.
If user is on free tier and has 3 habits: show upgrade banner.

CREATE components/forge/HabitCard.tsx:
Props: habit object (name, category, habit_type, today_status, current_streak).
Sharp rectangular card, background #111110, border-left 3px solid:
- Completed: #22C55E (green)
- Missed: #EF4444 (red)  
- Pending: #FF6B2B (orange)
Name (text-xl, font-heading), category badge (text-xs, rounded-sm), streak info (text-sm, text-muted).
Two buttons: "Completed" (bg green, text white) and "Missed" (bg red, text white). 
Disable both if already logged today. Show logged state instead.
On "Completed" click: optimistic update (instant UI change) + POST to habits.logCompletion.
Forge Spark animation on completion: 6–8 CSS particles (orange, random ±30px x, -20 to -60px y, scale to 0, 400ms, staggered 30ms delays). Implement as pure CSS @keyframes.

CREATE app/(app)/habits/[id]/page.tsx:
Habit detail page.
Top: habit name + category + edit/archive buttons.
Stats row: Current Streak, Longest Streak, Completion Rate % (text-display size, orange numbers).

CREATE components/forge/HabitGrid.tsx:
Calendar grid showing last 90 days.
7 columns (Mon–Sun). Each cell is a 12x12px square.
Colors: green (#22C55E) = completed, red (#EF4444) = missed, charcoal (#2A2927) = pending/no-data.
Hover tooltip: "March 15 — Completed" (use Radix UI Tooltip).

CREATE the habit create modal (or /app/habits/new page):
Form: Name input, Category select (health/mind/avoid/perform), Type select (build/avoid), Frequency multi-select (Mon–Sun checkboxes). Submit creates habit via tRPC.

ACCEPTANCE: User can create, view, complete, and miss habits. Streak increments correctly. Forge Spark animation fires on completion. Calendar grid shows history correctly.
```

---

### Step 3.2 — Dashboard Habit Cards

```
Update the dashboard to show today's habits and key metrics.

UPDATE app/(app)/dashboard/page.tsx:

LAYOUT: Two-column on desktop (lg+), single column on mobile.
Left column (2/3 width): Habit cards for today + check-in CTA.
Right column (1/3 width): Forge Score widget + XP bar + quick stats.

SECTIONS:

1. DAILY MIRROR CTA CARD (if no check-in today):
Background #111110, border-left 3px solid #FF6B2B.
Text: "The Mirror is waiting — face it" (text-xl, font-heading, text-primary).
Subtext: "Daily reflection keeps your coach sharp." (text-sm, text-muted).
Button: "Open the Mirror" → /app/checkin.
If check-in already done today: show "Mirror complete today ✓" (green text, text-sm).

2. TODAY'S HABITS section:
"Today's Habits" heading (text-2xl, font-heading).
Render HabitCard for each active habit (pending habits for today's frequency_days).
If no habits yet: empty state card with "Add your first habit" CTA → /app/habits/new.

3. RIGHT COLUMN — Forge Score widget:
Large ForgeScore component (score number in display size, orange).
Below: "Identity: [identity_declaration]" in text-xs text-muted (truncated to 60 chars).

4. RIGHT COLUMN — XP Bar:
CREATE components/forge/XPBar.tsx:
Shows level name + XP progress.
Level formula: level = Math.floor(xp_total / 500) + 1. XP needed for next level = (level * 500) - xp_total.
Progress bar: full width, height 8px, background #2A2927, fill #FF6B2B, sharp corners.
CSS width transition from old % to new % over 300ms cubic-bezier(0.16, 1, 0.3, 1).
Level-up animation: bar fills to 100%, 200ms pause, resets to 0%, fills to new %.
Level names: 1=Raw Iron, 2=Forged Steel, 3=Tempered Blade, 4=Battle-Hardened, 5=Unbreakable, 6=Iron Mind, 7=Forge Master, 8=Legendary.

5. RIGHT COLUMN — Streak summary:
Active habits sorted by current streak, show top 3 with flame emoji + streak count.

Data fetching: Use a single tRPC query (create dashboard.getAll query) that returns: { habits, todayCheckin, forgeScore, xpTotal, xpLevel, topStreaks }. Use React Suspense + skeleton loaders for async state.

CREATE skeleton loader components matching exact card dimensions (SkeletonHabitCard, SkeletonForgeScore, SkeletonXPBar).

ACCEPTANCE: Dashboard shows today's habits, check-in CTA, Forge Score, XP bar. Completing a habit from the dashboard updates the card state instantly (optimistic UI) and the Forge Score animates up.
```

---

## PHASE 4: Daily Check-In + AI Coach (Days 36–50)
*Goal: Daily check-in with AI debrief, mood classification, memory system, and coach chat.*

---

### Step 4.1 — Daily Check-In Page

```
Build the Daily Accountability Mirror check-in page.

CREATE app/(app)/checkin/page.tsx:

LAYOUT: Centered, max-width 720px, padding 48px 24px. No special full-screen treatment (uses app shell).

STATES:
A) No check-in today (default):
- Title: "Daily Accountability Mirror" (text-3xl, font-heading)
- Subtitle: current date formatted as "Tuesday, June 10" (text-sm, text-muted)
- Textarea: same styling as onboarding mirror. Placeholder: "What's the honest truth about today? What did you do? What did you avoid? No excuses — just facts." Min 50 characters for submit.
- "Submit to the Mirror" button (orange, full width, disabled until 50+ chars)
- On submit: POST to SSE endpoint, stream AI debrief response below
- If Free tier: show upgrade prompt instead of AI debrief: "Unlock your AI debrief — upgrade to Pro to get daily coaching from your Forge Coach."

B) Check-in submitted, AI streaming:
- Submitted text shown above (background #1A1918, padding 16px, text-secondary)
- "Forge Coach is analyzing..." state with animated dots
- AI debrief streams in below with orange left border

C) Check-in complete for today:
- Show submitted text (read-only)
- Show AI debrief (if Pro)
- "Check-in complete for today" green badge
- "View yesterday's check-in" link (if prior check-in exists)

UPDATE server/trpc/routers/checkins.ts with real implementations:
- submit: Insert into daily_checkins. After AI response is stored, trigger:
  1. Mood classification (Gemini Flash) — classify as crushing/steady/struggling/excusing/deflecting + honesty_score 1–10. Update daily_checkins row.
  2. Memory extraction (async, non-blocking) — call lib/gemini/memory.ts extractMemories(user_id, session_id, text)
- getToday: Fetch today's check-in for user (null if none)
- getHistory: Fetch last 30 check-ins for user

CREATE lib/gemini/memory.ts:
extractMemories(user_id, user_id, sessionId, checkInText):
- Call Gemini 2.5 Flash with prompt: "Extract 0–3 atomic memory facts from this coaching session text. Return JSON array: [{content: string, category: 'trigger'|'victory'|'pattern'|'identity'|'goal'|'obstacle'}]. Only extract genuinely new information. Do not extract generic statements. Examples of good memories: 'User wakes up at 6am', 'User struggles with night snacking after 10pm', 'User completed their first 5K'. Text: {text}"
- For each extracted memory: generate embedding via generateEmbedding(content), insert into memories table
- Run asynchronously — do not block check-in response

ACCEPTANCE: User can submit a daily check-in. AI debrief streams in (Pro). Free users see upgrade prompt. Check-in is read-only after submission. Mood classification is stored in DB after submission.
```

---

### Step 4.2 — AI Forge Coach Memory + RAG

```
Implement the persistent memory and RAG retrieval system for the AI Forge Coach.

This is the core AI differentiation feature — the coach remembers users across sessions.

UPDATE lib/gemini/coach.ts:

CREATE async function buildCoachContext(user_id: string):
- Fetch user profile: why_statement, identity_declaration, xp_level, current_streak_days, forge_score
- Fetch recent memories: SELECT content, category FROM memories WHERE user_id = ? ORDER BY created_at DESC LIMIT 20
- Return formatted context string:
  "User profile:
  - Why Statement: {why_statement}
  - Identity Declaration: {identity_declaration}
  - Current Forge Score: {forge_score}
  - Current Streak: {current_streak_days} days
  
  Remembered facts about this user:
  {memories formatted as bullet points by category}"

CREATE async function retrieveRelevantMemories(user_id: string, queryText: string, limit: number = 5):
- Generate embedding for queryText
- Run pgvector similarity search:
  SELECT content, category, 1 - (embedding <=> $1) as similarity
  FROM memories
  WHERE user_id = $2
  ORDER BY embedding <=> $1
  LIMIT $3
- Returns array of { content, category, similarity }
- Used for RAG retrieval when building check-in debrief context

UPDATE app/api/coach/stream/route.ts:
- For checkin_debrief and direct_chat session types:
  1. Call buildCoachContext(user_id) — get full profile context
  2. Call retrieveRelevantMemories(user_id, lastUserMessage) — get 5 most relevant memories
  3. Inject both into the system prompt via interpolation before streaming

CREATE app/(app)/coach/page.tsx (Pro-gated):
Direct AI Coach chat page.

TIER CHECK: If user is not Pro/Elite tier:
- Show locked state: centered card, "Your Coach is waiting."  title, "The Forge Coach builds a persistent memory of your patterns, triggers, and victories — and uses them to coach you like no app ever has." description, "Unlock with Pro" orange button → /app/upgrade.

IF PRO/ELITE:
- Full-page chat interface similar to why_excavation but ongoing
- Coach opening message loaded on page mount: a personalized greeting using buildCoachContext (streams in)
- Message history: last 50 messages from coach_sessions table
- Input at bottom, send on Enter or button click
- Session type: 'direct_chat'
- Each conversation stored in coach_sessions table
- "Memory" indicator: small "(Coach remembers you)" badge near header, clicking it shows a modal with the user's stored memories

ACCEPTANCE: Check-in debriefs include references to past memories (after a few check-ins). /app/coach is gated by tier. Pro users can have freeform coach conversations with memory context.
```

---

## PHASE 5: Forge Score + Gamification (Days 51–60)
*Goal: Full Forge Score formula, XP system, all 6 badges, 40% Rule Engine.*

---

### Step 5.1 — Forge Score Formula

```
Implement the full Forge Score calculation system.

CREATE lib/forge-score.ts:

FORGE SCORE FORMULA:
The Forge Score (0–1000) is calculated from 5 weighted components:
1. Habit Adherence Score (40% weight, max 400 pts):
   - Last 14 days of habit completions
   - completion_rate = completed_count / total_scheduled_count
   - Score = completion_rate * 400
   - Penalty: for each habit with streak broken in last 7 days, -20 pts

2. Check-In Consistency Score (25% weight, max 250 pts):
   - Last 14 days of check-ins submitted
   - checkin_rate = checkins_submitted / 14
   - Score = checkin_rate * 250

3. Honesty Score (15% weight, max 150 pts):
   - Average honesty_score from last 7 check-ins (where not null)
   - Score = (avg_honesty / 10) * 150

4. Challenge Activity Score (10% weight, max 100 pts):
   - Active challenges: +50 pts
   - Completed challenges: +10 pts each (max 5 additional challenges counted)
   - Cap at 100 pts

5. Environment Score (10% weight, max 100 pts):
   - Count of environment_audit items marked done
   - Score = (done_count / total_count) * 100

TOTAL = sum of all 5 components, rounded to nearest integer, capped at 1000, minimum 0.

CREATE async function recalculateForgeScore(user_id: string): Promise<number>:
- Fetch all required data in parallel (use Promise.all for all 5 component queries)
- Calculate each component
- Sum and cap at 1000
- Update users.forge_score
- Insert into forge_score_history with current timestamp
- Return new score

This function must complete in <200ms — use indexed queries only, no N+1 patterns.

UPDATE server/trpc/routers/analytics.ts:
- getForgeScoreHistory: Fetch last 90 days of forge_score_history for user, return as timeseries array [{date, score}]
- getDashboardStats: Return { forgeScore, habitStats, checkinStreak, avgHonestyScore }
```

---

### Step 5.2 — XP, Badges, and Gamification

```
Implement XP system, all 6 badges, and the 40% Rule Engine.

CREATE lib/xp.ts:

XP AWARD TABLE:
- Habit completed: 20 XP
- Daily check-in submitted: 30 XP
- AI debrief received: 20 XP (Pro only)
- Environment item marked done: 50 XP
- Challenge completed: 100 XP
- Cookie Jar entry added: 15 XP
- 7-day streak milestone: 100 XP bonus
- 30-day streak milestone: 300 XP bonus

CREATE async function awardXP(user_id: string, amount: number, reason: string, reference_id?: string):
- Insert into xp_events
- Update users.xp_total += amount
- Calculate new level: Math.floor(new_xp_total / 500) + 1
- If new level > old level: update users.xp_level, return { leveledUp: true, newLevel, levelName }
- Return { leveledUp: boolean, newLevel: number, levelName: string, xpAwarded: number }

LEVEL NAMES MAP:
1=Raw Iron, 2=Forged Steel, 3=Tempered Blade, 4=Battle-Hardened, 5=Unbreakable, 6=Iron Mind, 7=Forge Master, 8=Legendary

CREATE lib/badges.ts:

SIX v1 BADGES:
1. identity_locked: Earned on completing Why Excavation onboarding
2. first_habit_logged: Earned on logging a habit completion for the first time ever
3. seven_day_streak: Earned when any habit reaches a 7-day consecutive streak
4. cookie_jar_first: Earned on adding first Cookie Jar entry
5. first_challenge_complete: Earned on completing a Callousing Challenge for the first time
6. thirty_day_member: Earned on the 30th day after account creation

CREATE async function checkAndAwardBadge(user_id: string, badge_type: BadgeType):
- Check if badge already exists in badges table for this user (idempotent)
- If not: INSERT into badges, award 50 XP with reason 'badge_earned'
- Return { awarded: boolean, badge_type }

CREATE async function checkThirtyDayBadge(user_id: string):
- Fetch users.created_at
- If (now - created_at) >= 30 days AND badge not yet awarded: award it
- This runs on every daily check-in submission

CREATE components/forge/RuleForty.tsx (40% Rule Engine):

TRIGGER CONDITIONS (checked in habits.logCompletion and checkins.submit):
- Habit missed AND current streak was ≥7 before the miss
- Mood signal classified as 'excusing' or 'deflecting' on check-in
- Max 1 auto-trigger per day (check daily_rule_triggers count in users metadata)

COMPONENT:
- Full-screen overlay: pure black background (#000000) snaps in at 80ms (no animation — instant, urgency)
- Text fades in 100ms after overlay appears
- Header: "40% RULE" in text-4xl, font-heading, orange (#FF6B2B)
- Subtext: "You are at your limit. Research shows you have given 40% of your true capacity. The other 60% is still in there." (text-base, text-secondary)
- Streams a personalized intervention from Forge Coach (session_type: 'forty_percent') referencing the user's Why Statement
- Two buttons after stream completes:
  - "I'll take the next step" (orange, full width) — closes modal, logs user chose to continue
  - "I need to stop for now" (ghost, full width, text-muted) — closes modal, logs user chose to stop
- Store choice in coach_sessions

ACCEPTANCE: Forge Score calculates correctly and updates within 200ms. XP and level-ups work. All 6 badges can be earned. 40% Rule modal appears correctly and streams an intervention.
```

---

## PHASE 6: Cookie Jar + Challenges (Days 61–70)
*Goal: Victory archive with semantic search, Callousing Challenge system.*

---

### Step 6.1 — Cookie Jar

```
Build the Cookie Jar victory archive feature.

The Cookie Jar is inspired by David Goggins' concept of storing past victories to draw from when you're struggling.

UPDATE server/trpc/routers/cookiejar.ts with real implementations:

cookiejar.list: Protected query. Fetch all cookie_jar entries for user, ordered by created_at DESC. Return with similarity scores if search query provided.

cookiejar.create: Protected mutation. Input: {title (max 100 chars), description, date_of_victory (optional DATE)}.
- Free tier check: count entries — if ≥5, throw FORBIDDEN with { upgradeRequired: true }
- Insert into cookie_jar
- Generate embedding: await generateEmbedding(title + ' ' + description)
- Update cookie_jar row with embedding
- Award badge 'cookie_jar_first' if first entry
- Award XP 15
- Return created entry

cookiejar.delete: Protected mutation. Input: {id}. Verify ownership. Delete row.

cookiejar.search: Protected query. Input: {query: string}.
- Generate embedding for query
- Run pgvector similarity search against user's cookie jar entries
- Return top 5 most similar entries with similarity scores
- Used by coach to surface relevant past victories during struggling moments

CREATE app/(app)/cookie-jar/page.tsx:

HEADER: "Cookie Jar" title + "Add Victory" button (orange).
Search bar: text input, on type searches semantic matches (debounced 300ms).
If search active: show semantic matches with similarity indicator.

CREATE components/forge/CookieJarEntry.tsx:
Card: background #111110, border #2A2927, hover border #3D3B39.
Victory title (text-xl, font-heading), date badge (text-xs, text-muted, if provided), description (text-base, text-secondary, truncated to 3 lines with expand).
Delete button (icon, shows on hover, red, with confirmation).

ADD VICTORY MODAL/DRAWER:
- Title input (max 100 chars, required)
- Description textarea (no limit, required)
- Date of Victory: optional date picker (shadcn Calendar)
- "Lock It In" submit button (orange)

Free tier empty state (≥5 entries): "You have 5 victories stored. Upgrade to Pro to save unlimited victories." with upgrade CTA.

ACCEPTANCE: User can add, view, search (semantic), and delete cookie jar entries. Free tier caps at 5. Semantic search returns relevant past victories.
```

---

### Step 6.2 — Callousing Challenges

```
Build the Callousing Challenge system and seed the challenge library.

First, create a Supabase seed file supabase/seed.sql with 20 challenges:

INSERT INTO callousing_challenges (title, description, difficulty, category, duration_days, min_tier) VALUES
-- Free challenges (difficulty 1-2)
('Cold Shower Protocol', 'End every shower with 60 seconds of cold water for 7 days straight. No warming back up. No exceptions.', 2, 'physical', 7, 'free'),
('Phone-Free Morning', 'No phone for the first 60 minutes after waking. Every day for 7 days.', 1, 'digital', 7, 'free'),
('5AM Wake Protocol', 'Wake at 5AM every day for 5 days. No snooze. Get out of bed immediately.', 2, 'physical', 5, 'free'),
('No Complaint Day', 'Go an entire day without complaining — verbally or mentally. Restart if you slip.', 1, 'mental', 1, 'free'),
('The Hard Conversation', 'Have one difficult conversation you have been avoiding. Do it within 48 hours.', 2, 'social', 2, 'free'),
-- Pro challenges (difficulty 3)
('Dopamine Detox Weekend', 'No social media, no streaming, no alcohol, no junk food for 48 hours. Only books, exercise, and meaningful work.', 3, 'digital', 2, 'pro'),
('10K in 7 Days', 'Run or walk 10 kilometers within 7 days. Track it. No excuses for weather.', 3, 'physical', 7, 'pro'),
('30-Day No Algorithm Feed', 'Delete all social media apps for 30 days. Not muted — deleted.', 3, 'digital', 30, 'pro'),
('Public Rejection Training', 'Ask for something unreasonable in public (a discount, an impossible request) 3 times in one week. Train yourself to handle rejection.', 3, 'social', 7, 'pro'),
('Sleep Discipline Protocol', 'In bed by 10:30PM, awake by 5:30AM, every day for 14 days. Non-negotiable.', 3, 'physical', 14, 'pro'),
('Silence Practice', '60 minutes of complete silence daily — no music, no podcasts, no conversation — for 7 days.', 3, 'mental', 7, 'pro'),
('Single-Tasking Week', 'No multitasking for 7 days. One thing at a time. No phone while eating. No background noise while working.', 3, 'mental', 7, 'pro'),
-- Elite challenges (difficulty 4-5)
('The 75 Hard Challenge', 'Follow the Andy Frisella 75 Hard protocol for 75 days: 2 workouts/day, diet, no alcohol, 1 gallon water, 10 pages reading, progress photo.', 5, 'physical', 75, 'elite'),
('No Entertainment Month', 'Zero passive entertainment for 30 days: no TV, no streaming, no social media, no gaming. Only creation and learning.', 4, 'digital', 30, 'elite'),
('Deliberate Discomfort Daily', 'Every day for 21 days, do one thing that makes you genuinely uncomfortable. Document it.', 4, 'mental', 21, 'elite'),
('Zero Complaint Month', '30 days without a single complaint. Wear a rubber band, snap it every time you complain, restart the count.', 4, 'mental', 30, 'elite'),
('Cold Immersion Protocol', 'Cold shower every morning + cold outdoor exposure (if accessible) for 21 days. Minimum 2 minutes cold per day.', 4, 'physical', 21, 'elite'),
('Financial Purge', 'Track every penny spent for 30 days. Cut all non-essential subscriptions. No eating out for 14 days.', 3, 'mental', 30, 'elite'),
('Digital Identity Audit', 'Audit every digital account, app, and subscription you own. Delete accounts you do not use. Unfollowing everyone who does not make you better.', 3, 'digital', 7, 'elite'),
('The 1000-Rep Week', 'Complete 1,000 total reps of any bodyweight exercises in one week. Track every rep.', 4, 'physical', 7, 'elite');

UPDATE server/trpc/routers/challenges.ts with real implementations:

challenges.list: Protected query. Fetch all active challenges. Filter by user's tier (free users see min_tier='free' only). Include user's progress for each (from user_challenges join).

challenges.activate: Protected mutation. Input: {challenge_id}.
- Check tier access
- Free tier: max 2 active challenges at a time
- Upsert into user_challenges (status='active', started_at=now)

challenges.complete: Protected mutation. Input: {challenge_id, reflection (required, min 50 chars)}.
- Verify challenge is active for user
- Update user_challenges: status='complete', completed_at=now, reflection
- Award XP: 100 XP
- Check and award 'first_challenge_complete' badge
- Call recalculateForgeScore(user_id)
- Return { xpAwarded, badgeAwarded, newForgeScore }

CREATE app/(app)/challenges/page.tsx:

Tabs: "Available" | "Active" | "Completed"
Each challenge as ChallengeCard component.
Difficulty shown as 1–5 filled lightning bolt icons (orange).
Duration badge. Category badge. "Accept Challenge" button.
Active challenges show a progress timer and "Complete" button.
Completing a challenge requires entering a reflection (≥50 chars) — stream it to the coach for feedback.

CREATE components/forge/ChallengeCard.tsx:
Card with sharp corners, background #111110.
Title (text-xl), description (text-sm, text-secondary, 3 lines truncated), difficulty icons (Zap icons, orange fill for filled, muted for empty), duration + category row.
Status badge: Available (border blue), Active (border orange, pulsing dot), Completed (border green, checkmark).

ACCEPTANCE: 20 challenges seeded. Free users see only free challenges. Activating and completing challenges works. XP and Forge Score update. Challenge reflection streams to coach.
```

---

## PHASE 7: Billing (Days 71–77)
*Goal: Lemon Squeezy payments, upgrade flow, settings page, tier enforcement.*

---

### Step 7.1 — Lemon Squeezy Integration

```
Implement Lemon Squeezy billing for MindForge.

INSTALL: @lemonsqueezy/lemonsqueezy.js crypto (built-in)

CREATE lib/lemonsqueezy.ts:

Initialize Lemon Squeezy with LEMONSQUEEZY_API_KEY.

CREATE async function createCheckoutUrl(user_id: string, email: string, variant_id: string): Promise<string>:
- Create a checkout via Lemon Squeezy API
- Set custom_data: { user_id } for webhook to match back to user
- Set checkout_data.email to prefill the email field
- Return the checkout URL

CREATE async function verifyWebhookSignature(payload: string, signature: string): boolean:
- HMAC-SHA256 verify using LEMONSQUEEZY_WEBHOOK_SECRET
- Return true if valid

TIER MAPPING:
- LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID → tier: 'pro'
- LEMONSQUEEZY_PRO_ANNUAL_VARIANT_ID → tier: 'pro'
- LEMONSQUEEZY_ELITE_MONTHLY_VARIANT_ID → tier: 'elite'
- LEMONSQUEEZY_ELITE_ANNUAL_VARIANT_ID → tier: 'elite'

CREATE app/api/billing/create-checkout/route.ts:
POST. Authenticated. Body: { variant_id }.
Call createCheckoutUrl. Return { checkoutUrl }.

CREATE app/api/billing/webhook/route.ts:
POST. No auth (public webhook endpoint — authenticated by signature).
1. Read raw body as text
2. Verify HMAC signature (return 401 if invalid, log to Sentry)
3. Parse event. Handle these event types:
   - subscription_created: Update users set tier=mapped_tier, lemonsqueezy_subscription_id, subscription_status='active'
   - subscription_updated: Update subscription_status
   - subscription_cancelled: Update subscription_status='cancelled', do NOT downgrade tier immediately (user paid through period end)
   - subscription_expired: Downgrade tier to 'free', subscription_status='expired'
4. All DB operations use service role key (bypasses RLS)
5. Idempotent: check lemonsqueezy_subscription_id before updating
6. Return 200 OK

CREATE app/(app)/upgrade/page.tsx:

Pricing table with 3 tiers:

FREE ($0/month):
- 3 habits max
- 5 cookie jar entries
- 5 challenges (free tier only)
- Daily check-in (no AI debrief)
- No coach chat

PRO ($19/month or $149/year — "Save 35%"):
- Unlimited habits
- Unlimited cookie jar
- All challenges
- AI daily debrief after every check-in
- Direct coach chat (unlimited)
- Weekly Neural Report email
- Memory system active

ELITE ($39/month or $299/year — "Save 37%"):
- Everything in Pro
- Weekly group coaching session (AI-facilitated)
- Priority AI response (<1 second)
- Identity reset (one-time why excavation redo)
- Founding member badge

Current tier highlighted with "Current Plan" badge.
Upgrade buttons call the checkout endpoint and redirect to Lemon Squeezy.
Monthly/Annual toggle with savings percentage shown.

ACCEPTANCE: Checkout redirects to Lemon Squeezy. Webhook verifies correctly. Subscription created event upgrades the user's tier in the database. Expired event downgrades to free.
```

---

### Step 7.2 — Settings Page

```
Build the Settings page.

CREATE app/(app)/settings/page.tsx:

SECTIONS (use Tabs or accordion):

1. PROFILE:
- Display name input
- Email (read-only, shown from auth)
- Avatar (placeholder for now — just initials circle)
- "Save changes" button

2. SUBSCRIPTION:
- Current tier badge
- Subscription status (active/cancelled/expired)
- "Manage Billing" button → links to Lemon Squeezy customer portal URL
- If Free: "Upgrade to Pro" CTA → /app/upgrade
- Cancellation note: "Cancelling keeps Pro access until your billing period ends."

3. IDENTITY:
- Why Statement (read-only in v1, shows current value)
- Identity Declaration (read-only in v1)
- Note: "Contact support to reset your identity foundation."

4. PREFERENCES:
- Timezone select (dropdown of major timezones — stored in users table, add timezone TEXT column if not exists)
- Email notifications toggle: Weekly Neural Report (Pro only)

5. DATA:
- "Export my data" button → triggers a background job that emails the user a JSON export of all their data (habits, check-ins, coach sessions, memories, cookie jar). Stub this for now — show "We'll email you your data within 24 hours."
- "Delete my account" button (destructive, red, requires typing "DELETE" to confirm) → soft delete flow: set is_deleted=true, schedule anonymization

ACCEPTANCE: Profile updates save correctly. Billing portal link works. Delete account requires confirmation text. Timezone preference is saved.
```

---

## PHASE 8: Weekly Report + Analytics (Days 78–84)
*Goal: Analytics dashboard, weekly AI neural report via email, Vercel cron job.*

---

### Step 8.1 — Analytics Page

```
Build the Analytics page.

INSTALL: recharts

CREATE app/(app)/analytics/page.tsx:

HEADER: "Your Neural Progress" (text-3xl, font-heading). Date range: "Last 30 Days" (default, dropdown for 7/30/90 days).

CHARTS (use Recharts, all dark themed):

1. FORGE SCORE HISTORY (Area chart):
- X-axis: dates (last 30 days)
- Y-axis: 0–1000
- Area fill: orange gradient (#FF6B2B 20% opacity at top → transparent at bottom)
- Line: #FF6B2B, strokeWidth 2
- Tooltip: "June 10: 342 points"

2. HABIT COMPLETION BARS (Grouped bar chart):
- X-axis: last 14 days dates
- Y-axis: 0–100% completion rate
- Bar color: green (#22C55E), red for missed days
- One bar per day showing that day's overall completion rate across all habits

3. CHECK-IN HONESTY TREND (Line chart):
- X-axis: last 14 days
- Y-axis: 1–10 honesty score
- Line: blue (#3B82F6), strokeWidth 2
- Dots on data points

4. XP EARNED TIMELINE (Bar chart):
- X-axis: last 14 days
- Y-axis: XP earned per day
- Bar color: #FF6B2B with 60% opacity

STATS ROW (above charts):
- Total Check-Ins: count
- Average Honesty Score: X.X/10
- Habits Completed This Month: count
- Current Forge Score: big number

All charts must render on a dark background (#111110 card background). Override Recharts default styles: cartesianGrid stroke '#2A2927', tick color '#87857F', tooltip background '#232220' border '#3D3B39'.

UPDATE server/trpc/routers/analytics.ts with real implementations:
- getAll: Returns all analytics data for selected date range in a single query
- Uses Supabase queries with date range filters

ACCEPTANCE: All 4 charts render with real data. Dark theme applied correctly. Date range selector updates all charts.
```

---

### Step 8.2 — Weekly Neural Report

```
Build the Weekly Neural Report email system.

INSTALL: resend @react-email/components @react-email/render

CREATE emails/WeeklyNeuralReport.tsx (React Email template):

EMAIL DESIGN: Dark background (#0A0908), full-width. Width 600px.

SECTIONS:
1. Header: MindForge logo text (orange, bold) + "Weekly Neural Report" subtitle + week dates
2. Forge Score: Large score number with week-over-week change (+/-X points, colored green/red)
3. "This Week's Forge Summary": 3 bullet stats (habits completed, check-ins submitted, XP earned)
4. AI-Generated Insight (150–200 words): Personalized analysis of the week's patterns from Gemini Pro
5. Top Streak: Highest streak habit highlighted
6. One Challenge for Next Week: AI-selected challenge from the library matching user's current level
7. Cookie Jar Reminder: "Remember this?" — one random cookie jar entry surfaced
8. Footer: "Unsubscribe" link, "View in App" CTA button (orange)

CREATE app/api/cron/weekly-report/route.ts:
- Verify Authorization header: `Bearer ${CRON_SECRET}` — return 401 if invalid
- Fetch all Pro/Elite users who have onboarding_complete = true and email notifications enabled
- For each user (process in batches of 10, with try/catch per user):
  1. Fetch user's stats for the past 7 days via analytics queries
  2. Fetch user's why_statement and identity_declaration
  3. Call Gemini 2.5 Pro with structured output prompt to generate the weekly insight JSON:
     { insight_text: string, challenge_recommendation: {title, description}, standout_moment: string }
  4. Render WeeklyNeuralReport email template with all data
  5. Send via Resend: from RESEND_FROM_EMAIL, to user.email, subject "Your Weekly Neural Report — [date range]"
  6. Log success/failure per user to Sentry
- Return { processed: N, failed: M }

CREATE vercel.json:
{
  "crons": [
    {
      "path": "/api/cron/weekly-report",
      "schedule": "0 8 * * 0"
    }
  ]
}
(Every Sunday at 8AM UTC)

ACCEPTANCE: Email template renders correctly in email client preview. Cron endpoint returns 401 without CRON_SECRET. With valid secret, it processes users and sends emails via Resend dashboard.
```

---

## PHASE 9: Polish + Launch Prep (Days 85–90)
*Goal: Error handling, performance, mobile, tracking, landing page, launch.*

---

### Step 9.1 — Error Handling + Skeleton Loaders

```
Add comprehensive error handling and skeleton loading states throughout MindForge.

ERROR BOUNDARIES:
Create components/ErrorBoundary.tsx (React class component error boundary).
Wrap each page in app/(app)/ with this boundary.
Error UI: centered card, "Something went wrong" title, error message (non-technical), "Refresh" button. Dark themed, forge style.

SKELETON LOADERS — create matching skeletons for all async components:
- SkeletonHabitCard: matches HabitCard exact dimensions, use animated shimmer (bg-forge-border via CSS animation: pulse 1.5s ease-in-out infinite)
- SkeletonForgeScore: rectangle matching score widget size
- SkeletonXPBar: rectangle matching XP bar
- SkeletonCheckinCard: matches check-in CTA card
- SkeletonChallengeCard: matches ChallengeCard
- SkeletonCookieJarEntry: matches CookieJarEntry

All skeletons use the Tailwind animate-pulse class with bg-forge-border (#2A2927) color blocks.

Wrap all page data fetches with React Suspense using matching skeleton fallbacks.

TOAST NOTIFICATIONS:
Install sonner (drop-in toast library with dark mode support).
Add Toaster component to app/(app)/layout.tsx.
Replace all alert() calls and inline success/error states with toast notifications.
Use toast.success for positive actions (habit logged, check-in submitted, badge earned).
Use toast.error for failures.
Style with forge dark theme (dark background, orange accent for success).

MEANINGFUL ERROR MESSAGES:
- Habit limit (Free): "You've reached 3 habits on the free plan. Upgrade to Pro for unlimited habits." [Upgrade button in toast]
- Rate limit: "You've reached today's coaching limit. Your coach resets in X hours."
- Gemini unavailable: "Your coach is temporarily unavailable. Your entry has been saved. Debrief will be generated shortly."
- Auth expired: "Your session expired. Redirecting to login..."

ACCEPTANCE: All pages show skeleton loaders before data loads. Error boundary catches failures gracefully. Toast notifications work throughout.
```

---

### Step 9.2 — PostHog + Sentry

```
Add PostHog analytics and Sentry error tracking.

INSTALL: posthog-js posthog-node @sentry/nextjs

POSTHOG SETUP:
Create lib/posthog.ts with PostHog browser client (NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST).
Create components/PostHogProvider.tsx wrapping the app.

Track these events (use posthog.capture in the appropriate locations):
- 'sign_up': On first-ever login (check if users row is newly created)
- 'onboarding_complete': When onboarding_complete is set to true
- 'habit_created': When a new habit is created (include category, habit_type)
- 'habit_logged': When a habit is completed or missed (include completed: boolean)
- 'checkin_submitted': When a daily check-in is submitted (include has_ai_debrief: boolean)
- 'coach_message_sent': When a message is sent to direct coach (Pro)
- 'upgrade_clicked': When any upgrade/pro CTA is clicked (include source: string)
- 'subscription_created': In the webhook handler (server-side, use posthog-node)
- 'challenge_activated': When a challenge is started
- 'challenge_completed': When a challenge is completed
- 'cookie_jar_entry_added': When a victory is added
- 'badge_earned': When any badge is awarded (include badge_type)
- 'forty_percent_triggered': When 40% Rule modal fires
- 'forty_percent_accepted': When user clicks "I'll take the next step"

SENTRY SETUP:
Run: npx @sentry/wizard@latest -i nextjs
Add NEXT_PUBLIC_SENTRY_DSN to env vars.
Wrap all API route handlers with Sentry.withSentry.
Add custom error context: user_id, tier, page for all captured exceptions.
Set tracesSampleRate: 0.1 (10% of transactions).

ACCEPTANCE: PostHog dashboard shows sign_up events when a new user registers. Sentry dashboard shows test error when thrown. No console errors from tracking code.
```

---

### Step 9.3 — Mobile Responsiveness Audit

```
Perform a full mobile responsiveness audit of all MindForge pages.

Test and fix at these breakpoints: 375px (iPhone SE), 390px (iPhone 14), 430px (iPhone 14 Pro Max).

KNOWN ISSUES TO ADDRESS:

1. SIDEBAR: Hidden on mobile (< lg). Replaced by MobileNav (bottom nav). Verify no layout shift when sidebar hides.

2. HABIT CARDS: "Completed" and "Missed" buttons must be minimum 44px tall for touch targets (iOS HIG requirement). Verify tap area is large enough.

3. FORGE SCORE: The display-size number (49px) may overflow on 375px. Cap at text-4xl on mobile.

4. ANALYTICS CHARTS: Recharts responsive container must work at 375px width. Test each chart. Reduce tick density on mobile (fewer x-axis labels).

5. COACH PAGE: Input textarea at bottom must not be covered by iOS keyboard. Use `env(safe-area-inset-bottom)` for padding on the input container.

6. ONBOARDING: Textarea height should be 50vh on mobile (vs 60vh on desktop) to leave room for keyboard.

7. COOKIE JAR SEARCH: Full-width on mobile.

8. MODALS (40% Rule, badge earn): Must be full-screen on mobile. No small floating dialogs.

9. HEADER: Forge Score number in header should show compact version on mobile (e.g., "342" without the "FORGE SCORE" label).

10. NAVIGATION: MobileNav bottom bar must account for iOS safe area: add `padding-bottom: env(safe-area-inset-bottom)` to the nav.

For each issue found: fix it. Use Tailwind responsive prefixes (sm:, md:, lg:) to apply different styles at each breakpoint.

After fixes, verify all core flows work on mobile:
- Login → Onboarding (all 3 steps)
- Dashboard habit completion with Forge Spark animation
- Daily check-in with AI streaming
- Cookie Jar add + semantic search

ACCEPTANCE: All core flows work at 375px. Touch targets meet 44px minimum. No horizontal scroll. No keyboard coverage issues.
```

---

### Step 9.4 — Landing Page

```
Build the MindForge marketing landing page at app/page.tsx.

DESIGN PRINCIPLES: Dark, high-energy, direct. No soft language. No generic SaaS copy. This is for people who are serious about changing their life.

SECTIONS:

1. HERO:
Full viewport height. Background: #0A0908. Optional: subtle radial gradient from orange at center (rgba(255,107,43,0.04) → transparent).
Eyebrow: "THE FIRST ACCOUNTABILITY SYSTEM THAT TELLS YOU THE TRUTH" (text-xs, letter-spacing wide, text-muted, uppercase).
Headline: "Stop being soft with yourself." (text-display, font-heading, text-primary, split across 2 lines for impact).
Sub-headline: "MindForge combines neuroscience-backed behavior change with an AI coach that builds a persistent memory of who you are — and holds you to who you said you'd be." (text-xl, text-secondary, max-width 600px).
CTA: "Start Forging — It's Free" (orange button, large, sharp, width 260px).
Below CTA: "No credit card. No gentle encouragement. Just accountability." (text-xs, text-muted).

2. PROBLEM SECTION:
Header: "Every other app is lying to you." (text-3xl, font-heading).
3 pain points (cards in a row):
- "Participation trophies" → "They reward showing up, not results. Your brain learns to tolerate failure."
- "No memory, no coaching" → "Generic reminders aren't coaching. There's no AI that actually knows you."
- "Surface motivation collapses" → "Without your deepest why, streaks break and you're back to zero."

3. HOW IT WORKS:
Header: "The Forge System" (text-3xl, font-heading).
3 steps as a numbered vertical flow:
1. "Face the Mirror" — Write the honest truth. Your AI coach responds without softening.
2. "Excavate your Why" — A Socratic AI dialogue uncovers your identity-level motivation. The anchor that won't break.
3. "Forge daily" — Log habits honestly, receive brutally honest AI coaching, watch your Forge Score rise.

4. KEY FEATURES (icon grid):
- Forge Score: "A real-time accountability score that tracks your actual behavior — not just effort."
- AI Memory: "Your coach remembers your patterns, triggers, and past victories across every session."
- 40% Rule Engine: "When you're about to quit, the system triggers. Research says you're at 40% of your capacity."
- Cookie Jar: "Store your past victories. Your coach surfaces them when you're struggling."
- Callousing Challenges: "Graduated discomfort that expands your mental toughness."
- No Skip Option: "Completed or missed. No grace period. No undo. Just honesty."

5. PRICING (same 3-tier table as upgrade page, condensed).

6. SOCIAL PROOF PLACEHOLDER:
Header: "Built for people who are done making excuses."
3 testimonial card slots — use placeholder text for launch:
"I've tried 7 habit apps. MindForge is the first one that doesn't let me off the hook." — Marcus, Software Engineer
"The AI coach actually remembers what I told it 3 weeks ago. That's never happened before." — Priya, Entrepreneur
"My Forge Score dropped when I missed my workouts. That's the accountability I needed." — James, Founder

7. FINAL CTA:
"The version of yourself you keep imagining? It's built in the forge."
"Start Forging — Free for 14 Days" orange button.
"No credit card required." text below.

8. FOOTER: MindForge logo + tagline, links: Privacy Policy, Terms of Service (stub pages), Contact.

PERFORMANCE: This page must achieve Lighthouse score ≥90. Use next/image for any images. Minimize JS on this route (no tRPC providers needed here — it's a static marketing page). Use static rendering (no 'use client' on the page itself).

ACCEPTANCE: Landing page loads at /. All sections render. CTA buttons link to /login. Lighthouse performance score ≥85 on desktop.
```

---

### Step 9.5 — Final Performance + GDPR + Launch Checks

```
Complete the final pre-launch checklist for MindForge.

PERFORMANCE AUDIT:
Run Lighthouse on /app/dashboard route (after login). Target: ≥90 performance score.
Common fixes needed:
- Ensure all images use next/image with proper width/height
- Add loading="lazy" to below-fold content
- Verify no unused CSS from Tailwind (purge is enabled in production by default)
- Check for render-blocking resources
- Verify React Suspense is used for all async data to prevent hydration waterfalls

GDPR COMPLIANCE:
1. Data Export endpoint (app/api/user/export/route.ts):
   - Authenticated GET endpoint
   - Exports: user profile, habits, habit_completions, daily_checkins, coach_sessions, memories, cookie_jar entries, badges, xp_events
   - Returns as JSON, or generate a downloadable .json file
   - Rate limit: 1 export per 24 hours per user

2. Delete Account (already in settings) — verify the soft-delete flow:
   - Set users.is_deleted = true
   - Anonymize email to deleted_{id}@mindforge.app
   - Queue data deletion (can be a placeholder that logs to Sentry for manual processing in v1)
   - Cancel Lemon Squeezy subscription via API if active

3. Add Privacy Policy page at app/privacy/page.tsx (simple static page with standard SaaS privacy policy content).
4. Add Terms of Service page at app/terms/page.tsx.

SECURITY FINAL CHECKS:
- Verify SUPABASE_SERVICE_ROLE_KEY has no NEXT_PUBLIC_ prefix (must be server-only)
- Verify GEMINI_API_KEY has no NEXT_PUBLIC_ prefix
- Verify LEMONSQUEEZY_API_KEY has no NEXT_PUBLIC_ prefix
- Verify RESEND_API_KEY has no NEXT_PUBLIC_ prefix
- Run: grep -r "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE" . to confirm no accidental exposure

FINAL ACCEPTANCE CHECKLIST:
- [ ] User can sign up, complete onboarding, and reach dashboard in <5 minutes
- [ ] Daily check-in submits and AI debrief streams (Pro user)
- [ ] Habit completion fires Forge Spark animation and updates Forge Score
- [ ] Forge Score animates up with count-up effect
- [ ] 40% Rule triggers when a 7+ day streak is broken
- [ ] Upgrade flow: clicking upgrade → Lemon Squeezy checkout → webhook → tier upgrade
- [ ] Weekly report cron endpoint works with CRON_SECRET
- [ ] Mobile: all core flows work at 375px
- [ ] PostHog shows events in dashboard
- [ ] Sentry captures test error
- [ ] Lighthouse dashboard route: ≥85 performance
- [ ] No TypeScript errors: tsc --noEmit passes clean
- [ ] All environment variables documented in .env.local.example (with no real values)

CREATE .env.local.example with all variables listed (from Section 5.3 of PRD) and placeholder values.

DEPLOY to Vercel:
- Connect GitHub repo to Vercel
- Set all environment variables in Vercel dashboard
- Deploy. Verify all routes work on production domain.
- Configure custom domain if available.
- Set NEXT_PUBLIC_APP_URL to the production URL.

LAUNCH. 🔥
```

---

## ENVIRONMENT VARIABLES REFERENCE

Copy from PRD Section 5.3. Set these in `.env.local` for development and in Vercel dashboard for production:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Gemini AI
GEMINI_API_KEY=

# Lemon Squeezy
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_WEBHOOK_SECRET=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID=
LEMONSQUEEZY_PRO_ANNUAL_VARIANT_ID=
LEMONSQUEEZY_ELITE_MONTHLY_VARIANT_ID=
LEMONSQUEEZY_ELITE_ANNUAL_VARIANT_ID=

# Resend (Email)
RESEND_API_KEY=
RESEND_FROM_EMAIL=forge@mindforge.app

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Sentry
NEXT_PUBLIC_SENTRY_DSN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=
```

---

## QUICK REFERENCE — PHASE SUMMARY

| Phase | Days | Steps | Key Deliverable |
|-------|------|-------|-----------------|
| 1 — Foundation | 1–14 | 1.1–1.5 | Auth, DB schema, tRPC, layout shell |
| 2 — Onboarding | 15–21 | 2.1–2.5 | 3-step onboarding with AI streaming |
| 3 — Habit Engine | 22–35 | 3.1–3.2 | Full habit CRUD, streaks, dashboard cards |
| 4 — Check-In + AI | 36–50 | 4.1–4.2 | Daily check-in, memory system, coach chat |
| 5 — Forge Score | 51–60 | 5.1–5.2 | Score formula, XP, badges, 40% Rule |
| 6 — Cookie Jar | 61–70 | 6.1–6.2 | Victory archive, semantic search, challenges |
| 7 — Billing | 71–77 | 7.1–7.2 | Lemon Squeezy, upgrade page, settings |
| 8 — Reports | 78–84 | 8.1–8.2 | Analytics charts, weekly email, cron job |
| 9 — Launch Prep | 85–90 | 9.1–9.5 | Error handling, mobile, tracking, landing page, deploy |

**Total: 19 prompts across 9 phases.**

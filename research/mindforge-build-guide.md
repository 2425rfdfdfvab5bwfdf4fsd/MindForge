# MindForge — Phase-by-Phase Build Guide
**Version:** 1.4 | **Based on PRD v1.1** | **Total Timeline: 90 Days**

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

### Step 1.2 — Firebase Firestore Data Model

```
Set up the Firestore database structure for MindForge. There is no migration file — Firestore is schemaless. Instead, define the TypeScript types in types/index.ts and document the collection layout below. Deploy Firestore Security Rules via the Firebase console or CLI.

FIRESTORE COLLECTIONS (all server writes use Firebase Admin SDK):

COLLECTION: users
Document path: users/{uid}  (uid = Firebase Auth UID)
Fields:
- uid: string
- email: string
- displayName: string | null
- avatarUrl: string | null
- tier: 'free' | 'pro' | 'elite'  (default: 'free')
- onboardingStep: 'mirror' | 'why' | 'environment' | 'complete'  (default: 'mirror')
- onboardingComplete: boolean  (default: false)
- whyStatement: string | null
- identityDeclaration: string | null
- coachIntensity: 'hard' | 'firm'  (default: 'hard')
- timezone: string  (default: 'UTC')
- environmentAudit: Array<{ id: string, question: string, done: boolean }>  (default: [])
- forgeScore: number  (default: 0)
- xp: number  (default: 0)
- level: number  (default: 1)
- currentStreakDays: number  (default: 0)
- isDeleted: boolean  (default: false)
- createdAt: Timestamp
- updatedAt: Timestamp

COLLECTION: subscriptions
Document path: subscriptions/{uid}  (one subscription doc per user, keyed by uid)
Fields:
- userId: string
- lemonsqueezyCustomerId: string | null
- lemonsqueezySubscriptionId: string | null
- tier: 'free' | 'pro' | 'elite'
- status: 'active' | 'cancelled' | 'past_due' | 'expired'
- currentPeriodEnd: Timestamp | null
- createdAt: Timestamp
- updatedAt: Timestamp

COLLECTION: habits
Document path: habits/{habitId}  (auto-ID)
Fields:
- id: string  (same as doc ID, stored for convenience)
- userId: string
- name: string  (max 60 chars)
- category: 'health' | 'mind' | 'avoid' | 'perform'
- habit_type: 'build' | 'avoid'  (NOTE: snake_case intentional — must match this exactly in all queries)
- targetFrequency: 'daily' | 'weekdays' | 'custom'  (default: 'daily')
- targetDays: number[]  (0=Sun, 6=Sat; default: [0,1,2,3,4,5,6])
- sortOrder: number  (default: 0)
- isActive: boolean  (default: true)
- createdAt: Timestamp

COLLECTION: habit_completions
Document path: habit_completions/{habitId}_{localDate}  (composite ID prevents duplicates)
Fields:
- id: string  (same as doc ID)
- habitId: string
- userId: string
- localDate: string  ('YYYY-MM-DD')
- completed: boolean
- notes: string | null
- completionTime: Timestamp

COLLECTION: habit_streaks
Document path: habit_streaks/{habitId}  (one doc per habit)
Fields:
- habitId: string
- userId: string
- currentStreak: number  (default: 0)
- longestStreak: number  (default: 0)
- lastCompletedDate: string | null  ('YYYY-MM-DD')
- updatedAt: Timestamp

COLLECTION: daily_checkins
Document path: daily_checkins/{userId}_{localDate}  (composite; use userId + '_mirror' suffix for onboarding mirror entry)
Fields:
- id: string
- userId: string
- localDate: string  ('YYYY-MM-DD')
- rawReflection: string
- aiResponse: string | null
- moodSignal: 'excusing' | 'deflecting' | 'owning' | 'crushing' | null
- honestyScore: number | null  (1–10)
- forgeScoreDelta: number  (default: 0)
- onboardingMirror: boolean  (default: false)
- createdAt: Timestamp

COLLECTION: coaching_sessions
Document path: coaching_sessions/{autoId}
Fields:
- id: string
- userId: string
- checkinId: string | null
- sessionType: 'onboarding_mirror' | 'why_excavation' | 'daily_checkin' | 'forty_percent_rule' | 'direct_chat'
- messages: Array<{ role: 'user' | 'model', content: string }>
- sessionSummary: string | null
- forgeScoreDelta: number  (default: 0)
- createdAt: Timestamp

COLLECTION: user_memories
Document path: user_memories/{autoId}
Fields:
- id: string
- userId: string
- content: string
- memoryType: 'preference' | 'trigger' | 'victory' | 'fear' | 'identity' | 'pattern'
- embedding: number[]  (768-dimension vector from text-embedding-004; stored as plain array — cosine similarity computed in-process on server)
- lastAccessed: Timestamp | null
- createdAt: Timestamp

COLLECTION: cookie_jar_entries
Document path: cookie_jar_entries/{autoId}
Fields:
- id: string
- userId: string
- title: string  (max 80 chars)
- description: string  (max 500 chars)
- dateOfVictory: string | null  ('YYYY-MM-DD')
- embedding: number[]  (768-dimension vector; cosine similarity computed in-process)
- createdAt: Timestamp

COLLECTION: challenges
Document path: challenges/{challengeId}  (seeded by admin script, not user data)
Fields:
- id: string
- title: string
- description: string
- difficulty: number  (1–5)
- category: 'cold' | 'screen' | 'physical' | 'fast' | 'social'
- durationMinutes: number
- xpReward: number  (default: 100)
- isActive: boolean

COLLECTION: user_challenges
Document path: user_challenges/{autoId}
Fields:
- id: string
- userId: string
- challengeId: string
- status: 'active' | 'completed' | 'failed'  (default: 'active')
- reflection: string | null
- startedAt: Timestamp | null
- completedAt: Timestamp | null
NOTE: No uniqueness enforced on (userId, challengeId) — per PRD, completed challenges can be repeated.

COLLECTION: xp_events
Document path: xp_events/{autoId}
Fields:
- id: string
- userId: string
- xpAmount: number
- reason: string
- eventType: 'habit_complete' | 'checkin' | 'checkin_bonus' | 'challenge' | 'forty_percent' | 'cookie_jar' | 'environment' | 'onboarding'
- createdAt: Timestamp

SUBCOLLECTION: users/{uid}/badges/{badgeKey}
Fields:
- badgeKey: 'identity_locked' | 'mirror_gazer' | 'cookie_jar_founder' | 'forty_percent_survivor' | 'cold_mind' | 'tempered'
- earnedAt: Timestamp
NOTE: Using subcollection under users/{uid} for badges. Document ID = badgeKey (guarantees idempotency — setting the same doc twice is safe).

COLLECTION: rule_forty_events
Document path: rule_forty_events/{autoId}
Fields:
- id: string
- userId: string
- triggeredBy: 'auto_habit' | 'auto_checkin' | 'manual'
- habitId: string | null
- choice: 'took_step' | 'declined'
- createdAt: Timestamp

COLLECTION: forge_score_history
Document path: forge_score_history/{autoId}
Fields:
- id: string
- userId: string
- score: number
- recordedAt: Timestamp

COLLECTION: weekly_reports
Document path: weekly_reports/{autoId}
Fields:
- id: string
- userId: string
- weekStartDate: string  ('YYYY-MM-DD')
- forgeScoreChange: number  (default: 0)
- habitCompletionRate: number  (default: 0)
- bestStreakThisWeek: string | null
- behavioralArc: string | null
- keyInsight: string | null
- nextWeekChallenge: string | null
- emailSent: boolean  (default: false)
- createdAt: Timestamp

FIRESTORE SECURITY RULES (deploy via Firebase console → Firestore → Rules):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      match /badges/{badgeKey} {
        allow read: if request.auth != null && request.auth.uid == uid;
        allow write: if false;  // server-only (Admin SDK)
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
      allow write: if false;  // server-only
    }
    match /daily_checkins/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /challenges/{docId} {
      allow read: if request.auth != null;
      allow write: if false;  // admin-seeded only
    }
    match /{collection}/{docId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow write: if false;  // all other writes are server-only via Admin SDK
    }
  }
}
```

CREATE types/index.ts with TypeScript interfaces matching every collection's fields above (use camelCase field names as specified).

ACCEPTANCE: types/index.ts compiles cleanly. Firestore Security Rules are valid (test in Firebase console Rules Playground). Admin SDK can write to all collections from server code.
```

---

### Step 1.3 — Firebase Auth + Middleware

```
Implement Firebase Auth and Next.js middleware for MindForge.

PACKAGES ALREADY INSTALLED: firebase (client SDK), firebase-admin (Admin SDK)

CREATE lib/firebase/client.ts:
- Initialize Firebase app (guard with `getApps().length` to prevent re-initialization)
- Use NEXT_PUBLIC_FIREBASE_* env vars for firebaseConfig
- Export: auth (getAuth(app)), db (getFirestore(app)), googleProvider (new GoogleAuthProvider())
- This file is safe to import from client components

CREATE lib/firebase/admin.ts:
- Add `import "server-only"` at the top — prevents accidental client-side import
- Initialize Firebase Admin app using FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY (use cert() from firebase-admin/app)
- Guard with getApps() check to prevent re-initialization
- Export: adminAuth (getAuth()), adminDb (getFirestore())
- FIREBASE_PRIVATE_KEY contains literal \n in the env value — replace with real newlines: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')

CREATE lib/auth.ts:
- Add `import "server-only"` at the top
- Import adminAuth, adminDb from lib/firebase/admin
- Export async function getCurrentUser(): Promise<UserProfile | null>
  - Read 'mf_session' cookie from next/headers cookies()
  - If no cookie: return null
  - Call adminAuth.verifySessionCookie(sessionCookie, true) — the second arg `true` checks revocation
  - On error (expired/invalid/revoked): return null
  - Fetch users/{uid} from Firestore using adminDb
  - Return the user profile data (uid, email, tier, onboardingComplete, onboardingStep, coachIntensity, timezone, etc.)
- Export async function requireAuth(): Promise<UserProfile>
  - Calls getCurrentUser(), throws TRPCError UNAUTHORIZED if null

CREATE app/api/auth/session/route.ts:
- POST endpoint (no authentication required — this IS the authentication step)
- Parse body: { idToken: string }
- Call adminAuth.verifyIdToken(idToken) to validate the Firebase ID token
- Call adminAuth.createSessionCookie(idToken, { expiresIn: 14 * 24 * 60 * 60 * 1000 }) — 14-day expiry
- Check if users/{uid} doc exists in Firestore; if not, create it with default values (tier: 'free', onboardingStep: 'mirror', onboardingComplete: false, email from decodedToken.email, createdAt: now, updatedAt: now)
- Set 'mf_session' cookie: httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 14 * 24 * 60 * 60, path: '/'
- Return { success: true, onboardingComplete: boolean, onboardingStep: string }

CREATE app/api/auth/logout/route.ts:
- POST endpoint (authenticated)
- Clear 'mf_session' cookie by setting it with maxAge: 0
- Return { success: true }

CREATE middleware.ts (root level — MUST be Edge-compatible):
- CRITICAL: Do NOT import firebase-admin or lib/auth.ts in middleware — Admin SDK uses Node.js APIs not available at Edge runtime
- Instead: check for the presence of the 'mf_session' cookie only
- If no 'mf_session' cookie AND path matches protected routes (/dashboard, /habits, /checkin, /coach, /cookie-jar, /challenges, /analytics, /settings, /upgrade): redirect to /login
- If 'mf_session' cookie IS present AND path is /login: redirect to /dashboard (the tRPC context will do full verification; redirect is just UX)
- Apply middleware to: matcher: ['/((?!_next/static|_next/image|favicon.ico|api/billing/webhook|api/auth).*)']

Note on routes: The app uses Next.js route groups — (auth), (onboarding), and (app) — which are folder groupings only. The actual URLs do NOT include the group name:
- app/(app)/dashboard/page.tsx → URL: /dashboard
- app/(onboarding)/mirror/page.tsx → URL: /onboarding/mirror
- app/(auth)/login/page.tsx → URL: /login

CREATE app/(auth)/login/page.tsx:
- Full dark background (#0A0908)
- Centered layout, max-width 400px
- MindForge logotype (text, bold, orange, font-heading, text-2xl)
- Tagline below: "Rewire your brain. Forge your identity." (text-muted, text-sm)
- 32px gap
- Email + password form: email input + password input (full width, dark bg #161514, border #2A2927, text-primary, sharp corners, focus ring orange) + "Sign In" button (full width, bg orange #FF6B2B, text black, sharp corners, font-medium)
- Toggle between "Sign In" and "Create Account" modes (same form — registration shows confirm password field)
- Divider: "or" with horizontal lines
- "Continue with Google" button (full width, border #2A2927, bg transparent, text-primary, Google icon SVG on left)
- Error state: show error message below the form in text-danger (#EF4444)
- On successful sign-in: get ID token via user.getIdToken(), POST to /api/auth/session, then router.push based on onboardingComplete
- Use Firebase signInWithEmailAndPassword / createUserWithEmailAndPassword for email auth
- Use Firebase signInWithPopup(googleProvider) for Google auth

CREATE app/(auth)/callback/route.ts:
- Simple GET handler that redirects to /dashboard (for legacy compatibility; not used in Firebase flow)

ACCEPTANCE: User can register with email/password. User can sign in with email/password. Google OAuth popup works. After sign-in, mf_session cookie is set. Unauthenticated /dashboard access redirects to /login.
```

---

### Step 1.4 — tRPC Setup

```
Set up tRPC for MindForge with full type-safe server/client communication.

INSTALL: @trpc/server @trpc/client @trpc/react-query @trpc/next @tanstack/react-query zod superjson

CREATE server/trpc/context.ts:
- Export createTRPCContext that:
  - Calls getCurrentUser() from lib/auth.ts (reads mf_session cookie, verifies via Firebase Admin SDK, fetches Firestore user doc)
  - Returns { user: UserProfile | null, adminDb: Firestore } (adminDb imported from lib/firebase/admin.ts for use in routers)

CREATE server/trpc/trpc.ts:
- Initialize tRPC with context and superjson transformer
- Create base router and procedure
- Create protectedProcedure: throws UNAUTHORIZED if no user
- Create requireTier helper: requireTier(ctx, 'pro') — throws FORBIDDEN if user.tier is insufficient (free < pro < elite)

CREATE server/trpc/router.ts (root router):
- Import and merge: habits, checkins, cookiejar, challenges, analytics, user, dashboard, pods routers
- Export type AppRouter

CREATE server/trpc/routers/user.ts (stub):
- getProfile query
- updateProfile mutation (displayName?, coachIntensity?, timezone?)
- updateWhy mutation (whyStatement, identityDeclaration)
- submitEnvironmentAudit mutation (stub — returns empty array for now)
- markEnvironmentItemDone mutation (stub)

CREATE server/trpc/routers/habits.ts (stub):
- list query (returns empty array)
- create mutation (stub)
- update mutation (stub)
- archive mutation (stub)
- logCompletion mutation (stub)
- getCompletionHistory query (stub)

CREATE server/trpc/routers/checkins.ts (stub):
- submit mutation (stub)
- getToday query (stub)
- updateMetadata mutation (stub)
- getHistory query (stub)

CREATE server/trpc/routers/cookiejar.ts (stub):
- list query, add mutation, edit mutation, delete mutation, search query (all stubs)

CREATE server/trpc/routers/challenges.ts (stub):
- list query, activate mutation, complete mutation (all stubs)

CREATE server/trpc/routers/analytics.ts (stub):
- forgeScoreHistory query (stub)
- habitCompletionRates query (stub)
- checkinHonestyTrend query (stub)
- xpHistory query (stub)
- getLatestWeeklyReport query (stub)

CREATE server/trpc/routers/dashboard.ts (stub):
- getAll query (stub — returns placeholder data)

CREATE server/trpc/routers/pods.ts (stub):
- Empty router with comment "// Accountability Pods — P1 feature, deferred to Month 4 post-launch"

CREATE app/api/trpc/[trpc]/route.ts:
- Standard Next.js tRPC handler using fetchRequestHandler

CREATE lib/trpc/client.ts:
- tRPC React Query client setup with superjson transformer
- Export api (typed tRPC client hooks)

CREATE lib/trpc/provider.tsx:
- QueryClient + tRPC provider component for app/layout.tsx

Add TRPCProvider to app/layout.tsx wrapping children.

ACCEPTANCE: No TypeScript errors on `tsc --noEmit`. The tRPC handler responds at /api/trpc/user.getProfile (should return 401 when unauthenticated). All stub routers compile cleanly.
```

---

### Step 1.5 — Core Layout Components

```
Build the app shell layout components for MindForge.

Note: All app routes live under the (app) route group. The actual URLs are /dashboard, /habits, /checkin, etc. — NOT /app/dashboard. The route group (app) is a folder convention only.

CREATE components/layout/Sidebar.tsx:
Navigation items (with icons from lucide-react):
- Dashboard (LayoutDashboard icon) → /dashboard
- Habits (CheckSquare icon) → /habits
- Daily Mirror (BookOpen icon) → /checkin
- AI Coach (Brain icon) → /coach [show "Pro" badge if user is free tier]
- Cookie Jar (Cookie icon) → /cookie-jar
- Challenges (Zap icon) → /challenges
- Analytics (BarChart2 icon) → /analytics
- Settings (Settings icon) → /settings
- "40% Rule" button (Flame icon) — persistent at the bottom of the sidebar nav, always visible, orange text. Clicking triggers the 40% Rule overlay manually. This is per the PRD: users can manually trigger the 40% Rule at any time.

Styling: fixed left sidebar, width 240px on desktop. Background #111110. Each nav item: flex row, icon + label, padding 12px 16px, text-muted default, text-primary on hover, bg #1A1918 on hover, border-left 2px solid transparent, border-left-color #FF6B2B on active route. Use usePathname() from next/navigation for active state.

Mobile: hidden on < lg breakpoint (MobileNav handles mobile).

CREATE components/layout/MobileNav.tsx:
Fixed bottom navigation for mobile (visible only below lg breakpoint).
Show 5 items: Dashboard, Habits, Mirror, Cookie Jar, Settings.
Background #111110, border-top #2A2927. Icons + labels. Active state: orange icon + label.
Add `padding-bottom: env(safe-area-inset-bottom)` for iOS safe area.

CREATE components/layout/Header.tsx:
Top bar, height 56px, background #111110, border-bottom #2A2927.
Left: page title (passed as prop or derived from pathname).
Right: ForgeScore widget (import ForgeScore component) + user avatar (if available, else initials circle, bg #232220).

CREATE components/forge/ForgeScore.tsx:
Displays the user's Forge Score.
Layout: small label "FORGE SCORE" (text-xs, text-muted, tracking-widest), large number below (text-display font size, text-primary, tabular nums, Geist font).
Also show the level label below the score (e.g., "Raw" or "Tempered") in text-xs, text-muted.
Animate score changes using Framer Motion useSpring + useTransform for count-up over 500ms (PRD specifies 500ms).
On score increase: apply box-shadow glow (rgba(255,107,43,0.15)) via ::after opacity animation — NOT direct box-shadow property (performance requirement per PRD).
For now accept score as prop (will be wired to real data in Phase 5).

CREATE app/(app)/layout.tsx:
App shell layout for all routes that use the app shell.
- Sidebar on left (desktop only, lg+)
- Main content area: flex-1, overflow-y-auto, bg #0A0908
- Header at top of main area
- MobileNav at bottom (mobile only)
- Wrap with a <div> that has padding-left 240px on lg+, padding-bottom 64px on mobile for bottom nav

CREATE app/(app)/dashboard/page.tsx (stub):
Simple placeholder: "Dashboard — Coming Soon" with the forge color scheme. Confirms the layout shell works.

ACCEPTANCE: Navigating to /dashboard (after logging in) shows the sidebar + header + placeholder content. Sidebar highlights the active route. Header shows "FORGE SCORE 0". The "40% Rule" button is visible at the bottom of the sidebar. Mobile view shows bottom nav.
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
- Initialize GoogleGenerativeAI with GEMINI_API_KEY (server-only env var — no NEXT_PUBLIC_ prefix)
- Export geminiPro: getGenerativeModel({ model: 'gemini-2.5-pro' })
- Export geminiFlash: getGenerativeModel({ model: 'gemini-2.5-flash' })
- Export embeddingModel: getGenerativeModel({ model: 'text-embedding-004' })

CREATE lib/gemini/prompts.ts:
Define and export all system prompts as constants (versioned with a comment // v1.0):

FORGE_COACH_BASE_SYSTEM_PROMPT:
"You are the Forge Coach — an AI built on neuroscience, behavioral psychology, and the philosophy of peak performers like David Goggins and Jocko Willink. You do NOT coddle. You do NOT offer participation trophies. You tell the truth, even when it's uncomfortable. You treat the user as a capable adult who is here to change their life, not be comforted. Your responses are direct, specific, and grounded in what the user has actually written. You NEVER use hollow affirmations ('Great job!', 'You're doing amazing!', 'I'm proud of you') and you never use emojis. You acknowledge genuine wins with respect, not cheerleading. You identify excuse patterns when you see them — label them clearly and redirect. You never reference being an AI unless directly asked. You end responses with one actionable next step or one probing question, never both."

FORGE_COACH_FIRM_PROMPT (used when coach_intensity = 'firm'):
Same as base but add: "Deliver feedback with firmness and directness, but soften the language slightly. Still honest, still specific, still no empty encouragement — but without the hardest edges. Think: a mentor who tells you the truth, not a drill instructor."

ONBOARDING_MIRROR_SYSTEM_PROMPT (extends base):
Add: "This is the user's first interaction. They have just written a raw, honest accountability mirror entry. Your job: Read it carefully. Identify the central pattern — is this person avoiding responsibility, or genuinely facing themselves? Respond in 150–300 words. Be honest. If they are making excuses, name the excuses specifically (quote their words back). If they show genuine self-awareness, acknowledge it without praising it. End with exactly one probing question that will make them think differently about their situation. Do NOT extract memories or reference past sessions — this is the starting baseline."

WHY_EXCAVATION_SYSTEM_PROMPT (extends base):
Add: "You are conducting a Why Excavation — a structured Socratic dialogue to uncover the user's deepest identity-level motivation. Use the 5 Whys method. Each turn: acknowledge what they said, then ask one deeper 'why' question. After 4–6 turns, synthesize their answers into a single 'Why Statement' in this format: 'You want to [identity goal] — someone who [specific character trait implied by their answers].' Present this statement and ask them to accept or refine it. Then ask for one Identity Declaration: 'Complete this: I am someone who...'"

CHECKIN_DEBRIEF_SYSTEM_PROMPT:
"You are the Forge Coach reviewing the user's daily accountability mirror entry.

User profile:
- Why Statement: {WHY_STATEMENT}
- Identity Declaration: {IDENTITY_DECLARATION}
- Current Forge Score: {FORGE_SCORE}

Relevant memories about this user:
{MEMORIES}

Today's entry: analyze it against their stated why and identity declaration. Your response must be 150–250 words. Identify at least one excuse or deflection pattern if present. Acknowledge genuine wins without over-praising. Surface one specific observation. End with one concrete challenge or question for the day. If mood is 'excusing' or 'deflecting', name it directly."

FORTY_PERCENT_RULE_SYSTEM_PROMPT:
"The user is at their mental limit. Context: {TRIGGER_CONTEXT}. Their most relevant past victory: {COOKIE_JAR_ENTRY}. Their Why Statement: {WHY_STATEMENT}. Their current Forge Score: {FORGE_SCORE}.

Deliver a direct intervention in 150–200 words. The heading reads 'YOUR MIND IS LYING TO YOU' — your text continues from that. Tell them research shows they are at 40% of their true capacity. Reference their specific triggered habit or check-in pattern. Pull from their cookie jar victory if relevant. End with: one concrete next step they can take in the next 5 minutes. Do not be gentle. Do not offer an exit."

CREATE lib/gemini/embeddings.ts:
- Export async function generateEmbedding(text: string): Promise<number[]>
- Uses embeddingModel.embedContent(text)
- Returns embedding.values array
- Include error handling with 1 retry on failure

ACCEPTANCE: No TypeScript errors. Importing from lib/gemini/client.ts works without runtime errors.
```

---

### Step 2.2 — SSE Streaming Endpoint + Classify Endpoint

```
Build the Server-Sent Events streaming endpoint and the mood classification endpoint for AI coaching responses.

CREATE app/api/coach/stream/route.ts:

This is a POST endpoint that:
1. Authenticates the user via getCurrentUser() from lib/auth.ts (verifies mf_session cookie using Firebase Admin SDK — return 401 if not authenticated)
2. For session_type 'direct_chat' and 'daily_checkin': verify user is Pro/Elite tier; return 403 if Free
3. Parses the request body: { session_type, messages, context }
   - session_type: 'onboarding_mirror' | 'why_excavation' | 'daily_checkin' | 'forty_percent_rule' | 'direct_chat'
   - messages: Array<{role: 'user'|'model', parts: [{text: string}]}>
   - context: { why_statement?, identity_declaration?, forge_score?, memories?, trigger_context?, cookie_jar_entry? }
4. Selects the appropriate system prompt from lib/gemini/prompts.ts based on session_type
5. If coach_intensity = 'firm': use FORGE_COACH_FIRM_PROMPT as base instead of FORGE_COACH_BASE_SYSTEM_PROMPT
6. For daily_checkin and forty_percent_rule: interpolate context variables into the prompt
7. Calls geminiPro.startChat({ history: messages[0..-2], systemInstruction: systemPrompt })
8. Calls chat.sendMessageStream(lastUserMessage)
9. Returns a ReadableStream (SSE format):
   - Each chunk: `data: ${JSON.stringify({ text: chunk.text() })}\n\n`
   - On completion: `data: [DONE]\n\n`
   - On error: `data: ${JSON.stringify({ error: 'Coach unavailable' })}\n\n`

Response headers: Content-Type: text/event-stream, Cache-Control: no-cache, Connection: keep-alive, X-Accel-Buffering: no

Rate limiting: 20 requests/hour per user. Track in a server-side Map (user_id → {count, resetAt}). Return 429 if exceeded.

CREATE app/api/coach/classify/route.ts:

This is a POST endpoint for non-streaming mood/honesty classification (separate from the streaming endpoint per PRD spec):
1. Authenticate user
2. Parse body: { checkin_id, text }
3. Call Gemini 2.5 Flash (NOT Pro — this is a cheap/fast classification call) with prompt:
   "Analyze this daily check-in text and return JSON with exactly these two fields:
   1. honesty_score: integer 1–10 (1=entirely avoidant/deflecting, 10=radically self-aware and accountable)
   2. mood_signal: one of exactly: 'excusing' | 'deflecting' | 'owning' | 'crushing'
   
   Definitions:
   - excusing: user is rationalizing failures, blaming circumstances
   - deflecting: user is changing the subject, avoiding the real issue
   - owning: user is acknowledging their actions honestly, neither great nor bad
   - crushing: user is genuinely thriving, high accountability + positive results
   
   Text: {text}
   
   Return ONLY valid JSON, no other text."
4. Use responseMimeType: 'application/json' for structured output
5. Return { honesty_score, mood_signal }

CREATE a client-side hook lib/hooks/useStreamingResponse.ts:
- Takes endpoint URL and request body
- Manages streaming state: { text: string, isStreaming: boolean, isComplete: boolean, error: string | null }
- Uses fetch with ReadableStream reader to parse SSE data lines
- Handles [DONE] signal to set isComplete=true
- Exports: { streamedText, isStreaming, isComplete, error, startStream }

ACCEPTANCE: POST to /api/coach/stream with session_type='onboarding_mirror' returns SSE stream. POST to /api/coach/classify returns { honesty_score: number, mood_signal: string }. Free user gets 403 on 'daily_checkin' session type.
```

---

### Step 2.3 — Onboarding Step 1: Accountability Mirror

```
Build the Onboarding Step 1 — Accountability Mirror page.

CREATE app/(onboarding)/mirror/page.tsx:
(URL: /onboarding/mirror)

LAYOUT: Full-screen dark layout (#0A0908). No sidebar. No header nav.
Centered content, max-width 720px, padding 48px 24px.

TOP: Small breadcrumb "Step 1 of 3" (text-xs, text-muted). Below: "Face the Mirror" (text-4xl, font-heading, text-primary). Below: "Write the truth about where you are right now. Your failures. Your excuses. Your wasted potential. Don't filter it." (text-base, text-secondary, max-width 560px).

TEXTAREA: width 100%, height 60vh minimum, background #161514, border 1px solid #2A2927, text-primary, text-base, line-height 1.65, padding 20px, no border-radius (sharp), placeholder "Start writing..." that disappears on focus.

SUBMIT BUTTON: "Submit to the Mirror" — full width, bg #FF6B2B, text black, font-bold, sharp corners, disabled + opacity-50 until textarea has ≥100 characters. On hover: bg #FF5214 with ::after glow.

AI RESPONSE AREA (hidden until submit):
- Appears below the submitted text
- Left border 3px solid #FF6B2B, padding 20px
- "Forge Coach is thinking..." animated pulsing dots state shown while waiting for first token (up to 3 seconds)
- Text streams in via useStreamingResponse hook
- After streaming completes: "I'm Ready — Continue" button appears (same orange style)
- Clicking Continue: calls tRPC user.updateProfile to set onboarding_step = 'why', then router.push('/onboarding/why')

DATA STORAGE:
- On submit: call tRPC checkins.submit with { text: rawText, localDate, onboarding_mirror: true }
- Store the AI response by calling tRPC checkins.updateMetadata after stream completes (ai_response field)
- Do NOT run mood classification or memory extraction for onboarding_mirror entries

If user has already completed this step (users.onboarding_step !== 'mirror'), redirect to /onboarding/why immediately.

ACCEPTANCE: User can type ≥100 chars. Submit button enables. AI streams a response. After streaming completes, "I'm Ready — Continue" appears. Clicking it redirects to /onboarding/why.
```

---

### Step 2.4 — Onboarding Step 2: Why Excavation

```
Build the Onboarding Step 2 — Why Excavation multi-turn chat page.

CREATE app/(onboarding)/why/page.tsx:
(URL: /onboarding/why)

LAYOUT: Full-screen dark layout. No sidebar. Centered, max-width 720px.
Top: "Step 2 of 3" breadcrumb. Title: "Excavate Your Why" (text-4xl, font-heading). Subtitle: "Your coach will guide you to the motivation that won't break." (text-secondary).

CHAT INTERFACE:
- Messages list: scrollable area, max-height 65vh, overflow-y-auto
- Coach messages: left-aligned, background #111110, border 1px solid #1A3A6E (blue), text-secondary, padding 16px, max-width 85%, no border-radius
- User messages: right-aligned, background #1A1918, border 1px solid #2A2927, text-primary, padding 16px, max-width 85%
- Auto-scroll to bottom on new message

INITIAL STATE: On page load, coach's opening message streams in:
"What's the one thing you want most to change or achieve? Be specific — not 'be better', but what does better actually look like for you?"

INPUT AREA: Fixed at bottom. Textarea (1–3 lines, auto-expand). "Send" button (bg orange, sharp). Disable send while coach is streaming.

TURN MANAGEMENT:
- Track conversation as messages array: Array<{role: 'user'|'coach', content: string}>
- On each user send: append message, POST to /api/coach/stream with session_type='why_excavation', full conversation history
- Max 8 turns total. If not at identity level by turn 6, coach synthesizes from available info.

WHY STATEMENT ACCEPTANCE FLOW:
- Detect when coach response contains the pattern "You want to..." — show that statement in a highlighted card (border 2px solid #FF6B2B, padding 24px, bg #1A0A04)
- Two buttons: "This is my truth — Accept" (orange) and "Refine it" (ghost, max 2 refinements)
- On Accept: show Identity Declaration input: "Complete this: I am someone who..." (text input, full width)
- On Identity Declaration submit: call tRPC user.updateWhy({ whyStatement, identityDeclaration })
- Then show "Identity Locked" badge animation: badge icon goes scale(0) rotate(-15deg) → scale(1.15) rotate(5deg) → scale(1) using Framer Motion spring { stiffness: 250, damping: 12 } — total ~500ms
- Call tRPC to award 'identity_locked' badge only — checkAndAwardBadge awards its own 50 XP. Do NOT award the 200 XP here; that is for full onboarding completion (end of Step 3).
- "Continue to Step 3" button → set onboarding_step = 'environment' → redirect to /onboarding/environment

NO back button. This is a commitment.

ACCEPTANCE: Multi-turn chat works. After 4–6 turns a Why Statement card appears. User can accept or refine (max 2). Badge animation plays after accepting. Redirects to Step 3.
```

---

### Step 2.5 — Onboarding Step 3: Environment Audit

```
Build the Onboarding Step 3 — Environment Audit page.

CREATE app/(onboarding)/environment/page.tsx:
(URL: /onboarding/environment)

LAYOUT: Full-screen dark layout. No sidebar. Centered, max-width 640px.
Progress bar: top of page, 4px height, orange fill, sharp, advances 1/12 steps.

THE 12 QUESTIONS (one per screen, multiple choice 3–4 options):
1. "Where is your phone at night?" → [On my nightstand, In another room, Under my pillow, No set place]
2. "Do you have social media apps on your home screen?" → [Yes, multiple, Yes, one or two, In folders, Deleted them]
3. "Describe your workspace" → [Clean desk, minimal distractions, Somewhat cluttered, Very cluttered / couch, No dedicated workspace]
4. "How accessible is junk food in your home?" → [None in the house, There but out of sight, Visible on the counter, Everywhere and easy to grab]
5. "Where is your alarm?" → [Phone next to my bed, Across the room / separate alarm, I don't use an alarm]
6. "Do you have books or learning material visible?" → [Books on my desk / shelf, Books stored away, Digital only, I don't read regularly]
7. "How easy is it to drink water in your home?" → [Water bottle always filled and visible, Have to go get water, Usually forget to drink water]
8. "Where is your gym bag or workout gear?" → [Ready and visible, Put away but accessible, Have it but rarely use it, I don't have workout gear]
9. "Do you have a TV in your bedroom?" → [Yes and I watch it most nights, Yes but rarely, No]
10. "How would you describe your phone notification settings?" → [Most off — only essentials, Many apps send notifications, Everything is on]
11. "How would you describe your sleep environment?" → [Dark, cool, no screens — optimized, Pretty good but improvable, Screens on / not dark enough, Chaotic]
12. "What is your biggest environmental trigger for your main bad habit?" → [Social media / phone, Food / kitchen, Certain people or places, Evening / night time, Stress]

UI: Card layout. Each question title text-2xl. Options as large clickable cards (border #2A2927, bg #111110, hover bg #1A1918, selected: border #FF6B2B bg #1A0A04). Back/Next navigation. "Submit" on step 12.

ON SUBMIT:
- Call tRPC user.submitEnvironmentAudit with all 12 answers
- Server calls Gemini 2.5 Flash with responseMimeType: 'application/json' and this prompt:
  "Based on these environment audit answers: {answers}, generate 5–8 specific, actionable environment redesign recommendations. Return JSON array: [{item: string, category: string, done: false}]. Each item must be a specific physical action with a specific location (e.g., 'Move your phone charger to the kitchen counter tonight' not 'Use your phone less'). Reference the user's actual answers."
- Display results as numbered checklist cards
- Each card has item text + "Mark as Done" button (calls tRPC user.markEnvironmentItemDone)
- Each "Done" item: award 50 XP (event_type: 'environment')
- "Enter the Forge" button at bottom: call awardXP(userId, 200, 'Onboarding completed', 'onboarding') — this is the one-time 200 XP for completing the full onboarding flow (Why Excavation + Environment Audit per PRD Feature 13). Then set onboarding_complete = true, onboarding_step = 'complete', redirect to /dashboard

ACCEPTANCE: All 12 questions display with proper navigation. On submit, AI generates personalized recommendations. "Mark as Done" awards 50 XP. "Enter the Forge" redirects to /dashboard.
```

---

## PHASE 3: Core Habit Engine (Days 22–35)
*Goal: Full habit CRUD, completion logging, streak tracking, and dashboard habit cards.*

---

### Step 3.1 — Habit CRUD (tRPC + UI)

```
Implement full habit management for MindForge.

UPDATE server/trpc/routers/habits.ts with real implementations:

habits.list: Protected query. Fetch all active habits for user (is_active = true). Also fetch today's completion status for each habit from habit_completions where local_date = input.localDate. Also fetch habit_streaks for each habit. Return: Array<{ id, name, category, habit_type, target_frequency, target_days, sort_order, current_streak, longest_streak, today_status: 'pending'|'completed'|'missed' }>

habits.create: Protected mutation. Input: { name (max 60 chars, required), category, habit_type, target_frequency, target_days? }
- Free tier check: count active habits — if ≥3, throw FORBIDDEN with { upgradeRequired: true }
- Insert into habits table
- Insert into habit_streaks with current_streak=0, longest_streak=0
- Return created habit

habits.update: Protected mutation. Input: { id, name?, category?, target_frequency?, target_days? }
- Verify habit.user_id = ctx.user.id
- Update habits row

habits.archive: Protected mutation. Input: { id }
- Verify ownership
- Set is_active = false

habits.logCompletion: Protected mutation. Input: { habitId, localDate (DATE string 'YYYY-MM-DD'), completed (boolean) }
- Verify habit belongs to user
- Upsert into habit_completions (ON CONFLICT (habit_id, local_date) DO UPDATE SET completed = EXCLUDED.completed, completion_time = NOW())
- Call recalculateStreak(habitId, userId, localDate)
- If completed: call awardXP(userId, 20, 'Habit completed', 'habit_complete')
- Call recalculateForgeScore(userId)
- If NOT completed and streak WAS ≥7 before this miss: return triggerFortyPercent: true
- Return: { streak, forgeScore, xpAwarded, leveledUp, triggerFortyPercent }

habits.getCompletionHistory: Protected query. Input: { habitId, days: number }. Return habit_completions for that habit for the last N days.

CREATE lib/streak.ts:
async function recalculateStreak(habitId: string, userId: string, localDate: string): Promise<number>
- Query habit_completions for this habit, last 60 days, ordered by local_date DESC
- Walk back from localDate counting consecutive days where completed = true
- Stop at first gap (non-completed day counts as a gap; future dates are not a gap)
- Update habit_streaks: { current_streak, longest_streak: max(current, existing_longest), last_completed_date }
- Return current_streak

CREATE app/(app)/habits/page.tsx:
(URL: /habits)
List of all habits. "New Habit" button top right.
Each habit shown as HabitCard component.
Pass today's local date (client-side: new Date().toLocaleDateString('en-CA', { timeZone: userTimezone })) to habits.list query.
If free tier user has 3 habits: show upgrade banner above list.

CREATE components/forge/HabitCard.tsx:
Props: habit (name, category, habit_type, today_status, current_streak).
Sharp card, background #111110, border-left 3px solid:
- Completed: #22C55E (green)
- Missed: #EF4444 (red)
- Pending: #FF6B2B (orange)
Name text-xl font-heading, category badge text-xs, streak (text-sm text-muted).
Two buttons: "Completed" (bg #22C55E, text white) and "Missed" (bg #EF4444, text white). Both disabled + locked state if already logged today.
On "Completed" click: optimistic update immediately + call habits.logCompletion.
Forge Spark animation on completion: 6–8 CSS particles (pure CSS @keyframes, NOT a JS animation library). Each particle: orange (#FF6B2B), starts at card center, moves ±30px x and -20 to -60px y, scale to 0, 400ms total, staggered at 0/30/60/90/120/150/180/210ms delays. Randomize particle count (6–8, not fixed) for variable reward.

CREATE app/(app)/habits/[id]/page.tsx:
(URL: /habits/[id])
Habit detail: name + edit/archive buttons. Stats row: Current Streak, Longest Streak, Completion Rate % (text-display, orange numbers, tabular-nums). HabitGrid component below.

CREATE components/forge/HabitGrid.tsx:
Calendar grid of last 90 days. 7 columns (Sun–Sat). Each cell 12×12px square.
Colors: #22C55E = completed, #EF4444 = missed, #2A2927 = no data/future.
Hover: Radix UI Tooltip showing "June 10 — Completed".

CREATE app/(app)/habits/new/page.tsx:
(URL: /habits/new)
Form: Name input (max 60 chars), Category select (health/mind/avoid/perform), Type select (build/avoid), Frequency: daily / weekdays / custom. If custom: Mon–Sun checkbox grid. Submit creates habit via tRPC habits.create.

ACCEPTANCE: User can create, view, complete, and miss habits. Streak increments correctly. Forge Spark animation fires on completion. Calendar grid shows history correctly. Free tier enforced at 3 habits.
```

---

### Step 3.2 — Dashboard Habit Cards

```
Update the dashboard to show today's habits and key metrics.

UPDATE app/(app)/dashboard/page.tsx:
(URL: /dashboard)

LAYOUT: Two-column on desktop (lg+), single column on mobile.
Desktop: Left column (2/3 width): Check-in CTA + habit cards. Right column (1/3 width): Forge Score + XP bar + active challenge (if any) + quick stats.
Mobile stacking order (PRD Feature 15 specifies this exact order): Forge Score widget FIRST (full-width), then Check-in CTA, then Habits, then XP bar, then active challenge, then recent cookie jar.
Implementation: Place the Forge Score widget as a full-width section above the two-column grid, visible on all viewports. On lg+, also show it in the right column (use `hidden lg:block` / `block lg:hidden` pairs, or CSS grid with explicit `order` properties: Forge Score gets `order-first` on mobile). The right column on desktop should then contain XP bar + active challenge + recent cookie jar only.

Use a single tRPC call: dashboard.getAll({ localDate: today }) returning: { user, habits, todayCheckin, activeChallenge, forgeScore, xp, level, topStreaks, recentCookieJar }.

Wrap the entire data-dependent area with React Suspense + skeleton loaders.

SECTIONS:

1. DAILY MIRROR CTA CARD:
If no check-in today: Background #111110, border-left 3px solid #FF6B2B. Text: "The Mirror is waiting — face it" (text-xl, font-heading). Subtext: "Daily reflection keeps your coach sharp." (text-sm, text-muted). "Open the Mirror" button → /checkin.
If check-in done today: show "Mirror complete today" in green (text-sm, no emoji per PRD — use a text checkmark or status badge).

2. TODAY'S HABITS section:
"Today's Habits" heading (text-2xl, font-heading).
Render HabitCard for each active habit scheduled for today (check target_days matches today's day-of-week).
If no habits: empty state card with "Add your first habit" CTA → /habits/new.

3. RIGHT COLUMN — Forge Score widget:
Large ForgeScore component. Score number in text-display, orange. Level label below (e.g., "Raw", "Tempered"). Delta indicator: "+12 today" in green or "-8 today" in red (text-sm).

4. RIGHT COLUMN — XP Bar:
CREATE components/forge/XPBar.tsx:
Shows current level name + XP progress toward next level.
Level thresholds (from PRD — non-linear, not uniform 500 XP):
  - Level 1 (Raw):       0–499 XP
  - Level 2 (Tempered):  500–1,499 XP
  - Level 3 (Forged):    1,500–3,499 XP
  - Level 4 (Hardened):  3,500–7,499 XP
  - Level 5 (Unbreakable): 7,500–14,999 XP
  - Level 6 (Legendary): 15,000+ XP
Level calculation function (in lib/xp.ts):
  function getLevelFromXP(xp: number): { level: number, name: string, progressPct: number }
  Use the thresholds above. progressPct = progress within current level band.
Progress bar: full width, height 8px, bg #2A2927, fill #FF6B2B, sharp corners.
CSS width transition from old % to new % over 300ms cubic-bezier(0.16, 1, 0.3, 1).
Level-up animation: bar fills 100%, 200ms pause, resets to 0% (instant), fills to new level %.

5. RIGHT COLUMN — Active Challenge:
If user has an active challenge: show a card with challenge title, status "Active", and a countdown.

6. RIGHT COLUMN — Recent Cookie Jar:
Show last 3 cookie_jar_entries. Title only, text-sm, text-muted.

CREATE skeleton loader components: SkeletonHabitCard, SkeletonForgeScore, SkeletonXPBar (all match exact dimensions with animate-pulse).

UPDATE server/trpc/routers/dashboard.ts:
- getAll query: single round-trip fetching user, today's habits + completion status, today check-in, active challenge (if any), forge score, xp/level, top streaks, recent cookie jar (last 3). Use Promise.all for parallel queries.

ACCEPTANCE: Dashboard loads in <1.5s (React Suspense + single tRPC query). Completing a habit from dashboard updates state instantly (optimistic). Forge Score animates up with count-up. XP bar fills with correct level thresholds.
```

---

## PHASE 4: Daily Check-In + AI Coach (Days 36–50)
*Goal: Daily check-in with AI debrief, mood classification, memory system, and coach chat.*

---

### Step 4.1 — Daily Check-In Page

```
Build the Daily Accountability Mirror check-in page.

CREATE app/(app)/checkin/page.tsx:
(URL: /checkin)

LAYOUT: Centered, max-width 720px, padding 48px 24px. Uses the app shell (sidebar + header).

PAGE HEADING: "The Mirror — [Today's Date formatted as 'Tuesday, June 10']" (text-3xl, font-heading)

STATES:
A) No check-in today (default):
- Textarea: same dark styling as onboarding mirror. Placeholder: "What actually happened? Be honest." Character count shown bottom-right (text-xs, text-muted). Min 50 characters for submit.
- "Submit to the Mirror" button (full width, orange, disabled until 50+ chars)
- On submit: call tRPC checkins.submit({ text, localDate }), then start SSE stream to /api/coach/stream with session_type='daily_checkin'
- Free tier: no SSE call. Instead show upgrade prompt: "Upgrade to Pro to unlock your AI debrief."
- Award 30 XP on submit (event_type: 'checkin')

B) Check-in submitted, AI streaming (Pro):
- Submitted text shown above in muted card (bg #1A1918, padding 16px, text-secondary)
- "Forge Coach is analyzing..." pulsing dots
- AI debrief streams in below with orange left border, blinking cursor until complete
- After streaming: show honesty score badge "Honesty: X/10" (call /api/coach/classify, then tRPC checkins.updateMetadata)
- If mood_signal is 'excusing' or 'deflecting': automatically show 40% Rule overlay (RuleForty component)

C) Check-in complete for today:
- Show submitted text (read-only)
- Show AI debrief (if Pro)
- Honesty score badge visible
- "Check-in complete for today" status indicator
- Link to yesterday's check-in if it exists

UPDATE server/trpc/routers/checkins.ts with real implementations:

checkins.submit: Protected mutation. Input: { text: string (min 50 chars for daily, min 100 for onboarding_mirror), localDate: string, onboarding_mirror?: boolean }
- Validate text length server-side (return BAD_REQUEST if too short)
- Insert into daily_checkins with field name raw_reflection (NOT raw_text per PRD data model)
- Award XP 30 (event_type: 'checkin') for regular check-ins (not onboarding_mirror)
- Trigger Forge Score recalculation
- Return the created daily_checkin row

checkins.updateMetadata: Protected mutation. Input: { checkinId, honestyScore, moodSignal, aiResponse? }
- Verify checkin belongs to user
- Update daily_checkins: set honesty_score, mood_signal, ai_response (if provided)
- If moodSignal === 'crushing': call awardXP(userId, 20, 'Crushing check-in bonus', 'checkin_bonus') — this is the bonus 20 XP from the PRD XP table. Do NOT award it on 'owning', only 'crushing'.

checkins.getToday: Protected query. Input: { localDate: string }. Return today's check-in or null.

checkins.getHistory: Protected query. Returns last 30 check-ins for user.

CREATE lib/gemini/memory.ts:
async function extractAndStoreMemories(userId: string, sessionId: string, text: string):
- Call Gemini 2.5 Flash with prompt:
  "Extract 0–3 atomic memory facts from this text. Return JSON array: [{content: string, memory_type: 'preference'|'trigger'|'victory'|'fear'|'identity'|'pattern'}].
  Only extract genuinely new, specific facts. Skip generic statements.
  Good examples: 'User wakes at 6am', 'User struggles with night snacking after 10pm', 'User fears disappointing their family'.
  Text: {text}"
  Use responseMimeType: 'application/json'
- For each extracted memory: call generateEmbedding(content), insert into user_memories table
- Store source_session_id reference
- Run this function ASYNCHRONOUSLY after check-in response — do not block the user

Call extractAndStoreMemories after each successful check-in debrief AND after each direct coach conversation (not for onboarding_mirror).

ACCEPTANCE: User can submit a daily check-in. AI debrief streams in (Pro). Honesty score appears after stream. Free users see upgrade prompt. Mood signal 'excusing' triggers 40% Rule overlay. Memory extraction runs in background.
```

---

### Step 4.2 — AI Forge Coach Memory + RAG

```
Implement the persistent memory and RAG retrieval system for the AI Forge Coach.

UPDATE lib/gemini/coach.ts:

CREATE async function buildCoachSystemPrompt(userId: string, currentMessage: string, sessionType: string): Promise<string>
Steps (run in parallel with Promise.all):
1. Fetch user profile: why_statement, identity_declaration, level, forge_score, coach_intensity
2. Fetch active habits + current streaks (top 5 by streak length)
3. Embed currentMessage with generateEmbedding(currentMessage)
4. Query user_memories by semantic similarity (top 5):
   SELECT content, memory_type, 1 - (embedding <=> $embeddingParam) as similarity
   FROM user_memories
   WHERE user_id = $userId
   ORDER BY embedding <=> $embeddingParam
   LIMIT 5
5. Query cookie_jar_entries by semantic similarity (top 3):
   SELECT title, description, 1 - (embedding <=> $embeddingParam) as similarity
   FROM cookie_jar_entries
   WHERE user_id = $userId
   ORDER BY embedding <=> $embeddingParam
   LIMIT 3

Build the system prompt string combining:
- The base Forge Coach persona (or firm version based on coach_intensity)
- The appropriate session-type prompt (CHECKIN_DEBRIEF_SYSTEM_PROMPT or direct chat instructions)
- User profile section: Why Statement, Identity Declaration, Forge Score, Level, Active habits + streaks
- Top 3 Cookie Jar victories
- Top 5 semantic memories labeled by memory_type

UPDATE app/api/coach/stream/route.ts:
For session_type 'daily_checkin' and 'direct_chat':
1. Call buildCoachSystemPrompt(userId, lastUserMessage, sessionType)
2. Use the enriched system prompt for the Gemini call
For 'forty_percent_rule': also fetch top-1 cookie jar entry semantically matching the trigger context.

CREATE app/(app)/coach/page.tsx (Pro-gated):
(URL: /coach)

TIER CHECK: If user is Free tier:
- Show centered locked-state card: "Your coach is waiting." title, description of the memory system, "Unlock with Pro" orange button → /upgrade.

IF PRO/ELITE:
- Full-page chat interface
- On mount: stream an opening personalized greeting (session_type='direct_chat', opening message from coach)
- Message history: fetch last 50 messages from coaching_sessions table for this user (direct_chat type)
- Input at bottom fixed, send on Enter (with Shift+Enter for newline) or "Send" button
- Session type: 'direct_chat'
- Each full conversation stored in coaching_sessions table (append to messages JSONB)
- After conversation ends (user navigates away): trigger extractAndStoreMemories in background
- "Memory" badge near header: clicking opens a modal showing user's stored memories from user_memories table, grouped by memory_type

ACCEPTANCE: /coach is gated (Free tier sees locked state). Pro users get personalized opening message. Coach references past memories in responses. Memory extraction runs after sessions.
```

---

## PHASE 5: Forge Score + Gamification (Days 51–60)
*Goal: Full Forge Score formula, XP system, all 6 badges, 40% Rule Engine.*

---

### Step 5.1 — Forge Score Formula

```
Implement the full Forge Score calculation system.

CREATE lib/forge-score.ts:

FORGE SCORE FORMULA (per PRD Feature 8 — use this exactly):
The Forge Score is an integer 0–1000. Always floor(), never round up.

COMPONENT 1 — Streak Consistency (40% weight, max 400 points):
- For each active habit: ratio = current_streak / max(longest_streak, 7), capped at 1.0
- streak_score = average of all ratios across all active habits (if no habits: 0)
- Points = floor(streak_score × 400)

COMPONENT 2 — Check-in Honesty Depth (20% weight, max 200 points):
- Rolling 14-day average of honesty_score / 10 from daily_checkins (exclude null honesty_score rows)
- If no check-ins: 0
- Points = floor(average_ratio × 200)

COMPONENT 3 — Challenge Completion (20% weight, max 200 points):
- challenges_completed_this_month = count from user_challenges where status='completed' and completed_at >= start of current calendar month
- challenges_available = count from challenges table (total active challenges accessible by user's tier)
- ratio = challenges_completed_this_month / max(challenges_available, 1), capped at 1.0
- Points = floor(ratio × 200)

COMPONENT 4 — Cookie Jar Growth (10% weight, max 100 points):
- count = total cookie_jar_entries for user
- ratio = min(count / 20, 1.0) — reaches max at 20 entries
- Points = floor(ratio × 100)

COMPONENT 5 — Environment Improvements (10% weight, max 100 points):
- Parse users.environment_audit JSONB array
- done_count = items where done = true; total_count = total items
- ratio = done_count / max(total_count, 1), capped at 1.0
- Points = floor(ratio × 100)

TOTAL = floor(C1 + C2 + C3 + C4 + C5), min 0, max 1000

CREATE async function recalculateForgeScore(userId: string): Promise<number>:
- Fetch ALL required data in a SINGLE Promise.all (no N+1 queries):
  - habit_streaks for user's active habits
  - daily_checkins honesty scores (last 14 days)
  - user_challenges completed this month
  - count of active challenges (accessible by tier)
  - cookie_jar_entries count
  - users.environment_audit
- Compute each component using the exact formula above
- TOTAL must use floor(), NOT Math.round()
- Update users.forge_score = TOTAL
- Insert into forge_score_history: { user_id, score: TOTAL, recorded_at: now }
- This function must complete in <200ms. Profile with EXPLAIN ANALYZE if slow.
- Return TOTAL

UPDATE server/trpc/routers/analytics.ts with real implementations:
- forgeScoreHistory: { days: number } → SELECT score, recorded_at FROM forge_score_history WHERE user_id = ? AND recorded_at >= NOW() - interval '{days} days' ORDER BY recorded_at ASC → return [{date, score}]
- getDashboardStats: Return { forgeScore, habitStats, checkinStreak, avgHonestyScore }
```

---

### Step 5.2 — XP, Levels, Badges, and 40% Rule Engine

```
Implement the full XP system, all 6 badges, and the 40% Rule Engine component.

CREATE lib/xp.ts:

XP AWARD TABLE (per PRD Feature 13 — use these exact values):
- Habit completed: 20 XP (event_type: 'habit_complete')
- Daily check-in submitted: 30 XP (event_type: 'checkin')
- Check-in with mood_signal = 'crushing': bonus 20 XP (event_type: 'checkin_bonus')
- Callousing Challenge completed: challenge.xp_reward (varies 50–200 per challenge row) (event_type: 'challenge')
- 40% Rule "I'll take that step" selected: 15 XP (event_type: 'forty_percent')
- Cookie Jar entry added: 25 XP (event_type: 'cookie_jar')
- Environment item marked done: 50 XP (event_type: 'environment')
- Onboarding completed (Why Excavation + Environment Audit): 200 XP one-time (event_type: 'onboarding')

DO NOT invent other XP sources not listed here. No "AI debrief received" XP. No flat "7-day streak bonus". These are not in the PRD.

LEVEL THRESHOLDS (per PRD — non-linear, use these exact boundaries):
- Level 1 (Raw):        0–499 XP
- Level 2 (Tempered):   500–1,499 XP
- Level 3 (Forged):     1,500–3,499 XP
- Level 4 (Hardened):   3,500–7,499 XP
- Level 5 (Unbreakable):7,500–14,999 XP
- Level 6 (Legendary):  15,000+ XP

CREATE function getLevelFromXP(xp: number): { level: number, name: string, currentLevelMin: number, nextLevelMin: number | null, progressPct: number }
- Iterates threshold table to find current level
- progressPct = (xp - currentLevelMin) / (nextLevelMin - currentLevelMin) × 100 (for level 6: 100%)

CREATE async function awardXP(userId: string, amount: number, reason: string, eventType: XPEventType): Promise<{ leveledUp: boolean, newLevel: number, levelName: string, xpAwarded: number }>
- Insert into xp_events (xp_amount, reason, event_type)
- Fetch users.xp (current total)
- Update users.xp += amount
- old_level = getLevelFromXP(oldXP).level
- new_level = getLevelFromXP(oldXP + amount).level
- If new_level > old_level: update users.level = new_level, return leveledUp: true
- Return { leveledUp, newLevel, levelName: getLevelFromXP(oldXP + amount).name, xpAwarded: amount }

CREATE lib/badges.ts:

SIX v1 BADGES (per PRD Feature 13 — these are the exact badge_key values and trigger conditions):
1. 'identity_locked' — Why Excavation completed (onboarding Step 2)
2. 'mirror_gazer' — 30-day daily check-in streak (check: 30 consecutive days of check-ins)
3. 'cookie_jar_founder' — 10 or more Cookie Jar entries logged (not just the first)
4. 'forty_percent_survivor' — Selected "I'll take that step" 5 times total (count rule_forty_events where choice='took_step')
5. 'cold_mind' — 7 cold-category challenges completed in lifetime (count user_challenges joined to challenges where category='cold' and status='completed')
6. 'tempered' — Reached Tempered level (500 XP total, i.e., level 2)

CREATE async function checkAndAwardBadge(userId: string, badgeKey: BadgeKey): Promise<{ awarded: boolean }>
- SELECT 1 FROM user_badges WHERE user_id = ? AND badge_key = ? (idempotent check)
- If not yet awarded: INSERT into user_badges
- Do NOT call awardXP here — badges are cosmetic achievements. The PRD XP table lists exactly 8 XP sources and badge earning is not one of them. Adding XP for badges would be an unauthorized XP source.
- Return { awarded: true/false }

Badge trigger locations:
- 'identity_locked': in onboarding Step 2 on Why Statement accept
- 'mirror_gazer': in checkins.submit — check if last 30 days all have a check-in
- 'cookie_jar_founder': in cookiejar.add — check if count >= 10
- 'forty_percent_survivor': in rule_forty_events insert when choice='took_step' — check if total took_step count >= 5 (use >= not = — exact equality risks missing the badge if any event is back-filled or checked slightly out of order; idempotency check in checkAndAwardBadge prevents double-awarding)
- 'cold_mind': in challenges.complete — check cold-category completions >= 7
- 'tempered': in awardXP whenever new xp >= 500 — check and award if just crossed threshold

CREATE components/forge/RuleForty.tsx (40% Rule Engine):

TRIGGER CONDITIONS:
Auto-trigger 1: habits.logCompletion returns triggerFortyPercent: true (habit missed, streak was ≥7)
Auto-trigger 2: /api/coach/classify returns mood_signal of 'excusing' or 'deflecting'
Manual trigger: "40% Rule" button in Sidebar
Limit: max 3 auto-triggers per day (track count in localStorage or in users metadata JSONB field)

COMPONENT (as a full-screen overlay Portal, mounted on body):
- Background: pure #000000 snaps in at 80ms (NO fade — instant feel = urgency per PRD)
- Text content fades in 100ms AFTER overlay appears
- Large heading: "YOUR MIND IS LYING TO YOU" (text-4xl, font-heading, text-primary, center)
- Subheading: "You've only used 40% of your capacity." (text-xl, text-accent — orange text)
- Stream Forge Coach intervention via /api/coach/stream (session_type='forty_percent_rule') — streams below
- Cannot be dismissed by clicking outside or pressing Escape (per PRD spec)
- Two buttons appear ONLY after streaming completes (or on manual trigger: immediately):
  - "I'll take that step" (full width, bg #FF6B2B, text black) — closes modal, inserts rule_forty_events with choice='took_step', awards 15 XP, checks 'forty_percent_survivor' badge
  - "I still can't" (full width, ghost, border #3D3B39, text-muted) — closes modal, inserts rule_forty_events with choice='declined', no XP

Store rule_forty_events in the table created in Step 1.2 (NOT in coach_sessions).

ACCEPTANCE: Forge Score formula matches PRD exactly (floor, 5 components, correct weights). XP amounts match PRD. Level thresholds are non-linear (Raw/Tempered/Forged/Hardened/Unbreakable/Legendary). All 6 PRD badges can be earned with correct trigger conditions. 40% Rule overlay is instant black snap, heading reads "YOUR MIND IS LYING TO YOU", cannot be escaped except via the two buttons.
```

---

## PHASE 6: Cookie Jar + Challenges (Days 61–70)
*Goal: Victory archive with semantic search, Callousing Challenge system.*

---

### Step 6.1 — Cookie Jar

```
Build the Cookie Jar victory archive feature.

UPDATE server/trpc/routers/cookiejar.ts with real implementations:

cookiejar.list: Protected query. Fetch all cookie_jar_entries for user, ordered by created_at DESC.

cookiejar.add: Protected mutation. Input: { title (required, max 80 chars per PRD), description (required, max 500 chars per PRD), dateOfVictory?: string }
- Free tier check: count entries — if ≥5, throw FORBIDDEN with { upgradeRequired: true }
- Insert into cookie_jar_entries
- Call generateEmbedding(title + '. ' + description), update cookie_jar_entries.embedding
- Award 25 XP (event_type: 'cookie_jar') — PRD specifies 25 XP, not 15
- Check badge 'cookie_jar_founder': if total entries for user is now ≥10, award it
- Return created entry (without embedding vector)

cookiejar.edit: Protected mutation. Input: { id, title?, description?, dateOfVictory? }
- Verify ownership
- Update cookie_jar_entries
- Regenerate embedding if title or description changed

cookiejar.delete: Protected mutation. Input: { id }. Verify ownership. Delete row.

cookiejar.search: Protected query. Input: { query: string }
- Call generateEmbedding(query)
- SELECT id, title, description, date_of_victory, 1 - (embedding <=> $queryEmbedding) as similarity FROM cookie_jar_entries WHERE user_id = ? ORDER BY embedding <=> $queryEmbedding LIMIT 5
- Return results with similarity score

CREATE app/(app)/cookie-jar/page.tsx:
(URL: /cookie-jar)

HEADER: "Cookie Jar" title (text-3xl, font-heading) + "Add Victory" button (orange, right).
Search bar: full-width, debounced 500ms (per PRD), placeholder "Search your victories...". Results update on Enter or after 500ms debounce.
If search active: show semantic results with similarity score badge.
Otherwise: show all entries grid.

CREATE components/forge/CookieJarEntry.tsx:
Dark card (#111110), border #2A2927, hover border #3D3B39, orange corner accent.
Title (text-xl, font-heading, white), date badge (text-xs, text-muted, if provided), description (text-base, text-secondary, 3 lines, expand on click).
Edit + Delete icons on hover. Delete requires confirmation.

ADD VICTORY MODAL:
- Title input (max 80 chars, NOT 100 — per PRD), char counter visible
- Description textarea (max 500 chars), char counter visible
- Date of Victory: optional date picker (shadcn Calendar)
- "Lock It In" submit button (orange)

Free tier limit state (≥5 entries): "You have 5 victories stored. Upgrade to Pro to save unlimited victories." — upgrade CTA.

ACCEPTANCE: User can add, edit, view, search (semantic), and delete entries. Free tier caps at 5. Adding awards 25 XP. At 10 entries the 'cookie_jar_founder' badge is awarded. Semantic search returns relevant results.
```

---

### Step 6.2 — Callousing Challenges

```
Build the Callousing Challenge system and seed the challenge library.

IMPORTANT: The challenges DB schema uses duration_minutes (not duration_days) and has an xp_reward field per the PRD data model. Challenge categories are: 'cold' | 'screen' | 'physical' | 'fast' | 'social' (per PRD data model — NOT 'mental'/'digital').

Create a server-side seed script scripts/seed-challenges.ts (run once via `npx ts-node scripts/seed-challenges.ts`) that inserts 20 challenges into Firestore using the Admin SDK. Each doc has a deterministic string ID (e.g., 'cold-shower-protocol') so re-running the script is idempotent (use adminDb.doc('challenges/' + id).set(..., { merge: true })).

Seed data (use these exact values in the seed script — format as JS objects { id, title, description, difficulty, category, durationMinutes, xpReward, isActive: true }):

// Difficulty 1 (Free tier accessible — exactly 5, per PRD Feature 11)
{ id: 'cold-shower-protocol', title: 'Cold Shower Protocol', description: 'End every shower with 60 seconds of cold water for 7 days straight. No warming back up. No exceptions. Cold exposure activates the noradrenergic system — this is a measurable intervention, not just discomfort.', difficulty: 1, category: 'cold', durationMinutes: 10080, xpReward: 75 },
{ id: 'phone-free-morning', title: 'Phone-Free Morning', description: 'No phone for the first 60 minutes after waking. Every day for 7 days. The morning cortisol spike is your highest-focus window. You are currently handing it to an algorithm.', difficulty: 1, category: 'screen', durationMinutes: 10080, xpReward: 50 },
{ id: 'no-complaint-protocol', title: 'No Complaint Protocol', description: 'Go an entire day without complaining — verbally or mentally. Restart if you slip. The point is not silence — it is rewiring the default toward agency.', difficulty: 1, category: 'social', durationMinutes: 1440, xpReward: 50 },
{ id: 'the-hard-conversation', title: 'The Hard Conversation', description: 'Have one difficult conversation you have been avoiding. Complete it within 48 hours. Name the conversation before you begin.', difficulty: 1, category: 'social', durationMinutes: 2880, xpReward: 75 },
{ id: '5am-wake-protocol', title: '5AM Wake Protocol', description: 'Wake at 5AM every day for 5 days. No snooze. Get out of bed immediately. You are not a morning person — you are a discipline person.', difficulty: 1, category: 'physical', durationMinutes: 7200, xpReward: 75 },
// Difficulty 3
{ id: 'dopamine-detox-weekend', title: 'Dopamine Detox Weekend', description: 'No social media, no streaming, no alcohol, no junk food for 48 hours. Only books, exercise, and intentional work. This is a reset, not a punishment.', difficulty: 3, category: 'screen', durationMinutes: 2880, xpReward: 100 },
{ id: '10k-this-week', title: '10K This Week', description: 'Run or walk 10 kilometers total within 7 days. Track every kilometer. No weather excuses — you have legs.', difficulty: 3, category: 'physical', durationMinutes: 10080, xpReward: 100 },
{ id: 'cold-immersion-week', title: 'Cold Immersion Week', description: 'Cold shower every morning for 7 days. Minimum 90 seconds cold. No warm water beforehand — cold from the start.', difficulty: 3, category: 'cold', durationMinutes: 10080, xpReward: 100 },
{ id: 'public-rejection-training', title: 'Public Rejection Training', description: 'Ask for something unreasonable in public 3 times this week — a discount, an impossible request. Train yourself to tolerate rejection. The fear is worse than the reality.', difficulty: 3, category: 'social', durationMinutes: 10080, xpReward: 100 },
{ id: 'single-tasking-week', title: 'Single-Tasking Week', description: 'No multitasking for 7 days. One thing at a time. No phone while eating. No background noise while working. This is harder than it sounds.', difficulty: 3, category: 'screen', durationMinutes: 10080, xpReward: 100 },
{ id: 'social-media-elimination', title: 'Social Media Elimination', description: 'Delete all social media apps for 14 days. Not muted — deleted. Reinstall after the 14 days if you choose. But experience the two weeks first.', difficulty: 3, category: 'screen', durationMinutes: 20160, xpReward: 100 },
{ id: 'water-only-week', title: 'Water-Only Week', description: 'No coffee, no alcohol, no juice, no soda for 7 days. Water and herbal tea only. Identify which dependencies are habits vs. choices.', difficulty: 3, category: 'fast', durationMinutes: 10080, xpReward: 100 },
// Difficulty 4
{ id: '30-day-no-algorithm-feed', title: '30-Day No Algorithm Feed', description: 'Delete all social media apps for 30 days. Keep a journal of what you do with the time instead. Most people discover they were using the apps to avoid something.', difficulty: 4, category: 'screen', durationMinutes: 43200, xpReward: 150 },
{ id: 'sleep-discipline-protocol', title: 'Sleep Discipline Protocol', description: 'In bed by 10:30PM, awake by 5:30AM, every day for 14 days. Non-negotiable. Track your HRV or subjective energy daily.', difficulty: 4, category: 'physical', durationMinutes: 20160, xpReward: 150 },
{ id: 'deliberate-discomfort-daily', title: 'Deliberate Discomfort Daily', description: 'Every day for 21 days, do one thing that makes you genuinely uncomfortable. Document it in your check-in. Comfort is the enemy of growth.', difficulty: 4, category: 'physical', durationMinutes: 30240, xpReward: 150 },
{ id: 'zero-complaint-month', title: 'Zero Complaint Month', description: '30 days without a single complaint. Wear a rubber band on your wrist. Snap it every time you catch yourself complaining. Restart the count.', difficulty: 4, category: 'social', durationMinutes: 43200, xpReward: 150 },
{ id: 'one-meal-a-day-week', title: 'One-Meal-a-Day Week', description: 'Eat one meal per day for 7 days. This is not about weight — it is about learning that discomfort is not an emergency. Consult a physician if you have health conditions.', difficulty: 4, category: 'fast', durationMinutes: 10080, xpReward: 150 },
// Difficulty 5
{ id: 'the-75-hard-protocol', title: 'The 75 Hard Protocol', description: 'Follow the Andy Frisella 75 Hard protocol for 75 days: two 45-minute workouts per day (one outdoor), diet, no alcohol, one gallon of water, 10 pages of nonfiction reading, progress photo. Restart from day 1 if you miss anything. This is the benchmark.', difficulty: 5, category: 'physical', durationMinutes: 108000, xpReward: 200 },
{ id: 'no-entertainment-month', title: 'No Entertainment Month', description: 'Zero passive entertainment for 30 days: no TV, no streaming, no social media, no gaming. Only creation, learning, work, and relationships. Most people discover who they are without the noise.', difficulty: 5, category: 'screen', durationMinutes: 43200, xpReward: 200 },
{ id: 'cold-water-protocol-21-days', title: 'Cold Water Protocol — 21 Days', description: 'Cold shower every morning, minimum 3 minutes cold, for 21 days. No exceptions for illness (reduce duration if sick, do not skip). Cold adaptation is neurological — you are literally rewiring your stress response.', difficulty: 5, category: 'cold', durationMinutes: 30240, xpReward: 200 }

Note on tier access: Per PRD Feature 11, Free tier users can VIEW all challenges but can only ACTIVATE difficulty-1 challenges (the 5 easiest). Pro tier unlocks the full library.

UPDATE server/trpc/routers/challenges.ts with real implementations:

challenges.list: Protected query. Fetch all active challenges. Join with user_challenges to get each challenge's status for this user. Return challenges with {userStatus: 'none'|'active'|'completed'|'failed', userChallenge?: UserChallenge}.

challenges.activate: Protected mutation. Input: { challengeId }
- Free tier: only allow if challenge.difficulty === 1; else throw FORBIDDEN { upgradeRequired: true }
- Per PRD: user can have max 1 active challenge at a time. Check user_challenges where status='active'. If exists, throw CONFLICT { message: 'Complete or abandon your current challenge first.' }
- Insert into user_challenges (status='active', started_at=now)

challenges.complete: Protected mutation. Input: { userChallengeId, reflection (required, min 50 chars) }
- Verify user_challenge belongs to user and status='active'
- Update user_challenges: status='completed', completed_at=now, reflection
- Award xp = challenge.xp_reward (from challenges table — NOT a flat 100)
- Check badge 'cold_mind': count cold-category completions for user
- Check badge 'first_challenge_complete': if this is user's first completed challenge — note: this badge is NOT in the v1 PRD badge list. Do NOT create it. Skip this check.
- Call recalculateForgeScore(userId)
- Return { xpAwarded: challenge.xp_reward, badgesAwarded: string[], newForgeScore }

Challenge expiry (per PRD): A challenge expires (auto-fails) if not completed within duration_minutes × 3. Implement a check in challenges.list — if started_at + duration_minutes × 3 minutes has passed and status is still 'active', update status to 'failed'.

CREATE app/(app)/challenges/page.tsx:
(URL: /challenges)
Tabs: "Available" | "My Active" | "Completed"
Free tier sees all challenges but difficulty > 1 shows lock icon with "Pro" badge.

CREATE components/forge/ChallengeCard.tsx:
Title (text-xl), description (text-sm, text-secondary, 3 lines truncated), difficulty shown as 1–5 filled squares (like signal bars — use Square icon, filled vs. empty), duration formatted (e.g., "7 days"), XP reward badge.
Status: Available (border #2A2927), Active (border #FF6B2B, pulsing dot indicator), Completed (border #22C55E).
Active challenge: shows countdown timer (expires at started_at + duration_minutes × 3).

ACCEPTANCE: 20 challenges seeded. Free users see all but can only activate difficulty-1. Only 1 active challenge allowed at a time. XP awarded equals challenge.xp_reward (variable, not flat 100). Challenge expiry auto-fails after duration_minutes × 3.
```

---

## PHASE 7: Billing (Days 71–77)
*Goal: Lemon Squeezy payments, upgrade flow, settings page, tier enforcement.*

---

### Step 7.1 — Lemon Squeezy Integration

```
Implement Lemon Squeezy billing for MindForge.

INSTALL: @lemonsqueezy/lemonsqueezy.js

CREATE lib/lemonsqueezy.ts:

Initialize Lemon Squeezy with LEMONSQUEEZY_API_KEY (server-only, no NEXT_PUBLIC_ prefix).

CREATE async function createCheckoutUrl(userId: string, email: string, variantId: string): Promise<string>
- Create checkout via Lemon Squeezy API POST /v1/checkouts
- Set custom_data: { user_id: userId } for webhook attribution
- Set checkout_data.email to prefill
- Return the checkout URL

CREATE function verifyWebhookSignature(rawBody: string, signature: string): boolean
- HMAC-SHA256 with LEMONSQUEEZY_WEBHOOK_SECRET using Node.js crypto (built-in)
- Return true if signatures match

TIER MAPPING from variant IDs:
- LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID → tier: 'pro'
- LEMONSQUEEZY_PRO_ANNUAL_VARIANT_ID → tier: 'pro'
- LEMONSQUEEZY_ELITE_MONTHLY_VARIANT_ID → tier: 'elite'
- LEMONSQUEEZY_ELITE_ANNUAL_VARIANT_ID → tier: 'elite'

CREATE app/api/billing/create-checkout/route.ts:
POST. Authenticated. Body: { variantId }.
Call createCheckoutUrl. Return { checkoutUrl }. Redirect not done server-side — client redirects to checkoutUrl.

CREATE app/api/billing/webhook/route.ts:
POST. Public endpoint (authenticated by HMAC signature only).
1. Read raw body as text (important: use request.text(), not request.json() — signature is computed on raw bytes)
2. Get x-signature header
3. Verify HMAC signature — return 401 immediately if invalid. Log to Sentry.
4. Parse JSON from raw body string
5. Handle these event_name values:
   - 'subscription_created': upsert subscriptions table { user_id (from custom_data.user_id), lemonsqueezy_customer_id, lemonsqueezy_subscription_id, tier: mapVariantToTier(variant_id), status: 'active', current_period_end }; update users.tier
   - 'subscription_updated': update subscriptions status + current_period_end
   - 'subscription_cancelled': update subscriptions.status = 'cancelled'; do NOT change tier or current_period_end yet
   - 'subscription_expired': update subscriptions.status = 'expired'; update users.tier = 'free'
6. All DB writes use service role key (bypasses RLS — necessary because webhook has no user session)
7. Idempotent: use ON CONFLICT (lemonsqueezy_subscription_id) DO UPDATE for subscriptions upsert
8. Return { received: true } with 200 status

CREATE app/(app)/upgrade/page.tsx:
(URL: /upgrade)

Pricing table with 3 tiers. IMPORTANT: Use the correct prices from the PRD (Feature 12):

FREE ($0):
- Up to 3 active habits
- Up to 5 Cookie Jar entries
- Activate difficulty-1 challenges only
- Daily check-in (no AI debrief)
- No direct coach chat

PRO ($12/month or $89/year — "Save 38%"):
- Unlimited habits
- Unlimited Cookie Jar entries
- Full challenge library
- AI daily debrief after every check-in
- Direct Forge Coach chat (unlimited)
- Weekly Neural Report email
- Persistent memory system active

ELITE ($29/month or $219/year — "Save 37%"):
- Everything in Pro
- Weekly AI-facilitated group coaching session
- Priority AI response speed
- One-time Identity Reset (redo Why Excavation)
- Founding member badge

Annual pricing shown by default with monthly toggle. Pro column has orange highlight border. Current plan shows "Current Plan" badge.
Upgrade buttons POST to /api/billing/create-checkout with correct variantId, then window.location.href = checkoutUrl.

ACCEPTANCE: Prices shown correctly ($12/$29 monthly). Checkout redirects to Lemon Squeezy. Webhook verifies HMAC signature. subscription_created updates users.tier. subscription_expired downgrades to free. subscriptions.current_period_end is stored.
```

---

### Step 7.2 — Settings Page

```
Build the Settings page.

CREATE app/(app)/settings/page.tsx:
(URL: /settings)

SECTIONS (use Tabs):

1. PROFILE:
- Display name input (updateable)
- Email (read-only, from Firebase Auth / users/{uid}.email)
- "Save changes" button → calls tRPC user.updateProfile({ displayName })

2. IDENTITY:
- Why Statement display (read-only in v1) — show current users.why_statement
- Identity Declaration display (read-only in v1) — show current users.identity_declaration
- Note: "Why Excavation reset is available on the Elite plan. Contact support to request it."
- Show earned badges: grid of user_badges, earned showing colored icon + earned date, unearned showing grayscale + lock icon + requirement

3. COACH PREFERENCES:
- Coach Intensity toggle: "Hard Truth" (default) / "Firm but Kind" — calls tRPC user.updateProfile({ coachIntensity: 'hard'|'firm' })
- Timezone select: dropdown of IANA timezone strings (common ones at top) → tRPC user.updateProfile({ timezone })
- Email notifications toggle: Weekly Neural Report (Pro only — show locked + upgrade CTA if Free)

4. SUBSCRIPTION:
- Current tier badge (Free / Pro / Elite) with status (active/cancelled/expired)
- If Pro/Elite: "Manage Billing" link → Lemon Squeezy customer portal URL
- If Free: "Upgrade to Pro" button → /upgrade
- If cancelled: "Your Pro access continues until [current_period_end date]"
- If elite: show Identity Reset option (one-time): "Reset Why Excavation" button → sets onboarding_step = 'why', redirects to /onboarding/why (Elite only)

5. DATA:
- "Export My Data" button → GET /api/user/export — returns JSON download of check-ins, cookie jar, habits
- "Delete My Account" button (destructive, red) → confirmation modal requiring user to type "DELETE" → soft-delete flow: users.is_deleted = true, anonymize email, cancel subscription via Lemon Squeezy API

ACCEPTANCE: Coach intensity toggle saves and affects system prompt on next coaching session. Timezone saves. Billing portal link works for Pro/Elite. Delete account requires "DELETE" confirmation. Elite tier sees Identity Reset option.
```

---

## PHASE 8: Weekly Report + Analytics (Days 78–84)
*Goal: Analytics dashboard, weekly AI neural report via email, Vercel cron job.*

---

### Step 8.1 — Analytics Page

```
Build the Analytics page.

INSTALL: recharts (already installed in Step 1.1)

CREATE app/(app)/analytics/page.tsx:
(URL: /analytics)

HEADER: "Your Neural Progress" (text-3xl, font-heading). Date range selector: dropdown for "Last 7 Days" / "Last 30 Days" / "Last 90 Days" (default: 30 days).

Fetch all data with a single tRPC call using Promise.all in the server handler.

CHARTS (use Recharts, all dark themed with no emojis in tooltips per PRD):

1. FORGE SCORE HISTORY (Line chart, full width — PRD Feature 16 specifies "line chart"):
- Data: analytics.forgeScoreHistory({ days: 30 })
- X-axis: dates, Y-axis: 0–1000
- Use Recharts <LineChart>. Optional: wrap in <AreaChart> with a subtle gradient fill (rgba(255,107,43,0.08)) for visual depth — this is a visual enhancement that does not contradict the spec.
- Line stroke: #FF6B2B, strokeWidth 2, dot={false}
- Tooltip: "June 10 — 342 pts"

2. HABIT COMPLETION RATE (Bar chart per habit):
- Data: analytics.habitCompletionRates({ days: 30 })
- One group per habit: shows % of scheduled days completed
- Bar color: #22C55E. Background bar: #2A2927.
- X-axis: habit names (truncated to 12 chars)

3. CHECK-IN HONESTY TREND (Line chart):
- Data: analytics.checkinHonestyTrend({ days: 30 })
- X-axis: dates, Y-axis: 1–10
- Line stroke: #3B82F6, strokeWidth 2, dots on data points

4. TOTAL XP OVER TIME (Area/line chart):
- Data: analytics.xpHistory({ days: 90 })
- Shows cumulative XP as a line
- Color: #FF6B2B

STATS ROW (above charts, 4 cards in a row):
- Check-ins this period: count
- Average Honesty Score: X.X/10
- Habits Completed: count
- Current Forge Score: big number (text-display, orange)

WEEKLY REPORT CARD (if Pro, at top):
- Fetch analytics.getLatestWeeklyReport()
- If exists: show expandable card with behavioral_arc, key_insight, next_week_challenge
- If not yet: show "Your first weekly report arrives next Sunday"

All Recharts components: override styles via props — CartesianGrid stroke='#2A2927', Tick fill='#87857F', Tooltip contentStyle={{ background: '#232220', border: '1px solid #3D3B39', borderRadius: 0, color: '#C2C0BE' }}.

UPDATE server/trpc/routers/analytics.ts with all real implementations:
- forgeScoreHistory, habitCompletionRates, checkinHonestyTrend, xpHistory, getLatestWeeklyReport

ACCEPTANCE: All 4 charts render with real data. Dark theme applied. No tooltip emojis. Weekly report card shows if Pro user has received a report.
```

---

### Step 8.2 — Weekly Neural Report

```
Build the Weekly Neural Report email system.

INSTALL: resend @react-email/components @react-email/render

CREATE emails/WeeklyNeuralReport.tsx (React Email template):

EMAIL DESIGN: Background #0A0908, max-width 600px, centered.

SECTIONS (in order):
1. Header: "MINDFORGE" logotype in orange + "Weekly Neural Report" subtitle + week date range
2. Forge Score: Large score number + delta indicator (+X this week in green, -X in red)
3. "This Week" stats: 3 columns — check-in count, habits completed count, XP earned
4. Behavioral Arc: 2–3 sentence AI-generated narrative of the week's pattern (behavioral_arc field)
5. Key Insight: One specific honest observation (key_insight field — bold, orange accent)
6. Best Streak: "[Habit Name] — [N] days" highlighted
7. Next Week Challenge: Specific action challenge (next_week_challenge field)
8. Cookie Jar Reminder (if user has entries): "Remember this?" with one random cookie jar entry title
9. Footer: Unsubscribe link + "View in App" CTA button (orange, links to /dashboard)

CREATE app/api/cron/weekly-report/route.ts:
- Verify Authorization header = `Bearer ${process.env.CRON_SECRET}`. Return 401 if invalid.
- Fetch all Pro/Elite users: users where tier IN ('pro','elite') AND onboarding_complete = true
- For each user (batches of 50, with 200ms delay between users per PRD spec — not between batches):
  WRAP EACH USER in try/catch — one failure must not stop others
  1. Query past 7 days data via analytics queries (habit completions, check-in scores, forge score delta, XP earned, top streak)
  2. Fetch user's why_statement and identity_declaration
  3. Call Gemini 2.5 Pro with responseMimeType: 'application/json' to generate structured report:
     Prompt: "Generate a weekly neural report for this user based on their week's data: {weekData}. Their Why Statement: {why}. Return JSON: { forge_score_change: number, habit_completion_rate: number, best_streak_this_week: string, behavioral_arc: string, key_insight: string, next_week_challenge: string }"
  4. Insert into weekly_reports table
  5. Render WeeklyNeuralReport email with all data
  6. Send via Resend: from 'MindForge <forge@mindforge.app>', to user.email, subject 'Your Weekly Neural Report — [Mon date] to [Sun date]'
  7. Update weekly_reports.email_sent = true
  8. Log result (success or error reason) to Sentry

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
This runs every Sunday at 8:00AM UTC. Note: Vercel cron requires Vercel Pro plan.

ACCEPTANCE: Email template renders with dark theme in email preview. Cron endpoint returns 401 without CRON_SECRET. With valid secret and seeded user data, reports generate and send. weekly_reports row inserted per user.
```

---

## PHASE 9: Polish + Launch Prep (Days 85–90)
*Goal: Error handling, performance, mobile, tracking, landing page, GDPR, launch.*

---

### Step 9.1 — Error Handling + Skeleton Loaders

```
Add comprehensive error handling and skeleton loading states throughout MindForge.

ERROR BOUNDARIES:
Create components/ErrorBoundary.tsx (React class component error boundary).
Wrap each page in app/(app)/ with this boundary.
Error UI: centered dark card, "Something went wrong" title, non-technical message, "Refresh page" button.

SKELETON LOADERS — create matching skeletons for all async components:
- SkeletonHabitCard: matches HabitCard exact dimensions
- SkeletonForgeScore: matches score widget
- SkeletonXPBar: matches XP bar
- SkeletonCheckinCard: matches check-in CTA card
- SkeletonChallengeCard: matches ChallengeCard
- SkeletonCookieJarEntry: matches CookieJarEntry

All skeletons: bg-forge-border (#2A2927) blocks with Tailwind animate-pulse (1.5s ease-in-out infinite). No shimmer gradient — plain pulse only (simpler, less distracting).

Wrap all page data fetches with React Suspense using matching skeleton fallbacks. No blank white flash between states.

TOAST NOTIFICATIONS:
Install sonner.
Add <Toaster theme="dark" /> to app/(app)/layout.tsx.
Use toast.success / toast.error / toast.info throughout — never use alert() or inline success/error states.
Style: dark background (#232220), orange success accent (#FF6B2B), no emojis in toast text.

Canonical error messages (these specific strings, per PRD error handling spec):
- Free habit limit: "You've reached 3 habits on the free plan. Upgrade to Pro for unlimited habits." [Upgrade button]
- Gemini unavailable: "Your coach is temporarily unavailable. Your reflection has been saved. We'll generate your debrief shortly."
- Gemini stream interrupted: "Your debrief was interrupted. Resubmit to generate it." [Resubmit button, same-day only]
- Duplicate habit log: "You've already logged this habit today."
- Rate limit exceeded: "You've reached the coaching limit. Your coach resets in X hours."
- Session expired: "Your session expired. Redirecting to login..."

ACCEPTANCE: All pages show skeletons before data loads. Error boundary catches page-level failures. All toasts use forge dark theme. No emojis in toasts.
```

---

### Step 9.2 — PostHog + Sentry

```
Add PostHog analytics and Sentry error tracking.

INSTALL: posthog-js posthog-node @sentry/nextjs

POSTHOG SETUP:
Create lib/posthog/client.ts with PostHog browser client using NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST.
Create components/PostHogProvider.tsx and add to app/layout.tsx.
Create lib/posthog/server.ts using posthog-node for server-side events (webhooks, cron).

Track these exact events (from PRD Section 15):
- 'sign_up': On first-ever login (trigger when users row is newly inserted via DB trigger)
- 'onboarding_complete': When users.onboarding_complete is set to true
- 'habit_created': On habits.create success ({ category, habit_type })
- 'habit_logged': On habits.logCompletion success ({ completed: boolean })
- 'checkin_submitted': On checkins.submit success ({ has_ai_debrief: user.tier !== 'free' })
- 'coach_message_sent': On direct chat message send (Pro only) — server-side
- 'upgrade_clicked': On any upgrade CTA click ({ source: 'habit_limit'|'coach_locked'|'upgrade_page'|'settings' })
- 'subscription_created': In webhook handler (server-side with posthog-node)
- 'challenge_activated': On challenges.activate success
- 'challenge_completed': On challenges.complete success
- 'cookie_jar_entry_added': On cookiejar.add success
- 'badge_earned': On checkAndAwardBadge returning awarded:true ({ badge_key })
- 'forty_percent_triggered': On RuleForty overlay opening ({ triggered_by })
- 'forty_percent_accepted': On "I'll take that step" button click

SENTRY SETUP:
Run: npx @sentry/wizard@latest -i nextjs
Add NEXT_PUBLIC_SENTRY_DSN to env vars.
Wrap API routes with Sentry error capturing.
Add custom context: user_id, tier on all Sentry captures.
Set tracesSampleRate: 0.1 in production.

ACCEPTANCE: PostHog shows sign_up event on new registration. Sentry captures thrown test error. No console errors from tracking code.
```

---

### Step 9.3 — Mobile Responsiveness Audit

```
Perform a full mobile responsiveness audit.

Target viewports: 375px (iPhone SE), 390px (iPhone 14), 430px (iPhone 14 Pro Max).

ISSUES TO FIX:

1. SIDEBAR: Hidden on mobile (< lg). Verify no layout shift. Verify padding-left 240px only applies on lg+.

2. HABIT CARD BUTTONS: "Completed" and "Missed" buttons must be min-height 44px (iOS HIG). Add min-h-[44px] class.

3. FORGE SCORE NUMBER: text-display (49px) may overflow on 375px. Use text-4xl on mobile: class="text-4xl lg:text-display".

4. ANALYTICS CHARTS: Add <ResponsiveContainer width="100%" height={200}> on mobile. Reduce x-axis tick count to 4 on mobile using interval calculation.

5. COACH PAGE INPUT: Input area at bottom must not be covered by iOS keyboard. Apply pb-[env(safe-area-inset-bottom)] and use CSS viewport units (dvh not vh) for the message container height.

6. ONBOARDING TEXTAREA: height 50vh on mobile, 60vh on desktop: class="h-[50vh] lg:h-[60vh]".

7. MODALS (40% Rule, badge): Must be full-screen on mobile. Use fixed inset-0 for all modal overlays.

8. HEADER on mobile: Show only score number, not "FORGE SCORE" label: class="hidden lg:block" on the label.

9. COOKIE JAR SEARCH: Full-width search bar on all viewports.

10. CHECK-IN PAGE: On mobile, textarea should use dvh so it doesn't overflow when keyboard appears.

Verify these core flows at 375px:
- Login → complete onboarding (all 3 steps, including textarea input)
- Dashboard → complete a habit (spark animation fires, Forge Score updates)
- Submit daily check-in with AI debrief streaming
- Add a Cookie Jar entry + run semantic search

ACCEPTANCE: All core flows complete at 375px. No horizontal scroll on any page. Buttons are ≥44px. Keyboard does not cover inputs.
```

---

### Step 9.4 — Landing Page

```
Build the MindForge marketing landing page.

CREATE app/page.tsx:
This is a static marketing page — no 'use client' at page level. No tRPC providers needed. Use static rendering.

TONE: Dark, direct, serious. No soft language. No SaaS clichés. No emojis anywhere on this page.

SECTIONS:

1. HERO (full viewport height, bg #0A0908):
Optional subtle radial gradient at center: rgba(255,107,43,0.04) → transparent.
Eyebrow: "THE FIRST ACCOUNTABILITY SYSTEM THAT TELLS YOU THE TRUTH" (text-xs, tracking-widest, text-muted, uppercase).
Headline: "Stop being soft with yourself." (text-display, font-heading, text-primary).
Sub-headline: "MindForge uses neuroscience-backed behavior change and an AI coach that builds a persistent memory of who you are — and holds you to who you said you'd be." (text-xl, text-secondary, max-w-[600px]).
CTA: "Start Forging — It's Free" (orange button, sharp, px-8 py-4, links to /login).
Below CTA: "No credit card. No gentle encouragement. Just accountability." (text-xs, text-muted).

2. PROBLEM SECTION (bg #111110):
Heading: "Every other app is lying to you." (text-3xl, font-heading).
3 cards (row on desktop, stack on mobile):
- "Participation trophies" — "They reward showing up, not results. Your brain learns to tolerate failure."
- "No memory, no coaching" — "Generic reminders are not coaching. No app builds a real relationship with you."
- "Surface motivation collapses" — "Without your deepest why, streaks break and you abandon the app in two weeks."

3. HOW IT WORKS (bg #0A0908):
Heading: "The Forge System" (text-3xl, font-heading).
3 numbered steps (vertical flow, left number in orange, right content):
1. "Face the Mirror" — Write the honest truth. Your AI coach responds without softening it.
2. "Excavate Your Why" — A Socratic AI dialogue uncovers your identity-level motivation. The anchor that does not break when motivation fails.
3. "Forge Daily" — Log habits honestly. Receive direct coaching. Watch your Forge Score reflect the truth of your behavior.

4. FEATURE GRID (bg #111110, 2x3 on desktop, 1 column on mobile):
- Forge Score: "A real-time accountability score that reflects your actual behavior — not your effort."
- AI Memory: "Your coach remembers your patterns, triggers, and past victories across every session. No other app does this."
- 40% Rule Engine: "When you are about to quit, the system triggers. Research shows you are at 40% of your true capacity."
- Cookie Jar: "Store your past victories. Your coach surfaces them when you are struggling."
- Callousing Challenges: "A library of graduated discomfort challenges that build real mental toughness."
- No Skip Option: "Completed or missed. No grace period. No undo. No excuses."

5. PRICING (bg #0A0908):
Same 3-tier table as upgrade page with correct PRD pricing: Free / Pro $12/month / Elite $29/month.
Annual toggle. Pro column highlighted with orange border.

6. SOCIAL PROOF (bg #111110):
Heading: "Built for people who are done making excuses."
3 placeholder testimonial cards:
- "I've tried 7 habit apps. MindForge is the first one that does not let me off the hook." — Marcus, Software Engineer
- "The AI coach actually remembers what I told it three weeks ago. That has never happened before." — Priya, Entrepreneur
- "My Forge Score dropped when I missed my workouts. That is the accountability I needed." — James, Founder

7. FINAL CTA (bg #0A0908, centered, large padding):
"The version of yourself you keep imagining? It is built in the forge."
"Start Forging — It's Free" orange button → /login.
"No credit card required." text below.

8. FOOTER: "MINDFORGE" logo text, tagline, links to /privacy and /terms.

ACCEPTANCE: Landing page loads at /. All 8 sections render. No emojis on page. CTA links go to /login. Pricing shows $12/$29 (correct PRD prices). Lighthouse performance ≥85 on desktop.
```

---

### Step 9.5 — Final Checks + GDPR + Launch

```
Complete the pre-launch checklist for MindForge.

PERFORMANCE:
Run Lighthouse on /dashboard route. Target: ≥90 performance score on desktop.
- Ensure all images use next/image with width/height specified
- Verify React Suspense is in place for all async data
- Check no render-blocking scripts in <head>
- Confirm Tailwind purge is working (no unused CSS shipped)

GDPR COMPLIANCE:
1. Data Export endpoint (app/api/user/export/route.ts):
   - Authenticated GET
   - Exports: user profile, habits, habit_completions (last 90 days), daily_checkins, coaching_sessions, user_memories (content only, no vectors), cookie_jar_entries, user_badges, xp_events
   - Return as JSON download (Content-Disposition: attachment; filename="mindforge-export.json")
   - Rate limit: 1 export per 24 hours per user

2. Delete Account flow (already in Settings) — verify:
   - Set users/{uid}.isDeleted = true in Firestore
   - Anonymize email to deleted_{uid}@mindforge.app
   - Call adminAuth.deleteUser(uid) to remove Firebase Auth account
   - If subscription active: call Lemon Squeezy API to cancel subscription
   - Queue data anonymization (placeholder: log to Sentry for manual processing in v1)

3. Create app/privacy/page.tsx — static privacy policy page (standard SaaS content, dark theme).
4. Create app/terms/page.tsx — static terms of service page (standard SaaS content, dark theme).

SECURITY FINAL CHECKS:
- Confirm no env var starting with NEXT_PUBLIC_ contains secrets. Run: grep -r "NEXT_PUBLIC_FIREBASE_PRIVATE\|NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL\|NEXT_PUBLIC_GEMINI\|NEXT_PUBLIC_LEMONSQUEEZY\|NEXT_PUBLIC_RESEND" . — must return zero results.
- Confirm Firebase Admin credentials (FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL) are NOT in any NEXT_PUBLIC_ var
- Confirm lib/firebase/admin.ts and lib/auth.ts have `import "server-only"` at the top
- Confirm Lemon Squeezy webhook HMAC verification is active (not bypassed)
- Confirm rate limiting is active on /api/coach/stream

CREATE .env.local.example with all env vars from Section 5.3 of the PRD, all values as empty strings.

FINAL ACCEPTANCE CHECKLIST:
- [ ] New user can sign up, complete onboarding (3 steps), and reach /dashboard
- [ ] Daily check-in submits and AI debrief streams in (Pro user)
- [ ] Habit completion fires Forge Spark animation and updates Forge Score (count-up animation, 500ms)
- [ ] 40% Rule modal: pure black snap-in, heading "YOUR MIND IS LYING TO YOU", cannot escape except via the two buttons
- [ ] Forge Score formula verified: floor(), 5 components, correct weights (40/20/20/10/10)
- [ ] XP amounts correct: habit 20, checkin 30, cookie_jar 25, environment 50, onboarding 200
- [ ] Level thresholds correct: Raw (0), Tempered (500), Forged (1500), Hardened (3500), Unbreakable (7500), Legendary (15000)
- [ ] All 6 badges match PRD keys: identity_locked, mirror_gazer, cookie_jar_founder, forty_percent_survivor, cold_mind, tempered
- [ ] Pricing on upgrade page and landing page shows $12/mo Pro, $29/mo Elite
- [ ] Challenge XP is variable (xp_reward from challenge row), not flat 100
- [ ] Cookie jar title max is 80 chars (not 100)
- [ ] mood_signal values are 'excusing'|'deflecting'|'owning'|'crushing' (not 'steady'/'struggling')
- [ ] Upgrade flow: CTA → checkout → webhook → users.tier updated
- [ ] Weekly report cron endpoint requires CRON_SECRET and processes in batches of 50
- [ ] Mobile: all core flows work at 375px, touch targets ≥44px
- [ ] PostHog events fire on all tracked actions
- [ ] Sentry captures errors with user_id context
- [ ] tsc --noEmit passes with no TypeScript errors
- [ ] Privacy and Terms pages exist

DEPLOY:
Connect repo to Vercel. Set all env vars in Vercel dashboard. Deploy. Verify on production domain. Update NEXT_PUBLIC_APP_URL to production URL.
```

---

## ENVIRONMENT VARIABLES REFERENCE

```
# Firebase (client-side — NEXT_PUBLIC_ prefix required)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server-only — NO NEXT_PUBLIC_ prefix)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Google Gemini AI (server-only — no NEXT_PUBLIC_ prefix)
GEMINI_API_KEY=

# Lemon Squeezy (server-only)
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_WEBHOOK_SECRET=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID=
LEMONSQUEEZY_PRO_ANNUAL_VARIANT_ID=
LEMONSQUEEZY_ELITE_MONTHLY_VARIANT_ID=
LEMONSQUEEZY_ELITE_ANNUAL_VARIANT_ID=

# Resend Email (server-only)
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
| 1 — Foundation | 1–14 | 1.1–1.5 | Auth, DB schema (all 16 tables), tRPC, layout shell |
| 2 — Onboarding | 15–21 | 2.1–2.5 | Gemini client, SSE + classify endpoints, 3-step onboarding |
| 3 — Habit Engine | 22–35 | 3.1–3.2 | Full habit CRUD, streak algorithm, dashboard |
| 4 — Check-In + AI | 36–50 | 4.1–4.2 | Daily check-in, memory extraction + RAG, coach chat |
| 5 — Forge Score | 51–60 | 5.1–5.2 | Exact PRD formula, XP/levels (6 non-linear tiers), 6 PRD badges, 40% Rule |
| 6 — Cookie Jar + Challenges | 61–70 | 6.1–6.2 | Victory archive (80-char limit, 25 XP), challenge library (variable XP) |
| 7 — Billing | 71–77 | 7.1–7.2 | Lemon Squeezy ($12/$29 pricing), upgrade page, settings |
| 8 — Reports | 78–84 | 8.1–8.2 | Analytics charts, weekly email (batches of 50), cron job |
| 9 — Launch Prep | 85–90 | 9.1–9.5 | Error handling, mobile, tracking, landing page, GDPR, deploy |

**Total: 19 prompts across 9 phases.**

---

## KEY PRD CONSTANTS — QUICK REFERENCE

Use these exact values throughout. Never substitute approximations.

| Constant | Correct Value | Common Mistake |
|----------|--------------|----------------|
| Pro pricing | $12/month, $89/year | Wrong: $19/$149 |
| Elite pricing | $29/month, $219/year | Wrong: $39/$299 |
| Cookie jar title limit | 80 chars | Wrong: 100 chars |
| Cookie jar description limit | 500 chars | Wrong: no limit |
| Cookie jar XP | 25 XP | Wrong: 15 XP |
| Check-in min chars (daily) | 50 chars | Wrong: 100 chars |
| Check-in min chars (onboarding mirror) | 100 chars | Correct |
| Forge Score rounding | floor() always | Wrong: Math.round() |
| Streak Consistency weight | 40% (max 400) | Wrong formula: adherence rate |
| Checkin Honesty Depth weight | 20% (max 200) | Wrong: 25%/250 |
| Challenge Completion weight | 20% (max 200) | Wrong: 10%/100 |
| mood_signal values | excusing, deflecting, owning, crushing | Wrong: steady, struggling |
| Badges (6 total) | identity_locked, mirror_gazer, cookie_jar_founder, forty_percent_survivor, cold_mind, tempered | Wrong: first_habit_logged, seven_day_streak, etc. |
| Level 1 name | Raw | Wrong: "Raw Iron" |
| Level 2 name | Tempered | Wrong: "Forged Steel" |
| Level 3 name | Forged | Wrong: "Tempered Blade" |
| Level 2 XP threshold | 500 XP | Wrong: every 500 XP |
| Level 3 XP threshold | 1,500 XP | Wrong: 1,000 XP |
| 40% Rule modal heading | "YOUR MIND IS LYING TO YOU" | Wrong: "40% RULE" |
| Challenge duration field | duration_minutes | Wrong: duration_days |
| Challenge categories | cold, screen, physical, fast, social | Wrong: mental, digital |
| Memory table name | user_memories | Wrong: memories |
| Cookie jar table name | cookie_jar_entries | Wrong: cookie_jar |
| Check-in table field | raw_reflection | Wrong: raw_text |
| Session type for daily check-in | daily_checkin | Wrong: checkin_debrief |
| Cron batch size | 50 users per batch | Wrong: 10 |
| Score animation duration | 500ms | Wrong: 300ms |

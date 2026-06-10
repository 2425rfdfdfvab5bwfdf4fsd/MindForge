# PRD Generator Prompt — MindForge (Filled)
> Paste everything inside the code block below into Claude, ChatGPT, or Gemini to generate the full PRD.

---

```
You are a senior product manager and software architect.
Your job is to generate a complete, professional Product Requirements Document (PRD)
that is crystal-clear for an AI coding agent to implement without ambiguity.

--- USER INPUT ---

Project Name: MindForge

One-line Description: An AI-powered brain rewiring and hard accountability web app that uses neuroscience-backed methods, persistent AI coaching memory, and progressive discomfort challenges to help users break bad habits, build extreme discipline, and consciously forge a new identity.

Target Users:
- Primary: Ambitious professionals, entrepreneurs, and students aged 22–45 who consume self-improvement content (David Goggins, Huberman Lab, Jocko Willink), know what they should do, but can't consistently execute. They are frustrated by "soft" habit apps that don't push back.
- Secondary: People at a turning point — recovering from addiction, burnout, or a major life failure — who need radical accountability and a system that matches the severity of their situation.
- Tertiary (post-MVP): HR leaders and performance coaches who want to build discipline cultures in teams.

Core Problem:
Modern apps designed to help people build habits are philosophically broken — they use gentle encouragement, participation trophies, and gamified streaks that do not match how behavioral change actually works neurologically. The brain physically rewires itself through repeated behavior (neuroplasticity), but 52% of users abandon wellness apps within weeks because:
1. Apps never hold users honestly accountable — they reward effort, not results.
2. No app uses persistent AI memory to build a real coaching relationship over time.
3. No app applies the neuroscience of dopamine regulation, environment design, and identity-based framing to its core product architecture.
4. No app combines the "hard accountability" philosophy (Goggins' Accountability Mirror, 40% Rule, Cookie Jar, Callousing the Mind) with AI personalization.
5. Users have no system to excavate and anchor their deepest "why" — the identity-level purpose that sustains discipline when motivation fails.

Tech Stack Preference:
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Backend: Next.js API Routes + tRPC (type-safe end-to-end APIs)
- Database: Supabase (PostgreSQL + pgvector extension for AI memory embeddings)
- Auth: Supabase Auth (magic link + Google OAuth)
- AI: Google Gemini 2.5 Pro (coaching, debriefs, structured outputs) + Gemini 2.5 Flash (memory extraction, short tasks) + Google text-embedding-004 (vector embeddings for RAG)
- Payments: Lemon Squeezy (Merchant of Record — handles global VAT/tax automatically)
- Email: Resend + React Email (transactional + weekly neural reports)
- Hosting: Vercel (Next.js native, edge functions, cron jobs)
- Analytics: PostHog (open-source, GDPR-friendly, behavior tracking)
- Monitoring: Sentry (error tracking)

Must-Have Features (P0):

1. ONBOARDING FLOW — Three-part onboarding before the main dashboard:
   a) The Accountability Mirror: User writes a raw, honest self-assessment of their current life, biggest failures, and most repeated excuses. No prompts, no mood pickers — a blank text field. AI reads it and reflects back an honest, unfiltered response (not gentle, not harsh — truthful).
   b) Why Excavation: Multi-turn AI conversation using the "5 Whys" method. Guides user from surface motivation ("I want to get fit") to identity-level anchor ("I am the father my children will be proud of"). The final "why" is saved to the user's profile and referenced in all future coaching.
   c) Environment Audit: A structured questionnaire about the user's physical and digital environment (phone habits, workspace, sleep setup, social triggers). AI generates specific, actionable redesign recommendations based on environment design neuroscience.

2. HABIT FORGE TRACKER:
   - Create, edit, archive habits with name, category (health / mind / avoid / perform), type (build or avoid), and target frequency (daily / specific weekdays)
   - Log completions per day using local date (user's timezone — NOT UTC). Two options only: "Completed" or "Missed" — no skip button, no grace option
   - Streak tracking: current streak + longest streak cached in a dedicated habit_streaks table (not recalculated each time)
   - Free tier: max 3 habits. Pro tier: unlimited.

3. DAILY ACCOUNTABILITY MIRROR (Check-In):
   - One check-in per day per user (local date scoped)
   - Full free-text field — user writes what actually happened yesterday, honestly
   - On submission, AI Forge Coach generates a debrief response (streaming, starts within 3 seconds)
   - AI response is honest, direct, and non-sycophantic. It identifies excuses, acknowledges genuine wins, and surfaces one key observation. Never says "great job" unless it is genuinely exceptional.
   - AI response stored alongside raw check-in. Honesty score (1–10) and mood signal ('excusing' / 'deflecting' / 'owning' / 'crushing') extracted and stored for analytics.

4. AI FORGE COACH (Persistent Memory AI):
   - Powered by Gemini 2.5 Pro with three-tier memory: Short-term (active session), session summaries (stored in PostgreSQL), long-term memory (atomic facts stored as embeddings in pgvector)
   - Before every response: embed user's current input, retrieve top-5 most relevant long-term memories via cosine similarity search, inject into system prompt along with: user's why statement, identity declaration, recent streak data, Forge Score, and cookie jar highlights
   - After every session: run Gemini 2.5 Flash memory extraction agent to parse new atomic facts ("User prefers evening workouts", "User has a history of abandoning goals after 3 weeks") and upsert to pgvector
   - Forge Coach persona: honest, direct, knowledgeable in neuroscience, never sycophantic, treats users like capable adults
   - All responses stream in real time (Server-Sent Events)

5. FORGE SCORE:
   - Proprietary composite score (0–1000) reflecting the user's behavioral integrity
   - Formula: streak consistency (40%) + check-in honesty depth (20%) + challenge completion (20%) + cookie jar growth (10%) + environment improvements (10%)
   - Recalculated on every habit completion/miss and every check-in submission
   - Drops visibly when commitments are missed — cannot be gamed or padded
   - Displayed prominently on dashboard

6. COOKIE JAR (Victory Archive):
   - Users log past victories, moments of courage, and evidence of their capability with title, description, and optional date
   - Each entry is embedded via text-embedding-004 and stored in pgvector
   - AI coach retrieves semantically relevant cookie jar entries during coaching sessions and references them explicitly ("In 2022 you survived losing your job and rebuilt from scratch. This is not harder than that.")
   - Free tier: max 5 entries. Pro tier: unlimited.

7. 40% RULE ENGINE:
   - Triggered automatically when a user misses a habit or submits a check-in with a low honesty score / 'deflecting' mood signal
   - AI delivers a specific 40% Rule intervention (streaming): "Your mind is calling stop. That's the 40% signal. What is one more step you can take right now?"
   - User can manually activate 40% Rule mode from any screen

8. CALLOUSING CHALLENGES:
   - Library of 20 pre-seeded discomfort challenges across categories: cold (cold shower), screen (screen-free hours), physical (push-up until failure), fast (intermittent fast), social (have a hard conversation)
   - Each challenge has: title, description, difficulty (1–5), duration in minutes, XP reward
   - User activates a challenge, completes it, writes a reflection, earns XP + badge eligibility
   - Free tier: 5 challenges. Pro tier: full library.

9. GAMIFICATION SYSTEM:
   - XP earned for: habit completion, daily check-in, challenge completion, cookie jar entry, environment improvements
   - Levels: Raw (0) → Tempered (500 XP) → Forged (1500 XP) → Hardened (3500 XP) → Unbreakable (7500 XP) → Legendary (15000 XP)
   - Badges (earned, not purchasable): "40% Survivor", "Mirror Gazer" (30-day check-in streak), "Cookie Jar Founder" (10 victories), "Cold Mind" (7 cold challenges), "Identity Locked" (Why Excavation complete)
   - No participation trophies — all achievements require real completion

10. LEMON SQUEEZY BILLING:
    - Free tier: 3 habits, 5 cookie jar entries, 5 challenges, no AI debrief, basic Forge Score
    - Pro tier ($12/month or $89/year): everything unlimited, full AI coach with memory, all challenges, accountability pods, weekly neural report
    - Elite tier ($29/month or $219/year): everything in Pro + unlimited direct AI chat + weekly group coaching sessions + early access
    - Webhook handler syncs subscription status to database within 30 seconds
    - Feature gating enforced via middleware on every protected route

11. WEEKLY NEURAL REPORT:
    - Generated every Sunday via Vercel cron job
    - Gemini 2.5 Pro generates a personalized structured report: Forge Score trajectory, habit completion rate, streak patterns, behavioral arc summary, one key insight, one challenge for next week
    - Delivered via Resend email + in-app notification

Nice-to-Have Features (P1/P2):

- Accountability Pods: Groups of 3–7 users matched by Forge Score range. Daily check-in status visible to pod (done/not done — no details). Pod members can send "Push" messages. Implemented in Month 4 post-launch.
- Brain Map Visualization: Visual representation of the user's neural pathways being forged over time based on habit completion data. Motivational metaphor, not clinical. Month 5 post-launch.
- Environment Audit Tool (interactive): Step-by-step guided environment redesign with progress tracking. Post-MVP.
- Identity Declaration System: Formal "I am someone who..." declarations stored on profile, referenced in all coaching.
- Dopamine Detox Mode: Structured 24–72 hour low-stimulation protocol guided by AI. P2.
- Forge Teams (B2B): Team dashboard, manager view, SSO, bulk billing. Month 6 post-launch.

Design Style:
- Dark mode by default (no light mode toggle in v1)
- Aesthetic: brutal minimalism — think forge, steel, fire. Dark backgrounds (#0A0A0A, #111111), high-contrast white text, accent color: molten orange (#FF6B2B) for CTAs and active states, steel blue (#3B82F6) for secondary elements
- Typography: Inter (body), Cal Sans or Geist (headings) — clean and sharp
- Component Library: shadcn/ui (customized to match the dark forge aesthetic)
- No rounded corners on primary elements — sharp, angular cards and buttons to reinforce the "hard" brand identity
- Mobile-first responsive — primary check-in flow must work perfectly on mobile browser (no native app in v1)
- Micro-animations on habit completion (forge spark effect), Forge Score updates, and level-ups — dopamine feedback loop is neurologically intentional
- No emojis in AI coach responses. The coach is serious.

--- END INPUT ---

Generate the PRD using EXACTLY this structure:

---

# PRD: [Project Name]
**Version:** 1.0
**Date:** [Today's Date]
**Status:** Ready for Development

---

## 1. EXECUTIVE SUMMARY
Write 2–3 sentences: what the product is, who it's for, and what core problem it solves.

---

## 2. PROBLEM STATEMENT
### 2.1 Current Pain Points
- Bullet list of 3–5 specific problems users face today

### 2.2 Proposed Solution
One paragraph describing how this product solves those problems.

---

## 3. GOALS & SUCCESS METRICS
### 3.1 Primary Goals
- [ ] Goal 1 (measurable)
- [ ] Goal 2 (measurable)
- [ ] Goal 3 (measurable)

### 3.2 Success Metrics (KPIs)
| Metric | Target | How to Measure |
|--------|--------|----------------|
| [metric] | [value] | [method] |

---

## 4. TARGET USERS
### 4.1 Primary User Persona
- **Name:** [Persona name]
- **Role:** [Who they are]
- **Goals:** [What they want to achieve]
- **Frustrations:** [What currently blocks them]
- **Tech Level:** [Beginner / Intermediate / Advanced]

### 4.2 Secondary User (if any)
[Brief description or "None"]

---

## 5. TECH STACK & ARCHITECTURE
### 5.1 Recommended Stack
| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | [tech] | [why] |
| Backend | [tech] | [why] |
| Database | [tech] | [why] |
| Auth | [tech] | [why] |
| Hosting | [tech] | [why] |

### 5.2 Project Structure
Provide the folder/file structure the coding agent should create:
\```
project-root/
├── src/
│   ├── components/
│   ├── pages/
│   ├── lib/
│   └── ...
├── api/ or server/
├── public/
└── ...
\```

### 5.3 Key Environment Variables Needed
\```
VARIABLE_NAME=description_of_what_it_is
\```

---

## 6. FEATURES & REQUIREMENTS
For EVERY feature, use this exact format:

### Feature [N]: [Feature Name]
- **Priority:** P0 (must-have) / P1 (important) / P2 (nice-to-have)
- **User Story:** As a [user], I want to [action] so that [benefit]
- **Acceptance Criteria:**
  - [ ] Criterion 1 (specific, testable)
  - [ ] Criterion 2 (specific, testable)
  - [ ] Criterion 3 (specific, testable)
- **UI Notes:** Describe exactly what the user sees and interacts with
- **API/Logic Notes:** Describe data flow, validations, edge cases
- **Dependencies:** List any features or services this depends on

[Repeat for every feature — P0 first, then P1, then P2]

---

## 7. DATA MODELS
For each entity, define the schema clearly:

### [Entity Name]
\```typescript
interface EntityName {
  id: string;           // auto-generated UUID
  field1: string;       // description
  field2: number;       // description
  field3: boolean;      // description
  createdAt: Date;      // timestamp
}
\```

---

## 8. API ENDPOINTS
List every API route the backend needs:

| Method | Endpoint | Auth Required | Request Body | Response | Description |
|--------|----------|---------------|--------------|----------|-------------|
| GET | /api/items | No | — | Item[] | Fetch all items |
| POST | /api/items | Yes | {name, type} | Item | Create item |
| PUT | /api/items/:id | Yes | {name} | Item | Update item |
| DELETE | /api/items/:id | Yes | — | {success} | Delete item |

---

## 9. PAGES & ROUTES
List every page/screen in the app:

| Route | Page Name | Auth Required | Description |
|-------|-----------|---------------|-------------|
| / | Home | No | Landing page |
| /dashboard | Dashboard | Yes | Main app view |
| /settings | Settings | Yes | User settings |

---

## 10. UI/UX REQUIREMENTS
### 10.1 Design Principles
- [Principle 1: e.g., "Mobile-first responsive design"]
- [Principle 2: e.g., "Dark mode support"]
- [Principle 3: e.g., "Accessible — WCAG AA compliant"]

### 10.2 Color & Theme
- Primary Color: [hex or description]
- Background: [hex or description]
- Typography: [font family]
- Component Library: [e.g., shadcn/ui, Material UI, custom]

### 10.3 Key UI Flows
Describe the 2–3 most critical user journeys step by step:

**Flow 1: [Name]**
1. User lands on [page]
2. User clicks [button/link]
3. System shows [UI element]
4. User inputs [data]
5. System responds with [result]

---

## 11. AUTHENTICATION & AUTHORIZATION
- **Auth Method:** [e.g., Email/Password, Google OAuth, JWT]
- **Roles:**
  | Role | Permissions |
  |------|-------------|
  | Admin | Full access |
  | User | [specific access] |
  | Guest | [specific access] |

---

## 12. ERROR HANDLING & EDGE CASES
List critical edge cases the coding agent must handle:
- [ ] What happens when a user submits an empty form?
- [ ] What happens when the API is unavailable?
- [ ] What happens when a user tries to access a resource they don't own?
- [ ] What happens when a file upload exceeds the size limit?
- [Add more specific to the app]

---

## 13. PERFORMANCE & SECURITY REQUIREMENTS
- [ ] Page load under 2 seconds on 4G
- [ ] All user inputs sanitized before database writes
- [ ] Passwords hashed (never stored plain)
- [ ] API rate limiting on public endpoints
- [ ] No sensitive data exposed in client-side code
- [ ] HTTPS enforced in production

---

## 14. OUT OF SCOPE (v1.0)
Explicitly list what is NOT being built to prevent scope creep:
- [Feature A] — deferred to v2
- [Feature B] — not in initial release
- [Integration C] — future consideration

---

## 15. IMPLEMENTATION ORDER
Provide the exact order the coding agent should build this:

**Phase 1: Foundation**
1. Project setup & folder structure
2. Database schema & models
3. Auth system

**Phase 2: Core Features**
4. [Feature name] (P0)
5. [Feature name] (P0)
6. [Feature name] (P0)

**Phase 3: Secondary Features**
7. [Feature name] (P1)
8. [Feature name] (P1)

**Phase 4: Polish**
9. Error handling & loading states
10. Mobile responsiveness
11. Performance optimization

---

## 16. OPEN QUESTIONS
List any decisions still needed before/during development:
- [ ] Should [X] support [Y]?
- [ ] What is the limit for [Z]?

---

**END OF PRD**

---

RULES FOR GENERATING THIS PRD:
1. Be SPECIFIC — no vague language like "user-friendly" or "fast". Give exact specs.
2. Every feature must have acceptance criteria that are testable.
3. Every API endpoint must have its request/response types defined.
4. Every data model must have all fields typed.
5. The implementation order must be logical — no feature should depend on something built later.
6. Flag any assumption you make with a note: ⚠️ ASSUMPTION: [what you assumed]
7. If the user's input is missing critical info, state: ❓ NEEDS CLARIFICATION: [what's missing]
```

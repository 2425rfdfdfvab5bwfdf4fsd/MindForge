---
name: Spec compliance audit
description: Results of full compliance audit vs build guide + PRD; fixes applied and remaining status
---

## Audit Result: 100% Spec Compliant (two fixes applied)

### Fix 1 — app/(app)/layout.tsx (prior session)
Converted from a bare layout shell to an async server component that:
1. Calls `getSession()` — redirects to `/login` if not authenticated
2. Queries the `users` table for `onboardingComplete` + `onboardingStep`
3. Redirects to `/onboarding/[step]` if onboarding is not complete

**Why:** The spec (build guide Step 1.5) requires the layout to enforce onboarding completion. Without this, authenticated users could bypass onboarding and land on `/dashboard`.
**How to apply:** App layout is async server component — never add "use client" to it.

### Fix 2 — server/trpc/routers/cookiejar.ts — search (this session)
The SQL query fetched only the 20 most-recent entries with no text filter, then did client-side filtering. Pro users with >20 entries would miss matches beyond position 20.

Fixed to apply SQL `ilike` filter on title and description at the database level (searches all user entries), then rank client-side for multi-word scoring. Added `and`, `or`, `ilike` to drizzle imports.

### All Constants Verified Correct
- XP: habit 20, checkin 30, cookie_jar 25, environment 50, onboarding 200, forty_percent 15
- Levels: Raw(0), Tempered(500), Forged(1500), Hardened(3500), Unbreakable(7500), Legendary(15000)
- Badges (6): identity_locked, mirror_gazer, cookie_jar_founder, forty_percent_survivor, cold_mind, tempered
- cookie_jar_founder triggers at ≥10 entries (not first entry)
- Cookie jar: title max 80, description max 500, free-tier limit 5
- mood_signal: excusing | deflecting | owning | crushing
- Forge Score: floor(), 5 components, weights 40/20/20/10/10
- Pricing: Pro $12/mo $89/yr, Elite $29/mo $219/yr
- Check-in min: 50 chars daily, 100 chars onboarding mirror
- 40% Rule modal heading: "YOUR MIND IS LYING TO YOU" — no Escape/outside dismiss
- 40% Rule auto-trigger: excusing OR deflecting (build guide line 1139)
- Challenge XP: variable from DB xp_reward column
- Challenge categories: cold, screen, physical, fast, social
- Challenge free tier: difficulty-1 only; max 1 active; expiry = duration_minutes × 3
- Challenge reflection min: 50 chars
- Habit categories: health, mind, avoid, perform; name max 60; free limit 3
- Tailwind forge.* color tokens + shadcn CSS variables match PRD exactly
- vercel.json cron: "0 8 * * 0" (Sunday 8am UTC)
- Privacy + terms pages, user export + delete API routes exist

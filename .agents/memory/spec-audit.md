---
name: Spec compliance audit
description: Results of full compliance audit vs build guide + PRD; fix applied and remaining status
---

## Audit Result: Nearly 100% Spec Compliant

### Fix Applied
`app/(app)/layout.tsx` was converted from a bare layout shell to a server component that:
1. Calls `getSession()` — redirects to `/login` if not authenticated
2. Queries the `users` table for `onboardingComplete` + `onboardingStep`
3. Redirects to `/onboarding/[step]` if onboarding is not complete

**Why:** The spec (build guide Step 1.5) requires middleware/layout to enforce onboarding completion. Without this, authenticated users could bypass onboarding and land on `/dashboard`.

**How to apply:** The app layout is async server component — never add "use client" to it. Child components (Sidebar, Header, MobileNav) remain client components.

### All Other Constants Verified Correct
- XP: habit 20, checkin 30, cookie_jar 25, environment 50, onboarding 200
- Levels: Raw(0), Tempered(500), Forged(1500), Hardened(3500), Unbreakable(7500), Legendary(15000)
- Badges (6): identity_locked, mirror_gazer, cookie_jar_founder, forty_percent_survivor, cold_mind, tempered
- Cookie jar: title max 80, description max 500
- mood_signal: excusing | deflecting | owning | crushing
- Forge Score: floor(), 5 components, weights 40/20/20/10/10
- Pricing: Pro $12/mo $89/yr, Elite $29/mo $219/yr
- Check-in min: 50 chars daily, 100 chars onboarding mirror
- 40% Rule modal heading: "YOUR MIND IS LYING TO YOU" — no Escape/outside dismiss
- Challenge XP: variable from DB xp_reward column
- Challenge categories: cold, screen, physical, fast, social
- 200 XP awarded in completeOnboarding (Step 3 end), not Step 2
- vercel.json cron: "0 8 * * 0" (Sunday 8am UTC)
- Privacy + terms pages exist
- User export + delete API routes exist

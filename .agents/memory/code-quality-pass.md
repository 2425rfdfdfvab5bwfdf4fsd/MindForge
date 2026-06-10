---
name: Code quality pass
description: Decisions made during the full DRY/magic-number/dead-code refactor — patterns to keep consistent going forward.
---

## Rules established

### XP amounts — always use XP_AMOUNTS
All `awardXP` calls must use `XP_AMOUNTS.<key>` (from `lib/gamification/xp.ts`), never raw integers.
Hardcoded values that were replaced: 20 (habit_complete), 30 (checkin), 20 (checkin_bonus), 50 (environment), 200 (onboarding).

### BADGE_KEYS — single source of truth
`BADGE_KEYS` and `BadgeKey` are owned by `lib/gamification/badges.ts`. Routers must import from there; never redeclare locally.

### CHALLENGE_DEADLINE_FACTOR = 3
The challenge deadline window is 3× the challenge's rated `durationMinutes`. This constant is defined locally in:
- `server/trpc/routers/challenges.ts`
- `app/(app)/dashboard/page.tsx`
Both files carry a comment pointing to the other. If the factor changes, update both.

### Level label display — use getLevelName
`ForgeScore.tsx` and any client component needing a level label must call `getLevelName(level)` from `lib/gamification/level.ts` (client-safe). The local `LEVEL_LABELS` dict + `getLevelLabel` function was deleted from `ForgeScore.tsx`.

### getCurrentUser is deleted
`lib/auth.ts` no longer exports `getCurrentUser`. It was a pointless alias for `getSession()`. Use `getSession()` directly.

### Gemini errors must be logged
Silent `catch {}` on the Gemini call in `user.ts` → `submitEnvironmentAudit` now logs via `console.error`. Fire-and-forget badge checks (e.g. `.catch(() => {})`) remain intentionally silent.

### Named interfaces over verbose inline types
`ActiveUserChallenge` interface in `challenges.ts` replaced the 80-char inline type annotation for `userChals`.

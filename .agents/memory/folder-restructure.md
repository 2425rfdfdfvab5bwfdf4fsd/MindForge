---
name: Folder restructure
description: Canonical paths after the June 2026 professional restructure — where hooks, providers, and gamification utilities now live.
---

## Moved paths (old → new)

| Old | New |
|-----|-----|
| `lib/hooks/useStreamingResponse.ts` | `hooks/useStreamingResponse.ts` |
| `components/PostHogProvider.tsx` | `components/providers/PostHogProvider.tsx` |
| `lib/badges.ts` | `lib/gamification/badges.ts` |
| `lib/forge-score.ts` | `lib/gamification/forge-score.ts` |
| `lib/level.ts` | `lib/gamification/level.ts` |
| `lib/streak.ts` | `lib/gamification/streak.ts` |
| `lib/xp.ts` | `lib/gamification/xp.ts` |

## Deleted (dead code / scaffolding)

- `server/replit_integrations/` — Replit-generated stub, never used by the app
- `server/trpc/routers/pods.ts` — empty deferred stub (pods feature is Month 4+)

## Barrel export

`lib/gamification/index.ts` exports all gamification symbols. Routers and API routes import from specific subpaths (e.g. `@/lib/gamification/xp`), not the barrel, to keep server-only boundaries explicit.

## Key constraint

`lib/gamification/level.ts` has NO server-only imports — safe for Client Components.
`lib/gamification/xp.ts`, `forge-score.ts`, `badges.ts`, `streak.ts` all use `adminDb` or `server-only` — never import these in Client Components.

**Why:** `getLevelFromXP` is used in XPBar.tsx (client) and dashboard/page.tsx (server). Keeping level.ts free of server-only lets both import it safely.

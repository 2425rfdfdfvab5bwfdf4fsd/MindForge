---
name: Firebase migration
description: Firebase Auth + Firestore replaces JWT/Replit Auth + PostgreSQL/Drizzle; critical constraints for future work
---

# Firebase Auth + Firestore Migration

## Rules

1. `firebase-admin` MUST be listed in `next.config.mjs` under `serverComponentsExternalPackages` to prevent webpack from bundling it for the client.
2. Both `lib/firebase/admin.ts` and `lib/auth.ts` MUST import `"server-only"` at the top — prevents accidental client bundle inclusion.
3. `middleware.ts` must NEVER import from `lib/auth.ts` or `firebase-admin` — it runs in the Edge runtime and cannot use Node.js APIs. Cookie presence check only; actual session verification happens in tRPC context and route handlers.
4. The `firebase` client SDK (package: `firebase`) and `firebase-admin` are both in `node_modules` and listed in `package.json`. The client SDK is used by the login page; the admin SDK by all server code.
5. Session cookie name: `mf_session`, set via `/api/auth/session` POST after client gets a Firebase ID token.

**Why:** firebase-admin uses `node:` protocol imports (crypto, fs, etc.) that webpack refuses to bundle — must be excluded from the client bundle. Middleware runs on Edge which has no Node.js runtime at all.

## Firestore Collections
- `users/{uid}` — main user document
- `users/{uid}/badges` — subcollection for badges
- `habits`, `habit_completions`, `habit_streaks`, `daily_checkins`, `coaching_sessions`, `user_memories`, `cookie_jar_entries`, `challenges`, `user_challenges`, `xp_events`, `rule_forty_events`, `forge_score_history`, `weekly_reports`, `environment_audit_items`, `subscriptions`

## Legacy Files (Do Not Delete — May Break Type Checking)
- `server/db.ts`, `shared/schema.ts`, `server/replit_integrations/` — no longer imported by active app code; excluded from tsconfig
